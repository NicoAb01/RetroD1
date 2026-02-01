import React, { useState, useEffect, useRef } from 'react';
import { ContributorView } from './components/ContributorView';
import { ModeratorView } from './components/ModeratorView';
import { ViewRole, Idea, Task, Category, Participant, AppTheme, Language } from './types';
import { 
  PlayIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

export const translations = {
  de: {
    welcome: "Willkommen",
    joinTeam: "Team beitreten",
    modPanel: "Moderator-Panel",
    pinLabel: "SITZUNGS-PIN",
    nameLabel: "DEIN NAME",
    enterBoard: "Dem Board beitreten",
    gut: "Gut",
    neutral: "Neutral",
    schlecht: "Schlecht",
    aktionen: "Aktionen",
    reveal: "Notizen zeigen",
    hide: "Notizen verbergen",
    capture: "Board erfassen",
    clear: "Board leeren",
    connected: "Verbunden",
    writing: "Schreibt...",
    ready: "Bereit",
    send: "Notiz senden",
    addIdea: "Idee hinzufügen",
    selectCat: "Kategorie wählen",
    resetBoardConfirm: "Board wirklich zurücksetzen?"
  },
  en: {
    welcome: "Welcome",
    joinTeam: "Join Team",
    modPanel: "Moderator Panel",
    pinLabel: "SESSION PIN",
    nameLabel: "YOUR NAME",
    enterBoard: "Enter Board",
    gut: "Good",
    neutral: "Neutral",
    schlecht: "Bad",
    aktionen: "Actions",
    reveal: "Reveal Notes",
    hide: "Hide Notes",
    capture: "Capture Board",
    clear: "Clear Board",
    connected: "Live",
    writing: "Writing...",
    ready: "Ready",
    send: "Send Note",
    addIdea: "Add Idea",
    selectCat: "Select Category",
    resetBoardConfirm: "Reset board?"
  },
  pt: {
    welcome: "Bem-vindo",
    joinTeam: "Entrar na Equipa",
    modPanel: "Painel de Moderador",
    pinLabel: "PIN DA SESSÃO",
    nameLabel: "TEU NOME",
    enterBoard: "Entrar no Quadro",
    gut: "Bom",
    neutral: "Neutro",
    schlecht: "Mau",
    aktionen: "Ações",
    reveal: "Mostrar Notas",
    hide: "Ocultar Notas",
    capture: "Capturar Quadro",
    clear: "Limpar Quadro",
    connected: "Em Vivo",
    writing: "Escrevendo...",
    ready: "Pronto",
    send: "Enviar Nota",
    addIdea: "Adicionar Ideia",
    selectCat: "Selecionar Categoria",
    resetBoardConfirm: "Limpar quadro?"
  }
};

const App: React.FC = () => {
  const [role, setRole] = useState<ViewRole | null>(null);
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('g_retro_lang') as Language) || 'de';
  });
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const t = translations[language];

  const [categoryLabels, setCategoryLabels] = useState<Record<Category, string>>({
    good: t.gut,
    neutral: t.neutral,
    bad: t.schlecht,
    tasks: t.aktionen
  });

  useEffect(() => {
    setCategoryLabels({
      good: t.gut,
      neutral: t.neutral,
      bad: t.schlecht,
      tasks: t.aktionen
    });
    localStorage.setItem('g_retro_lang', language);
  }, [language, t]);
  
  const [gamePin, setGamePin] = useState(() => {
    return localStorage.getItem('rf_active_pin') || Math.floor(1000 + Math.random() * 9000).toString();
  });

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const peerIdPrefix = `retro-app-`;
  const peerConfig = {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  };

  useEffect(() => {
    localStorage.setItem('rf_active_pin', gamePin);
  }, [gamePin]);

  useEffect(() => {
    const saved = localStorage.getItem('rf_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIdeas(parsed.ideas || []);
        setTasks(parsed.tasks || []);
        setIsRevealed(parsed.isRevealed || false);
        setTheme(parsed.theme || 'dark');
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rf_state', JSON.stringify({ ideas, tasks, isRevealed, categoryLabels, theme }));
  }, [ideas, tasks, isRevealed, categoryLabels, theme]);

  const startHeartbeat = (conn: any) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = window.setInterval(() => {
      if (conn && conn.open) {
        conn.send({ type: 'HEARTBEAT', labels: categoryLabels, language });
      } else {
        clearInterval(heartbeatIntervalRef.current!);
      }
    }, 5000);
  };

  useEffect(() => {
    if (!role) return;
    const Peer = (window as any).Peer;
    if (!Peer) return;

    if (role === 'moderator') {
      if (peerRef.current) peerRef.current.destroy();
      
      const peer = new Peer(`${peerIdPrefix}${gamePin}`, peerConfig);
      peerRef.current = peer;
      
      peer.on('open', () => setIsConnected(true));
      peer.on('connection', (conn: any) => {
        conn.on('open', () => {
          startHeartbeat(conn);
          conn.send({ type: 'SYNC_LABELS', payload: categoryLabels, language });
        });
        conn.on('data', (data: any) => {
          if (data.type === 'NEW_IDEA') handleIncomingIdea(data.payload);
          else if (data.type === 'READY_STATUS') updateParticipantStatus(data.payload);
        });
        conn.on('close', () => setParticipants(prev => prev.filter(p => p.id !== conn.peer)));
      });

      peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') {
          alert('PIN already in use.');
          setRole(null);
        }
      });

      return () => {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        peer.destroy();
      };
    }
  }, [role, gamePin, categoryLabels, language]);

  const handleIncomingIdea = (ideaData: any) => {
    if (ideaData.category === 'tasks') {
      setTasks(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), text: ideaData.content, completed: false, createdAt: Date.now() }]);
    } else {
      setIdeas(prev => [...prev, { ...ideaData, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }]);
    }
  };

  const updateParticipantStatus = (status: Participant & { lastSeen: number }) => {
    setParticipants(prev => {
      const exists = prev.find(p => p.id === status.id);
      if (exists) return prev.map(p => p.id === status.id ? { ...p, ...status, lastSeen: Date.now() } : p);
      return [...prev, { ...status, lastSeen: Date.now() }];
    });
  };

  const handleJoinSession = (targetPin: string) => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    const Peer = (window as any).Peer;
    if (!Peer) return;
    if (peerRef.current) peerRef.current.destroy();

    const peer = new Peer(undefined, peerConfig);
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`${peerIdPrefix}${targetPin.trim()}`, { 
        reliable: true,
        serialization: 'json'
      });
      connRef.current = conn;
      conn.on('open', () => setIsConnected(true));
      conn.on('data', (data: any) => {
        if (data.type === 'SYNC_LABELS' || data.type === 'HEARTBEAT') {
          if (data.labels) setCategoryLabels(data.labels);
          if (data.language) setLanguage(data.language);
        }
      });
      conn.on('close', () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => handleJoinSession(targetPin), 3000);
      });
    });
  };

  if (!role) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#000000] retro-bg-dark' : 'bg-[#f3f4f6] retro-bg-light'} transition-colors duration-500`}>
        <div className="absolute top-8 right-8 flex gap-2">
          {(['de', 'en', 'pt'] as Language[]).map(lang => (
            <button 
              key={lang} 
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${language === lang ? 'bg-indigo-600 text-white' : 'bg-black/10 text-black/40 hover:bg-black/20'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={`z-10 w-full max-w-md ${theme === 'dark' ? 'bg-[#111] border-white/5 shadow-[0_0_50px_rgba(79,70,229,0.1)]' : 'bg-white border-slate-200'} backdrop-blur-xl border rounded-[40px] p-10 text-center shadow-2xl animate-float`}>
          <div className="mb-12 flex flex-col items-center gap-2">
             <h1 className={`text-7xl font-black tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Retro</h1>
             <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.4em]">Simple. Agile. Fast.</p>
          </div>
          
          <div className="mb-8">
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>{t.pinLabel}</label>
            <input 
              type="text" 
              value={gamePin} 
              onChange={(e) => setGamePin(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="D1-RETRO"
              className={`w-full ${theme === 'dark' ? 'bg-black/40 border-white/10 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600'} border rounded-2xl py-5 text-center text-3xl font-black outline-none focus:border-indigo-500 transition-all tracking-widest`}
            />
          </div>

          <div className="space-y-4">
            <button onClick={() => setRole('contributor')} className={`group w-full ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white border-white/5' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'} font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all border`}>
              <UserGroupIcon className="w-5 h-5 text-indigo-500" /> {t.joinTeam}
            </button>
            <button onClick={() => setRole('moderator')} className="group w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20">
              <PlayIcon className="w-5 h-5" /> {t.modPanel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#000000] retro-bg-dark' : 'bg-[#f3f4f6] retro-bg-light'} transition-colors duration-500`}>
      {role === 'contributor' ? (
        <ContributorView 
          onAddIdea={(idea) => connRef.current?.open && connRef.current.send({ type: 'NEW_IDEA', payload: idea })} 
          onExit={() => { peerRef.current?.destroy(); setRole(null); }} 
          onJoin={handleJoinSession}
          onSetReady={(id, name, isReady) => connRef.current?.open && connRef.current.send({ type: 'READY_STATUS', payload: { id, name, isReady } })}
          isConnected={isConnected}
          categoryLabels={categoryLabels}
          language={language}
          theme={theme}
        />
      ) : (
        <ModeratorView 
          gamePin={gamePin}
          theme={theme}
          language={language}
          onSetLanguage={setLanguage}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          ideas={ideas} 
          tasks={tasks}
          participants={participants}
          isRevealed={isRevealed} 
          onToggleReveal={() => setIsRevealed(!isRevealed)}
          onMoveIdea={(id, cat) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, category: cat as any } : i))}
          onUpdateIdea={(id, content) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, content } : i))}
          categoryLabels={categoryLabels}
          onUpdateLabel={(cat, label) => setCategoryLabels(prev => ({ ...prev, [cat]: label }))}
          onAddTask={(text) => setTasks(prev => [...prev, { id: Math.random().toString(), text, completed: false, createdAt: Date.now() }])}
          onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
          onRemoveTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
          onExit={() => { peerRef.current?.destroy(); setRole(null); }}
          onClearSession={() => { if(confirm(t.resetBoardConfirm)) { setIdeas([]); setTasks([]); setIsRevealed(false); }}}
        />
      )}
    </div>
  );
};

export default App;