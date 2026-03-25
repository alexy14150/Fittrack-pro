import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';

import { HomePage } from '@/sections/HomePage';
import { ExercisesPage } from '@/sections/ExercisesPage';
import { ProgressPage } from '@/sections/ProgressPage';
import { CoachPage } from '@/sections/CoachPage';
import { SettingsPage } from '@/sections/SettingsPage';
import { OnboardingPage } from '@/sections/OnboardingPage';

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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        await signInAnonymously(auth);
      } else if (!firebaseUser.isAnonymous) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          createdAt: new Date(),
        }, { merge: true });
      }
    });
    return () => unsub();
  }, []);

  // Data hooks
  const { user, createUser, updateUser, deleteUser } = useUser();
  const { sessions, addSession } = useSessions();
  const { exercises, addExercise } = useExercises();
  const { performances, addPerformance } = usePerformances();

  // ✅ Déconnexion volontaire — pose le flag puis reload
  const handleSignOut = async () => {
    // Poser le flag AVANT de vider le storage
    localStorage.setItem('fittrack_logged_out', 'true');
    // Vider les données fittrack
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('fittrack_') && k !== 'fittrack_logged_out') {
        localStorage.removeItem(k);
      }
    });
    await deleteUser();
    window.location.reload();
  };

  // ✅ Suppression de compte
  const handleDeleteAccount = async () => {
    localStorage.setItem('fittrack_logged_out', 'true');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('fittrack_') && k !== 'fittrack_logged_out') {
        localStorage.removeItem(k);
      }
    });
    await deleteUser();
    window.location.reload();
  };

  // ✅ Création depuis onboarding — retire le flag logged_out
  const handleCreateUser = async (name: string, email: string) => {
    localStorage.removeItem('fittrack_logged_out');
    await createUser(name, email);
  };

  // Clear all data
  const handleClearData = () => {
    localStorage.removeItem('fittrack_sessions');
    localStorage.removeItem('fittrack_performances');
    window.location.reload();
  };

  // ✅ Afficher l'onboarding UNIQUEMENT après déconnexion volontaire
  const isLoggedOut = localStorage.getItem('fittrack_logged_out') === 'true';
  if (isLoggedOut) {
    return <OnboardingPage onCreateUser={handleCreateUser} />;
  }

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
            onDeleteUser={handleDeleteAccount}
            onSignOut={handleSignOut}
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#140c22]/95 backdrop-blur-md border-b border-white/5">
        <div
          className="max-w-md mx-auto flex items-center justify-center px-4"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(env(safe-area-inset-top) + 56px)",
          }}
        >
          <div className="text-[20px] font-extrabold tracking-tight text-white">
            FitTrack <span className="text-[#D4FF90]">Pro</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="max-w-md mx-auto"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 56px)",
        }}
      >
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
