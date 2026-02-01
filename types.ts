export type Category = 'good' | 'neutral' | 'bad' | 'tasks';
export type Language = 'de' | 'en' | 'pt';

export interface Idea {
  id: string;
  content: string;
  category: Extract<Category, 'good' | 'neutral' | 'bad'>;
  author: string;
  createdAt: number;
  color?: string;
  rotation?: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface Participant {
  id: string;
  name: string;
  isReady: boolean;
  lastSeen: number;
}

export type ViewRole = 'contributor' | 'moderator';
export type AppTheme = 'light' | 'dark';