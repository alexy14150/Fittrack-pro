import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';

import { HomePage } from '@/sections/HomePage';
import { ExercisesPage } from '@/sections/ExercisesPage';
import { ProgressPage } from '@/sections/ProgressPage';
import { CoachPage } from '@/sections/CoachPage';
import { SettingsPage } from '@/sections/SettingsPage';

import { useUser, useSessions, useExercises, usePerformances } from "@/hooks/useStorage";
import type { ExerciseCategory } from "@/types";

import { auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Tab = 'home' | 'exercises' | 'progress' | 'coach' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      await signInAnonymously(auth);
    } else {
      // 🔥 Test Firestore write
      await setDoc(doc(db, "users", user.uid), {
        createdAt: new Date(),
      });
    }
  });

  return () => unsub();
}, []);

  // Data hooks
  const { user, createUser, updateUser, deleteUser } = useUser();
  const { sessions, addSession } = useSessions();
  const { exercises, addExercise } = useExercises();
  const { performances, addPerformance } = usePerformances();
  
  // Clear all data
  const handleClearData = () => {
    localStorage.removeItem('fittrack_sessions');
    localStorage.removeItem('fittrack_performances');
    window.location.reload();
  };
  
  // Render current page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            sessions={sessions}
            onAddSession={addSession}
          />
        );
      case 'exercises':
        return (
          <ExercisesPage
            exercises={exercises}
            performances={performances}
            onAddExercise={(name: string, category: ExerciseCategory) => addExercise(name, category)}
            onAddPerformance={addPerformance}
          />
        );
      case 'progress':
        return (
          <ProgressPage
            exercises={exercises}
            performances={performances}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            user={user}
            onCreateUser={createUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onClearData={handleClearData}
          />
        );
        case 'coach':
  return (
    <CoachPage
      sessions={sessions}
      performances={performances}
    />
  );
      default:
        return null;
    }
  };
  
  return (
   <div className="min-h-screen bg-[radial-gradient(80%_60%_at_50%_0%,rgba(70,40,120,0.25),transparent_60%),linear-gradient(180deg,#120B20_0%,#1A1233_45%,#261A44_100%)]">

      {/* App Header */}
<header
  className="fixed top-0 left-0 right-0 z-50 bg-[#140c22]/95 backdrop-blur-md border-b border-white/5"
  style={{ paddingTop: "env(safe-area-inset-top)" }}
>
  <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-center">
    <div className="text-[20px] font-extrabold tracking-tight text-white">
      FitTrack <span className="text-[#D4FF90]">Pro</span>
    </div>
  </div>
</header>
      {/* Main Content */}
      <main
  className="max-w-md mx-auto"
  style={{ paddingTop: "calc(env(safe-area-inset-top) + 56px)" }}
>
  {renderPage()}
</main>
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
