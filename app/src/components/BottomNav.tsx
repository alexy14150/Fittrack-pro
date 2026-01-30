import { Home, Dumbbell, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'exercises' | 'progress' | 'settings';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'exercises', label: 'Exercices', icon: Dumbbell },
  { id: 'progress', label: 'Progression', icon: TrendingUp },
  { id: 'settings', label: 'Réglages', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-[#38383A]">
      <div className="flex items-center justify-around h-[49px] max-w-md mx-auto safe-bottom">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full btn-press',
                isActive ? 'text-[#D4FF90]' : 'text-[#8E8E93]'
              )}
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-all duration-150"
              />
              <span className={cn(
                'text-[11px] mt-0.5 font-medium transition-colors duration-150',
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
