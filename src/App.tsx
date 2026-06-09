/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, syncUserProfile, UserProfile, calculateLevel } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Trophy, Map, Users, Settings, Code, Award, Home, Star, MessageSquare, Briefcase, Zap, Palette, Layout, Atom, LogOut, ChevronRight, User, Sparkles } from 'lucide-react';
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
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = 'map' | 'mission' | 'leaderboard' | 'dashboard' | 'profile' | 'personalized' | 'achievements';

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

  const handleUpdateContext = React.useCallback((code: string, error: string, selectedCode?: string) => {
    setMissionContext({ code, error, selectedCode });
  }, []);

  useEffect(() => {
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
      if (error.code === 'auth/network-request-failed') {
        alert("Tarmoq xatosi (network-request-failed). Iltimos, sahifani yangilang yoki adblocker/VPN ni o'chirib ko'ring.");
      } else {
        alert(`Tizimga kirishda xatolik: ${error.message}`);
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
            <h1 className="text-4xl font-bold text-white tracking-tight italic underline-offset-8 decoration-indigo-500 underline">DevEdu</h1>
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
    <div className="h-screen flex bg-zinc-950 overflow-hidden font-sans text-slate-200">
      {/* Sidebar - Desktop */}
      <nav className="w-20 h-full bg-zinc-950 border-r border-white/5 hidden md:flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 mb-4">
          DE
        </div>
        
        {[
          { id: 'map', icon: Map, label: 'Xarita' },
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
              view === item.id ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]" : "text-zinc-500 hover:text-white"
            )}
          >
            <item.icon className="w-6 h-6 font-medium" />
            <span className="absolute left-full ml-4 px-3 py-1 bg-zinc-800 text-white text-[10px] uppercase font-bold tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {item.label}
            </span>
          </button>
        ))}

        <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
          <button
            onClick={() => setView('profile')}
            className={cn(
               "p-3 rounded-xl transition-all relative group",
               view === 'profile' ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]" : "text-zinc-500 hover:text-white"
            )}
          >
            <Settings className="w-6 h-6" />
          </button>
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Header */}
        <header className="h-16 bg-zinc-900/50 border-b border-white/10 px-8 flex items-center justify-between shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Foydalanuvchi darajasi</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 font-bold">LVL {calculateLevel(user.xp)}</span>
                <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
            <div className="flex flex-col items-end border-r border-white/10 pr-6">
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
                <span className={cn("font-bold tracking-tight", user.streakCount > 0 ? "text-white" : "text-zinc-500")}>
                  {user.streakCount} kunlik streak
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Faollik</span>
            </div>

            <div className="flex flex-col items-end">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="font-bold text-white tracking-tight">{user.xp.toLocaleString()} XP</span>
               </div>
               <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Jami ball topildi</span>
            </div>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-none text-white">{user.displayName}</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                  {user.role === 'teacher' ? 'Usta Mentor' : user.xp > 1000 ? 'Silver Ninja' : 'Bronze Student'}
                </div>
              </div>
              <div 
                onClick={() => setView('profile')}
                className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/10 cursor-pointer active:scale-95 transition-transform"
              >
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} alt="Profile" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-zinc-950 to-zinc-950 relative">
          <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
          <AnimatePresence mode="wait">
            {view === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full relative z-10"
              >
                <LearningMap worlds={WORLDS} user={user} onStartMission={startMission} />
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
                <Leaderboard />
              </motion.div>
            )}
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <TeacherDashboard user={user} />
              </motion.div>
            )}
            {view === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <UserProfilePage user={user} onUpdate={updateProfile} />
              </motion.div>
            )}
            {view === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <AchievementsPage user={user} />
              </motion.div>
            )}
            {view === 'personalized' && (
              <motion.div
                key="personalized"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 h-full overflow-auto relative z-10"
              >
                <PersonalizedPath user={user} onStartMission={startMission} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Bar / Footer */}
        <footer className="h-8 bg-zinc-950 border-t border-white/5 flex items-center px-6 justify-between text-[10px] font-mono text-zinc-500 shrink-0">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span> AI Cloud: Connected</span>
            <span className="border-l border-white/10 pl-4">{activeMission ? `Mission: ${activeMission.title}` : 'Xarita bo\'ylab sayohat'}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-bold">Boss Challenge: 3 kun qoldi</span>
            <span className="hover:text-white cursor-pointer transition-colors border-l border-white/10 pl-4">Yordam kerakmi?</span>
          </div>
        </footer>

        {/* AI Mentor Trigger */}
        <AiMentorChat activeMission={activeMission} missionContext={missionContext} />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden h-20 bg-zinc-950 border-t border-white/5 fixed bottom-0 w-full flex items-center justify-around px-4 z-40">
        {[
          { id: 'map', icon: Map, label: 'Xarita' },
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
              view === item.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-zinc-500"
            )}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>
    </div>
  );
}
