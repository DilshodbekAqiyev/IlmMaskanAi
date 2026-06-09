import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Award, Zap, Sparkles, X, Share2, ArrowRight } from 'lucide-react';
import { BADGES } from '../constants';

interface AchievementUnlockedModalProps {
  badgeIds: string[];
  onClose: () => void;
}

export default function AchievementUnlockedModal({ badgeIds, onClose }: AchievementUnlockedModalProps) {
  useEffect(() => {
    if (badgeIds.length === 0) return;

    // Play a happy synthetic celebration sound using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0.15, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };

      // Nice arpeggio chord chime for achievements
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.4, 'sine'); // C5
      playTone(659.25, now + 0.1, 0.4, 'sine'); // E5
      playTone(783.99, now + 0.2, 0.4, 'sine'); // G5
      playTone(1046.50, now + 0.3, 0.8, 'triangle'); // C6
    } catch (e) {
      console.warn("AudioContext failed to play:", e);
    }

    // Launch beautiful multiple bursts of confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [badgeIds]);

  if (badgeIds.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
        {/* Animated background stars/dots decoration */}
        <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative max-w-lg w-full bg-zinc-900 border-2 border-indigo-500/30 rounded-[40px] p-8 md:p-12 text-center shadow-2xl shadow-indigo-500/10 overflow-hidden"
        >
          {/* Top light rays decoration */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6">
            <div className="flex justify-center">
              <motion.div 
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2, stiffness: 100 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-125" />
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl shadow-2xl relative border border-indigo-400">
                  <span className="animate-pulse">🏆</span>
                </div>
              </motion.div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-indigo-500/20 inline-flex items-center gap-1.5 leading-none">
                <Sparkles className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                Yangi Muvaffaqiyat!
              </span>

              <h2 className="text-3xl font-black text-white tracking-tight uppercase italic leading-none pt-2">
                Tabriklaymiz!
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm max-w-sm mx-auto pt-1 font-medium">
                Dasturlashda yangi cho'qqini zabt etdingiz va maxsus unvonga ega bo'ldingiz!
              </p>
            </div>

            {/* Badges container inside the modal */}
            <div className="space-y-3 py-4 max-h-[220px] overflow-auto">
              {badgeIds.map((badgeId, index) => {
                const badge = BADGES.find(b => b.id === badgeId);
                if (!badge) return null;

                return (
                  <motion.div
                    key={badgeId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                    className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-left hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-105 transition-all">
                      {badge.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{badge.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{badge.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Buttons / Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 group cursor-pointer"
              >
                O'rganishda davom etish
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  alert("Muvaffaqiyat sahifasi havolasi nusxalandi!");
                }}
                className="py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-extrabold uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                Ulashish
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
