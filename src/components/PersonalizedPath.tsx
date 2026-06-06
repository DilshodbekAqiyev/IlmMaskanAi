import React, { useState, useEffect } from 'react';
import { UserProfile, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Mission, World } from '../constants';
import { generatePersonalizedPath } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Play, CheckCircle2, ChevronRight, Zap, RefreshCcw, Video, ExternalLink } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PersonalizedPathProps {
  user: UserProfile;
  onStartMission: (mission: Mission, world: World) => void;
}

interface AIPathMission {
  title: string;
  description: string;
  templateCode: string;
  testLogic: string;
  youtubeId?: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GeneratedPath {
  pathTitle: string;
  description: string;
  missions: AIPathMission[];
}

export default function PersonalizedPath({ user, onStartMission }: PersonalizedPathProps) {
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [path, setPath] = useState<GeneratedPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPath = async () => {
    setIsSyncing(true);
    try {
      const pathRef = doc(db, 'ai_paths', user.userId);
      const pathSnap = await getDoc(pathRef);
      if (pathSnap.exists()) {
        setPath(pathSnap.data() as GeneratedPath);
      }
    } catch (err) {
      console.error("Failed to fetch saved path:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const savePath = async (newPath: GeneratedPath) => {
    try {
      const pathRef = doc(db, 'ai_paths', user.userId);
      await setDoc(pathRef, newPath);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ai_paths/${user.userId}`);
    }
  };

  const generatePath = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generatePersonalizedPath(user);
      setPath(result);
      await savePath(result);
    } catch (err) {
      console.error(err);
      setError("Kursni shakllantirishda xatolik yuz berdi. Iltimos qiziqishlaringizni profil sahifasidan tanlaganingizga ishonch hosil qiling.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPath();
  }, [user.userId]);

  useEffect(() => {
    const userInterests = user.interests || [];
    if (userInterests.length > 0 && !path && !loading && !isSyncing) {
      generatePath();
    }
  }, [JSON.stringify(user.interests), !!path, loading, isSyncing]);

  if (!user.interests || user.interests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-2xl mx-auto px-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-[40px] blur-3xl opacity-20 animate-pulse" />
          <div className="relative w-32 h-32 bg-zinc-900 rounded-[40px] flex items-center justify-center border border-white/5 shadow-2xl">
            <Zap className="w-14 h-14 text-indigo-500" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight uppercase italic lg:text-5xl">
            Sizning <span className="text-indigo-500">AI Kursingiz</span> Tayyor Emas
          </h2>
          <p className="text-zinc-400 font-medium text-lg leading-relaxed">
            Siz uchun shaxsiylashtirilgan, professional o'quv rejasini shakllantirishimiz uchun profilingizdan qiziqishlaringizni tanlang. 
            Bu orqali Gemini aynan sizga mos topshiriqlarni yaratadi.
          </p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 w-full">
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" /> Qanday boshlash kerak?
          </h4>
          <ul className="text-left space-y-3">
            {[
              "Profil sahifasiga o'ting",
              "Qiziqqan sohalaringizni belgilang (masalan: React, Web Design)",
              "O'zgarishlarni saqlang",
              "Shu yerga qaytib kursni generatsiya qiling"
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-500 text-sm">
                <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8">AI Shaxsiy Kurs</h1>
          <p className="text-zinc-500 font-medium text-lg">30 ta maxsus topshiriq va video darslikdan iborat o'quv yo'li</p>
        </div>
        <div className="flex items-center gap-3">
          {path && (
            <div className="hidden lg:flex flex-col items-end mr-4">
               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Progress</span>
               <span className="text-xl font-black text-white">
                 {path.missions.filter(m => user.completedMissions.includes(`ai-${m.title}`)).length} / {path.missions.length}
               </span>
            </div>
          )}
          <button 
            onClick={() => {
              if (window.confirm("Hozirgi kursingizni o'chirib, yangisini yaratmoqchimisiz?")) {
                generatePath();
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all hover:text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Yo'nalishni qaytadan yaratish
          </button>
        </div>
      </header>

      {(loading || isSyncing) ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-6 text-center animate-pulse">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Gemini kursingizni tayyorlamoqda...</h3>
              <p className="text-zinc-500">Iltimos kuting, hozirgina siz uchun 30 ta maqsadli darslik generatsiya qilinmoqda.</p>
            </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[32px] text-center space-y-4">
            <p className="text-red-400 font-bold">{error}</p>
            <button onClick={generatePath} className="px-6 py-2 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-xs">Qayta urinish</button>
        </div>
      ) : path ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 rounded-[48px] border border-white/5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                 <Sparkles className="w-48 h-48 text-indigo-500" />
              </div>
              <div className="relative z-10 space-y-2">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-500/20">Tavsiya etilgan yo'nalish</span>
                  <h2 className="text-3xl font-black text-white tracking-tight">{path.pathTitle}</h2>
                  <p className="text-zinc-500 leading-relaxed max-w-2xl">{path.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {path.missions.map((m, idx) => {
                const isCompleted = user.completedMissions.includes(`ai-${m.title}`);
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "relative overflow-hidden bg-zinc-900/50 backdrop-blur-xl rounded-[32px] border transition-all",
                      isCompleted ? "border-emerald-500/20" : "border-white/5 hover:border-indigo-500/30"
                    )}
                  >
                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* Index & Status circle */}
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                        isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-950 border-white/10 text-zinc-500"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : <span className="text-2xl font-black italic">{idx + 1}</span>}
                      </div>

                      <div className="grow space-y-1.5 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{m.difficulty}</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[10px] font-black rounded-md">
                                <Zap className="w-3 h-3 fill-yellow-500" /> {m.xpReward} XP
                            </div>
                        </div>
                        <h4 className="font-bold text-white text-lg truncate pr-4">{m.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{m.description}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        {m.youtubeId && (
                          <button 
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${m.youtubeId}`, '_blank')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Video className="w-4 h-4" />
                            Darsni ko'rish
                          </button>
                        )}
                        <button 
                          onClick={() => onStartMission({
                              ...m,
                              id: `ai-${m.title}`,
                              worldId: 'ai-path',
                              order: idx,
                              type: 'lesson'
                          }, {
                              id: 'ai-path',
                              title: 'AI Shaxsiy Kurs',
                              description: 'Siz uchun generatsiya qilingan kurs',
                              color: 'from-indigo-600 to-purple-600',
                              missions: [],
                              icon: '✨',
                              order: 99
                          })}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Boshlash
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] space-y-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold">AI Mentor Maslahati</h4>
                <p className="text-sm text-zinc-400 leading-relaxed italic">
                  "Ushbu kayerali kurs Gemini AI tomonidan mahshur o'quv dasturlari va sizning qiziqishlaringiz asosida yaratildi. 30 ta maqsadli dars va video darsliklar sizni mutaxassislikka yetaklaydi."
                </p>
              </div>
            </div>

            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[32px] space-y-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Kurs statistikasi</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-zinc-400">Jami darslar</span>
                  <span className="text-xs font-bold text-white">30 ta</span>
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-zinc-400">Video darsliklar</span>
                  <span className="text-xs font-bold text-white">30 ta</span>
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-zinc-400">Jami XP</span>
                  <span className="text-xs font-bold text-emerald-400">6000+ XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 space-y-6">
            <Sparkles className="w-16 h-16 text-indigo-500 mx-auto opacity-20" />
            <button 
              onClick={generatePath}
              className="px-10 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-transform"
            >
                Kursni generatsiya qilish
            </button>
        </div>
      )}
    </div>
  );
}
