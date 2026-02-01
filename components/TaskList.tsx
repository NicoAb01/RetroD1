
import React, { useState } from 'react';
import { Task } from '../types';
import { 
  CheckCircleIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface Props {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
}

export const TaskList: React.FC<Props> = ({ tasks, onAddTask, onToggleTask }) => {
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim());
      setNewTask('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10 pb-32">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-slate-50 mb-3 tracking-tight">Acciones y Compromisos</h2>
        <p className="text-slate-500 font-medium">Convierte la conversación en ejecución real.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-12 relative group max-w-2xl mx-auto">
        <input 
          type="text" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Añade una acción para el próximo mes..."
          className="w-full pl-8 pr-20 py-6 bg-slate-900/50 shadow-2xl border border-slate-800 rounded-[32px] outline-none focus:ring-2 focus:ring-indigo-500 text-xl transition-all text-slate-100 placeholder:text-slate-700"
        />
        <button 
          type="submit"
          disabled={!newTask.trim()}
          className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 text-white rounded-[22px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-30"
        >
          <PlusIcon className="w-8 h-8" />
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.length === 0 ? (
          <div className="md:col-span-2 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[40px] p-24 text-center">
            <div className="bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusIcon className="w-12 h-12 text-slate-700" />
            </div>
            <p className="text-slate-600 font-bold text-xl tracking-tight">Sin tareas por ahora.</p>
          </div>
        ) : (
          tasks.sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt - a.createdAt).map((task) => (
            <div 
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`group flex items-start gap-5 p-7 rounded-[32px] border transition-all cursor-pointer ${
                task.completed 
                  ? 'bg-slate-900/20 border-slate-900 opacity-40 grayscale' 
                  : 'bg-slate-900 border-slate-800 shadow-2xl hover:shadow-indigo-600/5 hover:border-slate-700'
              }`}
            >
              <div className="mt-1">
                {task.completed ? (
                  <CheckCircleSolid className="w-8 h-8 text-emerald-500" />
                ) : (
                  <CheckCircleIcon className="w-8 h-8 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`block text-xl font-bold transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                  {task.text}
                </span>
                <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">
                  Asignado el {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
