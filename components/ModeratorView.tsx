import React, { useState, useMemo, useRef } from 'react';
import { Idea, Category, Task, Participant, AppTheme, Language } from '../types';
import { translations } from '../App';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  TrashIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  UsersIcon
} from '@heroicons/react/24/solid';

interface Props {
  gamePin: string;
  theme: AppTheme;
  language: Language;
  onSetLanguage: (lang: Language) => void;
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
  'bg-[#FFECB3]', // Soft Yellow
  'bg-[#CFD8DC]', // Soft Grey
  'bg-[#FFCCBC]', // Soft Orange
  'bg-[#C8E6C9]', // Soft Green
  'bg-[#F8BBD0]', // Soft Pink
];

interface GroupedIdea extends Idea {
  authors: string[];
  count: number;
  originalIds: string[];
}

export const ModeratorView: React.FC<Props> = ({ 
  gamePin, theme, language, onSetLanguage, onToggleTheme, ideas, tasks, participants, isRevealed, onToggleReveal, onMoveIdea, onUpdateIdea,
  categoryLabels, onUpdateLabel, onAddTask, onToggleTask, onRemoveTask, onExit, onClearSession 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingLabelCat, setEditingLabelCat] = useState<Category | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<Category | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  // Logic to group ideas by identical content
  const groupedIdeasByCategory = useMemo(() => {
    const result: Record<Category, GroupedIdea[]> = {
      good: [],
      neutral: [],
      bad: [],
      tasks: [] // placeholder, tasks are handled separately
    };

    const categories: Category[] = ['good', 'neutral', 'bad'];
    
    categories.forEach(cat => {
      const catIdeas = ideas.filter(i => i.category === cat);
      const groups: Record<string, GroupedIdea> = {};

      catIdeas.forEach((idea, idx) => {
        const key = idea.content.trim().toLowerCase();
        if (!groups[key]) {
          groups[key] = {
            ...idea,
            authors: [idea.author],
            count: 1,
            originalIds: [idea.id],
            color: idea.color || NOTE_COLORS[idx % NOTE_COLORS.length],
            rotation: idea.rotation || (Math.random() * 4 - 2)
          };
        } else {
          if (!groups[key].authors.includes(idea.author)) {
            groups[key].authors.push(idea.author);
          }
          groups[key].originalIds.push(idea.id);
          groups[key].count++;
        }
      });

      result[cat] = Object.values(groups);
    });

    return result;
  }, [ideas]);

  const takeScreenshot = () => {
    if (!dashboardRef.current) return;
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) return;
    html2canvas(dashboardRef.current, { 
      backgroundColor: theme === 'dark' ? '#000000' : '#f3f4f6', 
      scale: 2 
    }).then((canvas: any) => {
      const link = document.createElement('a');
      link.download = `Retro-Board-${gamePin}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('ideaId', id);
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
    good: 'bg-emerald-600',
    neutral: 'bg-amber-500',
    bad: 'bg-rose-600',
    tasks: 'bg-indigo-600'
  };

  const wallStyle = theme === 'dark' 
    ? { backgroundColor: '#000000', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }
    : { backgroundColor: '#f3f4f6', backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={wallStyle} ref={dashboardRef}>
      <header className={`px-8 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-slate-200 bg-white/70'} backdrop-blur-md sticky top-0 z-50 transition-colors`}>
        <div className="flex items-center gap-6">
          <button onClick={onExit} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-white/50' : 'hover:bg-slate-100 text-slate-500'}`}><ArrowLeftIcon className="w-5 h-5"/></button>
          <div className="flex flex-col">
            <h1 className={`text-2xl font-black tracking-tight italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Retro <span className="text-indigo-500 not-italic">#{gamePin}</span></h1>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowUserList(!showUserList)}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>{participants.length} {t.connected}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex gap-1 p-1 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            {(['de', 'en', 'pt'] as Language[]).map(lang => (
              <button key={lang} onClick={() => onSetLanguage(lang)} className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${language === lang ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={onToggleTheme} className={`p-3 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-amber-400' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
          <button onClick={takeScreenshot} className={`p-3 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white/30' : 'bg-white border border-slate-200 text-slate-400'}`} title={t.capture}><CameraIcon className="w-5 h-5"/></button>
          <button onClick={onToggleReveal} className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${isRevealed ? (theme === 'dark' ? 'bg-white/10 text-white/40' : 'bg-slate-200 text-slate-500') : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}>
            {isRevealed ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            {isRevealed ? t.hide : t.reveal}
          </button>
          <button onClick={onClearSession} className={`p-2 transition-colors ${theme === 'dark' ? 'text-white/20 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`} title={t.clear}><TrashIcon className="w-5 h-5"/></button>
        </div>
      </header>

      {showUserList && (
        <div className={`fixed left-8 top-24 w-64 rounded-3xl p-6 shadow-2xl z-40 border backdrop-blur-xl animate-in slide-in-from-top-4 ${theme === 'dark' ? 'bg-slate-900/90 text-white border-white/10' : 'bg-white/90 text-slate-800 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Live Session</h3>
            <button onClick={() => setShowUserList(false)}><XMarkIcon className="w-4 h-4 opacity-50"/></button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scroll">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${p.isReady ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-lg`}>{p.name.charAt(0)}</div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className={`text-[8px] uppercase tracking-tighter opacity-40 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{p.isReady ? t.ready : t.writing}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start max-w-[1800px] mx-auto w-full">
        {(['good', 'neutral', 'bad', 'tasks'] as Category[]).map(cat => (
          <div 
            key={cat} 
            onDragOver={(e) => { e.preventDefault(); setDragOverCategory(cat); }}
            onDragLeave={() => setDragOverCategory(null)}
            onDrop={(e) => handleDrop(e, cat)}
            className={`flex flex-col items-center gap-8 transition-all min-h-[700px] py-4 rounded-[40px] ${
              dragOverCategory === cat ? (theme === 'dark' ? 'bg-white/5 ring-2 ring-indigo-500/30' : 'bg-black/5 ring-2 ring-indigo-500/30') : ''
            }`}
          >
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

            <div className={`w-full ${cat !== 'tasks' ? 'grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4 place-items-center' : 'space-y-4'}`}>
              {cat === 'tasks' ? (
                <div className="w-full space-y-4 px-2">
                  {tasks.map(t => (
                    <div key={t.id} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-l-4 border-indigo-500 hover:brightness-110 transition-all cursor-pointer shadow-md ${theme === 'dark' ? 'bg-[#111] text-white' : 'bg-white text-slate-700'}`} onClick={() => onToggleTask(t.id)}>
                      {t.completed ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <div className={`w-5 h-5 rounded-full border ${theme === 'dark' ? 'border-white/20' : 'border-slate-200'}`}></div>}
                      <span className={`flex-1 text-sm font-bold leading-tight ${t.completed ? 'line-through opacity-40' : ''}`}>{t.text}</span>
                    </div>
                  ))}
                  <form onSubmit={(e) => { e.preventDefault(); if(newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }}} className="relative mt-4 w-full">
                    <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="..." className={`w-full bg-transparent border-b-2 py-3 px-2 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'border-white/10 text-white focus:border-indigo-500 placeholder:text-white/20' : 'border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-300'}`} />
                  </form>
                </div>
              ) : (
                groupedIdeasByCategory[cat].map(idea => (
                  <div 
                    key={idea.id} 
                    draggable={isRevealed && editingId !== idea.id}
                    onDragStart={(e) => handleDragStart(e, idea.id)}
                    style={{ transform: isRevealed ? `rotate(${idea.rotation}deg)` : 'none' }}
                    onClick={() => idea.count > 1 && setExpandedGroupId(expandedGroupId === idea.id ? null : idea.id)}
                    className={`w-36 h-36 p-4 sticky-note flex flex-col justify-between transition-all group relative ${
                      isRevealed ? `${idea.color} cursor-grab active:cursor-grabbing` : (theme === 'dark' ? 'bg-white/5 opacity-10 border border-white/5 pointer-events-none' : 'bg-slate-200 opacity-40 pointer-events-none')
                    }`}
                  >
                    {isRevealed && (
                      <>
                        {/* Group Badge */}
                        {idea.count > 1 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg z-10 border-2 border-white ring-1 ring-indigo-500 animate-pulse">
                            {idea.count}
                          </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scroll">
                          {editingId === idea.id ? (
                            <textarea 
                              value={editingText} 
                              onChange={(e) => setEditingText(e.target.value)} 
                              onBlur={() => { onUpdateIdea(idea.id, editingText); setEditingId(null); }}
                              className="w-full h-full bg-transparent border-none outline-none text-sm font-black text-slate-800 resize-none" 
                              autoFocus 
                            />
                          ) : (
                            <p className="text-sm font-black text-slate-800 leading-snug marker-font">
                              {idea.content}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-black/10">
                          <div className="flex items-center gap-1 overflow-hidden">
                             <UsersIcon className="w-2.5 h-2.5 text-slate-800/30" />
                             <span className="text-[8px] font-black uppercase text-slate-800/40 truncate">
                                {idea.count > 1 ? `${idea.authors[0]} +${idea.count - 1}` : idea.author}
                             </span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(idea.id); setEditingText(idea.content); }} className="opacity-0 group-hover:opacity-100 text-slate-800/20 hover:text-slate-800/60 transition-all">
                            <PencilSquareIcon className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Authors Popover */}
                        {expandedGroupId === idea.id && (
                          <div className="absolute top-full left-0 mt-2 w-40 bg-white shadow-2xl rounded-xl p-3 z-50 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 border-b border-indigo-50 pb-1">Autores</h4>
                             <div className="space-y-1 max-h-32 overflow-y-auto custom-scroll">
                                {idea.authors.map((author, i) => (
                                  <div key={i} className="text-[9px] font-bold text-slate-600 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {author}
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
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