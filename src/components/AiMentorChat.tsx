import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2, Code } from 'lucide-react';
import { askMentor } from '../services/geminiService';
import { Mission } from '../constants';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiMentorChatProps {
  activeMission: Mission | null;
  missionContext?: { code: string; error: string; selectedCode?: string };
}

export default function AiMentorChat({ activeMission, missionContext }: AiMentorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salom! Men sizning robot-mentoringizman. Qanday yordam bera olaman?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askMentor(userMessage, {
        topic: activeMission?.title || 'Umumiy dasturlash',
        description: activeMission?.description,
        code: missionContext?.code,
        error: missionContext?.error,
        selectedCode: missionContext?.selectedCode
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Kechirasiz, javob olishda xatolik yuz berdi.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[380px] h-[550px] bg-zinc-900 rounded-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col overflow-hidden mb-6 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="h-20 bg-zinc-950/80 px-8 flex items-center justify-between shrink-0 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">AI Mentor</h4>
                  <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                     <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest">Tizimga ulangan</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-auto p-6 space-y-6 bg-zinc-900/50">
              <div className="absolute inset-0 bg-dot-pattern opacity-5 pointer-events-none" />
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
                  <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${m.role === 'user' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-800/80 text-zinc-300 rounded-tl-none border border-white/5 backdrop-blur-sm'}`}>
                      <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-code:text-indigo-400">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start relative z-10">
                  <div className="bg-zinc-800/80 p-4 rounded-2xl rounded-tl-none border border-white/5 backdrop-blur-sm shadow-xl">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-zinc-950/80 border-t border-white/5" role="form" aria-label="Mentorga savol yuborish">
              {missionContext?.selectedCode && (
                <div className="mb-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-[10px] text-zinc-400 truncate">
                      Tanlangan kod: <code className="text-indigo-300 bg-indigo-500/5 px-1 rounded">{missionContext.selectedCode.slice(0, 30)}...</code>
                    </span>
                  </div>
                  <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                </div>
              )}
              <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-2xl border border-white/5 focus-within:border-indigo-500/50 transition-all group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={missionContext?.selectedCode ? "Tanlangan kod haqida so'rang..." : "Mentordan so'rang..."}
                  aria-label="Sizning savolingiz"
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-white font-medium placeholder:text-zinc-600"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Savolni yuborish"
                  className="w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20"
                >
                  <Send className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="AI Mentor bilan suhbatlashish"
        aria-expanded={isOpen}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all group relative ${isOpen ? 'bg-zinc-900 border border-white/10 text-zinc-500' : 'bg-indigo-600 text-white shadow-indigo-600/30'}`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8 font-bold" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-4 border-zinc-950 flex items-center justify-center text-[10px] font-black">1</div>
        )}
        <div className="absolute inset-0 rounded-[24px] border border-white/10 opacity-50 pointer-events-none" />
      </motion.button>
    </div>
  );
}
