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
  
  const projection = useMemo(() => {
  if (exercisePerformances.length < 3) return null;

  const weights = exercisePerformances.map(p => p.weight || 0);
  const first = weights[0];
  const last = weights[weights.length - 1];

  const delta = last - first;
  const weeks = exercisePerformances.length / 2; // approx
  const weeklyProgress = delta / weeks;

  if (weeklyProgress <= 0) return null;

  const target = last + 10; // +10kg projection
  const weeksToTarget = Math.ceil((target - last) / weeklyProgress);

  return {
    weeklyProgress: weeklyProgress.toFixed(2),
    target,
    weeksToTarget,
  };
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
    workoutCount: exercisePerformances.length,
  };
}, [exercisePerformances]);

// Analyse intelligente (à mettre JUSTE ici, pas dans stats)
const insights = useMemo(() => {
  if (!selectedExercise || exercisePerformances.length < 2) {
    return {
      trendLabel: "Pas assez de données",
      trendDetail: "Ajoute au moins 2 séances pour voir une analyse.",
      last7Count: 0,
      advice: "Enregistre tes séances pour débloquer les insights.",
    };
  }

  const first = exercisePerformances[0];
  const last = exercisePerformances[exercisePerformances.length - 1];

  const firstW = first.weight || 0;
  const lastW = last.weight || 0;
  const deltaWeight = lastW - firstW;

  const last3 = exercisePerformances.slice(-3).map(p => p.weight || 0);
  const isStagnating =
    last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2];

  let trendLabel = "En progression";
  let trendDetail =
    deltaWeight >= 0 ? `+${deltaWeight} kg sur la période` : `${deltaWeight} kg sur la période`;

  if (isStagnating) {
    trendLabel = "Stagnation détectée";
    trendDetail = "3 dernières séances au même poids";
  } else if (deltaWeight < 0) {
    trendLabel = "En baisse";
    trendDetail = `${deltaWeight} kg sur la période`;
  }

  const now = new Date();
  const last7Count = exercisePerformances.filter(p => {
    const d = parseISO(p.date);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const advice = isStagnating
    ? "Astuce : change le rep-range (ex: 8-10) ou ajoute 1 série pendant 2 semaines."
    : deltaWeight > 0
      ? "Continue : essaie +2,5 kg quand tu valides tes reps."
      : "Repars propre : garde le même poids et vise +1 rep par série.";

  return { trendLabel, trendDetail, last7Count, advice };
}, [selectedExercise, exercisePerformances]);

  
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
          className="w-full h-14 rounded-2xl flex items-center justify-between px-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight btn-press hover:bg-white/15 transition-colors"
        >
          <span className={cn(
            'text-[17px]',
            selectedExercise ? 'text-white font-medium' : 'text-[#8E8E93]'
          )}>
            {selectedExercise?.name || 'Sélectionner un exercice'}
          </span>
          <ChevronDown size={20} className="text-white/60" />
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
  'h-8 px-4 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-xl',
  timeFilter === filter.id
    ? 'bg-[#D4FF90]/90 text-black shadow-[0_10px_25px_rgba(212,255,144,0.18)]'
    : 'bg-white/8 border border-white/10 text-white/60 hover:bg-white/15'
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
            <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
              {/* Chart Type Toggle */}
              {!isCardio && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setChartType('weight')}
                    className={cn(
  'h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 backdrop-blur-xl',
  chartType === 'weight'
    ? 'bg-[#D4FF90]/90 text-black shadow-[0_10px_25px_rgba(212,255,144,0.18)]'
    : 'bg-white/8 border border-white/10 text-white/60 hover:bg-white/15'
)}
                  >
                    Charge
                  </button>
                  <button
                    onClick={() => setChartType('volume')}
                    className={cn(
  'h-8 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 backdrop-blur-xl',
  chartType === 'volume'
    ? 'bg-[#D4FF90]/90 text-black shadow-[0_10px_25px_rgba(212,255,144,0.18)]'
    : 'bg-white/8 border border-white/10 text-white/60 hover:bg-white/15'
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" vertical={false} />
                      <XAxis 
  dataKey="date" 
  stroke="rgba(255,255,255,0.45)" 
  fontSize={11}
  tickLine={false}
  axisLine={false}
/>
<YAxis 
  stroke="rgba(255,255,255,0.45)" 
  fontSize={11}
  tickLine={false}
  axisLine={false}
/>
                      <Tooltip
  contentStyle={{
    backgroundColor: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
  }}
  labelStyle={{ color: 'rgba(255,255,255,0.70)' }}
  itemStyle={{ color: '#D4FF90' }}
  formatter={(value: number) => [`${value} min`, 'Durée']}
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(255,255,255,0.45)" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.45)" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                     <Tooltip
  contentStyle={{
    backgroundColor: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
  }}
  labelStyle={{ color: 'rgba(255,255,255,0.70)' }}
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
                        dot={{ fill: '#D4FF90', stroke: 'rgba(0,0,0,0)', r: 3 }}
activeDot={{ r: 5, fill: '#D4FF90' }}
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
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Activity size={14} className="text-[#D4FF90]" />
                      <span className="text-[11px] text-[#8E8E93]">Sessions</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {stats.workoutCount}
                    </p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={14} className="text-[#32D74B]" />
                      <span className="text-[11px] text-[#8E8E93]">Total</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {exercisePerformances.reduce((sum, p) => sum + (p.duration || 0), 0)}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">minutes</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
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
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Trophy size={14} className="text-[#D4FF90]" />
                      <span className="text-[11px] text-[#8E8E93]">Max</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {stats.maxWeight}
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">kg</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart3 size={14} className="text-[#32D74B]" />
                      <span className="text-[11px] text-[#8E8E93]">Volume</span>
                    </div>
                    <p className="text-[22px] font-bold text-white font-mono">
                      {(stats.totalVolume / 1000).toFixed(1)}k
                    </p>
                    <p className="text-[10px] text-[#8E8E93]">kg total</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
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
          {/* Analyse intelligente */}
<div className="px-5 mt-6">
  <div className="rounded-2xl p-5 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
    <p className="text-[13px] text-[#8E8E93] mb-2 uppercase tracking-wide">
      Analyse intelligente
    </p>

    <p className="text-[18px] font-semibold text-white mb-1">
      {insights.trendLabel}
    </p>

    <p className="text-[14px] text-[#8E8E93] mb-3">
      {insights.trendDetail}
    </p>

    <div className="h-px bg-white/10 my-3" />

    <p className="text-[14px] text-[#D4FF90] font-medium">
      {insights.advice}
    </p>
  </div>
</div>
        </>
        
      ) : selectedExercise ? (
        
        // Empty state
        <div className="mx-5 mt-8">
          <div className="rounded-2xl p-8 text-center bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
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
      <DialogContent className="!fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 -mt-6 text-white max-w-sm w-[calc(100%-32px)] max-h-[80vh] bg-white/10 backdrop-blur-2xl border border-white/10 glass-elevated glass-highlight shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Choisir un exercice
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
              <div key={category}>
                <h3 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-2 px-1">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </h3>
                <div className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/10">
                  {categoryExercises.map((exercise, index) => (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseSelector(false);
                      }}
                      className={cn(
                        'w-full text-left p-4 text-[17px] text-white/90 btn-press transition-colors hover:bg-white/5 active:bg-white/10',
                        index !== categoryExercises.length - 1 && 'border-b border-white/10'
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
