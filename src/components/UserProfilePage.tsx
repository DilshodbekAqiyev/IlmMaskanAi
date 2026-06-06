import React, { useState } from 'react';
import { UserProfile, db, OperationType, handleFirestoreError, calculateLevel } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Camera, Save, Award, BookOpen, CheckCircle2, Zap, Trophy, Sparkles } from 'lucide-react';
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
}

export default function UserProfilePage({ user, onUpdate }: UserProfilePageProps) {
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
        <h1 className="text-4xl font-black text-white tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8">Mening Profilim</h1>
        <p className="text-zinc-500 font-medium">Shaxsiy ma'lumotlaringiz va yutuqlaringizni boshqaring</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Edit Card */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-zinc-900/50 backdrop-blur-xl rounded-[40px] border border-white/5 p-10 space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white/5 bg-zinc-800 shadow-2xl relative">
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
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-3.5 text-white focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none font-bold tracking-tight"
                    placeholder="Ismingizni kiriting"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Profil rasmi URL</label>
                  <input 
                    type="text" 
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-3.5 text-zinc-400 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none font-mono text-xs"
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
                        : "bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="text-xs text-zinc-500">
                {saveStatus === 'success' && <span className="text-emerald-500 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Ozizgarishlar saqlandi!</span>}
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
          <section className="bg-zinc-900/50 backdrop-blur-xl rounded-[40px] border border-white/5 p-10">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-indigo-500" /> Bajarilgan Topshiriqlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.completedMissions.length > 0 ? (
                user.completedMissions.map((missionId) => (
                  <div key={missionId} className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-2xl border border-white/5 group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{missionId}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-zinc-600 italic border-2 border-dashed border-white/5 rounded-3xl">
                  Hali hech qanday topshiriq bajarilmagan.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Achievements */}
        <div className="space-y-8">
          {/* Completeness Card */}
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[40px] border border-white/5 p-8 space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Profil to'liqligi</p>
                <h4 className="text-2xl font-black text-white tracking-tighter">{completeness}%</h4>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                completeness === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              )}>
                {completeness === 100 ? "Mukammal" : "Rivojlanishda"}
              </div>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
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
              <p className="text-[10px] text-zinc-500 italic leading-relaxed">
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
            <div className="flex items-center gap-4">
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
          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-[40px] border border-white/5 p-8">
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
                      hasBadge ? "bg-zinc-800 border-white/10 shadow-lg" : "bg-transparent border-white/5 opacity-20"
                    )}
                  >
                    <span className="text-3xl">{badge.icon}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">{badge.name}</span>
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
