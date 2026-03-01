-- Online game sessions
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing','finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- update timestamp trigger
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- policies
CREATE POLICY "Games viewable by room members"
  ON public.games FOR SELECT TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Room members can insert games"
  ON public.games FOR INSERT TO authenticated
  WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "Room members can update games"
  ON public.games FOR UPDATE TO authenticated
  USING (public.is_room_member(room_id));
