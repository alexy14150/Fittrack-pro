import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import type { User, Session, Exercise, Performance } from "@/types";
import { DEFAULT_EXERCISES } from "@/types";
import { db, auth } from "@/lib/firebase";

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

/**
 * LocalStorage keys (cache local)
 */
const STORAGE_KEYS = {
  USER: "fittrack_user",
  SESSIONS: "fittrack_sessions",
  EXERCISES: "fittrack_exercises",
  PERFORMANCES: "fittrack_performances",
};

function safeGetLocal<T>(key: string, fallback: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function safeRemoveLocal(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * 🔥 UID hook (écoute Firebase Auth)
 * -> renvoie uid quand l'utilisateur anonyme est connecté
 */
function useFirebaseUid(): string | null {
  const [uid, setUid] = useState<string | null>(() => auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  return uid;
}

/**
 * Hook générique localStorage (cache)
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => safeGetLocal<T>(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        safeSetLocal(key, valueToStore);
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Helpers Firestore paths
 */
function userDocRef(uid: string) {
  return doc(db, "users", uid);
}
function sessionsCol(uid: string) {
  return collection(db, "users", uid, "sessions");
}
function exercisesCol(uid: string) {
  return collection(db, "users", uid, "exercises");
}
function performancesCol(uid: string) {
  return collection(db, "users", uid, "performances");
}

/**
 * ==============
 * ✅ USER
 * ==============
 */
export function useUser() {
  const uid = useFirebaseUid();
  const [user, setUser] = useLocalStorage<User | null>(STORAGE_KEYS.USER, null);

  // Sync down from Firestore user doc
  useEffect(() => {
    if (!uid) return;

    const ref = userDocRef(uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;

      const u: User = {
        id: uid, // on utilise uid comme id
        name: data.name ?? "Anonyme",
        email: data.email ?? "",
        createdAt: data.createdAt ?? new Date().toISOString(),
      };

      setUser(u);
    });

    return () => unsub();
  }, [uid, setUser]);

  const createUser = useCallback(
    async (name: string, email: string) => {
      if (!uid) {
        // pas encore connecté -> on met en cache, Firestore suivra une fois uid dispo
        const localUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
          createdAt: new Date().toISOString(),
        };
        setUser(localUser);
        return localUser;
      }

      const newUser: User = {
        id: uid,
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        userDocRef(uid),
        {
          name,
          email,
          createdAt: newUser.createdAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUser(newUser);
      return newUser;
    },
    [uid, setUser]
  );

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));

      if (!uid) return;

      await setDoc(
        userDocRef(uid),
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [uid, setUser]
  );

  const deleteUser = useCallback(async () => {
    setUser(null);
    Object.values(STORAGE_KEYS).forEach(safeRemoveLocal);

    // En général on ne supprime pas auth user (anonyme) côté client
    // et on ne supprime pas toutes les collections ici (ça demande règles/admin).
    // Donc on laisse "soft delete" côté app.
    if (uid) {
      await setDoc(userDocRef(uid), { deleted: true, updatedAt: serverTimestamp() }, { merge: true });
    }
  }, [uid, setUser]);

  return { user, createUser, updateUser, deleteUser, uid };
}

/**
 * ==============
 * ✅ SESSIONS
 * ==============
 */
export function useSessions() {
  const uid = useFirebaseUid();
  const [sessions, setSessions] = useLocalStorage<Session[]>(STORAGE_KEYS.SESSIONS, []);

  // éviter d’écraser le cache local par un snapshot vide au tout début
  const hasSyncedOnce = useRef(false);

  useEffect(() => {
    if (!uid) return;

    const q = query(sessionsCol(uid), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const remote: Session[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          date: data.date,
          completed: !!data.completed,
          userId: data.userId ?? uid,
        } as Session;
      });

      hasSyncedOnce.current = true;
      setSessions(remote);
    });

    return () => unsub();
  }, [uid, setSessions]);

  const addSession = useCallback(
    async (date: string) => {
      const id = crypto.randomUUID();
      const newSession: Session = {
        id,
        date,
        completed: true,
        userId: uid ?? "current",
      };

      // Optimistic UI
      setSessions((prev) => [newSession, ...prev]);

      if (uid) {
        await setDoc(
          doc(sessionsCol(uid), id),
          {
            date,
            completed: true,
            userId: uid,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      return newSession;
    },
    [uid, setSessions]
  );

  const removeSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));

      if (uid) {
        await deleteDoc(doc(sessionsCol(uid), id));
      }
    },
    [uid, setSessions]
  );

  const hasSessionOnDate = useCallback(
    (date: string) => sessions.some((s) => s.date === date),
    [sessions]
  );

  const getSessionsForMonth = useCallback(
    (year: number, month: number) =>
      sessions.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [sessions]
  );

  const getCurrentStreak = useCallback(() => {
    if (sessions.length === 0) return 0;

    const sortedDates = [...sessions]
      .map((s) => s.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastSessionDate = new Date(sortedDates[0]);
    lastSessionDate.setHours(0, 0, 0, 0);

    if (
      lastSessionDate.getTime() !== today.getTime() &&
      lastSessionDate.getTime() !== yesterday.getTime()
    ) {
      return 0;
    }

    let checkDate = lastSessionDate.getTime() === today.getTime() ? today : yesterday;

    for (const dateStr of sortedDates) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);

      if (d.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (d.getTime() < checkDate.getTime()) {
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

/**
 * ==============
 * ✅ EXERCISES
 * ==============
 */
export function useExercises() {
  const uid = useFirebaseUid();
  const [exercises, setExercises] = useLocalStorage<Exercise[]>(STORAGE_KEYS.EXERCISES, []);

  // 1) init default local (si vide)
  useEffect(() => {
    if (exercises.length === 0) {
      const defaults: Exercise[] = DEFAULT_EXERCISES.map((ex: any) => ({
        ...ex,
        id: crypto.randomUUID(),
        isCustom: false,
        userId: uid ?? "current",
      }));
      setExercises(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) sync down Firestore
  useEffect(() => {
    if (!uid) return;

    const q = query(exercisesCol(uid), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const remote: Exercise[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name,
          category: data.category,
          isCustom: !!data.isCustom,
          userId: data.userId ?? uid,
        } as Exercise;
      });

      // Si Firestore est vide, on pousse les defaults (une fois)
      if (remote.length === 0) {
        (async () => {
          const defaults: Exercise[] = DEFAULT_EXERCISES.map((ex: any) => ({
            ...ex,
            id: crypto.randomUUID(),
            isCustom: false,
            userId: uid,
          }));

          setExercises(defaults);

          // push defaults into Firestore
          await Promise.all(
            defaults.map((ex) =>
              setDoc(
                doc(exercisesCol(uid), ex.id),
                {
                  name: ex.name,
                  category: ex.category,
                  isCustom: false,
                  userId: uid,
                  createdAt: serverTimestamp(),
                },
                { merge: true }
              )
            )
          );
        })();
        return;
      }

      setExercises(remote);
    });

    return () => unsub();
  }, [uid, setExercises]);

  const addExercise = useCallback(
    async (name: string, category: Exercise["category"]) => {
      const id = crypto.randomUUID();
      const newExercise: Exercise = {
        id,
        name,
        category,
        isCustom: true,
        userId: uid ?? "current",
      };

      setExercises((prev) => [...prev, newExercise]);

      if (uid) {
        await setDoc(
          doc(exercisesCol(uid), id),
          {
            name,
            category,
            isCustom: true,
            userId: uid,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      return newExercise;
    },
    [uid, setExercises]
  );

  const removeExercise = useCallback(
    async (id: string) => {
      setExercises((prev) => prev.filter((e) => e.id !== id));
      if (uid) {
        await deleteDoc(doc(exercisesCol(uid), id));
      }
    },
    [uid, setExercises]
  );

  const getExercisesByCategory = useCallback(() => {
    const grouped: Record<string, Exercise[]> = {};
    exercises.forEach((ex) => {
      if (!grouped[ex.category]) grouped[ex.category] = [];
      grouped[ex.category].push(ex);
    });
    return grouped;
  }, [exercises]);

  const searchExercises = useCallback(
    (q: string) => {
      const lower = q.toLowerCase();
      return exercises.filter((e) => e.name.toLowerCase().includes(lower));
    },
    [exercises]
  );

  return {
    exercises,
    addExercise,
    removeExercise,
    getExercisesByCategory,
    searchExercises,
  };
}

/**
 * ==============
 * ✅ PERFORMANCES
 * ==============
 */
export function usePerformances() {
  const uid = useFirebaseUid();
  const [performances, setPerformances] = useLocalStorage<Performance[]>(
    STORAGE_KEYS.PERFORMANCES,
    []
  );

  // sync down
  useEffect(() => {
    if (!uid) return;

    const q = query(performancesCol(uid), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const remote: Performance[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
        } as Performance;
      });

      setPerformances(remote);
    });

    return () => unsub();
  }, [uid, setPerformances]);

  const addPerformance = useCallback(
    async (performance: Omit<Performance, "id">) => {
      console.log("UID in addPerformance:", uid);
      const id = crypto.randomUUID();
      const newPerformance: Performance = { ...performance, id };

      setPerformances((prev) => [...prev, newPerformance]);

      if (uid) {
        const cleanData = Object.fromEntries(
  Object.entries({
    ...newPerformance,
    userId: uid,
    createdAt: serverTimestamp(),
  }).filter(([_, v]) => v !== undefined)
);

await setDoc(
  doc(performancesCol(uid), newPerformance.id),
  cleanData,
  { merge: true }
);
      }

      return newPerformance;
    },
    [uid, setPerformances]
  );

  const removePerformance = useCallback(
    async (id: string) => {
      setPerformances((prev) => prev.filter((p) => p.id !== id));
      if (uid) {
        await deleteDoc(doc(performancesCol(uid), id));
      }
    },
    [uid, setPerformances]
  );

  const getPerformancesByExercise = useCallback(
    (exerciseId: string) =>
      performances
        .filter((p) => p.exerciseId === exerciseId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [performances]
  );

  const getLastPerformance = useCallback(
    (exerciseId: string) => {
      const arr = performances
        .filter((p) => p.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return arr[0] || null;
    },
    [performances]
  );

  const getPerformancesByDateRange = useCallback(
    (exerciseId: string, startDate: string, endDate: string) =>
      performances
        .filter((p) => p.exerciseId === exerciseId && p.date >= startDate && p.date <= endDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [performances]
  );

  const getExerciseStats = useCallback(
    (exerciseId: string) => {
      const exPerf = performances.filter((p) => p.exerciseId === exerciseId);

      if (exPerf.length === 0) {
        return { maxWeight: 0, totalVolume: 0, prCount: 0, averageReps: 0 };
      }

      const maxWeight = Math.max(...exPerf.map((p) => p.weight || 0));
      const totalVolume = exPerf.reduce((sum, p) => {
        return sum + (p.weight || 0) * (p.sets || 1) * (p.reps || 1);
      }, 0);

      let prCount = 0;
      let currentMax = 0;
      exPerf
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach((p) => {
          const w = p.weight || 0;
          if (w > currentMax) {
            currentMax = w;
            prCount++;
          }
        });

      const averageReps =
        exPerf.reduce((sum, p) => sum + (p.reps || 0), 0) / exPerf.length;

      return {
        maxWeight,
        totalVolume,
        prCount,
        averageReps: Math.round(averageReps),
      };
    },
    [performances]
  );

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