import { useState } from 'react';
import { User, Mail, ArrowRight, Dumbbell, TrendingUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OnboardingPageProps {
  onCreateUser: (name: string, email: string) => void;
}

export function OnboardingPage({ onCreateUser }: OnboardingPageProps) {
  const [step, setStep] = useState<'welcome' | 'create'>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleCreate = () => {
    if (name.trim() && email.trim()) {
      onCreateUser(name.trim(), email.trim());
    }
  };

  if (step === 'create') {
    return (
      <div
        className="min-h-screen flex flex-col px-6"
        style={{
          background: 'linear-gradient(180deg,#120B20 0%,#1A1233 45%,#261A44 100%)',
          paddingTop: 'calc(env(safe-area-inset-top) + 48px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        }}
      >
        {/* Back */}
        <button
          onClick={() => setStep('welcome')}
          className="text-[15px] text-[#D4FF90] mb-10 text-left w-fit"
        >
          ← Retour
        </button>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-[34px] font-bold text-white leading-tight mb-2">
            Créer un compte
          </h1>
          <p className="text-[15px] text-white/50">
            Vos données sont sauvegardées localement.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[13px] text-white/50 mb-1.5 block uppercase tracking-wide">
              Nom
            </label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 z-10" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre prénom"
                style={{
                  background: '#2C2C2E',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  height: '56px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  fontSize: '17px',
                  width: '100%',
                  outline: 'none',
                  WebkitTextFillColor: '#FFFFFF',
                }}
                className="placeholder:text-white/30 focus:border-[#D4FF90]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] text-white/50 mb-1.5 block uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                style={{
                  background: '#2C2C2E',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  height: '56px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  fontSize: '17px',
                  width: '100%',
                  outline: 'none',
                  WebkitTextFillColor: '#FFFFFF',
                }}
                className="placeholder:text-white/30 focus:border-[#D4FF90]/50"
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || !email.trim()}
          className="w-full h-14 rounded-2xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] disabled:opacity-40 disabled:cursor-not-allowed mt-8"
        >
          Commencer
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg,#120B20 0%,#1A1233 45%,#261A44 100%)',
        paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
      }}
    >
      {/* Top logo */}
      <div className="px-6 pt-8 pb-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#D4FF90] to-[#32D74B] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(212,255,144,0.3)]">
          <Dumbbell size={38} className="text-black" />
        </div>
        <h1 className="text-[38px] font-extrabold text-white tracking-tight leading-tight">
          FitTrack <span className="text-[#D4FF90]">Pro</span>
        </h1>
        <p className="text-[16px] text-white/50 mt-2">
          Votre coach de musculation intelligent
        </p>
      </div>

      {/* Features */}
      <div className="px-6 flex-1 space-y-3 mt-4">
        {[
          {
            icon: Dumbbell,
            title: 'Suivi des performances',
            desc: 'Enregistrez chaque séance et suivez vos progrès.',
          },
          {
            icon: TrendingUp,
            title: 'Analyse avancée',
            desc: 'Graphiques, records personnels et projections.',
          },
          {
            icon: Brain,
            title: 'Coach IA',
            desc: 'Recommandations personnalisées basées sur vos données.',
          },
        ].map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-4 bg-white/6 border border-white/8 rounded-2xl px-4 py-4"
            >
              <div className="w-11 h-11 rounded-xl bg-[#D4FF90]/15 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[#D4FF90]" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">{f.title}</p>
                <p className="text-[13px] text-white/45 mt-0.5">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="px-6 mt-8 space-y-3">
        <Button
          onClick={() => setStep('create')}
          className="w-full h-14 rounded-2xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] flex items-center justify-center gap-2"
        >
          Créer un compte
          <ArrowRight size={18} />
        </Button>
        <p className="text-center text-[12px] text-white/30">
          Données stockées localement sur votre appareil.
        </p>
      </div>
    </div>
  );
}
