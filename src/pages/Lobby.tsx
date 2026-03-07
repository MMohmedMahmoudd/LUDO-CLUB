import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  token_skin: string;
}

interface Room {
  id: string;
  code: string;
  name: string;
  status: string;
  max_players: number;
  created_by: string;
}

const COLORS = ['red', 'green', 'blue', 'yellow'];

const Lobby = () => {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav('/auth'); return; }
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [nav]);

  const createRoom = async () => {
    if (!profile) return;
    setCreatingRoom(true);
    try {
      // Generate a unique code
      let code = '';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

      const { data: room, error } = await supabase
        .from('rooms')
        .insert({ created_by: profile.id, code, name: `${profile.username}'s Room` })
        .select()
        .single();
      
      if (error) throw error;

      // Join as first member with red color
      await supabase
        .from('room_members')
        .insert({ room_id: room.id, profile_id: profile.id, player_color: 'red' });

      nav(`/room/${room.code}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = async () => {
    if (!profile || !roomCode.trim()) return;
    try {
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase().trim())
        .eq('status', 'waiting')
        .single();

      if (error || !room) { toast.error('Room not found or already started'); return; }

      // Fetch members separately to avoid RLS issues with embedded queries
      const { data: members } = await supabase
        .from('room_members')
        .select('profile_id, player_color')
        .eq('room_id', room.id);

      const memberList = members || [];
      if (memberList.length >= room.max_players) { toast.error('Room is full'); return; }
      if (memberList.some(m => m.profile_id === profile.id)) {
        nav(`/room/${room.code}`);
        return;
      }

      const usedColors = memberList.map(m => m.player_color);
      const availableColor = COLORS.find(c => !usedColors.includes(c)) || 'green';

      await supabase
        .from('room_members')
        .insert({ room_id: room.id, profile_id: profile.id, player_color: availableColor });

      nav(`/room/${room.code}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1A237E 100%)' }}>
      <span className="text-white/50">Loading...</span>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 40%, #1A237E 100%)' }}
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-6">
        <button onClick={() => nav('/')} className="text-white/50 hover:text-white text-xs">← Menu</button>
        <button onClick={handleSignOut} className="text-white/50 hover:text-white text-xs">Sign Out</button>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-4 rounded-2xl mb-6"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-white font-bold">{profile?.username}</h2>
            <p className="text-white/40 text-xs">Online</p>
          </div>
        </div>
      </motion.div>

      <h2 className="text-white font-black text-xl mb-4">🎲 Online Play</h2>

      {/* Create room */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={createRoom}
        disabled={creatingRoom}
        className="w-full max-w-md py-4 rounded-2xl font-bold text-white text-sm mb-3 transition-all"
        style={{
          background: 'linear-gradient(135deg, #E53935, #FF7043)',
          opacity: creatingRoom ? 0.6 : 1,
        }}
      >
        {creatingRoom ? 'Creating...' : '🏠 Create Room'}
      </motion.button>

      {/* Join room */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <p className="text-white/60 text-xs mb-2 font-semibold">Join with Room Code</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={6}
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/20 focus:border-white/50 outline-none text-sm tracking-widest text-center font-mono"
          />
          <button
            onClick={joinRoom}
            disabled={roomCode.length < 6}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all"
            style={{
              background: roomCode.length >= 6 ? '#43A047' : 'rgba(255,255,255,0.1)',
              opacity: roomCode.length >= 6 ? 1 : 0.5,
            }}
          >
            Join
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Lobby;
