
export enum RoutineType {
  MORNING_PRODUCTIVE = 'Mañana Productiva',
  AFTERNOON_FOCUS = 'Tarde de Foco',
  SPLIT_SHIFT = 'Jornada Partida',
  CUSTOM = 'Personalizada',
  PDF_IMPORTED = 'Agenda Personal (Importada PDF)',
  EL_CAMBIO = 'El Cambio'
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  time: string;
  activity: string;
  type: 'work' | 'sacred' | 'personal' | 'break';
  // New customizable fields
  customColor?: string; // Hex or Tailwind class suffix
  location?: string;
  audioUrl?: string; // Base64 or Blob URL for voice note
  aiSuggestion?: string; // Cached suggestion
  alarmEnabled?: boolean; // New: Custom alarm per block
  enforceLock?: boolean; // New: User decides if this specific block locks the screen
  subtasks?: Subtask[]; // New: Subtasks list
}

export interface Routine {
  id: string; // Changed from enum to string to allow custom IDs
  name: string;
  description: string;
  blocks: TimeBlock[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  timestamp: number;
}

export enum ModelType {
  FLASH_LITE = 'fast',
  PRO = 'smart',
  THINKING = 'deep',
}

export interface DailyStats {
  date: string;
  focusMinutes: number;
  mood: number; // 1-5
  didCloseOnTime: boolean;
  candelabroStreak?: number; // New: Growth streak
}

export type GoalPeriod = 'diario' | 'semanal' | 'mensual' | 'anual';

export interface Goal {
  id: string;
  text: string;
  period: GoalPeriod;
  completed: boolean;
  category?: string;
}

export interface RetroEntry {
  date: string;
  wentWell: string;
  toImprove: string;
  actionItem: string;
}

// NEW: Evaluation System
export interface DailyEvaluation {
  date: string; // ISO Date string (YYYY-MM-DD)
  rating: number; // 1-5 Stars
  
  // Quick Check-in Fields
  planCompletion: 'yes' | 'partial' | 'no'; // "¿Cumpliste?"
  moodEmoji: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'; // Emoji selection
  energyLevel: number; // 1-10 slider
  
  // Optional / Audio
  audioNote?: string; // Base64 audio recording (Desahogo)
  textNote?: string; // Optional written note if they really want to
  
  interactionScore: number; // calculated based on chat usage that day
}

export interface AppSettings {
  vitaminDTime: string;
  vitaminDEnabled: boolean;
  theme?: 'light' | 'dark';
  accentColor?: 'teal' | 'indigo' | 'rose' | 'amber'; // New: UI Accent Color
  appVolume?: number; // 0 to 1
  customAlarmUrl?: string; // Base64 string for custom alarm sound
  // New Dual Avatar Settings
  userAvatar?: string; // "The one who struggles/needs help"
  mentorAvatar?: string; // "The Future Self/Educator"
  lastInteractionTimestamp?: number; // Track when user last spoke to AI
}

// --- Fitness Types ---
export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  targetMuscle: string;
  exercises: Exercise[];
}
