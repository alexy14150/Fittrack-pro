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

type Tab = 'home' | 'exercises' | 'progress' | 'coach' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch(console.error);
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
<header className="max-w-md mx-25 px-24 pt-0 pb-4">
  <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-14 py-3 glass-elevated glass-highlight">
    <div className="text-[22px] font-semibold text-white tracking-wide">
  FitTrack <span className="text-[#D4FF90]">Pro</span>
</div>
  </div>
</header>
      {/* Main Content */}
      <main className="max-w-md mx-auto">
        {renderPage()}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
