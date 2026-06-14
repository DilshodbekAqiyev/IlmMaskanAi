import React, { useState, useEffect } from 'react';
import { db, UserProfile } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Users, BookOpen, Clock, BarChart3, ChevronRight, User, GraduationCap, Presentation } from 'lucide-react';
import { motion } from 'motion/react';

interface TeacherDashboardProps {
  user: UserProfile;
  theme?: 'light' | 'dark';
}

export default function TeacherDashboard({ user, theme = 'dark' }: TeacherDashboardProps) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageXp: 0,
    completedMissions: 0
  });
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setStudents(studentList);
      
      const totalXp = studentList.reduce((acc, curr) => acc + (curr.xp || 0), 0);
      const totalCompleted = studentList.reduce((acc, curr) => acc + (curr.completedMissions?.length || 0), 0);
      
      setStats({
        totalStudents: studentList.length,
        averageXp: studentList.length ? Math.round(totalXp / studentList.length) : 0,
        completedMissions: totalCompleted
      });
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (user.role !== 'teacher' && user.role !== 'parent') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-zinc-900 rounded-[32px] border border-white/5 flex items-center justify-center shadow-2xl">
          <GraduationCap className="w-12 h-12 text-zinc-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic underline decoration-indigo-500 underline-offset-4 tracking-tight">Student Profil</h2>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
            Boshqaruv paneli faqat o'qituvchilar va ota-onalar uchun mo'ljallangan. Bilim olishda davom eting!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <header className="flex items-end justify-between border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8">Boshqaruv Markazi</h1>
          <p className="text-zinc-500 font-medium">Guruh faoliyati va statistikani tahlil qiling</p>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-all flex items-center gap-2 uppercase tracking-widest leading-none">
            <Presentation className="w-4 h-4 text-indigo-500" /> Dars boshlash
          </button>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest leading-none">
            Hisobot yuklash
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Talabalar soni', value: stats.totalStudents, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'O\'rtacha XP', value: stats.averageXp.toLocaleString(), icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Bajarilgan darslar', value: stats.completedMissions.toLocaleString(), icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-[40px] shadow-sm border border-white/5 flex items-center gap-8 group hover:border-indigo-500/30 transition-all"
          >
            <div className={`w-16 h-16 ${stat.bg} rounded-[24px] flex items-center justify-center shrink-0 border border-white/5 transition-transform group-hover:scale-110`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</p>
              <h4 className="text-3xl font-black text-white tracking-tight">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Student List */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-[40px] shadow-xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-950/30">
          <h3 className="font-bold text-white flex items-center gap-3 italic tracking-tight">
            <User className="w-5 h-5 text-indigo-500" /> Talabalar Ro'yxati
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{students.length} kashfiyotchi faol</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {students.map((student) => (
            <div key={student.userId} className="p-6 hover:bg-white/5 transition-all flex items-center gap-6 group">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border-2 border-white/10 overflow-hidden relative shadow-inner">
                 <img src={student.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.userId}`} alt="" referrerPolicy="no-referrer" />
                 <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-lg text-white leading-none tracking-tight group-hover:text-indigo-400 transition-colors">{student.displayName}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Level {student.level}</span>
                  <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span className="text-[10px] font-mono font-bold text-indigo-400">{student.xp.toLocaleString()} XP</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 w-64 hidden lg:flex">
                 <div className="flex justify-between w-full text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">
                    <span>Progress</span>
                    <span>{Math.min((student.completedMissions?.length || 0) * 10, 100)}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                      style={{ width: `${Math.min((student.completedMissions?.length || 0) * 10, 100)}%` }} 
                    />
                 </div>
              </div>
              <button className="p-3 hover:bg-zinc-800 rounded-xl transition-all group-hover:translate-x-1">
                <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
