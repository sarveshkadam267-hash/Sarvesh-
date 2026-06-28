import React, { useEffect, useState } from 'react';
import { audio } from '../utils/audio';

interface MatchmakingProps {
  gameName: string;
  tier: string;
  entryFee: number;
  prizePool: number;
  onMatchFound: (opponent: { name: string; level: number; avatar: string }) => void;
  onCancel: () => void;
}

const CANDIDATES = [
  { name: 'Aarav Sharma', level: 4, avatar: '🦊' },
  { name: 'Priyah Patel', level: 9, avatar: '🐨' },
  { name: 'Rohit Kumar', level: 12, avatar: '🦁' },
  { name: 'Deepika Sen', level: 3, avatar: '🐰' },
  { name: 'Kabir Malik', level: 7, avatar: '🐯' },
  { name: 'Ananya Rao', level: 14, avatar: '🐼' },
  { name: 'Aditya Singh', level: 6, avatar: '🐒' },
  { name: 'Neha Sharma', level: 10, avatar: '🐱' },
  { name: 'Vijay Verma', level: 11, avatar: '🦄' },
  { name: 'Jasmin Gill', level: 8, avatar: '🦊' },
];

export default function Matchmaking({ gameName, tier, entryFee, prizePool, onMatchFound, onCancel }: MatchmakingProps) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [phase, setPhase] = useState<'charging' | 'searching' | 'matched' | 'countdown'>('charging');
  const [opponent, setOpponent] = useState<typeof CANDIDATES[0] | null>(null);
  const [countdown, setCountdown] = useState(3);

  // 1. Pay Charging Animation
  useEffect(() => {
    audio.playThud();
    const timer = setTimeout(() => {
      setPhase('searching');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // 2. Searching Loop (Spinner)
  useEffect(() => {
    if (phase !== 'searching') return;

    let cycleCount = 0;
    const interval = setInterval(() => {
      setCandidateIdx((prev) => (prev + 1) % CANDIDATES.length);
      audio.playSpin();
      cycleCount++;

      if (cycleCount > 15) {
        clearInterval(interval);
        
        // Pick a final challenger nearby or fitting tier
        const randomOpp = CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)];
        setOpponent(randomOpp);
        setPhase('matched');
      }
    }, 140);

    return () => clearInterval(interval);
  }, [phase]);

  // 3. Matched & Countdown Transition
  useEffect(() => {
    if (phase !== 'matched') return;

    audio.playWin(); // Success match alert
    const delay = setTimeout(() => {
      setPhase('countdown');
    }, 1800);

    return () => clearTimeout(delay);
  }, [phase]);

  // 4. Countdown Decrements
  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        audio.playThud();
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [phase]);

  // 5. Trigger Match Found on Countdown Finished
  useEffect(() => {
    if (phase === 'countdown' && countdown === 0) {
      if (opponent) {
        onMatchFound(opponent);
      }
    }
  }, [phase, countdown, opponent, onMatchFound]);

  return (
    <div className="absolute inset-0 bg-[#070b13]/95 z-50 flex flex-col items-center justify-center p-6 text-white rounded-2xl select-none" id="matchmaker-overlay">
      
      {/* Search Header */}
      <div className="text-center mb-8">
        <span className="text-yellow-400 text-xs font-black uppercase bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 font-mono">
          WINZO ARENA MATCHMAKING
        </span>
        <h3 className="text-2xl font-black mt-2 tracking-tight">{gameName}</h3>
        <p className="text-gray-400 text-xs font-semibold uppercase mt-1 tracking-wider text-cyan-400">
          Tier: {tier} • Pool: ₹ {prizePool} Cash
        </p>
      </div>

      {/* Versus Layout frame */}
      <div className="flex items-center justify-center gap-6 md:gap-12 w-full max-w-md my-6 py-6 border-y border-white/5 relative">
        
        {/* User Card */}
        <div className="flex flex-col items-center w-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-300">
            😎
          </div>
          <span className="text-sm font-extrabold mt-3 truncate w-full">You</span>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-full mt-1 border border-cyan-900/50">
            Player
          </span>
        </div>

        {/* VERSUS CIRCLE */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-red-600 flex items-center justify-center font-black text-sm italic shadow-lg z-10 border border-yellow-200">
            VS
          </div>
          {phase === 'searching' && (
            <div className="absolute inset-[-12px] rounded-full border-2 border-t-yellow-400 border-r-transparent border-b-yellow-500 border-l-transparent animate-spin" />
          )}
        </div>

        {/* MATCH ADVANCED SEARCH STATES */}
        <div className="flex flex-col items-center w-28 text-center min-h-[110px] justify-center">
          {phase === 'charging' && (
            <div className="animate-pulse flex flex-col items-center">
              <span className="text-2xl">⚡</span>
              <span className="text-[10px] text-yellow-400 font-mono mt-2 uppercase tracking-tight">Charging Fee...</span>
              <span className="text-xs font-bold text-yellow-400">-{entryFee} Rupees</span>
            </div>
          )}

          {phase === 'searching' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl animate-bounce border border-slate-700">
                {CANDIDATES[candidateIdx].avatar}
              </div>
              <span className="text-xs font-semibold text-gray-400 truncate w-full mt-3">
                {CANDIDATES[candidateIdx].name}
              </span>
              <span className="text-[9px] text-gray-500 font-mono mt-1">Lvl {CANDIDATES[candidateIdx].level}</span>
            </div>
          )}

          {(phase === 'matched' || phase === 'countdown') && opponent && (
            <div className="flex flex-col items-center animate-scale-up">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(244,63,94,0.3)] border border-rose-300">
                {opponent.avatar}
              </div>
              <span className="text-sm font-extrabold mt-3 truncate w-full">{opponent.name}</span>
              <span className="text-[10px] text-rose-400 font-mono bg-rose-950/40 px-2 py-0.5 rounded-full mt-1 border border-rose-900/50">
                Level {opponent.level}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Interactive Logs or countdown status indicators */}
      <div className="h-20 flex flex-col items-center justify-center text-center">
        {phase === 'charging' && (
          <span className="text-xs text-gray-400 font-sans italic">Withdrawing virtual funds safely...</span>
        )}
        
        {phase === 'searching' && (
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-400 text-center font-sans tracking-wide">
              Analyzing connections and matching tiers...
            </span>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 animate-pulse">
              Estimated Ping: {Math.floor(Math.random() * 20) + 24}ms • Server: IND-DEL-1
            </span>
          </div>
        )}

        {phase === 'matched' && (
          <div className="flex flex-col items-center">
            <span className="text-emerald-400 font-black text-sm tracking-wide">CHALLENGER SECURED!</span>
            <span className="text-xs text-gray-400 font-sans mt-0.5">Connection status: 100% Solid</span>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="flex flex-col items-center animate-pulse">
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-mono">STAND BY! MATCH BEGINS IN</span>
            <span className="text-4xl font-extrabold text-yellow-400 mt-1 font-mono">{countdown}</span>
          </div>
        )}
      </div>

      {/* Cancel search panel */}
      {phase === 'searching' && (
        <button
          onClick={onCancel}
          className="mt-6 text-gray-400 hover:text-white text-xs border border-white/10 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Cancel Search & Return
        </button>
      )}

    </div>
  );
}
