import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Flame, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HomePageProps {
  sessions: { id: string; date: string; completed: boolean }[];
  onAddSession: (date: string) => void;
}

export function HomePage({ sessions, onAddSession }: HomePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Vérifier si une séance existe aujourd'hui
  const hasSessionToday = useMemo(() => {
    return sessions.some(s => s.date === todayStr);
  }, [sessions, todayStr]);
  
  // Calculer le streak
  const streak = useMemo(() => {
    if (sessions.length === 0) return 0;
    
    const sortedDates = [...sessions]
      .map(s => s.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streakCount = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // Si pas de séance aujourd'hui, vérifier hier
    const lastSessionDate = new Date(sortedDates[0]);
    lastSessionDate.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastSessionDate.getTime() !== checkDate.getTime() && 
        lastSessionDate.getTime() !== yesterday.getTime()) {
      return 0;
    }
    
    if (lastSessionDate.getTime() === yesterday.getTime()) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === checkDate.getTime()) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (date.getTime() < checkDate.getTime()) {
        break;
      }
    }
    
    return streakCount;
  }, [sessions]);
  
  // Nombre de séances ce mois
  const sessionsThisMonth = useMemo(() => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return isSameMonth(sessionDate, currentDate);
    }).length;
  }, [sessions, currentDate]);
  
  // Jours du calendrier
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);
  
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  
  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const handleSessionComplete = () => {
    if (!hasSessionToday) {
      onAddSession(todayStr);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    }
  };
  
  const hasSession = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  };
  
  const isToday = (date: Date) => isSameDay(date, today);
  
  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[34px] font-bold text-white leading-tight">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">
          Suivez votre régularité d'entraînement
        </p>
      </header>
      
      {/* Stats Cards */}
      <div className="flex gap-3 px-5 mb-6 overflow-x-auto hide-scrollbar">
        <div className="flex-shrink-0 bg-[#1C1C1E] rounded-2xl p-4 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-[#D4FF90]" />
            <span className="text-[13px] text-[#8E8E93]">Ce mois</span>
          </div>
          <p className="text-[28px] font-bold text-white font-mono">
            {sessionsThisMonth}
          </p>
          <p className="text-[11px] text-[#8E8E93]">séances</p>
        </div>
        
        <div className="flex-shrink-0 bg-[#1C1C1E] rounded-2xl p-4 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} className="text-[#FF9F0A]" />
            <span className="text-[13px] text-[#8E8E93]">Streak</span>
          </div>
          <p className="text-[28px] font-bold text-white font-mono">
            {streak}
          </p>
          <p className="text-[11px] text-[#8E8E93]">jours consécutifs</p>
        </div>
      </div>
      
      {/* Calendar */}
      <div className="mx-5 bg-[#1C1C1E] rounded-2xl p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-[#2C2C2E] transition-colors btn-press"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <span className="text-[17px] font-semibold text-white capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-[#2C2C2E] transition-colors btn-press"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
        
        {/* Week Days */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-[13px] text-[#8E8E93] font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);
            const hasWorkout = hasSession(date);
            
            return (
              <div
                key={i}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-full relative',
                  !isCurrentMonth && 'opacity-30',
                  isTodayDate && 'ring-2 ring-[#D4FF90]'
                )}
              >
                <span className={cn(
                  'text-[15px] font-medium',
                  isTodayDate ? 'text-[#D4FF90]' : 'text-white'
                )}>
                  {format(date, 'd')}
                </span>
                {hasWorkout && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#D4FF90]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* CTA Button */}
      <div className="fixed bottom-[20px] left-0 right-0 px-5">
        <Button
          onClick={handleSessionComplete}
          disabled={hasSessionToday}
          className={cn(
            'w-full h-14 rounded-xl font-semibold text-[17px] btn-press transition-all duration-300',
            hasSessionToday 
              ? 'bg-[#2C2C2E] text-[#636366] cursor-not-allowed'
              : 'bg-[#D4FF90] text-black hover:bg-[#c5f082]'
          )}
        >
          {showSuccess ? (
            <span className="flex items-center gap-2 success-bounce">
              <Check size={24} />
              Séance enregistrée !
            </span>
          ) : hasSessionToday ? (
            'Séance déjà enregistrée'
          ) : (
            <span className="flex items-center gap-2">
              <Check size={24} />
              Séance terminée
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
