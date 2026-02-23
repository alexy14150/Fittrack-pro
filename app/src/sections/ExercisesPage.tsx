import { useState, useMemo } from 'react';
import { Plus, ChevronRight, X, Clock, Weight, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Exercise, ExerciseCategory, Performance } from '@/types';
import { CATEGORY_LABELS } from '@/types';

interface ExercisesPageProps {
  exercises: Exercise[];
  performances: Performance[];
  onAddExercise: (name: string, category: ExerciseCategory) => void;
  onAddPerformance: (performance: Omit<Performance, 'id'>) => void;
}

export function ExercisesPage({ exercises, performances, onAddExercise, onAddPerformance }: ExercisesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<ExerciseCategory>('chest');
  
  // Form states for performance
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  
  // Filter and group exercises
  const groupedExercises = useMemo(() => {
    const filtered = searchQuery 
      ? exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : exercises;
    
    const grouped: Record<string, Exercise[]> = {};
    filtered.forEach(exercise => {
      if (!grouped[exercise.category]) {
        grouped[exercise.category] = [];
      }
      grouped[exercise.category].push(exercise);
    });
    return grouped;
  }, [exercises, searchQuery]);
  
  // Get last performance for an exercise
  const getLastPerformance = (exerciseId: string) => {
    return performances
      .filter(p => p.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };
  
  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    const lastPerf = getLastPerformance(exercise.id);
    if (lastPerf) {
      setSets(lastPerf.sets?.toString() || '');
      setReps(lastPerf.reps?.toString() || '');
      setWeight(lastPerf.weight?.toString() || '');
      setDuration(lastPerf.duration?.toString() || '');
      setDistance(lastPerf.distance?.toString() || '');
    } else {
      setSets('');
      setReps('');
      setWeight('');
      setDuration('');
      setDistance('');
    }
  };
  
  const handleSavePerformance = () => {
    if (!selectedExercise) return;
    
    const today = new Date().toISOString().split('T')[0];
    const performance: Omit<Performance, 'id'> = {
      exerciseId: selectedExercise.id,
      sessionId: '',
      date: today,
      sets: sets ? parseInt(sets) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      distance: distance ? parseFloat(distance) : undefined,
    };
    
    onAddPerformance(performance);
    setSelectedExercise(null);
  };
  
  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      onAddExercise(newExerciseName.trim(), newExerciseCategory);
      setNewExerciseName('');
      setShowAddExercise(false);
    }
  };
  
  const isCardio = selectedExercise?.category === 'cardio';
  
  return (
    <div className="page-enter pb-[160px]">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[34px] font-bold text-white leading-tight">
          Exercices
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">
          Enregistrez vos performances
        </p>
      </header>
      
      {/* Search Bar */}
<div className="px-5 mb-4">
  <div className="relative">


    <Input
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Rechercher un exercice..."
      className="h-11 pl-12 pr-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder:text-white/40 focus-visible:ring-[#D4FF90]"
    />

    {/* Bouton clear glass */}
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight btn-press hover:bg-white/15 transition-colors"
      >
        <X size={16} className="text-white/70" />
      </button>
    )}

  </div>
</div>

      
      {/* Exercise List */}
      <div className="px-5 stagger-children">
        {Object.entries(groupedExercises).map(([category, categoryExercises]) => (
          <div key={category} className="mb-6">
            <h2 className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide mb-2 px-1">
              {CATEGORY_LABELS[category as ExerciseCategory]}
            </h2>
            <div className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight">
              {categoryExercises.map((exercise, index) => {
                const lastPerf = getLastPerformance(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleExerciseClick(exercise)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 text-left btn-press transition-colors hover:bg-white/5 active:bg-white/10',
                      index !== categoryExercises.length - 1 && 'border-b border-white/10'
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-[17px] text-white font-medium">
                        {exercise.name}
                      </p>
                      {lastPerf && (
                        <p className="text-[13px] text-[#8E8E93] mt-0.5">
                          {lastPerf.weight && `${lastPerf.weight}kg `}
                          {lastPerf.sets && `${lastPerf.sets}x${lastPerf.reps} `}
                          {lastPerf.duration && `${lastPerf.duration}min`}
                          <span className="text-[#636366]"> • Dernier</span>
                        </p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-white/40" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Exercise Button */}
<div className="fixed bottom-[110px] left-0 right-0 px-5 z-50">

  <Button
    onClick={() => setShowAddExercise(true)}
    className="w-full h-15 rounded-2xl font-semibold text-[17px] text-white bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.4)] btn-press hover:bg-white/15 transition-colors"
  >
    <Plus size={22} className="mr-2 text-[#D4FF90]" />
    Ajouter un exercice
  </Button>
</div>

      
      {/* Exercise Detail Modal */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {selectedExercise?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {isCardio ? (
              // Cardio inputs
              <>
                <div>
                  <label className="text-[13px] text-[#8E8E93] mb-1.5 block flex items-center gap-2">
                    <Clock size={14} />
                    Durée (minutes)
                  </label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white text-lg font-mono focus-visible:ring-[#D4FF90]"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#8E8E93] mb-1.5 block flex items-center gap-2">
                    <Activity size={14} />
                    Distance (km)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="5.0"
                    className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white text-lg font-mono focus-visible:ring-[#D4FF90]"
                  />
                </div>
              </>
            ) : (
              // Strength inputs
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Séries</label>
                    <Input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      placeholder="3"
                      className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white text-lg font-mono text-center focus-visible:ring-[#D4FF90]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Répétitions</label>
                    <Input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      placeholder="10"
                      className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white text-lg font-mono text-center focus-visible:ring-[#D4FF90]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] text-[#8E8E93] mb-1.5 block flex items-center gap-1">
                      <Weight size={12} />
                      kg
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="50"
                      className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white text-lg font-mono text-center focus-visible:ring-[#D4FF90]"
                    />
                  </div>
                </div>
              </>
            )}
            
            <Button
              onClick={handleSavePerformance}
              className="w-full h-14 rounded-xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] btn-press mt-6"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Exercise Modal */}
      <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Nouvel exercice
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Nom de l'exercice</label>
              <Input
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Ex: Curl alterné"
                className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white focus-visible:ring-[#D4FF90]"
              />
            </div>
            
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Catégorie</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewExerciseCategory(cat)}
                    className={cn(
                      'h-11 rounded-xl text-[15px] font-medium transition-colors',
                      newExerciseCategory === cat
                        ? 'bg-[#D4FF90] text-black'
                        : 'bg-[#2C2C2E] text-white'
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleAddExercise}
              disabled={!newExerciseName.trim()}
              className="w-full h-14 rounded-xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] btn-press mt-6 disabled:opacity-50"
            >
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
