import React, { useState } from 'react';
import { UserProfile, db, OperationType, handleFirestoreError, calculateLevel } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Camera, Save, Award, BookOpen, CheckCircle2, Zap, Trophy, Sparkles, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { BADGES } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfilePageProps {
  user: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
  theme?: 'dark' | 'light';
  setTheme?: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
}

export default function UserProfilePage({ user, onUpdate, theme = 'dark', setTheme }: UserProfilePageProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const AVAILABLE_INTERESTS = [
    "Frontend", "Backend", "AI & ML", "Mobile Apps", "Game Dev", "Cybersecurity", "Data Science", "UI/UX Design"
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (displayName && displayName.trim().length > 0) score += 30;
    if (photoURL && photoURL.trim().length > 0) score += 30;
    if (interests.length > 0) score += 20;
    if (user.badges.length > 0) score += 10;
    if (user.completedMissions.length > 0) score += 10;
    return score;
  };

  const completeness = calculateCompleteness();

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const userRef = doc(db, 'users', user.userId);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        interests
      });
      onUpdate({ displayName, photoURL, interests });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <header className="space-y-2">
        <h1 className={cn(
          "text-4xl font-black tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8 transition-colors duration-300",
          theme === 'light' ? "text-zinc-900" : "text-white"
        )}>Mening Profilim</h1>
        <p className="text-zinc-500 font-medium">Shaxsiy ma'lumotlaringiz va yutuqlaringizni boshqaring</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Edit Card */}
        <div className="lg:col-span-2 space-y-8">
          <section className={cn(
            "backdrop-blur-xl rounded-[40px] border p-10 space-y-8 transition-colors duration-300",
            theme === 'light' ? "bg-white border-zinc-200 shadow-md" : "bg-zinc-900/50 border-white/5"
          )}>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className={cn(
                  "w-32 h-32 rounded-[40px] overflow-hidden border-4 bg-zinc-800 shadow-2xl relative transition-colors duration-300",
                  theme === 'light' ? "border-zinc-200" : "border-white/5"
                )}>
                  <img 
                    src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.userId}`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="grow space-y-4 w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">To'liq ism</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={cn(
                      "w-full rounded-2xl px-5 py-3.5 focus:ring-2 transition-all outline-none font-bold tracking-tight",
                      theme === 'light' 
                        ? "bg-zinc-100/80 border border-zinc-200 text-zinc-900 focus:ring-indigo-500/30" 
                        : "bg-zinc-950 border border-white/5 text-white focus:ring-indigo-500/50"
                    )}
                    placeholder="Ismingizni kiriting"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Profil rasmi URL</label>
                  <input 
                    type="text" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className={cn(
                      "w-full rounded-2xl px-5 py-3.5 focus:ring-2 transition-all outline-none font-mono text-xs",
                      theme === 'light' 
                        ? "bg-zinc-100/80 border border-zinc-200 text-zinc-600 focus:ring-indigo-500/30" 
                        : "bg-zinc-950 border border-white/5 text-zinc-400 focus:ring-indigo-500/50"
                    )}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Qiziqishlar (AI tavsiyalari uchun)</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                      interests.includes(interest)
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : theme === 'light'
                          ? "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900"
                          : "bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* System Theme Selection Card Sub-Section */}
            <div className={cn(
              "space-y-4 pt-6 border-t border-dashed",
              theme === 'light' ? "border-zinc-200" : "border-white/5"
            )}>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Tizim Ko'rinishi (Kun / Tun)</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme && setTheme('light')}
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-2xl border font-bold text-sm transition-all shadow-sm",
                    theme === 'light'
                      ? "bg-white border-amber-500 text-amber-600 shadow-amber-500/10"
                      : "bg-zinc-950/40 border-white/5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/30"
                  )}
                >
                  <Sun className="w-5 h-5 fill-amber-500 text-amber-500" />
                  Kunduzgi Rejim (Kun)
                </button>
                <button
                  type="button"
                  onClick={() => setTheme && setTheme('dark')}
                  className={cn(
                    "flex items-center justify-center gap-3 p-4 rounded-2xl border font-bold text-sm transition-all shadow-sm",
                    theme === 'dark'
                      ? "bg-zinc-900 border-indigo-500 text-indigo-400 font-black shadow-lg shadow-indigo-500/10"
                      : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50"
                  )}
                >
                  <Moon className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                  Tungi Rejim (Tun)
                </button>
              </div>
            </div>

            <div className={cn(
              "flex items-center justify-between pt-4 border-t",
              theme === 'light' ? "border-zinc-200" : "border-white/5"
            )}>
              <div className="text-xs text-zinc-500">
                {saveStatus === 'success' && <span className="text-emerald-500 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> O'zgarishlar saqlandi!</span>}
                {saveStatus === 'error' && <span className="text-red-500 font-bold">Xatolik yuz berdi.</span>}
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isSaving ? "Saqlanmoqda..." : <><Save className="w-4 h-4" /> Saqlash</>}
              </button>
            </div>
          </section>

          {/* Missions History */}
          <section className={cn(
            "backdrop-blur-xl rounded-[40px] border p-10 transition-colors duration-300",
            theme === 'light' ? "bg-white border-zinc-200 shadow-md" : "bg-zinc-900/50 border-white/5"
          )}>
            <h3 className={cn(
              "text-xl font-bold mb-8 flex items-center gap-3",
              theme === 'light' ? "text-zinc-800" : "text-white"
            )}>
              <BookOpen className="w-6 h-6 text-indigo-500" /> Bajarilgan Topshiriqlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.completedMissions.length > 0 ? (
                user.completedMissions.map((missionId) => (
                  <div key={missionId} className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group",
                    theme === 'light' 
                      ? "bg-zinc-50 border-zinc-200/80 hover:bg-zinc-100" 
                      : "bg-zinc-950/50 border-white/5 hover:bg-zinc-900/50"
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className={cn(
                      "text-sm font-bold transition-colors",
                      theme === 'light' ? "text-zinc-700 group-hover:text-zinc-900" : "text-zinc-300 group-hover:text-white"
                    )}>{missionId}</span>
                  </div>
                ))
              ) : (
                <div className={cn(
                  "col-span-full py-10 text-center italic border-2 border-dashed rounded-3xl",
                  theme === 'light' ? "text-zinc-400 border-zinc-200" : "text-zinc-600 border-white/5"
                )}>
                  Hali hech qanday topshiriq bajarilmagan.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-8">
          {/* Completeness Card */}
          <div className={cn(
            "backdrop-blur-xl rounded-[40px] border p-8 space-y-6 transition-colors duration-300",
            theme === 'light' ? "bg-white border-zinc-200 shadow-md" : "bg-zinc-900/50 border-white/5"
          )}>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Profil to'liqligi</p>
                <h4 className={cn(
                  "text-2xl font-black tracking-tighter",
                  theme === 'light' ? "text-zinc-900" : "text-white"
                )}>{completeness}%</h4>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                completeness === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              )}>
                {completeness === 100 ? "Mukammal" : "Rivojlanishda"}
              </div>
            </div>
            <div className={cn("h-2 rounded-full overflow-hidden border", theme === 'light' ? "bg-zinc-200 border-zinc-300/40" : "bg-zinc-800 border-white/5")}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.4)]",
                  completeness === 100 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                )}
              />
            </div>
            {completeness < 100 && (
              <p className="text-[10px] text-zinc-400 italic leading-relaxed whitespace-pre-line">
                {!displayName && "• Ismingizni kiriting\n"}
                {!photoURL && "• Profil rasmini yuklang\n"}
                {interests.length === 0 && "• Qiziqishlaringizni tanlang\n"}
                {user.badges.length === 0 && "• Birinchi yutuqni qo'lga kiriting\n"}
                {user.completedMissions.length === 0 && "• Birinchi topshiriqni bajaring"}
              </p>
            )}
          </div>

          {/* Stats Box */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[40px] shadow-2xl relative overflow-hidden text-white group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Trophy className="w-32 h-32" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Umumiy Tajriba</p>
            <h4 className="text-5xl font-black tracking-tight mb-6">{user.xp.toLocaleString()} <span className="text-xl opacity-60">XP</span></h4>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 w-fit">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span className="text-xs font-bold">Level {calculateLevel(user.xp)}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 w-fit">
                <Sparkles className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xs font-bold">{user.streakCount || 0} kunlik streak</span>
              </div>
            </div>
          </div>

          {/* Badges Box */}
          <div className={cn(
            "backdrop-blur-xl rounded-[40px] border p-8 transition-colors duration-300",
            theme === 'light' ? "bg-white border-zinc-200 shadow-md" : "bg-zinc-900/50 border-white/5"
          )}>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" /> Yutuqlar (Badges)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {BADGES.map((badge) => {
                const hasBadge = user.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-3xl border transition-all text-center gap-2",
                      hasBadge 
                        ? theme === 'light'
                          ? "bg-zinc-55 border-zinc-200 shadow-sm bg-zinc-50"
                          : "bg-zinc-800 border-white/10 shadow-lg"
                        : theme === 'light'
                          ? "bg-zinc-50/20 border-zinc-200/50 opacity-20"
                          : "bg-transparent border-white/5 opacity-20"
                    )}
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tighter leading-none",
                      theme === 'light' ? "text-zinc-600" : "text-zinc-400"
                    )}>{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
