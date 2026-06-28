export type GameId = 'card-duel' | 'rummy' | 'ludo' | 'auction' | 'bubble-shooter';

export type ChallengeTier = 'practice' | 'tier5' | 'tier10' | 'tier30' | 'tier50' | 'tier100' | 'tier500';

export interface Profile {
  name: string;
  avatar: string;
  coins: number;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  lastDailySpin: string | null; // ISO string
  email?: string;
  isGoogleLinked?: boolean;
  password?: string;
  isLoggedIn?: boolean;
  matchHistory?: MatchHistoryEntry[];
}

export interface MatchHistoryEntry {
  id: string;
  gameId: GameId;
  opponentName: string;
  opponentAvatar: string;
  win: boolean;
  coinsEarned: number;
  entryFee: number;
  timestamp: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  gameId?: GameId;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  coins: number;
  level: number;
  isUser?: boolean;
}

export interface MatchConfig {
  id: string;
  gameId: GameId;
  tier: ChallengeTier;
  entryFee: number;
  prizePool: number;
  opponentName: string;
  opponentAvatar: string;
  opponentLevel: number;
  opponentScoreOffset: number; // custom multiplier or addition for competitive feeling
}

export interface TransactionRequest {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cut';
  timestamp: string;
  username: string;
  email: string;
  destination?: string;
  method?: string;
}

export interface GameConfig {
  title: string;
  description: string;
  coverImg: string;
  badge: string;
  minFee?: number;
  maxFee?: number;
  onlineText?: string;
}

export interface AdminConfig {
  theme: 'fuchsia' | 'red' | 'green' | 'amber' | 'blue';
  heroBanner: string;
  promoBanner: string;
  games: {
    'card-duel': GameConfig;
    'rummy': GameConfig;
    'ludo': GameConfig;
    'spin-wheel': GameConfig;
    'auction'?: GameConfig;
    'bubble-shooter'?: GameConfig;
  };
}


