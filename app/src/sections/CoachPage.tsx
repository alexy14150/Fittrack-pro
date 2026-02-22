import { useState, useMemo } from 'react';
import { TrendingUp, Flame, Trophy, AlertTriangle } from 'lucide-react';
import { parseISO, isSameWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

type Session = { id: string; date: string; completed: boolean };
type Performance = {
  id: string;
  date: string;
  exerciseId: string;
  weight?: number;
  reps?: number;
  sets?: number;
  duration?: number;
};

interface CoachPageProps {
  sessions: Session[];
  performances: Performance[];
}

export function CoachPage({ sessions, performances }: CoachPageProps) {
  const now = new Date();
const todayKey = new Date().toISOString().slice(0, 10);

const [challengeDone, setChallengeDone] = useState(() => {
  const savedDate = localStorage.getItem("fittrack_challenge_done_date");
  return savedDate === todayKey;
});
const validateChallenge = () => {
  setChallengeDone(true);
  localStorage.setItem("fittrack_challenge_done_date", todayKey);
};
  const coach = useMemo(() => {
    // ---- Régularité (sessions sur 7 jours) ----
    const sessions7d = sessions.filter(s => {
      const d = parseISO(s.date);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    // ---- Volume 7 jours (à partir des performances) ----
    const perfs7d = performances.filter(p => {
      const d = parseISO(p.date);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const volume7d = perfs7d.reduce((sum, p) => {
      const w = p.weight || 0;
      const sets = p.sets || 1;
      const reps = p.reps || 1;
      return sum + (w * sets * reps);
    }, 0);

    // ---- Volume semaine précédente ----
    const perfsPrevWeek = performances.filter(p => {
      const d = parseISO(p.date);
      // même semaine -1 : on compare en "week number"
      const inThisWeek = isSameWeek(d, now, { weekStartsOn: 1, locale: fr });
      const inPrevWeek = isSameWeek(d, new Date(now.getTime() - 7 * 86400000), { weekStartsOn: 1, locale: fr });
      return !inThisWeek && inPrevWeek;
    });

    const volumePrev7d = perfsPrevWeek.reduce((sum, p) => {
      const w = p.weight || 0;
      const sets = p.sets || 1;
      const reps = p.reps || 1;
      return sum + (w * sets * reps);
    }, 0);

    const volumeDeltaPct =
      volumePrev7d > 0 ? Math.round(((volume7d - volumePrev7d) / volumePrev7d) * 100) : null;
// ---- Défi du jour (intelligent) ----
const todayStr = now.toISOString().slice(0, 10);
const hasSessionToday = sessions.some(s => s.date === todayStr);

let challengeTitle = "Défi du jour";
let challengeText = "Fais une séance courte aujourd’hui (30–45 min).";
let challengeReward = "+3 points (régularité)";

if (!hasSessionToday) {
  challengeTitle = "Défi du jour : 1 séance";
  challengeText = "Fais au moins 1 séance aujourd’hui pour valider ton streak 🔥";
  challengeReward = "+5 points";
} else {
  challengeTitle = "Défi bonus : 1 PR";
  challengeText = "Tente un mini record : +1 rep ou +2,5 kg 💪";
  challengeReward = "+3 points";
}

const challengeStatus = challengeDone ? "validé" : "à faire";

if (hasSessionToday) {
  challengeText = "Bravo ✅ Ajoute 10 min de marche ou 5 min d’étirements.";
  challengeReward = "+1 point (consistance)";
} else if (sessions7d === 0) {
  challengeText = "Relance : fais une séance facile aujourd’hui (même 20 min).";
  challengeReward = "+5 points (retour)";
} else if (sessions7d < 2) {
  challengeText = "Objectif : fais 1 séance aujourd’hui pour passer à 2/7 jours.";
  challengeReward = "+3 points (régularité)";
} else if (volumeDeltaPct !== null && volumeDeltaPct <= -15) {
  challengeText = "Volume en baisse : fais une séance propre, sans forcer, et note tout.";
  challengeReward = "+2 points (discipline)";
} else if (volumeDeltaPct !== null && volumeDeltaPct >= 15) {
  challengeText = "Gros volume : défi récup — dors tôt + hydrate-toi + protéines.";
  challengeReward = "+2 points (récup)";
} else {
  challengeText = "Défi : sur un exo clé, fais +1 rep sur ta meilleure série.";
  challengeReward = "+3 points (progression)";
}

    // ---- PR / Progression simple ----
    // On regarde si il y a au moins une perf "record" récente (poids max dans les 30 derniers jours)
    const perfs30d = performances.filter(p => {
      const d = parseISO(p.date);
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    const maxAllTime = Math.max(...performances.map(p => p.weight || 0), 0);
    const max30d = Math.max(...perfs30d.map(p => p.weight || 0), 0);
    const isPRRecently = max30d >= maxAllTime && max30d > 0;

    // ---- Score Athlète (0–100) ----
    // Régularité (0–30) : 0 à 4 séances/7j
    const scoreRegularity = Math.min(30, Math.round((sessions7d / 4) * 30));

    // Progression (0–40) : PR récent ou volume en hausse
    let scoreProgress = 0;
    if (isPRRecently) scoreProgress += 25;
    if (volumeDeltaPct !== null && volumeDeltaPct > 0) scoreProgress += 15;
    scoreProgress = Math.min(40, scoreProgress);

    // Volume (0–20) : cap à 50k (ajuste si tu veux)
    const scoreVolume = Math.min(20, Math.round((volume7d / 50000) * 20));

    // Consistance (0–10) : au moins 1 séance et >0 perfs
    const scoreConsistency = (sessions7d > 0 && perfs7d.length > 0) ? 10 : 0;
const challengeBonus = challengeDone ? 5 : 0;
    const score = Math.min(100, scoreRegularity + scoreProgress + scoreVolume + scoreConsistency + challengeBonus);

    const level =
      score >= 85 ? 'Elite' :
      score >= 70 ? 'Avancé' :
      score >= 50 ? 'Intermédiaire' :
      'Rookie';

    // ---- Alerts / Actions (intelligent mais simple) ----
    const alerts: string[] = [];
    if (sessions7d === 0) alerts.push("Aucune séance sur 7 jours : relance une séance facile aujourd’hui.");
    if (volumeDeltaPct !== null && volumeDeltaPct <= -15) alerts.push("Ton volume baisse fortement cette semaine : baisse un peu l’intensité et reviens régulier.");
    if (volumeDeltaPct !== null && volumeDeltaPct >= 15) alerts.push("Gros boost de volume : pense à bien récupérer (sommeil / protéines).");
    if (!isPRRecently && sessions7d >= 2) alerts.push("Pas de record récent : vise +1 rep ou +2,5 kg sur un exo clé.");

    const actions: string[] = [];
    if (sessions7d < 2) actions.push("Objectif : 2 séances minimum cette semaine.");
    if (sessions7d >= 2 && sessions7d < 4) actions.push("Objectif : ajoute 1 petite séance (45 min) pour passer un cap.");
    if (isPRRecently) actions.push("Prochaine séance : garde la même charge et améliore les reps (progression propre).");
    else actions.push("Prochaine séance : choisis 1 exo clé et vise +1 rep OU +2,5 kg.");

   return {
  sessions7d,
  volume7d,
  volumeDeltaPct,
  score,
  level,
  alerts,
  actions,
  isPRRecently,
  challengeTitle,
  challengeText,
  challengeReward,
  challengeStatus,
};

  }, [sessions, performances]);

  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[34px] font-bold text-white leading-tight">Coach</h1>
        <p className="text-[15px] text-white/60 mt-1">Score + analyse + actions</p>
      </header>

      {/* Score Card */}
      <div className="px-5 mb-5">
        <div className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-white/60 uppercase tracking-wide">Score Athlète</p>
              <p className="text-[44px] font-bold text-white leading-none mt-1">{coach.score}</p>
              <p className="text-[14px] text-white/70 mt-2">Niveau : <span className="text-white font-semibold">{coach.level}</span></p>
              <p className="text-[12px] text-white/50 mt-2">
  Bonus défi : <span className="text-[#D4FF90] font-semibold">
    {challengeDone ? "+5" : "+0"}
  </span>
</p>
            </div>
<div className="mt-4">
  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
    <div
      className="h-full rounded-full bg-[#D4FF90]"
      style={{ width: `${coach.score}%` }}
    />
  </div>
  <p className="text-[12px] text-white/50 mt-2">
    Objectif : {coach.score >= 85 ? "Garde le rythme 🔥" : coach.score >= 70 ? "Viser 85+ (Elite)" : "Viser 70+ (Avancé)"}
  </p>
</div>

            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Trophy size={26} className="text-[#D4FF90]" />
            </div>
          </div>

          <div className="h-px bg-white/10 my-4" />

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-[#FF9F0A]" />
                <span className="text-[12px] text-white/60">7 jours</span>
              </div>
              <p className="text-[18px] font-semibold text-white mt-1">{coach.sessions7d}</p>
              <p className="text-[11px] text-white/50">séances</p>
            </div>

            <div className="rounded-2xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#32D74B]" />
                <span className="text-[12px] text-white/60">Volume</span>
              </div>
              <p className="text-[18px] font-semibold text-white mt-1">{Math.round(coach.volume7d / 1000)}k</p>
              <p className="text-[11px] text-white/50">kg total</p>
            </div>

            <div className="rounded-2xl p-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#D4FF90]" />
                <span className="text-[12px] text-white/60">PR</span>
              </div>
              <p className="text-[18px] font-semibold text-white mt-1">{coach.isPRRecently ? 'Oui' : '—'}</p>
              <p className="text-[11px] text-white/50">30 jours</p>
            </div>
          </div>
        </div>
      </div>
{/* Défi du jour */}
<div className="px-5 mb-4">
  <div className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_18px_60px_rgba(0,0,0,0.35)]">

    <p className="text-[13px] text-white/60 uppercase tracking-wide">
      {coach.challengeTitle}
    </p>

    <p className="text-[18px] font-semibold text-white mt-2">
      {coach.challengeText}
    </p>

    <div className="h-px bg-white/10 my-4" />

    <p className="text-[13px] text-[#D4FF90] font-medium">
      Récompense : {coach.challengeReward}
    </p>
<button
  onClick={validateChallenge}
  disabled={challengeDone}
  className={`mt-4 w-full py-2 rounded-xl font-medium transition-all duration-150 ${
    challengeDone
      ? "bg-white/10 text-white/40 cursor-not-allowed"
      : "bg-[#D4FF90] text-black hover:scale-[1.02]"
  }`}
>
  {challengeDone ? "Défi validé ✅" : "Valider le défi"}
</button>
  </div>
</div>

      {/* Alerts */}
      <div className="px-5 mb-4">
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-2 px-1">
          Alertes
        </h2>

        <div className="space-y-3">
          {(coach.alerts.length ? coach.alerts : ["Rien à signaler : continue comme ça."]).map((t, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-[#FF453A]" />
                </div>
                <p className="text-[14px] text-white/80 leading-snug">{t}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5">
        <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-2 px-1">
          Actions recommandées
        </h2>

        <div className="space-y-3">
          {coach.actions.map((t, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
              <p className="text-[14px] text-white/85 leading-snug">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
