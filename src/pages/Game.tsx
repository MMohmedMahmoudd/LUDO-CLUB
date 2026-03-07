import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import PlayerPanel from '@/components/game/PlayerPanel';
import { getAIMove } from '@/lib/game-engine';
import { supabase } from '@/integrations/supabase/client';
import type { GameState } from '@/lib/types';
import VoiceChat from '@/components/game/VoiceChat';

const PLAYER_COLORS: Record<string, string> = {
  red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835',
};

const Game = () => {
  const nav = useNavigate();
  const location = useLocation();
  const {
    state, validMoves, aiLevel, gameMode,
    rollDice, selectToken, skipTurn, resetGame, restartGame,
    setGameState,
    loadState,
    setMyProfileId, isMyTurn,
    myProfileId,
  } = useGameStore();

  const [isOnlineGame, setIsOnlineGame] = useState(false);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const remoteUpdate = useRef(false);

  // Redirect to home only if no state AND not loading an online game
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasGameParam = params.has('game');
    if (!state && !hasGameParam) nav('/');
  }, [state, nav, location.search]);

  // parse query params to detect online session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gid = params.get('game');
    const rc = params.get('room');
    if (rc) setRoomCode(rc);
    if (gid) {
      setIsOnlineGame(true);
      setOnlineGameId(gid);

      // fetch my profile id for turn ownership
      const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profile) setMyProfileId(profile.id);
      };
      fetchProfile();

      // fetch initial state
      supabase
        .from('games')
        .select('state')
        .eq('id', gid)
        .single()
        .then(({ data, error }) => {
          if (error) return;
          if (data?.state) {
            loadState(data.state as unknown as GameState, 'online');
          }
        });
      // subscribe for changes
      const channel = supabase
        .channel(`game-${gid}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gid}`,
        }, payload => {
          remoteUpdate.current = true;
          setGameState((payload.new as any).state as GameState);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [location.search, loadState, setGameState, setMyProfileId]);

  // push local state to server when changed
  useEffect(() => {
    if (!isOnlineGame || !onlineGameId || !state) return;
    if (remoteUpdate.current) {
      remoteUpdate.current = false;
      return;
    }
    supabase
      .from('games')
      .update({ state: state as any })
      .eq('id', onlineGameId)
      .then();
  }, [state, isOnlineGame, onlineGameId]);

  // AI auto-play
  useEffect(() => {
    if (!state || state.gameStatus !== 'playing') return;
    const p = state.players[state.currentPlayerIndex];
    if (!p.isAI) return;
    let t: ReturnType<typeof setTimeout>;
    if (!state.hasRolled) {
      t = setTimeout(rollDice, 700);
    } else if (validMoves.length > 0) {
      const m = getAIMove(state, aiLevel);
      t = setTimeout(() => selectToken(m), 700);
    } else {
      t = setTimeout(skipTurn, 700);
    }
    return () => clearTimeout(t);
  }, [state?.currentPlayerIndex, state?.hasRolled, state?.diceValue, validMoves.length]);

  // Human auto-move (single valid token) or auto-skip (no valid tokens)
  useEffect(() => {
    if (!state || state.gameStatus !== 'playing') return;
    const p = state.players[state.currentPlayerIndex];
    if (p.isAI || !state.hasRolled) return;
    // In online mode, only auto-move/skip on my turn
    if (isOnlineGame && !isMyTurn()) return;
    if (validMoves.length === 0) {
      const t = setTimeout(skipTurn, 1200);
      return () => clearTimeout(t);
    }
    if (validMoves.length === 1) {
      const t = setTimeout(() => selectToken(validMoves[0]), 400);
      return () => clearTimeout(t);
    }
  }, [state?.hasRolled, validMoves.length]);

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1A237E 100%)' }}>
      <span className="text-white/50">Loading game...</span>
    </div>
  );

  const cur = state.players[state.currentPlayerIndex];
  const myTurn = isMyTurn();
  const canRoll = !cur.isAI && !state.hasRolled && state.gameStatus === 'playing'
    && (!isOnlineGame || myTurn);
  const canSelect = !isOnlineGame || myTurn;
  const curColor = PLAYER_COLORS[cur.color];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 40%, #1A237E 100%)' }}
    >
      {/* Top bar */}
      <div className="flex items-center w-full px-2 sm:px-4 py-2 shrink-0">
        <button
          onClick={() => {
            resetGame();
            nav(isOnlineGame && roomCode ? `/room/${roomCode}` : '/');
          }}
          className="text-white/60 hover:text-white transition-colors text-xs px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 shrink-0"
        >
          {isOnlineGame ? '← Room' : '← Menu'}
        </button>
        {isOnlineGame && (
          <div className="shrink-0 ml-1">
            <VoiceChat roomId={onlineGameId} myProfileId={myProfileId} />
          </div>
        )}
        <motion.div
          key={state.message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 flex-1"
        >
          <div
            className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: curColor, boxShadow: `0 0 10px ${curColor}` }}
          />
          <span className="text-white text-[10px] sm:text-xs md:text-sm font-bold text-center line-clamp-2">
            {state.message}
          </span>
        </motion.div>
      </div>

      {/* Player panels - responsive grid */}
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center w-full px-1 sm:px-3 pb-1 sm:pb-2 shrink-0">
        {state.players.map(p => (
          <div key={p.color} className="flex-shrink-0">
            <PlayerPanel
              player={p}
              isActive={p.color === cur.color}
              tokens={state.tokens[p.color]}
            />
          </div>
        ))}
      </div>

      {/* Board - takes remaining full width and height */}
      <div className="w-full px-1 sm:px-2 flex justify-center items-center flex-1 min-h-0">
        <GameBoard
          state={state}
          validMoves={validMoves}
          onTokenClick={canSelect ? selectToken : () => {}}
          diceValue={state.diceValue}
          canRoll={canRoll}
          onRoll={rollDice}
          currentPlayerColor={cur.color}
        />
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {state.gameStatus === 'finished' && state.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.2, rotateZ: -15 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className="p-8 rounded-3xl text-center max-w-xs w-full"
              style={{
                background: `linear-gradient(145deg, ${PLAYER_COLORS[state.winner]}25, #0D1B2AEE)`,
                border: `2px solid ${PLAYER_COLORS[state.winner]}66`,
                boxShadow: `0 20px 60px ${PLAYER_COLORS[state.winner]}33, 0 0 80px ${PLAYER_COLORS[state.winner]}11`,
              }}
            >
              <motion.div
                animate={{ rotateZ: [0, -12, 12, -6, 6, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-7xl mb-4"
              >🏆</motion.div>
              {(() => {
                const winnerPlayer = state.players.find(p => p.color === state.winner);
                const winnerName = winnerPlayer?.profile?.username || winnerPlayer?.name || state.winner;
                return (
                  <>
                    <h2 className="text-3xl font-black text-white mb-1">
                      {winnerName} Wins!
                    </h2>
                    <p className="text-white/50 text-sm mb-6">Congratulations!</p>
                  </>
                );
              })()}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetGame();
                    nav(isOnlineGame && roomCode ? `/room/${roomCode}` : '/');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors text-sm"
                >
                  {isOnlineGame ? 'Room' : 'Menu'}
                </button>
                {!isOnlineGame && (
                  <button
                    onClick={restartGame}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-colors text-sm"
                    style={{ backgroundColor: PLAYER_COLORS[state.winner] }}
                  >
                    Play Again
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
