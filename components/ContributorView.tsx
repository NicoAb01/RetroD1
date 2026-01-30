import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../types';
import { 
  ArrowLeftIcon,
  WifiIcon,
  CheckCircleIcon,
  PlusIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/solid';

interface Props {
  onAddIdea: (idea: { content: string, category: Category, author: string }) => void;
  onExit: () => void;
  onJoin: (pin: string) => void;
  onSetReady: (id: string, name: string, isReady: boolean) => void;
  isConnected: boolean;
  categoryLabels: Record<Category, string>;
}

export const ContributorView: React.FC<Props> = ({ onAddIdea, onExit, onJoin, onSetReady, isConnected, categoryLabels }) => {
  const [author, setAuthor] = useState(() => localStorage.getItem('rf_author') || '');
  const [pin, setPin] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const userId = useRef(Math.random().toString(36).substr(2, 9)).current;

  useEffect(() => {
    if (author) localStorage.setItem('rf_author', author);
  }, [author]);

  // Sync "ready" and "typing" status automatically
  useEffect(() => {
    if (isJoined && isConnected) {
      const isTyping = content.length > 0;
      onSetReady(userId, author, isReady || isTyping);
    }
  }, [isReady, isJoined, isConnected, author, content]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4 && author.trim()) {
      onJoin(pin);
      setIsJoined(true);
    } else {
      alert("PIN (4 dígitos) y Nombre son requeridos.");
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || !activeCategory || !isConnected) return;
    setStatus('sending');
    onAddIdea({ content: content.trim(), category: activeCategory as any, author: author.trim() });
    
    // Quick success animation and clear
    setStatus('success');
    setIsSyncing(true);
    setTimeout(() => { 
      setStatus('idle'); 
      setContent(''); 
      setIsSyncing(false);
    }, 600);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl p-10 rounded-[40px] shadow-2xl border border-white/10 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">RetroFlow</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Participar en Retrospectiva</p>
          </div>
          <form onSubmit={handleJoin} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block ml-1">Pin de Sesión</label>
              <input 
                type="text" maxLength={4} placeholder="0000" 
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                className="w-full py-5 text-center text-4xl font-black bg-white/5 text-indigo-400 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 transition-all tracking-widest" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block ml-1">Tu Nombre</label>
              <input 
                type="text" placeholder="Ej. Alex" 
                value={author} onChange={(e) => setAuthor(e.target.value)} 
                className="w-full py-5 text-center text-xl font-bold bg-white/5 text-white border border-white/10 rounded-2xl outline-none focus:border-indigo-500" 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">Unirse Ahora</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between bg-black/40 border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
        <button onClick={onExit} className="text-slate-500 hover:text-white p-2"><ArrowLeftIcon className="w-5 h-5" /></button>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Conexión</span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase">{isConnected ? 'En Vivo' : 'Reconectando...'}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsReady(!isReady)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isReady ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-500'
          }`}
        >
          {isReady ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{isReady ? 'Listo' : 'Finalizar'}</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col max-w-lg mx-auto w-full gap-8">
        <div className="text-center space-y-2 mt-4">
          <h2 className="text-3xl font-black text-white tracking-tight">Agregar Idea</h2>
          <p className="text-slate-500 font-medium text-sm">Tus notas aparecerán en la pizarra del moderador.</p>
        </div>

        {/* Categorías siempre visibles como selector rápido */}
        <div className="grid grid-cols-2 gap-4">
          {(['good', 'neutral', 'bad', 'tasks'] as Category[]).map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`p-4 rounded-2xl flex items-center gap-3 border transition-all active:scale-95 ${
                activeCategory === cat 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${cat === 'good' ? 'bg-purple-400' : cat === 'neutral' ? 'bg-orange-400' : cat === 'bad' ? 'bg-red-500' : 'bg-indigo-400'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{categoryLabels[cat]}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="relative flex-1 group">
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              disabled={!activeCategory || isSyncing}
              placeholder={activeCategory ? `Escribiendo en "${categoryLabels[activeCategory]}"...` : "Selecciona una categoría arriba primero"} 
              className={`w-full h-full min-h-[250px] bg-white/5 border border-white/10 p-6 rounded-[32px] text-xl font-bold text-white outline-none resize-none transition-all placeholder:text-slate-700 ${
                !activeCategory ? 'opacity-30' : 'focus:border-indigo-500/50'
              } ${isSyncing ? 'opacity-50 blur-[1px]' : ''}`} 
            />
            {status === 'success' && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-[32px] animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-500 p-4 rounded-full shadow-2xl">
                   <PaperAirplaneIcon className="w-8 h-8 text-white animate-out slide-out-to-top-10 fade-out fill-mode-forwards" />
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={!content.trim() || !activeCategory || !isConnected || isSyncing} 
            onClick={handleSubmit} 
            className={`w-full py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
              status === 'success' 
                ? 'bg-emerald-600 text-white scale-[0.98]' 
                : (content.trim() && activeCategory ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed')
            }`}
          >
            {status === 'success' ? '¡Enviado!' : (
              <>
                Enviar Nota
                <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
              </>
            )}
          </button>
        </div>

        <div className="pb-10">
          <p className="text-[9px] font-black text-center text-slate-600 uppercase tracking-[0.3em]">
            RetroFlow v2.0 • {author}
          </p>
        </div>
      </main>
    </div>
  );
};