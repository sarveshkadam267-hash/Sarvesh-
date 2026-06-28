import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';
import { Profile } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Activity,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface DepositModalProps {
  profile: Profile;
  onDepositSuccess: (amount: number) => void;
  onClose: () => void;
}

export default function DepositModal({ profile, onDepositSuccess, onClose }: DepositModalProps) {
  // Steps: amount -> upi_id -> scan_qr -> verifying -> success
  const [step, setStep] = useState<'amount' | 'upi_id' | 'scan_qr' | 'verifying' | 'success'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customInput, setCustomInput] = useState<string>('');
  
  // Payment option: Enter ID vs Scan QR
  const [paymentMethod, setPaymentMethod] = useState<'upi_id' | 'qr_code'>('upi_id');

  // Custom UPI ID state
  const [upiId, setUpiId] = useState<string>('');
  const [upiError, setUpiError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Collect request simulator countdown (5 minutes in seconds)
  const [collectCountdown, setCollectCountdown] = useState<number>(300);

  // Gateway Simulation Console logs during verifying state
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  const logsToSimulate = [
    "⚡ Initializing secure UPI payment check...",
    "🛡️ TLS 1.3 handshake established successfully (256-bit AES)",
    `🔒 Checking dispatch logs for UPI ID: ${upiId}...`,
    "📋 Querying National Payments Corporation of India (NPCI) gateway...",
    "📱 Fetching secure customer authorization status...",
    "✅ Collect authorization detected! Capturing settlement...",
    "🏦 Clearing funds into WinZO ledger...",
    "🎉 Transaction synchronized. Refilling cash balance..."
  ];

  // Tick the collect request countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'scan_qr') {
      setCollectCountdown(300);
      timer = setInterval(() => {
        setCollectCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Handle the verification steps logs loop
  useEffect(() => {
    if (step === 'verifying') {
      setVerificationLogs([logsToSimulate[0]]);
      setCurrentLogIndex(0);

      const interval = setInterval(() => {
        setCurrentLogIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < logsToSimulate.length) {
            setVerificationLogs((prev) => [...prev, logsToSimulate[nextIndex]]);
            audio.playThud();
            return nextIndex;
          } else {
            clearInterval(interval);
            // Complete deposit on success
            setTimeout(() => {
              audio.playCoin();
              onDepositSuccess(selectedAmount);
              setStep('success');
            }, 1000);
            return prevIndex;
          }
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleSelectAmount = (amt: number) => {
    audio.playThud();
    setSelectedAmount(amt);
    setCustomInput('');
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomInput(val);
    if (val) {
      setSelectedAmount(parseInt(val, 10));
    }
  };

  const handleProceedToUpiId = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAmount < 10) {
      alert('⚠️ Minimum deposit is ₹10.');
      return;
    }
    audio.playCoin();
    setStep('upi_id');
  };

  const handleUpiSufixClick = (suffix: string) => {
    audio.playThud();
    // Strip existing suffix if present, then append selected one
    const base = upiId.split('@')[0];
    if (base) {
      setUpiId(base + suffix);
    } else {
      setUpiId('user' + suffix);
    }
    setUpiError('');
  };

  const validateUpiId = (id: string): boolean => {
    if (!id) {
      setUpiError('UPI ID cannot be empty.');
      return false;
    }
    const parts = id.split('@');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setUpiError('Enter a valid UPI ID (e.g., name@bank).');
      return false;
    }
    // Simple regex check
    const upiRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(id)) {
      setUpiError('Format error. Enter a valid UPI handle.');
      return false;
    }
    setUpiError('');
    return true;
  };

  const handleUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = upiId.trim();
    if (!validateUpiId(cleanId)) {
      audio.playThud();
      return;
    }
    audio.playCoin();
    setStep('scan_qr');
  };

  const handleVerifyPaymentSubmit = () => {
    audio.playThud();
    setStep('verifying');
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-sans"
      id="deposit-gateway-overlay"
    >
      <div
        className="w-full max-w-[350px] bg-[#0c101d] rounded-2xl border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col p-5 relative transition-all duration-300"
        id="deposit-modal-box"
      >
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Enter/Select Amount */}
          {step === 'amount' && (
            <motion.div
              key="select-amount-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-4 text-left"
              id="deposit-step-amount"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    ₹ ADD GAME MONEY
                  </h3>
                  <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">
                    UPI Secure Payment Gateway
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white hover:bg-white/5 px-2 py-1 rounded-full cursor-pointer text-xs animate-pulse"
                >
                  ✕
                </button>
              </div>

              {/* Wallet Info Display */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-gray-500 font-mono block uppercase">CURRENT LEDGER</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">₹ {profile.coins.toLocaleString('en-IN')} Cash</span>
                </div>
                <span className="text-2xl animate-pulse">🏛️</span>
              </div>

              {/* Presets Grid */}
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase font-mono block mb-2">
                  Select Refill Amount (₹):
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectAmount(amt)}
                      className={`py-2 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs font-black font-mono ${
                        selectedAmount === amt && !customInput
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)] scale-105'
                          : 'bg-slate-950/50 border-white/5 text-gray-400 hover:bg-slate-900 hover:border-white/10'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleProceedToUpiId} className="flex flex-col gap-4">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase font-mono block mb-1.5">
                    Or Enter Custom Amount (₹):
                  </span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">₹</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="Enter other amount"
                      value={customInput}
                      onChange={handleCustomInputChange}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 pl-7 pr-3 text-sm font-bold font-mono focus:outline-none focus:border-emerald-500 text-white"
                    />
                  </div>
                  <span className="text-[8px] text-gray-500 font-mono mt-1 block">
                    * Minimum: ₹10. Refill is instant, highly secure, and PCI-DSS compliant.
                  </span>
                </div>

                {/* Submit action */}
                <button
                  type="submit"
                  disabled={selectedAmount < 10}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-550 text-slate-950 font-black text-[12px] py-3 rounded-xl uppercase tracking-wide transition-all duration-150 hover:scale-[1.01] cursor-pointer active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                >
                  <span>PROCEED TO UPI PAYMENT</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Enter UPI ID */}
          {step === 'upi_id' && (
            <motion.div
              key="upi-id-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 text-left"
              id="deposit-step-upi-id"
            >
              {/* Back Header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => { audio.playThud(); setStep('amount'); }}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-black font-mono">₹{selectedAmount.toLocaleString('en-IN')} Cash</span>
                </div>
              </div>

              <div className="mb-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  ✍️ ENTER YOUR UPI ID
                </h4>
                <p className="text-[8.5px] text-gray-500 uppercase font-mono mt-0.5 leading-none">
                  Your deposit transaction will be associated with this ID
                </p>
              </div>

              <form onSubmit={handleUpiSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[9px] font-bold text-gray-450 uppercase font-mono block mb-1.5">
                    YOUR UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. username@okhdfcbank"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      setUpiError('');
                    }}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 px-3.5 text-xs font-bold font-mono focus:outline-none focus:border-yellow-500 text-white placeholder-gray-700"
                  />
                  {upiError && (
                    <span className="text-[8px] text-red-400 font-semibold mt-1 block flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> {upiError}
                    </span>
                  )}
                </div>

                {/* Suggested Handles */}
                <div>
                  <span className="text-[8px] font-bold text-gray-500 uppercase font-mono block mb-1.5">
                    Suggested Handles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['@ybl', '@paytm', '@okaxis', '@okhdfcbank', '@apl'].map((suffix) => (
                      <button
                        key={suffix}
                        type="button"
                        onClick={() => handleUpiSufixClick(suffix)}
                        className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-950 border border-white/5 hover:border-yellow-500/30 rounded text-gray-300 hover:text-white cursor-pointer transition-all"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[11px] py-3 rounded-xl uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-98 shadow-[0_4px_12px_rgba(234,179,8,0.15)] flex items-center justify-center gap-1 mt-2"
                >
                  <span>PROCEED TO PAY</span>
                  <ArrowRight className="w-3 h-3 stroke-[3]" />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Scan QR Code with entered UPI ID embedded */}
          {step === 'scan_qr' && (
            <motion.div
              key="scan-qr-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-3.5 text-center"
              id="deposit-step-scan-qr"
            >
              {/* Back Header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5 w-full text-left">
                <button
                  type="button"
                  onClick={() => { audio.playThud(); setStep('upi_id'); }}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-black font-mono">₹{selectedAmount.toLocaleString('en-IN')} Cash</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-1.5 justify-center leading-none">
                  📸 SCAN QR & PAY
                </h4>
                <p className="text-[8px] text-gray-500 uppercase font-mono mt-1.5 leading-none">
                  Scan using Google Pay, PhonePe, Paytm or BHIM
                </p>
              </div>

              {/* QR Image Container with elegant glowing frame */}
              <div className="p-3 bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.6)] border border-yellow-500/40 flex items-center justify-center relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `upi://pay?pa=8668558080@fam&pn=Sarvesh&cu=INR&am=${selectedAmount}&tn=Deposit_from_${upiId}`
                  )}&color=0c101d&bgcolor=ffffff`}
                  alt="UPI QR Code"
                  className="w-[125px] h-[125px] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Transaction amount information */}
              <div className="flex flex-col gap-1 items-center bg-slate-950/80 px-4 py-2 rounded-xl border border-white/5 w-full">
                <span className="text-emerald-400 font-black text-[12px] font-mono uppercase tracking-wide">
                  AMOUNT TO PAY: ₹{selectedAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[7.5px] text-gray-450 font-mono tracking-widest uppercase">
                  Refill associates with: <strong className="text-yellow-400 font-bold select-all">{upiId}</strong>
                </span>
              </div>

              {/* Countdown timer to build reality & sense of session safety */}
              <div className="flex items-center gap-2 justify-center py-0.5 select-none">
                <span className="text-[8px] font-mono text-gray-500 uppercase">QR SESSION EXPIRES IN:</span>
                <span className="text-[10px] font-mono text-yellow-500 font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-white/5 animate-pulse">
                  {formatTime(collectCountdown)}
                </span>
              </div>

              {/* Secure encrypted gateway security note */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 border border-white/5 rounded-xl px-4 py-1.5 w-full justify-center text-gray-400">
                <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-yellow-500/80">
                  🛡️ SECURE ENCRYPTED GATEWAY
                </span>
              </div>

              <button
                type="button"
                onClick={handleVerifyPaymentSubmit}
                className="w-full bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black text-[11px] py-3 rounded-xl uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-98 shadow-[0_4px_12px_rgba(234,179,8,0.25)] flex items-center justify-center gap-1"
              >
                <span>⚡ I HAVE SCANNED & PAID</span>
                <ArrowRight className="w-3 h-3 stroke-[3]" />
              </button>
            </motion.div>
          )}

          {/* STEP 4: Secure Handshake & Encryption Simulator */}
          {step === 'verifying' && (
            <motion.div
              key="verifying-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4 flex flex-col items-center justify-center"
              id="deposit-step-verifying"
            >
              {/* Padlock status animation */}
              <div className="relative mb-3.5 w-14 h-14 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-emerald-400 animate-spin" />
                <Lock className="w-6 h-6 text-emerald-400 absolute animate-pulse stroke-[2.5]" />
              </div>

              <h4 className="text-[10px] font-black text-yellow-300 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
                SECURE UPI PROOF VERIFIER
              </h4>

              {/* Console log outputs */}
              <div className="w-full bg-slate-950/90 border border-white/5 rounded-xl p-3 font-mono text-[7.5px] text-left leading-relaxed h-[115px] overflow-y-auto shadow-inner flex flex-col gap-1 select-none">
                {verificationLogs.map((log, idx) => (
                  <div key={idx} className="text-emerald-400/90 font-semibold truncate animate-fadeIn">
                    {log}
                  </div>
                ))}
              </div>

              <p className="text-[8.5px] text-gray-500 font-mono mt-3 uppercase tracking-tight flex items-center gap-1">
                🔒 AES-256 Bit SSL | UPI Security Core
              </p>
            </motion.div>
          )}

          {/* STEP 5: Success confirmation Screen */}
          {step === 'success' && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-4 flex flex-col items-center"
              id="deposit-step-success"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-400/30 flex items-center justify-center mb-3 animate-bounce">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>

              <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-1 font-mono">
                REQUEST SUBMITTED!
              </h4>
              <p className="text-[10px] text-gray-300 max-w-[260px] leading-relaxed mb-4 font-sans text-center">
                Your deposit request of <strong className="text-emerald-400 text-xs font-mono font-bold">₹{selectedAmount.toLocaleString('en-IN')} Cash</strong> has been successfully submitted to the Admin. It is currently <strong className="text-amber-400">PENDING APPROVAL</strong>.
              </p>

              {/* Transaction Receipt */}
              <div className="w-full bg-slate-950 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5 text-left mb-4 font-mono text-[8.5px] text-gray-400">
                <div className="flex justify-between">
                  <span>TRANSACTION ID:</span>
                  <span className="text-white font-bold uppercase">TXN-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI ID SENDER:</span>
                  <span className="text-cyan-400 font-bold break-all select-all">{upiId}</span>
                </div>
                <div className="flex justify-between">
                  <span>METHOD USED:</span>
                  <span className="text-white font-bold uppercase">⚡ UPI COLLECT REQUEST</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="text-amber-500 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    PENDING_ADMIN_APPROVAL
                  </span>
                </div>
              </div>

              <div className="text-[9px] text-gray-500 font-mono text-center mb-4 leading-normal bg-slate-900/40 p-2 rounded-lg border border-white/5">
                💡 <span className="text-amber-400">Testing Tip:</span> Go to your <strong className="text-gray-300">Profile &gt; Admin Tools</strong> panel to manually approve or reject your pending transactions!
              </div>

              <button
                onClick={onClose}
                className="bg-yellow-400 text-slate-950 font-black text-[11px] px-8 py-2.5 rounded-full uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(234,179,8,0.3)]"
                id="deposit-success-done-btn"
              >
                🎮 LET'S BATTLE
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
