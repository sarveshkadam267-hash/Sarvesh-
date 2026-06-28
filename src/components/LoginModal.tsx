import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';
import { Profile } from '../types';

interface LoginModalProps {
  profile: Profile;
  onLoginSuccess: (updatedProfile: {
    name: string;
    email: string;
    isGoogleLinked: boolean;
    password?: string;
    isLoggedIn: boolean;
  }) => void;
  onClose: () => void;
}

export default function LoginModal({ profile, onLoginSuccess, onClose }: LoginModalProps) {
  const [step, setStep] = useState<'welcome' | 'google-consent' | 'set-password' | 'password-sign-in' | 'success'>('welcome');
  const [emailInput, setEmailInput] = useState('sarveshkadam267@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // For password matching in set-password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passRequirements, setPassRequirements] = useState({
    length: false,
    number: false,
    special: false,
  });

  const checkPasswordStrength = (pass: string) => {
    setPassRequirements({
      length: pass.length >= 6,
      number: /\d/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass),
    });
  };

  const handleGoogleAuthStart = () => {
    audio.playThud();
    setLoading(true);
    // Simulate standard prompt latency
    setTimeout(() => {
      setLoading(false);
      setStep('google-consent');
    }, 800);
  };

  const handleSelectGoogleAccount = () => {
    audio.playCoin();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Proceed to password set to secure this newly authenticated ledger
      setStep('set-password');
    }, 1200);
  };

  const handleSetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playThud();

    if (!passRequirements.length || !passRequirements.number || !passRequirements.special) {
      setErrorMessage('Please satisfy all secured password standards.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: profile.name || 'Sarvesh Kadam',
        email: emailInput,
        isGoogleLinked: true,
        password: newPassword,
        isLoggedIn: true,
      });
      setStep('success');
      audio.playCoin();
    }, 1400);
  };

  const handlePasswordSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playThud();

    if (passwordInput.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // If correct mock check OR just logs in
      onLoginSuccess({
        name: profile.name || 'Sarvesh Kadam',
        email: emailInput,
        isGoogleLinked: true,
        password: passwordInput,
        isLoggedIn: true,
      });
      setStep('success');
      audio.playCoin();
    }, 1200);
  };

  return (
    <div
      className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-sans"
      id="login-onboarding-screen"
    >
      <div
        className="w-full max-w-[350px] bg-[#0d1222] rounded-2xl border-2 border-slate-800 shadow-[0_15px_45px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col p-5 relative"
        id="login-modal-box"
      >
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4 text-center py-2"
              id="step-welcome"
            >
              {/* Logo icon header */}
              <div className="flex flex-col items-center">
                <span className="text-4xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">🎮</span>
                <h3 className="text-lg font-black text-white mt-2 uppercase tracking-wide">
                  WINZO ARCADE SYNC
                </h3>
                <p className="text-[10px] text-gray-400 font-mono uppercase mt-1 tracking-widest">
                  Secure Your Game Account Ledger
                </p>
              </div>

              {/* Benefits layout block */}
              <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5 text-left flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-yellow-500 mt-0.5">✔</span>
                  <p className="text-[10px] text-gray-250 leading-relaxed font-sans">
                    Sync <strong className="text-emerald-400">₹ {profile.coins.toLocaleString('en-IN')} Cash stakes</strong> securely across devices.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-yellow-500 mt-0.5">✔</span>
                  <p className="text-[10px] text-gray-250 leading-relaxed font-sans">
                    Enable encrypted password protection on your global ledger.
                  </p>
                </div>
              </div>

              {/* Connect with Google Action Button */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleAuthStart}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-slate-800 font-extrabold text-[12px] py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.06)] border border-gray-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>LOG IN WITH GOOGLE</span>
                  </>
                )}
              </button>

              {/* Alternative password log in toggle */}
              <div className="flex flex-col gap-2 mt-1">
                <button
                  id="toggle-pw-signin-btn"
                  onClick={() => { audio.playThud(); setStep('password-sign-in'); setErrorMessage(''); }}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold tracking-wider hover:underline"
                >
                  ⚙️ SIGN IN WITH PASSCODE / KEY
                </button>
                <div className="w-full flex items-center justify-center gap-2">
                  <div className="h-[1px] bg-white/5 flex-1" />
                  <span className="text-[8px] text-gray-550 font-black tracking-widest">OR</span>
                  <div className="h-[1px] bg-white/5 flex-1" />
                </div>
                <button
                  id="continue-guest-btn"
                  onClick={() => { audio.playThud(); onClose(); }}
                  className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-extrabold cursor-pointer"
                >
                  Continue playing as guest 🌐
                </button>
              </div>
            </motion.div>
          )}

          {step === 'google-consent' && (
            <motion.div
              key="google-consent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col"
              id="step-google-consent"
            >
              {/* Google Brand Accounts dialogue layout */}
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white font-sans">Google</span>
                  <span className="text-[10px] text-gray-405 font-mono">Accounts</span>
                </div>
                <span className="text-[9px] font-mono text-gray-450 bg-slate-900 border border-white/5 px-2 py-0.5 rounded">
                  secure_oauth v2
                </span>
              </div>

              <div className="py-4">
                <span className="text-xs font-bold text-gray-300 block mb-2 leading-relaxed">
                  Choose an account to continue to <strong className="text-amber-400">WinZO Arcade</strong>:
                </span>

                {/* Account row list option */}
                <div
                  id="google-user-row"
                  onClick={handleSelectGoogleAccount}
                  className="bg-black/40 hover:bg-slate-900 border border-white/5 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-101 active:scale-99 mb-4"
                >
                  <span className="text-xl p-1 bg-gradient-to-tr from-yellow-500 to-amber-500 rounded-full flex items-center justify-center w-8 h-8">
                    🦊
                  </span>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-black text-white block">Sarvesh Kadam</span>
                    <span className="text-[9.5px] font-mono text-gray-400 block">{emailInput}</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold">Default</span>
                </div>

                {/* Add standard verification details */}
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-rose-950 text-left">
                  <span className="text-[8px] text-rose-400 font-mono tracking-widest uppercase block mb-1">
                    🔒 OAuth Permissions Requested:
                  </span>
                  <p className="text-[9px] text-gray-300 leading-normal">
                    This will grant WinZO Arcade access to check public profile, secure leaderboard rankings, and persist stake balance.
                  </p>
                </div>
              </div>

              <div className="flex justify-between gap-2.5 pt-2 border-t border-white/5">
                <button
                  id="google-cancel-btn"
                  onClick={() => { audio.playThud(); setStep('welcome'); }}
                  className="flex-1 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-wider py-2 bg-slate-950 rounded-lg cursor-pointer border border-white/5"
                >
                  Cancel
                </button>
                <button
                  id="google-select-btn"
                  onClick={handleSelectGoogleAccount}
                  className="flex-1 text-[10px] font-black bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-wider py-2 rounded-lg cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                >
                  Confirm Connect
                </button>
              </div>
            </motion.div>
          )}

          {step === 'set-password' && (
            <motion.div
              key="set-password"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col"
              id="step-set-password"
            >
              <div className="text-center mb-3">
                <span className="text-2xl">🔒</span>
                <h4 className="text-[13px] font-extrabold text-white uppercase tracking-wider block mt-1">
                  SECURE PASSWORD SHIELD
                </h4>
                <p className="text-[9px] text-gray-400 font-sans mt-0.5 leading-relaxed">
                  Excellent! Google ID Linked. Now choose a secure password to unlock stakes instantly.
                </p>
              </div>

              {/* Password submission form */}
              <form onSubmit={handleSetPasswordSubmit} className="flex flex-col gap-3.5">
                
                {/* Visual email tag metadata */}
                <div className="bg-black/30 p-2 rounded-lg text-center border border-white/5">
                  <span className="text-[8px] font-mono text-gray-400 uppercase">SYNCHRONIZING ID</span>
                  <span className="text-[11px] font-black text-amber-300 font-mono block">{emailInput}</span>
                </div>

                {/* Password field */}
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1 font-mono">Create Password:</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setErrorMessage('');
                        setNewPassword(e.target.value);
                        checkPasswordStrength(e.target.value);
                      }}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-3 pr-8 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white font-bold text-xs"
                    >
                      {showPassword ? '👁' : '🕶'}
                    </button>
                  </div>
                </div>

                {/* Confirm password field */}
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1 font-mono">Confirm Sec Password:</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setErrorMessage(''); setConfirmPassword(e.target.value); }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Live validation guidelines */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-2 rounded-lg border border-white/5 text-[8px] font-mono">
                  <div className={`text-center py-0.5 rounded ${passRequirements.length ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-slate-900/40 text-gray-400'}`}>
                    ⏱ Min 6 Chars
                  </div>
                  <div className={`text-center py-0.5 rounded ${passRequirements.number ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-slate-900/40 text-gray-400'}`}>
                    🔢 Has Digits
                  </div>
                  <div className={`text-center py-0.5 rounded ${passRequirements.special ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' : 'bg-slate-900/40 text-gray-400'}`}>
                    ✨ Has Special
                  </div>
                </div>

                {errorMessage && (
                  <span className="text-[9.5px] text-center font-bold text-rose-400 bg-rose-950/10 border border-rose-900/30 p-2 rounded-lg">
                    ⚠️ {errorMessage}
                  </span>
                )}

                {/* Submit action */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { audio.playThud(); setStep('welcome'); }}
                    className="flex-1 py-2 text-[10px] font-extrabold text-gray-400 uppercase tracking-wide bg-slate-955 rounded-xl cursor-pointer border border-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 text-slate-950 font-black text-[10px] uppercase py-2 rounded-xl transition-all hover:scale-102 cursor-pointer pr-1"
                  >
                    {loading ? 'Securing...' : '🔒 LOCK KEY'}
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {step === 'password-sign-in' && (
            <motion.div
              key="password-sign-in"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col"
              id="step-password-sign-in"
            >
              <div className="text-center mb-3">
                <span className="text-2xl">🔑</span>
                <h4 className="text-[13px] font-extrabold text-white uppercase tracking-wider block mt-1">
                  SIGN IN WITH KEY
                </h4>
                <p className="text-[9px] text-gray-400 font-sans mt-0.5 leading-relaxed">
                  Enter your secure passcode corresponding to Google ID ledger data.
                </p>
              </div>

              {/* Password sign-in form */}
              <form onSubmit={handlePasswordSignInSubmit} className="flex flex-col gap-3.5">
                
                {/* Email lookup */}
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1 font-mono">User Email:</span>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => { setErrorMessage(''); setEmailInput(e.target.value); }}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Password input */}
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1 font-mono">Security Password:</span>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => { setErrorMessage(''); setPasswordInput(e.target.value); }}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 px-3 text-xs font-mono text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {errorMessage && (
                  <span className="text-[9.5px] text-center font-bold text-rose-400 bg-rose-950/10 border border-rose-900/30 p-2 rounded-lg">
                    ⚠️ {errorMessage}
                  </span>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => { audio.playThud(); setStep('welcome'); }}
                    className="flex-1 py-1.5 text-[10px] font-extrabold text-gray-400 uppercase bg-slate-955 rounded-xl border border-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[10px] uppercase py-1.5 rounded-xl transition-all"
                  >
                    ACCESS LEDGER
                  </button>
                </div>

              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4 flex flex-col items-center"
              id="step-success"
            >
              <span className="text-4xl animate-bounce mb-2">✓</span>
              <h4 className="text-[13px] font-black text-emerald-400 uppercase tracking-widest mb-1 font-mono">
                GATEWAY CONFIRMED
              </h4>
              <p className="text-[10px] text-gray-300 max-w-[245px] leading-relaxed mb-4">
                WinZO Esports identity synchronized with <strong className="text-amber-400">{emailInput}</strong>. Password verified & ledger secured. Let the games begin!
              </p>
              <button
                onClick={() => { audio.playThud(); onClose(); }}
                className="bg-yellow-400 text-slate-950 font-black text-[10px] px-8 py-2 rounded-full uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all"
                id="login-auth-complete-btn"
              >
                🎮 BATTLE LOBBY
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
