
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { Sparkles, ArrowRight, Mail, Lock, User, Eye, EyeOff, RefreshCw } from 'lucide-react';

const processPendingInvites = async (uid: string, userEmail: string, userDisplayName: string) => {
  try {
    const q = query(collection(db, 'pendingInvites'), where('inviteeEmail', '==', userEmail.trim().toLowerCase()));
    const snap = await getDocs(q);
    
    for (const d of snap.docs) {
      const inviteData = d.data();
      const inviterId = inviteData.inviterId;
      
      const accountsQuery = query(collection(db, 'sharedAccounts'), where('ownerId', '==', inviterId));
      const accountsSnap = await getDocs(accountsQuery);
      
      for (const accDoc of accountsSnap.docs) {
        const accData = accDoc.data();
        const currentMembers = accData.memberIds || [];
        if (!currentMembers.includes(uid)) {
          await updateDoc(doc(db, 'sharedAccounts', accDoc.id), {
            memberIds: [...currentMembers, uid]
          });
          
          await setDoc(doc(db, `sharedAccounts/${accDoc.id}/members`, uid), {
            uid: uid,
            name: userDisplayName || userEmail.split('@')[0],
            role: 'Partner',
            active: true
          });
          
          await addDoc(collection(db, `sharedAccounts/${accDoc.id}/feed`), {
            user: inviteData.inviterName || 'Owner',
            action: 'connected with newly registered partner',
            amount: 0,
            target: userDisplayName || userEmail.split('@')[0],
            timestamp: Date.now()
          });
        }
      }
    }
  } catch (error) {
    console.error("Error linking pending invitations:", error);
  }
};

interface AuthPageProps {
  onLogin: (name: string) => void;
  onClose?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const displayName = userCredential.user.displayName || email.split('@')[0];
        onLogin(displayName);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = name || email.split('@')[0];
        
        await updateProfile(userCredential.user, {
          displayName: displayName
        });

        // Initialize user document in Firestore
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: email.toLowerCase(),
            displayName: displayName,
            createdAt: new Date().toISOString(),
            plan: 'free',
            onboardingComplete: false
          });
          // Process any invitations waiting for this email
          await processPendingInvites(userCredential.user.uid, email, displayName);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${userCredential.user.uid}`);
        }

        onLogin(displayName);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'An authentication error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (platform: string) => {
      if (platform !== 'Google') {
        setError(`${platform} login is not configured yet. Please use Google.`);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
          const provider = new GoogleAuthProvider();
          const userCredential = await signInWithPopup(auth, provider);
          const user = userCredential.user;
          
          // Check if user exists in Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
               await setDoc(doc(db, 'users', user.uid), {
                  uid: user.uid,
                  email: user.email ? user.email.toLowerCase() : '',
                  displayName: user.displayName,
                  createdAt: new Date().toISOString(),
                  plan: 'free',
                  onboardingComplete: false
                });
               if (user.email) {
                 await processPendingInvites(user.uid, user.email, user.displayName || user.email.split('@')[0]);
               }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }

          onLogin(user.displayName || user.email?.split('@')[0] || 'User');
      } catch (err: any) {
          console.error('Social Auth Error:', err);
          if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
              setError('Sign-in was cancelled. Please try again.');
          } else {
              setError(err.message || 'Social login failed');
          }
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] w-full min-h-screen flex items-center justify-center bg-[#020617] overflow-y-auto selection:bg-indigo-500/30 p-4 font-sans">
      
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div 
            className="absolute inset-0 opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.1), transparent 40%)`,
            }}
          ></div>
      </div>

      <div className="relative w-full max-w-4xl flex flex-col md:flex-row bg-[#0f172a]/80 backdrop-blur-3xl border border-white/5 md:rounded-[2.5rem] rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up z-10 min-h-[500px]">
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center z-50 cursor-pointer border border-white/10 shadow-lg"
            title="Close Sign In"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        )}
        
        {/* Left Side: Minimalist 3D Credit Card */}
        <div className="hidden md:flex w-5/12 flex-col p-10 relative overflow-hidden border-r border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent z-0"></div>
            
            <div className="flex items-center gap-3 relative z-30">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase">Nova</h1>
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center">
                {/* 3D Floating Credit Card */}
                <div className="w-64 h-40 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border-t border-l border-white/10 border-b border-r border-black/40 shadow-[20px_30px_50px_rgba(0,0,0,0.5),_inset_1px_1px_0px_rgba(255,255,255,0.1)] p-5 relative overflow-hidden transform -rotate-12 hover:-translate-y-2 hover:rotate-[-8deg] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform">
                    {/* Glowing Accents */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl"></div>
                    
                    {/* Card Chip & Logo */}
                    <div className="flex justify-between items-start z-10 relative mt-2">
                        <div className="w-10 h-7 bg-slate-400/20 rounded-md border border-white/5 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-px bg-white/5 absolute"></div>
                            <div className="w-px h-full bg-white/5 absolute"></div>
                        </div>
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    
                    {/* Card Lines/Text Simulation */}
                    <div className="mt-10 space-y-3 relative z-10">
                        <div className="w-full h-2.5 bg-slate-600/30 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-slate-500/40"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-10 h-2 bg-slate-600/30 rounded-full"></div>
                            <div className="w-16 h-2 bg-slate-600/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-10 flex flex-col text-sm text-slate-500 z-10">
                <span className="font-semibold text-slate-300">Modern finance.</span>
                <span>Simplified and elevated.</span>
            </div>
        </div>

        {/* Right Side: Log In / Sign Up */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative bg-[#0f172a]">
            <div className="max-w-md w-full mx-auto space-y-8">
                <div className="text-center md:text-left">
                    {/* Mobile Logo Only */}
                    <div className="md:hidden flex justify-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome back 👋' : 'Create an Account'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {isLogin ? 'Enter your details to access your account.' : 'Join Nova and take control of your finances.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-medium text-center animate-fade-in">
                            {error}
                        </div>
                    )}
                    {!isLogin && (
                        <div className="space-y-1.5 animate-fade-in">
                            <label className="text-xs font-semibold text-slate-400 ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input 
                                    type="text" 
                                    required 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                    placeholder="e.g. Satoshi"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#1e293b]/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-10 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 text-sm"
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 md:py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-2">
                    <div className="relative flex items-center mb-6">
                        <div className="flex-grow border-t border-slate-700/50"></div>
                        <span className="flex-shrink mx-4 text-xs font-medium text-slate-500">Or continue with</span>
                        <div className="flex-grow border-t border-slate-700/50"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <SocialBtn platform="Google" onClick={() => handleSocialLogin('Google')} />
                        <SocialBtn platform="Apple" onClick={() => handleSocialLogin('Apple')} />
                        <SocialBtn platform="Yahoo" onClick={() => handleSocialLogin('Yahoo')} />
                    </div>
                </div>

                <div className="text-center pt-2">
                    <p className="text-sm text-slate-400 font-medium">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-white hover:text-indigo-400 font-semibold transition-colors ml-1"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SocialBtn: React.FC<{ platform: string, onClick: () => void }> = ({ platform, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-center py-2.5 bg-[#1e293b]/30 border border-slate-700/50 rounded-xl hover:bg-[#1e293b]/70 hover:border-slate-600 transition-all font-medium text-slate-300 text-sm gap-2 active:scale-95 shadow-sm"
    >
        {platform === 'Google' && (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        )}
        {platform === 'Apple' && (
            <svg className="w-4 h-4" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
        )}
        {platform === 'Yahoo' && (
            <div className="w-4 h-4 flex items-center justify-center font-black text-white italic bg-[#6001d2] rounded-md text-[10px]">
                Y!
            </div>
        )}
    </button>
);

export default AuthPage;
