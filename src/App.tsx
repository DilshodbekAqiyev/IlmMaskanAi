/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, syncUserProfile, UserProfile, calculateLevel } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { Trophy, Map, Users, Settings, Code, Award, Home, Star, MessageSquare, Briefcase, Zap, Palette, Layout, Atom, LogOut, ChevronRight, User, Sparkles, Calendar, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WORLDS, World, Mission } from './constants';
import LearningMap from './components/LearningMap';
import MissionEditor from './components/MissionEditor';
import Leaderboard from './components/Leaderboard';
import TeacherDashboard from './components/TeacherDashboard';
import AiMentorChat from './components/AiMentorChat';
import UserProfilePage from './components/UserProfilePage';
import PersonalizedPath from './components/PersonalizedPath';
import AchievementsPage from './components/AchievementsPage';
import DailyChallenge from './components/DailyChallenge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'map' | 'mission' | 'leaderboard' | 'dashboard' | 'profile' | 'personalized' | 'achievements' | 'daily-challenge';

interface MissionContext {
  code: string;
  error: string;
  selectedCode?: string;
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('map');
  const [activeWorld, setActiveWorld] = useState<World | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionContext, setMissionContext] = useState<MissionContext>({ code: '', error: '', selectedCode: '' });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Sync with HTML/Body element for system-wide light theme support if needed
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light');
    } else {
      body.classList.remove('light');
    }
  }, [theme]);

  const handleUpdateContext = React.useCallback((code: string, error: string, selectedCode?: string) => {
    setMissionContext({ code, error, selectedCode });
  }, []);

  useEffect(() => {
    // Check redirect results first in case of a successful fallback sign in
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const profile = await syncUserProfile(result.user);
          setUser(profile);
        }
      })
      .catch((error) => {
        console.error("Redirect Sign-in Error:", error);
        if (error.code === 'auth/unauthorized-domain') {
          alert(
            "Xatolik: Ushbu veb-sayt manzili (domeni) Firebase'da ruxsat etilgan domenlar ro'yxatiga qo'shilmagan.\n\n" +
            "Yechim:\n" +
            "1. Firebase Console -> Authentication -> Settings -> Authorized Domains sahifasiga kiring.\n" +
            "2. Hozirgi saytingiz domenini (masalan, Vercel manzilingizni) ro'yxatga qo'shing."
          );
        } else {
          alert(`Redirect orqali tizimga kirishda xatolik: ${error.message}`);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserProfile(firebaseUser);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (!window.navigator.onLine) {
      alert("Internet aloqasi yo'q. Iltimos, tarmoqni tekshiring.");
      return;
    }

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error Details:", error);
      if (error.code === 'auth/popup-blocked') {
        console.log("Popup blocked! Attempting automatic fallback via signInWithRedirect...");
        try {
          alert(
            "Brauzeringizda xavfsizlik filtri yoki popup oyna to'siqlari yoqilgan shekilli (Popup Blocked).\n\n" +
            "Tizimga avtomatik ravishda Redirect (sahifani qayta yo'naltirish) orqali kirishga urinib ko'ramiz..."
          );
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError: any) {
          console.error("Redirect Error:", redirectError);
          alert(
            `Kutilmagan xatolik yuz berdi: ${redirectError.message}\n\n` +
            `Yechim: Sayt manzilini Firebase Console -> Authentication -> Settings -> Authorized Domains ro'yxatiga qo'shing hamda brauzerda pop-up oynalarga ruxsat bering.`
          );
        }
      } else if (error.code === 'auth/network-request-failed') {
        alert("Tarmoq xatosi (network-request-failed). Iltimos, sahifani yangilang yoki adblocker/VPN ni o'chirib ko'ring.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert(
          "Xatolik (unauthorized-domain): Ushbu sayt domeni Firebase Auth tomonidan ruxsat berilgan ro'yxatda mavjud emas.\n\n" +
          "Yechim: Firebase Console -> Authentication -> Settings -> Authorized Domains qismiga hozirgi domen manzilingizni qoshishingiz kerak."
        );
      } else {
        alert(
          `Tizimga kirishda xatolik yuz berdi: ${error.message}\n\n` +
          `Eslatma: Agar sayt Vercel platformasida bo'lsa, ushbu domenni Firebase Console dagi ruxsat berilgan domenlar (Authorized Domains) ro'yxatiga qo'shish kerak.`
        );
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const startMission = React.useCallback((mission: Mission, world: World) => {
    setActiveMission(mission);
    setActiveWorld(world);
    setMissionContext({ code: '', error: '', selectedCode: '' });
    setView('mission');
  }, []);

  const updateProfile = React.useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const handleCloseMission = React.useCallback(() => setView('map'), []);

  const handleCompleteMission = React.useCallback((xp: number) => {
    setUser(prev => {
      if (!prev) return null;
      const newXp = prev.xp + xp;
      return { 
        ...prev, 
        xp: newXp,
        level: calculateLevel(newXp)
      };
    });
    setView('map');
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Zap className="w-12 h-12 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900 border border-white/5 p-10 rounded-[32px] shadow-2xl text-center space-y-8 relative z-10"
        >
          <div className="bg-indigo-600/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(79,70,229,0.1)]">
            <Code className="w-12 h-12 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white tracking-tight italic underline-offset-8 decoration-indigo-500 underline">IlmMaskan</h1>
            <p className="text-zinc-500 text-lg">
              Dasturlashni o'yin kulgi bilan o'rganing. Elegant va qorong'u rejimda.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-4 text-lg border border-indigo-400/20"
          >
            <Zap className="w-6 h-6 text-indigo-200 fill-indigo-200/20" />
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" referrerPolicy="no-referrer" />
            Google bilan kirish
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen flex overflow-hidden font-sans transition-colors duration-300",
      theme === 'light' ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-slate-200"
    )}>
      {/* Sidebar - Desktop */}
      <nav className={cn(
        "w-20 h-full hidden md:flex flex-col items-center py-8 gap-8 transition-colors duration-300",
        theme === 'light' ? "bg-white border-r border-zinc-200" : "bg-zinc-950 border-r border-white/5"
      )}>
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 mb-4">
          DE
        </div>
        
        {[
          { id: 'map', icon: Map, label: 'Xarita' },
          { id: 'daily-challenge', icon: Calendar, label: 'Kun vazifasi' },
          { id: 'personalized', icon: Sparkles, label: 'AI Kurs' },
          { id: 'achievements', icon: Award, label: 'Yutuqlar' },
          { id: 'leaderboard', icon: Trophy, label: 'Reyting' },
          { id: 'dashboard', icon: Briefcase, label: 'Boshqaruv' },
          { id: 'profile', icon: User, label: 'Profil' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            aria-label={`${item.label} bo'limiga o'tish`}
            aria-current={view === item.id ? 'page' : undefined}
            className={cn(
              "p-3 rounded-xl transition-all relative group",
              view === item.id 
                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]" 
                : theme === 'light' 
                  ? "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/50" 
                  : "text-zinc-500 hover:text-white"
            )}
          >
            <item.icon className="w-6 h-6 font-medium" />
            <span className={cn(
              "absolute left-full ml-4 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md",
              theme === 'light' ? "bg-white text-zinc-800 border border-zinc-200" : "bg-zinc-805 bg-zinc-800 text-white"
            )}>
              {item.label}
            </span>
          </button>
        ))}

        <div className={cn("mt-auto pt-8 space-y-4 w-full flex flex-col items-center", theme === 'light' ? "border-t border-zinc-200" : "border-t border-white/5")}>
          {/* Direct Sun/Moon toggle button */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className={cn(
              "p-3 rounded-xl transition-all relative group",
              theme === 'light' ? "text-amber-500 hover:bg-amber-500/10" : "text-zinc-500 hover:text-amber-400"
            )}
            title={theme === 'light' ? "Tungi rejimga o'tish" : "Kunduzgi rejimga o'tish"}
          >
            {theme === 'light' ? <Moon className="w-6 h-6 fill-indigo-500 text-indigo-500" /> : <Sun className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setView('profile')}
            className={cn(
               "p-3 rounded-xl transition-all relative group",
               view === 'profile' 
                 ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]" 
                 : theme === 'light' 
                   ? "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100/50" 
                   : "text-zinc-500 hover:text-white"
            )}
            aria-label="Sozlamalar bo'limiga o'tish"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <button
            onClick={handleLogout}
            className={cn(
              "p-3 rounded-xl transition-all",
              theme === 'light' 
                ? "text-zinc-400 hover:bg-red-50 hover:text-red-500" 
                : "text-zinc-500 hover:bg-red-500/10 hover:text-red-500"
            )}
            aria-label="Tizimdan chiqish"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative transition-colors duration-300">
        {/* Header */}
        <header className={cn(
          "h-16 px-8 flex items-center justify-between shrink-0 backdrop-blur-sm transition-colors duration-300 z-30",
          theme === 'light' ? "bg-white/80 border-b border-zinc-200" : "bg-zinc-900/50 border-b border-white/10"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Foydalanuvchi darajasi</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 font-bold">LVL {calculateLevel(user.xp)}</span>
                <div className={cn("w-32 h-1.5 rounded-full overflow-hidden", theme === 'light' ? "bg-zinc-200" : "bg-zinc-800")}>
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ 
                      width: `${(() => {
                        const lvl = calculateLevel(user.xp);
                        const nextXp = Math.pow(lvl, 2) * 100;
                        const prevXp = Math.pow(lvl - 1, 2) * 100;
                        const progress = ((user.xp - prevXp) / (nextXp - prevXp)) * 100;
                        return Math.max(0, Math.min(progress, 100));
                      })()}%` 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Daily Streak */}
            <div className={cn("flex flex-col items-end border-r pr-6", theme === 'light' ? "border-zinc-200" : "border-white/10")}>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    scale: user.streakCount > 0 ? [1, 1.2, 1] : 1,
                    rotate: user.streakCount > 0 ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Sparkles className={cn("w-4 h-4", user.streakCount > 0 ? "text-orange-400 fill-orange-400" : "text-zinc-600")} />
                </motion.div>
                <span className={cn("font-bold tracking-tight text-sm", user.streakCount > 0 ? theme === 'light' ? "text-zinc-900" : "text-white" : "text-zinc-500")}>
                  {user.streakCount} kunlik streak
                </span>
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Faollik</span>
            </div>

            <div className="flex flex-col items-end">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className={cn("font-bold tracking-tight text-sm", theme === 'light' ? "text-zinc-900" : "text-white")}>{user.xp.toLocaleString()} XP</span>
               </div>
               <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>Jami ball topildi</span>
            </div>
            
            <div className={cn("flex items-center gap-3 border-l pl-6", theme === 'light' ? "border-zinc-200" : "border-white/10")}>
              <div className="text-right hidden sm:block">
                <div className={cn("text-sm font-medium leading-none", theme === 'light' ? "text-zinc-900" : "text-white")}>{user.displayName}</div>
                <div className={cn("text-[10px] font-bold uppercase mt-1", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>
                  {user.role === 'teacher' ? 'Usta Mentor' : user.xp > 1000 ? 'Silver Ninja' : 'Bronze Student'}
                </div>
              </div>
              <div 
                onClick={() => setView('profile')}
                className={cn(
                  "w-10 h-10 rounded-full border-2 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg cursor-pointer active:scale-95 transition-transform",
                  theme === 'light' ? "border-zinc-300 shadow-zinc-200" : "border-white/20 shadow-indigo-500/10"
                )}
              >
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} alt="Profile" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className={cn(
          "flex-1 overflow-auto relative transition-colors duration-300",
          theme === 'light' 
            ? "bg-zinc-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-100 to-zinc-50" 
            : "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950 to-zinc-950"
        )}>
          <div className={cn("absolute inset-0 bg-dot-pattern pointer-events-none transition-opacity", theme === 'light' ? "opacity-3" : "opacity-10")} />
          <AnimatePresence mode="wait">
            {view === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full relative z-10"
              >
                <LearningMap worlds={WORLDS} user={user} onStartMission={startMission} theme={theme} />
              </motion.div>
            )}
            {view === 'mission' && activeMission && activeWorld && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full relative z-10"
              >
                <MissionEditor
                  mission={activeMission}
                  world={activeWorld}
                  user={user}
                  onClose={handleCloseMission}
                  onUpdateContext={handleUpdateContext}
                  onComplete={handleCompleteMission}
                  theme={theme}
                />
              </motion.div>
            )}
            {view === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <Leaderboard theme={theme} />
              </motion.div>
            )}
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <TeacherDashboard user={user} theme={theme} />
              </motion.div>
            )}
            {view === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <UserProfilePage user={user} onUpdate={updateProfile} theme={theme} setTheme={setTheme} />
              </motion.div>
            )}
            {view === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <AchievementsPage user={user} theme={theme} />
              </motion.div>
            )}
            {view === 'personalized' && (
              <motion.div
                key="personalized"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <PersonalizedPath user={user} onStartMission={startMission} theme={theme} />
              </motion.div>
            )}
            {view === 'daily-challenge' && (
              <motion.div
                key="daily-challenge"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <DailyChallenge user={user} onUpdateProfile={updateProfile} theme={theme} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Bar / Footer */}
        <footer className={cn(
          "h-8 border-t flex items-center px-6 justify-between text-[10px] font-mono shrink-0 transition-colors duration-300",
          theme === 'light' ? "bg-white border-zinc-200 text-zinc-500" : "bg-zinc-950 border-white/5 text-zinc-500"
        )}>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> AI Cloud: Connected</span>
            <span className={cn("border-l pl-4", theme === 'light' ? "border-zinc-200" : "border-white/10")}>{activeMission ? `Mission: ${activeMission.title}` : 'Xarita bo\'ylab sayohat'}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold">Boss Challenge: 3 kun qoldi</span>
            <span className={cn("hover:text-indigo-600 cursor-pointer transition-colors border-l pl-4", theme === 'light' ? "border-zinc-200" : "border-white/10")}>Yordam kerakmi?</span>
          </div>
        </footer>

        {/* AI Mentor Trigger */}
        <AiMentorChat activeMission={activeMission} missionContext={missionContext} />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className={cn(
        "md:hidden h-20 border-t fixed bottom-0 w-full flex items-center justify-around px-4 z-40 transition-colors duration-300",
        theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950 border-white/5"
      )}>
        {[
          { id: 'map', icon: Map, label: 'Xarita' },
          { id: 'daily-challenge', icon: Calendar, label: 'Kun vazifasi' },
          { id: 'achievements', icon: Award, label: 'Yutuqlar' },
          { id: 'leaderboard', icon: Trophy, label: 'Reyting' },
          { id: 'profile', icon: User, label: 'Profil' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            aria-label={`${item.label} bo'limiga o'tish`}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" 
                : theme === 'light' 
                  ? "text-zinc-400 hover:text-zinc-900" 
                  : "text-zinc-500 hover:text-white"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
}
