import { Home, Dumbbell, TrendingUp, Settings, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'exercises' | 'progress' | 'coach' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'exercises', label: 'Exercices', icon: Dumbbell },
  { id: 'progress', label: 'Progression', icon: TrendingUp },
  { id: 'coach', label: 'Coach', icon: Brain },
  { id: 'settings', label: 'Réglages', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-24px)] max-w-md">
      <div className="flex items-center justify-around h-[64px] rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-xl safe-bottom glass-elevated glass-highlight">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 btn-press',
                isActive ? 'text-[#D4FF90]' : 'text-[#8E8E93]'
              )}
            >
              <Icon 
                size={28} 
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all duration-150"
              />
              <span className={cn(
                'text-[12px] font-medium transition-colors duration-150',
                isActive ? 'text-[#D4FF90]' : 'text-[#8E8E93]'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}