import { useState, useMemo } from 'react';
import { ChevronDown, TrendingUp, Trophy, Activity, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
// Button import removed - not used
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Exercise, Performance, TimeFilter } from '@/types';
import { CATEGORY_LABELS } from '@/types';

interface ProgressPageProps {
  exercises: Exercise[];
  performances: Performance[];
}

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '3m', label: '3 mois' },
];

export function ProgressPage({ exercises, performances }: ProgressPageProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const [chartType, setChartType] = useState<'weight' | 'volume'>('weight');
  
  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    
    switch (timeFilter) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '3m':
        start = subMonths(end, 3);
        break;
      default:
        start = subDays(end, 30);
    }
    
    return { start, end };
  }, [timeFilter]);
  
  // Get performances for selected exercise
  const exercisePerformances = useMemo(() => {
    if (!selectedExercise) return [];
    
    return performances
      .filter(p => {
        const perfDate = parseISO(p.date);
        return (
          p.exerciseId === selectedExercise.id &&
          perfDate >= dateRange.start &&
          perfDate <= dateRange.end
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedExercise, performances, dateRange]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return exercisePerformances.map(p => ({
      date: format(parseISO(p.date), 'dd/MM', { locale: fr }),
      fullDate: p.date,
      weight: p.weight || 0,
      volume: (p.weight || 0) * (p.sets || 1) * (p.reps || 1),
      reps: p.reps || 0,
      sets: p.sets || 0,
      duration: p.duration || 0,
    }));
  }, [exercisePerformances]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (exercisePerformances.length === 0) {
      return { maxWeight: 0, totalVolume: 0, prCount: 0, workoutCount: 0 };
    }
    
    const maxWeight = Math.max(...exercisePerformances.map(p => p.weight || 0));
    const totalVolume = exercisePerformances.reduce((sum, p) => {
      return sum + ((p.weight || 0) * (p.sets || 1) * (p.reps || 1));
    }, 0);
    
    // Count PRs (personal records)
    let prCount = 0;
    let currentMax = 0;
    exercisePerformances.forEach(p => {
      const weight = p.weight || 0;
      if (weight > currentMax) {
        currentMax = weight;
        prCount++;
      }
    });
    
    return { 
      maxWeight, 
      totalVolume, 
      prCount,
      workoutCount: exercisePerformances.length 
    };
  }, [exercisePerformances]);
  
  // Group exercises by category for selector
  const groupedExercises = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {};
    exercises.forEach(exercise => {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = [];
      }
      grouped[exercise.category].push(exercise);
    });
    return grouped;
  }, [exercises]);
  
  const isCardio = selectedExercise?.category === 'cardio';
  
  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[34px] font-bold text-white leading-tight">
          Progression
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">
          Visualisez votre évolution
        </p>
      </header>
      
      {/* Exercise Selector */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full h-14 bg-[#1C1C1E] rounded-xl flex items-center justify-between px-4 card-hover"
        >
          <span className={cn(
            'text-[17px]',
            selectedExercise ? 'text-white font-medium' : 'text-[#8E8E93]'
          )}>
            {selectedExercise?.name || 'Sélectionner un exercice'}
          </span>
          <ChevronDown size={20} className="text-[#8E8E93]" />
        </button>
      </div>
      
      {/* Time Filters */}
      <div className="px-5 mb-6">
        <div className="flex gap-2">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setTimeFilter(filter.id)}
              className={cn(
                'h-8 px-4 rounded-full text-[13px] font-medium transition-colors',
                timeFilter === filter.id
                  ? 'bg-[#D4FF90] text-black'
                  : 'bg-[#2C2C2E] text-[#8E8E93]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {selectedExercise && exercisePerformances.length > 0 ? (
        <>
          {/* Chart */}
          <div className="mx-5 mb-6">
            <div className="bg-[#1C1C1E] rounded-2xl p-4">
              {/* Chart Type Toggle */}
              {!isCardio && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setChartType('weight')}
                    className={cn(
                      'h-8 px-3 rounded-lg text-[13px] font-medium transition-colors',
                      chartType === 'weight'
                        ? 'bg-[#2C2C2E] text-white'
                        : 'text-[#8E8E93]'
                    )}
                  >
                    Charge
                  </button>
                  <button
                    onClick={() => setChartType('volume')}
                    className={cn(
                      'h-8 px-3 rounded-lg text-[13px] font-medium transition-colors',
                      chartType === 'volume'
                        ? 'bg-[#2C2C2E] text-white'
                        : 'text-[#8E8E93]'
                    )}
                  >
                    Volume
                  </button>
                </div>
              )}
              
              {/* Chart */}
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  {isCardio ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#38383A" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#8E8E93" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#8E8E93" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#2C2C2E', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#D4FF90' }}
                      />
                      <Bar 
                        dataKey="duration" 
                        fill="#D4FF90" 
                        radius={[4, 4, 0, 0]}
                        name="Durée (min)"
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#38383A" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#8E8E93" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#8E8E93" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#2C2C2E', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#D4FF90' }}
                        formatter={(value: number) => [
                          `${value} ${chartType === 'weight' ? 'kg' : 'kg total'}`,
                          chartType === 'weight' ? 'Charge' : 'Volume'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={chartType}
                        stroke="#D4FF90" 
                        strokeWidth={3}
                        dot={{ fill: '#D4FF90', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#D4FF90' }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="px-5">
            <div className="grid grid-cols-3 gap-3">
              {isCardio ? (
                <>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity size={14} className="text-[#D4FF90]" />
                      <span className="text-[11px] text-[#8E8E93]">Sessions</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {stats.workoutCount}
                    </p>
                  </div>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={14} className="text-[#32D74B]" />
                      <span className="text-[11px] text-[#8E8E93]">Total</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {exercisePerformances.reduce((sum, p) => sum + (p.duration || 0), 0)}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">minutes</p>
                  </div>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart3 size={14} className="text-[#FF9F0A]" />
                      <span className="text-[11px] text-[#8E8E93]">Moyenne</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {Math.round(exercisePerformances.reduce((sum, p) => sum + (p.duration || 0), 0) / exercisePerformances.length)}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">min/séance</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Trophy size={14} className="text-[#D4FF90]" />
                      <span className="text-[11px] text-[#8E8E93]">Max</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {stats.maxWeight}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">kg</p>
                  </div>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart3 size={14} className="text-[#32D74B]" />
                      <span className="text-[11px] text-[#8E8E93]">Volume</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {(stats.totalVolume / 1000).toFixed(1)}k
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">kg total</p>
                  </div>
                  <div className="bg-[#1C1C1E] rounded-2xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={14} className="text-[#FF9F0A]" />
                      <span className="text-[11px] text-[#8E8E93]">Records</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {stats.prCount}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">PRs</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : selectedExercise ? (
        // Empty state
        <div className="mx-5 mt-8">
          <div className="bg-[#1C1C1E] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-[#8E8E93]" />
            </div>
            <p className="text-[17px] text-white font-medium mb-1">
              Aucune donnée
            </p>
            <p className="text-[15px] text-[#8E8E93]">
              Enregistrez des performances pour cet exercice pour voir votre progression.
            </p>
          </div>
        </div>
      ) : null}
      
      {/* Exercise Selector Modal */}
      <Dialog open={showExerciseSelector} onOpenChange={setShowExerciseSelector}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Choisir un exercice
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
              <div key={category}>
                <h3 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-2 px-1">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </h3>
                <div className="bg-[#2C2C2E] rounded-xl overflow-hidden">
                  {categoryExercises.map((exercise, index) => (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseSelector(false);
                      }}
                      className={cn(
                        'w-full text-left p-4 text-[17px] text-white card-hover',
                        index !== categoryExercises.length - 1 && 'border-b border-[#38383A]'
                      )}
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
