import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface LudoProps {
  opponentName: string;
  opponentLevel: number;
  opponentAvatar: string;
  entryFee: number;
  prizePool: number;
  onGameOver: (userScore: number, opponentScore: number, won: boolean) => void;
}

export interface LudoToken {
  id: string; // red-A, red-B, green-A, green-B
  color: 'red' | 'green';
  label: 'A' | 'B';
  step: number; // -1: Yard, 0-50: Clockwise Loop, 51-55: Home Stretch, 56: Finished (HOME)
}

// Clockwise coordinate ring map representing the 52 track walkway cells of standard Ludo
const TRACK_COORDS = [
  // Left arm, top row (0 to 5)
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Top arm, left column (6 to 11) - row decreases
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  // Top midpoint (12)
  { r: 0, c: 7 },
  // Top arm, right column (13 to 18) - row increases
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Right arm, top row (19 to 24) - col increases
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  // Right midpoint (25)
  { r: 7, c: 14 },
  // Right arm, bottom row (26 to 31) - col decreases
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Bottom arm, right column (32 to 37) - row increases
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  // Bottom midpoint (38)
  { r: 14, c: 7 },
  // Bottom arm, left column (39 to 44) - row decreases
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Left arm, bottom row (45 to 50) - col decreases
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  // Left midpoint (51)
  { r: 7, c: 0 }
];

// Returns structural coordinates of any token step
function getCellCoords(step: number, color: 'red' | 'green', label: 'A' | 'B'): { r: number; c: number } {
  if (step === -1) {
    if (color === 'red') {
      return label === 'A' ? { r: 11, c: 2 } : { r: 11, c: 3 };
    } else {
      return label === 'A' ? { r: 2, c: 2 } : { r: 2, c: 3 };
    }
  }
  if (step === 56) {
    // Divided inside the center HOME Zone
    if (color === 'red') {
      return label === 'A' ? { r: 8, c: 7 } : { r: 8, c: 6 };
    } else {
      return label === 'A' ? { r: 6, c: 7 } : { r: 6, c: 6 };
    }
  }

  // Common outer clock track loop (Steps 0 to 50)
  if (step <= 50) {
    const trackIndex = color === 'red' ? (40 + step) % 52 : (1 + step) % 52;
    return TRACK_COORDS[trackIndex];
  }

  // Home stretch (Steps 51 to 55)
  const stretchOffset = step - 51; // 0 to 4
  if (color === 'red') {
    return { r: 13 - stretchOffset, c: 7 };
  } else {
    return { r: 7, c: 1 + stretchOffset };
  }
}

// Check if cell is a standard safe spot (Starts, stars)
function isSafeCell(r: number, c: number): boolean {
  if (r === 13 && c === 6) return true; // Red start
  if (r === 6 && c === 1) return true; // Green start
  if (r === 1 && c === 8) return true; // Yellow start
  if (r === 8 && c === 13) return true; // Blue start
  
  if (r === 8 && c === 2) return true;  // Red star
  if (r === 2 && c === 6) return true;  // Green star
  if (r === 6 && c === 12) return true; // Yellow star
  if (r === 12 && c === 8) return true; // Blue star
  return false;
}

export default function Ludo({
  opponentName,
  opponentLevel,
  opponentAvatar,
  entryFee,
  prizePool,
  onGameOver,
}: LudoProps) {
  // Initialize with token A starting active on step 0 for fast snappy matches, token B in Yard
  const [tokens, setTokens] = useState<LudoToken[]>([
    { id: 'red-A', color: 'red', label: 'A', step: 0 },
    { id: 'red-B', color: 'red', label: 'B', step: -1 },
    { id: 'green-A', color: 'green', label: 'A', step: 0 },
    { id: 'green-B', color: 'green', label: 'B', step: -1 },
  ]);

  // Game States
  const [phase, setPhase] = useState<'player-roll' | 'player-move' | 'opponent-turn' | 'game-over'>('player-roll');
  const [diceValue, setDiceValue] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [maxTurns] = useState<number>(18); // Speedy capped format
  const [statusMessage, setStatusMessage] = useState('YOUR TURN: Roll the dice to lead the race!');
  const [matchLog, setMatchLog] = useState<string>('Select roll to race along the neon loop...');

  // Available token IDs to move for the rolled value
  const [movableTokenIds, setMovableTokenIds] = useState<string[]>([]);

  // Roll Dice for Player
  const rollDice = () => {
    if (phase !== 'player-roll' || isRolling) return;

    audio.playSpin();
    setIsRolling(true);
    setMovableTokenIds([]);
    setStatusMessage('Rolling neon core...');

    let cycles = 8;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      cycles--;
      if (cycles <= 0) {
        clearInterval(interval);
        
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        audio.playThud();
        
        evaluatePlayerMoves(finalRoll);
      }
    }, 90);
  };

  // Check valid options
  const evaluatePlayerMoves = (roll: number) => {
    const playerTokens = tokens.filter(t => t.color === 'red');
    const valid: string[] = [];

    for (const t of playerTokens) {
      if (t.step === -1) {
        // Releases from base on 1 or 6
        if (roll === 1 || roll === 6) {
          valid.push(t.id);
        }
      } else if (t.step < 56) {
        // Safe to move if doesn't overshoot top index 56
        if (t.step + roll <= 56) {
          valid.push(t.id);
        }
      }
    }

    if (valid.length === 0) {
      setMatchLog(`Rolled ⚃ ${roll}. No valid moves found.`);
      setStatusMessage(`No active options with roll of ${roll}!`);
      
      setTimeout(() => {
        passTurnToOpponent();
      }, 1500);
    } else {
      setMovableTokenIds(valid);
      setPhase('player-move');
      setStatusMessage(`Rolled ⚄ ${roll}! Click a flashing Red coin to proceed.`);
    }
  };

  // Give turn over to computer AI
  const passTurnToOpponent = () => {
    if (checkFinished()) return;

    if (currentTurn >= maxTurns) {
      triggerFinalShowdown();
      return;
    }

    setPhase('opponent-turn');
    setStatusMessage(`${opponentName} is shaking the dice...`);
    triggerOpponentTurn();
  };

  // Move token logic
  const moveToken = (tokenId: string, rollValue: number): boolean => {
    let captured = false;
    let reachedHome = false;

    setTokens((prevTokens) => {
      const targetToken = prevTokens.find(t => t.id === tokenId);
      if (!targetToken) return prevTokens;

      let nextStep = targetToken.step;
      if (targetToken.step === -1) {
        nextStep = 0; // Starts
      } else {
        nextStep = Math.min(56, targetToken.step + rollValue);
      }

      const targetCell = getCellCoords(nextStep, targetToken.color, targetToken.label);

      if (nextStep === 56) {
        reachedHome = true;
      }

      // Capture conditions check
      const isTargetSafe = isSafeCell(targetCell.r, targetCell.c);

      let updatedTokens = prevTokens.map((t) => {
        if (t.id === tokenId) {
          return { ...t, step: nextStep };
        }
        return t;
      });

      if (!isTargetSafe && nextStep < 56) {
        updatedTokens = updatedTokens.map((t) => {
          if (t.color !== targetToken.color && t.step >= 0 && t.step < 56) {
            const oppCell = getCellCoords(t.step, t.color, t.label);
            if (oppCell.r === targetCell.r && oppCell.c === targetCell.c) {
              captured = true;
              return { ...t, step: -1 }; // Send back to base!
            }
          }
          return t;
        });
      }

      return updatedTokens;
    });

    if (captured) {
      audio.playExplode();
      setMatchLog(`💥 KAPOW! Sent opponent token back to Yard base! Bonus turn acquired!`);
    } else if (reachedHome) {
      audio.playCoin();
      setMatchLog(`🎉 Red Coin ${tokenId.endsWith('A') ? 'A' : 'B'} reached Home successfully!`);
    } else {
      audio.playWhoosh();
    }

    return captured;
  };

  const handleTokenClick = (tokenId: string) => {
    if (phase !== 'player-move' || !movableTokenIds.includes(tokenId)) return;

    const hadCapture = moveToken(tokenId, diceValue);
    setMovableTokenIds([]);

    if (hadCapture) {
      setPhase('player-roll');
      setStatusMessage('🎯 BATTLE BONUS! Double turn! Roll again!');
    } else {
      setTimeout(() => {
        passTurnToOpponent();
      }, 1200);
    }
  };

  // Check end state
  const checkFinished = (): boolean => {
    const redHomeCount = tokens.filter(t => t.color === 'red' && t.step === 56).length;
    const greenHomeCount = tokens.filter(t => t.color === 'green' && t.step === 56).length;

    if (redHomeCount === 2) {
      declareWinner('red');
      return true;
    }
    if (greenHomeCount === 2) {
      declareWinner('green');
      return true;
    }
    return false;
  };

  // AI moves
  const triggerOpponentTurn = () => {
    setTimeout(() => {
      if (phase === 'game-over') return;

      audio.playSpin();
      const aiRoll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(aiRoll);
      audio.playThud();

      setTimeout(() => {
        const aiTokens = tokens.filter(t => t.color === 'green');
        const movableAi: LudoToken[] = [];

        for (const t of aiTokens) {
          if (t.step === -1) {
            if (aiRoll === 6 || aiRoll === 1) movableAi.push(t);
          } else if (t.step < 56) {
            if (t.step + aiRoll <= 56) movableAi.push(t);
          }
        }

        if (movableAi.length === 0) {
          setMatchLog(`${opponentName} rolled ⚁ ${aiRoll}. No moves possible.`);
          setStatusMessage(`${opponentName} has no options and passes.`);
          
          setTimeout(() => {
            setCurrentTurn((prev) => prev + 1);
            setPhase('player-roll');
            setStatusMessage('YOUR TURN: Roll the dice!');
          }, 1500);
          return;
        }

        // Tactical Selection
        // A. Direct Win
        let chosenToken = movableAi.find(t => t.step + aiRoll === 56);

        // B. Capture player coin
        if (!chosenToken) {
          for (const t of movableAi) {
            const tempNext = t.step === -1 ? 0 : t.step + aiRoll;
            const targetPos = getCellCoords(tempNext, 'green', t.label);
            if (!isSafeCell(targetPos.r, targetPos.c) && tempNext < 56) {
              const prey = tokens.find(pt => pt.color === 'red' && pt.step >= 0 && pt.step < 56);
              if (prey) {
                const preyPos = getCellCoords(prey.step, 'red', prey.label);
                if (preyPos.r === targetPos.r && preyPos.c === targetPos.c) {
                  chosenToken = t;
                  break;
                }
              }
            }
          }
        }

        // C. Deploy
        if (!chosenToken) {
          chosenToken = movableAi.find(t => t.step === -1);
        }

        // D. Most advanced
        if (!chosenToken) {
          chosenToken = [...movableAi].sort((a, b) => b.step - a.step)[0];
        }

        setMatchLog(`${opponentName} moved Coin ${chosenToken.label} by ${aiRoll} positions.`);
        const hadCapture = moveToken(chosenToken.id, aiRoll);

        setTimeout(() => {
          const isFin = checkFinished();
          if (isFin) return;

          if (hadCapture) {
            setStatusMessage(`🎯 Danger! Opponent scored an execute bonus and plays again!`);
            triggerOpponentTurn();
          } else {
            setCurrentTurn((prev) => prev + 1);
            setPhase('player-roll');
            setStatusMessage('YOUR TURN: Roll the dice!');
          }
        }, 1250);

      }, 1200);

    }, 1500);
  };

  // Match ending comparison when moves expire
  const triggerFinalShowdown = () => {
    setPhase('game-over');
    setStatusMessage('⌛ Game limit reached! Reviewing distance tracking...');

    const playerScoreValue = tokens
      .filter((t) => t.color === 'red')
      .reduce((sum, t) => sum + (t.step === -1 ? 0 : t.step + 1), 0);

    const opponentScoreValue = tokens
      .filter((t) => t.color === 'green')
      .reduce((sum, t) => sum + (t.step === -1 ? 0 : t.step + 1), 0);

    const userWon = playerScoreValue > opponentScoreValue;

    if (userWon) {
      audio.playWin();
      setStatusMessage(`🏆 RACING VICTORY! You led progress index (${playerScoreValue} vs ${opponentScoreValue})!`);
    } else {
      audio.playLose();
      setStatusMessage(`💀 OUTPACED! Rival was further ahead inside the circuit (${opponentScoreValue} vs ${playerScoreValue})!`);
    }

    setTimeout(() => {
      onGameOver(playerScoreValue * 2, opponentScoreValue * 2, userWon);
    }, 4000);
  };

  const declareWinner = (color: 'red' | 'green') => {
    setPhase('game-over');
    const won = color === 'red';

    if (won) {
      audio.playWin();
      setStatusMessage('🏆 PERFECT RUN! You brought both coins home safely!');
    } else {
      audio.playLose();
      setStatusMessage(`💀 MATCH DEFEAT! ${opponentName} got both coins home first!`);
    }

    setTimeout(() => {
      onGameOver(won ? 150 : 40, won ? 40 : 150, won);
    }, 4000);
  };

  // Generate our Walkway cells coordinate list
  const walkwayCells: { r: number; c: number }[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Exclude Bases (0..5, 9..14 in both dimensions) and Center Home (6..8 in both dimensions)
      const isBase = ((r < 6 || r > 8) && (c < 6 || c > 8)) || ((r >= 0 && r <= 5) && (c >= 0 && c <= 5)) || ((r >= 0 && r <= 5) && (c >= 9 && c <= 14)) || ((r >= 9 && r <= 14) && (c >= 0 && c <= 5)) || ((r >= 9 && r <= 14) && (c >= 9 && c <= 14));
      const isCenter = (r >= 6 && r <= 8) && (c >= 6 && c <= 8);

      if (!isBase && !isCenter) {
        walkwayCells.push({ r, c });
      }
    }
  }

  return (
    <div className="w-full h-full bg-[#03060f] flex flex-col justify-between py-4 px-3 font-sans select-none" id="ludo-arena">
      
      {/* 1. ARENA MATCH DETAILS */}
      <div className="flex justify-between items-center bg-[#0d1326] p-2 rounded-2xl border border-white/5 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-2 max-w-[35%]">
          <span className="text-xl p-1 bg-red-950/40 rounded-xl border border-red-500/20">🦊</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-black truncate text-red-400">YOU (Red)</span>
            <span className="text-[8.5px] text-yellow-400 font-mono font-bold leading-none mt-0.5">
              Yard: {tokens.filter(t => t.color === 'red' && t.step === -1).length} • Home: {tokens.filter(t => t.color === 'red' && t.step === 56).length}
            </span>
          </div>
        </div>

        <div className="text-center bg-black/40 border border-fuchsia-500/10 rounded-xl px-2.5 py-1 min-w-[120px]">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[8px] uppercase font-bold text-gray-400 font-mono">ROUND {currentTurn}/{maxTurns}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse animate-duration-1000" />
          </div>
          <span className="text-[9.5px] font-mono font-bold text-yellow-300 block mt-0.5">
            Stake: ₹ {Math.floor(prizePool)}
          </span>
        </div>

        <div className="flex items-center gap-2 max-w-[35%] text-right justify-end">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black truncate text-green-400 uppercase">{opponentName.split(' ')[0]}</span>
            <span className="text-[8.5px] text-gray-400 font-mono">
              Yard: {tokens.filter(t => t.color === 'green' && t.step === -1).length} • Home: {tokens.filter(t => t.color === 'green' && t.step === 56).length}
            </span>
          </div>
          <span className="text-xl p-1 bg-emerald-950/40 rounded-xl border border-green-500/20">{opponentAvatar}</span>
        </div>
      </div>

      {/* 2. DYNAMIC STATE SUBTITLES & ACTION TRACKER */}
      <div className="text-center my-1.5 flex flex-col gap-1 flex-shrink-0">
        <div className="inline-block bg-[#091024] border border-white/5 px-3 py-1 rounded-full shadow-inner max-w-full">
          <span className="text-[10.5px] font-bold text-gray-200 tracking-wide">
            {statusMessage}
          </span>
        </div>

        <div className="inline-flex items-center justify-center gap-1.5 py-0.5 px-3 bg-black/30 rounded-lg border border-white/5 opacity-80 self-center max-w-[90%] truncate">
          <span className="text-[8px] text-fuchsia-400 font-black font-mono">ARENA FEED ➔</span>
          <span className="text-[8.5px] text-gray-300 font-mono italic">{matchLog}</span>
        </div>
      </div>

      {/* 3. PREMIUM REALISTIC 15X15 LUDO BOARD GRID */}
      <div className="flex-1 flex items-center justify-center py-2 h-0 min-h-0">
        <div className="relative aspect-square w-full max-w-[340px] bg-[#fbfcfc] border-[3px] border-slate-900 rounded-xl p-[2px] shadow-2xl flex flex-col justify-between" id="visual-board-wrapper">
          
          <div 
            className="w-full h-full relative"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
              gap: '1px',
              backgroundColor: '#0a0d14'
            }}
          >
            {/* GREEN BASE (Top Left) */}
            <div 
              style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}
              className="bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 p-2.5 flex items-center justify-center rounded-tl-lg"
            >
              <div className="w-full h-full bg-white rounded-lg p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                {/* Yard Token Wells */}
                <div className="bg-green-100 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-sm relative">
                  <div className="absolute inset-1 rounded-full bg-emerald-500/15" />
                  {tokens.filter(t => t.id === 'green-A' && t.step === -1).map(tok => {
                    return (
                      <button
                        key={tok.id}
                        disabled={true}
                        className="w-5 h-5 rounded-full bg-gradient-to-b from-green-300 to-green-600 border border-green-200 text-white font-bold text-[8.5px] shadow z-10"
                      >
                        A
                      </button>
                    );
                  })}
                </div>
                <div className="bg-green-100 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-sm relative">
                  <div className="absolute inset-1 rounded-full bg-emerald-500/15" />
                  {tokens.filter(t => t.id === 'green-B' && t.step === -1).map(tok => {
                    return (
                      <button
                        key={tok.id}
                        disabled={true}
                        className="w-5 h-5 rounded-full bg-gradient-to-b from-green-300 to-green-600 border border-green-200 text-white font-bold text-[8.5px] shadow z-10 animate-pulse"
                      >
                        B
                      </button>
                    );
                  })}
                </div>
                {/* Decorative slots */}
                <div className="bg-green-50 rounded-full flex items-center justify-center border border-emerald-300/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                </div>
                <div className="bg-green-50 rounded-full flex items-center justify-center border border-emerald-300/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                </div>
              </div>
            </div>

            {/* YELLOW BASE (Top Right) */}
            <div 
              style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}
              className="bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-2.5 flex items-center justify-center rounded-tr-lg"
            >
              <div className="w-full h-full bg-white rounded-lg p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                <div className="bg-yellow-50 rounded-full flex items-center justify-center border border-amber-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                </div>
                <div className="bg-yellow-50 rounded-full flex items-center justify-center border border-amber-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                </div>
                <div className="bg-yellow-50 rounded-full flex items-center justify-center border border-amber-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                </div>
                <div className="bg-yellow-50 rounded-full flex items-center justify-center border border-amber-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                </div>
              </div>
            </div>

            {/* RED BASE (Bottom Left) */}
            <div 
              style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}
              className="bg-gradient-to-br from-red-500 via-red-600 to-rose-700 p-2.5 flex items-center justify-center rounded-bl-lg"
            >
              <div className="w-full h-full bg-white rounded-lg p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                {/* Red Target tokens wells for player */}
                <div className="bg-red-100 rounded-full flex items-center justify-center border-2 border-red-500 shadow relative">
                  <div className="absolute inset-1 rounded-full bg-red-400/20" />
                  {tokens.filter(t => t.id === 'red-A' && t.step === -1).map(tok => {
                    const isClickable = movableTokenIds.includes(tok.id) && phase === 'player-move';
                    return (
                      <button
                        key={tok.id}
                        onClick={() => handleTokenClick(tok.id)}
                        disabled={!isClickable}
                        className={`w-6 h-6 rounded-full bg-gradient-to-b from-red-400 to-red-600 border border-red-100 text-white font-black text-[9.5px] flex items-center justify-center cursor-pointer shadow-lg z-10 ${isClickable ? 'animate-bounce ring-4 ring-yellow-400 border-yellow-200' : ''}`}
                      >
                        A
                      </button>
                    );
                  })}
                </div>
                <div className="bg-red-100 rounded-full flex items-center justify-center border-2 border-red-500 shadow relative">
                  <div className="absolute inset-1 rounded-full bg-red-400/20" />
                  {tokens.filter(t => t.id === 'red-B' && t.step === -1).map(tok => {
                    const isClickable = movableTokenIds.includes(tok.id) && phase === 'player-move';
                    return (
                      <button
                        key={tok.id}
                        onClick={() => handleTokenClick(tok.id)}
                        disabled={!isClickable}
                        className={`w-6 h-6 rounded-full bg-gradient-to-b from-red-400 to-red-600 border border-red-100 text-white font-black text-[9.5px] flex items-center justify-center cursor-pointer shadow-lg z-10 ${isClickable ? 'animate-bounce ring-4 ring-yellow-400 border-yellow-200' : ''}`}
                      >
                        B
                      </button>
                    );
                  })}
                </div>
                <div className="bg-red-50 rounded-full flex items-center justify-center border border-red-300/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                </div>
                <div className="bg-red-50 rounded-full flex items-center justify-center border border-red-300/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                </div>
              </div>
            </div>

            {/* BLUE BASE (Bottom Right) */}
            <div 
              style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}
              className="bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 p-2.5 flex items-center justify-center rounded-br-lg"
            >
              <div className="w-full h-full bg-white rounded-lg p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 shadow-inner">
                <div className="bg-blue-50 rounded-full flex items-center justify-center border border-blue-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60" />
                </div>
                <div className="bg-blue-50 rounded-full flex items-center justify-center border border-blue-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60" />
                </div>
                <div className="bg-blue-50 rounded-full flex items-center justify-center border border-blue-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60" />
                </div>
                <div className="bg-blue-50 rounded-full flex items-center justify-center border border-blue-300">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/60" />
                </div>
              </div>
            </div>

            {/* CENTER HOME (Spans columns 7-9, rows 7-9) */}
            <div 
              style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}
              className="relative bg-[#0d1222] border-2 border-[#1e293b]"
            >
              {/* Divided triangular canvas structure to resemble a real ludo board */}
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Red (Bottom) */}
                <polygon points="0,100 50,50 100,100" fill="#f43f5e" opacity="0.9" />
                {/* Green (Left) */}
                <polygon points="0,0 50,50 0,100" fill="#10b981" opacity="0.9" />
                {/* Yellow (Top) */}
                <polygon points="0,0 50,50 100,0" fill="#eab308" opacity="0.9" />
                {/* Blue (Right) */}
                <polygon points="100,0 50,50 100,100" fill="#3b82f6" opacity="0.9" />
                {/* Center Core line dividing */}
                <line x1="0" y1="0" x2="100" y2="100" stroke="#1e293b" strokeWidth="1.5" />
                <line x1="100" y1="0" x2="0" y2="100" stroke="#1e293b" strokeWidth="1.5" />
              </svg>

              {/* Finished overlay tokens in center home */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-[14px] drop-shadow">🏆</span>

                {/* Render any tokens that are at step 56 */}
                {tokens.filter(t => t.step === 56).map(tok => {
                  return (
                    <span 
                      key={tok.id}
                      className={`absolute w-4 h-4 rounded-full border border-white text-[7.5px] font-black flex items-center justify-center text-white shadow-lg ${
                        tok.color === 'red' ? 'bg-red-500 bottom-1' : 'bg-green-500 top-1'
                      }`}
                      style={{
                        left: tok.id.endsWith('A') ? '15%' : '65%',
                      }}
                    >
                      {tok.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* ALL INDIVIDUAL INDEPENDENT WALKWAY TRACK CELLS */}
            {walkwayCells.map((coord, index) => {
              const r = coord.r;
              const c = coord.c;

              // Check if safe spot
              const isSafe = isSafeCell(r, c);

              // Standard color assignments
              const isRedStart = r === 13 && c === 6;
              const isGreenStart = r === 6 && c === 1;
              const isYellowStart = r === 1 && c === 8;
              const isBlueStart = r === 8 && c === 13;

              const isRedStretch = c === 7 && r >= 9 && r <= 13;
              const isGreenStretch = r === 7 && c >= 1 && c <= 5;
              const isYellowStretch = c === 7 && r >= 1 && r <= 5;
              const isBlueStretch = r === 7 && c >= 9 && c <= 13;

              // Safe Stars coordinates checks
              const isRedStar = r === 8 && c === 2;
              const isGreenStar = r === 2 && c === 6;
              const isYellowStar = r === 6 && c === 12;
              const isBlueStar = r === 12 && c === 8;

              let cellStyle = 'bg-[#f7f9fa] text-slate-800';
              let badge = '';

              if (isRedStretch) {
                cellStyle = 'bg-red-500 hover:bg-red-400 border border-white/20 shadow-md';
              } else if (isGreenStretch) {
                cellStyle = 'bg-emerald-500 hover:bg-emerald-400 border border-white/20 shadow-md';
              } else if (isYellowStretch) {
                cellStyle = 'bg-yellow-400 hover:bg-yellow-300 border border-white/20 shadow-md';
              } else if (isBlueStretch) {
                cellStyle = 'bg-blue-500 hover:bg-blue-400 border border-white/20 shadow-md';
              } else if (isRedStart) {
                cellStyle = 'bg-red-500 text-white font-extrabold';
                badge = '▲';
              } else if (isGreenStart) {
                cellStyle = 'bg-emerald-500 text-white font-extrabold';
                badge = '►';
              } else if (isYellowStart) {
                cellStyle = 'bg-yellow-400 text-slate-900 font-extrabold';
                badge = '▼';
              } else if (isBlueStart) {
                cellStyle = 'bg-blue-500 text-white font-extrabold';
                badge = '◄';
              } else if (isRedStar) {
                cellStyle = 'bg-slate-800 text-yellow-400';
                badge = '★';
              } else if (isGreenStar) {
                cellStyle = 'bg-slate-800 text-emerald-400';
                badge = '★';
              } else if (isYellowStar) {
                cellStyle = 'bg-slate-800 text-yellow-300';
                badge = '★';
              } else if (isBlueStar) {
                cellStyle = 'bg-slate-800 text-blue-400';
                badge = '★';
              }

              // Filter to get any tokens physically residing on this Cell
              const localTokens = tokens.filter(t => {
                const info = getCellCoords(t.step, t.color, t.label);
                return info.r === r && info.c === c;
              });

              return (
                <div 
                  key={`cell-${r}-${c}`}
                  style={{
                    gridColumn: `${c + 1} / ${c + 2}`,
                    gridRow: `${r + 1} / ${r + 2}`,
                  }}
                  className={`relative flex items-center justify-center border border-slate-300/50 text-[8px] transition-colors select-none ${cellStyle}`}
                >
                  {/* Decorative symbols stars/arrows */}
                  {badge && (
                    <span className="absolute text-[7px] font-black opacity-45 pointer-events-none">
                      {badge}
                    </span>
                  )}

                  {/* Render Stack of coins */}
                  <div className="flex flex-wrap items-center justify-center gap-0.5 z-10 w-full p-0.5">
                    {localTokens.map(tok => {
                      const isClickable = movableTokenIds.includes(tok.id) && phase === 'player-move';
                      return (
                        <button
                          key={tok.id}
                          disabled={!isClickable}
                          onClick={() => handleTokenClick(tok.id)}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8.5px] font-black border tracking-tight shadow-md transition-all ${
                            tok.color === 'red'
                              ? 'bg-gradient-to-b from-red-400 to-rose-600 text-white border-red-200'
                              : 'bg-gradient-to-b from-green-500 to-emerald-600 text-white border-green-200'
                          } ${
                            isClickable
                              ? 'cursor-pointer animate-ping scale-110 ring-2 ring-yellow-400 border-yellow-300 z-50 shadow-[0_0_8px_#fbbf24]'
                              : 'opacity-95'
                          }`}
                        >
                          {tok.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          </div>

        </div>
      </div>

      {/* 4. CONTROLLER TRAY: ACTIVE NEON DICE ROLLER CONTROL panel */}
      <div className="flex flex-col bg-[#070e1a] border border-white/5 p-3 rounded-2xl shadow-2xl gap-1.5 flex-shrink-0">
        
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-wide px-1">
          <span>🎲 Roll 1 or 6 to deploy from Yard block</span>
          <span className="font-mono text-fuchsia-400 animate-pulse font-extrabold">Active 1v1 Classic Mode</span>
        </div>

        <div className="flex items-center justify-center gap-5 py-2 px-3 bg-black/40 rounded-xl border border-white/5">
          
          {/* Animated Dice unit */}
          <motion.div
            animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.25, 0.9, 1.15, 1] } : {}}
            transition={{ duration: 0.7 }}
            className={`w-12 h-12 rounded-xl bg-gradient-to-b from-white to-slate-200 shadow-lg border-2 flex items-center justify-center text-slate-900 border-white relative cursor-pointer ${
              phase === 'player-roll' ? 'ring-4 ring-fuchsia-500/40' : ''
            }`}
            onClick={rollDice}
          >
            <div className="text-3xl font-extrabold flex items-center justify-center leading-none">
              {diceValue === 1 && '⚀'}
              {diceValue === 2 && '⚁'}
              {diceValue === 3 && '⚂'}
              {diceValue === 4 && '⚃'}
              {diceValue === 5 && '⚄'}
              {diceValue === 6 && '⚅'}
            </div>
            {isRolling && (
              <span className="absolute inset-0 bg-slate-950/20 rounded-xl flex items-center justify-center text-[11px] font-mono font-black text-white bg-black/50">
                ...
              </span>
            )}
          </motion.div>

          <div className="flex-1 flex flex-col gap-1 pr-1">
            <button
              onClick={rollDice}
              disabled={phase !== 'player-roll' || isRolling}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-[11px] tracking-widest uppercase transition-all shadow-md border ${
                phase === 'player-roll' && !isRolling
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white cursor-pointer active:scale-[0.98] border-rose-400'
                  : 'bg-slate-900 text-gray-500 cursor-not-allowed border-slate-800'
              }`}
              id="roll-dice-action-btn"
            >
              🎲 Roll Dice
            </button>
            <span className="text-[8.5px] text-gray-400 text-center font-mono font-bold leading-none block">
              {phase === 'player-move'
                ? '👉 TAP YOUR FLASHING RED COIN TO GO!'
                : 'WAITING TO SHAKE NEON CORE'}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
