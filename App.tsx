import React, { useState, useEffect, useRef } from 'react';
import { ContributorView } from './components/ContributorView';
import { ModeratorView } from './components/ModeratorView';
import { ViewRole, Idea, Task, Category, Participant, AppTheme } from './types';
import { 
  PlayIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';

const App: React.FC = () => {
  const [role, setRole] = useState<ViewRole | null>(null);
  const [theme, setTheme] = useState<AppTheme>('light');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<Category, string>>({
    good: 'Gut',
    neutral: 'Nada Mau / Not Bad',
    bad: 'Mal',
    tasks: 'Tasks'
  });
  
  const [gamePin] = useState(() => {
    const savedPin = localStorage.getItem('rf_active_pin');
    if (savedPin) return savedPin;
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem('rf_active_pin', newPin);
    return newPin;
  });

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const peerIdPrefix = `retro-flow-session-`;
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
    const saved = localStorage.getItem('rf_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setIdeas(parsed.ideas || []);
        setTasks(parsed.tasks || []);
        setIsRevealed(parsed.isRevealed || false);
        setCategoryLabels(parsed.categoryLabels || categoryLabels);
        setTheme(parsed.theme || 'light');
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
        conn.send({ type: 'HEARTBEAT', labels: categoryLabels });
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
      const peer = new Peer(`${peerIdPrefix}${gamePin}`, peerConfig);
      peerRef.current = peer;
      
      peer.on('open', (id: string) => {
        setIsConnected(true);
      });

      peer.on('connection', (conn: any) => {
        conn.on('open', () => {
          startHeartbeat(conn);
          conn.send({ type: 'SYNC_LABELS', payload: categoryLabels });
        });
        conn.on('data', (data: any) => {
          if (data.type === 'NEW_IDEA') handleIncomingIdea(data.payload);
          else if (data.type === 'READY_STATUS') updateParticipantStatus(data.payload);
        });
        conn.on('close', () => {
          setParticipants(prev => prev.filter(p => p.id !== conn.peer));
        });
      });

      peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') {
          console.warn('ID already taken, likely another moderator session is active.');
        }
      });

      return () => {
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        peer.destroy();
      };
    }
  }, [role, gamePin, categoryLabels]);

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

      conn.on('open', () => {
        setIsConnected(true);
      });

      conn.on('data', (data: any) => {
        if (data.type === 'SYNC_LABELS' || data.type === 'HEARTBEAT') {
          if (data.labels || data.payload) setCategoryLabels(data.labels || data.payload);
        }
      });

      conn.on('close', () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => handleJoinSession(targetPin), 3000);
      });

      conn.on('error', (err: any) => {
        setIsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => handleJoinSession(targetPin), 5000);
      });
    });

    peer.on('error', (err: any) => {
      setIsConnected(false);
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f3f4f6]'} transition-colors duration-500`}>
      {role === 'contributor' ? (
        <ContributorView 
          onAddIdea={(idea) => {
            if (connRef.current?.open) {
              connRef.current.send({ type: 'NEW_IDEA', payload: idea });
            }
          }} 
          onExit={() => { 
            peerRef.current?.destroy(); 
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            setRole(null); 
          }} 
          onJoin={handleJoinSession}
          onSetReady={(id, name, isReady) => {
            if (connRef.current?.open) {
              connRef.current.send({ type: 'READY_STATUS', payload: { id, name, isReady } });
            }
          }}
          isConnected={isConnected}
          categoryLabels={categoryLabels}
        />
      ) : role === 'moderator' ? (
        <ModeratorView 
          gamePin={gamePin}
          theme={theme}
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
          onClearSession={() => { if(confirm('Sitzung zurücksetzen?')) { setIdeas([]); setTasks([]); setIsRevealed(false); }}}
        />
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617]">
          <div className="z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 text-center shadow-2xl">
            <div className="mb-8 inline-flex p-4 rounded-2xl bg-slate-900 border border-slate-800">
               <h1 className="text-4xl font-extrabold text-white tracking-tighter">RetroFlow</h1>
            </div>
            <div className="space-y-4">
              <button onClick={() => setRole('contributor')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all">
                <UserGroupIcon className="w-5 h-5" /> Dem Team beitreten
              </button>
              <button onClick={() => setRole('moderator')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-700">
                <PlayIcon className="w-5 h-5" /> Sitzung moderieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;