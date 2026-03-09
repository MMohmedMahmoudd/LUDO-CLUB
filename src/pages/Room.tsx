import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createInitialState } from '@/lib/game-engine';
import type { PlayerColor, PlayerProfile, GameState, TokenShape } from '@/lib/types';
import { renderTokenShape } from '@/components/game/TokenShape';
import { ALL_TOKEN_SHAPES, TOKEN_SHAPE_LABELS } from '@/lib/token-shapes';
import VoiceChat from '@/components/game/VoiceChat';

const PLAYER_COLORS: Record<string, string> = {
  red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835',
};
const ALL_COLORS: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
const COLOR_LABELS: Record<string, string> = {
  red: 'Red', green: 'Green', blue: 'Blue', yellow: 'Yellow',
};

interface Member {
  id: string;
  profile_id: string;
  player_color: string;
  profiles: { username: string; avatar_url: string | null; token_skin: string };
}

const Room = () => {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      .select('*, profiles(username, avatar_url, token_skin)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });
    if (!data) return;

    // Resolve color conflicts: first member keeps their color, later ones get reassigned
    const allColors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    const usedColors = new Set<string>();
    for (const m of data) {
      if (m.player_color && !usedColors.has(m.player_color)) {
        usedColors.add(m.player_color);
      } else {
        // Conflict or null — assign next available color
        const available = allColors.find(c => !usedColors.has(c));
        if (available) {
          usedColors.add(available);
          m.player_color = available;
          // Update in DB (fire-and-forget)
          supabase
            .from('room_members')
            .update({ player_color: available })
            .eq('id', m.id)
            .then();
        }
      }
    }
    setMembers(data as unknown as Member[]);
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
          // other players should navigate once they know game id via the games insert event
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'games',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        const gid = (payload.new as any).id;
        nav(`/game?room=${room.code}&game=${gid}`);
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

  const changeTokenShape = async (shape: TokenShape) => {
    if (!myProfileId || !room) return;
    await supabase
      .from('profiles')
      .update({ token_skin: shape })
      .eq('id', myProfileId);
    // Touch room_member to trigger realtime for other players
    if (myMember) {
      await supabase
        .from('room_members')
        .update({ joined_at: new Date().toISOString() })
        .eq('id', myMember.id);
    }
    setShowShapePicker(false);
    fetchMembers(room.id);
  };

  const changeColor = async (newColor: PlayerColor) => {
    if (!myProfileId || !room) return;
    const myMem = members.find(m => m.profile_id === myProfileId);
    if (!myMem) return;
    // Check if the color is taken by another player
    const taken = members.find(m => m.player_color === newColor && m.profile_id !== myProfileId);
    if (taken) {
      // Swap colors with the other player
      await supabase
        .from('room_members')
        .update({ player_color: myMem.player_color })
        .eq('id', taken.id);
    }
    await supabase
      .from('room_members')
      .update({ player_color: newColor })
      .eq('id', myMem.id);
    setShowColorPicker(false);
    fetchMembers(room.id);
  };

  const myMember = members.find(m => m.profile_id === myProfileId);
  const myTokenSkin = myMember?.profiles?.token_skin || 'circle';

  const isCreator = room?.created_by === myProfileId;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1A237E 100%)' }}>
      <span className="text-white/50">Loading room...</span>
    </div>
  );

  // helper: build initial GameState from members
  const buildInitialState = (): GameState | null => {
    if (!room || members.length === 0) return null;
    const colors: PlayerColor[] = [];
    const profiles: PlayerProfile[] = [];
    const order: PlayerColor[] = ['red','green','blue','yellow'];
    order.forEach(col => {
      const m = members.find(m => m.player_color === col);
      if (m && m.profiles) {
        colors.push(col);
        profiles.push({
          id: m.profile_id,
          username: (m.profiles as any).username,
          avatar_url: (m.profiles as any).avatar_url,
          tokenShape: (m.profiles as any).token_skin as any || 'circle',
        });
      }
    });
    const state = createInitialState(colors, []);
    state.players.forEach((p, i) => {
      p.profile = profiles[i];
      p.name = profiles[i].username;
    });
    return state;
  };

  const handleStart = async () => {
    if (!room) return;
    try {
      const initial = buildInitialState();
      if (!initial) return;
      const { data: game, error } = await supabase
        .from('games')
        // cast state to any/Json so TS is happy
        .insert({ room_id: room.id, state: initial as any })
        .select()
        .single();
      if (error) throw error;
      // mark room as playing
      await supabase
        .from('rooms')
        .update({ status: 'playing' })
        .eq('id', room.id);
      nav(`/game?room=${room.code}&game=${game.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 40%, #1A237E 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button onClick={leaveRoom} className="text-white/50 hover:text-white text-xs">← Leave Room</button>
          <VoiceChat roomId={room?.id || null} myProfileId={myProfileId} />
        </div>

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
          {(['red', 'green', 'blue', 'yellow'] as PlayerColor[]).slice(0, room?.max_players || 4).map((color, i) => {
            const member = members.find(m => m.player_color === color);
            return (
              <motion.div
                key={color}
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
                    {member && (
                      <span className="inline-block ml-1 align-middle w-4 h-4">
                        {renderTokenShape((member.profiles as any).token_skin || 'circle', color, '16')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs capitalize" style={{ color: PLAYER_COLORS[color] + '99' }}>
                    {color}
                  </p>
                </div>
                {member?.profile_id === myProfileId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setShowColorPicker(!showColorPicker); setShowShapePicker(false); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Change color"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PLAYER_COLORS[color] }} />
                      <span className="text-white/40 text-[10px]">Color</span>
                    </button>
                    <button
                      onClick={() => { setShowShapePicker(!showShapePicker); setShowColorPicker(false); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="Change shape"
                    >
                      <span className="w-5 h-5">{renderTokenShape(myTokenSkin, color, '20')}</span>
                      <span className="text-white/40 text-[10px]">Shape</span>
                    </button>
                  </div>
                )}
                {member?.profile_id === room?.created_by && (
                  <span className="text-yellow-400 text-xs">👑</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Color picker */}
        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <p className="text-white/60 text-xs font-semibold mb-3">Choose your color</p>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_COLORS.map(c => {
                    const isMyColor = myMember?.player_color === c;
                    const takenBy = members.find(m => m.player_color === c && m.profile_id !== myProfileId);
                    return (
                      <button
                        key={c}
                        onClick={() => changeColor(c)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                        style={{
                          background: isMyColor ? `${PLAYER_COLORS[c]}30` : 'rgba(255,255,255,0.05)',
                          border: isMyColor ? `2px solid ${PLAYER_COLORS[c]}` : '2px solid transparent',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: PLAYER_COLORS[c] }}
                        />
                        <span className="text-white/80 text-[10px] font-semibold">{COLOR_LABELS[c]}</span>
                        {takenBy && (
                          <span className="text-white/30 text-[9px]">
                            {(takenBy.profiles as any)?.username?.[0]?.toUpperCase() || '?'} (swap)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token shape picker */}
        <AnimatePresence>
          {showShapePicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <p className="text-white/60 text-xs font-semibold mb-3">Choose your token shape</p>
                <div className="grid grid-cols-4 gap-2">
                  {ALL_TOKEN_SHAPES.map(shape => {
                    const isSelected = myTokenSkin === shape;
                    const myColor = myMember?.player_color || 'red';
                    return (
                      <button
                        key={shape}
                        onClick={() => changeTokenShape(shape)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                        style={{
                          background: isSelected ? `${PLAYER_COLORS[myColor]}30` : 'rgba(255,255,255,0.05)',
                          border: isSelected ? `2px solid ${PLAYER_COLORS[myColor]}` : '2px solid transparent',
                        }}
                      >
                        <span className="w-8 h-8">{renderTokenShape(shape, myColor as PlayerColor, '32')}</span>
                        <span className="text-white/60 text-[10px]">{TOKEN_SHAPE_LABELS[shape]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start game (creator only) */}
        {isCreator && members.length >= 2 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleStart}
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
