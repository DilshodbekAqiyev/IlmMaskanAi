import React, { useState } from 'react';
import { UserProfile, calculateLevel } from '../lib/firebase';
import { BADGES, WORLDS } from '../constants';
import AchievementUnlockedModal from './AchievementUnlockedModal';
import { 
  Award, 
  Trophy, 
  Zap, 
  Star, 
  Lock, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  QrCode, 
  Share2, 
  MapPin, 
  Compass, 
  BookmarkCheck,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AchievementsPageProps {
  user: UserProfile;
}

interface Certificate {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  requirementsText: string;
  badgeRequired?: string;
  checkUnlocked: (user: UserProfile) => boolean;
  requiredMissionsCount?: number;
  worldIds?: string[];
}

export default function AchievementsPage({ user }: AchievementsPageProps) {
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[0] | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [demoBadgeIds, setDemoBadgeIds] = useState<string[]>([]);

  // Define dynamic certificates based on worlds & milestones
  const certificates: Certificate[] = [
    {
      id: 'html-css-fundamentals',
      title: 'HTML & CSS Muhandisligi Asoslari',
      subtitle: 'Fundamentals of Web Structure & Styling',
      category: 'Frontend Asoslari',
      description: 'HTML5 semantikasi, zamonaviy CSS3 Flexbox va Grid joylashuvlari, responsive dizayn hamda vizual animatsiya tizimlarini mukammal o\'zlashtirganlik sertifikati.',
      requirementsText: 'HTML Island va CSS Mountains bo\'limlaridagi barcha topshiriqlarni yakunlash.',
      worldIds: ['html-island', 'css-mountains'],
      checkUnlocked: (u) => {
        const htmlMissions = WORLDS.find(w => w.id === 'html-island')?.missions.map(m => m.id) || [];
        const cssMissions = WORLDS.find(w => w.id === 'css-mountains')?.missions.map(m => m.id) || [];
        const requiredMissions = [...htmlMissions, ...cssMissions];
        if (requiredMissions.length === 0) return false;
        return requiredMissions.every(mId => u.completedMissions.includes(mId));
      }
    },
    {
      id: 'javascript-mastery',
      title: 'JavaScript Dasturlash Mutaxassisi',
      subtitle: 'Advanced JavaScript & Algorithmics',
      category: 'Dasturlash Mantiqi',
      description: 'JavaScript tilining zamonaviy ES6+ sintaksisi, asinxron so\'rovlar (Promises, Async/Await), ma\'lumotlar tuzilmalari va murakkab funksional mantiq tushunchalarini o\'zlashtirganlik sertifikati.',
      requirementsText: 'JS City bo\'limidagi barcha topshiriqlarni to\'liq yakunlash.',
      worldIds: ['js-city'],
      checkUnlocked: (u) => {
        const jsMissions = WORLDS.find(w => w.id === 'js-city')?.missions.map(m => m.id) || [];
        if (jsMissions.length === 0) return false;
        return jsMissions.every(mId => u.completedMissions.includes(mId));
      }
    },
    {
      id: 'react-galaxy-engineer',
      title: 'React komponentli ilovalar muhandisi',
      subtitle: 'Modern React SPA Development & Architecture',
      category: 'Kutubxonalar & Frameworklar',
      description: 'Funtksional komponentlar, Custom Hooklar, holat boshqaruvi (State Management), React router hamda asinxron API ma\'lumot integratsiyasini to\'liq o\'zlashtirganlik sertifikati.',
      requirementsText: 'React Galaxy bo\'limidagi barcha topshiriqlarni koodlash orqali yakunlash.',
      worldIds: ['react-galaxy'],
      checkUnlocked: (u) => {
        const reactMissions = WORLDS.find(w => w.id === 'react-galaxy')?.missions.map(m => m.id) || [];
        if (reactMissions.length === 0) return false;
        return reactMissions.every(mId => u.completedMissions.includes(mId));
      }
    },
    {
      id: 'devedu-front-end-professional',
      title: 'DevEdu professional Front-End dasturchi',
      subtitle: 'Full-Stack Guided Frontend Developer',
      category: 'Professional Sertifikat',
      description: 'Frontend muhandisligining barcha asosiy fanlarini (HTML, CSS, JS, React) muvaffaqiyatli topshirgan holda 5-darajaga (Level 5) ko\'tarilganlik va yuqori mukammallik sertifikati.',
      requirementsText: 'Platformada 5-darajaga (Level 5) yetib kelish.',
      checkUnlocked: (u) => calculateLevel(u.xp) >= 5
    }
  ];

  const totalBadges = BADGES.length;
  const unlockedBadgesCount = user.badges.length;
  const unlockedCertsCount = certificates.filter(c => c.checkUnlocked(user)).length;
  const completedMissionsCount = user.completedMissions.length;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentLevel = calculateLevel(user.xp);

  const getVerificationCode = (certId: string) => {
    // Generate a beautiful unique verification code based on userId and certificate ID
    const cleanId = user.userId.slice(0, 5).toUpperCase();
    const cleanCert = certId.slice(0, 4).toUpperCase();
    return `DE-${cleanCert}-${cleanId}-2026`;
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Dynamic Printing Style overrides to ensure ONLY the certificate prints cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          #print-zone, #print-zone * {
            visibility: visible;
          }
          #print-zone {
            position: absolute;
            left: 0;
            top: 0;
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            border: none;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            box-shadow: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Header section with Stats block */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
            <Award className="w-4 h-4" />
            <span>Muvaffaqiyatlar Saroyi</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase decoration-indigo-500 underline underline-offset-8">Yutuqlar va Sertifikatlar</h1>
          <p className="text-zinc-400 text-sm font-medium">Barcha nishonlar, darajalar va rasmiy tamomlaganlik sertifikatlaringiz.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              const randomBadgesPool = BADGES.map(b => b.id);
              const count = Math.floor(Math.random() * 2) + 1;
              const selectedIds: string[] = [];
              for (let i = 0; i < count; i++) {
                const randId = randomBadgesPool[Math.floor(Math.random() * randomBadgesPool.length)];
                if (!selectedIds.includes(randId)) {
                  selectedIds.push(randId);
                }
              }
              setDemoBadgeIds(selectedIds);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white fill-white animate-pulse" />
            Yutuqni Simulyatsiya Qilish 🚀
          </button>

          <button 
            onClick={handleShare}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl border border-white/5 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            {copiedLink ? "Havola nuxsalandi!" : "Yutuqlarni ulashish"}
          </button>
        </div>
      </header>

      {/* Grid Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute right-4 bottom-4 opacity-5">
            <Trophy className="w-20 h-20 text-white" />
          </div>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Mening Darajam</span>
          <span className="text-3xl font-black text-indigo-400 block tracking-tight">LVL {currentLevel}</span>
          <span className="text-[11px] text-zinc-400 mt-2 block">{user.xp.toLocaleString()} XP to'plandi</span>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute right-4 bottom-4 opacity-5">
            <Award className="w-20 h-20 text-white" />
          </div>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Nishonlar (Badges)</span>
          <span className="text-3xl font-black text-rose-450 block tracking-tight">{unlockedBadgesCount} / {totalBadges}</span>
          <span className="text-[11px] text-zinc-400 mt-2 block">{totalBadges - unlockedBadgesCount} ta locked badge</span>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute right-4 bottom-4 opacity-5">
            <FileText className="w-20 h-20 text-white" />
          </div>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1 font-sans">Sertifikatlar</span>
          <span className="text-3xl font-black text-emerald-450 block tracking-tight">{unlockedCertsCount} ta unlocked</span>
          <span className="text-[11px] text-zinc-400 mt-2 block">{certificates.length - unlockedCertsCount} locked certificate</span>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute right-4 bottom-4 opacity-5">
            <CheckCircle2 className="w-20 h-20 text-white" />
          </div>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Topshiriqlar</span>
          <span className="text-3xl font-black text-amber-500 block tracking-tight">{completedMissionsCount} ta yakunlandi</span>
          <span className="text-[11px] text-zinc-400 mt-2 block">Darslarni o'rganish xaritasi boylab</span>
        </div>
      </div>

      {/* Two Columns: Left (Badges), Right (Achievements Trackers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Nishonlar grid block */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Eritilgan nishonlar (Badges)</h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono font-bold bg-zinc-900 px-3 py-1 rounded-full border border-white/5">{unlockedBadgesCount} ochilgan</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BADGES.map((badge) => {
              const isUnlocked = user.badges.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setSelectedBadge(badge)}
                  className={`cursor-pointer p-6 rounded-3xl border transition-all text-center flex flex-col justify-between items-center h-48 relative group ${
                    isUnlocked 
                      ? 'bg-zinc-900/60 border-indigo-500/35 hover:border-indigo-500 shadow-lg shadow-indigo-600/[0.04]' 
                      : 'bg-zinc-900/20 border-white/5 opacity-40 hover:opacity-60'
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-3 right-3">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400 animate-pulse" />
                    </div>
                  )}

                  <div className="space-y-4 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-all ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/30' 
                        : 'bg-zinc-950 text-zinc-600 grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-tighter block leading-snug">{badge.name}</h4>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold">
                        {isUnlocked ? "Eritilgan" : "Bloklangan"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-indigo-400 font-bold hover:underline">
                    Batafsil ko'rish
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Level Up & Completion Guidelines */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Muvaffaqiyat Bosqichlari</h3>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-rose-500/10 rounded-lg text-rose-500"><Trophy className="w-3.5 h-3.5" /></span>
                  <span className="text-xs font-black uppercase text-zinc-300">Nishonlar Progressi</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">{Math.round((unlockedBadgesCount / totalBadges) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(unlockedBadgesCount / totalBadges) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-500/10 rounded-lg text-indigo-500"><Zap className="w-3.5 h-3.5" /></span>
                  <span className="text-xs font-black uppercase text-zinc-300">Leveling Tracker</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">LVL {currentLevel}</span>
              </div>
              <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ 
                    width: `${(() => {
                      const nextXp = Math.pow(currentLevel, 2) * 100;
                      const prevXp = Math.pow(currentLevel - 1, 2) * 100;
                      const progress = ((user.xp - prevXp) / (nextXp - prevXp)) * 100;
                      return Math.max(5, Math.min(progress, 100));
                    })()}%` 
                  }} 
                />
              </div>
              <p className="text-[10px] text-zinc-500 italic block">Navbatdagi darajaga o'tish uchun yana topshiriqlarni bajaring hamda XP to'plang.</p>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Tezkor Ma'lumot</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Faollik streaki:</span>
                  <span className="text-emerald-400 font-extrabold">{user.streakCount || 0} kun</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Sessiya ishtiroki:</span>
                  <span className="text-indigo-400 font-extrabold">Real-time Collab tayyor</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-medium font-sans">Sertifikatlar mavjud:</span>
                  <span className="text-indigo-400 font-extrabold">{unlockedCertsCount} ta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sertifikatlar Section */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">DevEdu Akademiyasi Sertifikatlari</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => {
            const isUnlocked = cert.checkUnlocked(user);
            return (
              <div
                key={cert.id}
                className={`p-8 rounded-[36px] border transition-all flex flex-col justify-between ${
                  isUnlocked 
                    ? 'bg-zinc-900/60 border-emerald-500/20 shadow-xl shadow-emerald-500/[0.01]' 
                    : 'bg-zinc-900/10 border-white/5 opacity-55'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      isUnlocked 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-zinc-950 border-white/5 text-zinc-500'
                    }`}>
                      {cert.category}
                    </span>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500 font-bold text-xs">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-white tracking-tight">{cert.title}</h4>
                    <span className="text-xs text-zinc-500 block leading-none font-mono tracking-wider">{cert.subtitle}</span>
                    <p className="text-xs text-zinc-400 leading-relaxed pt-2">{cert.description}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none block">Taqdim etilish talabi</span>
                    <span className="text-xs font-semibold text-zinc-300 block">{cert.requirementsText}</span>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <FileText className="w-4 h-4" />
                      Sertifikatni ochish
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kurs yakunlanmagan</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Badge Details Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-white/5 rounded-[40px] max-w-sm w-full p-8 text-center space-y-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-[32px] flex items-center justify-center text-5xl mx-auto shadow-2xl">
                {selectedBadge.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedBadge.name}</h3>
                <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border inline-block ${
                  user.badges.includes(selectedBadge.id)
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                    : 'bg-zinc-950 text-zinc-500 border-white/5'
                }`}>
                  {user.badges.includes(selectedBadge.id) ? "Sizda mavjud" : "Bloklangan"}
                </span>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed">{selectedBadge.desc}</p>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-2xl transition-colors"
              >
                Yopish
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Certificate Print Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-lg flex items-center justify-center p-4 md:p-8 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-[48px] max-w-5xl w-full p-6 md:p-12 relative flex flex-col gap-8 shadow-2xl"
            >
              {/* Top controls (invisible on print) */}
              <div className="flex justify-between items-center print-hidden">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-300">Rasmiy tasdiqlangan sertifikat</span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePrintCertificate}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Chop etish / PDF yuklash
                  </button>
                  <button 
                    onClick={() => setSelectedCert(null)}
                    className="p-2.5 bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Certificate Inner Graphic Sheet */}
              <div 
                id="print-zone"
                className="w-full bg-[#faf9f6] text-zinc-900 border-[16px] border-zinc-800 p-8 md:p-16 rounded-[24px] relative overflow-hidden flex flex-col justify-between aspect-[1.414/1] shadow-xl"
                style={{ fontFamily: '"Inter", sans-serif' }}
              >
                {/* Vintage/Elegant backgrounds/frames */}
                <div className="absolute inset-0 border-4 border-double border-zinc-400 m-2 pointer-events-none" />
                <div className="absolute -top-32 -left-32 w-64 h-64 border-2 border-zinc-200 rounded-full opacity-20 pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-64 h-64 border-2 border-zinc-200 rounded-full opacity-20 pointer-events-none" />

                {/* Header of Certificate */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-white text-base">
                      DE
                    </div>
                    <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-zinc-800">DevEdu Akademiyasi</span>
                  </div>
                  
                  <div className="bg-zinc-900 h-0.5 w-16 mx-auto mb-4" />
                  
                  <span className="text-xs uppercase tracking-[0.358em] font-medium text-zinc-500 block">Kursni Yakunlaganlik To'g'risida</span>
                  <h2 className="text-3xl md:text-5xl font-black text-zinc-900 uppercase tracking-tight italic font-serif leading-none mt-2">
                    MUVAFFFAQIYAT SERTIFIKATI
                  </h2>
                </div>

                {/* Core Certificate Body details */}
                <div className="text-center space-y-4 my-6">
                  <span className="text-xs italic text-zinc-500 block">ushbu sertifikat tantanali ravishda topshiriladi:</span>
                  
                  <div className="py-2">
                    <h3 className="text-2xl md:text-4xl font-extrabold text-zinc-900 uppercase tracking-tight border-b-2 border-zinc-300 w-fit mx-auto px-12 pb-2">
                      {user.displayName}
                    </h3>
                  </div>

                  <p className="max-w-2xl mx-auto text-xs md:text-sm text-zinc-600 leading-relaxed pt-2">
                    {selectedCert.description} Olingan natijalar va topshiriqlarni mustaqil ravishda sandbox rejimida muvaffaqiyatli kodlagani hamda professional ko'nikmalarni namoyish etgani uchun u ushbu sertifikatga loyiq deb topildi.
                  </p>
                </div>

                {/* Signatures & Seal section */}
                <div className="grid grid-cols-3 items-end pt-4 mt-4 border-t border-zinc-200/90 gap-4">
                  
                  {/* Left Signature */}
                  <div className="text-center space-y-1">
                    <div className="h-10 flex items-end justify-center font-serif italic text-zinc-600 text-sm">
                      D. Jonaqiyev
                    </div>
                    <div className="border-t border-zinc-300 pt-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-800 block leading-tight">DevEdu Asoschisi</span>
                      <span className="text-[8px] text-zinc-400 block">DevEdu Academy Uzbek</span>
                    </div>
                  </div>

                  {/* Golden / Premium seal ornament */}
                  <div className="flex justify-center items-center">
                    <div className="relative w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg border-[3px] border-[#d4af37]">
                      <div className="absolute inset-1 border border-dashed border-[#d4af37]/60 rounded-full" />
                      <Trophy className="w-6 h-6 text-[#d4af37]" />
                      
                      {/* Ribbon left */}
                      <div className="absolute -bottom-4 left-2 w-3 h-8 bg-zinc-900 -rotate-12 border-r border-[#d4af37]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }} />
                      {/* Ribbon right */}
                      <div className="absolute -bottom-4 right-2 w-3 h-8 bg-zinc-900 rotate-12 border-l border-[#d4af37]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }} />
                    </div>
                  </div>

                  {/* Verification & Date stamp */}
                  <div className="text-center space-y-1">
                    <div className="text-[10px] font-mono font-bold text-zinc-800">
                      {new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="border-t border-zinc-300 pt-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-800 block leading-tight">Sertifikat ID</span>
                      <span className="text-[8px] font-mono text-zinc-500 block">{getVerificationCode(selectedCert.id)}</span>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {demoBadgeIds.length > 0 && (
          <AchievementUnlockedModal badgeIds={demoBadgeIds} onClose={() => setDemoBadgeIds([])} />
        )}
      </AnimatePresence>
    </div>
  );
}
