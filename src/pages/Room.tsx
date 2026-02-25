import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PLAYER_COLORS: Record<string, string> = {
  red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835',
};

interface Member {
  id: string;
  profile_id: string;
  player_color: string;
  profiles: { username: string; avatar_url: string | null };
}

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav('/auth'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!profile) { nav('/auth'); return; }
      setMyProfileId(profile.id);

      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();
      if (!roomData) { toast.error('Room not found'); nav('/lobby'); return; }
      setRoom(roomData);

      await fetchMembers(roomData.id);
      setLoading(false);
    };
    init();
  }, [code, nav]);

  const fetchMembers = async (roomId: string) => {
    const { data } = await supabase
      .from('room_members')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', roomId);
    if (data) setMembers(data as any);
  };

  // Realtime subscription for members joining/leaving
  useEffect(() => {
    if (!room) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        fetchMembers(room.id);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        setRoom(payload.new);
        if ((payload.new as any).status === 'playing') {
          toast.success('Game starting!');
          // In a full implementation, this would transition to the game
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  const copyCode = () => {
    navigator.clipboard.writeText(code || '');
    toast.success('Room code copied!');
  };

  const leaveRoom = async () => {
    if (!room || !myProfileId) return;
    await supabase
      .from('room_members')
      .delete()
      .eq('room_id', room.id)
      .eq('profile_id', myProfileId);
    nav('/lobby');
  };

  const isCreator = room?.created_by === myProfileId;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1A237E 100%)' }}>
      <span className="text-white/50">Loading room...</span>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 40%, #1A237E 100%)' }}
    >
      <div className="w-full max-w-md">
        <button onClick={leaveRoom} className="text-white/50 hover:text-white text-xs mb-4">← Leave Room</button>

        {/* Room info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl mb-4 text-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <h2 className="text-white font-black text-lg mb-1">{room?.name}</h2>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <span className="text-white font-mono tracking-[0.3em] text-xl font-bold">{code}</span>
            <span className="text-white/40 text-xs">📋</span>
          </button>
          <p className="text-white/40 text-xs mt-2">Share this code with friends</p>
        </motion.div>

        {/* Players */}
        <div className="space-y-2 mb-6">
          <p className="text-white/60 text-xs font-semibold">
            Players ({members.length}/{room?.max_players || 4})
          </p>
          {Array.from({ length: room?.max_players || 4 }).map((_, i) => {
            const member = members[i];
            const color = member?.player_color || ['red', 'green', 'blue', 'yellow'][i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: member ? `${PLAYER_COLORS[color]}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${member ? PLAYER_COLORS[color] + '40' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{
                    background: member
                      ? `linear-gradient(135deg, ${PLAYER_COLORS[color]}, ${PLAYER_COLORS[color]}99)`
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  {member ? (member.profiles as any)?.username?.[0]?.toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${member ? 'text-white' : 'text-white/30'}`}>
                    {member ? (member.profiles as any)?.username : 'Waiting...'}
                  </p>
                  <p className="text-xs capitalize" style={{ color: PLAYER_COLORS[color] + '99' }}>
                    {color}
                  </p>
                </div>
                {member?.profile_id === myProfileId && (
                  <span className="text-white/40 text-xs">You</span>
                )}
                {member?.profile_id === room?.created_by && (
                  <span className="text-yellow-400 text-xs">👑</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Start game (creator only) */}
        {isCreator && members.length >= 2 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => toast.info('Online game sync coming soon! Play locally for now.')}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #43A047, #66BB6A)' }}
          >
            🎮 Start Game ({members.length} players)
          </motion.button>
        )}

        {!isCreator && (
          <p className="text-center text-white/40 text-xs">Waiting for the host to start...</p>
        )}
      </div>
    </div>
  );
};

export default Room;
