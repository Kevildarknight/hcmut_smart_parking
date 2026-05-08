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
  EyeOff,
  Download,
  RefreshCw,
  Database,
  Users,
  FileText
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
  type KioskStep = 'IDLE' | 'VERIFYING' | 'CHECKING_AVAILABILITY' | 'DISPENSING_TICKET' | 'WELCOME' | 'DENIED' | 'BARRIER_OPEN' | 'FINALIZING';
  const [step, setStep] = useState<KioskStep>('IDLE');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<Partial<ParkingSession> | null>(null);

  // Cấu hình giả lập (Debug)
  const [simConfig, setSimConfig] = useState<{ isFull: boolean, isInvalid: boolean, isHwError: boolean }>({
    isFull: false,
    isInvalid: false,
    isHwError: false
  });

  // --- Luồng Member (Dựa trên sequence_diagram_hcmutmember_entry) ---
  const simulateMemberTap = () => {
    setStep('VERIFYING');
    
    setTimeout(() => {
      // 1. Kiểm tra thẻ hợp lệ
      if (simConfig.isInvalid) {
        setMessage('INVALID ID CARD. ACCESS DENIED.');
        setStep('DENIED');
        setTimeout(() => setStep('IDLE'), 3000);
        return;
      }

      // 2. Kiểm tra sức chứa
      setStep('CHECKING_AVAILABILITY');
      setTimeout(() => {
        if (simConfig.isFull) {
          setMessage('PARKING FULL. PLEASE USE ZONE B.');
          setStep('DENIED');
          setTimeout(() => setStep('IDLE'), 3000);
          return;
        }

        // 3. Cho phép vào
        setSession({ role: UserRole.STUDENT, entryTime: new Date() });
        setStep('WELCOME');
        
        setTimeout(() => {
          setStep('BARRIER_OPEN');
          // 4. Cảm biến phát hiện xe qua -> Đóng barrier (Finalizing)
          setTimeout(() => {
             setStep('FINALIZING');
             setTimeout(() => setStep('IDLE'), 2000);
          }, 3000);
        }, 1500);
      }, 1000);

    }, 1500);
  };

  // --- Luồng Visitor (Dựa trên sequence_diagram_entry_visitors) ---
  const simulateVisitorRequest = () => {
    setStep('CHECKING_AVAILABILITY');
    
    setTimeout(() => {
      // 1. Kiểm tra sức chứa
      if (simConfig.isFull) {
        setMessage('PARKING FULL. NO TICKETS AVAILABLE.');
        setStep('DENIED');
        setTimeout(() => setStep('IDLE'), 3000);
        return;
      }

      // 2. Phát hành vé
      setStep('DISPENSING_TICKET');
      setTimeout(() => {
        if (simConfig.isHwError) {
          setMessage('HARDWARE ERROR: DISPENSER JAMMED. OPERATOR ALERTED.');
          setStep('DENIED');
          setTimeout(() => setStep('IDLE'), 4000);
          return;
        }
        // Chờ Visitor rút vé (trigger bằng tay via UI)
      }, 1500);
    }, 1500);
  };

  // Visitor rút vé -> Mở barrier
  const handleTakeTicket = () => {
    setSession({ role: UserRole.VISITOR, entryTime: new Date() });
    setStep('WELCOME');
    setTimeout(() => {
      setStep('BARRIER_OPEN');
      setTimeout(() => {
         setStep('FINALIZING'); // Đóng barrier & ghi log
         setTimeout(() => setStep('IDLE'), 2000);
      }, 3000);
    }, 1500);
  };

  return (
    <div id="kiosk-sim" className="h-full flex flex-col items-center justify-center bg-slate-900 p-8 relative">
      <Card id="kiosk-terminal" className="w-full max-w-lg aspect-video flex flex-col items-center justify-center p-12 bg-slate-800 border-slate-700 text-white relative overflow-hidden rounded-3xl z-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.5),transparent)] pointer-events-none" />

        <AnimatePresence mode="wait">
          {step === 'IDLE' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">HCMUT Parking</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">Please select entry method</p>
              </div>
              <div className="flex gap-4">
                <button onClick={simulateMemberTap} className="flex flex-col items-center gap-3 p-6 bg-brand hover:bg-blue-700 rounded-2xl transition-all group shadow-lg shadow-blue-900/40 w-36">
                  <CreditCard className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Tap Member ID</span>
                </button>
                <button onClick={simulateVisitorRequest} className="flex flex-col items-center gap-3 p-6 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-all group shadow-lg shadow-slate-900/40 w-36">
                  <QrCode className="w-10 h-10 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest text-center">Get Visitor Ticket</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'VERIFYING' && (
            <motion.div key="verifying" className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] animate-pulse text-blue-400">Verifying Identity...</p>
            </motion.div>
          )}

          {step === 'CHECKING_AVAILABILITY' && (
            <motion.div key="checking" className="flex flex-col items-center gap-6">
              <Database className="w-12 h-12 text-slate-400 animate-bounce" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Checking Zone Capacity...</p>
            </motion.div>
          )}

          {step === 'DENIED' && (
            <motion.div key="denied" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500">ACCESS DENIED</h2>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-300">{message}</p>
            </motion.div>
          )}

          {step === 'DISPENSING_TICKET' && (
            <motion.div key="dispensing" className="w-full space-y-6 text-center flex flex-col items-center">
              <div className="relative w-32 h-16 bg-slate-900 rounded-lg border-2 border-slate-700 flex justify-center overflow-hidden">
                 <motion.div 
                    initial={{ y: -50 }} animate={{ y: 20 }} transition={{ duration: 1 }}
                    className="w-16 h-24 bg-white text-slate-900 absolute top-0 flex flex-col items-center pt-2 shadow-lg cursor-pointer hover:bg-slate-200"
                    onClick={handleTakeTicket}
                 >
                    <QrCode className="w-8 h-8" />
                    <span className="text-[8px] font-black mt-1">TAKE ME</span>
                 </motion.div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Please take your ticket</h3>
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
            </motion.div>
          )}

          {step === 'BARRIER_OPEN' && (
            <motion.div key="barrier" className="text-center space-y-8">
               <motion.div 
                animate={{ rotate: [-15, 0, -15] }} transition={{ duration: 0.5, repeat: Infinity }}
                className="w-48 h-5 bg-yellow-500 mx-auto rounded-full origin-left -rotate-12 shadow-2xl" 
               />
               <h3 className="text-5xl font-black text-green-500 uppercase tracking-tighter italic">Barrier Open</h3>
               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold animate-pulse">Proceed vehicle through gate</p>
            </motion.div>
          )}

          {step === 'FINALIZING' && (
            <motion.div key="finalizing" className="flex flex-col items-center gap-6">
              <div className="w-48 h-5 bg-yellow-500 mx-auto rounded-full origin-left shadow-2xl transition-all duration-1000" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Closing Barrier & Logging...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* --- DEBUG / SIMULATION PANEL --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-6 items-center shadow-2xl z-20">
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Cpu className="w-3 h-3"/> Test Scenarios</span>
         <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer hover:text-brand transition-colors">
            <input type="checkbox" checked={simConfig.isFull} onChange={e => setSimConfig(p => ({...p, isFull: e.target.checked}))} className="rounded border-slate-600 bg-slate-900" />
            Parking Full (availSpaces=0)
         </label>
         <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer hover:text-red-400 transition-colors">
            <input type="checkbox" checked={simConfig.isInvalid} onChange={e => setSimConfig(p => ({...p, isInvalid: e.target.checked}))} className="rounded border-slate-600 bg-slate-900" />
            Invalid ID Card
         </label>
         <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer hover:text-red-400 transition-colors">
            <input type="checkbox" checked={simConfig.isHwError} onChange={e => setSimConfig(p => ({...p, isHwError: e.target.checked}))} className="rounded border-slate-600 bg-slate-900" />
            Ticket Jam Error
         </label>
      </div>
    </div>
  );
}

function MemberPortal() {
  const [sessions] = useState<ParkingSession[]>([
    { id: '1', plateNumber: '43B-999.88', entryTime: new Date(Date.now() - 3600000), role: UserRole.STUDENT, status: SessionStatus.ACTIVE, fee: 2000 },
    { id: '2', plateNumber: '43B-999.88', entryTime: new Date(Date.now() - 86400000), exitTime: new Date(Date.now() - 82800000), role: UserRole.STUDENT, status: SessionStatus.PAID, fee: 4000 },
  ]);

  return (
    <div id="member-portal" className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto h-full flex flex-col overflow-auto">
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
          <Card id="active-session" className="p-8 border-l-4 border-l-brand relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
               <Car className="w-32 h-32 text-brand" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Car className="w-3 h-3" /> Current Session
              </h3>
              <Badge color="green">Active</Badge>
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
                  <p className="text-xl font-bold tracking-tight text-brand">2,000 VND</p>
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
                    <th className="px-6 py-4 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 italic">
                  {sessions.slice(1).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-6 text-sm font-bold text-slate-900">May 3, 2026</td>
                      <td className="px-6 py-6 font-normal">
                         <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{s.entryTime.toLocaleTimeString()}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{s.exitTime?.toLocaleTimeString()}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-right font-black text-slate-900 italic tracking-tighter">+{s.fee.toLocaleString()} VND</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="w-full py-4 text-[10px] font-bold text-brand hover:bg-brand-light transition-colors uppercase tracking-[0.2em] border-t border-slate-50">View Full Transaction History</button>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="p-8 bg-brand text-white shadow-2xl shadow-blue-900/40 border-none">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-80">
                <History className="w-3 h-3" /> Monthly Invoice
              </h3>
              <Badge color="slate">MAY 2026</Badge>
            </div>
            <div className="space-y-1 py-4 text-center md:text-left">
               <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60">Balance Due</p>
               <p className="text-5xl font-black italic tracking-tighter">12,000<span className="text-sm ml-1 font-bold not-italic">VND</span></p>
            </div>
            <button className="w-full mt-8 py-4 bg-white text-brand font-black rounded-xl hover:shadow-xl hover:scale-105 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2">
               Pay with BKPay <ArrowRightLeft className="w-4 h-4" />
            </button>
          </Card>

          <Card className="p-6 bg-slate-50 border-dashed border-2 border-slate-200">
             <div className="flex items-center gap-4 mb-4 font-normal">
                <div className="p-3 bg-white rounded-xl shadow-sm"><QrCode className="w-6 h-6 text-slate-400" /></div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Quick Entry QR</p>
                   <p className="text-[10px] text-slate-500 font-medium">Use if card reader is slow</p>
                </div>
             </div>
             <div className="aspect-square bg-white rounded-xl flex items-center justify-center border border-slate-100 italic font-mono text-[10px] text-slate-300">
                QR CODE PREVIEW
             </div>
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
  
  // Các state mới thêm vào để quản lý trạng thái từ biểu đồ
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('1 hour ago');
  const [reportTimeframe, setReportTimeframe] = useState('7D');
  const [isExporting, setIsExporting] = useState(false);

  // Giả lập tính năng Master Data Syncing
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
    }, 2500);
  };

  // Giả lập tính năng Export Report
  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Report for past ${reportTimeframe} exported successfully!`);
    }, 1500);
  };

  return (
    <div id="admin-console" className="p-6 md:p-8 space-y-8 h-full bg-slate-50 overflow-auto">
       <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg"><Settings className="w-6 h-6 text-white" /></div> 
          System Configuration
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-brand' : ''}`} />
            {isSyncing ? 'Syncing with HCMUT...' : 'Sync Master Data'}
          </button>
          <button className="px-5 py-2 bg-brand text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-transform">
            Deploy New Rules
          </button>
        </div>
      </header>

      {/* Hiển thị trạng thái Sync gần nhất */}
      <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Database className="w-3 h-3" /> Master Data Status: <span className="text-green-600">Connected</span> • Last sync: {lastSync}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Cột trái: Quản lý Policy & Phân quyền (RBAC) */}
        <div className="space-y-8">
          {/* Box 1: Pricing Policies */}
          <Card className="flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-lg">Pricing Policies</h3>
                 <p className="text-sm text-slate-500">Configure rates per role and zone</p>
               </div>
            </div>
            <div className="p-5 space-y-4">
              {policies.map(p => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-brand hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:bg-brand group-hover:text-white transition-colors">
                       {p.role === UserRole.STUDENT ? <Smartphone className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold">{p.role}</p>
                      <p className="text-xs text-slate-500">{p.ratePerHour.toLocaleString()} VND / hr</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{p.gracePeriodMinutes}m <span className="text-slate-400 font-normal">Grace</span></p>
                    <button className="text-xs font-bold text-brand opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tight">Edit Policy</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Box 2: Trạm quản lý RBAC (Mới) */}
          <Card className="flex flex-col border-dashed border-2">
            <div className="p-5 border-b border-slate-100">
               <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5" /> Role & Privileges</h3>
               <p className="text-sm text-slate-500">Manage parking access levels</p>
            </div>
            <div className="p-5 flex justify-between items-center bg-slate-50/50">
              <span className="text-sm font-medium text-slate-600">Active Operator Accounts: 12</span>
              <button className="text-xs font-bold text-brand uppercase tracking-wider">Manage RBAC</button>
            </div>
          </Card>
        </div>

        {/* Cột phải: Log hệ thống & Báo cáo */}
        <Card className="flex flex-col h-full min-h-[500px]">
           <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg">System Audit & Reports</h3>
                <p className="text-sm text-slate-500">Log trails and financial exports</p>
              </div>
              
              {/* Report Timeframe & Export Controls (Mới) */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <select 
                  value={reportTimeframe}
                  onChange={(e) => setReportTimeframe(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-2"
                >
                  <option value="24H">Last 24h</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                </select>
                <div className="w-px h-4 bg-slate-300"></div>
                <button 
                  onClick={handleExportReport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Export
                </button>
              </div>
           </div>
           
           <div className="p-5 space-y-6 flex-1 overflow-auto">
              {[
                { actor: 'Admin (Dat)', action: 'Updated Pricing Policy v2.4', date: '2h ago', status: 'Published' },
                { actor: 'Operator (Khanh)', action: 'Manual Barrier Override: Gate E_02', date: '5h ago', status: 'Audit Req' },
                { actor: 'System HCMUT', action: 'Auto-sync: Master Data packet received', date: lastSync, status: 'Success' },
                { actor: 'System', action: 'Exported Financial Report (7D)', date: '1d ago', status: 'Success' },
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
           
           <div className="mt-auto p-5 bg-slate-900 text-white rounded-b-2xl border-t border-white/5 flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded text-brand group cursor-pointer hover:scale-105 transition-transform"><Search className="w-4 h-4" /></div>
              <input type="text" placeholder="Search audit trail by actor ID or event..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-500 font-mono tracking-tighter" />
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
      {/* Sidebar Navigation */}
      <nav id="sidebar" className={`bg-sidebar-bg text-white flex flex-col transition-all duration-300 border-r border-slate-700 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-brand rounded flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-blue-900/50">P</div>
          {isSidebarOpen && (
            <div>
              <h1 className="text-white font-bold leading-none tracking-tight uppercase">HCMUT</h1>
              <span className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mt-1 block">Smart Parking</span>
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
                ? 'bg-brand/10 text-brand shadow-inner' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className={`w-5 h-5 shrink-0 transition-all ${activeTab === tab.id ? 'text-brand scale-110' : 'group-hover:translate-x-1'}`} />
              {isSidebarOpen && <span className="font-bold whitespace-nowrap tracking-tight uppercase text-[12px]">{tab.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-6 mt-auto border-t border-white/5 space-y-4">
          {user && isSidebarOpen && (
             <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center font-black text-xs text-brand">{user.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black uppercase truncate">{user.name}</p>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{user.role}</p>
                </div>
             </div>
          )}
          {isSidebarOpen && (
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-black">System Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/10"></span>
                <span className="text-xs text-slate-200 font-mono font-bold tracking-tighter">Nodes Online: 42</span>
              </div>
            </div>
          )}
          <button 
            onClick={user ? handleLogout : () => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors shadow-inner"
          >
            {user ? <LogOut className="w-5 h-5 opacity-50" /> : isSidebarOpen ? <LogOut className="w-5 h-5 opacity-50" /> : <LogIn className="w-5 h-5 text-brand" />}
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

