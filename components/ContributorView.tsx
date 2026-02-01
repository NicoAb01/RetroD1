import React, { useState, useEffect, useRef } from 'react';
import { Category, Language, AppTheme } from '../types';
import { translations } from '../App';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/solid';

interface Props {
  onAddIdea: (idea: { content: string, category: Category, author: string }) => void;
  onExit: () => void;
  onJoin: (pin: string) => void;
  onSetReady: (id: string, name: string, isReady: boolean) => void;
  isConnected: boolean;
  categoryLabels: Record<Category, string>;
  language: Language;
  theme: AppTheme;
}

export const ContributorView: React.FC<Props> = ({ onAddIdea, onExit, onJoin, onSetReady, isConnected, categoryLabels, language, theme }) => {
  const [author, setAuthor] = useState(() => localStorage.getItem('rf_author') || '');
  const [pin, setPin] = useState(() => localStorage.getItem('rf_active_pin') || '');
  const [isJoined, setIsJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const userId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const t = translations[language];

  useEffect(() => {
    if (author) localStorage.setItem('rf_author', author);
  }, [author]);

  useEffect(() => {
    if (isJoined && isConnected) {
      onSetReady(userId, author, isReady || content.length > 0);
    }
  }, [isReady, isJoined, isConnected, author, content, onSetReady, userId]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() && author.trim()) {
      onJoin(pin.toUpperCase());
      setIsJoined(true);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || !activeCategory || !isConnected) return;
    setStatus('sending');
    onAddIdea({ content: content.trim(), category: activeCategory as any, author: author.trim() });
    setStatus('success');
    setTimeout(() => { 
      setStatus('idle'); 
      setContent(''); 
    }, 800);
  };

  if (!isJoined) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 ${theme === 'dark' ? 'bg-[#000000] retro-bg-dark' : 'bg-[#f3f4f6] retro-bg-light'}`}>
        <div className={`w-full max-w-sm border backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl space-y-8 ${theme === 'dark' ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col items-center gap-2">
            <h1 className={`text-5xl font-black tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Retro</h1>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">{t.welcome}</p>
          </div>
          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ml-1 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>{t.pinLabel}</label>
              <input 
                type="text" placeholder="D1" 
                value={pin} onChange={(e) => setPin(e.target.value.toUpperCase())} 
                className={`w-full py-5 text-center text-4xl font-black border rounded-2xl outline-none focus:border-indigo-500 transition-all tracking-widest uppercase ${theme === 'dark' ? 'bg-black/40 border-white/10 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600'}`} 
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ml-1 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>{t.nameLabel}</label>
              <input 
                type="text" placeholder="Hans" 
                value={author} onChange={(e) => setAuthor(e.target.value)} 
                className={`w-full py-5 text-center text-xl font-bold border rounded-2xl outline-none focus:border-indigo-500 ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`} 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">{t.enterBoard}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-[#000000]' : 'bg-[#f3f4f6]'}`}>
      <header className={`px-6 py-5 flex items-center justify-between border-b backdrop-blur-xl sticky top-0 z-50 ${theme === 'dark' ? 'bg-black/60 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <button onClick={onExit} className={`p-2 transition-colors ${theme === 'dark' ? 'text-white/30 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><ArrowLeftIcon className="w-5 h-5" /></button>
        <div className="flex flex-col items-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-[9px] font-black text-emerald-600 uppercase">{isConnected ? t.connected : 'Offline'}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsReady(!isReady)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isReady ? 'bg-emerald-500 text-white border-emerald-500' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-slate-200 text-slate-400')
          }`}
        >
          {isReady ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30" />}
          <span className="text-[9px] font-black uppercase tracking-widest">{isReady ? t.ready : t.writing}</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col max-w-lg mx-auto w-full gap-8">
        <div className="text-center space-y-2 mt-4">
          <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.addIdea}</h2>
          <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.2em] opacity-60">Retro • #{pin}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(['good', 'neutral', 'bad', 'tasks'] as Category[]).map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`p-4 rounded-2xl flex items-center gap-3 border transition-all active:scale-95 ${
                activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{categoryLabels[cat]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            disabled={!activeCategory}
            placeholder={activeCategory ? `${categoryLabels[activeCategory]}...` : t.selectCat} 
            className={`w-full h-full min-h-[200px] border p-6 rounded-[32px] text-xl font-bold outline-none resize-none transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:border-indigo-500/40' 
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-200 focus:border-indigo-500/40'
            } ${!activeCategory ? 'opacity-30' : ''}`} 
          />

          <button 
            disabled={!content.trim() || !activeCategory || !isConnected} 
            onClick={handleSubmit} 
            className={`w-full py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
              status === 'success' 
                ? 'bg-emerald-600 text-white scale-[0.98]' 
                : (content.trim() && activeCategory ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 active:scale-95' : (theme === 'dark' ? 'bg-white/5 text-white/20' : 'bg-slate-200 text-slate-400'))
            }`}
          >
            {status === 'success' ? '✓' : t.send}
            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
          </button>
        </div>
      </main>
    </div>
  );
};