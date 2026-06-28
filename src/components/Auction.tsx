import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gavel, Users, TrendingUp, DollarSign, Clock, Trophy, AlertTriangle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { audio } from '../utils/audio';
import { Profile } from '../types';

interface AuctionProps {
  profile: Profile;
  onUpdateCoins: (amount: number) => void;
  onClose: () => void;
  onOpenDepositModal: () => void;
}

interface BidLog {
  id: string;
  bidderName: string;
  bidderAvatar: string;
  bidAmount: number;
  timestamp: string;
  isUser: boolean;
}

const MOCK_BOTS = [
  { name: 'Amit @paytm', avatar: '🦁', level: 12 },
  { name: 'Rohan @ybl', avatar: '🦅', level: 18 },
  { name: 'Neha @okaxis', avatar: '🦄', level: 24 },
  { name: 'Pooja @okhdfc', avatar: '🦊', level: 9 },
  { name: 'Sanjay @apl', avatar: '🐯', level: 31 },
  { name: 'Vikram @ybl', avatar: '🦉', level: 15 },
];

export default function Auction({ profile, onUpdateCoins, onClose, onOpenDepositModal }: AuctionProps) {
  // Game phases: 'intro' -> 'bidding' -> 'ended'
  const [phase, setPhase] = useState<'intro' | 'bidding' | 'ended'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(60); // 1 minute in seconds
  const [entryFee, setEntryFee] = useState<number>(20);
  const [bidAmountInput, setBidAmountInput] = useState<string>('');
  const [bids, setBids] = useState<BidLog[]>([]);
  const [currentHighestBid, setCurrentHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<{ name: string; avatar: string; isUser: boolean } | null>(null);
  const [totalBiddedAmount, setTotalBiddedAmount] = useState<number>(0);
  const [customError, setCustomError] = useState<string>('');
  
  // Stats tracking for user bids in this session
  const [userTotalBidded, setUserTotalBidded] = useState<number>(0);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [showExtensionAlert, setShowExtensionAlert] = useState<boolean>(false);

  useEffect(() => {
    if (showExtensionAlert) {
      const t = setTimeout(() => setShowExtensionAlert(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showExtensionAlert]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const getInitialBidForFee = (fee: number) => {
    switch (fee) {
      case 2: return 5;
      case 5: return 12;
      case 10: return 25;
      case 20: return 50;
      case 50: return 125;
      case 100: return 250;
      default: return Math.floor(fee * 2.5);
    }
  };

  // Sound and start bidding
  const handleStartBidding = () => {
    if (profile.coins < entryFee) {
      setCustomError(`Insufficient balance to join! You need a ₹${entryFee} entry fee.`);
      return;
    }
    // Deduct entry fee
    onUpdateCoins(-entryFee);
    audio.playCoin();
    setPhase('bidding');
    setCustomError('');
    
    // Initial starting auction state setup based on entry fee
    const initialBid = getInitialBidForFee(entryFee);
    const initialBot = MOCK_BOTS[Math.floor(Math.random() * MOCK_BOTS.length)];
    const startBidLog: BidLog = {
      id: 'init-bid',
      bidderName: initialBot.name,
      bidderAvatar: initialBot.avatar,
      bidAmount: initialBid,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isUser: false
    };

    setBids([startBidLog]);
    setCurrentHighestBid(initialBid);
    setHighestBidder({ name: initialBot.name, avatar: initialBot.avatar, isUser: false });
    setTotalBiddedAmount(initialBid);
  };

  // Format countdown timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Track timeLeft in a ref to prevent bot timer recreation every second
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Timer ticking logic
  useEffect(() => {
    if (phase !== 'bidding') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAuctionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Bot random bidding simulation logic
  useEffect(() => {
    if (phase !== 'bidding') return;

    let botTimer: NodeJS.Timeout;

    // Set a random interval for bots to bid between 4 and 10 seconds
    const triggerBotBid = () => {
      if (timeLeftRef.current <= 0) return;

      // Random bot selection
      const bot = MOCK_BOTS[Math.floor(Math.random() * MOCK_BOTS.length)];
      // Bids must be higher than current highest bid
      // Calculate a reasonable increment
      const incrementOptions = [10, 20, 30, 50, 100];
      const increment = incrementOptions[Math.floor(Math.random() * incrementOptions.length)];
      
      setCurrentHighestBid((currentMax) => {
        const newBid = currentMax + increment;
        
        // AI can't bid more than 500!
        if (newBid > 500) {
          return currentMax;
        }

        const uniqueBidId = `bot-bid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Schedule state updates after the render tick to prevent double side-effects in React 18 / StrictMode
        Promise.resolve().then(() => {
          setBids((prev) => {
            // Prevent duplicates on identical amount or ID
            if (prev.some((b) => b.id === uniqueBidId || b.bidAmount === newBid)) return prev;
            return [
              {
                id: uniqueBidId,
                bidderName: bot.name,
                bidderAvatar: bot.avatar,
                bidAmount: newBid,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isUser: false
              },
              ...prev
            ];
          });

          setTotalBiddedAmount((prevTotal) => prevTotal + newBid);
          setHighestBidder({ name: bot.name, avatar: bot.avatar, isUser: false });
          
          // Sniper Protection: extend timer if in last 15 seconds
          if (timeLeftRef.current < 15) {
            setTimeLeft(15);
            setShowExtensionAlert(true);
            audio.playWhoosh();
          } else {
            audio.playThud();
          }
        });

        return newBid;
      });

      // Schedule next bid with a random delay
      const nextDelay = Math.random() * 5000 + 3000; // 3 to 8 seconds
      botTimer = setTimeout(triggerBotBid, nextDelay);
    };

    const firstDelay = Math.random() * 4000 + 2000; // 2 to 6 seconds
    botTimer = setTimeout(triggerBotBid, firstDelay);

    return () => clearTimeout(botTimer);
  }, [phase]);

  // Scroll to logs top/bottom when a bid is added
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [bids]);

  // Handle placing a user bid
  const handlePlaceBid = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCustomError('');

    const bidVal = parseInt(bidAmountInput);
    if (isNaN(bidVal) || bidVal <= 0) {
      setCustomError('Please enter a valid bid amount!');
      return;
    }

    if (bidVal <= currentHighestBid) {
      setCustomError(`Your bid must be strictly higher than the current bid (₹${currentHighestBid})!`);
      return;
    }

    // Validate wallet balance
    if (profile.coins < bidVal) {
      setCustomError('Insufficient balance to place this bid! Add cash below.');
      return;
    }

    // Deduct bidded money from profile cash balance
    onUpdateCoins(-bidVal);
    setUserTotalBidded((prev) => prev + bidVal);

    // Update auction values
    const userBidLog: BidLog = {
      id: `user-bid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      bidderName: profile.name || 'You',
      bidderAvatar: profile.avatar || '🦊',
      bidAmount: bidVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isUser: true
    };

    setBids((prev) => [userBidLog, ...prev]);
    setTotalBiddedAmount((prev) => prev + bidVal);
    setCurrentHighestBid(bidVal);
    setHighestBidder({ name: profile.name || 'You', avatar: profile.avatar || '🦊', isUser: true });
    
    // Clear input
    setBidAmountInput('');
    
    // Sniper Protection: extend timer if in last 15 seconds
    if (timeLeft < 15) {
      setTimeLeft(15);
      setShowExtensionAlert(true);
      audio.playWhoosh();
    } else {
      audio.playCoin();
    }
  };

  // Preset quick bid choices
  const handleQuickBid = (increment: number) => {
    const targetBid = currentHighestBid + increment;
    setBidAmountInput(targetBid.toString());
  };

  // Auction Ending Trigger
  const handleAuctionEnd = () => {
    setPhase('ended');
    const winningPrize = Math.floor(totalBiddedAmount / 2); // The winner gets half of the total bidded money!
    
    // Check if user has the highest bid
    if (highestBidder && highestBidder.isUser) {
      setIsWinner(true);
      // Give the winner the 50% prize pool
      onUpdateCoins(winningPrize);
      audio.playWin();
    } else {
      setIsWinner(false);
      audio.playLose();
    }
  };

  // Fast forward trick for testing or easy gameplay
  const handleFastForward = () => {
    if (timeLeft > 15) {
      audio.playWhoosh();
      setTimeLeft(15);
    }
  };

  const prizePool = Math.floor(totalBiddedAmount / 2); // Winner gets 50% of the bidded amount

  return (
    <div className="w-full h-full bg-[#080d19] flex flex-col justify-between p-4 font-sans select-none overflow-y-auto relative rounded-2xl border border-slate-800" id="auction-room">
      
      {/* 1. INTRO / JOINING SCREEN */}
      {phase === 'intro' && (
        <div className="flex-1 flex flex-col justify-between py-6" id="auction-intro-view">
          <div className="flex items-center gap-3 border-b border-white/5 pb-3">
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full bg-slate-900 border border-white/5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[9px] bg-red-500/15 text-red-400 font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                New Release
              </span>
              <h2 className="text-sm font-black text-white uppercase tracking-tight">
                High-Stakes Auction Hall
              </h2>
            </div>
          </div>
 
          <div className="my-auto text-center flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg border border-yellow-300 animate-pulse">
              <Gavel className="w-10 h-10 text-slate-950 stroke-[2.5]" />
            </div>
 
            <div className="max-w-[280px]">
              <h3 className="text-lg font-black text-white tracking-tight uppercase">
                BIDDING WAR RULES
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Compete against online masters in a live auction room! Place cash bids to claim the absolute crown.
              </p>
            </div>
 
            {/* Rules Grid */}
            <div className="grid grid-cols-1 gap-2.5 w-full bg-slate-950/60 p-4 rounded-xl border border-white/5 text-left max-w-[320px]">
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  <strong className="text-yellow-400 font-extrabold">Price Pool Growth:</strong> Every single bid placed increases the total stake. The ultimate Winner at the end of the countdown gets <strong className="text-emerald-400 font-bold">50% (half of the bidded price)</strong> of all total bidded money!
                </p>
              </div>
 
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  <strong className="text-cyan-400 font-extrabold">1-Minute Timer:</strong> A persistent 1-minute countdown timer. Bots will bid actively but <strong className="text-yellow-400 font-bold">can never bid more than ₹500</strong>.
                </p>
              </div>
 
              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  <strong className="text-amber-400 font-extrabold">₹{entryFee} Entry Fee:</strong> Deducted from your balance upon joining.
                </p>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="w-5 h-5 rounded bg-yellow-400/10 border border-yellow-500/20 text-rose-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <p className="text-[10px] text-gray-300 leading-tight">
                  <strong className="text-rose-400 font-extrabold">Last-Second Extension:</strong> Placing a bid in the last 15 seconds extends the timer back to 15s, ensuring the last active bidder gets the prize pool!
                </p>
              </div>
            </div>
          </div>
 
          {/* Choose Entry Amount - Styled as requested like the screenshot */}
          <div className="w-full flex flex-col items-center gap-3 py-3 max-w-[320px] mx-auto" id="choose-entry-amount-section">
            {/* Winnings Estimation Card (similar to the purple card in screenshot with golden trophy) */}
            <div className="bg-gradient-to-r from-purple-900/50 to-slate-900/80 border border-purple-500/20 px-4 py-2 rounded-2xl flex items-center justify-center gap-3 w-full shadow-lg">
              <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shrink-0">
                <Trophy className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400/10" />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-bold text-purple-300 font-mono uppercase tracking-widest block leading-none mb-0.5">ESTIMATED WINNINGS</span>
                <span className="text-sm font-black text-white font-mono leading-none">₹{(entryFee * 8).toLocaleString('en-IN')}+</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-1.5 text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider font-mono">Choose Entry Amount</span>
              
              <div className="flex justify-between items-center w-full gap-2 px-1">
                {[2, 5, 10, 20, 50, 100].map((fee) => {
                  const isSelected = entryFee === fee;
                  return (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => {
                        setEntryFee(fee);
                        setCustomError('');
                        audio.playCoin();
                      }}
                      className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full border transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-tr from-yellow-500 to-amber-500 border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.4)] scale-110 z-10'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <span className={`text-[11px] font-black font-mono ${isSelected ? 'text-slate-950' : 'text-gray-300'}`}>
                        ₹{fee}
                      </span>
                      {fee === 20 && (
                        <span className="absolute -bottom-1 bg-rose-500 text-[5px] font-extrabold text-white font-sans px-1 rounded-full uppercase scale-90 border border-slate-950">
                          HOT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wallet & Entry Fee Status info */}
          <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-white/5 flex flex-col gap-1 text-center max-w-[320px] mx-auto mb-3 text-left">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-gray-400">Entry Fee Required:</span>
              <span className="text-yellow-400 font-bold">₹{entryFee} Cash</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono border-t border-white/5 pt-1 mt-1">
              <span className="text-gray-400">Your Wallet Balance:</span>
              <span className={`${profile.coins >= entryFee ? 'text-emerald-400' : 'text-rose-400'} font-bold`}>₹{profile.coins}</span>
            </div>
            
            {profile.coins < entryFee && (
              <div className="flex justify-between items-center bg-rose-500/10 p-2 rounded border border-rose-500/20 mt-2 text-[9px] font-mono text-rose-400 text-left">
                <span>Low balance for ₹{entryFee} entry fee.</span>
                <button
                  type="button"
                  onClick={onOpenDepositModal}
                  className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 font-bold hover:bg-yellow-350 cursor-pointer text-[8.5px]"
                >
                  💳 Add Money
                </button>
              </div>
            )}

            {customError && (
              <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1 font-mono leading-tight mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {customError}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartBidding}
            className="w-full bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_4px_15px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2"
          >
            <span>ENTER BIDDING ROOM</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* 2. ACTIVE BIDDING ARENA */}
      {phase === 'bidding' && (
        <div className="flex-1 flex flex-col justify-between h-full gap-3" id="auction-live-view">
          
          {/* Header Bar */}
          <div className="flex justify-between items-center bg-slate-950/70 p-2.5 rounded-xl border border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">LIVE AUCTION HALL</span>
            </div>
            
            {/* Timer Banner */}
            <div className="flex items-center gap-1 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[11px] font-mono font-black text-yellow-400 tracking-wide">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Close but alert */}
            <button
              type="button"
              onClick={() => {
                if (confirm('If you leave now, your active bids will still run, but you might lose track of outbids! Still leave?')) {
                  onClose();
                }
              }}
              className="text-[9.5px] font-mono font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase hover:bg-rose-500/20 cursor-pointer"
            >
              Exit
            </button>
          </div>

          <AnimatePresence>
            {showExtensionAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2 flex items-center justify-center gap-2 flex-shrink-0 shadow-lg shadow-red-500/5"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[10px] font-black text-rose-400 font-mono uppercase tracking-wider text-center leading-none">
                  ⚡ LAST-SECOND BID! TIMER EXTENDED BY 15s! ⏳
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats Panel: Total Bids, Prize Pool (50%), Highest Bid */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {/* Prize Pool */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-950 p-2.5 rounded-xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-1 bottom-1 opacity-10">
                <DollarSign className="w-12 h-12 text-emerald-400" />
              </div>
              <span className="text-[8px] font-bold text-emerald-400 font-mono uppercase tracking-wider">🎁 PRIZE POOL (50% OF BIDS)</span>
              <span className="text-lg font-black text-white font-mono mt-0.5">₹{prizePool.toLocaleString('en-IN')}</span>
              <span className="text-[7.5px] text-gray-500 font-mono mt-0.5">Total bidded: ₹{totalBiddedAmount}</span>
            </div>

            {/* Highest Bid */}
            <div className="bg-gradient-to-br from-yellow-950/40 to-slate-950 p-2.5 rounded-xl border border-yellow-500/20 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-1 bottom-1 opacity-10">
                <Gavel className="w-12 h-12 text-yellow-400" />
              </div>
              <span className="text-[8px] font-bold text-yellow-400 font-mono uppercase tracking-wider">🔨 HIGHEST SINGLE BID</span>
              <span className="text-lg font-black text-yellow-400 font-mono mt-0.5">₹{currentHighestBid}</span>
              <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                <span className="text-[9px] shrink-0">{highestBidder?.avatar || '👤'}</span>
                <span className="text-[7.5px] text-gray-400 font-mono truncate uppercase font-bold">
                  {highestBidder?.isUser ? 'YOU (LEADER)' : highestBidder?.name || 'No bids yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Area: Enter bid */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2.5 flex-shrink-0 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">⚔️ YOUR BIDDING PANEL</span>
              <span className="text-[9px] font-mono text-gray-500">Balance: <strong className="text-yellow-400 font-bold">₹{profile.coins}</strong></span>
            </div>

            {/* Quick Increment suggestions */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
              <span className="text-[8.5px] text-gray-500 font-mono uppercase self-center shrink-0">Quick Bid:</span>
              {[10, 20, 50, 100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickBid(inc)}
                  className="text-[9px] font-mono font-black px-2 py-1 rounded bg-slate-900 border border-white/5 text-yellow-400 hover:border-yellow-500/30 hover:bg-slate-850 cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  +{inc}
                </button>
              ))}
            </div>

            {/* Bid Input Form */}
            <form onSubmit={handlePlaceBid} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold font-mono text-gray-500">₹</span>
                <input
                  type="number"
                  placeholder={`Min bid ₹${currentHighestBid + 1}`}
                  value={bidAmountInput}
                  onChange={(e) => {
                    setBidAmountInput(e.target.value);
                    setCustomError('');
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-6 pr-2 text-xs font-mono font-black text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider cursor-pointer active:scale-95 transition-all shrink-0 shadow-[0_2px_8px_rgba(234,179,8,0.2)] flex items-center gap-1"
              >
                <Gavel className="w-3 h-3 stroke-[2.5]" />
                <span>PLACE BID</span>
              </button>
            </form>

            {customError && (
              <span className="text-[8px] text-red-400 font-bold flex items-center gap-1 font-mono leading-tight">
                <AlertTriangle className="w-3 h-3" />
                {customError}
              </span>
            )}

            {/* Deposit Quick Trigger when balance is dry */}
            {profile.coins < currentHighestBid + 10 && (
              <div className="flex justify-between items-center bg-yellow-400/5 p-2 rounded border border-yellow-500/10">
                <span className="text-[8px] text-yellow-500 uppercase font-mono font-bold">Your cash is lower than current bid!</span>
                <button
                  type="button"
                  onClick={onOpenDepositModal}
                  className="text-[8px] font-mono font-black bg-yellow-400 text-slate-950 px-2 py-0.5 rounded uppercase cursor-pointer"
                >
                  💳 Add Money
                </button>
              </div>
            )}
          </div>

          {/* Bid logs & scrolling console */}
          <div className="flex-1 min-h-[140px] flex flex-col bg-slate-950/80 rounded-xl border border-white/5 overflow-hidden text-left relative">
            <div className="bg-slate-900/60 px-3 py-1.5 border-b border-white/5 flex justify-between items-center shrink-0">
              <span className="text-[9px] font-mono text-gray-400 font-bold uppercase flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Live Auction Stream logs
              </span>
              <span className="text-[7.5px] text-gray-500 font-mono">Bids placed in room</span>
            </div>

            {/* Log list container */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 scrollbar-thin">
              {bids.length === 0 ? (
                <div className="m-auto text-center py-6 text-gray-600 font-mono text-[9px] uppercase">
                  Awaiting first auction entries...
                </div>
              ) : (
                bids.map((b) => (
                  <div 
                    key={b.id} 
                    className={`flex justify-between items-center p-2 rounded-lg border text-sans transition-all duration-300 ${
                      b.isUser 
                        ? 'bg-yellow-500/5 border-yellow-500/20' 
                        : 'bg-slate-900/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="text-xs shrink-0">{b.bidderAvatar}</span>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[9.5px] font-black truncate ${b.isUser ? 'text-yellow-400 font-extrabold' : 'text-gray-300'}`}>
                          {b.bidderName} {b.isUser && '(You)'}
                        </span>
                        <span className="text-[7.5px] text-gray-500 font-mono">{b.timestamp}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs font-mono font-black ${b.isUser ? 'text-yellow-400' : 'text-cyan-400'}`}>
                        ₹{b.bidAmount}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Absolute indicator for who owns the winning bid */}
            <div className="absolute bottom-2 inset-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-white/5 flex items-center justify-between shadow-lg select-none z-10 shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className={`w-4 h-4 shrink-0 ${highestBidder?.isUser ? 'text-yellow-400 animate-bounce' : 'text-gray-500'}`} />
                <div className="flex flex-col text-left">
                  <span className="text-[7.5px] font-mono text-gray-500 uppercase">Current Leading Owner</span>
                  <span className="text-[9.5px] font-black text-white truncate max-w-[120px]">
                    {highestBidder?.isUser ? '🦊 Sarvesh Kadam (You)' : `${highestBidder?.avatar || '🤖'} ${highestBidder?.name || 'No leading bid'}`}
                  </span>
                </div>
              </div>
              
              <div className="text-right flex flex-col">
                <span className="text-[7.5px] font-mono text-gray-500 uppercase">Est. Win Yield (50%)</span>
                <span className="text-[11px] font-mono font-black text-emerald-400">
                  ₹{prizePool}
                </span>
              </div>
            </div>
          </div>

          {/* Cheat Fast Forward (Helper to make 1m playable in preview) */}
          <div className="flex justify-between items-center py-1 flex-shrink-0">
            <span className="text-[8px] font-mono text-gray-600">Testing short-cut:</span>
            <button
              type="button"
              onClick={handleFastForward}
              disabled={timeLeft <= 15}
              className="text-[8px] font-mono font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider hover:bg-cyan-500/25 active:scale-95 disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-2.5 h-2.5 text-yellow-400" /> Fast Forward (Jump to final 15s)
            </button>
          </div>

        </div>
      )}

      {/* 3. AUCTION ENDED RESULTS */}
      {phase === 'ended' && (
        <div className="flex-1 flex flex-col justify-between py-6" id="auction-result-view">
          
          <div className="my-auto text-center flex flex-col items-center gap-4">
            
            {/* Visual Trophy or Defeat block */}
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl relative"
            >
              {isWinner ? (
                <>
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping" />
                  <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-yellow-200 z-10 shadow-lg">
                    <Trophy className="w-10 h-10 text-slate-950 stroke-[2.5]" />
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 z-10">
                  <span className="text-4xl">💀</span>
                </div>
              )}
            </motion.div>

            {/* Verdict Header */}
            <div>
              <h1 className={`text-3xl font-black italic uppercase tracking-wider ${isWinner ? 'text-yellow-400 text-glow-yellow' : 'text-rose-500'}`}>
                {isWinner ? 'VICTORY!' : 'DEFEAT!'}
              </h1>
              <p className="text-xs text-gray-400 mt-1 uppercase font-mono tracking-widest">
                AUCTION TIMER CONCLUDED
              </p>
            </div>

            {/* Stake summary box */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5 w-full max-w-[300px] flex flex-col gap-2.5 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase">FINAL PRICE POOL (50%)</span>
                <span className="text-xs font-mono font-black text-emerald-400">₹{prizePool}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase">TOTAL BIDDED (ALL)</span>
                <span className="text-xs font-mono text-white font-bold">₹{totalBiddedAmount}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase">YOUR TOTAL BET STAKE</span>
                <span className="text-xs font-mono text-yellow-400 font-bold">₹{userTotalBidded}</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                <span className="text-[8.5px] font-mono text-gray-500 uppercase">WINNING BID OWNER</span>
                <span className="text-[10px] font-mono text-cyan-400 font-extrabold flex items-center gap-1 uppercase">
                  {highestBidder?.avatar || '👤'} {highestBidder?.isUser ? 'YOU (Sarvesh)' : highestBidder?.name || 'No bids'}
                </span>
              </div>
            </div>

            {/* Descriptive yield message */}
            <p className="text-xs text-gray-400 max-w-[260px] leading-relaxed">
              {isWinner 
                ? `Marvelous bidding strategy! You held the highest bid of ₹${currentHighestBid} and earned the prize pool of ₹${prizePool} cash added instantly to your wallet.`
                : `Outbid in the final seconds! ${highestBidder?.name} took the crown with a bid of ₹${currentHighestBid}. Adjust your bidding times next round!`
              }
            </p>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-900 border border-white/10 text-white font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all duration-150 cursor-pointer hover:bg-slate-850"
          >
            RETURN TO ARCADE LOBBY
          </button>
        </div>
      )}

    </div>
  );
}
