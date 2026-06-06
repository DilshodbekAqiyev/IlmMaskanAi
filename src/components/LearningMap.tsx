import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { World, Mission } from '../constants';
import { UserProfile } from '../lib/firebase';
import { ChevronRight, Lock, CheckCircle2, Star, Zap, Filter } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LearningMapProps {
  worlds: World[];
  user: UserProfile;
  onStartMission: (mission: Mission, world: World) => void;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function LearningMap({ worlds, user, onStartMission }: LearningMapProps) {
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-16 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 text-center md:text-left">
          <h1 className="text-5xl font-black text-white tracking-tight uppercase italic decoration-indigo-500 underline underline-offset-8">O'quv Xaritasi</h1>
          <p className="text-zinc-500 text-lg font-medium">Bilimlar dunyosi bo'ylab kashfiyotlarni boshlang!</p>
        </div>

        {/* Difficulty Filter */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 flex items-center gap-1" role="group" aria-label="Qiyinchilik darajasi bo'yicha filtrlash">
          {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              aria-label={`${level === 'all' ? 'Barcha' : level === 'easy' ? 'Oson' : level === 'medium' ? 'O\'rta' : 'Qiyin'} darajadagi darslarni ko'rsatish`}
              aria-pressed={filter === level}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                filter === level 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {level === 'all' ? 'Barchasi' : level === 'easy' ? 'Oson' : level === 'medium' ? 'O\'rta' : 'Qiyin'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-24">
        {worlds.map((world, worldIdx) => {
          const completedMissions = user.completedMissions || [];
          const isWorldLocked = worldIdx > 0 && !completedMissions.some(mId => 
            worlds[worldIdx-1].missions.some(m => m.id === mId)
          ) && user.xp < (worldIdx * 500);

          const filteredMissions = world.missions.filter(m => filter === 'all' || m.difficulty === filter);

          if (filteredMissions.length === 0 && filter !== 'all') return null;

          return (
            <div key={world.id} className="relative">
              {/* World Header */}
              <div className={cn(
                "flex items-center gap-8 mb-10 transition-all",
                isWorldLocked ? "opacity-30 grayscale" : "opacity-100"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl bg-gradient-to-br border-4 border-white/5",
                  world.color
                )}>
                  {isWorldLocked ? <Lock className="text-white w-9 h-9" /> : <Star className="text-white w-9 h-9 fill-white" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-white tracking-tight">{world.title}</h3>
                  <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{world.description}</p>
                </div>
              </div>

              {/* Missions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                {/* Horizontal Path line - only for desktop */}
                <svg className="absolute top-1/2 left-0 w-full h-px -z-10 pointer-events-none opacity-20 hidden lg:block">
                   <line x1="0" y1="0" x2="100%" y2="0" stroke="white" strokeWidth="2" strokeDasharray="8 8" />
                </svg>
                
                {filteredMissions.length > 0 ? (
                  filteredMissions.map((mission, mIdx) => {
                    const isCompleted = completedMissions.includes(mission.id);
                    const isPrevCompleted = mIdx === 0 || completedMissions.includes(world.missions[mIdx-1].id);
                    const isLocked = isWorldLocked || !isPrevCompleted;

                    return (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: mIdx * 0.1 }}
                      >
                        <button
                          disabled={isLocked}
                          onClick={() => !isLocked && onStartMission(mission, world)}
                          aria-label={`${mission.title}. ${mission.difficulty === 'easy' ? 'Oson' : mission.difficulty === 'medium' ? 'O\'rta' : 'Qiyin'} daraja. ${isCompleted ? 'Bajarilgan' : isLocked ? 'Qulflangan' : 'Bajarish mumkin'}`}
                          className={cn(
                            "relative w-full h-full bg-zinc-900 p-7 rounded-[32px] border-2 transition-all text-left flex flex-col justify-between gap-6 group",
                            isCompleted ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]" : 
                            isLocked ? "border-white/5 bg-zinc-950 opacity-40 cursor-not-allowed" : 
                            "border-white/10 hover:border-indigo-500 hover:shadow-[0_0_40px_rgba(79,70,229,0.15)] bg-zinc-900/50"
                          )}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.2em]",
                                isCompleted ? "text-emerald-500" : "text-zinc-500"
                              )}>
                                {mission.difficulty === 'easy' ? 'Oson' : mission.difficulty === 'medium' ? 'O\'rta' : 'Qiyin'}
                              </span>
                              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                                Dars {mIdx + 1}
                              </span>
                            </div>
                            {isCompleted ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </div>
                            ) : isLocked ? (
                              <Lock className="w-5 h-5 text-zinc-700" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className={cn(
                              "text-lg font-bold tracking-tight transition-colors",
                              isLocked ? "text-zinc-600" : "text-white group-hover:text-indigo-400"
                            )}>
                              {mission.title}
                            </h4>
                            <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                              {mission.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-indigo-400">
                              <Zap className="w-4 h-4 fill-indigo-400" />
                              <span className="text-xs font-mono font-bold tracking-widest">{mission.xpReward} XP</span>
                            </div>
                            {!isLocked && !isCompleted && (
                               <div className="px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 group-hover:bg-indigo-500 transition-colors">
                                 Boshlash <ChevronRight className="w-3 h-3" />
                               </div>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-zinc-900/30 p-10 rounded-[32px] border-2 border-dashed border-white/5 text-zinc-600 italic text-center font-medium">
                    Tanlangan daraja bo'yicha darslar topilmadi...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
