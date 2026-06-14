import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { db, UserProfile, calculateLevel } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Clock, Zap, FileCode, CheckCircle2, AlertCircle, Play, Sparkles, RefreshCw, Trophy, BookOpen } from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface DailyChallengeTask {
  id: string;
  title: string;
  category: 'JavaScript' | 'CSS' | 'HTML';
  difficulty: 'Oson' | 'O\'rtacha' | 'Qiyin';
  bonusXp: number;
  description: string;
  instructions: string[];
  starterCode: string;
  testCases: { input: any; expected: any; description: string }[];
  verifyType: 'js-eval' | 'regex';
  verifyDetails: {
    functionName?: string;
    regexPatterns?: string[];
  };
}

const CHALLENGES: DailyChallengeTask[] = [
  {
    id: 'challenge-fizzbuzz',
    title: 'FizzBuzz Algoritmi',
    category: 'JavaScript',
    difficulty: 'O\'rtacha',
    bonusXp: 300,
    description: 'Dasturlash suhbatlaridagi eng mashhur savol! Berilgan son uchun FizzBuzz qiymatini hisoblang.',
    instructions: [
      'fizzBuzz(num) funksiyasini yozing.',
      'Agar num 3 ga bo\'linsa, "Fizz" qaytarsin.',
      'Agar num 5 ga bo\'linsa, "Buzz" qaytarsin.',
      'Agar 3 ga ham, 5 ga ham bo\'linsa, "FizzBuzz" qaytarsin.',
      'Aks holda, sonning o\'zini (ya\'ni n) qaytarsin.'
    ],
    starterCode: `function fizzBuzz(num) {\n  // Kodni shu yerga yozing\n  \n}`,
    testCases: [
      { input: [3], expected: 'Fizz', description: 'fizzBuzz(3) -> "Fizz"' },
      { input: [5], expected: 'Buzz', description: 'fizzBuzz(5) -> "Buzz"' },
      { input: [15], expected: 'FizzBuzz', description: 'fizzBuzz(15) -> "FizzBuzz"' },
      { input: [7], expected: 7, description: 'fizzBuzz(7) -> 7' }
    ],
    verifyType: 'js-eval',
    verifyDetails: { functionName: 'fizzBuzz' }
  },
  {
    id: 'challenge-factorial',
    title: 'Faktorialni Hisoblash',
    category: 'JavaScript',
    difficulty: 'Oson',
    bonusXp: 300,
    description: 'Faktorial matematik amalini hisoblovchi funksiya yozing (n! == n * (n-1) * ... * 1).',
    instructions: [
      'factorial(n) funksiyasini yozing.',
      'n sonining faktorialini hisoblang va qaytaring.',
      'Kiritilgan n har doim musbat butun son yoki 0 bo\'ladi.'
    ],
    starterCode: `function factorial(n) {\n  // Kodni shu yerga yozing\n  \n}`,
    testCases: [
      { input: [0], expected: 1, description: 'factorial(0) -> 1' },
      { input: [1], expected: 1, description: 'factorial(1) -> 1' },
      { input: [5], expected: 120, description: 'factorial(5) -> 120' },
      { input: [6], expected: 720, description: 'factorial(6) -> 720' }
    ],
    verifyType: 'js-eval',
    verifyDetails: { functionName: 'factorial' }
  },
  {
    id: 'challenge-evensquares',
    title: 'Juft Sonlar Kvadratlari',
    category: 'JavaScript',
    difficulty: 'O\'rtacha',
    bonusXp: 300,
    description: 'Array metodlaridan foydalangan holda massiv ichidagi faqat juft sonlarning kvadratlarini qaytaring.',
    instructions: [
      'getEvenSquares(arr) funksiyasini yozing (arr - sonlardan tashkil topgan massiv).',
      'Massiv ichidagi faqat juft sonlarni ajratib oling.',
      'Har bir juft sonning kvadratini hisoblang va yangi massivda qaytaring (e.g. [2, 4] -> [4, 16]).'
    ],
    starterCode: `function getEvenSquares(arr) {\n  // Kodni shu yerga yozing\n  \n}`,
    testCases: [
      { input: [[1, 2, 3, 4, 5]], expected: [4, 16], description: 'getEvenSquares([1, 2, 3, 4, 5]) -> [4, 16]' },
      { input: [[10, 15, 20]], expected: [100, 400], description: 'getEvenSquares([10, 15, 20]) -> [100, 400]' },
      { input: [[]], expected: [], description: 'getEvenSquares([]) -> []' }
    ],
    verifyType: 'js-eval',
    verifyDetails: { functionName: 'getEvenSquares' }
  },
  {
    id: 'challenge-flexcenter',
    title: 'CSS Flexbox bilan elementni markazlashtirish',
    category: 'CSS',
    difficulty: 'Oson',
    bonusXp: 300,
    description: 'Flexbox texnologiyasidan foydalanib elementlarni gorizontal va vertikal markazlashtirish qoidalarini yozing.',
    instructions: [
      '.container elementiga flexbox qoidalarini belgilang.',
      'Elementlarni gorizontaliga va vertikaliga o\'rtaga tushiruvchi qoidalarni yozing.'
    ],
    starterCode: `.container {\n  display: flex;\n  /* Quyidagi qatorlarni to'ldiring */\n  \n}`,
    testCases: [
      { input: null, expected: true, description: '"justify-content: center" mavjudligi' },
      { input: null, expected: true, description: '"align-items: center" mavjudligi' }
    ],
    verifyType: 'regex',
    verifyDetails: {
      regexPatterns: [
        'justify-content\\s*:\\s*center',
        'align-items\\s*:\\s*center'
      ]
    }
  },
  {
    id: 'challenge-prime',
    title: 'Tub Sonlarni Haqiqiylikka Tekshirish',
    category: 'JavaScript',
    difficulty: 'Qiyin',
    bonusXp: 300,
    description: 'Berilgan n soni tub son (prime number) ekanligini osongina tekshiruvchi funksiya yarating.',
    instructions: [
      'isPrime(n) funksiyasini yozing.',
      'Musbat son n tub bo\'lsa true, aks holda false qaytaring.',
      'Eslatma: 1 tub son emas. Tub sonlar faqat 1 ga va o\'ziga bo\'linadigan 1 dan katta sonlardir.'
    ],
    starterCode: `function isPrime(n) {\n  // Kodni shu yerga yozing\n  \n}`,
    testCases: [
      { input: [1], expected: false, description: 'isPrime(1) -> false' },
      { input: [2], expected: true, description: 'isPrime(2) -> true' },
      { input: [11], expected: true, description: 'isPrime(11) -> true' },
      { input: [15], expected: false, description: 'isPrime(15) -> false' },
      { input: [17], expected: true, description: 'isPrime(17) -> true' }
    ],
    verifyType: 'js-eval',
    verifyDetails: { functionName: 'isPrime' }
  },
  {
    id: 'challenge-longestword',
    title: 'Eng Uzun So\'zni Topish',
    category: 'JavaScript',
    difficulty: 'O\'rtacha',
    bonusXp: 300,
    description: 'Matn ichidagi eng uzun so\'zni qaytaruvchi algoritm yozing.',
    instructions: [
      'findLongestWord(sentence) funksiyasini yozing.',
      'sentence matnidagi so\'zlar orasidan eng birinchi kelgan eng uzun so\'zning o\'zini qaytaring.',
      'Bo\'sh matn berilgan holda bo\'sh satr "" qaytsin.'
    ],
    starterCode: `function findLongestWord(sentence) {\n  // Kodni shu yerga yozing\n  \n}`,
    testCases: [
      { input: ["Men dasturlashni juda sevaman"], expected: "dasturlashni", description: 'findLongestWord("Men dasturlashni...") -> "dasturlashni"' },
      { input: ["IlmMaskan eng zo'r"], expected: "IlmMaskan", description: 'findLongestWord("IlmMaskan eng zo\'r") -> "IlmMaskan"' },
      { input: [""], expected: "", description: 'findLongestWord("") -> ""' }
    ],
    verifyType: 'js-eval',
    verifyDetails: { functionName: 'findLongestWord' }
  }
];

function stringHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

interface DailyChallengeProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  theme?: 'light' | 'dark';
}

export default function DailyChallenge({ user, onUpdateProfile, theme = 'dark' }: DailyChallengeProps) {
  // Deterministic challenge selector based on today's date
  const todayStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'numeric', day: 'numeric' });
  const challengeIndex = Math.abs(stringHashCode(todayStr)) % CHALLENGES.length;
  const challenge = CHALLENGES[challengeIndex];
  const challengeUniqueId = `daily-challenge-${todayStr.replace(/\//g, '-')}-${challenge.id}`;

  const isCompleted = user.completedMissions?.includes(challengeUniqueId);

  const [code, setCode] = useState(challenge.starterCode);
  const [timeLeft, setTimeLeft] = useState('');
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [errorLogs, setErrorLogs] = useState<string | null>(null);
  const [successAward, setSuccessAward] = useState(false);

  // Countdown timer to midnight
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = nextMidnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update starter code when challenge rotates
  useEffect(() => {
    setCode(challenge.starterCode);
    setTestResults([]);
    setErrorLogs(null);
  }, [challenge]);

  const handleRunTests = async () => {
    setRunning(true);
    setErrorLogs(null);
    const results: { passed: boolean; message: string }[] = [];

    // Let minor rendering complete
    await new Promise((r) => setTimeout(r, 600));

    try {
      if (challenge.verifyType === 'js-eval') {
        const functionName = challenge.verifyDetails.functionName;
        if (!functionName) throw new Error("Vazifani tekshirish elementi noto'g'ri sozlangan.");

        // Safe evaluation scope
        const cleanCode = code + `\nreturn ${functionName};`;
        const evaluatedFunction = new Function(cleanCode)();

        if (typeof evaluatedFunction !== 'function') {
          throw new Error(`Kodingizda "${functionName}" nomli funksiya aniqlanmadi.`);
        }

        for (const test of challenge.testCases) {
          try {
            // deep clone inputs
            const inputArgs = JSON.parse(JSON.stringify(test.input));
            const result = evaluatedFunction(...inputArgs);

            // Compare arrays or primitives simple deep match
            const matches = JSON.stringify(result) === JSON.stringify(test.expected);

            results.push({
              passed: matches,
              message: `${test.description} | Natija: ${JSON.stringify(result)} -> ${matches ? 'Muvaffaqiyatli ✅' : 'Xato ❌'}`
            });
          } catch (itemErr: any) {
            results.push({
              passed: false,
              message: `${test.description} | Xatolik: ${itemErr.message}`
            });
          }
        }
      } else if (challenge.verifyType === 'regex') {
        // Validation patterns list
        const patterns = challenge.verifyDetails.regexPatterns || [];
        for (let i = 0; i < patterns.length; i++) {
          const reg = new RegExp(patterns[i], 'i');
          const testCase = challenge.testCases[i];
          const match = reg.test(code);

          results.push({
            passed: match,
            message: `${testCase?.description || 'Qoida ' + (i + 1)} -> ${match ? 'Topildi ✅' : 'Kiritilmagan ❌'}`
          });
        }
      }

      setTestResults(results);

      // Analyze if everything passed
      const allPassed = results.length > 0 && results.every((r) => r.passed);
      if (allPassed) {
        // Complete Challenge
        await handleSaveSuccess();
      }
    } catch (err: any) {
      setErrorLogs(err.message || 'Kodni kompilyatsiya qilishda xatolik yuz berdi.');
    } finally {
      setRunning(false);
    }
  };

  const handleSaveSuccess = async () => {
    try {
      setSuccessAward(true);
      const userRef = doc(db, 'users', user.userId);
      const addedXp = challenge.bonusXp;
      const newXp = user.xp + addedXp;
      const newLevel = calculateLevel(newXp);
      const updatedMissions = [...(user.completedMissions || []), challengeUniqueId];

      await updateDoc(userRef, {
        xp: newXp,
        level: newLevel,
        completedMissions: updatedMissions,
        lastActiveDate: serverTimestamp()
      });

      onUpdateProfile({
        xp: newXp,
        level: newLevel,
        completedMissions: updatedMissions
      });
    } catch (dbErr: any) {
      console.error("Daily challenge update failed:", dbErr);
    }
  };

  const handleReset = () => {
    if (window.confirm("Kodingizni boshlang'ich holatga qaytarmoqchimisiz?")) {
      setCode(challenge.starterCode);
      setTestResults([]);
      setErrorLogs(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 select-none">
      {/* Upper header */}
      <div className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[32px] border shadow-xl transition-all duration-300",
        theme === 'light' ? "bg-white border-zinc-200 shadow-zinc-200/50" : "bg-zinc-900/40 border-white/5 shadow-xl"
      )}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
              theme === 'light' ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            )}>
              Kundalik Vazifa
            </span>
            <span className={cn(
              "flex items-center gap-1.5 font-bold text-xs px-3 py-1 rounded-full border",
              theme === 'light' ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-orange-500/10 border-orange-500/20 text-orange-500"
            )}>
              <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500 border-none" />
              +{challenge.bonusXp} XP bonus
            </span>
          </div>
          <h1 className={cn(
            "text-4xl font-extrabold tracking-tight uppercase italic decoration-indigo-500",
            theme === 'light' ? "text-zinc-900" : "text-white"
          )}>
            {challenge.title}
          </h1>
          <p className={cn("text-xs md:text-sm font-medium", theme === 'light' ? "text-zinc-650" : "text-zinc-500")}>
            {challenge.description}
          </p>
        </div>

        <div className={cn(
          "p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300",
          theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-white/5"
        )}>
          <Clock className="w-8 h-8 text-indigo-500 animate-pulse" />
          <div className="flex flex-col">
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", theme === 'light' ? "text-zinc-400" : "text-zinc-500")}>
              Navbatdagiga vaqt:
            </span>
            <span className={cn(
              "font-mono text-2xl font-black tracking-tighter tabular-nums",
              theme === 'light' ? "text-indigo-650" : "text-indigo-400"
            )}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "p-12 rounded-[40px] shadow-2xl text-center space-y-8 relative overflow-hidden border transition-colors duration-300",
              theme === 'light' ? "bg-emerald-55/70 bg-emerald-50 border-emerald-500/20 shadow-emerald-100" : "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-950/20"
            )}
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-28 h-28 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </motion.div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className={cn("text-3xl font-black uppercase italic tracking-tight", theme === 'light' ? "text-zinc-950" : "text-white")}>
                Vazifa Bajarildi!
              </h2>
              <p className={cn("text-base", theme === 'light' ? "text-zinc-650" : "text-zinc-400")}>
                Bugungi eng o'ta muhim loyihani a'lo darajada tamomladingiz. Bonus <strong className="text-indigo-600 dark:text-indigo-400">+{challenge.bonusXp} XP</strong> sizning hisobingizga muvaffaqiyatli o'tkazildi!
              </p>
            </div>

            <div className={cn(
              "inline-flex items-center gap-6 px-8 py-4 rounded-2xl border text-xs font-medium transition-all duration-300",
              theme === 'light' ? "bg-zinc-100/80 border-zinc-200 text-zinc-650" : "bg-zinc-950/60 border-white/5 text-zinc-400"
            )}>
              <span>Yangi vazifa ertaga yana shu vaqtda yaratiladi.</span>
              <div className={cn("h-4 w-px", theme === 'light' ? "bg-zinc-200" : "bg-white/10")} />
              <span className={cn("font-mono font-bold", theme === 'light' ? "text-indigo-600" : "text-indigo-400")}>Countdown: {timeLeft}</span>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Guide details column */}
            <div className="lg:col-span-5 space-y-6">
              <div className={cn(
                "p-8 rounded-[32px] border space-y-6 transition-colors duration-300",
                theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-900/30 border-white/5"
              )}>
                <div className={cn(
                  "flex items-center gap-3 border-b pb-4",
                  theme === 'light' ? "border-zinc-100" : "border-white/5"
                )}>
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  <h3 className={cn("text-lg font-bold uppercase tracking-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>
                    Konditsiya va Qoidalar
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-xl border flex justify-between text-xs font-semibold transition-all duration-300",
                    theme === 'light' ? "bg-zinc-50 border-zinc-200 text-zinc-650" : "bg-zinc-950/40 border-white/5 text-slate-200"
                  )}>
                    <span className="text-zinc-500">Mavzu turi:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{challenge.category}</span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-xl border flex justify-between text-xs font-semibold transition-all duration-300",
                    theme === 'light' ? "bg-zinc-50 border-zinc-200 text-zinc-650" : "bg-zinc-950/40 border-white/5 text-slate-200"
                  )}>
                    <span className="text-zinc-500">Qiyinchilik:</span>
                    <span className="text-white bg-indigo-650 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">{challenge.difficulty}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={cn("text-xs uppercase font-extrabold tracking-wider", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>
                    Topshiriq yo'riqnomasi:
                  </h4>
                  <ul className="space-y-3">
                    {challenge.instructions.map((inst, idx) => (
                      <li key={idx} className={cn(
                        "flex items-start gap-3 text-xs font-medium leading-relaxed",
                        theme === 'light' ? "text-zinc-700" : "text-zinc-300"
                      )}>
                        <span className={cn(
                          "w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono shrink-0 count-num mt-0.5 border",
                          theme === 'light' ? "bg-zinc-100 border-zinc-200 text-zinc-500" : "bg-zinc-900 border-white/5 text-zinc-500"
                        )}>
                          {idx + 1}
                        </span>
                        <span>{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Console log execution outputs */}
              <div className={cn(
                "p-6 rounded-[24px] border space-y-4 transition-all duration-350",
                theme === 'light' ? "bg-white border-zinc-200 shadow-sm" : "bg-zinc-950 border-white/5"
              )}>
                <div className={cn(
                  "text-xs font-bold uppercase tracking-widest flex justify-between items-center",
                  theme === 'light' ? "text-zinc-500" : "text-zinc-505 text-zinc-500"
                )}>
                  <span>Test Natijalari</span>
                  {testResults.length > 0 && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full lowercase font-normal italic">
                      {testResults.filter((t) => t.passed).length} / {testResults.length} o'tdi
                    </span>
                  )}
                </div>

                {errorLogs && (
                  <div className={cn(
                    "p-4 border rounded-xl text-xs flex items-start gap-2.5 font-mono",
                    theme === 'light' ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-red-500/10 border-red-500/20 text-red-400 flex items-start gap-2.5 font-mono"
                  )}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <pre className="whitespace-pre-wrap">{errorLogs}</pre>
                  </div>
                )}

                {testResults.length === 0 && !errorLogs ? (
                  <div className={cn("text-xs italic font-medium py-4 text-center", theme === 'light' ? "text-zinc-500" : "text-zinc-650 text-zinc-600")}>
                    Tizim kodni tekshirishga tayyor. O'ng tomondan kodingizni kiriting va ishga tushiring.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-auto">
                    {testResults.map((t, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3.5 rounded-xl text-xs font-mono font-medium flex items-center gap-3 border transition-colors",
                          t.passed
                            ? theme === 'light'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                            : theme === 'light'
                              ? 'bg-zinc-50 text-rose-600 border-rose-200'
                              : 'bg-zinc-900/40 text-rose-400 border-white/5'
                        )}
                      >
                        {t.passed ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        )}
                        <span className="truncate">{t.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monaco Workspace Code Editor Column */}
            <div className={cn(
              "lg:col-span-7 rounded-[32px] border overflow-hidden flex flex-col h-[520px] shadow-2xl relative transition-all duration-300",
              theme === 'light' ? "bg-white border-zinc-200" : "bg-zinc-900/20 border-white/5"
            )}>
              <div className={cn(
                "px-6 py-4 border-b flex items-center justify-between shrink-0",
                theme === 'light' ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/80 border-b border-white/5"
              )}>
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-5 h-5 text-indigo-500" />
                  <span className={cn("font-mono text-xs font-bold", theme === 'light' ? "text-zinc-700" : "text-zinc-300")}>
                    index.{challenge.category === 'CSS' ? 'css' : 'js'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className={cn(
                      "p-2 rounded-lg transition-colors border",
                      theme === 'light' 
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 border-zinc-200" 
                        : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-white/5"
                    )}
                    title="Kodni tozalash/qayta boshlash"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRunTests}
                    disabled={running}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/15 flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current border-none text-white animate-none" />
                    {running ? "Kompilyatsiya..." : "Ishga Tushirish"}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-zinc-950">
                <Editor
                  height="100%"
                  language={challenge.category === 'CSS' ? 'css' : 'javascript'}
                  theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbersMinChars: 3,
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'all',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
