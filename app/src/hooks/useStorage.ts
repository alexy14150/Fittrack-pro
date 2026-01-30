import { useState, useEffect, useCallback } from 'react';
import type { User, Session, Exercise, Performance } from '@/types';
import { DEFAULT_EXERCISES } from '@/types';

// Clés de stockage
const STORAGE_KEYS = {
  USER: 'fittrack_user',
  SESSIONS: 'fittrack_sessions',
  EXERCISES: 'fittrack_exercises',
  PERFORMANCES: 'fittrack_performances',
};

// Hook générique pour le localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// Hook pour l'utilisateur
export function useUser() {
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEYS.USER, null);

  const createUser = useCallback((name: string, email: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    return newUser;
  }, [setUser]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, [setUser]);

  const deleteUser = useCallback(() => {
    setUser(null);
    Object.values(STORAGE_KEYS).forEach(key => {
      window.localStorage.removeItem(key);
    });
  }, [setUser]);

  return { user, createUser, updateUser, deleteUser };
}

// Hook pour les séances
export function useSessions() {
  const [sessions, setSessions] = useLocalStorage<Session[]>(STORAGE_KEYS.SESSIONS, []);

  const addSession = useCallback((date: string) => {
    const newSession: Session = {
      id: crypto.randomUUID(),
      date,
      completed: true,
      userId: 'current',
    };
    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, [setSessions]);

  const removeSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, [setSessions]);

  const hasSessionOnDate = useCallback((date: string) => {
    return sessions.some(s => s.date === date);
  }, [sessions]);

  const getSessionsForMonth = useCallback((year: number, month: number) => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });
  }, [sessions]);

  const getCurrentStreak = useCallback(() => {
    if (sessions.length === 0) return 0;
    
    const sortedDates = [...sessions]
      .map(s => s.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Vérifier si la dernière séance est aujourd'hui ou hier
    const lastSessionDate = new Date(sortedDates[0]);
    lastSessionDate.setHours(0, 0, 0, 0);
    
    if (lastSessionDate.getTime() !== today.getTime() && 
        lastSessionDate.getTime() !== yesterday.getTime()) {
      return 0;
    }
    
    // Calculer le streak
    let checkDate = lastSessionDate.getTime() === today.getTime() ? today : yesterday;
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (date.getTime() < checkDate.getTime()) {
        break;
      }
    }
    
    return streak;
  }, [sessions]);

  return {
    sessions,
    addSession,
    removeSession,
    hasSessionOnDate,
    getSessionsForMonth,
    getCurrentStreak,
  };
}

// Hook pour les exercices
export function useExercises() {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);

  // Initialiser les exercices par défaut si vide
  useEffect(() => {
    if (exercises.length === 0) {
      const defaultExercises: Exercise[] = DEFAULT_EXERCISES.map(ex => ({
        ...ex,
        id: crypto.randomUUID(),
      }));
      setExercises(defaultExercises);
    }
  }, []);

  const addExercise = useCallback((name: string, category: Exercise['category']) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      category,
      isCustom: true,
      userId: 'current',
    };
    setExercises(prev => [...prev, newExercise]);
    return newExercise;
  }, [setExercises]);

  const removeExercise = useCallback((id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  }, [setExercises]);

  const getExercisesByCategory = useCallback(() => {
    const grouped: Record<string, Exercise[]> = {};
    exercises.forEach(exercise => {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = [];
      }
      grouped[exercise.category].push(exercise);
    });
    return grouped;
  }, [exercises]);

  const searchExercises = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return exercises.filter(e => 
      e.name.toLowerCase().includes(lowerQuery)
    );
  }, [exercises]);

  return {
    exercises,
    addExercise,
    removeExercise,
    getExercisesByCategory,
    searchExercises,
  };
}

// Hook pour les performances
export function usePerformances() {
  const [performances, setPerformances] = useLocalStorage<Performance[]>(STORAGE_KEYS.PERFORMANCES, []);

  const addPerformance = useCallback((performance: Omit<Performance, 'id'>) => {
    const newPerformance: Performance = {
      ...performance,
      id: crypto.randomUUID(),
    };
    setPerformances(prev => [...prev, newPerformance]);
    return newPerformance;
  }, [setPerformances]);

  const removePerformance = useCallback((id: string) => {
    setPerformances(prev => prev.filter(p => p.id !== id));
  }, [setPerformances]);

  const getPerformancesByExercise = useCallback((exerciseId: string) => {
    return performances
      .filter(p => p.exerciseId === exerciseId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [performances]);

  const getLastPerformance = useCallback((exerciseId: string) => {
    const exercisePerformances = performances
      .filter(p => p.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return exercisePerformances[0] || null;
  }, [performances]);

  const getPerformancesByDateRange = useCallback((exerciseId: string, startDate: string, endDate: string) => {
    return performances
      .filter(p => 
        p.exerciseId === exerciseId && 
        p.date >= startDate && 
        p.date <= endDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [performances]);

  const getExerciseStats = useCallback((exerciseId: string) => {
    const exercisePerformances = performances.filter(p => p.exerciseId === exerciseId);
    
    if (exercisePerformances.length === 0) {
      return { maxWeight: 0, totalVolume: 0, prCount: 0, averageReps: 0 };
    }

    const maxWeight = Math.max(...exercisePerformances.map(p => p.weight || 0));
    const totalVolume = exercisePerformances.reduce((sum, p) => {
      return sum + ((p.weight || 0) * (p.sets || 1) * (p.reps || 1));
    }, 0);
    
    // Compter les records personnels (performances qui sont des maxima)
    let prCount = 0;
    let currentMax = 0;
    exercisePerformances
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(p => {
        const weight = p.weight || 0;
        if (weight > currentMax) {
          currentMax = weight;
          prCount++;
        }
      });

    const averageReps = exercisePerformances.reduce((sum, p) => sum + (p.reps || 0), 0) / exercisePerformances.length;

    return { maxWeight, totalVolume, prCount, averageReps: Math.round(averageReps) };
  }, [performances]);

  return {
    performances,
    addPerformance,
    removePerformance,
    getPerformancesByExercise,
    getLastPerformance,
    getPerformancesByDateRange,
    getExerciseStats,
  };
}
