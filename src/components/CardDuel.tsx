import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface CardDuelProps {
  opponentName: string;
  opponentLevel: number;
  opponentAvatar: string;
  entryFee: number;
  prizePool: number;
  onGameOver: (userScore: number, opponentScore: number, won: boolean) => void;
}

interface CardState {
  id: number;
  type: 'winner' | 'loser';
  isFlipped: boolean; // true = face up, false = face down
  selectedBy: 'player' | 'opponent' | null;
}

export default function CardDuel({
  opponentName,
  opponentLevel,
  opponentAvatar,
  entryFee,
  prizePool,
  onGameOver,
}: CardDuelProps) {
  const [cards, setCards] = useState<CardState[]>([
    { id: 1, type: 'winner', isFlipped: false, selectedBy: null },
    { id: 2, type: 'loser', isFlipped: false, selectedBy: null },
    { id: 3, type: 'loser', isFlipped: false, selectedBy: null },
  ]);

  // Game stages: 'ready' | 'preview' | 'shuffling' | 'player-pick' | 'opponent-pick' | 'reveal' | 'finished'
  const [stage, setStage] = useState<'ready' | 'preview' | 'shuffling' | 'player-pick' | 'opponent-pick' | 'reveal' | 'finished'>('ready');
  const [statusMessage, setStatusMessage] = useState('All set! Tap Start Duel to begin the match!');
  const [secLeft, setSecLeft] = useState(3);
  const [opponentActionTimer, setOpponentActionTimer] = useState<any>(null);

  // Card Positions mapping for Shuffle Animation offsets
  const [positions, setPositions] = useState<number[]>([0, 1, 2]);

  // Handle start match click
  const handleStartMatch = () => {
    audio.playWhoosh();
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
    setStage('preview');
    setStatusMessage('Memorize the GOLDEN WINNING card!');
    setSecLeft(3);
  };

  // Initial preview countdown
  useEffect(() => {
    if (stage !== 'preview') return;
    
    const interval = setInterval(() => {
      setSecLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startShufflingSequence();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]);

  // Step 1: Flip all face down and perform visual shuffle
  const startShufflingSequence = () => {
    audio.playWhoosh();
    // 1. Flip face down
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
    setStage('shuffling');
    setStatusMessage('Shuffling cards...');

    // 2. Perform shuffle positions swap multiple times for a high-quality feel
    let shuffleCount = 0;
    const maxShuffles = 6;
    
    const shuffleInterval = setInterval(() => {
      audio.playSpin();
      setPositions((prev) => {
        const next = [...prev];
        // Swap two random indices
        const idx1 = Math.floor(Math.random() * 3);
        let idx2 = Math.floor(Math.random() * 3);
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * 3);
        }
        const temp = next[idx1];
        next[idx1] = next[idx2];
        next[idx2] = temp;
        return next;
      });

      shuffleCount++;
      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        setTimeout(() => {
          setStage('player-pick');
          setStatusMessage('YOUR TURN: Choose one card!');
        }, 800);
      }
    }, 280);
  };

  // Step 2: Handle Player Selection
  const handleCardClick = (cardId: number) => {
    if (stage !== 'player-pick') return;
    
    audio.playThud();
    
    // Mark card as player selected
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          return { ...c, selectedBy: 'player' };
        }
        return c;
      })
    );

    // Transition to Opponent picking
    setStage('opponent-pick');
    setStatusMessage(`${opponentName} is choosing a card...`);

    // Opponent picks after a slight suspenseful lag
    const timer = setTimeout(() => {
      setCards((currentCards) => {
        // Find remaining cards that user hasn't selected
        const unselectedCards = currentCards.filter((c) => c.selectedBy === null);
        if (unselectedCards.length === 0) return currentCards;

        // Opponent selects randomly from the remaining two
        const randomChoice = unselectedCards[Math.floor(Math.random() * unselectedCards.length)];
        audio.playWhoosh();
        
        return currentCards.map((c) => {
          if (c.id === randomChoice.id) {
            return { ...c, selectedBy: 'opponent' };
          }
          return c;
        });
      });

      setStage('reveal');
      setStatusMessage('All cards locked! Revealing in 2 seconds...');
      
      // Delay reveal of the winning card
      setTimeout(() => {
        revealResults();
      }, 1500);

    }, 1800);

    setOpponentActionTimer(timer);
  };

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (opponentActionTimer) clearTimeout(opponentActionTimer);
    };
  }, [opponentActionTimer]);

  // Step 3: Reveal Results
  const revealResults = () => {
    setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));
    setStage('finished');

    // Find who picked the winning card
    setCards((finalCards) => {
      const winnerCard = finalCards.find((c) => c.type === 'winner');
      
      const userWon = winnerCard?.selectedBy === 'player';
      const opponentWon = winnerCard?.selectedBy === 'opponent';

      if (userWon) {
        audio.playWin();
        setStatusMessage('🏆 PERFECT PICK! Dynamic victory achieved!');
      } else if (opponentWon) {
        audio.playLose();
        setStatusMessage(`💀 Bummer! ${opponentName} snatched the winning card!`);
      } else {
        audio.playLose();
        setStatusMessage('❌ Unlucky! The winning card was left unchosen. House Wins!');
      }

      // Return a score: 100 for winning card, 0 otherwise
      const finalUserScore = userWon ? 100 : 0;
      const finalOppScore = opponentWon ? 100 : 0;

      // Delayed callback trigger to show the reveal first
      setTimeout(() => {
        onGameOver(finalUserScore, finalOppScore, userWon);
      }, 3000);

      return finalCards;
    });
  };

  return (
    <div className="w-full h-full bg-[#090e17] flex flex-col justify-between py-6 px-4 font-sans select-none" id="card-duel-board">
      
      {/* 1. MATCH HEADER INFORMATION */}
      <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-white/5 shadow-lg">
        
        {/* User Card */}
        <div className="flex items-center gap-2 max-w-[42%]">
          <span className="text-2xl p-1.5 bg-cyan-950/40 rounded-xl border border-cyan-500/20">🦊</span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black truncate text-cyan-400">YOU</span>
            <span className="text-[9px] text-gray-400 font-mono">User Challenger</span>
          </div>
        </div>

        {/* VS / Prize pool Badge */}
        <div className="text-center bg-slate-950/60 md:px-4 px-2.5 py-1.5 rounded-xl border border-amber-500/15">
          <span className="text-[8px] uppercase tracking-widest block text-gray-400 font-bold">1v1 Duel Prize</span>
          <span className="text-xs font-mono font-black text-glow-yellow text-yellow-400">₹ {Math.floor(prizePool * 1.5)} Cash</span>
          <span className="text-[8px] text-emerald-400 font-black block leading-none mt-0.5">(1.5x Grand Bonus!)</span>
        </div>

        {/* Opponent Card */}
        <div className="flex items-center gap-2 max-w-[42%] text-right justify-end">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black truncate text-rose-400 uppercase">{opponentName.split(' ')[0]}</span>
            <span className="text-[9px] text-gray-400 font-mono">Lvl {opponentLevel} rival</span>
          </div>
          <span className="text-2xl p-1.5 bg-rose-950/40 rounded-xl border border-rose-500/20">{opponentAvatar}</span>
        </div>

      </div>

      {/* 2. GAME INSTRUCTION BANNER */}
      <div className="text-center my-4">
        <div className="inline-block bg-slate-900 border border-white/5 px-4 py-2 rounded-full shadow-inner">
          <span className="text-xs font-bold font-sans text-amber-200 tracking-wide">
            {stage === 'preview' ? `${statusMessage} (${secLeft}s)` : statusMessage}
          </span>
        </div>
      </div>

      {/* 3. THREE CARDS ARENA CONTAINER */}
      <div className="flex-1 flex items-center justify-center gap-3 relative min-h-[300px]">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-950/20 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {stage === 'ready' && (
          <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center rounded-2xl backdrop-blur-xs p-5" id="start-duel-overlay">
            <span className="text-xl animate-bounce mb-1">🎮</span>
            <span className="text-sm font-black text-amber-400 mb-2 uppercase tracking-widest text-[13px] font-mono">STAKES SECURED ₹</span>
            <p className="text-[10px] text-gray-300 text-center max-w-[210px] mb-4 font-sans leading-relaxed">
              Match confirmed! Click <strong className="text-yellow-400">START DUEL</strong> below to deal and memorize the Winning Gold Ace!
            </p>
            <button
              onClick={handleStartMatch}
              className="py-2.5 px-6 rounded-full bg-gradient-to-r from-yellow-500 via-amber-500 to-red-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer hover:scale-105 active:scale-95 transition-all animate-pulse"
              id="start-duel-action-btn"
            >
              🚀 Start Duel
            </button>
          </div>
        )}
        
        {cards.map((card, idx) => {
          // Get positional index for placement styling
          const positionIdx = positions.indexOf(idx);

          // Render appropriate selection markers
          const isPlayerSelection = card.selectedBy === 'player';
          const isOpponentSelection = card.selectedBy === 'opponent';

          return (
            <motion.div
              key={card.id}
              layout
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              onClick={() => handleCardClick(card.id)}
              className={`relative cursor-pointer transition-all duration-300 ${
                stage === 'player-pick' ? 'hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(245,158,11,0.25)]' : ''
              }`}
              style={{
                width: '105px',
                height: '165px',
                order: positionIdx,
              }}
              id={`card-slot-${card.id}`}
            >
              <AnimatePresence mode="wait">
                {!card.isFlipped ? (
                  /* CARD BACK SHAPE */
                  <motion.div
                    key="back"
                    initial={{ rotateY: -180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 180, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`w-full h-full rounded-2xl border-2 flex flex-col justify-between p-3 relative overflow-hidden select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${
                      isPlayerSelection
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : isOpponentSelection
                        ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                        : 'border-slate-800 bg-gradient-to-b from-[#111827] to-[#1f2937]'
                    }`}
                  >
                    {/* Retro patterns */}
                    <div className="absolute inset-2 border border-dashed border-white/5 rounded-xl flex items-center justify-center bg-black/10">
                      <div className="text-3xl opacity-20">🃏</div>
                    </div>
                    
                    {/* Tiny headers */}
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono z-10 font-bold">
                      <span>W</span>
                      <span>Z</span>
                    </div>

                    {/* Centered target/stakes logo */}
                    <div className="text-center z-10 my-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center bg-slate-950 bg-gradient-to-tr from-amber-500/20 to-purple-500/20 shadow-inner">
                        <span className="text-xl animate-pulse">✨</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono z-10 font-bold rotate-180">
                      <span>W</span>
                      <span>Z</span>
                    </div>

                    {/* Selection Badges overlaying cards */}
                    {isPlayerSelection && (
                      <div className="absolute inset-0 bg-cyan-950/90 flex flex-col items-center justify-center p-2 text-center rounded-2xl border border-cyan-400 animate-scale-up">
                        <span className="text-2xl bounce">🦊</span>
                        <span className="text-[10px] font-black text-cyan-400 mt-1 uppercase font-sans tracking-wide">YOUR PICK</span>
                      </div>
                    )}
                    {isOpponentSelection && (
                      <div className="absolute inset-0 bg-rose-950/90 flex flex-col items-center justify-center p-2 text-center rounded-2xl border border-rose-500 animate-scale-up">
                        <span className="text-2xl">{opponentAvatar}</span>
                        <span className="text-[9px] font-black text-rose-400 mt-1 uppercase font-sans tracking-wide truncate max-w-full">RIVAL PICK</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* CARD FRONT SHAPE */
                  <motion.div
                    key="front"
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -180, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`w-full h-full rounded-2xl border-2 flex flex-col justify-between p-3 relative overflow-hidden select-none shadow-[0_8px_30px_rgba(0,0,0,0.6)] ${
                      card.type === 'winner'
                        ? 'border-yellow-400 bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-900 shadow-[0_0_30px_rgba(234,179,8,0.45)]'
                        : 'border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 opacity-60'
                    }`}
                  >
                    {/* Inner gold frame for winner */}
                    {card.type === 'winner' && (
                      <div className="absolute inset-1.5 border border-yellow-500/20 rounded-xl pointer-events-none" />
                    )}

                    {/* Header values */}
                    <div className="flex justify-between items-center text-xs font-mono font-black z-10">
                      {card.type === 'winner' ? (
                        <>
                          <span className="text-yellow-400">A</span>
                          <span className="text-yellow-400">✨</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">0</span>
                          <span className="text-gray-500">❌</span>
                        </>
                      )}
                    </div>

                    {/* Centered big visual emblem */}
                    <div className="text-center z-10 my-auto flex flex-col items-center">
                      {card.type === 'winner' ? (
                        <>
                          <div className="text-3xl animate-bounce">👑</div>
                          <span className="text-[9px] text-yellow-400 font-extrabold tracking-widest mt-1.5 uppercase leading-none font-mono">GOLD ACE</span>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl text-gray-600 grayscale">🃏</div>
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wide leading-none mt-1 font-mono">DUMMY JOKER</span>
                        </>
                      )}
                    </div>

                    {/* Upside down value footer */}
                    <div className="flex justify-between items-center text-xs font-mono font-black z-10 rotate-180">
                      {card.type === 'winner' ? (
                        <>
                          <span className="text-yellow-400">A</span>
                          <span className="text-yellow-400">✨</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">0</span>
                          <span className="text-gray-500">❌</span>
                        </>
                      )}
                    </div>

                    {/* Overlay identifiers if selected after flips */}
                    {stage === 'finished' && isPlayerSelection && (
                      <div className="absolute top-2 right-2 bg-cyan-500 text-slate-900 border border-cyan-200 font-black rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md">
                        🦊
                      </div>
                    )}
                    {stage === 'finished' && isOpponentSelection && (
                      <div className="absolute top-2 right-2 bg-rose-500 text-white border border-rose-300 font-black rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md">
                        {opponentAvatar}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 4. FOOTER EXTRA POLISH */}
      <div className="bg-slate-950/50 border border-white/5 p-3 rounded-2xl flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-1.5 text-gray-400">
          <span className="text-sm">🛡️</span>
          <span>Fair Play system enabled</span>
        </div>
        <div className="font-semibold text-yellow-400">
          Winner takes 1.5x of total prize!
        </div>
      </div>

    </div>
  );
}
