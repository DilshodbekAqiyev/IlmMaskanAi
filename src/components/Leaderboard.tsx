import React, { useState, useEffect } from 'react';
import { db, UserProfile, calculateLevel } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Trophy, Medal, Crown, Star, Zap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      orderBy('xp', 'desc'), 
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setTopUsers(users);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="p-8 text-zinc-500 italic font-mono uppercase tracking-widest text-xs">Singanal yuklanmoqda...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-block p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5 mb-2">
          <Trophy className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8">Peshqadamlar</h1>
        <p className="text-zinc-500 font-medium text-lg">Dunyo bo'ylab eng faol kashfiyotchilar reytingi</p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_120px_120px_150px] px-10 py-6 bg-zinc-950/50 border-b border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">
          <div className="text-center">Tartib</div>
          <div>O'quvchi</div>
          <div className="text-center">Streak</div>
          <div className="text-center">Daraja</div>
          <div className="text-right">Tajriba (XP)</div>
        </div>

        <div className="divide-y divide-white/5">
          {topUsers.map((user, index) => (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`grid grid-cols-[100px_1fr_120px_120px_150px] px-10 py-7 items-center hover:bg-white/5 transition-all group ${index === 0 ? 'bg-indigo-500/5' : ''}`}
            >
              <div className="flex items-center justify-center">
                {index === 0 ? (
                  <div className="relative">
                    <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-20" />
                  </div>
                ) : index === 1 ? (
                  <Medal className="w-7 h-7 text-slate-400 fill-slate-400" />
                ) : index === 2 ? (
                  <Medal className="w-7 h-7 text-orange-400 fill-orange-400" />
                ) : (
                  <span className="text-xl font-mono font-bold text-zinc-700 tracking-tighter">#{index + 1}</span>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-white/10 ring-4 ring-transparent group-hover:ring-indigo-500/20 transition-all">
                    <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} 
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {index < 3 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-lg text-white tracking-tight group-hover:text-indigo-400 transition-colors">{user.displayName}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {(user.badges || []).slice(0, 4).map((b, i) => (
                      <span key={i} className="w-5 h-5 bg-zinc-800 rounded-md border border-white/5 flex items-center justify-center text-[10px]" title={String(b)}>
                        {b === 'html-ninja' ? '📜' : b === 'css-master' ? '🎨' : b === 'js-wizard' ? '⚡' : b === 'react-hero' ? '⚛️' : b === 'first-code' ? '🚀' : b === 'streak-7' ? '🔥' : '🏆'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className={cn("w-4 h-4", (user.streakCount || 0) > 0 ? "text-orange-500 fill-orange-500" : "text-zinc-700")} />
                  <span className={cn("text-xs font-bold", (user.streakCount || 0) > 0 ? "text-white" : "text-zinc-700")}>
                    {user.streakCount || 0}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  Lv. {calculateLevel(user.xp)}
                </span>
              </div>

              <div className="text-right flex items-center justify-end gap-2 text-white">
                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <span className="text-2xl font-black tracking-tighter">{user.xp.toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {topUsers.length === 0 && (
        <div className="text-center p-20 bg-zinc-900/30 rounded-[40px] border-2 border-dashed border-white/5 text-zinc-600 italic font-medium">
          Hozircha reyting jadvali shakllanmoqda...
        </div>
      )}
    </div>
  );
}
