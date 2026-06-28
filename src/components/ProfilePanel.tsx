import React, { useState } from 'react';
import { audio } from '../utils/audio';
import { Profile, LeaderboardEntry, Quest, TransactionRequest, AdminConfig, GameConfig } from '../types';

interface ProfilePanelProps {
  profile: Profile;
  quests: Quest[];
  leaderboard: LeaderboardEntry[];
  onAvatarChange: (newAvatar: string) => void;
  onUpdateProfile?: (updated: Partial<Profile>) => void;
  onDepositSimulation: () => void;
  onWithdrawSimulation: () => void;
  onClaimQuestReward: (questId: string, rewardValue: number) => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onClose: () => void;
  transactionRequests?: TransactionRequest[];
  onApproveTransaction?: (id: string) => void;
  onRejectTransaction?: (id: string) => void;
  onCutTransaction?: (id: string) => void;
  onDeleteTransactionRequest?: (id: string) => void;
  adminConfig?: AdminConfig;
  onUpdateAdminConfig?: (newConfig: AdminConfig) => void;
}

const AVATARS_POOL = ['🦊', '🐰', '🦁', '🐨', '🐯', '🐼', '🐱', '🦄', '🦅', '🦍'];

const formatMatchTime = (isoString: string) => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;

    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return 'Recently';
  }
};

export default function ProfilePanel({
  profile,
  quests,
  leaderboard,
  onAvatarChange,
  onUpdateProfile,
  onDepositSimulation,
  onWithdrawSimulation,
  onClaimQuestReward,
  onOpenLoginModal,
  onLogout,
  onClose,
  transactionRequests = [],
  onApproveTransaction,
  onRejectTransaction,
  onCutTransaction,
  onDeleteTransactionRequest,
  adminConfig,
  onUpdateAdminConfig,
}: ProfilePanelProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const winRate = profile.matchesPlayed > 0 ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;

  // Administrative Control Panel States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(true);
  const [adminCoins, setAdminCoins] = useState(profile.coins.toString());
  const [adminName, setAdminName] = useState(profile.name);
  const [adminWins, setAdminWins] = useState(profile.wins);
  const [adminLosses, setAdminLosses] = useState(profile.losses);
  const [adminMatches, setAdminMatches] = useState(profile.matchesPlayed);
  const [adminLevel, setAdminLevel] = useState(profile.level);
  const [adminXp, setAdminXp] = useState(profile.xp);

  // Administrative Layout & Games states
  const [adminActiveTab, setAdminActiveTab] = useState<'profile' | 'transactions' | 'layout' | 'games'>('profile');
  const [selectedGameId, setSelectedGameId] = useState<'card-duel' | 'rummy' | 'ludo' | 'spin-wheel'>('card-duel');

  const [localTheme, setLocalTheme] = useState<AdminConfig['theme']>('fuchsia');
  const [localHeroBanner, setLocalHeroBanner] = useState('');
  const [localPromoBanner, setLocalPromoBanner] = useState('');

  const [gameTitle, setGameTitle] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameBadge, setGameBadge] = useState('');
  const [gameMinFee, setGameMinFee] = useState<number>(10);
  const [gameMaxFee, setGameMaxFee] = useState<number>(500);
  const [gameOnline, setGameOnline] = useState('');
  const [gameCover, setGameCover] = useState('');

  // Sync state with profile props when changed externally
  React.useEffect(() => {
    setAdminCoins(profile.coins.toString());
    setAdminName(profile.name);
    setAdminWins(profile.wins);
    setAdminLosses(profile.losses);
    setAdminMatches(profile.matchesPlayed);
    setAdminLevel(profile.level);
    setAdminXp(profile.xp);
  }, [profile]);

  // Sync layout parameters when adminConfig changes
  React.useEffect(() => {
    if (adminConfig) {
      setLocalTheme(adminConfig.theme);
      setLocalHeroBanner(adminConfig.heroBanner);
      setLocalPromoBanner(adminConfig.promoBanner);
    }
  }, [adminConfig]);

  // Sync game fields when selectedGameId or adminConfig changes
  React.useEffect(() => {
    if (adminConfig && adminConfig.games[selectedGameId]) {
      const g = adminConfig.games[selectedGameId];
      setGameTitle(g.title || '');
      setGameDesc(g.description || '');
      setGameBadge(g.badge || '');
      setGameMinFee(g.minFee || 10);
      setGameMaxFee(g.maxFee || 500);
      setGameOnline(g.onlineText || '');
      setGameCover(g.coverImg || '');
    }
  }, [adminConfig, selectedGameId]);

  const handleSaveLayout = () => {
    if (!adminConfig || !onUpdateAdminConfig) {
      alert("⚠️ Configuration is not initialized.");
      return;
    }
    onUpdateAdminConfig({
      ...adminConfig,
      theme: localTheme,
      heroBanner: localHeroBanner,
      promoBanner: localPromoBanner,
    });
    audio.playCoin();
  };

  const handleSaveGameConfig = () => {
    if (!adminConfig || !onUpdateAdminConfig) {
      alert("⚠️ Configuration is not initialized.");
      return;
    }
    const updatedGames = {
      ...adminConfig.games,
      [selectedGameId]: {
        title: gameTitle,
        description: gameDesc,
        coverImg: gameCover,
        badge: gameBadge,
        minFee: Number(gameMinFee) || 10,
        maxFee: Number(gameMaxFee) || 500,
        onlineText: gameOnline,
      }
    };
    onUpdateAdminConfig({
      ...adminConfig,
      games: updatedGames,
    });
    audio.playCoin();
  };

  const handleImageFileLoad = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
          audio.playCoin();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    const coinsNum = parseInt(adminCoins, 10);
    onUpdateProfile({
      name: adminName,
      coins: isNaN(coinsNum) ? profile.coins : coinsNum,
      wins: adminWins,
      losses: adminLosses,
      matchesPlayed: adminMatches,
      level: adminLevel,
      xp: adminXp,
    });
    audio.playCoin();
  };

  const handleAvatarSelection = (avKey: string) => {
    audio.playThud();
    setSelectedAvatar(avKey);
    onAvatarChange(avKey);
  };

  const handleDepositTrigger = () => {
    audio.playCoin();
    onDepositSimulation();
  };

  const handleWithdrawTrigger = () => {
    audio.playThud();
    onWithdrawSimulation();
  };

  return (
    <div className="absolute inset-0 bg-[#070b13]/95 z-40 flex flex-col p-5 text-white rounded-2xl select-none overflow-y-auto scrollbar-thin" id="profile-and-stats-panel">
      
      {/* Header bar and exit button */}
      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
        <h3 className="text-xl font-black text-white font-sans tracking-tight">👤 gamer central</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-white/5 bg-slate-900 cursor-pointer text-xs"
        >
          ✕ Back to Lobby
        </button>
      </div>

      {/* Grid container halves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 flex-shrink-0">

        {/* Column 1: Sailor profile card */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          
          <div className="flex items-start gap-4">
            <span className="text-5xl p-2.5 bg-slate-950 rounded-2xl border border-white/10 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              {profile.avatar}
            </span>
            <div className="flex-1">
              <h4 className="text-lg font-black text-yellow-400 truncate">{profile.name}</h4>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest bg-cyan-950/40 border border-cyan-900 px-2 py-0.5 rounded-full">
                LEVEL {profile.level} GAMER
              </span>
              
              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                  <span>EXP PROGRESS</span>
                  <span>{profile.xp} / {profile.level * 100}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (profile.xp / (profile.level * 100)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick wallet deposit & withdraw simulate */}
          <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-3 bg-black/30 p-3 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-gray-400 uppercase">WALLET BALANCE</span>
                <span className="text-2xl font-black text-emerald-400 block tracking-wide">₹ {profile.coins.toLocaleString('en-IN')} Cash</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDepositTrigger}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)] border border-emerald-300 text-center"
              >
                + ADD MONEY
              </button>
              <button
                onClick={handleWithdrawTrigger}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs py-2 px-3 rounded-xl transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.2)] border border-rose-500 text-center"
              >
                🏦 WITHDRAW
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Career Statistics metrics */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
          <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-white/5">
            👑 CAREER STATS PANEL
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-lg font-black text-rose-400 font-mono block">{profile.matchesPlayed}</span>
              <span className="text-[10px] text-gray-400 tracking-wider">MATCHES BATTLED</span>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-lg font-black text-emerald-400 font-mono block">{profile.wins}</span>
              <span className="text-[10px] text-gray-400 tracking-wider">VICTORIES</span>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-lg font-black text-rose-500 font-mono block">{profile.losses}</span>
              <span className="text-[10px] text-gray-400 tracking-wider">DEFEATS</span>
            </div>

            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-center">
              <span className="text-lg font-black text-yellow-400 font-mono block">{winRate}%</span>
              <span className="text-[10px] text-gray-400 tracking-wider">WIN PERCENTAGE</span>
            </div>

          </div>

          {/* Security & Credentials Panel */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col gap-2 bg-slate-950/40 p-3 rounded-xl border border-white/5" id="security-gateway-panel">
            <h5 className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide flex items-center justify-between">
              <span>🔐 SECURITY IDENTITY SHIELD</span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-900 text-cyan-400">ENCRYPTED</span>
            </h5>
            <div className="flex flex-col gap-1 mt-1 text-left">
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-sans">
                <span>Google Connect:</span>
                {profile.isGoogleLinked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    🟢 Connected ({profile.email})
                  </span>
                ) : (
                  <span className="text-rose-450 font-bold">🔴 Unlinked (Guest Mode)</span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-300 font-sans mt-0.5">
                <span>Master Password:</span>
                {profile.password ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    🟢 Shield Active
                  </span>
                ) : (
                  <span className="text-yellow-500 font-bold">🟡 Not configured</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <button
                onClick={onOpenLoginModal}
                className="w-full text-center bg-gradient-to-r from-yellow-500 to-amber-500 hover:scale-[1.02] text-slate-950 font-black text-[10px] py-2 rounded-xl uppercase tracking-wider cursor-pointer active:scale-98 transition-all"
                id="sync-gateway-trigger-btn"
              >
                {profile.isGoogleLinked ? '⚙️ MANAGE PASSWORD GATEWAY' : '🔐 SYNC TO GOOGLE & SECURE'}
              </button>

              {profile.isLoggedIn && (
                <button
                  onClick={() => {
                    audio.playThud();
                    onLogout();
                  }}
                  className="w-full text-center bg-slate-950 hover:bg-slate-900 text-rose-450 border border-rose-900/40 hover:text-rose-400 font-extrabold text-[10px] py-1.5 rounded-xl uppercase tracking-wider cursor-pointer active:scale-98 transition-all"
                  id="logout-session-btn"
                >
                  🔴 LOGOUT SECURE SESSION
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {profile.email && profile.email.toLowerCase() === 'sarveshkadam267@gmail.com' && (
        <div className="bg-slate-900 border-2 border-red-500/25 p-5 rounded-2xl mb-5 flex flex-col shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-fade-in" id="admin-helm-controls">
          <div className="flex justify-between items-center pb-2 border-b border-red-500/20 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <div className="text-left">
                <h4 className="text-xs font-mono text-red-400 uppercase tracking-widest font-black leading-none">
                  ADMIN CENTRAL OPERATIONAL CONTROL
                </h4>
                <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                  Exclusive administrator account tools for sarveshkadam267@gmail.com
                </p>
              </div>
            </div>
            <button
              onClick={() => { audio.playThud(); setIsAdminPanelOpen(!isAdminPanelOpen); }}
              className="text-[10px] px-2 py-1 bg-black/40 hover:bg-black/60 rounded border border-white/10 text-gray-300 font-mono cursor-pointer"
            >
              {isAdminPanelOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {isAdminPanelOpen && (
            <div className="flex flex-col gap-4 text-left">
              
              {/* Tab Selector Headers */}
              <div className="flex border-b border-white/5 pb-1 gap-1 select-none overflow-x-auto scrollbar-none" id="admin-tabs">
                {[
                  { id: 'profile', label: '👤 PROFILE' },
                  { id: 'transactions', label: `📥 FINANCES (${transactionRequests.filter(r => r.status === 'pending').length})` },
                  { id: 'layout', label: '🎨 LAYOUT' },
                  { id: 'games', label: '🎮 GAMES DIRECTORY' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { audio.playThud(); setAdminActiveTab(tab.id as any); }}
                    className={`text-[9.5px] font-mono tracking-wider px-3 py-1.8 rounded-lg cursor-pointer transition-all shrink-0 ${
                      adminActiveTab === tab.id
                        ? 'bg-red-600 text-white font-extrabold shadow-md border border-red-500'
                        : 'text-gray-400 hover:text-white bg-black/20 hover:bg-white/5 border border-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PROFILE AND WALLET SYSTEM */}
              {adminActiveTab === 'profile' && (
                <div className="flex flex-col gap-4 animate-fade-in" id="admin-tab-profile">
                  {/* Preset Shortcuts */}
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[10px] font-mono text-gray-400 block mb-2 uppercase">⚡ One-Click Administrative Shortcuts</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminCoins("99999999999999999");
                          onUpdateProfile?.({ coins: 99999999999999999 });
                          audio.playCoin();
                        }}
                        className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        👑 Set Infinity Balance (₹9.9K T)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminCoins("50000");
                          onUpdateProfile?.({ coins: 50000 });
                          audio.playCoin();
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        💰 Set Normal Stake Balance (₹50,000)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminLevel(99);
                          setAdminXp(9900);
                          onUpdateProfile?.({ level: 99, xp: 9900 });
                          audio.playCoin();
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        ⭐ Instant LVL 99 (Elite Legend)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateProfile?.({ matchHistory: [] });
                          audio.playThud();
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        🧹 Clear Battle Archives
                      </button>
                    </div>
                  </div>

                  {/* Form Config fields */}
                  <form onSubmit={handleAdminUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Gamer Alias</span>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Cash Wallet Balance (₹)</span>
                      <input
                        type="text"
                        value={adminCoins}
                        onChange={(e) => setAdminCoins(e.target.value)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Current Level</span>
                      <input
                        type="number"
                        value={adminLevel}
                        onChange={(e) => setAdminLevel(parseInt(e.target.value) || 1)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-cyan-400 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Overall EXP</span>
                      <input
                        type="number"
                        value={adminXp}
                        onChange={(e) => setAdminXp(parseInt(e.target.value) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-300 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Matches Played</span>
                      <input
                        type="number"
                        value={adminMatches}
                        onChange={(e) => setAdminMatches(parseInt(e.target.value) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-amber-500 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Total Victories</span>
                      <input
                        type="number"
                        value={adminWins}
                        onChange={(e) => setAdminWins(parseInt(e.target.value) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <span className="text-[10px] font-mono text-gray-400 uppercase">Total Defeats</span>
                      <input
                        type="number"
                        value={adminLosses}
                        onChange={(e) => setAdminLosses(parseInt(e.target.value) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-rose-500 font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider py-2 px-4 rounded-xl cursor-pointer active:scale-98 transition-all border border-red-500"
                      >
                        💾 SAVE & APPLY USER METADATA
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: FINANCIAL TRANSACTION APPROVALS QUEUE */}
              {adminActiveTab === 'transactions' && (
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-left flex flex-col gap-3 animate-fade-in" id="admin-tab-transactions">
                  <span className="text-[10px] font-mono text-red-400 block uppercase font-bold tracking-widest border-b border-white/5 pb-1.5 flex justify-between items-center">
                    <span>📥 PENDING TRANSACTION APPROVALS QUEUE</span>
                    <span className="text-[9px] bg-red-950/60 text-red-500 px-2 py-0.5 rounded border border-red-900 font-mono">
                      {transactionRequests.filter(r => r.status === 'pending').length} REQUESTS
                    </span>
                  </span>
                  
                  {transactionRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-[10.5px] text-gray-500 font-mono italic">
                      No pending deposit or withdrawal requests in the queue.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {transactionRequests.filter(r => r.status === 'pending').map((req) => (
                        <div key={req.id} className="bg-slate-950/80 p-3 rounded-lg border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-col gap-1 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                                req.type === 'deposit' 
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' 
                                  : 'bg-amber-950/60 text-amber-500 border border-amber-900'
                              }`}>
                                {req.type === 'deposit' ? '📥 Deposit Req' : '📤 Withdraw Req'}
                              </span>
                              <span className="text-[11px] font-black text-gray-200">
                                ₹ {req.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            
                            <div className="text-[10px] text-gray-400 font-sans flex flex-col gap-0.5">
                              <span>User: <strong className="text-gray-300">{req.username}</strong> ({req.email})</span>
                              {req.type === 'withdraw' && (
                                <span>Target: <strong className="text-cyan-400 font-mono">{req.destination} ({req.method?.toUpperCase()})</strong></span>
                              )}
                              <span className="text-[9px] text-gray-500 font-mono">{new Date(req.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 items-center shrink-0">
                            <button
                              type="button"
                              onClick={() => onApproveTransaction?.(req.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-emerald-300/30"
                            >
                              ✓ Approve
                            </button>
                            
                            {req.type === 'withdraw' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onRejectTransaction?.(req.id)}
                                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-rose-500/30 flex flex-col items-center leading-none justify-center"
                                  title="Reject and return coins back to the player account"
                                >
                                  <span>✕ Reject</span>
                                  <span className="text-[7px] text-rose-200 uppercase tracking-widest mt-0.5 font-mono">(Refund)</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => onCutTransaction?.(req.id)}
                                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-amber-400/30 flex flex-col items-center leading-none justify-center"
                                  title="Cut request without returning any coins (cuts/voids the balance)"
                                >
                                  <span>✂️ Cut Req</span>
                                  <span className="text-[7px] text-amber-950 uppercase tracking-widest mt-0.5 font-mono">(No Refund)</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onRejectTransaction?.(req.id)}
                                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer border border-rose-500/30"
                                title="Reject deposit request (player gets no coins)"
                              >
                                ✕ Reject (No Coins)
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: APP LAYOUT & GRAPHIC DESIGN */}
              {adminActiveTab === 'layout' && (
                <div className="flex flex-col gap-4 animate-fade-in text-left bg-black/35 p-4 rounded-xl border border-white/5" id="admin-tab-layout">
                  <span className="text-[10px] font-mono text-red-400 block uppercase font-bold tracking-widest border-b border-white/5 pb-1.5">
                    🎨 REAL-TIME CORE LAYOUT SCHEMATIC
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Input Fields */}
                    <div className="flex flex-col gap-3">
                      {/* Theme selection dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Core Brand Palette Theme</span>
                        <select
                          value={localTheme}
                          onChange={(e) => setLocalTheme(e.target.value as any)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                        >
                          <option value="fuchsia">🟣 WinZO Fuchsia Purple (Default)</option>
                          <option value="red">🔴 Crimson Combatant Red</option>
                          <option value="green">🟢 Forest Arena Stakes Green</option>
                          <option value="amber">🟡 Cyberpunk Neon Amber</option>
                          <option value="blue">🔵 Deep Ocean Gladiator Blue</option>
                        </select>
                      </div>

                      {/* Header Logo Background picture */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Header Brand Banner Picture</span>
                        <span className="text-[8.5px] text-gray-500 font-sans">Upload a custom banner image OR paste a graphic URL</span>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/banner.png"
                            value={localHeroBanner}
                            onChange={(e) => setLocalHeroBanner(e.target.value)}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10.5px] text-gray-300 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => { setLocalHeroBanner(''); audio.playThud(); }}
                            className="text-[9px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-gray-400 border border-white/5 shrink-0"
                            title="Reset to default banner"
                          >
                            Reset
                          </button>
                        </div>
                        
                        <label className="border border-dashed border-white/10 rounded-xl p-2 text-center hover:bg-white/5 cursor-pointer flex flex-col items-center gap-1 mt-1 transition-all">
                          <span className="text-[10px] font-mono text-red-400">📤 Choose Custom Layout Picture</span>
                          <span className="text-[8px] text-gray-500 font-mono">(Accepts PNG, JPG, WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileLoad(e, setLocalHeroBanner)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Promo Mini Banner image */}
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Fortune wheel mini-banner picture</span>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/fortune.png"
                            value={localPromoBanner}
                            onChange={(e) => setLocalPromoBanner(e.target.value)}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-[10.5px] text-gray-300 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => { setLocalPromoBanner(''); audio.playThud(); }}
                            className="text-[9px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-gray-400 border border-white/5 shrink-0"
                            title="Reset to default promo banner"
                          >
                            Reset
                          </button>
                        </div>

                        <label className="border border-dashed border-white/10 rounded-xl p-2 text-center hover:bg-white/5 cursor-pointer flex flex-col items-center gap-1 mt-1 transition-all">
                          <span className="text-[10px] font-mono text-red-400">📤 Choose Mini-Banner Picture</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileLoad(e, setLocalPromoBanner)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Right Column: Visual Preview */}
                    <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-3 justify-center">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Live Layout Mockup Preview</span>
                      
                      {/* Interactive mockup of Header Logo */}
                      <div className="rounded-xl overflow-hidden border border-white/10 flex flex-col">
                        {/* Logo bar */}
                        <div 
                          style={{ backgroundImage: localHeroBanner ? `url(${localHeroBanner})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          className={`px-3 py-3 border-b border-white/10 flex justify-between items-center ${
                            !localHeroBanner ? (
                              localTheme === 'fuchsia' ? 'bg-gradient-to-r from-[#440523] via-[#350824] to-[#1d031c]' :
                              localTheme === 'red' ? 'bg-gradient-to-r from-[#5c0b1a] via-[#4a0815] to-[#2b020a]' :
                              localTheme === 'green' ? 'bg-gradient-to-r from-[#0b4a2c] via-[#093c23] to-[#042012]' :
                              localTheme === 'amber' ? 'bg-gradient-to-r from-[#4a2e0a] via-[#3c2508] to-[#1f1202]' :
                              'bg-gradient-to-r from-[#0b335c] via-[#09294b] to-[#041528]'
                            ) : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🔥</span>
                            <span className="text-xs font-black tracking-widest text-white italic uppercase">WINZOMANIA</span>
                          </div>
                          <span className="text-[7px] font-mono font-black text-slate-950 bg-yellow-400 px-1 py-0.2 rounded">LIVE PREVIEW</span>
                        </div>
                        
                        {/* Interactive mini-banner */}
                        <div className="p-3 bg-black/50 text-left">
                          <div className="bg-slate-900 border border-white/5 rounded-xl p-2.5 flex justify-between items-center relative overflow-hidden h-14">
                            <div className="z-10 text-left">
                              <span className="text-[7px] text-slate-950 bg-yellow-400 px-1 rounded font-black font-mono">₹1,000 DAILY</span>
                              <h5 className="text-[10px] font-black text-white mt-0.5">Fortune Spin Wheel</h5>
                            </div>
                            
                            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-50 bg-slate-800">
                              {localPromoBanner ? (
                                <img src={localPromoBanner} alt="Preview banner" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[16px] flex items-center justify-center h-full">🎡</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Theme indicators */}
                      <div className="flex gap-2 items-center justify-center mt-1">
                        <span className="text-[9.5px] text-gray-400 font-mono">Active Accent:</span>
                        <span className={`w-3.5 h-3.5 rounded-full border border-white/20 ${
                          localTheme === 'fuchsia' ? 'bg-[#fe3d7a]' :
                          localTheme === 'red' ? 'bg-red-500' :
                          localTheme === 'green' ? 'bg-emerald-400' :
                          localTheme === 'amber' ? 'bg-yellow-500' :
                          'bg-blue-400'
                        }`} />
                        <span className="text-[9px] font-bold uppercase text-gray-300">{localTheme}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveLayout}
                    className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer active:scale-98 transition-all border border-red-500 text-center"
                  >
                    💾 SAVE & APPLY CUSTOM LAYOUT SCHEMATIC
                  </button>
                </div>
              )}

              {/* TAB 4: GAMES DIRECTORY CUSTOMIZER */}
              {adminActiveTab === 'games' && (
                <div className="flex flex-col gap-4 animate-fade-in text-left bg-black/35 p-4 rounded-xl border border-white/5" id="admin-tab-games">
                  <span className="text-[10px] font-mono text-red-400 block uppercase font-bold tracking-widest border-b border-white/5 pb-1.5">
                    🎮 ARCADE DIRECTORY & GAME PICTURES
                  </span>

                  {/* Sub-Tabs for selecting which Game to Customize */}
                  <div className="flex flex-wrap gap-1 select-none bg-slate-950 p-1.5 rounded-xl border border-white/5">
                    {[
                      { id: 'card-duel', label: '🃏 CARD DUEL' },
                      { id: 'rummy', label: '♠️ SPEED RUMMY' },
                      { id: 'ludo', label: '🎲 SPEED LUDO' },
                      { id: 'spin-wheel', label: '🎡 SPIN WHEEL' }
                    ].map(gTab => (
                      <button
                        key={gTab.id}
                        type="button"
                        onClick={() => { audio.playThud(); setSelectedGameId(gTab.id as any); }}
                        className={`text-[9px] font-black tracking-tight px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                          selectedGameId === gTab.id
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {gTab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left fields */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Game Title</span>
                        <input
                          type="text"
                          value={gameTitle}
                          onChange={(e) => setGameTitle(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs font-black text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Tagline / Brief Description</span>
                        <input
                          type="text"
                          value={gameDesc}
                          onChange={(e) => setGameDesc(e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs text-gray-200 focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-gray-300 uppercase">Badge Label</span>
                          <input
                            type="text"
                            value={gameBadge}
                            onChange={(e) => setGameBadge(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs font-bold text-yellow-400 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-gray-300 uppercase">Online Users Status</span>
                          <input
                            type="text"
                            value={gameOnline}
                            onChange={(e) => setGameOnline(e.target.value)}
                            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs font-bold text-emerald-400 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      {selectedGameId !== 'spin-wheel' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-gray-300 uppercase">Min Entry Fee (₹)</span>
                            <input
                              type="number"
                              value={gameMinFee}
                              onChange={(e) => setGameMinFee(Number(e.target.value) || 0)}
                              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-gray-300 uppercase">Max Entry Fee (₹)</span>
                            <input
                              type="number"
                              value={gameMaxFee}
                              onChange={(e) => setGameMaxFee(Number(e.target.value) || 0)}
                              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* GAME COVER IMAGE UPLOADER */}
                      <div className="flex flex-col gap-1 border-t border-white/5 pt-2.5 mt-1">
                        <span className="text-[10px] font-mono text-gray-300 uppercase">Custom Game Cover Picture</span>
                        <span className="text-[8px] text-gray-500 font-sans leading-tight">Drag and drop or select a visual image to replace the thumbnail</span>
                        
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="https://example.com/cover.png"
                            value={gameCover}
                            onChange={(e) => setGameCover(e.target.value)}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.8 text-[10.5px] text-gray-300 focus:outline-none focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => { setGameCover(''); audio.playThud(); }}
                            className="text-[9px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-gray-400 border border-white/5 shrink-0"
                            title="Reset to default image"
                          >
                            Reset
                          </button>
                        </div>

                        <label className="border border-dashed border-white/10 rounded-xl p-3 text-center hover:bg-white/5 cursor-pointer flex flex-col items-center gap-1.5 mt-1 transition-all">
                          <span className="text-[10.5px] font-mono text-red-400">📤 Choose Custom Game Picture</span>
                          <span className="text-[8px] text-gray-500 font-mono">(Directly uploads to local browser cache)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileLoad(e, setGameCover)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Card Preview */}
                    <div className="flex flex-col justify-center items-center bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-2 align-self-start">Lobby Card Preview Mockup</span>
                      
                      {/* Realistic replica of a WinZO game lobby card */}
                      <div className="w-44 bg-[#1a0e23] border border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex flex-col select-none">
                        <div className="h-28 w-full relative overflow-hidden bg-slate-900">
                          {gameCover ? (
                            <img src={gameCover} alt="Game preview cover" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-gray-500 text-xs">No Cover Image</div>
                          )}
                          
                          {gameBadge && (
                            <div className="absolute top-1.5 left-1.5 bg-[#fe3d7a] text-white text-[7px] font-mono font-black italic px-1.5 py-0.3 rounded shadow">
                              {gameBadge}
                            </div>
                          )}

                          {gameOnline && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[#00ffc4] text-[7px] font-black px-1.5 py-0.3 rounded flex items-center gap-0.8">
                              <span className="w-1 h-1 rounded-full bg-[#00ffc4] animate-ping" />
                              <span>{gameOnline}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-2 flex flex-col text-left bg-slate-950/80">
                          <h4 className="text-[10.5px] font-black text-gray-100 uppercase tracking-tight">{gameTitle || 'Unnamed Game'}</h4>
                          <p className="text-[8px] text-gray-400 mt-0.5 leading-tight font-sans h-5 overflow-hidden">{gameDesc || 'No tagline defined.'}</p>
                          
                          {selectedGameId !== 'spin-wheel' && (
                            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[8px] font-mono">
                              <span className="text-gray-500">Entry fee:</span>
                              <span className="text-yellow-400 font-extrabold">₹{gameMinFee} - ₹{gameMaxFee}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveGameConfig}
                    className="w-full mt-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer active:scale-98 transition-all border border-red-500 text-center"
                  >
                    💾 SAVE & APPLY GAME CONFIGURATION
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Choose Avatar strip slider */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 mb-5 flex-shrink-0">
        <span className="text-xs font-mono text-gray-400 block uppercase mb-2">Change Gamer Signature Mascot:</span>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {AVATARS_POOL.map((av) => (
            <button
              key={av}
              onClick={() => handleAvatarSelection(av)}
              className={`text-2xl p-2 rounded-xl transition-all hover:scale-115 cursor-pointer ${
                selectedAvatar === av
                  ? 'bg-yellow-400 text-slate-950 scale-105 border border-yellow-200'
                  : 'bg-black/30 hover:bg-slate-800'
              }`}
            >
              {av}
            </button>
          ))}
        </div>
      </div>

      {/* MATCH HISTORY SECTION */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 mb-5 flex flex-col" id="match-history-section">
        <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 flex justify-between items-center">
          <span>⚔️ RECENT BATTLE ARCHIVES</span>
          <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase font-mono">
            Past 10 Duels
          </span>
        </h4>
        
        {(!profile.matchHistory || profile.matchHistory.length === 0) ? (
          <div className="text-center py-6 text-gray-500 text-xs font-mono">
            No battle archives recorded yet! Go play a game in the lobby. ⚡
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
            {profile.matchHistory.map((match) => {
              const gameMeta = 
                match.gameId === 'card-duel' ? { name: 'Card Duel', icon: '🃏', color: 'text-amber-400' } :
                match.gameId === 'rummy' ? { name: 'Speed Rummy', icon: '🀄', color: 'text-purple-400' } :
                { name: 'Speed Ludo', icon: '🎲', color: 'text-blue-400' };

              return (
                <div key={match.id} className="flex items-center justify-between gap-3 bg-black/20 hover:bg-black/40 border border-white/5 p-3 rounded-xl transition-all">
                  
                  {/* Left Column: Game and Date */}
                  <div className="flex items-center gap-3 min-w-[120px] max-w-[200px]">
                    <span className="text-2xl p-1.5 bg-slate-950 rounded-lg border border-white/5">
                      {gameMeta.icon}
                    </span>
                    <div>
                      <span className={`text-xs font-black block font-sans ${gameMeta.color}`}>
                        {gameMeta.name}
                      </span>
                      <span className="text-[9px] text-gray-450 font-mono block mt-0.5">
                        {formatMatchTime(match.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Opponent info */}
                  <div className="flex items-center gap-2 max-w-[150px] truncate">
                    <span className="text-lg p-1 bg-slate-950/70 rounded-md">
                      {match.opponentAvatar}
                    </span>
                    <div className="truncate text-left">
                      <span className="text-[8px] text-gray-500 font-mono uppercase block leading-none mb-0.5">VS OPPONENT</span>
                      <span className="text-xs font-bold text-white truncate block">
                        {match.opponentName}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Win/Loss status & Coins won/lost */}
                  <div className="flex items-center gap-4 text-right">
                    
                    {/* Status Badge */}
                    <div className="flex flex-col items-end">
                      {match.win ? (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                          VICTORY
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 uppercase tracking-wider">
                          DEFEAT
                        </span>
                      )}
                      <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                        Fee: ₹{match.entryFee}
                      </span>
                    </div>

                    {/* Earnings change */}
                    <div className="w-[70px] text-right">
                      <span className={`text-xs font-black font-mono block ${match.win ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {match.win ? '₹ +' : '₹ '}{match.coinsEarned}
                      </span>
                      <span className="text-[8px] text-gray-500 font-mono uppercase">
                        CASH OUTCOME
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WALLET REQUESTS HISTORY SECTION */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 mb-5 flex flex-col" id="transaction-history-section">
        <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 flex justify-between items-center">
          <span>📜 MY WALLET TRANSFER REQUESTS</span>
          <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase font-mono">
            Verification Trail
          </span>
        </h4>
        
        {(() => {
          const playerRequests = transactionRequests.filter(req => {
            if (profile.email) {
              return req.email?.toLowerCase() === profile.email.toLowerCase();
            }
            return req.username === profile.name;
          });

          if (playerRequests.length === 0) {
            return (
              <div className="text-center py-6 text-gray-500 text-xs font-mono">
                No active transfer logs reported yet. Complete add-money scan or initiate cashout first! 🏦
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1 text-left">
              {playerRequests.map((req) => {
                const methodLabel = req.method?.toUpperCase() || 'UPI';
                const statusColors = 
                  req.status === 'pending' ? { text: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25', label: 'PENDING ADMIN APPROVAL' } :
                  req.status === 'approved' ? { text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/25', label: 'APPROVED & DISBURSED' } :
                  req.status === 'cut' ? { text: 'text-red-400 font-bold', bg: 'bg-red-500/15 border-red-500/25', label: 'CUT BY ADMIN (VOID / NO REFUND)' } :
                  req.type === 'withdraw' ? { text: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', label: 'REJECTED & REFUNDED' } :
                  { text: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', label: 'DEPOSIT REJECTED' };

                return (
                  <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/20 hover:bg-black/35 border border-white/5 p-3 rounded-xl transition-all text-xs">
                    
                    {/* Left details */}
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl p-1.5 bg-slate-950 rounded-lg border border-white/5 ${req.type === 'deposit' ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {req.type === 'deposit' ? '📥' : '📤'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black uppercase tracking-wide ${req.type === 'deposit' ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {req.type === 'deposit' ? 'Wallet Deposit' : 'Cash Withdrawal'}
                          </span>
                          <span className="text-gray-500 font-mono text-[9px]">({methodLabel})</span>
                        </div>
                        {req.type === 'withdraw' && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Target: <span className="text-cyan-400 font-mono">{req.destination}</span>
                          </p>
                        )}
                        <span className="text-[9px] text-gray-500 font-mono block mt-0.5">
                          {new Date(req.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Right states */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 min-w-[120px]">
                      <span className={`text-xs font-black font-mono block ${req.type === 'deposit' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        ₹ {req.amount.toLocaleString('en-IN')}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono text-center block ${statusColors.text} ${statusColors.bg}`}>
                        {statusColors.label}
                      </span>
                      {onDeleteTransactionRequest && (
                        <button
                          onClick={() => onDeleteTransactionRequest(req.id)}
                          className={`text-[8.5px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                            req.status === 'pending'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                          title={req.status === 'pending' ? "Cancel transfer request" : "Delete request from logs"}
                        >
                          {req.status === 'pending' ? '✕ Cancel Req' : '🗑️ Delete Log'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Lower grids: Daily quests & Leaderboards list side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Quest lists */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex flex-col">
          <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1 flex justify-between items-center">
            <span>🎯 DAILY MISSIONS</span>
            <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
              COIN REWARDS
            </span>
          </h4>

          <div className="flex-1 flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                  quest.claimed
                    ? 'bg-slate-950/20 border-white/5 opacity-50'
                    : 'bg-black/30 border-white/5'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">{quest.title}</h5>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{quest.description}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-yellow-400 flex-shrink-0">
                    ₹+{quest.reward}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="mt-2.5 flex items-center justify-between gap-4">
                  <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                    />
                  </div>
                  
                  {quest.completed && !quest.claimed ? (
                    <button
                      onClick={() => onClaimQuestReward(quest.id, quest.reward)}
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase scale-100 hover:scale-105 cursor-pointer active:scale-95"
                    >
                      CLAIM
                    </button>
                  ) : quest.claimed ? (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-950">
                      CLAIMED ✔
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-gray-400 font-semibold bg-slate-950 px-2 py-0.5 rounded-full border border-white/5">
                      {quest.progress}/{quest.target}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Competitor Leaderboard lists */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex flex-col">
          <h4 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1">
            🏁 GLOBAL LEADERBOARD
          </h4>
          
          <div className="flex-1 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
            {leaderboard.map((player) => {
              const isUser = player.isUser;
              return (
                <div
                  key={player.rank}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30'
                      : 'bg-black/20 hover:bg-black/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indices */}
                    <span
                      className={`font-mono text-xs font-black w-5 text-center ${
                        player.rank === 1 ? 'text-yellow-400 text-sm' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-gray-400'
                      }`}
                    >
                      {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                    </span>

                    {/* Avatar */}
                    <span className="text-lg">{player.avatar}</span>
                    
                    {/* Name details */}
                    <div>
                      <span className={`text-xs font-bold font-sans block ${isUser ? 'text-yellow-400' : 'text-white'}`}>
                        {player.name} {isUser && '(You)'}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono bg-slate-950/40 px-1.5 py-0.2 rounded">
                        Lvl {player.level}
                      </span>
                    </div>
                  </div>

                  {/* Wealth stat indicators */}
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ₹ {player.coins.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
