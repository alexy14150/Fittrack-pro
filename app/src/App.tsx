import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/sections/HomePage';
import { ExercisesPage } from '@/sections/ExercisesPage';
import { ProgressPage } from '@/sections/ProgressPage';
import { SettingsPage } from '@/sections/SettingsPage';
import { useUser, useSessions, useExercises, usePerformances } from '@/hooks/useStorage';
import type { ExerciseCategory } from '@/types';

type Tab = 'home' | 'exercises' | 'progress' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
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
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-black">
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
