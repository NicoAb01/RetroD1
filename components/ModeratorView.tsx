import React, { useState, useMemo, useRef } from 'react';
import { Idea, Category, Task, Participant, AppTheme } from '../types';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  TrashIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  UsersIcon
} from '@heroicons/react/24/solid';

interface Props {
  gamePin: string;
  theme: AppTheme;
  onToggleTheme: () => void;
  ideas: Idea[];
  tasks: Task[];
  participants: Participant[];
  isRevealed: boolean;
  onToggleReveal: () => void;
  onMoveIdea: (id: string, newCategory: Category) => void;
  onUpdateIdea: (id: string, newContent: string) => void;
  categoryLabels: Record<Category, string>;
  onUpdateLabel: (cat: Category, label: string) => void;
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onExit: () => void;
  onClearSession: () => void;
}

const NOTE_COLORS = [
  'bg-pink-300', 
  'bg-blue-300', 
  'bg-yellow-200', 
  'bg-emerald-300', 
  'bg-orange-300',
  'bg-purple-300'
];

export const ModeratorView: React.FC<Props> = ({ 
  gamePin, theme, onToggleTheme, ideas, tasks, participants, isRevealed, onToggleReveal, onMoveIdea, onUpdateIdea,
  categoryLabels, onUpdateLabel, onAddTask, onToggleTask, onRemoveTask, onExit, onClearSession 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingLabelCat, setEditingLabelCat] = useState<Category | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<Category | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const styledIdeas = useMemo(() => {
    return ideas.map((idea, idx) => ({
      ...idea,
      color: idea.color || NOTE_COLORS[idx % NOTE_COLORS.length],
      rotation: idea.rotation || (Math.random() * 4 - 2)
    }));
  }, [ideas]);

  const takeScreenshot = () => {
    if (!dashboardRef.current) return;
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) return;
    html2canvas(dashboardRef.current, { backgroundColor: theme === 'light' ? '#f3f4f6' : '#1a1a1a', scale: 2 }).then((canvas: any) => {
      const link = document.createElement('a');
      link.download = `RetroFlow-Wall-${gamePin}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('ideaId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('ideaId');
    if (id && category !== 'tasks') {
      onMoveIdea(id, category);
    }
    setDragOverCategory(null);
  };

  const headerColors: Record<Category, string> = {
    good: 'bg-purple-400',
    neutral: 'bg-orange-400',
    bad: 'bg-red-500',
    tasks: 'bg-orange-500'
  };

  const wallStyle = theme === 'dark' 
    ? { backgroundColor: '#1a1a1a', backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '30px 30px' }
    : { backgroundColor: '#f3f4f6', backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '40px 40px' };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={wallStyle} ref={dashboardRef}>
      <header className={`px-8 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white/70'} backdrop-blur-md sticky top-0 z-50 transition-colors`}>
        <div className="flex items-center gap-6">
          <button onClick={onExit} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><ArrowLeftIcon className="w-5 h-5"/></button>
          <div className="flex flex-col">
            <h1 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Retro Board #{gamePin}</h1>
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => setShowUserList(!showUserList)}
              >
                <div className="flex -space-x-2">
                  {participants.slice(0, 5).map(p => (
                    <div 
                      key={p.id} 
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${theme === 'dark' ? 'border-slate-900' : 'border-white'} ${p.isReady ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'}`}
                      title={p.name}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {participants.length > 5 && (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold bg-slate-400 text-white ${theme === 'dark' ? 'border-slate-900' : 'border-white'}`}>
                      +{participants.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                  {participants.length} {participants.length === 1 ? 'persona' : 'personas'} conectadas
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onToggleTheme} className={`p-3 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-yellow-400' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
          <button onClick={takeScreenshot} className={`p-3 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-slate-400' : 'bg-white border border-slate-200 text-slate-400'}`}><CameraIcon className="w-5 h-5"/></button>
          <button onClick={onToggleReveal} className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${isRevealed ? 'bg-slate-500/20 text-slate-400' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
            {isRevealed ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            {isRevealed ? 'Ocultar Notas' : 'Revelar Notas'}
          </button>
          <button onClick={onClearSession} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
        </div>
      </header>

      {/* Lista flotante de participantes */}
      {showUserList && (
        <div className={`fixed left-8 top-24 w-64 rounded-3xl p-6 shadow-2xl z-40 animate-in fade-in slide-in-from-top-4 duration-300 ${theme === 'dark' ? 'bg-slate-900/90 text-white border border-white/10' : 'bg-white/90 text-slate-800 border border-slate-200'} backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Equipo en Vivo</h3>
            <button onClick={() => setShowUserList(false)}><XMarkIcon className="w-4 h-4 opacity-50 hover:opacity-100"/></button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll">
            {participants.length === 0 ? (
              <p className="text-[10px] font-bold opacity-40 italic">Esperando al equipo...</p>
            ) : (
              participants.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.isReady ? 'bg-emerald-500' : 'bg-indigo-500'} text-white shadow-lg`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${p.isReady ? 'text-emerald-500' : 'text-indigo-400'}`}>
                      {p.isReady ? 'Listo' : 'Escribiendo...'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex-1 p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start max-w-[1600px] mx-auto w-full">
        {(['good', 'neutral', 'bad', 'tasks'] as Category[]).map(cat => (
          <div 
            key={cat} 
            onDragOver={(e) => { e.preventDefault(); setDragOverCategory(cat); }}
            onDragLeave={() => setDragOverCategory(null)}
            onDrop={(e) => handleDrop(e, cat)}
            className={`flex flex-col items-center gap-8 transition-all min-h-[700px] py-4 rounded-[40px] ${
              dragOverCategory === cat ? (theme === 'dark' ? 'bg-white/5 ring-2 ring-white/10' : 'bg-indigo-50/50 ring-2 ring-indigo-200') : ''
            }`}
          >
            {/* Editable Column Header as Sticky Note */}
            <div 
              className={`${headerColors[cat]} header-note w-48 h-16 flex items-center justify-center -rotate-1 transform transition-transform hover:rotate-0 cursor-text group relative`}
              onClick={() => setEditingLabelCat(cat)}
            >
              {editingLabelCat === cat ? (
                <input 
                  autoFocus
                  value={categoryLabels[cat]}
                  onChange={(e) => onUpdateLabel(cat, e.target.value)}
                  onBlur={() => setEditingLabelCat(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingLabelCat(null)}
                  className="bg-transparent border-none outline-none text-white text-center font-bold text-lg w-full"
                />
              ) : (
                <span className="text-white text-lg font-bold text-center px-2">{categoryLabels[cat]}</span>
              )}
              <PencilSquareIcon className="w-3 h-3 absolute top-1 right-1 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="w-full space-y-6 flex flex-col items-center">
              {cat === 'tasks' ? (
                <div className="w-full space-y-4">
                  {tasks.map(t => (
                    <div key={t.id} className={`w-full flex items-center gap-3 p-4 rounded-xl sticky-note border-l-4 border-indigo-500 group cursor-pointer ${theme === 'dark' ? 'bg-[#2a2a2a] text-white' : 'bg-white text-slate-700'}`} onClick={() => onToggleTask(t.id)}>
                      {t.completed ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 rounded-full border border-slate-400"></div>}
                      <span className={`flex-1 text-sm font-bold ${t.completed ? 'line-through opacity-40' : ''}`}>{t.text}</span>
                      <button onClick={(e) => { e.stopPropagation(); onRemoveTask(t.id); }} className="opacity-0 group-hover:opacity-100 text-red-400"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <form onSubmit={(e) => { e.preventDefault(); if(newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }}} className="relative mt-4 w-full">
                    <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="+ Acción..." className={`w-full bg-transparent border-b-2 py-2 px-1 text-sm font-bold outline-none transition-colors ${theme === 'dark' ? 'border-white/10 text-white focus:border-white/30' : 'border-slate-300 text-slate-900 focus:border-indigo-400'}`} />
                  </form>
                </div>
              ) : (
                styledIdeas.filter(i => i.category === cat).map(idea => (
                  <div 
                    key={idea.id} 
                    draggable={isRevealed && editingId !== idea.id}
                    onDragStart={(e) => handleDragStart(e, idea.id)}
                    style={{ transform: isRevealed ? `rotate(${idea.rotation}deg)` : 'none' }}
                    className={`w-48 h-48 p-5 sticky-note flex flex-col justify-between transition-all group ${
                      isRevealed 
                        ? `${idea.color} cursor-grab active:cursor-grabbing` 
                        : (theme === 'dark' ? 'bg-white/5 opacity-10' : 'bg-slate-200 opacity-30') + ' grayscale pointer-events-none'
                    }`}
                  >
                    {isRevealed && (
                      <>
                        <div className="flex-1 overflow-y-auto custom-scroll">
                          {editingId === idea.id ? (
                            <textarea 
                              value={editingText} 
                              onChange={(e) => setEditingText(e.target.value)} 
                              onBlur={() => { onUpdateIdea(idea.id, editingText); setEditingId(null); }}
                              className="w-full h-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 resize-none" 
                              autoFocus 
                            />
                          ) : (
                            <p className="text-sm font-bold text-slate-800 leading-snug marker-font" onClick={() => { setEditingId(idea.id); setEditingText(idea.content); }}>
                              {idea.content}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                          <span className="text-[9px] font-black uppercase text-black/40">{idea.author}</span>
                          <button onClick={() => { setEditingId(idea.id); setEditingText(idea.content); }} className="opacity-0 group-hover:opacity-100 text-black/20 hover:text-black/60 transition-all">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};