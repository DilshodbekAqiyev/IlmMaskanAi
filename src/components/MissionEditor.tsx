import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Mission, World } from '../constants';
import { UserProfile, db, OperationType, handleFirestoreError, calculateLevel } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layout, 
  Code, 
  Eye, 
  Loader2,
  X,
  Plus,
  Trophy,
  Zap,
  Wand2,
  BarChart3,
  Target,
  Video,
  ArrowRight,
  BookOpen,
  Star,
  MessageSquare,
  Award,
  Users,
  Copy,
  Check,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { askMentor, generateBonusChallenge, getTopicExplanation } from '../services/geminiService';
import { checkAndAwardAchievements } from '../services/achievementService';
import AchievementUnlockedModal from './AchievementUnlockedModal';
import { BADGES } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
} from 'recharts';
import * as prettier from 'prettier/standalone';
import * as babel from 'prettier/plugins/babel';
import * as estree from 'prettier/plugins/estree';
import * as html from 'prettier/plugins/html';
import * as postcss from 'prettier/plugins/postcss';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MissionEditorProps {
  mission: Mission;
  world: World;
  user: UserProfile;
  onClose: () => void;
  onComplete: (xp: number) => void;
  onUpdateContext?: (code: string, error: string, selectedCode?: string) => void;
}

export default function MissionEditor({ mission: initialMission, world, user, onClose, onComplete, onUpdateContext }: MissionEditorProps) {
  const editorRef = useRef<any>(null);
  const [mission, setMission] = useState(initialMission);
  const [code, setCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');

  // 👥 Real-time Collaborative Session State
  const [collabSessionId, setCollabSessionId] = useState<string | null>(null);
  const [presenceList, setPresenceList] = useState<any[]>([]);
  const [sessionIdInput, setSessionIdInput] = useState<string>('');
  const [isInitializingSession, setIsInitializingSession] = useState(false);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const isIncomingCollabChange = useRef(false);
  const debouncedWriteRef = useRef<any>(null);

  const handleCopySessionId = () => {
    if (!collabSessionId) return;
    navigator.clipboard.writeText(collabSessionId);
    setCopiedSessionId(true);
    setTimeout(() => setCopiedSessionId(false), 2000);
  };

  // Debounce writing collaborative editor contents to Firestore
  const updateCollabCode = React.useCallback((newCode: string, currentSessionId: string) => {
    if (debouncedWriteRef.current) {
      clearTimeout(debouncedWriteRef.current);
    }

    debouncedWriteRef.current = setTimeout(async () => {
      try {
        const sessionRef = doc(db, 'collab_sessions', currentSessionId);
        await updateDoc(sessionRef, {
          code: newCode,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Failed to write collaborative code:", err);
      }
    }, 500); 
  }, []);

  // Set up heartbeat and listeners for real-time collaboration
  useEffect(() => {
    if (!collabSessionId || !user) return;

    // 1. Listen to Session Document updates
    const sessionRef = doc(db, 'collab_sessions', collabSessionId);
    const unsubscribeSession = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.code !== undefined && data.code !== code) {
          isIncomingCollabChange.current = true;
          setCode(data.code);
          setTimeout(() => {
            isIncomingCollabChange.current = false;
          }, 100);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `collab_sessions/${collabSessionId}`);
    });

    // 2. Listen to Presence subcollection
    const presenceCollectionRef = collection(db, 'collab_sessions', collabSessionId, 'presence');
    const unsubscribePresence = onSnapshot(presenceCollectionRef, (snapshot) => {
      const activeMembers: any[] = [];
      snapshot.forEach((doc) => {
        activeMembers.push(doc.data());
      });
      activeMembers.sort((a, b) => a.userId.localeCompare(b.userId));
      setPresenceList(activeMembers);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `collab_sessions/${collabSessionId}/presence`);
    });

    // 3. Heartbeat presence
    const heartbeatTimer = setInterval(async () => {
      try {
        const presenceRef = doc(db, 'collab_sessions', collabSessionId, 'presence', user.userId);
        await updateDoc(presenceRef, {
          lastActive: serverTimestamp()
        });
      } catch (err) {
        console.warn("Heartbeat update failed:", err);
      }
    }, 20000);

    return () => {
      unsubscribeSession();
      unsubscribePresence();
      clearInterval(heartbeatTimer);
    };
  }, [collabSessionId, user]);

  const handleCreateCollabSession = async () => {
    if (!user) return;
    setIsInitializingSession(true);
    setCollabError(null);

    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeSnippet = '';
    for (let i = 0; i < 6; i++) {
      codeSnippet += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    const sessionId = `${mission.id}-${codeSnippet}`;

    try {
      const sessionRef = doc(db, 'collab_sessions', sessionId);
      await setDoc(sessionRef, {
        id: sessionId,
        missionId: mission.id,
        code: code || mission.templateCode || '',
        creatorId: user.userId,
        creatorName: user.displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const presenceRef = doc(db, 'collab_sessions', sessionId, 'presence', user.userId);
      await setDoc(presenceRef, {
        userId: user.userId,
        displayName: user.displayName,
        photoURL: user.photoURL || '',
        lastActive: serverTimestamp(),
        cursorOffset: 0
      });

      setCollabSessionId(sessionId);
    } catch (err: any) {
      console.error("Collab session creation failed:", err);
      setCollabError("Sessiya yaratib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setIsInitializingSession(false);
    }
  };

  const handleJoinCollabSession = async (targetId: string) => {
    if (!user || !targetId) return;
    setIsInitializingSession(true);
    setCollabError(null);

    const cleanId = targetId.trim();
    try {
      const sessionRef = doc(db, 'collab_sessions', cleanId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        setCollabError("Bunday xona kodi bilan faol sessiya topilmadi.");
        setIsInitializingSession(false);
        return;
      }

      const sessionData = sessionSnap.data();
      if (sessionData.missionId !== mission.id) {
        setCollabError("Ushbu xona boshqa vazifaga tegishli.");
        setIsInitializingSession(false);
        return;
      }

      setCode(sessionData.code || '');

      const presenceRef = doc(db, 'collab_sessions', cleanId, 'presence', user.userId);
      await setDoc(presenceRef, {
        userId: user.userId,
        displayName: user.displayName,
        photoURL: user.photoURL || '',
        lastActive: serverTimestamp(),
        cursorOffset: 0
      });

      setCollabSessionId(cleanId);
    } catch (err: any) {
      console.error("Collab session joining failed:", err);
      setCollabError("Ulanish amalga oshmadi. Kodni qayta tekshiring.");
    } finally {
      setIsInitializingSession(false);
    }
  };

  const handleLeaveCollabSession = async () => {
    if (!user || !collabSessionId) return;
    try {
      const presenceRef = doc(db, 'collab_sessions', collabSessionId, 'presence', user.userId);
      await deleteDoc(presenceRef);
    } catch (err) {
      console.error("Signoff error:", err);
    }
    setCollabSessionId(null);
    setPresenceList([]);
  };

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (debouncedWriteRef.current) {
        clearTimeout(debouncedWriteRef.current);
      }
    };
  }, []);

  const stopTyping = React.useCallback(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setIsTyping(false);
  }, []);

  useEffect(() => {
    const initCode = async () => {
      stopTyping();
      if (mission.type === 'lesson' && mission.templateCode) {
        setIsTyping(true);
        setCode('');
        
        let formattedCode = mission.templateCode;
        try {
          const lang = world.id.includes('js') ? 'javascript' : world.id.includes('css') ? 'css' : 'html';
          formattedCode = await prettier.format(mission.templateCode, {
            parser: lang === 'javascript' ? 'babel' : lang === 'css' ? 'css' : 'html',
            plugins: [babel, estree, html, postcss],
            semi: true,
            singleQuote: true,
            printWidth: 60,
          });
        } catch (err) {
          console.warn('Initial formatting failed:', err);
        }

        let index = 0;
        const fullText = formattedCode;
        
        typingTimerRef.current = setInterval(() => {
          index++;
          const nextText = fullText.slice(0, index);
          setCode(nextText);
          if (index >= fullText.length) {
            stopTyping();
          }
        }, 20);
      } else {
        setCode(mission.templateCode || '');
      }
    };

    // Only auto-type if not collaborative to avoid disrupting dynamic collab sessions
    if (!collabSessionId) {
      initCode();
    }
    return () => stopTyping();
  }, [mission.id, mission.type, mission.templateCode, world.id, stopTyping, collabSessionId]);

  const handleCodeChange = React.useCallback((v: string | undefined) => {
    stopTyping();
    const val = v || '';
    setCode(val);

    if (collabSessionId && !isIncomingCollabChange.current) {
      updateCollabCode(val, collabSessionId);
    }
  }, [stopTyping, collabSessionId, updateCollabCode]);
  const [activeTab, setActiveTab] = useState<'content' | 'editor' | 'preview'>('editor');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ status: 'passed' | 'failed' | null; message: string }>({ status: null, message: '' });
  const [history, setHistory] = useState<{attempt: number, time: string, status: 'passed' | 'failed'}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [isGeneratingBonus, setIsGeneratingBonus] = useState(false);
  const [hasCompletedCurrent, setHasCompletedCurrent] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [topicExplanation, setTopicExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [feedback, setFeedback] = useState<{ difficulty: number | null; clarity: number | null }>({ difficulty: null, clarity: null });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const requirements = React.useMemo(() => {
    if (!mission.testLogic) return [];
    return mission.testLogic.split('&&').map(r => r.trim());
  }, [mission.testLogic]);

  const progress = React.useMemo(() => {
    if (requirements.length === 0) return 0;
    const completedCount = requirements.filter(r => {
      try {
        return new Function("code", `return ${r}`)(code);
      } catch {
        return false;
      }
    }).length;
    return (completedCount / requirements.length) * 100;
  }, [requirements, code]);

  useEffect(() => {
    const fetchExplanation = async () => {
      if (showIntro && !topicExplanation) {
        setIsLoadingExplanation(true);
        try {
          const exp = await getTopicExplanation(mission.title, mission.description);
          setTopicExplanation(exp);
        } catch (err) {
          console.error("Failed to fetch explanation:", err);
        } finally {
          setIsLoadingExplanation(false);
        }
      }
    };
    fetchExplanation();
  }, [showIntro, mission.title, mission.description, topicExplanation]);

  useEffect(() => {
    if (onUpdateContext) {
      onUpdateContext(code, result.status === 'failed' ? result.message : '', selectedCode);
    }
  }, [code, result.status, result.message, selectedCode, onUpdateContext]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Listen for selection changes
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection();
      if (selection) {
        const text = editor.getModel().getValueInRange(selection);
        setSelectedCode(text || '');
      }
    });
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const [newBadges, setNewBadges] = useState<string[]>([]);

  const handleComplete = async () => {
    setShowCelebration(true);
    
    try {
      const userRef = doc(db, "users", user.userId);
      const newXp = user.xp + mission.xpReward;
      const newLevel = calculateLevel(newXp);

      // Check for achievements
      const awarded = await checkAndAwardAchievements(user, mission.id, newLevel);
      setNewBadges(awarded);

      await updateDoc(userRef, {
        xp: newXp,
        level: newLevel,
        completedMissions: arrayUnion(mission.id),
        lastActiveDate: serverTimestamp()
      });

      await addDoc(collection(db, "submissions"), {
        userId: user.userId,
        missionId: mission.id,
        code: code,
        status: "passed",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save submission:", error);
    }
  };

  const handleRunTest = async () => {
    setIsChecking(true);
    setResult({ status: null, message: "Tekshirilmoqda..." });

    try {
      const isPassed = new Function("code", `return ${mission.testLogic}`)(code);
      
      const newAttempt = {
        attempt: history.length + 1,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: isPassed ? 'passed' as const : 'failed' as const
      };
      setHistory(prev => [...prev, newAttempt]);

      if (isPassed) {
        setResult({
          status: "passed",
          message: "Tabriklaymiz! Topshiriq muvaffaqiyatli bajarildi.",
        });
        setHasCompletedCurrent(true);
      } else {
        setResult({
          status: "failed",
          message:
            "Kodda xatolik bor yoki shartlar bajarilmadi. Qaytadan urinib ko'ring.",
        });
      }
    } catch (e) {
      setResult({ status: "failed", message: "Kodda sintaktik xato bor." });
    } finally {
      setIsChecking(false);
    }
  };

  const handleGenerateBonus = async () => {
    setIsGeneratingBonus(true);
    try {
      const bonus = await generateBonusChallenge({ title: mission.title, description: mission.description });
      const newMission: Mission = {
        ...bonus,
        id: `bonus-${Date.now()}`,
        worldId: world.id,
        type: 'lesson',
        order: 999
      };
      setMission(newMission);
      setResult({ status: null, message: '' });
      setHasCompletedCurrent(false);
      setShowCelebration(false);
      setShowIntro(true); // Show intro for the new mission
      setTopicExplanation(null); // Reset explanation
    } catch (error) {
      console.error("Failed to generate bonus challenge:", error);
    } finally {
      setIsGeneratingBonus(false);
    }
  };

  const getAiHint = async () => {
    setIsAiLoading(true);
    const hint = await askMentor("Mengacha maslahat bering (hint). To'liq kodni bermang.", {
      code,
      topic: mission.title,
      selectedCode,
    });
    setAiHint(hint);
    setIsAiLoading(false);
  };

  const handleSubmitFeedback = async () => {
    if (feedback.difficulty === null || feedback.clarity === null) return;
    setIsSubmittingFeedback(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.userId,
        missionId: mission.id,
        difficulty: feedback.difficulty,
        clarity: feedback.clarity,
        createdAt: serverTimestamp(),
      });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Failed to save feedback:", error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Run Test: Cmd/Ctrl + Enter
      if (modifier && e.key === 'Enter') {
        e.preventDefault();
        if (!isChecking && !hasCompletedCurrent) {
          handleRunTest();
        }
      }

      // Format: Cmd/Ctrl + Shift + F
      if (modifier && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        if (activeTab === 'editor' && !hasCompletedCurrent) {
          handleFormat();
        }
      }

      // AI Hint: Cmd/Ctrl + H
      if (modifier && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        if (!isAiLoading && !hasCompletedCurrent) {
          getAiHint();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunTest, handleFormat, getAiHint, isChecking, hasCompletedCurrent, isAiLoading, activeTab]);

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden relative">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-zinc-950 flex items-center justify-center p-6 md:p-12 overflow-y-auto"
          >
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Side: Video */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20">Video Darslik</span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{world.title}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">{mission.title}</h1>
                </div>

                {mission.youtubeId ? (
                  <div className="aspect-video w-full rounded-[40px] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl relative group">
                    <iframe
                      src={`https://www.youtube.com/embed/${mission.youtubeId}?autoplay=0&rel=0`}
                      title={mission.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-[40px] bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 border border-white/5 border-dashed">
                      <Video className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">Video mavjud emas</p>
                  </div>
                )}

                <div className="flex items-center gap-6 p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold">Mukofot</h4>
                    <p className="text-xs text-zinc-500">Ushbu darsni yakunlab <span className="text-emerald-400 font-black">+{mission.xpReward} XP</span> va yangi bilimga ega bo'ling.</p>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Explanation */}
              <div className="space-y-8">
                <div className="bg-zinc-900/50 rounded-[48px] border border-white/5 p-10 space-y-6 min-h-[400px] flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-indigo-500" /> AI Mentor Tushuntirishi
                    </h3>
                    {isLoadingExplanation && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                  </div>

                  <div className="grow overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
                    {topicExplanation ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{topicExplanation}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-4 bg-white/5 rounded w-1/2" />
                        <div className="h-4 bg-white/5 rounded w-2/3" />
                        <div className="h-24 bg-white/5 rounded w-full" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowIntro(false)}
                    className="w-full py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 group"
                  >
                    Amaliyotga o'tish
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-zinc-900/30 rounded-3xl border border-white/5 flex flex-col gap-2">
                     <BookOpen className="w-5 h-5 text-zinc-500" />
                     <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Yo'nalish</span>
                     <span className="text-xs text-white font-bold truncate">{world.title}</span>
                  </div>
                  <div className="p-6 bg-zinc-900/30 rounded-3xl border border-white/5 flex flex-col gap-2">
                     <Target className="w-5 h-5 text-zinc-500" />
                     <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Daraja</span>
                     <span className="text-xs text-white font-bold uppercase">{mission.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Header */}
      <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{world.title}</span>
            <h3 className="text-sm font-bold text-white leading-none">{mission.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/5" role="tablist" aria-label="Ish qurollari">
          <button 
            onClick={() => setActiveTab('editor')}
            role="tab"
            aria-selected={activeTab === 'editor'}
            aria-controls="mission-tab-editor"
            aria-label="Kodni tahrirlash bo'limi"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Code className="w-3.5 h-3.5" /> Kod
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            role="tab"
            aria-selected={activeTab === 'preview'}
            aria-controls="mission-tab-preview"
            aria-label="Natijani ko'rish bo'limi"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Natija
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleFormat}
            disabled={activeTab !== 'editor' || hasCompletedCurrent}
            aria-label="Kodni avtomatik formatlash (Ctrl+Shift+F)"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 border border-white/5 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all disabled:opacity-50"
            title="Kodni formatlash (Ctrl+Shift+F)"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Format</span>
            <kbd className="hidden lg:inline-flex h-4 items-center gap-1 rounded border border-white/10 bg-white/5 px-1 font-mono text-[8px] font-medium text-zinc-500">
              <span className="text-[10px]">⌘</span>F
            </kbd>
          </button>
          <button 
            onClick={getAiHint}
            disabled={isAiLoading || hasCompletedCurrent}
            aria-label="AI Mentordan yordam so'rash (Ctrl+H)"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition-all disabled:opacity-50"
            title="AI Yordam (Ctrl+H)"
          >
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Yordam</span>
            <kbd className="hidden lg:inline-flex h-4 items-center gap-1 rounded border border-indigo-500/10 bg-indigo-500/5 px-1 font-mono text-[8px] font-medium text-indigo-400/50">
              <span className="text-[10px]">⌘</span>H
            </kbd>
          </button>
          <button 
            onClick={handleRunTest}
            disabled={isChecking || hasCompletedCurrent}
            aria-label="Kodni tekshirish (Ctrl+Enter)"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            title="Tekshirish (Ctrl+Enter)"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            <span className="hidden sm:inline">Tekshirish</span>
            <kbd className="hidden lg:inline-flex h-4 items-center gap-1 rounded border border-white/20 bg-white/10 px-1 font-mono text-[8px] font-medium text-white/50">
               <span className="text-[10px]">↵</span>
            </kbd>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-zinc-900 overflow-hidden shrink-0">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn(
            "h-full transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]",
            progress === 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-indigo-500"
          )}
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Instruction Sidebar */}
        <div className="w-1/3 border-r border-white/5 overflow-auto p-8 bg-zinc-950/50 backdrop-blur-sm relative">
          <div className="absolute inset-0 bg-dot-pattern opacity-5 pointer-events-none" />
          <div className="relative z-10 prose prose-invert prose-sm max-w-none">
            
            {/* 👥 Real-time Team Collaboration Panel */}
            {mission.isTeam && (
              <div className="mb-8 p-6 bg-zinc-900/60 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-xl">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-xs tracking-wider">Jamoaviy Kodlash</h4>
                      <p className="text-[10px] text-zinc-500">Real-time hamkorlik rejimi</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[8px] font-extrabold uppercase tracking-widest rounded-md border border-indigo-500/30">
                    Team Mode
                  </span>
                </div>

                {collabError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{collabError}</span>
                  </div>
                )}

                {!collabSessionId ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ushbu vazifani do'stingiz bilan birgalikda, real-time hamkorlikda kod yozib bajarishingiz mumkin.
                    </p>
                    
                    <button
                      onClick={handleCreateCollabSession}
                      disabled={isInitializingSession}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 text-center"
                    >
                      {isInitializingSession ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Sessiya yaratish
                        </>
                      )}
                    </button>

                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-zinc-800" />
                      <span className="flex-shrink mx-4 text-[9px] text-zinc-600 font-extrabold uppercase tracking-widest">Yoki qo'shilish</span>
                      <div className="flex-grow border-t border-zinc-800" />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Masalan: HTML-12-ABCXYZ"
                        value={sessionIdInput}
                        onChange={(e) => setSessionIdInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        onClick={() => handleJoinCollabSession(sessionIdInput)}
                        disabled={isInitializingSession || !sessionIdInput.trim()}
                        className="px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center"
                      >
                        {isInitializingSession ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Kirish"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest leading-none">Sessiya kodi</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-mono font-bold text-white tracking-widest">{collabSessionId}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={handleCopySessionId}
                          className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors border border-white/5 flex items-center justify-center"
                          title="Sessiya kodini nusxalash"
                        >
                          {copiedSessionId ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={handleLeaveCollabSession}
                          className="p-2.5 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-450 rounded-xl transition-colors border border-white/5 flex items-center justify-center"
                          title="Sessiyani tark etish"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Guruh a'zolari ({presenceList.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {presenceList.map((member) => (
                          <div 
                            key={member.userId}
                            className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 pl-1.5 pr-3 py-1.5 rounded-full transition-all hover:scale-102"
                          >
                            <div className="relative">
                              {member.photoURL ? (
                                <img 
                                  src={member.photoURL} 
                                  alt={member.displayName} 
                                  className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/30"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-black text-[10px] text-white">
                                  {member.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-950" />
                            </div>
                            <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[100px]">{member.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight italic decoration-indigo-500 underline underline-offset-4">Vazifa</h2>
            <div className="text-zinc-400 leading-relaxed text-sm space-y-4">
              <ReactMarkdown>{mission.description}</ReactMarkdown>
            </div>
            
            <div className="mt-10 p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 ring-1 ring-white/5">
              <h4 className="flex items-center gap-2 text-indigo-400 font-bold mb-3 uppercase text-[10px] tracking-widest">
                <AlertCircle className="w-4 h-4" /> Ko'rsatma
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed italic">
                O'ng tarafdagi tahrirlagichga kerakli kodni kiriting va mantiqiy shartlarni bajaring. Xatolik yuz bersa, AI Mentorimiz sizga to'g'ri yo'lni ko'rsatadi.
              </p>
            </div>

            {aiHint && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-5 bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[10px] tracking-widest">
                    <Sparkles className="w-4 h-4" /> AI Maslahati
                  </h4>
                  <button onClick={() => setAiHint(null)} className="text-zinc-600 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-zinc-300 text-xs leading-relaxed markdown-hint font-medium">
                  <ReactMarkdown>{aiHint}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col bg-[#09090b] relative">
          {isTyping && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 backdrop-blur-md animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Mentor yozmoqda...</span>
            </div>
          )}
          {activeTab === 'editor' ? (
            <Editor
              height="100%"
              defaultLanguage={world.id.includes('js') ? 'javascript' : world.id.includes('css') ? 'css' : 'html'}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 15,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: hasCompletedCurrent,
                cursorStyle: 'line',
                automaticLayout: true,
                padding: { top: 30, bottom: 30 },
                minimap: { enabled: false },
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.5
              }}
            />
          ) : (
            <div className="h-full bg-white flex flex-col">
              <div className="h-10 bg-zinc-100 border-b border-zinc-200 px-4 flex items-center gap-2 shrink-0">
                <div className="flex gap-1.5 grayscale opacity-50">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 grow text-center">Natijani ko'rish</span>
              </div>
              <iframe
                srcDoc={world.id.includes('js') ? `<script>${code}</script>` : (world.id.includes('css') ? `<html><head><style>${code}</style></head><body><h1>Natija</h1></body></html>` : code)}
                className="w-full grow border-none"
                title="preview"
              />
            </div>
          )}

          {/* Test Result Overlay */}
          <AnimatePresence mode="wait">
            {result.status && (
              <motion.div
                key={result.status}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={cn(
                  "absolute bottom-10 left-1/2 -translate-x-1/2 min-w-[500px] p-8 rounded-[40px] border flex flex-col gap-6 shadow-[0_40px_80px_rgba(0,0,0,0.6)] z-50 backdrop-blur-2xl",
                  result.status === 'passed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-red-500/10 border-red-500/20 text-red-100"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border",
                    result.status === 'passed' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-red-500/20 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  )}>
                    {result.status === 'passed' ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                  </div>
                  <div className="grow space-y-1">
                    <h4 className="font-black text-xl tracking-tight leading-none italic">{result.status === 'passed' ? 'MUVAFFAQIYAT!' : 'XATOLIK!'}</h4>
                    <p className="text-xs opacity-70 leading-relaxed font-medium">{result.message}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {result.status === 'passed' ? (
                      <button 
                        onClick={handleComplete}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
                      >
                         Tamomlash
                      </button>
                    ) : (
                      <button onClick={() => setResult({ status: null, message: '' })} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                        <ChevronLeft className="rotate-180 w-6 h-6 text-zinc-500" />
                      </button>
                    )}
                  </div>
                </div>

                {result.status === 'passed' && (
                  <div className="pt-6 border-t border-white/10">
                    <button
                      onClick={handleGenerateBonus}
                      disabled={isGeneratingBonus}
                      className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isGeneratingBonus ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Bonus Challenge Yarating (AI)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 backdrop-blur-3xl overflow-y-auto"
              >
                <div className="container max-w-4xl mx-auto py-12 px-6">
                  <div className="flex flex-col items-center text-center space-y-12">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, stiffness: 100 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 blur-[100px] bg-indigo-500/40 animate-pulse" />
                      <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[40px] flex items-center justify-center shadow-2xl border-2 border-white/20">
                        <Trophy className="w-16 h-16 text-white" />
                      </div>
                    </motion.div>

                    <div className="space-y-4">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-black text-white tracking-tighter italic uppercase"
                      >
                        Missiya <span className="text-indigo-400">Yakunlandi!</span>
                      </motion.div>

                      {newBadges.length > 0 && (
                        <div className="flex flex-col items-center gap-4 mt-8">
                          <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Yangi yutuqlar qo'lga kiritildi!</p>
                          <div className="flex gap-4">
                            {newBadges.map(badgeId => {
                              const badge = BADGES.find(b => b.id === badgeId);
                              return (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  key={badgeId}
                                  className="flex flex-col items-center gap-2 p-4 bg-zinc-900 border border-indigo-500/30 rounded-3xl"
                                >
                                  <span className="text-4xl">{badge?.icon}</span>
                                  <span className="text-[10px] font-bold text-white uppercase">{badge?.name}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-zinc-500 font-medium max-w-md mx-auto">Siz topshiriqni muvaffaqiyatli bajardingiz. Mana sizning natijalaringiz:</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                      {/* XP Card */}
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center gap-3"
                      >
                        <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                        <div>
                          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block">XP To'plandi</span>
                          <span className="text-4xl font-black text-white">+{mission.xpReward}</span>
                        </div>
                      </motion.div>

                      {/* Correctness Chart Card */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="md:col-span-2 bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 flex flex-col gap-4 overflow-hidden h-[240px]"
                      >
                        <div className="flex items-center justify-between px-2">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Target className="w-3 h-3 text-indigo-400" /> Urinishlar tarixi
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-400">{history.length} ta urinish</span>
                        </div>
                        
                        <div className="grow w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history}>
                              <XAxis dataKey="attempt" hide />
                              <YAxis hide domain={[0, 1]} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl text-[10px] font-bold">
                                        <p className="text-zinc-400 mb-1">Urinish #{data.attempt}</p>
                                        <p className={data.status === 'passed' ? "text-emerald-400" : "text-red-400"}>
                                          {data.status === 'passed' ? 'Muvaffaqiyatli' : 'Xatolik'}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey={(d: any) => d.status === 'passed' ? 1 : 0.4} radius={[4, 4, 0, 0]}>
                                {history.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.status === 'passed' ? '#10b981' : '#ef4444'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {/* Skill Breakdown */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 flex flex-col gap-6"
                      >
                         <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <BarChart3 className="w-3 h-3 text-emerald-400" /> Ko'nikmalar o'sishi
                          </h4>
                          <div className="space-y-4">
                            {[
                              { label: 'Kod mantiqi', value: 95 },
                              { label: 'Sintaksis', value: history.length > 3 ? 70 : 90 },
                              { label: 'Muammo yechish', value: 85 }
                            ].map((skill, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
                                  <span>{skill.label}</span>
                                  <span>{skill.value}%</span>
                                </div>
                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.value}%` }}
                                    transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                                    className="h-full bg-indigo-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                      </motion.div>

                      {/* Performance Insight or Feedback */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-indigo-500/5 p-8 rounded-[32px] border border-indigo-500/10 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden"
                      >
                         {!feedbackSubmitted ? (
                           <div className="w-full space-y-6">
                             <div className="space-y-1">
                               <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                 <MessageSquare className="w-4 h-4" /> Fikringiz muhim
                               </h4>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Darsni baholang</p>
                             </div>

                             <div className="space-y-4">
                               <div className="space-y-2">
                                 <p className="text-[10px] text-zinc-400 font-bold uppercase text-left pl-2">Qiyinchilik darajasi</p>
                                 <div className="flex justify-between gap-2">
                                   {[1, 2, 3, 4, 5].map((val) => (
                                     <button
                                       key={val}
                                       onClick={() => setFeedback(prev => ({ ...prev, difficulty: val }))}
                                       className={cn(
                                         "w-10 h-10 rounded-xl border transition-all flex items-center justify-center text-xs font-bold",
                                         feedback.difficulty === val 
                                           ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" 
                                           : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20"
                                       )}
                                     >
                                       {val}
                                     </button>
                                   ))}
                                 </div>
                               </div>

                               <div className="space-y-2">
                                 <p className="text-[10px] text-zinc-400 font-bold uppercase text-left pl-2">Tushunarlilik</p>
                                 <div className="flex justify-between gap-2">
                                   {[1, 2, 3, 4, 5].map((val) => (
                                     <button
                                       key={val}
                                       onClick={() => setFeedback(prev => ({ ...prev, clarity: val }))}
                                       className={cn(
                                         "w-10 h-10 rounded-xl border transition-all flex items-center justify-center text-xs",
                                         feedback.clarity === val 
                                           ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                                           : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/20"
                                       )}
                                      >
                                       <Star className={cn("w-4 h-4", feedback.clarity === val ? "fill-white" : "")} />
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             </div>

                             <button
                               onClick={handleSubmitFeedback}
                               disabled={isSubmittingFeedback || feedback.difficulty === null || feedback.clarity === null}
                               className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
                             >
                               {isSubmittingFeedback ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Yuborish"}
                             </button>
                           </div>
                         ) : (
                           <motion.div 
                             initial={{ scale: 0.9, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             className="space-y-4"
                           >
                             <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                               <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                             </div>
                             <h4 className="text-white font-black uppercase italic tracking-widest">Rahmat!</h4>
                             <p className="text-xs text-zinc-400 max-w-[200px] mx-auto font-medium">Sizning fikringiz biz uchun juda muhim va darslarni yaxshilashga yordam beradi.</p>
                           </motion.div>
                         )}
                      </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full items-center justify-center">
                      <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        onClick={() => onComplete(mission.xpReward)}
                        className="group relative px-12 py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl active:scale-95 w-full md:w-auto"
                      >
                        <div className="absolute inset-0 bg-indigo-500 rounded-[24px] blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
                        Keyingi darsga o'tish
                      </motion.button>

                      <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={handleGenerateBonus}
                        disabled={isGeneratingBonus}
                        className="group relative px-12 py-5 bg-zinc-900 text-white border border-white/5 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl active:scale-95 disabled:opacity-50 w-full md:w-auto"
                      >
                        {isGeneratingBonus ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          <div className="flex items-center gap-3 justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Bonus Challenge (AI)
                          </div>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {newBadges.length > 0 && (
          <AchievementUnlockedModal badgeIds={newBadges} onClose={() => setNewBadges([])} />
        )}
      </AnimatePresence>
    </div>
  );
}
