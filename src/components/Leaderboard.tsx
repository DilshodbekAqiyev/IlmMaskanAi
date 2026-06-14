import React, { useState, useEffect } from 'react';
import { db, UserProfile, calculateLevel } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Trophy, Medal, Crown, Star, Zap, Sparkles, X, Award, BookOpen, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BADGES } from '../constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_STUDENTS: Omit<UserProfile, 'createdAt'>[] = [
  {
    userId: 'mock-student-1',
    displayName: 'Alisher Qodirov',
    photoURL: '',
    xp: 9500,
    level: 4,
    role: 'student',
    badges: ['first-code', 'streak-7', 'html-ninja'],
    completedMissions: [],
    interests: [],
    streakCount: 9,
  },
  {
    userId: 'mock-student-2',
    displayName: 'Shahzoda Umarova',
    photoURL: '',
    xp: 12400,
    level: 5,
    role: 'student',
    badges: ['first-code', 'css-master', 'js-wizard'],
    completedMissions: [],
    interests: [],
    streakCount: 15,
  },
  {
    userId: 'mock-student-3',
    displayName: 'Sardorbek Tojiyev',
    photoURL: '',
    xp: 6200,
    level: 3,
    role: 'student',
    badges: ['first-code', 'react-hero'],
    completedMissions: [],
    interests: [],
    streakCount: 5,
  },
  {
    userId: 'mock-student-4',
    displayName: 'Lola Karimova',
    photoURL: '',
    xp: 10800,
    level: 4,
    role: 'student',
    badges: ['first-code', 'streak-7', 'css-master'],
    completedMissions: [],
    interests: [],
    streakCount: 12,
  },
  {
    userId: 'mock-student-5',
    displayName: 'Jasur Halimov',
    photoURL: '',
    xp: 4300,
    level: 2,
    role: 'student',
    badges: ['first-code'],
    completedMissions: [],
    interests: [],
    streakCount: 3,
  },
  {
    userId: 'mock-student-6',
    displayName: 'Madina Axmedova',
    photoURL: '',
    xp: 11200,
    level: 5,
    role: 'student',
    badges: ['first-code', 'js-wizard', 'react-hero'],
    completedMissions: [],
    interests: [],
    streakCount: 14,
  },
  {
    userId: 'mock-student-7',
    displayName: 'Otabek Ismoilov',
    photoURL: '',
    xp: 7500,
    level: 4,
    role: 'student',
    badges: ['first-code', 'streak-7'],
    completedMissions: [],
    interests: [],
    streakCount: 8,
  },
  {
    userId: 'mock-student-8',
    displayName: 'Dilnoza Ergasheva',
    photoURL: '',
    xp: 5100,
    level: 3,
    role: 'student',
    badges: ['first-code'],
    completedMissions: [],
    interests: [],
    streakCount: 4,
  },
  {
    userId: 'mock-student-9',
    displayName: 'Bekzod Rahmonov',
    photoURL: '',
    xp: 3200,
    level: 2,
    role: 'student',
    badges: ['first-code'],
    completedMissions: [],
    interests: [],
    streakCount: 2,
  }
];

interface LeaderboardProps {
  theme?: 'light' | 'dark';
}

export default function Leaderboard({ theme = 'dark' }: LeaderboardProps) {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const itemsPerPage = 5;

  const getEnrichedUser = (u: UserProfile) => {
    if (!u.userId.startsWith('mock-')) return u;
    
    // Create beautiful dynamic realistic interests and completed missions for mock users based on their badges
    const interests = [...(u.interests || [])];
    const completedMissions = [...(u.completedMissions || [])];
    
    if (interests.length === 0) {
      if (u.badges.includes('js-wizard')) {
        interests.push('JavaScript', 'Backend', 'Fullstack');
      } else if (u.badges.includes('css-master')) {
        interests.push('Frontend', 'UI/UX Design', 'CSS Art');
      } else if (u.badges.includes('html-ninja')) {
        interests.push('Frontend', 'Veb saytlar', 'HTML5');
      } else {
        interests.push('Dasturlash', 'Frontend');
      }
    }
    
    if (completedMissions.length === 0) {
      if (u.badges.includes('first-code')) completedMissions.push('html-1', 'html-2');
      if (u.badges.includes('html-ninja')) completedMissions.push('html-3', 'html-4', 'html-5', 'html-6');
      if (u.badges.includes('css-master')) completedMissions.push('css-1', 'css-2', 'css-3');
      if (u.badges.includes('js-wizard')) completedMissions.push('js-1', 'js-2');
      if (u.badges.includes('react-hero')) completedMissions.push('react-1', 'react-2');
    }
    
    return {
      ...u,
      interests,
      completedMissions
    };
  };

  useEffect(() => {
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'student'),
      orderBy('xp', 'desc'), 
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      
      // Combine real Firestore users with Uzbek mock students
      const realUserIds = new Set(users.map(u => u.userId));
      const filteredMocks = MOCK_STUDENTS.filter(mock => !realUserIds.has(mock.userId)) as UserProfile[];
      
      const combined = [...users, ...filteredMocks];
      
      // Sort descending by XP
      combined.sort((a, b) => b.xp - a.xp);
      
      // Slice to exactly 10 o'quvchi to matches the requirement perfectly
      const top10 = combined.slice(0, 10);
      
      setTopUsers(top10);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="p-8 text-zinc-500 italic font-mono uppercase tracking-widest text-xs">Reyting yuklanmoqda...</div>;

  const totalPages = Math.ceil(topUsers.length / itemsPerPage);
  const pageItems = topUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-4xl mx-auto space-y-12 select-none">
      <div className="text-center space-y-4">
        <div className={cn(
          "inline-block p-4 rounded-2xl border transition-all duration-300",
          theme === 'light' ? "bg-white border-zinc-200 shadow-md shadow-zinc-150" : "bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5"
        )}>
          <Trophy className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className={cn(
          "text-5xl font-black tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8",
          theme === 'light' ? "text-zinc-950" : "text-white"
        )}>Peshqadamlar</h1>
        <p className={cn("font-medium text-lg", theme === 'light' ? "text-zinc-650" : "text-zinc-500")}>Dunyo bo'ylab eng faol kashfiyotchilar reytingi</p>
      </div>

      <div className={cn(
        "rounded-[40px] shadow-2xl border overflow-hidden transition-all duration-300",
        theme === 'light' ? "bg-white border-zinc-200 shadow-xl shadow-zinc-200/50" : "bg-zinc-900/50 backdrop-blur-xl border border-white/5"
      )}>
        <div className={cn(
          "grid grid-cols-[100px_1fr_120px_120px_150px] px-10 py-6 border-b text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-300",
          theme === 'light' ? "bg-zinc-50 border-zinc-150 text-zinc-500" : "bg-zinc-950/50 border-white/5 text-zinc-500"
        )}>
          <div className="text-center">Tartib</div>
          <div>O'quvchi</div>
          <div className="text-center">Streak</div>
          <div className="text-center">Daraja</div>
          <div className="text-right">Tajriba (XP)</div>
        </div>

        <div className={cn("divide-y", theme === 'light' ? "divide-zinc-100" : "divide-white/5")}>
          {pageItems.map((user, index) => {
            const absoluteIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "grid grid-cols-[100px_1fr_120px_120px_150px] px-10 py-7 items-center transition-all group",
                  theme === 'light' ? "hover:bg-zinc-50/50" : "hover:bg-white/5",
                  absoluteIndex === 0 ? (theme === 'light' ? "bg-indigo-50/20" : "bg-indigo-500/5") : ""
                )}
              >
                <div className="flex items-center justify-center">
                  {absoluteIndex === 0 ? (
                    <div className="relative">
                      <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-20" />
                    </div>
                  ) : absoluteIndex === 1 ? (
                    <Medal className="w-7 h-7 text-slate-400 fill-slate-400" />
                  ) : absoluteIndex === 2 ? (
                    <Medal className="w-7 h-7 text-orange-405 fill-orange-400 text-orange-400" />
                  ) : (
                    <span className={cn("text-xl font-mono font-bold tracking-tighter", theme === 'light' ? "text-zinc-400" : "text-zinc-700")}>#{absoluteIndex + 1}</span>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="relative focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl cursor-pointer group/avatar block"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl overflow-hidden border-2 ring-4 ring-transparent group-hover/avatar:ring-indigo-500/20 transition-all",
                      theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-white/10"
                    )}>
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} 
                        alt={user.displayName}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {absoluteIndex < 3 && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                        {absoluteIndex + 1}
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "font-bold text-lg tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 group-hover:underline transition-colors cursor-pointer text-left focus:outline-none",
                        theme === 'light' ? "text-zinc-900" : "text-white"
                      )}
                    >
                      {user.displayName}
                    </button>
                    <div className="flex gap-1.5 flex-wrap">
                      {(user.badges || []).slice(0, 4).map((b, i) => (
                        <span key={i} className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center text-[10px]",
                          theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-white/5"
                        )} title={String(b)}>
                          {b === 'html-ninja' ? '📜' : b === 'css-master' ? '🎨' : b === 'js-wizard' ? '⚡' : b === 'react-hero' ? '⚛️' : b === 'first-code' ? '🚀' : b === 'streak-7' ? '🔥' : '🏆'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className={cn("w-4 h-4", (user.streakCount || 0) > 0 ? "text-orange-500 fill-orange-500" : theme === 'light' ? "text-zinc-300" : "text-zinc-700")} />
                    <span className={cn(
                      "text-xs font-bold", 
                      (user.streakCount || 0) > 0 
                        ? theme === 'light' ? "text-zinc-800 font-extrabold" : "text-white"
                        : "text-zinc-400"
                    )}>
                      {user.streakCount || 0}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <span className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    theme === 'light' ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  )}>
                    Lv. {calculateLevel(user.xp)}
                  </span>
                </div>

                <div className={cn("text-right flex items-center justify-end gap-2", theme === 'light' ? "text-zinc-950 font-black" : "text-white")}>
                  <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                  <span className="text-2xl font-black tracking-tighter">{user.xp.toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={cn(
            "flex items-center justify-between px-10 py-5 border-t transition-colors duration-300",
            theme === 'light' ? "bg-zinc-50 border-zinc-150" : "bg-zinc-950/30 border-t border-white/5"
          )}>
            <div className={cn("text-xs font-semibold uppercase tracking-wider", theme === 'light' ? "text-zinc-500" : "text-zinc-500")}>
              Sahifa {currentPage} / {totalPages} (Jami {topUsers.length} o'quvchi)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40 rounded-xl border transition-all select-none cursor-pointer",
                  theme === 'light' ? "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200" : "bg-zinc-800 hover:bg-zinc-700 disabled:hover:bg-zinc-800 text-zinc-300 border border-white/5"
                )}
              >
                Oldingi
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/10 transition-all select-none cursor-pointer"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      {topUsers.length === 0 && (
        <div className={cn(
          "text-center p-20 rounded-[40px] border-2 border-dashed italic font-medium",
          theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-900/30 border-white/5 text-zinc-650"
        )}>
          Hozircha reyting jadvali shakllanmoqda...
        </div>
      )}

      {/* Dynamic Profile Detail Modal */}
      <AnimatePresence>
        {selectedUser && (() => {
          const enriched = getEnrichedUser(selectedUser);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedUser(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className={cn(
                  "border rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl relative p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto transition-all duration-300",
                  theme === 'light' ? "bg-white border-zinc-200 text-zinc-800" : "bg-zinc-950/95 border border-white/10 text-white"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedUser(null)}
                  className={cn(
                    "absolute top-6 right-6 p-2 rounded-xl transition-colors cursor-pointer",
                    theme === 'light' ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800" : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Profile Information Header */}
                <div className={cn(
                  "flex flex-col sm:flex-row items-center gap-6 border-b pb-6",
                  theme === 'light' ? "border-zinc-100" : "border-white/5"
                )}>
                  <div className={cn(
                    "w-24 h-24 rounded-[32px] overflow-hidden border-2 shadow-xl",
                    theme === 'light' ? "bg-zinc-100 border-zinc-200" : "bg-zinc-800 border-2 border-white/10"
                  )}>
                    <img
                      src={enriched.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${enriched.userId}`}
                      alt={enriched.displayName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <span className={cn(
                      "px-3 py-1 border text-[10px] font-black uppercase tracking-widest rounded-full",
                      theme === 'light' ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    )}>
                      Tizim O'quvchisi
                    </span>
                    <h3 className={cn("text-3xl font-black tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>
                      {enriched.displayName}
                    </h3>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <span className={cn(
                        "px-3 py-1 border rounded-lg text-xs font-bold leading-none",
                        theme === 'light' ? "bg-zinc-50 border-zinc-200 text-zinc-650" : "bg-zinc-900 border border-white/5 text-zinc-400"
                      )}>
                        Daraja: {calculateLevel(enriched.xp)}
                      </span>
                      {enriched.streakCount > 0 && (
                        <span className={cn(
                          "flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-lg border",
                          theme === 'light' ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                        )}>
                          <Sparkles className="w-3.5 h-3.5 fill-orange-500 text-orange-500 border-none animate-pulse" />
                          {enriched.streakCount} kunlik streak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats & Interests Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Stats & Experience */}
                  <div className={cn(
                    "border rounded-[24px] p-6 space-y-4",
                    theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border border-white/5"
                  )}>
                    <h4 className={cn("text-xs uppercase font-extrabold tracking-wider", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Ko'rsatkichlar</h4>
                    <div className="space-y-3">
                      <div className={cn(
                        "p-3 rounded-xl border flex justify-between items-center",
                        theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950/60 border border-white/5"
                      )}>
                        <span className="text-xs text-zinc-500 font-semibold font-medium">To'plangan XP:</span>
                        <div className={cn("flex items-center gap-1.5 font-black text-sm", theme === 'light' ? "text-zinc-950" : "text-white")}>
                          <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                          {enriched.xp.toLocaleString()}
                        </div>
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl border flex justify-between items-center",
                        theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-950/60 border border-white/5"
                      )}>
                        <span className="text-xs text-zinc-500 font-semibold font-medium">Bajarilgan topshiriqlar:</span>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {enriched.completedMissions.length} ta
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interests */}
                  <div className={cn(
                    "border rounded-[24px] p-6 space-y-4",
                    theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border border-white/5"
                  )}>
                    <h4 className={cn("text-xs uppercase font-extrabold tracking-wider", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Qiziqishlar</h4>
                    <div className="flex flex-wrap gap-2">
                      {enriched.interests.length > 0 ? (
                        enriched.interests.map((interest) => (
                          <span
                            key={interest}
                            className={cn(
                              "px-3 py-1.5 border rounded-xl text-xs font-bold",
                              theme === 'light' ? "bg-indigo-500/5 border-indigo-150 text-indigo-600" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
                            )}
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <div className="text-xs text-zinc-500 italic py-2">
                          Qiziqishlar belgilanmagan
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges Earned */}
                <div className={cn(
                  "border rounded-[24px] p-6 space-y-4",
                  theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-900/40 border border-white/5"
                )}>
                  <h4 className={cn("text-xs uppercase font-extrabold tracking-wider", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Qo'lga Kiritilgan Yutuqlar</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BADGES.map((badge) => {
                      const hasBadge = enriched.badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1",
                            hasBadge
                              ? theme === 'light'
                                ? "bg-white border-zinc-200 shadow-sm"
                                : "bg-zinc-950/80 border-white/10 shadow-md"
                              : theme === 'light'
                                ? "bg-zinc-100/40 border-zinc-200/50 opacity-25"
                                : "bg-transparent border-white/5 opacity-20"
                          )}
                          title={badge.desc}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-tighter leading-none",
                            theme === 'light' ? "text-zinc-750" : "text-zinc-400"
                          )}>
                            {badge.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
