// Types pour l'application FitTrack Pro

export type ExerciseCategory = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'cardio';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Session {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  completed: boolean;
  userId: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom: boolean;
  userId?: string;
}

export interface Performance {
  id: string;
  exerciseId: string;
  sessionId: string;
  date: string; // ISO date
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number; // minutes
  distance?: number; // km
  pace?: string; // min/km
}

export type TimeFilter = '7d' | '30d' | '3m' | 'custom';

export interface ExerciseStats {
  maxWeight: number;
  totalVolume: number;
  prCount: number;
  averageReps: number;
}

// Liste des exercices prédéfinis
export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
  // Poitrine
  { name: 'Développé couché', category: 'chest', isCustom: false },
  { name: 'Développé incliné', category: 'chest', isCustom: false },
  { name: 'Développé décliné', category: 'chest', isCustom: false },
  { name: 'Écartés avec haltères', category: 'chest', isCustom: false },
  { name: 'Écartés à la machine', category: 'chest', isCustom: false },
  { name: 'Dips', category: 'chest', isCustom: false },
  
  // Dos
  { name: 'Tractions', category: 'back', isCustom: false },
  { name: 'Rowing barre', category: 'back', isCustom: false },
  { name: 'Rowing haltère', category: 'back', isCustom: false },
  { name: 'Rowing à la machine', category: 'back', isCustom: false },
  { name: 'Tirage vertical', category: 'back', isCustom: false },
  { name: 'Soulevé de terre', category: 'back', isCustom: false },
  { name: 'Hyperextensions', category: 'back', isCustom: false },
  
  // Jambes
  { name: 'Squat', category: 'legs', isCustom: false },
  { name: 'Squat avant', category: 'legs', isCustom: false },
  { name: 'Leg press', category: 'legs', isCustom: false },
  { name: 'Fentes', category: 'legs', isCustom: false },
  { name: 'Presse à cuisses', category: 'legs', isCustom: false },
  { name: 'Extension des jambes', category: 'legs', isCustom: false },
  { name: 'Curl des jambes', category: 'legs', isCustom: false },
  { name: 'Mollets debout', category: 'legs', isCustom: false },
  { name: 'Mollets assis', category: 'legs', isCustom: false },
  
  // Épaules
  { name: 'Développé militaire', category: 'shoulders', isCustom: false },
  { name: 'Élévations latérales', category: 'shoulders', isCustom: false },
  { name: 'Élévations frontales', category: 'shoulders', isCustom: false },
  { name: 'Oiseau', category: 'shoulders', isCustom: false },
  { name: 'Shrugs', category: 'shoulders', isCustom: false },
  
  // Bras
  { name: 'Curl barre', category: 'arms', isCustom: false },
  { name: 'Curl haltères', category: 'arms', isCustom: false },
  { name: 'Curl marteau', category: 'arms', isCustom: false },
  { name: 'Curl concentré', category: 'arms', isCustom: false },
  { name: 'Extension triceps', category: 'arms', isCustom: false },
  { name: 'Barre au front', category: 'arms', isCustom: false },
  { name: 'Dips triceps', category: 'arms', isCustom: false },
  
  // Cardio
  { name: 'Course à pied', category: 'cardio', isCustom: false },
  { name: 'Vélo', category: 'cardio', isCustom: false },
  { name: 'Rameur', category: 'cardio', isCustom: false },
  { name: 'Elliptique', category: 'cardio', isCustom: false },
  { name: 'Marche rapide', category: 'cardio', isCustom: false },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Poitrine',
  back: 'Dos',
  legs: 'Jambes',
  shoulders: 'Épaules',
  arms: 'Bras',
  cardio: 'Cardio',
};
