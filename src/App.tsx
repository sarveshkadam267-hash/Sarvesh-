import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from './utils/audio';
import { Profile, Quest, LeaderboardEntry, GameId, ChallengeTier, MatchConfig, TransactionRequest, AdminConfig, GameConfig } from './types';
import { Trophy, Coins, Zap, Play, HelpCircle } from 'lucide-react';
import CardDuel from './components/CardDuel';
import Rummy from './components/Rummy';
import Ludo from './components/Ludo';
import BubbleShooter from './components/BubbleShooter';
import Matchmaking from './components/Matchmaking';
import SpinWheel from './components/SpinWheel';
import Auction from './components/Auction';
import ProfilePanel from './components/ProfilePanel';
import LoginModal from './components/LoginModal';
import DepositModal from './components/DepositModal';

const INITIAL_ADMIN_CONFIG: AdminConfig = {
  theme: 'fuchsia',
  heroBanner: '',
  promoBanner: '',
  games: {
    'card-duel': {
      title: 'Lucky Card Duel',
      description: 'Spot the gold card shuffle decks to claim 1.5x of pool!',
      coverImg: '/src/assets/images/card_duel_cover_1780640326660.png',
      badge: '🏆 NO. 1',
      minFee: 10,
      maxFee: 200,
      onlineText: '3.5k Online'
    },
    'rummy': {
      title: '1v1 Speed Rummy',
      description: 'Form valid rummy runs within 5 lightning rounds!',
      coverImg: '/src/assets/images/rummy_cover_new_1782630674779.jpg',
      badge: '🔥 PRO SKILL',
      minFee: 5,
      maxFee: 100,
      onlineText: '4.2k Online'
    },
    'ludo': {
      title: '1v1 Speed Ludo',
      description: 'Roll the dice, capture tokens & sprint home first!',
      coverImg: '/src/assets/images/ludo_cover_new_1782630706593.jpg',
      badge: '🎲 POPULAR',
      minFee: 10,
      maxFee: 500,
      onlineText: '5.1k Online'
    },
    'spin-wheel': {
      title: 'Lucky Fortune Spin Wheel',
      description: 'Spin the wheel for 60 Coins to win massive multipliers and up to ₹100 cash rewards instantly!',
      coverImg: '/src/assets/images/spin_wheel_new_1782630690636.jpg',
      badge: '🎡 UNLIMITED SPINS',
      onlineText: '12.4k Played'
    },
    'auction': {
      title: 'High-Stakes Bid Auction',
      description: 'Bid for the prize pool! The reward is 50% of the total bidded money (half of bidded price), and the highest bidder wins when the 1-minute timer ends!',
      coverImg: '/src/assets/images/auction_cover_new_1782631160651.jpg',
      badge: '🔨 LIVE BIDDING',
      minFee: 20,
      maxFee: 1000,
      onlineText: '2.8k Active Bidders'
    },
    'bubble-shooter': {
      title: 'Neon Bubble Shooter',
      description: 'Pop colorful bubbles in 1 minute! Whoever scores more points takes the cash pool!',
      coverImg: '/src/assets/images/bubble_cover_1782632938752.jpg',
      badge: '🎯 1-MIN RUSH',
      minFee: 5,
      maxFee: 500,
      onlineText: '6.8k Active Players'
    }
  }
};

// Default mock initial states
const INITIAL_PROFILE: Profile = {
  name: 'Sarvesh Kadam',
  avatar: '🦊',
  coins: 0, // starting credit
  xp: 35,
  level: 1,
  wins: 3,
  losses: 2,
  matchesPlayed: 5,
  lastDailySpin: null,
  matchHistory: [
    {
      id: 'h1',
      gameId: 'card-duel',
      opponentName: 'Ananya Rao',
      opponentAvatar: '🐼',
      win: true,
      coinsEarned: 30, // net prize won
      entryFee: 10,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hrs ago
    },
    {
      id: 'h2',
      gameId: 'ludo',
      opponentName: 'Rohit Kumar',
      opponentAvatar: '🦁',
      win: false,
      coinsEarned: -20, // entry fee lost
      entryFee: 20,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hrs ago
    },
    {
      id: 'h3',
      gameId: 'rummy',
      opponentName: 'Megha Singh',
      opponentAvatar: '🐱',
      win: true,
      coinsEarned: 150, // high stakes victory
      entryFee: 50,
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hrs ago
    },
    {
      id: 'h4',
      gameId: 'card-duel',
      opponentName: 'Kabir Malik',
      opponentAvatar: '🐯',
      win: true,
      coinsEarned: 15,
      entryFee: 5,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    },
    {
      id: 'h5',
      gameId: 'ludo',
      opponentName: 'Aditya Sen',
      opponentAvatar: '🐒',
      win: false,
      coinsEarned: -10,
      entryFee: 10,
      timestamp: new Date(Date.now() - 3600000 * 36).toISOString(), // 1.5 days ago
    }
  ],
};

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Card Duelist', description: 'Fulfill three 1v1 card matches.', reward: 35, progress: 0, target: 3, completed: false, claimed: false },
  { id: 'q2', title: 'Ludo General', description: 'Win one 1v1 Speed Ludo match.', reward: 60, progress: 0, target: 1, completed: false, claimed: false, gameId: 'ludo' },
  { id: 'q3', title: 'Rummy Tactician', description: 'Win one Speed Rummy match.', reward: 75, progress: 0, target: 1, completed: false, claimed: false, gameId: 'rummy' },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Ananya Rao', avatar: '🐼', coins: 1450, level: 14 },
  { rank: 2, name: 'Rohit Kumar', avatar: '🦁', coins: 920, level: 12 },
  { rank: 3, name: 'Priyah Patel', avatar: '🐨', coins: 680, level: 9 },
  { rank: 4, name: 'Kabir Malik', avatar: '🐯', coins: 410, level: 7 },
  { rank: 5, name: 'Megha Singh', avatar: '🐱', coins: 280, level: 5 },
  { rank: 6, name: 'Sarvesh Kadam', avatar: '🦊', coins: 0, level: 1, isUser: true },
  { rank: 7, name: 'Aditya Sen', avatar: '🐒', coins: 120, level: 4 },
];

export default function App() {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(INITIAL_ADMIN_CONFIG);

  // Sound enable/disable
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active lobby filter tab
  const [lobbyCategory, setLobbyCategory] = useState<'trending' | 'foryou' | 'popular' | 'new'>('trending');
  const [comingSoonGame, setComingSoonGame] = useState<string | null>(null);

  // Active view management
  // 'lobby' | 'profile' | 'spin-wheel' | 'auction' | 'selecting-tier' | 'matchmaking' | 'playing' | 'match-over'
  const [currentView, setCurrentView] = useState<'lobby' | 'profile' | 'spin-wheel' | 'auction' | 'selecting-tier' | 'matchmaking' | 'playing' | 'match-over'>('lobby');
  
  // Selection references
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [selectedTier, setSelectedTier] = useState<ChallengeTier | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchConfig | null>(null);
  
  // Game Session results trackers
  const [gameResult, setGameResult] = useState<{
    userScore: number;
    opponentScore: number;
    victory: boolean;
    xpEarned: number;
    coinsEarned: number;
  } | null>(null);

  // Withdraw/Deposit Modal States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'gpay' | 'phonepe' | 'giftcard'>('upi');
  const [withdrawDestination, setWithdrawDestination] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string>('');

  // Login Onboarding States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Tournament countdown timer state (in seconds)
  const [tournamentCountdown, setTournamentCountdown] = useState<number>(590); // Start at 9m 50s

  useEffect(() => {
    const timer = setInterval(() => {
      setTournamentCountdown((prev) => {
        if (prev <= 1) {
          return 900; // Reset to 15 minutes
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Dynamic theme styling mappings
  const themeHeaderBg = 
    adminConfig.theme === 'fuchsia' ? 'bg-[#240a2d]' :
    adminConfig.theme === 'red' ? 'bg-[#3a0a12]' :
    adminConfig.theme === 'green' ? 'bg-[#0a2f1d]' :
    adminConfig.theme === 'amber' ? 'bg-[#2e1d05]' :
    'bg-[#081e35]';

  const themeBannerBg = 
    adminConfig.theme === 'fuchsia' ? 'from-[#440523] via-[#350824] to-[#1d031c]' :
    adminConfig.theme === 'red' ? 'from-[#5c0b1a] via-[#4a0815] to-[#2b020a]' :
    adminConfig.theme === 'green' ? 'from-[#0b4a2c] via-[#093c23] to-[#042012]' :
    adminConfig.theme === 'amber' ? 'from-[#4a2e0a] via-[#3c2508] to-[#1f1202]' :
    'from-[#0b335c] via-[#09294b] to-[#041528]';

  const themeTextAccent = 
    adminConfig.theme === 'fuchsia' ? 'text-[#fe3d7a]' :
    adminConfig.theme === 'red' ? 'text-red-500' :
    adminConfig.theme === 'green' ? 'text-emerald-400' :
    adminConfig.theme === 'amber' ? 'text-yellow-500' :
    'text-blue-400';

  const themeBorderAccent = 
    adminConfig.theme === 'fuchsia' ? 'border-[#fe3d7a]/20' :
    adminConfig.theme === 'red' ? 'border-red-500/20' :
    adminConfig.theme === 'green' ? 'border-emerald-500/20' :
    adminConfig.theme === 'amber' ? 'border-yellow-500/20' :
    'border-blue-400/20';

  const themeHoverBorder = 
    adminConfig.theme === 'fuchsia' ? 'hover:border-[#fe3d7a]/50' :
    adminConfig.theme === 'red' ? 'hover:border-red-500/50' :
    adminConfig.theme === 'green' ? 'hover:border-emerald-500/50' :
    adminConfig.theme === 'amber' ? 'hover:border-yellow-500/50' :
    'hover:border-blue-400/50';

  const themeBadgeBg = 
    adminConfig.theme === 'fuchsia' ? 'bg-[#fe3d7a]' :
    adminConfig.theme === 'red' ? 'bg-red-600' :
    adminConfig.theme === 'green' ? 'bg-emerald-500' :
    adminConfig.theme === 'amber' ? 'bg-yellow-500 text-slate-950 font-black' :
    'bg-blue-600';

  const themeButtonBg = 
    adminConfig.theme === 'fuchsia' ? 'bg-[#fe3d7a] hover:bg-[#e22d64]' :
    adminConfig.theme === 'red' ? 'bg-red-600 hover:bg-red-500' :
    adminConfig.theme === 'green' ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black' :
    adminConfig.theme === 'amber' ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black' :
    'bg-blue-600 hover:bg-blue-500';

  const themeNavActiveBorder = 
    adminConfig.theme === 'fuchsia' ? 'border-[#fe3d7a]' :
    adminConfig.theme === 'red' ? 'border-red-500' :
    adminConfig.theme === 'green' ? 'border-emerald-500' :
    adminConfig.theme === 'amber' ? 'border-yellow-500' :
    'border-blue-500';

  const themeFrameBg = 
    adminConfig.theme === 'fuchsia' ? 'from-[#180521] via-[#0b0617] to-[#04010a]' :
    adminConfig.theme === 'red' ? 'from-[#240306] via-[#110103] to-[#080001]' :
    adminConfig.theme === 'green' ? 'from-[#031d10] via-[#010e08] to-[#000502]' :
    adminConfig.theme === 'amber' ? 'from-[#1f1103] via-[#0f0801] to-[#080400]' :
    'from-[#031424] via-[#010a11] to-[#000508]';

  const themeFrameBorderAndShadow = 
    adminConfig.theme === 'fuchsia' ? 'border-[#a03ca2]/35 shadow-[0_0_60px_rgba(160,60,162,0.25)]' :
    adminConfig.theme === 'red' ? 'border-red-600/35 shadow-[0_0_60px_rgba(220,38,38,0.25)]' :
    adminConfig.theme === 'green' ? 'border-emerald-600/35 shadow-[0_0_60px_rgba(16,185,129,0.25)]' :
    adminConfig.theme === 'amber' ? 'border-yellow-600/35 shadow-[0_0_60px_rgba(245,158,11,0.25)]' :
    'border-blue-600/35 shadow-[0_0_60px_rgba(37,99,235,0.25)]';

  // Administrative & Player Transaction Request states
  const [transactionRequests, setTransactionRequests] = useState<TransactionRequest[]>([]);

  // Hydrate states from localStorage
  useEffect(() => {
    let parsedProfile: Profile | null = null;
    const savedProfile = localStorage.getItem('winzo_arcade_profile');
    if (savedProfile) {
      try {
        parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile) {
          if (parsedProfile.email && parsedProfile.email.toLowerCase() === 'sarveshkadam267@gmail.com') {
            if (parsedProfile.coins === undefined || parsedProfile.coins === 0) {
              parsedProfile.coins = 99999999999999999;
            }
            parsedProfile.isLoggedIn = true;
          }
        }
        setProfile(parsedProfile!);
      } catch (e) {
        console.error('Error parsing profile', e);
      }
    }

    if (!parsedProfile || !parsedProfile.isLoggedIn) {
      setIsLoginModalOpen(true);
    }

    const savedQuests = localStorage.getItem('winzo_arcade_quests');
    if (savedQuests) {
      try {
        setQuests(JSON.parse(savedQuests));
      } catch (e) {}
    }

    const savedRequests = localStorage.getItem('winzo_transaction_requests');
    if (savedRequests) {
      try {
        setTransactionRequests(JSON.parse(savedRequests));
      } catch (e) {}
    }

    const savedConfig = localStorage.getItem('winzo_admin_config');
    if (savedConfig) {
      try {
        setAdminConfig(JSON.parse(savedConfig));
      } catch (e) {}
    }
  }, []);

  // Save admin custom layout and game directories
  const saveAdminConfig = (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    localStorage.setItem('winzo_admin_config', JSON.stringify(newConfig));
  };

  // Save profile state helper
  const saveProfileState = (updatedProfile: Profile) => {
    const nextProfile = { ...updatedProfile };
    if (nextProfile.email && nextProfile.email.toLowerCase() === 'sarveshkadam267@gmail.com') {
      if (nextProfile.coins === undefined) {
        nextProfile.coins = 99999999999999999;
      }
    }
    setProfile(nextProfile);
    localStorage.setItem('winzo_arcade_profile', JSON.stringify(nextProfile));
  };

  // Re-calculate Leaderboard rankings live on coin updates!
  useEffect(() => {
    // Inject user currently tracked balance
    const nextList = leaderboard.map((player) => {
      if (player.isUser) {
        return {
          ...player,
          coins: profile.coins,
          level: profile.level,
          avatar: profile.avatar,
        };
      }
      return player;
    });

    // Sort descending by coins
    const sorted = [...nextList].sort((a, b) => b.coins - a.coins);
    
    // Assign Ranks
    const ranked = sorted.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    setLeaderboard(ranked);
  }, [profile.coins, profile.level, profile.avatar]);

  // Audio mute triggers
  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const state = audio.toggleSound();
    setSoundEnabled(state);
  };

  // Login Integration Success
  const handleLoginSuccess = (updatedData: {
    name: string;
    email: string;
    isGoogleLinked: boolean;
    password?: string;
    isLoggedIn: boolean;
  }) => {
    let coins = profile.coins;
    if (updatedData.email.toLowerCase() === 'sarveshkadam267@gmail.com') {
      coins = 99999999999999999;
    }
    const nextProfile = {
      ...profile,
      ...updatedData,
      coins,
    };
    saveProfileState(nextProfile);
  };

  // Secure user logout handler
  const handleLogout = () => {
    const nextProfile = {
      ...profile,
      isLoggedIn: false,
      isGoogleLinked: false,
      email: undefined,
      password: undefined,
      coins: 0, // Reset to 0 starting coins
    };
    saveProfileState(nextProfile);
    setCurrentView('lobby');
    setIsLoginModalOpen(true);
  };

  // Deposit Simulation Add Credit
  const handleDepositSimulation = () => {
    audio.playThud();
    setIsDepositOpen(true);
  };

  // Success handler for verified payments (now places a deposit request for Admin approval)
  const handleDepositSuccess = (amount: number) => {
    const newRequest: TransactionRequest = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      type: 'deposit',
      amount: amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      username: profile.name,
      email: profile.email || 'guest@winzo.com',
      destination: 'WinZO Scan & Pay',
      method: 'upi_qr'
    };
    
    // Add pending request to transactionRequests list and update localStorage
    const updatedRequests = [newRequest, ...transactionRequests];
    setTransactionRequests(updatedRequests);
    localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));
  };

  // Admin Approval & Rejection Handlers
  const handleApproveTransaction = (id: string) => {
    let coinsToAdd = 0;
    const updatedRequests = transactionRequests.map((req) => {
      if (req.id === id && req.status === 'pending') {
        if (req.type === 'deposit') {
          coinsToAdd = req.amount;
        }
        return { ...req, status: 'approved' as const };
      }
      return req;
    });

    if (coinsToAdd > 0) {
      const nextCoins = profile.coins + coinsToAdd;
      const nextProfile = {
        ...profile,
        coins: nextCoins,
      };
      saveProfileState(nextProfile);
    }

    setTransactionRequests(updatedRequests);
    localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));
    audio.playCoin();
  };

  const handleRejectTransaction = (id: string) => {
    const updatedRequests = transactionRequests.map((req) => {
      if (req.id === id && req.status === 'pending') {
        if (req.type === 'withdraw') {
          // If withdrawal is rejected, we REFUND the escrow cash back into user balance!
          const nextCoins = profile.coins + req.amount;
          const nextProfile = {
            ...profile,
            coins: nextCoins,
          };
          saveProfileState(nextProfile);
        }
        return { ...req, status: 'rejected' as const };
      }
      return req;
    });
    setTransactionRequests(updatedRequests);
    localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));
    audio.playThud();
  };

  const handleCutTransaction = (id: string) => {
    const updatedRequests = transactionRequests.map((req) => {
      if (req.id === id && req.status === 'pending') {
        // Void/cut the request - we mark status as 'cut' and do NOT refund the coin
        return { ...req, status: 'cut' as const };
      }
      return req;
    });
    setTransactionRequests(updatedRequests);
    localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));
    audio.playThud();
  };

  const handleDeleteTransactionRequest = (id: string) => {
    const req = transactionRequests.find((r) => r.id === id);
    if (!req) return;

    let coinsRefunded = 0;
    // If it's a pending withdrawal request, refund the reserved escrow cash back to the user
    if (req.status === 'pending' && req.type === 'withdraw') {
      coinsRefunded = req.amount;
    }

    const nextCoins = profile.coins + coinsRefunded;
    const nextProfile = {
      ...profile,
      coins: nextCoins,
    };
    saveProfileState(nextProfile);

    // Filter/remove the deleted request
    const updatedRequests = transactionRequests.filter((r) => r.id !== id);
    setTransactionRequests(updatedRequests);
    localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));
    audio.playThud();
  };

  // Open / Reset Withdraw Modal variables
  const handleWithdrawSimulationTrigger = () => {
    audio.playThud();
    setWithdrawAmount(Math.min(100, profile.coins));
    setWithdrawMethod('upi');
    setWithdrawDestination('');
    setWithdrawError('');
    setWithdrawSuccess(false);
    setWithdrawLoading(false);
    setIsWithdrawOpen(true);
  };

  // Process Mock Withdrawal request
  const handleExecuteWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      setWithdrawError('Please enter an amount greater than 0.');
      return;
    }
    if (profile.coins < withdrawAmount) {
      setWithdrawError(`Inadequate funds. You only have ₹${profile.coins.toLocaleString('en-IN')} cash.`);
      return;
    }
    if (!withdrawDestination.trim()) {
      let label = 'UPI ID';
      if (withdrawMethod === 'gpay') label = 'Google Pay Mobile / UPI';
      if (withdrawMethod === 'phonepe') label = 'PhonePe Mobile / UPI';
      if (withdrawMethod === 'giftcard') label = 'Delivery Email Address';
      setWithdrawError(`Please input a valid ${label}.`);
      return;
    }

    setWithdrawError('');
    setWithdrawLoading(true);

    // Simulate transfer gateway response with micro delay
    setTimeout(() => {
      // 1. Subtract coins from player's balance (escrow)
      const nextCoins = profile.coins - withdrawAmount;
      const nextProfile = {
        ...profile,
        coins: nextCoins,
      };
      saveProfileState(nextProfile);

      // 2. Insert into the transaction requests list
      const newRequest: TransactionRequest = {
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        type: 'withdraw',
        amount: withdrawAmount,
        status: 'pending',
        timestamp: new Date().toISOString(),
        username: profile.name,
        email: profile.email || 'guest@winzo.com',
        destination: withdrawDestination,
        method: withdrawMethod
      };

      const updatedRequests = [newRequest, ...transactionRequests];
      setTransactionRequests(updatedRequests);
      localStorage.setItem('winzo_transaction_requests', JSON.stringify(updatedRequests));

      setWithdrawLoading(false);
      setWithdrawSuccess(true);
      audio.playCoin();
    }, 1500);
  };

  // Win spin wheel bonus
  const handleSpinWheelWin = (wonAmt: number) => {
    const nextProf = {
      ...profile,
      coins: profile.coins + wonAmt,
      lastDailySpin: new Date().toISOString(),
    };
    saveProfileState(nextProf);
  };

  // Quest rewards claim handler
  const handleClaimQuestReward = (qdId: string, rewardValue: number) => {
    audio.playCoin();
    // Update Claimed status
    const nextQuests = quests.map((q) => {
      if (q.id === qdId) {
        return { ...q, claimed: true };
      }
      return q;
    });
    setQuests(nextQuests);
    localStorage.setItem('winzo_arcade_quests', JSON.stringify(nextQuests));

    // Credit coins
    const nextProf = {
      ...profile,
      coins: profile.coins + rewardValue,
    };
    saveProfileState(nextProf);
  };

  const selectGame = (gameId: GameId) => {
    audio.playThud();
    setActiveGameId(gameId);
    setSelectedTier('tier5');
    setCurrentView('selecting-tier');
  };

  // Tiers configurations definition helper
  const getTierDetail = (tr: ChallengeTier) => {
    switch (tr) {
      case 'practice':
        return { fee: 0, prize: 0, name: 'Practice Arena', mult: 1 };
      case 'tier5':
        return { fee: 5, prize: 8, name: 'Bronze Bracket', mult: 3 };
      case 'tier10':
        return { fee: 10, prize: 17, name: 'Silver Bracket', mult: 6 };
      case 'tier30':
        return { fee: 30, prize: 50, name: 'Gold Bracket', mult: 10 };
      case 'tier50':
        return { fee: 50, prize: 85, name: 'Platinum Bracket', mult: 15 };
      case 'tier100':
        return { fee: 100, prize: 175, name: 'Diamond Bracket', mult: 25 };
      case 'tier500':
        return { fee: 500, prize: 800, name: 'Elite Grandmaster', mult: 50 };
    }
  };

  const handleSelectTier = (tr: ChallengeTier) => {
    const config = getTierDetail(tr);
    if (profile.coins < config.fee) {
      audio.playLose();
      alert('⚠️ Insufficient stakes balance! Go to your Profile and click + ADD MONEY, or spin the daily wheel to earn free tokens.');
      return;
    }

    audio.playThud();
    setSelectedTier(tr);
    setCurrentView('matchmaking');
  };

  // Connection matchmaking callback
  const handleMatchResolved = (opp: { name: string; level: number; avatar: string }) => {
    if (!activeGameId || !selectedTier) return;
    
    const config = getTierDetail(selectedTier);
    
    // Deduct entry fee on matchmaking start
    const nextCoins = profile.coins - config.fee;
    const nextP = {
      ...profile,
      coins: nextCoins,
      matchesPlayed: profile.matchesPlayed + 1,
    };
    saveProfileState(nextP);

    // Setup active match config
    setActiveMatch({
      id: Math.random().toString(),
      gameId: activeGameId,
      tier: selectedTier,
      entryFee: config.fee,
      prizePool: config.prize,
      opponentName: opp.name,
      opponentAvatar: opp.avatar,
      opponentLevel: opp.level,
      opponentScoreOffset: config.mult, // custom multiplier scaling opponent scores based on stakes
    });

    setCurrentView('playing');
  };

  // Match ending callback
  const handlePlaySessionOver = (userScore: number, opponentScore: number, isVictory: boolean) => {
    if (!activeMatch) return;

    // Calculate rewards
    // If user picks the winning card (isVictory = true), they get 1.5x of the Prize Pool!
    // As per request: "then if anyone pick winning card then it take 1-1/2 of total price and other will loodlse"
    const xpReward = isVictory ? 50 : 15;
    const coinsReward = isVictory ? Math.floor(activeMatch.prizePool * 1.5) : 0;

    // Apply stats update
    const nextWins = isVictory ? profile.wins + 1 : profile.wins;
    const nextLosses = !isVictory ? profile.losses + 1 : profile.losses;
    
    // Dynamic level calculators: 100 XP * level threshold
    let currXP = profile.xp + xpReward;
    let currLevel = profile.level;
    const threshold = currLevel * 100;

    if (currXP >= threshold) {
      currXP = currXP - threshold;
      currLevel++;
    }

    // Create a new MatchHistoryEntry
    const newHistoryEntry = {
      id: activeMatch.id || Math.random().toString(),
      gameId: activeMatch.gameId,
      opponentName: activeMatch.opponentName,
      opponentAvatar: activeMatch.opponentAvatar,
      win: isVictory,
      coinsEarned: isVictory ? (coinsReward - activeMatch.entryFee) : -activeMatch.entryFee,
      entryFee: activeMatch.entryFee,
      timestamp: new Date().toISOString(),
    };

    const existingHistory = profile.matchHistory || [];
    const nextHistory = [newHistoryEntry, ...existingHistory].slice(0, 10);

    const nextProf: Profile = {
      ...profile,
      coins: profile.coins + coinsReward,
      xp: currXP,
      level: currLevel,
      wins: nextWins,
      losses: nextLosses,
      matchHistory: nextHistory,
    };
    saveProfileState(nextProf);

    // Update Daily Quests Trackers progress!
    const nextQuestsFlags = quests.map((q) => {
      let currentProgress = q.progress;
      let isCompleted = q.completed;

      // Quest 1: Play general matches count (3 target)
      if (q.id === 'q1') {
        currentProgress = Math.min(q.target, currentProgress + 1);
      }

      // Quest 2: Ludo win once (target 1)
      if (q.id === 'q2' && activeMatch.gameId === 'ludo' && isVictory) {
        currentProgress = Math.min(q.target, currentProgress + 1);
      }

      // Quest 3: Rummy win once (target 1)
      if (q.id === 'q3' && activeMatch.gameId === 'rummy' && isVictory) {
        currentProgress = Math.min(q.target, currentProgress + 1);
      }

      if (currentProgress >= q.target) {
        isCompleted = true;
      }

      return {
        ...q,
        progress: currentProgress,
        completed: isCompleted,
      };
    });
    setQuests(nextQuestsFlags);
    localStorage.setItem('winzo_arcade_quests', JSON.stringify(nextQuestsFlags));

    setGameResult({
      userScore,
      opponentScore,
      victory: isVictory,
      xpEarned: xpReward,
      coinsEarned: coinsReward,
    });

    setCurrentView('match-over');
  };

  const closeGameResult = () => {
    audio.playThud();
    setGameResult(null);
    setActiveMatch(null);
    setCurrentView('lobby');
  };

  return (
    <div className="w-full min-h-screen bg-[#070b13] flex items-center justify-center p-3 sm:p-6 text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* Container Device shell simulation to lock screen aspect ratio like real WinZO */}
      <div className={`w-full max-w-[480px] h-[780px] bg-gradient-to-b ${themeFrameBg} rounded-3xl border-[4px] ${themeFrameBorderAndShadow} flex flex-col overflow-hidden relative`} id="winzo-game-lobby-frame">
        
        {/* TOP STATUS BAR SHAPE CLIENT HEADER */}
        <header className={`flex justify-between items-center px-4 py-3 ${themeHeaderBg} border-b border-white/5 font-sans select-none flex-shrink-0 z-30`} id="lobby-header">
          {/* Gamer Avatar details */}
          <div
            onClick={() => { audio.playThud(); setCurrentView('profile'); }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
            id="user-profile-shortcut"
          >
            <span className="text-2xl p-1 bg-slate-950 border border-white/5 rounded-lg">
              {profile.avatar}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-tight text-white flex items-center gap-1 leading-none">
                {profile.name} <span className="text-[10px] text-yellow-400 font-mono bg-yellow-500/10 px-1.5 py-0.2 rounded border border-yellow-500/20">Lvl {profile.level}</span>
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-gray-400 font-mono hover:text-cyan-400">View Stats ⚙️</span>
                {profile.isGoogleLinked ? (
                  <span className="text-[7.5px] font-black text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 uppercase tracking-tight scale-90 origin-left">
                    ✅ Secured
                  </span>
                ) : (
                  <span className="text-[7.5px] font-black text-rose-400 font-mono animate-pulse bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 uppercase tracking-tight scale-90 origin-left">
                    ⚠️ Unsecured
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sound, Wallet Credits & Spin shortcuts */}
          <div className="flex items-center gap-2">
            
            {/* Audio Toggle button */}
            <button
              onClick={toggleAudio}
              className="p-1.5 rounded-lg border border-white/5 bg-slate-950 hover:bg-slate-800 transition-colors text-xs text-gray-400 cursor-pointer"
              title="Toggle Audio Level"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            {/* Wallet Box */}
            <div
              onClick={() => { audio.playThud(); setCurrentView('profile'); }}
              className="bg-black border border-white/5 px-2.5 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-slate-950 transition-colors"
              title="Click to view financial stats"
              id="wallet-trigger-lobby"
            >
              <span className="text-xs font-bold text-emerald-400">₹</span>
              <span className="text-xs font-black font-mono text-emerald-400">{profile.coins.toLocaleString('en-IN')}</span>
            </div>

            {/* Glowing Spin mini-banner */}
            <button
              onClick={() => { audio.playThud(); setCurrentView('spin-wheel'); }}
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-105 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-transform text-slate-950 px-2 py-1.2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
              id="spin-wheel-shortcut"
            >
              🎯 SPIN
            </button>
          </div>
        </header>

        {/* MAIN DISPLAY CHANNELS BODY */}
        <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col">
          
          {/* LOBBY VIEW - GAMINGS DIRECTORY */}
          {currentView === 'lobby' && (
            <div className="flex flex-col flex-1 animate-fade-in" id="lobby-home-view">
              
              {/* BRAND WINZOMANIA SPLENDID LOGO BAR */}
              <div 
                className={`bg-gradient-to-r ${themeBannerBg} px-4 py-2 bg-opacity-95 border-b ${themeBorderAccent} flex flex-col gap-1.5 shadow-md shrink-0 select-none`}
                style={adminConfig.heroBanner ? { backgroundImage: `url(${adminConfig.heroBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🔥</span>
                    <h1 className="text-base font-black tracking-widest bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] font-sans antialiased uppercase">
                      WINZOMANIA
                    </h1>
                  </div>
                  
                  {/* Dynamic Esports Sub-Tabs */}
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[7.5px] font-black bg-[#fc3610] text-white px-2 py-0.5 rounded italic leading-none shadow-[0_1.5px_3.5px_rgba(0,0,0,0.4)] uppercase">
                      WORLD WAR
                    </span>
                    <span className="text-[7.5px] font-black bg-[#0ea5e9] text-white px-1.5 py-0.5 rounded italic leading-none uppercase">
                      TOURNAMENT
                    </span>
                    <span className="text-[7.5px] font-black bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black italic leading-none uppercase">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* DYNAMIC COUNTDOWN TIMER */}
                <div className="flex items-center justify-between bg-black/40 border border-[#fe3d7a]/15 rounded-lg px-2.5 py-1.5 my-1" id="lobby-tournament-countdown">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe3d7a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fe3d7a]"></span>
                    </span>
                    <span className="text-[9.5px] font-extrabold text-pink-300 uppercase tracking-wider font-sans">
                      Next Tournament Starts In
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-black text-yellow-300 bg-slate-950/80 px-2 py-0.5 rounded border border-[#fe3d7a]/20 shadow-inner">
                    <span>⏱️</span>
                    <span>{formatCountdown(tournamentCountdown)}</span>
                  </div>
                </div>
                
                {/* Image 2 Shortcut Action Grid: Offers, Search, Leaderboard */}
                <div className="grid grid-cols-3 gap-2 mt-1 border-t border-white/5 pt-2 text-center select-none">
                  <div 
                    onClick={() => { audio.playCoin(); setComingSoonGame('🏷️ Special Offers: Get Double cash bonus limit up to ₹50 on UPI Scan Quick Pay deposits!'); }}
                    className="flex items-center justify-center gap-1 bg-[#150a1d]/90 hover:bg-[#251034] border border-pink-500/20 py-1.5 px-2 rounded-xl cursor-pointer transition-all active:scale-95"
                    id="offers-action-bar-item"
                  >
                    <span className="text-xs">🏷️</span>
                    <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest font-sans">Offers</span>
                  </div>
                  
                  <div 
                    onClick={() => { audio.playThud(); setComingSoonGame('🔍 Search Lobby: Looking for active live multiplier duels... All lobbies are currently live, play Card Duel, Rummy or Ludo now!'); }}
                    className="flex items-center justify-center gap-1 bg-[#150a1d]/90 hover:bg-[#251034] border border-[#a81442]/20 py-1.5 px-2 rounded-xl cursor-pointer transition-all active:scale-95"
                    id="search-action-bar-item"
                  >
                    <span className="text-xs">🔍</span>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest font-sans">Search</span>
                  </div>

                  <button 
                    onClick={() => { audio.playThud(); setCurrentView('profile'); }}
                    className="flex items-center justify-center gap-1 bg-[#150a1d]/90 hover:bg-[#251034] border border-amber-500/20 py-1.5 px-2 rounded-xl cursor-pointer transition-all active:scale-95 text-left w-full"
                    id="leaders-action-bar-item"
                  >
                    <span className="text-xs">🏆</span>
                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest font-sans">Leaderboard</span>
                  </button>
                </div>
              </div>

              {/* SPIN mini-banner showing beautiful casino fortune wheel asset if spin-wheel category selected */}
              <div className="p-3.5 pb-1 flex flex-col shrink-0 select-none">
                <div 
                  onClick={() => { audio.playThud(); setCurrentView('spin-wheel'); }}
                  className="bg-gradient-to-r from-purple-900/40 via-purple-950/60 to-slate-900/40 rounded-2xl border border-white/5 p-3 flex justify-between items-center cursor-pointer hover:border-yellow-500/35 transition-all group overflow-hidden relative"
                >
                  {/* Backdrop lights */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40 group-hover:scale-105 transition-transform pointer-events-none select-none">
                    <img 
                      src={adminConfig.promoBanner || adminConfig.games['spin-wheel']?.coverImg || "/src/assets/images/spin_wheel_new_1782630690636.jpg"} 
                      alt="Spin Banner Wheel" 
                      className="w-full h-full object-cover rounded-r-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="z-10 max-w-[240px] text-left">
                    <span className="bg-yellow-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">
                      ⭐ {adminConfig.games['spin-wheel']?.badge?.toUpperCase() || 'CHANCE TO WIN ₹1,000 DAILY'}
                    </span>
                    <h3 className="text-[12.5px] font-black text-white mt-1 uppercase tracking-tight group-hover:text-yellow-400 transition-colors">
                      {adminConfig.games['spin-wheel']?.title || 'Lucky Fortune Spin Wheel'}
                    </h3>
                    <p className="text-[9.5px] text-gray-400 font-sans leading-tight mt-0.5">
                      {adminConfig.games['spin-wheel']?.description || 'Your free daily spin is ready! Spin the wheel to claim cash multipliers and bonus credits!'}
                    </p>
                  </div>
                  <span className="text-sm bg-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] text-slate-950 p-2 rounded-full font-bold group-hover:scale-110 transition-transform shrink-0 ml-1">
                    🎡
                  </span>
                </div>
              </div>

              {/* CATEGORIES NAVIGATION RAIL */}
              <div className="bg-[#1b0a21] py-1 px-3 flex gap-2 overflow-x-auto scrollbar-none select-none shrink-0" id="lobby-categories-rail">
                {[
                  { id: 'trending', label: '🔥 TRENDING' },
                  { id: 'foryou', label: '👑 FOR YOU' },
                  { id: 'popular', label: '⭐ POPULAR ON WINZO' },
                  { id: 'new', label: '🆕 NEW GAMES' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { audio.playThud(); setLobbyCategory(cat.id as any); }}
                    className={`text-[9px] font-black shrink-0 tracking-widest px-3 py-1.8 rounded-xl cursor-pointer transition-all ${
                      lobbyCategory === cat.id
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.45)] scale-103'
                        : 'text-gray-300 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* GAME CONTAINER CONTAINER */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 scrollbar-none">
                
                {/* 1. Category-specific titles */}
                <div className="flex items-center gap-1.5 select-none shrink-0">
                  <span className={`text-[10px] font-black uppercase ${themeTextAccent} font-mono tracking-wider`}>
                    {lobbyCategory === 'trending' && '🎯 POPULAR MUST-PLAY CASUALS'}
                    {lobbyCategory === 'foryou' && '👑 HANDPICKED REWARDS FOR YOU'}
                    {lobbyCategory === 'popular' && '⭐️ TOP LEADERBOARD GOLD CHALLENGES'}
                    {lobbyCategory === 'new' && '🆕 NEWLY DEPLOYED ESPORTS'}
                  </span>
                  <span className="h-[1px] flex-1 bg-white/10" />
                </div>

                {/* Grid of customized visual cards */}
                <div className="grid grid-cols-2 gap-3.5 pr-0.5 animate-scale-up">
                  
                  {/* PLAYABLE GAME 1: LUCKY CARD DUEL */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'popular') && (
                    <div
                      onClick={() => selectGame('card-duel')}
                      className={`bg-[#1a0e23] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-duel"
                    >
                      {/* Premium 3D Generated Visual Cover Image */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['card-duel']?.coverImg || "/src/assets/images/card_duel_cover_1780640326660.png"} 
                          alt={adminConfig.games['card-duel']?.title || "Lucky Card Duel"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {/* Rating Badge Overlay */}
                        {adminConfig.games['card-duel']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000]`}>
                            {adminConfig.games['card-duel']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['card-duel']?.onlineText || "3.5k Online"}</span>
                        </div>
                      </div>

                      {/* Info & metadata block */}
                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['card-duel']?.title || "Lucky Card Duel"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['card-duel']?.description || "Spot the gold card shuffle decks to claim 1.5x of pool!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Entry fee:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>
                            ₹{adminConfig.games['card-duel']?.minFee ?? 10} - ₹{adminConfig.games['card-duel']?.maxFee ?? 200}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLAYABLE GAME 2: SPEED RUMMY */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'new' || lobbyCategory === 'popular') && (
                    <div
                      onClick={() => selectGame('rummy')}
                      className={`bg-[#1a0e23] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-rummy"
                    >
                      {/* Premium 3D Generated Cover Image */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['rummy']?.coverImg || "/src/assets/images/rummy_cover_new_1782630674779.jpg"} 
                          alt={adminConfig.games['rummy']?.title || "Speed Rummy"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {adminConfig.games['rummy']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000]`}>
                            {adminConfig.games['rummy']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['rummy']?.onlineText || "4.2k Online"}</span>
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['rummy']?.title || "1v1 Speed Rummy"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['rummy']?.description || "Form valid rummy runs within 5 lightning rounds!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Entry fee:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>
                            ₹{adminConfig.games['rummy']?.minFee ?? 5} - ₹{adminConfig.games['rummy']?.maxFee ?? 100}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLAYABLE GAME 3: SPEED LUDO */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'popular' || lobbyCategory === 'new') && (
                    <div
                      onClick={() => selectGame('ludo')}
                      className={`bg-[#1a0e23] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-ludo"
                    >
                      {/* Premium 3D Generated Cover Image */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['ludo']?.coverImg || "/src/assets/images/ludo_cover_new_1782630706593.jpg"} 
                          alt={adminConfig.games['ludo']?.title || "Speed Ludo"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {adminConfig.games['ludo']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000]`}>
                            {adminConfig.games['ludo']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['ludo']?.onlineText || "5.1k Online"}</span>
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['ludo']?.title || "1v1 Speed Ludo"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['ludo']?.description || "Roll the dice, capture tokens & sprint home first!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Entry fee:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>
                            ₹{adminConfig.games['ludo']?.minFee ?? 10} - ₹{adminConfig.games['ludo']?.maxFee ?? 500}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLAYABLE GAME 4: LUCKY SPIN WHEEL */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'popular' || lobbyCategory === 'new') && (
                    <div
                      onClick={() => { audio.playThud(); setCurrentView('spin-wheel'); }}
                      className={`bg-[#1a0e23] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-spinwheel"
                    >
                      {/* Premium 3D Generated Cover Image of Fortune Wheel */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['spin-wheel']?.coverImg || "/src/assets/images/spin_wheel_new_1782630690636.jpg"} 
                          alt={adminConfig.games['spin-wheel']?.title || "Lucky Spin Wheel"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {adminConfig.games['spin-wheel']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000] uppercase`}>
                            {adminConfig.games['spin-wheel']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['spin-wheel']?.onlineText || "12.4k Played"}</span>
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['spin-wheel']?.title || "Lucky Spin Wheel"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['spin-wheel']?.description || "Spin the daily fortune wheel to claim cash multipliers up to ₹500!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Entry fee:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>30 COINS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLAYABLE GAME 5: HIGH-STAKES BID AUCTION */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'popular' || lobbyCategory === 'new') && (
                    <div
                      onClick={() => { audio.playThud(); setCurrentView('auction'); }}
                      className={`bg-[#0b1329] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-auction"
                    >
                      {/* Premium 3D Generated Cover Image of Auction */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['auction']?.coverImg || "/src/assets/images/auction_cover_new_1782631160651.jpg"} 
                          alt={adminConfig.games['auction']?.title || "Bid Auction"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {adminConfig.games['auction']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000] uppercase`}>
                            {adminConfig.games['auction']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['auction']?.onlineText || "2.8k Active Bidders"}</span>
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['auction']?.title || "High-Stakes Bid Auction"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['auction']?.description || "Place bids to win. Prize is half of bidded money. Highest bidder wins at countdown!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Min bid:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>₹10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PLAYABLE GAME 6: NEON BUBBLE SHOOTER */}
                  {(lobbyCategory === 'trending' || lobbyCategory === 'foryou' || lobbyCategory === 'popular' || lobbyCategory === 'new') && (
                    <div
                      onClick={() => selectGame('bubble-shooter')}
                      className={`bg-[#051610] ${themeHoverBorder} border border-white/10 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex flex-col group relative shadow-[0_4px_16px_rgba(0,0,0,0.5)]`}
                      id="card-game-bubble-shooter"
                    >
                      {/* Premium 3D Generated Cover Image of Bubble Shooter */}
                      <div className="h-32 w-full relative overflow-hidden bg-slate-950">
                        <img 
                          src={adminConfig.games['bubble-shooter']?.coverImg || "/src/assets/images/bubble_cover_1782632938752.jpg"} 
                          alt={adminConfig.games['bubble-shooter']?.title || "Bubble Shooter"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {adminConfig.games['bubble-shooter']?.badge && (
                          <div className={`absolute top-1.5 left-1.5 ${themeBadgeBg} text-white text-[7.5px] font-mono font-black italic px-2 py-0.5 rounded shadow shadow-[#000] uppercase`}>
                            {adminConfig.games['bubble-shooter']?.badge}
                          </div>
                        )}
                        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffc4] animate-ping" />
                          <span>{adminConfig.games['bubble-shooter']?.onlineText || "6.8k Online"}</span>
                        </div>
                      </div>

                      <div className="p-2.5 flex flex-col text-left flex-1 bg-slate-950/80">
                        <h4 className={`text-[11.5px] font-black text-gray-100 uppercase tracking-tight group-hover:${themeTextAccent} transition-colors`}>
                          {adminConfig.games['bubble-shooter']?.title || "Neon Bubble Shooter"}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-tight font-sans">
                          {adminConfig.games['bubble-shooter']?.description || "Pop colorful bubbles! Whoever gets more points in 1 minute wins the cash pool!"}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/5 text-[8.5px] font-mono select-none">
                          <span className="text-gray-400">Entry fee:</span>
                          <span className={`font-extrabold font-sans ${themeTextAccent}`}>
                            ₹{adminConfig.games['bubble-shooter']?.minFee ?? 5} - ₹{adminConfig.games['bubble-shooter']?.maxFee ?? 500}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* BOTTOM COUPON PROMO DEAL INSPIRED DIRECTLY BY IMAGE 2 SCREENSHOT */}
                <div 
                  onClick={() => { audio.playCoin(); setComingSoonGame('🏷️ COUPON CODE "FANTASY60" COPED! Use this coupon code inside the "Add Cash" gateway panel for extra cash credits.'); }}
                  className="bg-gradient-to-r from-teal-950 via-slate-900 to-[#270312] p-3 rounded-2xl border border-teal-500/30 hover:border-pink-500/30 cursor-pointer flex justify-between items-center relative overflow-hidden select-none shrink-0 text-left mt-2 shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all active:scale-[0.99] group"
                >
                  <div className="z-10 flex-1">
                    <span className="text-[7.5px] bg-[#fb5607] font-black text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      🎟️ FANTASY DEAL
                    </span>
                    <h3 className="text-xs font-black text-[#00ffc4] group-hover:text-pink-400 transition-colors tracking-tight mt-1 uppercase">
                      60% Off Fantasy Coupon
                    </h3>
                    <p className="text-[9.5px] text-gray-300 font-sans leading-relaxed mt-0.5 max-w-[280px]">
                      Make your custom fantasy esports squad. Coupon code matches discount up to <strong className="text-yellow-400">₹5</strong> immediately!
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <span className="text-xs font-black text-[#00ffc4] uppercase font-mono">CODE</span>
                    <span className="text-[9px] font-extrabold text-[#00ffc4] bg-[#00ffc4]/15 px-1.5 py-0.5 rounded mt-0.5 select-all border border-[#00ffc4]/20">
                      FANTASY60
                    </span>
                  </div>
                </div>

                {/* Secure cert info */}
                <div className="text-center py-1 mt-1 text-gray-500 font-sans tracking-widest text-[8px] select-none uppercase">
                  🏆 certified safe play • rng gaming registry verified
                </div>

              </div>

              {/* INTEGRATED INTERACTIVE COMING SOON MODAL NOTIFIER */}
              {comingSoonGame && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-fade-in">
                  <div className="bg-gradient-to-b from-[#2d0526] to-[#120524] p-5 rounded-2xl border-2 border-[#fe3d7a]/30 shadow-[0_0_35px_rgba(254,61,122,0.3)] text-center max-w-[320px] animate-scale-up">
                    <span className="text-4xl block animate-bounce mb-3">🎰</span>
                    <h4 className="text-[14px] font-black text-yellow-400 uppercase tracking-widest mb-1.5 font-mono">
                      WinZO Arcade Update
                    </h4>
                    <p className="text-[10px] text-gray-300 leading-relaxed mb-4 font-sans">
                      {comingSoonGame}
                    </p>
                    <button
                      onClick={() => { audio.playThud(); setComingSoonGame(null); }}
                      className="w-full bg-[#fe3d7a] hover:bg-pink-500 text-white font-black text-[10.5px] py-2 rounded-xl active:scale-95 transition-all cursor-pointer shadow-md uppercase tracking-widest font-mono"
                    >
                      ✓ Check Live Lobbies
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ACTIVE GAME SELECTING CHALLENGE STAGE DRILL OVERLAY LOBBY */}
          {currentView === 'selecting-tier' && activeGameId && (
            <div className="absolute inset-x-0 bottom-0 top-0 bg-[#070b13]/95 p-5 flex flex-col justify-between animate-slide-up z-20" id="tier-selecting-panel">
              
              {/* Header and cancel */}
              <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    {activeGameId === 'card-duel' ? '🃏 Lucky 3-Card Duel' : activeGameId === 'rummy' ? '🎴 1v1 Speed Rummy' : activeGameId === 'ludo' ? '🎲 1v1 Speed Ludo' : '🎯 Neon Bubble Shooter'}
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentView('lobby')}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-slate-900 rounded-full border border-white/5 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
 
              {/* Middle rule details explanation */}
              <div className="my-2.5 bg-slate-900/55 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Match Format Specifications:</span>
                {activeGameId === 'card-duel' ? (
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5 font-sans">
                    Three mystery cards are dealt. One card is the <strong className="text-yellow-400">Golden Winner Ace</strong>. Spot the ace to secure 1.5x of the total prize pool, or fail and walk away with nothing!
                  </p>
                ) : activeGameId === 'rummy' ? (
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5 font-sans">
                    Two players are dealt 7 cards. Draw or discard to arrange <strong className="text-emerald-400">valid Sequences (Runs) or Groups (Sets)</strong>. Complete melds in 5 speed rounds; lowest Deadwood score gets 1.5x prize pool!
                  </p>
                ) : activeGameId === 'ludo' ? (
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5 font-sans">
                    Race your tokens across a neon 6x6 circuit map! <strong className="text-fuchsia-400">Capture opposing tokens</strong> to knock them back to start yards and claim free rolls. Get home first to claim 1.5x pool!
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5 font-sans">
                    Aim and shoot bubbles from your launcher to pop matching colors! <strong className="text-yellow-400">Earn the maximum points in 1 minute</strong>. High score claims the entire 1.5x prize pool!
                  </p>
                )}
              </div>

              {/* WINNINGS DASHBOARD (MATCHING THE SCREENSHOT EXACTLY) */}
              {(() => {
                const selectedTierDetail = getTierDetail(selectedTier || 'tier5');
                return (
                  <div className="bg-gradient-to-r from-[#6322a3] to-[#45107a] p-4 rounded-3xl border border-purple-400/20 text-center shadow-lg relative overflow-hidden my-2 flex items-center justify-center gap-4" id="winnings-dashboard-card">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-400/40 shadow-inner">
                      <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400/20 animate-bounce" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-[9.5px] font-black text-purple-200 tracking-wider font-mono uppercase">WINNINGS</span>
                        <HelpCircle className="w-3 h-3 text-purple-300/60" />
                      </div>
                      <div className="text-2xl font-black font-mono text-yellow-300 tracking-tight leading-none mt-1">
                        ₹ {selectedTierDetail.prize}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CHOOSE ENTRY AMOUNT SECTION */}
              <div className="my-2 text-center">
                <span className="text-[11px] font-black tracking-wider text-gray-300 uppercase block font-sans">
                  Choose Entry Amount
                </span>
                
                {/* Horizontal Scroll Bar for Circles */}
                <div className="flex gap-4 justify-start sm:justify-center items-center py-4 px-2 overflow-x-auto select-none no-scrollbar" id="entry-circles-row">
                  {(['practice', 'tier5', 'tier10', 'tier30', 'tier50', 'tier100', 'tier500'] as ChallengeTier[]).map((tierKey) => {
                    const detail = getTierDetail(tierKey);
                    const isSelected = selectedTier === tierKey;
                    const isFree = tierKey === 'practice';
                    
                    return (
                      <div
                        key={tierKey}
                        onClick={() => {
                          audio.playThud();
                          setSelectedTier(tierKey);
                        }}
                        className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer ${
                          isSelected ? 'scale-110' : 'hover:scale-105 opacity-80'
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-lg relative ${
                            isSelected
                              ? 'border-4 border-yellow-400 bg-gradient-to-b from-amber-600 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)] text-slate-950'
                              : 'border-2 border-indigo-500/20 bg-slate-900 text-gray-300 hover:border-indigo-400/40'
                          }`}
                        >
                          <span className={`text-xs font-black font-mono tracking-tight leading-none ${isSelected ? 'text-slate-950' : 'text-gray-100'}`}>
                            {isFree ? 'FREE' : `₹${detail.fee}`}
                          </span>
                          {isFree && (
                            <span className="absolute -bottom-1.5 bg-yellow-400 text-[7px] font-black text-slate-950 px-1 rounded border border-slate-950 uppercase">
                              PLAY
                            </span>
                          )}
                        </div>
                        {/* Subtle dot under selected circle */}
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-glow shadow-yellow-400" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-center my-1.5 text-[10px] font-mono">
                  {selectedTier === 'practice' ? (
                    <span className="text-cyan-400 font-bold bg-cyan-950/40 py-1 px-3 rounded-full border border-cyan-500/15">
                      ⚡ This game is free to play!
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold bg-amber-950/40 py-1 px-3 rounded-full border border-amber-500/15">
                      ⚡ ₹ {getTierDetail(selectedTier || 'tier5').fee} will be deducted from your wallet
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom stats balance check & PLAY NOW BUTTON */}
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center text-xs font-sans bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-400">Your Current balance:</span>
                  <span className="font-bold text-yellow-400 font-mono tracking-wider">₹ {profile.coins.toLocaleString('en-IN')} Cash</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedTier) {
                      handleSelectTier(selectedTier);
                    }
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-widest text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.98] select-none"
                  id="btn-play-now"
                >
                  <Play className="w-4 h-4 fill-slate-950 stroke-none" />
                  PLAY NOW
                </button>
              </div>

            </div>
          )}

          {/* ACTIVE MATCHMAKING SPINNER LOADER */}
          {currentView === 'matchmaking' && activeGameId && selectedTier && (
            <Matchmaking
              gameName={activeGameId === 'card-duel' ? 'Lucky 3-Card Duel' : activeGameId === 'rummy' ? '1v1 Speed Rummy' : activeGameId === 'ludo' ? '1v1 Speed Ludo' : 'Neon Bubble Shooter'}
              tier={selectedTier.toUpperCase()}
              entryFee={getTierDetail(selectedTier).fee}
              prizePool={getTierDetail(selectedTier).prize}
              onMatchFound={handleMatchResolved}
              onCancel={() => setCurrentView('selecting-tier')}
            />
          )}

          {/* ACTIVE IN-GAME LOADERS PLAYABLE SCREEN VIEWS */}
          {currentView === 'playing' && activeMatch && (
            <div className="absolute inset-0 z-30 select-none bg-black">
              {activeMatch.gameId === 'card-duel' && (
                <CardDuel
                  opponentName={activeMatch.opponentName}
                  opponentLevel={activeMatch.opponentLevel}
                  opponentAvatar={activeMatch.opponentAvatar}
                  entryFee={activeMatch.entryFee}
                  prizePool={activeMatch.prizePool}
                  onGameOver={handlePlaySessionOver}
                />
              )}
              {activeMatch.gameId === 'rummy' && (
                <Rummy
                  opponentName={activeMatch.opponentName}
                  opponentLevel={activeMatch.opponentLevel}
                  opponentAvatar={activeMatch.opponentAvatar}
                  entryFee={activeMatch.entryFee}
                  prizePool={activeMatch.prizePool}
                  onGameOver={handlePlaySessionOver}
                />
              )}
              {activeMatch.gameId === 'ludo' && (
                <Ludo
                  opponentName={activeMatch.opponentName}
                  opponentLevel={activeMatch.opponentLevel}
                  opponentAvatar={activeMatch.opponentAvatar}
                  entryFee={activeMatch.entryFee}
                  prizePool={activeMatch.prizePool}
                  onGameOver={handlePlaySessionOver}
                />
              )}
              {activeMatch.gameId === 'bubble-shooter' && (
                <BubbleShooter
                  opponentName={activeMatch.opponentName}
                  opponentLevel={activeMatch.opponentLevel}
                  opponentAvatar={activeMatch.opponentAvatar}
                  entryFee={activeMatch.entryFee}
                  prizePool={activeMatch.prizePool}
                  onGameOver={handlePlaySessionOver}
                />
              )}
            </div>
          )}

          {/* GAME MATCH RESOLUTION POPUP OVERLAY PANEL */}
          <AnimatePresence>
            {currentView === 'match-over' && gameResult && activeMatch && (
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 130 }}
                className="absolute inset-0 bg-slate-950/95 z-45 flex flex-col items-center justify-center p-6 text-center text-white rounded-2xl select-none"
                id="match-results-overlay"
              >
                
                {/* Confetti or Defeat aesthetic crown */}
                <div className="mb-4">
                  {gameResult.victory ? (
                    <div className="text-6xl animate-bounce">🏆</div>
                  ) : (
                    <div className="text-6xl">💀</div>
                  )}
                </div>

                {/* Verdict header titles */}
                <h1 className={`text-4xl font-black italic uppercase tracking-wider ${gameResult.victory ? 'text-yellow-400 text-glow-yellow' : 'text-rose-500'}`}>
                  {gameResult.victory ? 'VICTORY!' : 'DEFEAT!'}
                </h1>

                {/* Stake bracket summary */}
                <span className="text-[10px] font-mono text-gray-400 bg-slate-900 border border-white/5 py-1 px-3 rounded-full mt-2 uppercase tracking-widest leading-none">
                  {activeMatch.gameId === 'card-duel' ? '3-Card Duel' : activeMatch.gameId === 'rummy' ? 'Speed Rummy' : activeMatch.gameId === 'ludo' ? 'Speed Ludo' : 'Bubble Shooter'} • {activeMatch.tier} Bracket
                </span>

                {/* Versing final numbers report card */}
                <div className="flex items-center justify-center gap-10 w-full max-w-sm bg-black/40 border border-white/5 px-6 py-4 rounded-2xl my-6">
                  
                  {/* User column report */}
                  <div className="text-center w-24">
                    <span className="text-xs text-cyan-400 font-bold block mb-0.5">YOU</span>
                    <span className="text-lg font-black text-white">
                      {gameResult.victory ? '🏆 WINNER' : '❌ LOST'}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-1 font-mono">
                      {['ludo', 'bubble-shooter'].includes(activeMatch.gameId) ? 'Score' : 'My Hand'}
                    </span>
                  </div>

                  {/* Dash */}
                  <span className="text-xl font-bold text-gray-500">-VS-</span>

                  {/* Opponent column report */}
                  <div className="text-center w-24">
                    <span className="text-xs text-rose-400 font-semibold block mb-0.5 truncate uppercase">
                      {activeMatch.opponentName.split(' ')[0]}
                    </span>
                    <span className="text-lg font-black text-white">
                      {!gameResult.victory && gameResult.opponentScore > 0 ? '🏆 WINNER' : '❌ LOST'}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-1 font-mono">
                      {['ludo', 'bubble-shooter'].includes(activeMatch.gameId) ? 'Score' : 'Rival Hand'}
                    </span>
                  </div>

                </div>

                {/* Earned loot report rewards */}
                <div className="flex flex-col gap-2 bg-slate-900/40 p-4 rounded-xl border border-white/5 w-full max-w-xs text-left mb-6 font-sans">
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Match Cash Loot:</span>
                    <span className={`font-black font-mono ${gameResult.coinsEarned > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                      ₹ +{gameResult.coinsEarned}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1.5 border-t border-white/5">
                    <span className="text-gray-400">Level Experience:</span>
                    <span className="font-bold font-mono text-yellow-400">
                      ✨ +{gameResult.xpEarned} Exp XP
                    </span>
                  </div>

                </div>

                {/* Close proceed action */}
                <button
                  onClick={closeGameResult}
                  className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950 font-black px-12 py-3 rounded-full hover:scale-105 active:scale-95 transition-all text-sm tracking-widest uppercase cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-yellow-300"
                  id="quit-match-result-btn"
                >
                  PROCEED LOBBY
                </button>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTIVE SPIN WHEEL OVERLAYS */}
          {currentView === 'spin-wheel' && (
            <SpinWheel
              profile={profile}
              onDeductSpinCost={() => {
                const nextProf = {
                  ...profile,
                  coins: Math.max(0, profile.coins - 60),
                };
                saveProfileState(nextProf);
              }}
              onWin={handleSpinWheelWin}
              onClose={() => { audio.playThud(); setCurrentView('lobby'); }}
              onOpenDeposit={() => setIsDepositOpen(true)}
            />
          )}

          {/* ACTIVE AUCTION OVERLAYS */}
          {currentView === 'auction' && (
            <Auction
              profile={profile}
              onUpdateCoins={(amount) => {
                const nextProf = {
                  ...profile,
                  coins: profile.coins + amount,
                };
                saveProfileState(nextProf);
              }}
              onClose={() => { audio.playThud(); setCurrentView('lobby'); }}
              onOpenDepositModal={() => setIsDepositOpen(true)}
            />
          )}

          {/* GAMER STATS AND PROFILE SETTINGS OVERLAYS */}
          {currentView === 'profile' && (
            <ProfilePanel
              profile={profile}
              quests={quests}
              leaderboard={leaderboard}
              onAvatarChange={(newAv) => {
                const nextP = { ...profile, avatar: newAv };
                saveProfileState(nextP);
              }}
              onUpdateProfile={(updated) => {
                saveProfileState({ ...profile, ...updated });
              }}
              onDepositSimulation={handleDepositSimulation}
              onWithdrawSimulation={handleWithdrawSimulationTrigger}
              onClaimQuestReward={handleClaimQuestReward}
              onOpenLoginModal={() => { audio.playThud(); setIsLoginModalOpen(true); }}
              onLogout={handleLogout}
              onClose={() => setCurrentView('lobby')}
              transactionRequests={transactionRequests}
              onApproveTransaction={handleApproveTransaction}
              onRejectTransaction={handleRejectTransaction}
              onCutTransaction={handleCutTransaction}
              onDeleteTransactionRequest={handleDeleteTransactionRequest}
              adminConfig={adminConfig}
              onUpdateAdminConfig={saveAdminConfig}
            />
          )}

          {/* SECURE INTELLIGENT WITHDRAWAL POPUP */}
          {isWithdrawOpen && (
            <div className="absolute inset-0 bg-[#04060b]/90 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="withdraw-funds-modal">
              <div className="w-full max-w-[340px] bg-[#0c101d] rounded-2xl border-2 border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-5">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                  <h4 className="font-extrabold text-[12px] uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                    🏦 SECURE CASHOUT GATEWAY
                  </h4>
                  <button
                    onClick={() => { audio.playThud(); setIsWithdrawOpen(false); }}
                    className="text-gray-450 hover:text-white hover:bg-white/5 px-2 py-1 rounded-full cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Content Form */}
                {!withdrawSuccess ? (
                  <form onSubmit={handleExecuteWithdraw} className="flex flex-col gap-3.5">
                    
                    {/* Wallet Stat Indicator */}
                    <div className="bg-slate-950/85 p-3 rounded-xl border border-white/5 text-center">
                      <span className="text-[9px] font-mono text-gray-400 block uppercase mb-0.5">CURRENT DUEL STAKES</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">₹ {profile.coins.toLocaleString('en-IN')} Cash</span>
                    </div>

                    {/* Method Selector */}
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 block uppercase mb-1.5 font-mono">Select Transfer Route:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'upi', label: 'UPI ID', icon: '📱' },
                          { id: 'gpay', label: 'GPay', icon: '🔵' },
                          { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
                          { id: 'giftcard', label: 'Gift Card', icon: '🎁' }
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => { audio.playThud(); setWithdrawMethod(method.id as any); setWithdrawDestination(''); setWithdrawError(''); }}
                            className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              withdrawMethod === method.id
                                ? 'bg-amber-500/10 border-amber-500 text-yellow-400'
                                : 'bg-slate-950/40 border-white/5 text-gray-400 hover:bg-slate-900'
                            }`}
                          >
                            <span className="text-base mb-0.5">{method.icon}</span>
                            <span className="text-[7px] font-bold leading-none uppercase">{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Picker */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase font-mono">Enter Amount:</span>
                        <span className="text-[9px] text-yellow-500 font-mono font-bold">Limit: ₹10 - ₹{profile.coins.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                        <input
                          type="number"
                          value={withdrawAmount}
                          min={10}
                          max={profile.coins}
                          onChange={(e) => { setWithdrawError(''); setWithdrawAmount(Math.max(0, parseInt(e.target.value) || 0)); }}
                          className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-7 pr-3 text-sm font-bold font-mono focus:outline-none focus:border-amber-500 text-white"
                          required
                          disabled={withdrawLoading}
                        />
                      </div>
                      {/* Presets Grid */}
                      <div className="grid grid-cols-5 gap-1 mt-1.5">
                        {[10, 50, 100, 200].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            disabled={profile.coins < amt}
                            onClick={() => { audio.playThud(); setWithdrawAmount(amt); setWithdrawError(''); }}
                            className={`text-[8px] font-mono font-bold px-1.5 py-1 rounded transition-all cursor-pointer ${
                              withdrawAmount === amt
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-950 border border-white/5 text-gray-300 hover:bg-slate-900 disabled:opacity-30'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={profile.coins < 10}
                          onClick={() => { audio.playThud(); setWithdrawAmount(profile.coins); setWithdrawError(''); }}
                          className={`text-[8px] font-mono font-bold px-1.5 py-1 rounded transition-all cursor-pointer ${
                            withdrawAmount === profile.coins
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-950 border border-white/5 text-gray-300 hover:bg-slate-900'
                          }`}
                        >
                          ALL
                        </button>
                      </div>
                    </div>

                    {/* Destination Input field */}
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 block uppercase mb-1 font-mono">
                        {withdrawMethod === 'upi' && 'Enter UPI Address:'}
                        {withdrawMethod === 'gpay' && 'Enter GPay UPI ID or Mobile Number:'}
                        {withdrawMethod === 'phonepe' && 'Enter PhonePe UPI ID or Mobile Number:'}
                        {withdrawMethod === 'giftcard' && 'Enter Email Address:'}
                      </span>
                      <input
                        type={withdrawMethod === 'giftcard' ? 'email' : 'text'}
                        placeholder="Enter details here..."
                        value={withdrawDestination}
                        onChange={(e) => { setWithdrawError(''); setWithdrawDestination(e.target.value); }}
                        className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-amber-500 text-white"
                        required
                        disabled={withdrawLoading}
                      />
                    </div>

                    {/* Dynamic Error Status */}
                    {withdrawError && (
                      <span className="text-[9.5px] font-semibold text-rose-400 font-sans leading-tight bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg text-center">
                        ⚠️ {withdrawError}
                      </span>
                    )}

                    {/* Button process */}
                    <button
                      type="submit"
                      disabled={withdrawLoading || profile.coins < withdrawAmount || withdrawAmount < 10}
                      className="mt-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-550 text-slate-950 font-black text-[11px] py-2 px-4 rounded-xl uppercase tracking-wider transition-all hover:scale-102 cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
                    >
                      {withdrawLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                          <span>Processing Gateway...</span>
                        </>
                      ) : (
                        `💰 Cashout ₹${withdrawAmount}`
                      )}
                    </button>

                  </form>
                ) : (
                  /* Success Frame */
                  <div className="flex flex-col items-center justify-center text-center py-6 animate-scale-up">
                    <span className="text-4xl text-amber-500 animate-bounce mb-3">🕒</span>
                    <h5 className="text-[13px] font-black text-amber-500 uppercase tracking-wider mb-1 font-mono">
                      Withdraw Request Sent!
                    </h5>
                    <p className="text-[10px] text-gray-300 max-w-[240px] leading-relaxed mb-5 font-sans">
                      Your withdrawal request of <strong className="text-yellow-400">₹ {withdrawAmount} Cash</strong> has been submitted to the Admin. The funds have been reserved and will be processed to <strong className="text-cyan-400 truncate block max-w-[200px] mx-auto mt-0.5">{withdrawDestination}</strong> upon Admin approval.
                    </p>
                    <button
                      onClick={() => { audio.playThud(); setIsWithdrawOpen(false); }}
                      className="bg-slate-950 border border-white/10 text-white font-extrabold text-[10px] py-1.5 px-6 rounded-full cursor-pointer hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
                    >
                      Done
                    </button>
                  </div>
                )}
                
                {/* Gateway stamp footer */}
                <span className="text-center text-[7px] text-gray-500 font-mono uppercase mt-4 tracking-widest leading-none pointer-events-none">
                  🔐 END-TO-END AES-256 SECURED PROTOCOL
                </span>

              </div>
            </div>
          )}

          {/* DEPOSIT GATEWAY MODAL (SCAN TO PAY) */}
          {isDepositOpen && (
            <DepositModal
              profile={profile}
              onDepositSuccess={handleDepositSuccess}
              onClose={() => setIsDepositOpen(false)}
            />
          )}

          {/* SECURE INTEGRATED LOGIN MODAL */}
          {isLoginModalOpen && (
            <LoginModal
              profile={profile}
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setIsLoginModalOpen(false)}
            />
          )}

        </div>

        {/* BOTTOM VIRTUAL PHONE BAR FRAME INDENT (Aesthetic device polish) */}
        <div className="bg-slate-950 h-5 border-t border-white/5 flex items-center justify-center select-none flex-shrink-0 z-30">
          <div className="w-28 h-1 bg-slate-700 rounded-full opacity-60" />
        </div>

      </div>

    </div>
  );
}
