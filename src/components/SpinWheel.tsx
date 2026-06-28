import React, { useState, useRef } from 'react';
import { audio } from '../utils/audio';
import { Profile } from '../types';

interface SpinWheelProps {
  profile: Profile;
  onDeductSpinCost: () => void;
  onWin: (coins: number) => void;
  onClose: () => void;
  onOpenDeposit?: () => void;
}

interface Sector {
  value: number;
  label: string;
  color: string;
  textColor: string;
}

const SECTORS: Sector[] = [
  { value: 10, label: '₹10 Coins', color: '#1e293b', textColor: '#ffffff' },
  { value: 0, label: '₹0 Try Again', color: '#3a0a12', textColor: '#ff6b6b' },
  { value: 20, label: '₹20 Coins', color: '#0284c7', textColor: '#ffffff' },
  { value: 30, label: '₹30 Coins', color: '#ca8a04', textColor: '#ffffff' },
  { value: 40, label: '₹40 Coins', color: '#10b981', textColor: '#ffffff' },
  { value: 50, label: '₹50 Coins', color: '#8b5cf6', textColor: '#ffffff' },
  { value: 100, label: '₹100 GOLD', color: '#fe3d7a', textColor: '#ffffff' },
  { value: 0, label: 'Better Luck!', color: '#3a0a12', textColor: '#ff6b6b' },
];

export default function SpinWheel({ profile, onDeductSpinCost, onWin, onClose, onOpenDeposit }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinReward, setSpinReward] = useState<Sector | null>(null);

  const wheelRef = useRef<HTMLDivElement | null>(null);

  const startSpin = () => {
    if (isSpinning) return;

    if (profile.coins < 60) {
      audio.playThud();
      alert('⚠️ Insufficient stakes balance! Please add money to spin the wheel.');
      if (onOpenDeposit) {
        onOpenDeposit();
      }
      return;
    }

    // Deduct cost of spin (60 coins)
    onDeductSpinCost();
    audio.playCoin();
    setIsSpinning(true);
    setSpinReward(null);

    // Pick winning value based on custom probabilities:
    // 1. Chance to get 100 coins is exactly 1/10 (10%)
    // 2. Remaining 90% chance is split equally between the other 6 rewards (10, 0, 20, 30, 40, 50)
    const rand = Math.random();
    let wonValue = 0;
    if (rand < 0.1) {
      wonValue = 100;
    } else {
      const non100Rewards = [10, 0, 20, 30, 40, 50];
      const rollIdx = Math.floor((rand - 0.1) / 0.15); // 0.9 / 6 = 0.15 each
      wonValue = non100Rewards[Math.min(Math.max(rollIdx, 0), non100Rewards.length - 1)];
    }

    // Find all sectors matching the rolled value
    const matchingIndices = SECTORS.reduce<number[]>((acc, sec, idx) => {
      if (sec.value === wonValue) {
        acc.push(idx);
      }
      return acc;
    }, []);

    // Randomly pick one sector index of the matching value to land on
    const wonIdx = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    const sectorAngle = 360 / SECTORS.length;
    
    // Calculate rotation to land selected sector at top (0 or 360 deg)
    const initialSpins = 5 * 360; // 5 full rotations
    const targetSectorOffset = 360 - (wonIdx * sectorAngle) - (sectorAngle / 2); // Center of sector
    const finalAngle = rotation + initialSpins + targetSectorOffset;

    // Simulate sound ticks!
    let currentAngle = rotation;
    const totalRotation = finalAngle - rotation;
    const duration = 4000; // 4 seconds animation
    const startTime = performance.now();

    const animateTicks = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= duration) {
        setRotation(finalAngle);
        setIsSpinning(false);
        setSpinReward(SECTORS[wonIdx]);
        
        // Award prize or play respective sound
        if (SECTORS[wonIdx].value > 0) {
          audio.playWin();
          onWin(SECTORS[wonIdx].value);
        } else {
          audio.playThud();
        }
        return;
      }

      // Easing formula (cubic ease-out) to match css transition
      const t = elapsed / duration;
      const easeValue = 1 - Math.pow(1 - t, 3);
      const nextAngle = rotation + totalRotation * easeValue;

      // When angle traverses a sector threshold (360 / 8 = 45 degrees), play tick sound!
      const lastThreshold = Math.floor(currentAngle / 45);
      const nextThreshold = Math.floor(nextAngle / 45);
      if (nextThreshold > lastThreshold) {
        audio.playSpin();
      }

      currentAngle = nextAngle;
      setRotation(nextAngle);
      requestAnimationFrame(animateTicks);
    };

    requestAnimationFrame(animateTicks);
  };

  return (
    <div className="absolute inset-0 bg-[#070b13]/95 z-40 flex flex-col items-center justify-center p-6 text-white rounded-2xl select-none" id="rewards-spinning-overlay">
      
      {/* Back button */}
      <div className="absolute top-4 right-4 z-45">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-white/5 bg-slate-900 cursor-pointer text-xs transition-all hover:bg-slate-850"
        >
          ✕ Close
        </button>
      </div>

      <div className="text-center mb-4">
        <span className="text-[10px] bg-yellow-400 text-black px-3 py-1 rounded-full font-black tracking-wider uppercase font-mono">
          🎡 UNLIMITED FORTUNE SPIN WHEEL
        </span>
        <h3 className="text-xl font-black mt-2 text-white">SPIN FOR ONLY 60 COINS</h3>
        <p className="text-gray-400 text-[11px] mt-1 font-sans">
          Your daily limits are lifted! Keep spinning to hit the mega jackpot rewards!
        </p>
      </div>

      {/* Balance HUD */}
      <div className="bg-slate-950/80 px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-3 text-xs font-mono select-none my-1 shadow-md">
        <span className="text-gray-400 uppercase tracking-wider text-[9px]">YOUR BALANCE:</span>
        <span className="text-emerald-400 font-extrabold">₹{profile.coins.toLocaleString('en-IN')} Cash</span>
      </div>

      <div className="relative flex items-center justify-center my-4">
        {/* Needle pointer top indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

        {/* Outer glowing ring container */}
        <div className="w-[260px] h-[260px] rounded-full bg-slate-950 border-[10px] border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center relative overflow-hidden">
          
          {/* Wheel segments */}
          <div
            ref={wheelRef}
            className="w-full h-full rounded-full relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Sector colors render */}
            {SECTORS.map((sec, idx) => {
              const rotationDegree = idx * 45;
              return (
                <div
                  key={idx}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${rotationDegree}deg)`,
                    clipPath: 'polygon(50% 50%, 40% 0%, 60% 0%)',
                    backgroundColor: sec.color,
                  }}
                >
                  {/* Text label placed correctly inside slices */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 top-9 text-[9px] font-black tracking-wider text-center uppercase"
                    style={{
                      color: sec.textColor,
                      transform: 'rotate(0deg)',
                      writingMode: 'vertical-rl',
                    }}
                  >
                    {sec.label}
                  </span>
                </div>
              );
            })}

            {/* Split dividers lines */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 left-[119.5px] w-[1px] bg-slate-800/60 z-10"
                style={{ transform: `rotate(${i * 45}deg)` }}
              />
            ))}
          </div>

          {/* Golden Center peg */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-xl border border-yellow-200 flex items-center justify-center z-15">
            <div className="w-7 h-7 rounded-full bg-amber-600 border border-yellow-500/50 flex items-center justify-center font-black text-[10px] text-white">
              SPIN
            </div>
          </div>
        </div>
      </div>

      {/* Reward details / Button controllers */}
      <div className="h-28 flex flex-col items-center justify-center w-full max-w-[320px]">
        {spinReward ? (
          <div className="text-center animate-scale-up flex flex-col items-center gap-2">
            {spinReward.value > 0 ? (
              <div className="mb-1">
                <span className="text-emerald-400 font-extrabold text-sm block tracking-wide uppercase">CONGRATULATIONS! 🎉</span>
                <span className="text-xl font-black text-yellow-400 tracking-wider">₹{spinReward.value} Coins Won</span>
                <p className="text-[9px] text-gray-500 mt-0.5 uppercase font-mono">Credited to wallet instantly</p>
              </div>
            ) : (
              <div className="mb-1">
                <span className="text-rose-400 font-black text-sm block tracking-wide uppercase">Better luck next time! 🍀</span>
                <p className="text-gray-400 text-[10px] font-sans">No worries, spins are unlimited! Go again!</p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 w-full justify-center">
              <button
                onClick={() => setSpinReward(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] px-4 py-2 rounded-full uppercase tracking-wider cursor-pointer transition-all shrink-0"
              >
                🔄 Spin Again
              </button>
              <button
                onClick={onClose}
                className="bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] px-5 py-2 rounded-full uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-md"
              >
                🎮 Close
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 w-full">
            <button
              onClick={startSpin}
              disabled={isSpinning || profile.coins < 60}
              className={`w-full py-3 rounded-full text-black font-extrabold text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                isSpinning
                  ? 'bg-slate-700 text-gray-500 pointer-events-none'
                  : profile.coins < 60
                  ? 'bg-slate-800 text-gray-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
              id="trigger-spin-btn"
            >
              {isSpinning ? (
                'SPINNING...'
              ) : (
                <>
                  <span>🎰 SPIN FOR 60 COINS</span>
                </>
              )}
            </button>
            
            {profile.coins < 60 && onOpenDeposit && (
              <button
                type="button"
                onClick={onOpenDeposit}
                className="text-[10px] text-emerald-400 font-black hover:underline cursor-pointer uppercase tracking-wider animate-pulse"
              >
                ➕ CLICK TO ADD COINS INSTANTLY
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
