
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  token_skin TEXT NOT NULL DEFAULT 'pawn',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Player stats
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Ludo Room',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INT NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room members
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  player_color TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, profile_id)
);

-- Friendships
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Enable realtime for rooms and room_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- Helper function: get current user's profile id
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Helper: check if user is room member
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = _room_id
    AND profile_id = public.get_my_profile_id()
  )
$$;

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
  profile_id UUID;
BEGIN
  new_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    'Player_' || substr(NEW.id::text, 1, 8)
  );
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, new_username)
  RETURNING id INTO profile_id;
  
  INSERT INTO public.player_stats (profile_id) VALUES (profile_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: anyone authenticated can read all profiles (for search/friends)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Player stats: readable by all authenticated, updatable by self
CREATE POLICY "Stats are viewable by authenticated users"
  ON public.player_stats FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own stats"
  ON public.player_stats FOR UPDATE TO authenticated
  USING (profile_id = public.get_my_profile_id());

-- Rooms: readable by members or if status is 'waiting' (joinable)
CREATE POLICY "Rooms viewable if waiting or member"
  ON public.rooms FOR SELECT TO authenticated
  USING (status = 'waiting' OR public.is_room_member(id));

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (created_by = public.get_my_profile_id());

CREATE POLICY "Room creator can update"
  ON public.rooms FOR UPDATE TO authenticated
  USING (created_by = public.get_my_profile_id());

CREATE POLICY "Room creator can delete"
  ON public.rooms FOR DELETE TO authenticated
  USING (created_by = public.get_my_profile_id());

-- Room members
CREATE POLICY "Room members viewable by members"
  ON public.room_members FOR SELECT TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Users can join rooms"
  ON public.room_members FOR INSERT TO authenticated
  WITH CHECK (profile_id = public.get_my_profile_id());

CREATE POLICY "Users can leave rooms"
  ON public.room_members FOR DELETE TO authenticated
  USING (profile_id = public.get_my_profile_id());

-- Friendships
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT TO authenticated
  USING (
    user_id = public.get_my_profile_id()
    OR friend_id = public.get_my_profile_id()
  );

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "Users can update friendships they received"
  ON public.friendships FOR UPDATE TO authenticated
  USING (friend_id = public.get_my_profile_id());

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE TO authenticated
  USING (
    user_id = public.get_my_profile_id()
    OR friend_id = public.get_my_profile_id()
  );

-- Generate room code function
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
