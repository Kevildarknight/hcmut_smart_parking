/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  User as UserIcon, 
  MapPin, 
  CreditCard, 
  History, 
  Bell, 
  Smartphone, 
  Cpu, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  LogIn,
  LogOut,
  Car,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { UserRole, ParkingSession, SessionStatus, ParkingSlot } from './types';
import { PRICING_POLICIES, ZONES } from './constants';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

// --- Components ---

const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[color]}`}>{children}</span>;
};

const Card = ({ children, className = '', id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <div id={id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Sub-Apps ---

function GateKioskSimulator() {
  const [step, setStep] = useState<'IDLE' | 'VERIFYING' | 'WELCOME' | 'VISITOR_PLATE' | 'BARRIER_OPEN'>('IDLE');
  const [mode, setMode] = useState<'MEMBER' | 'VISITOR'>('MEMBER');
  const [session, setSession] = useState<Partial<ParkingSession> | null>(null);

  const simulateTap = (role: UserRole) => {
    setStep('VERIFYING');
    setTimeout(() => {
      setSession({
        role,
        entryTime: new Date(),
        plateNumber: role === UserRole.VISITOR ? '51A-123.45' : '43B-999.88'
      });
      setStep('WELCOME');
      setTimeout(() => setStep('BARRIER_OPEN'), 2000);
      setTimeout(() => setStep('IDLE'), 6000);
    }, 1500);
  };

  return (
    <div id="kiosk-sim" className="h-full flex items-center justify-center bg-slate-900 p-8">
      <Card id="kiosk-terminal" className="w-full max-w-lg aspect-video flex flex-col items-center justify-center p-12 bg-slate-800 border-slate-700 text-white relative overflow-hidden rounded-3xl">
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.5),transparent)] pointer-events-none" />

        <AnimatePresence mode="wait">
          {step === 'IDLE' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-blue-600">HCMUT Parking</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">Please select entry method</p>
              </div>
              <div className="flex gap-4">
                <button 
                  id="btn-member-tap"
                  onClick={() => simulateTap(UserRole.STUDENT)}
                  className="flex flex-col items-center gap-3 p-6 bg-brand hover:bg-blue-700 rounded-2xl transition-all group shadow-lg shadow-blue-900/40"
                >
                  <CreditCard className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Member ID</span>
                </button>
                <button 
                  id="btn-visitor-ticket"
                  onClick={() => setStep('VISITOR_PLATE')}
                  className="flex flex-col items-center gap-3 p-6 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-all group shadow-lg shadow-slate-900/40"
                >
                  <Car className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Visitor Ticket</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'VERIFYING' && (
            <motion.div key="verifying" className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] animate-pulse text-blue-400">Verifying ID...</p>
            </motion.div>
          )}

          {step === 'VISITOR_PLATE' && (
            <motion.div key="plate" className="w-full space-y-6 text-center">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Plate Recognition</h3>
              <div className="bg-white text-slate-800 p-4 rounded-xl font-mono text-4xl font-bold tracking-widest inline-block border-4 border-slate-700 shadow-2xl">
                59A-123.45
              </div>
              <div className="flex justify-center gap-3">
                <button onClick={() => setStep('IDLE')} className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold uppercase">Cancel</button>
                <button onClick={() => simulateTap(UserRole.VISITOR)} className="px-6 py-2 rounded-lg bg-brand hover:bg-blue-600 text-xs font-bold uppercase shadow-lg shadow-blue-900/40">Confirm & Print</button>
              </div>
            </motion.div>
          )}

          {step === 'WELCOME' && (
            <motion.div key="welcome" className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Welcome!</h2>
                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold font-mono">{session?.role}</p>
              </div>
              <p className="text-slate-500 font-mono text-xs">Entry: {session?.entryTime?.toLocaleTimeString()}</p>
            </motion.div>
          )}

          {step === 'BARRIER_OPEN' && (
            <motion.div key="barrier" className="text-center space-y-8">
               <motion.div 
                animate={{ rotate: [-15, 0, -15] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-48 h-5 bg-yellow-500 mx-auto rounded-full origin-left -rotate-12 shadow-2xl" 
               />
               <h3 className="text-5xl font-black text-green-500 uppercase tracking-tighter italic">Barrier Open</h3>
               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Please proceed with caution</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] uppercase tracking-widest text-slate-500 font-mono italic">
          <span>Node ID: GATE_E_01</span>
          <span>Online / Standard Mode</span>
        </div>
      </Card>
    </div>
  );
}

function MemberPortal() {
  const getFee = (date: Date) => (date.getHours() >= 18 ? 3000 : 2000);

  const [sessions, setSessions] = useState<ParkingSession[]>([
    { 
      id: '1', 
      plateNumber: '43B-999.88', 
      entryTime: new Date(Date.now() - 3600000), 
      role: UserRole.STUDENT, 
      status: SessionStatus.ACTIVE, 
      fee: 0 
    },
    { 
      id: '2', 
      plateNumber: '43B-999.88', 
      entryTime: new Date(Date.now() - 86400000), 
      exitTime: new Date(Date.now() - 82800000), 
      role: UserRole.STUDENT, 
      status: SessionStatus.PAID, 
      fee: 4000 
    },
  ]);

  const [balanceDue, setBalanceDue] = useState(12000);
  const [paymentState, setPaymentState] = useState<'IDLE' | 'PROCESSING' | 'PAID' | 'ERROR' | 'PENDING'>('IDLE');
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCountdown, setRetryCountdown] = useState(0);
  
  // State cho tính năng Nạp tiền và Animation
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [recentTopUp, setRecentTopUp] = useState<number | null>(null);

  const activeSession = sessions.find(s => s.status === SessionStatus.ACTIVE);
  const currentFee = activeSession ? getFee(new Date()) : 0;

  const handlePayment = () => {
    if (paymentState !== 'IDLE' || !activeSession) return;
    
    if (balanceDue < currentFee) {
      setErrorMessage("Insufficient Balance");
      setPaymentState('ERROR');
      setTimeout(() => {
        setPaymentState('IDLE');
        setErrorMessage("");
      }, 3000);
      return;
    }

    setPaymentState('PROCESSING');

    setTimeout(() => {
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        const newBalance = balanceDue - currentFee;
        setBalanceDue(newBalance);
        setPaymentState('PAID');
        
        setSessions(prev => prev.map(s => 
          s.id === activeSession.id ? { ...s, status: SessionStatus.PAID, exitTime: new Date(), fee: currentFee } : s
        ));
        
        setTimeout(() => {
           setPaymentState('IDLE');
           setSessions(prev => [
             { id: Date.now().toString(), plateNumber: '43B-999.88', entryTime: new Date(), role: UserRole.STUDENT, status: SessionStatus.ACTIVE, fee: 0 },
             ...prev
           ]);
        }, 2000);

      } else {
        setErrorMessage("Gateway Timeout");
        setPaymentState('ERROR');
        setTimeout(() => {
          setPaymentState('PENDING');
          startRetryTimer(5);
        }, 2000);
      }
    }, 1500); 
  };

  const startRetryTimer = (seconds: number) => {
    setRetryCountdown(seconds);
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPaymentState('IDLE');
          setErrorMessage("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Hàm xử lý Nạp tiền đã thêm hiệu ứng
  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(topUpAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      setBalanceDue(prev => prev + amount);
      setTopUpAmount(''); // Reset input sau khi nạp xong
      
      // Kích hoạt animation hiện số tiền
      setRecentTopUp(amount);
      
      // Ẩn hiệu ứng đi sau 1.5 giây
      setTimeout(() => {
        setRecentTopUp(null);
      }, 1500);
    }
  };

  return (
    <div id="member-portal" className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto h-full flex flex-col overflow-auto relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Hi, Nguyen Tan Dat</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Student ID: 2352235 • Building C6</p>
        </div>
        <div className="flex gap-2">
          <Card className="px-4 py-2 flex items-center gap-2 bg-slate-50 border-slate-200">
             <CreditCard className="w-4 h-4 text-brand" />
             <span className="text-[10px] font-bold uppercase tracking-wider">BKPay Linked</span>
          </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card id="active-session" className={`p-8 border-l-4 relative overflow-hidden group transition-colors ${paymentState === 'PAID' ? 'border-l-green-500' : 'border-l-brand'}`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
               <Car className={`w-32 h-32 ${paymentState === 'PAID' ? 'text-green-500' : 'text-brand'}`} />
            </div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Car className="w-3 h-3" /> {activeSession ? 'Current Session' : 'Latest Session'}
              </h3>
              <Badge color={paymentState === 'PAID' ? 'slate' : 'green'}>
                {paymentState === 'PAID' ? 'CONCLUDED' : 'ACTIVE'}
              </Badge>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Plate Number</span>
                <span className="text-5xl font-mono font-black tracking-tighter text-slate-900">43B-999.88</span>
              </div>
              <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                <div className="pr-4">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Duration</p>
                  <p className="text-xl font-bold tracking-tight">1h 12m</p>
                </div>
                <div className="pl-6">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Accrued Fee</p>
                  <p className={`text-xl font-bold tracking-tight ${paymentState === 'PAID' ? 'text-green-600' : 'text-brand'}`}>
                    {paymentState === 'PAID' && activeSession 
                      ? currentFee.toLocaleString() 
                      : activeSession 
                        ? currentFee.toLocaleString() 
                        : '0'} VND
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Parking History</h3>
            <Card id="history-list">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">In/Out Session</th>
                    <th className="px-6 py-4 text-right">Status / Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 italic">
                  {sessions.filter(s => s.status === SessionStatus.PAID).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-6 text-sm font-bold text-slate-900">
                        {s.entryTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-6 font-normal">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{s.entryTime.toLocaleTimeString()}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{s.exitTime ? s.exitTime.toLocaleTimeString() : '---'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-right font-black text-slate-900 italic tracking-tighter">
                         <span className="text-green-600 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> {s.fee.toLocaleString()} VND</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className={`p-8 border shadow-sm relative overflow-hidden transition-all duration-500 ${
             paymentState === 'PAID' ? 'bg-green-50 border-green-200' :
             paymentState === 'ERROR' ? 'bg-red-50 border-red-200' :
             paymentState === 'PENDING' ? 'bg-yellow-50 border-yellow-200' :
             'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${paymentState === 'IDLE' ? 'text-slate-400' : 'opacity-70'}`}>
                <History className="w-3 h-3" /> Monthly Invoice
              </h3>
              {paymentState === 'PAID' ? <Badge color="green">RECEIPT</Badge> : <Badge color="slate">MAY 2026</Badge>}
            </div>
            
            <div className="space-y-1 py-4 text-center md:text-left relative">
               <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500">Available Funds</p>
               
               {/* Khối chứa UI số tiền và animation */}
               <div className="relative inline-block">
                 <p className={`text-5xl font-black tracking-tighter ${paymentState === 'PAID' ? 'text-green-600' : 'text-brand'}`}>
                   {balanceDue.toLocaleString()}<span className="text-sm ml-1 font-bold opacity-60">VND</span>
                 </p>
                 
                 {/* Animation bay lên */}
                 <AnimatePresence>
                   {recentTopUp !== null && (
                     <motion.div
                       initial={{ opacity: 0, y: 10, scale: 0.8 }}
                       animate={{ opacity: 1, y: -40, scale: 1.1 }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 1.2, ease: "easeOut" }}
                       className="absolute top-0 right-0 text-green-500 font-black text-xl tracking-tighter drop-shadow-sm whitespace-nowrap"
                     >
                       + {recentTopUp.toLocaleString()}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {paymentState === 'ERROR' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-600 font-bold mb-4 flex items-center gap-2 bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" /> {errorMessage}
              </motion.div>
            )}
            
            <button 
              onClick={handlePayment}
              disabled={paymentState !== 'IDLE' || !activeSession}
              className={`w-full mt-4 py-4 font-black rounded-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm ${
                paymentState === 'PAID' ? 'bg-green-600 text-white shadow-green-600/30' :
                paymentState === 'PROCESSING' ? 'bg-brand/80 text-white cursor-wait' :
                paymentState === 'ERROR' ? 'bg-red-600 text-white' :
                paymentState === 'PENDING' ? 'bg-yellow-500 text-white' :
                'bg-brand text-white hover:shadow-lg hover:shadow-brand/30 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {paymentState === 'PROCESSING' ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : paymentState === 'PAID' ? (
                <>Success <CheckCircle2 className="w-4 h-4" /></>
              ) : paymentState === 'ERROR' ? (
                <>Failed</>
              ) : paymentState === 'PENDING' ? (
                <>Retry in {retryCountdown}s...</>
              ) : (
                <>Pay {currentFee.toLocaleString()} VND <ArrowRightLeft className="w-4 h-4" /></>
              )}
            </button>
          </Card>

          {/* Form Nạp tiền thay thế cho QR Code */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4 font-normal">
                <div className="p-3 bg-slate-50 rounded-xl shadow-sm border border-slate-100">
                  <CreditCard className="w-6 h-6 text-brand" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Top Up Wallet</p>
                   <p className="text-[10px] text-slate-500 font-medium">Add funds for parking</p>
                </div>
             </div>
             <form onSubmit={handleTopUp} className="space-y-3 mt-4">
                <div className="relative">
                   <input
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="Enter amount..."
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VND</span>
                </div>
                <button
                   type="submit"
                   disabled={!topUpAmount || Number(topUpAmount) <= 0}
                   className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   Confirm Top Up
                </button>
             </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, targetRole }: { onLogin: (user: AuthUser) => void, targetRole: UserRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: '2352235',
        name: targetRole === UserRole.ADMIN ? 'Admin User' : targetRole === UserRole.OPERATOR ? 'Nguyen Minh Quan' : 'Nguyen Tan Dat',
        role: targetRole,
        email: 'dat.nguyen@hcmut.edu.vn'
      });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div id="login-screen" className="h-full flex items-center justify-center bg-slate-50 p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-none ring-1 ring-slate-200">
          <div className="bg-slate-900 p-10 text-center text-white space-y-4">
             <div className="w-16 h-16 bg-brand rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-600/30">BK</div>
             <div>
                <h2 className="text-xl font-black tracking-tight uppercase">HCMUT SSO</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Single Sign-On Service</p>
             </div>
          </div>
          
          <form className="p-10 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">HCMUT ID / Account</label>
              <div className="relative">
                 <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                  type="text" 
                  placeholder="e.g. 2352235" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-medium"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                 />
                 <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                 >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 text-[10px] font-bold uppercase tracking-widest">
               <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                  <input type="checkbox" className="w-3 h-3 rounded border-slate-200" /> Remember Me
               </label>
               <a href="#" className="text-brand hover:underline">Forgot?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In Securely <ChevronRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="pt-6 text-center space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Target Access Role: <span className="text-brand">{targetRole}</span></p>
              <div className="h-px bg-slate-100" />
              <p className="text-[10px] text-slate-300 italic font-medium">Protect your password. Never share your credentials.</p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

function OperatorDashboard({ onLogout }: { onLogout: () => void }) {
  const socketRef = useRef<Socket | null>(null);
  const [filter, setFilter] = useState('All');
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<any | null>(null);

  useEffect(() => {
    // Connect to the same host/port the app is served from
    const socket: Socket = io();
    socketRef.current = socket;

    socket.on('slots:init', (initialSlots: ParkingSlot[]) => {
      setSlots(initialSlots);
    });

    socket.on('slots:update', (updatedSlot: ParkingSlot) => {
      setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s));
      
      const logEntry = {
        id: Date.now(),
        plate: updatedSlot.isOccupied ? 'BK-' + updatedSlot.id : updatedSlot.id,
        action: updatedSlot.isOccupied ? 'Occupied' : 'Vacated',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: updatedSlot.isOccupied ? 'IoT Detected' : 'Cleared',
        sensor: updatedSlot.id,
        type: updatedSlot.isOccupied ? 'in' : 'out'
      };
      
      setLogs(prev => [logEntry, ...prev].slice(0, 8));
    });

    socket.on('system:alert', (newAlert: any) => {
      setAlerts(prev => [newAlert, ...prev].slice(0, 5));
      setActiveToast(newAlert);
      
      setTimeout(() => {
        setActiveToast((current: any) => current?.id === newAlert.id ? null : current);
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleResolveAlert = (alert: any) => {
    if (socketRef.current) {
      socketRef.current.emit('alert:resolve', alert.id);
      
      // If it's the specific gate error, we can also trigger a reset mock
      if (alert.message.includes('Gate E_02')) {
        socketRef.current.emit('gate:reset', 'Gate E_02');
      }
    }
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    if (activeToast?.id === alert.id) setActiveToast(null);
  };

  const stats = useMemo(() => ({
    total: slots.length,
    occupied: slots.filter(s => s.isOccupied).length,
    offline: slots.filter(s => !s.isOnline).length,
  }), [slots]);

  return (
    <div id="operator-dashboard" className="flex flex-col h-full bg-slate-50">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic underline decoration-brand/30 decoration-4 underline-offset-4">Zone A1 - Building C6</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ly Thuong Kiet Campus Dashboard</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Nguyen Minh Quan</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator (Security)</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 flex gap-8 overflow-hidden">
        {/* Left Column: Stats & Logs */}
        <div className="w-1/3 flex flex-col gap-8 shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 bg-white border-none shadow-md shadow-blue-900/5 group">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-brand transition-colors">Available</p>
              <p className="text-4xl font-black font-mono text-brand tracking-tighter italic">{stats.total - stats.occupied}</p>
            </Card>
            <Card className="p-5 bg-white border-none shadow-md shadow-slate-900/5 group">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-slate-900 transition-colors">Occupied</p>
              <p className="text-4xl font-black font-mono text-slate-800 tracking-tighter italic">{stats.occupied}</p>
            </Card>
          </div>

          <Card className="flex-1 flex flex-col border-none shadow-xl shadow-slate-900/5 min-h-0">
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <History className="w-3 h-3" /> Recent Activity
              </h3>
              <Badge color="slate">Live</Badge>
            </div>
            <div className="flex-1 p-5 space-y-5 overflow-auto custom-scrollbar">
              {logs.length > 0 ? logs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id} 
                  className={`flex items-center gap-3 border-l-[3px] ${log.type === 'in' ? 'border-green-500' : 'border-slate-400'} pl-4 py-1 group`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold font-mono tracking-tight text-slate-800">{log.plate} <span className="font-bold uppercase text-[10px] opacity-40 ml-1 italic">{log.action}</span></p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{log.time} • {log.user}</p>
                  </div>
                  <span className="text-[10px] font-mono font-black text-slate-300 group-hover:text-slate-500 transition-colors uppercase italic">{log.sensor}</span>
                </motion.div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                  <Cpu className="w-10 h-10 text-slate-300 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waiting for IoT Pulse...</p>
                </div>
              )}
            </div>
            <button className="p-5 text-[10px] font-black text-brand hover:bg-brand-light transition-colors uppercase tracking-[0.2em] border-t border-slate-50 flex items-center justify-center gap-2">
              View All Station Logs <ChevronRight className="w-3 h-3" />
            </button>
          </Card>
        </div>

        {/* Right Column: Grid Map */}
        <Card className="flex-1 bg-white border-slate-200 shadow-2xl flex flex-col rounded-3xl overflow-hidden ring-4 ring-slate-100">
          <div className="p-6 flex justify-between items-center border-b border-slate-100 shrink-0">
            <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand rounded-sm shadow-sm"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-200 rounded-sm"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Occupied</span>
              </div>
            </div>
            <div className="flex gap-2">
              {ZONES.map(z => (
                <button 
                  key={z} 
                  onClick={() => setFilter(z)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === z ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-10 overflow-auto bg-slate-50/30">
            <div id="grid-map" className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-4">
              {slots.filter(s => filter === 'All' || s.zone === filter).map(s => (
                <motion.div 
                  key={s.id}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-[10px] font-bold font-mono transition-all shadow-md group cursor-pointer ${
                    !s.isOnline ? 'bg-slate-100 border-slate-200 text-slate-300' :
                    s.isOccupied ? 'bg-slate-200 border-slate-300 text-slate-500' : 
                    'bg-brand border-blue-400 text-white shadow-blue-500/20'
                  }`}
                >
                   {s.id}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-brand-light border-t border-brand/10 flex items-center gap-4 shrink-0 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div 
                key={alerts[0]?.id || 'default'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-4 w-full"
              >
                <div className={`p-3 rounded-2xl text-white shadow-lg ${alerts[0] ? (alerts[0].type === 'SECURITY' || alerts[0].type === 'CRITICAL' ? 'bg-red-600 shadow-red-900/40' : 'bg-yellow-500 shadow-yellow-900/40') : 'bg-brand shadow-blue-900/40'}`}>
                  {alerts[0]?.icon === 'ShieldCheck' ? <ShieldCheck className="w-5 h-5" /> : alerts[0]?.icon === 'Cpu' ? <Cpu className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900">{alerts[0] ? `${alerts[0].type} NOTIFICATION` : 'Zone Occupancy Alert'}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${alerts[0] ? (alerts[0].type === 'SECURITY' || alerts[0].type === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600') : 'text-brand'}`}>
                    {alerts[0] ? alerts[0].message : `Zone A1 is at ${Math.round((stats.occupied / stats.total) * 100)}% capacity. Redirect recommended if > 80%.`}
                  </p>
                </div>
                {alerts[0] && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResolveAlert(alerts[0]);
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm ${
                      alerts[0].type === 'SECURITY' || alerts[0].type === 'CRITICAL' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : (alerts[0].type === 'SUCCESS' ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-black')
                    }`}
                  >
                    {alerts[0].message.includes('Gate E_02') ? 'Reset Systems' : 'Acknowledge'}
                  </button>
                )}
                {alerts.length > 1 && (
                  <div className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                    +{alerts.length - 1} MORE
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Real-time Toast Overlay */}
          <AnimatePresence>
            {activeToast && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ring-4 ring-white/10 ${
                  activeToast.type === 'SECURITY' || activeToast.type === 'CRITICAL' 
                  ? 'bg-red-600 border-red-500 text-white' 
                  : 'bg-yellow-500 border-yellow-400 text-white'
                }`}>
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      {activeToast.icon === 'ShieldCheck' ? <ShieldCheck className="w-6 h-6" /> : activeToast.icon === 'Cpu' ? <Cpu className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                   </div>
                   <div>
                      <h4 className="text-sm font-black uppercase tracking-widest leading-none">{activeToast.type} ALERT</h4>
                      <p className="text-[10px] font-bold uppercase tracking-[0.05em] mt-1 opacity-90">{activeToast.message}</p>
                   </div>
                   <div className="ml-4 pl-4 border-l border-white/20">
                      <p className="text-[10px] font-mono font-black italic">NOW</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

function AdminConsole() {
  const [policies, setPolicies] = useState(PRICING_POLICIES);

  return (
    <div id="admin-console" className="p-6 md:p-8 space-y-8 h-full bg-slate-50">
       <header className="flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg"><Settings className="w-6 h-6 text-white" /></div> Admin Configuration
        </h1>
        <button className="px-5 py-2 bg-hcmut-blue text-white rounded-lg font-bold shadow-lg shadow-hcmut-blue/20 hover:scale-105 active:scale-95 transition-transform">Deploy New Rules</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col">
          <div className="p-5 border-b border-slate-100">
             <h3 className="font-bold text-lg">Pricing Policies</h3>
             <p className="text-sm text-slate-500">Configure rates per role and zone</p>
          </div>
          <div className="p-5 space-y-4">
            {policies.map(p => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-hcmut-blue hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:bg-hcmut-blue group-hover:text-white transition-colors">
                     {p.role === UserRole.STUDENT ? <Smartphone className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold">{p.role}</p>
                    <p className="text-xs text-slate-500">{p.ratePerHour.toLocaleString()} VND / hr</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{p.gracePeriodMinutes}m <span className="text-slate-400 font-normal">Grace</span></p>
                  <button className="text-xs font-bold text-hcmut-blue opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tight">Edit Policy</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
           <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">System Integrity Audit</h3>
                <p className="text-sm text-slate-500">Recent master configuration changes</p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-400 cursor-help"><ShieldCheck className="w-5 h-5" /></div>
           </div>
           <div className="p-5 space-y-6">
              {[
                { actor: 'Admin (Dat)', action: 'Updated Pricing Policy v2.4', date: '2h ago', status: 'Published' },
                { actor: 'Operator (Khanh)', action: 'Manual Barrier Override: Gate E_02', date: '5h ago', status: 'Audit Req' },
                { actor: 'System', action: 'Auto-sync: 1,422 sessions to BKPay', date: '1d ago', status: 'Success' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4">
                   <div className="w-1 bg-slate-200 rounded-full" />
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-xs font-bold text-slate-900 tracking-tight underline cursor-pointer">{log.actor}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.date}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{log.action}</p>
                      <div className="mt-2"><Badge color={log.status === 'Success' ? 'green' : log.status === 'Audit Req' ? 'red' : 'slate'}>{log.status}</Badge></div>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-auto p-5 bg-slate-900 text-white rounded-b-xl border-t border-white/5 flex items-center gap-3">
              <div className="p-2 bg-hcmut-gold rounded text-slate-900 group cursor-pointer hover:scale-105 transition-transform"><Search className="w-4 h-4" /></div>
              <input type="text" placeholder="Search audit trail by actor ID or date range..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500 font-mono tracking-tighter" />
           </div>
        </Card>
      </div>
    </div>
  );
}

// --- Main Shell ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'KIOSK' | 'MEMBER' | 'DASHBOARD' | 'ADMIN'>('KIOSK');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tabs = [
    { id: 'KIOSK', label: 'Gate Kiosk', icon: ArrowsRightLeft },
    { id: 'MEMBER', label: 'Member App', icon: Smartphone, requiredRole: UserRole.STUDENT },
    { id: 'DASHBOARD', label: 'Operator Portal', icon: LayoutDashboard, requiredRole: UserRole.OPERATOR },
    { id: 'ADMIN', label: 'System Admin', icon: ShieldCheck, requiredRole: UserRole.ADMIN },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
  };

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('KIOSK');
  };

  const currentTabConfig = tabs.find(t => t.id === activeTab);
  const isAuthRequired = !!currentTabConfig?.requiredRole;
  const isAuthorized = user && (
    activeTab === 'MEMBER' ? [UserRole.STUDENT, UserRole.FACULTY, UserRole.STAFF].includes(user.role) :
    activeTab === 'DASHBOARD' ? user.role === UserRole.OPERATOR || user.role === UserRole.ADMIN :
    activeTab === 'ADMIN' ? user.role === UserRole.ADMIN : true
  );

  return (
    <div id="root-container" className="flex h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation - Đã sửa thành Light Theme */}
      <nav id="sidebar" className={`bg-white text-slate-800 flex flex-col transition-all duration-300 border-r border-slate-200 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-brand rounded flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-900/30">P</div>
          {isSidebarOpen && (
            <div>
              {/* Đã sửa màu chữ thành text-slate-900 để dễ nhìn */}
              <h1 className="text-slate-900 font-bold leading-none tracking-tight uppercase">HCMUT</h1>
              <span className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black mt-1 block">Smart Parking</span>
            </div>
          )}
        </div>

        <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                activeTab === tab.id 
                ? 'bg-brand/10 text-brand shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={`w-5 h-5 shrink-0 transition-all ${activeTab === tab.id ? 'text-brand scale-110' : 'group-hover:translate-x-1'}`} />
              {isSidebarOpen && <span className="font-bold whitespace-nowrap tracking-tight uppercase text-[12px]">{tab.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-6 mt-auto border-t border-slate-100 space-y-4">
          {user && isSidebarOpen && (
             <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-brand">{user.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black uppercase text-slate-800 truncate">{user.name}</p>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{user.role}</p>
                </div>
             </div>
          )}
          {isSidebarOpen && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-black">System Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></span>
                <span className="text-xs text-slate-700 font-mono font-bold tracking-tighter">Nodes Online: 42</span>
              </div>
            </div>
          )}
          <button 
            onClick={user ? handleLogout : () => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-sm border border-slate-100"
          >
            {user ? <LogOut className="w-5 h-5 opacity-70" /> : isSidebarOpen ? <LogOut className="w-5 h-5 opacity-70" /> : <LogIn className="w-5 h-5 text-brand" />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden relative">
         <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (user ? '_auth' : '_noauth')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full flex flex-col"
            >
              {!isAuthRequired || isAuthorized ? (
                <>
                  {activeTab === 'KIOSK' && <GateKioskSimulator />}
                  {activeTab === 'MEMBER' && <MemberPortal />}
                  {activeTab === 'DASHBOARD' && <OperatorDashboard onLogout={handleLogout} />}
                  {activeTab === 'ADMIN' && <AdminConsole />}
                </>
              ) : (
                <LoginScreen 
                  onLogin={handleLogin} 
                  targetRole={currentTabConfig?.requiredRole || UserRole.STUDENT} 
                />
              )}
            </motion.div>
         </AnimatePresence>
      </main>
    </div>
  );
}

// Import helper for dynamic icon rendering
function ArrowsRightLeft(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 12h20"/><path d="m18 8 4 4-4 4"/><path d="m6 8-4 4 4 4"/>
    </svg>
  );
}

