import { useState } from 'react';
import { User, Bell, Scale, Globe, Trash2, LogOut, Crown, ChevronRight, Lock, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { User as UserType } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  action?: () => void;
  showChevron?: boolean;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  value?: string;
  danger?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

interface SettingsPageProps {
  user: UserType | null;
  onCreateUser: (name: string, email: string) => void;
  onUpdateUser: (updates: Partial<UserType>) => void;
  onDeleteUser: () => void;
  onClearData: () => void;
}

export function SettingsPage({ user, onCreateUser, onUpdateUser, onDeleteUser, onClearData }: SettingsPageProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showClearData, setShowClearData] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  // Settings states (would be persisted in real app)
  const [notifications, setNotifications] = useState(true);
  const [useLbs, setUseLbs] = useState(false);
  
  const handleSaveProfile = () => {
    if (name.trim()) {
      onUpdateUser({ name: name.trim(), email: email.trim() });
      setShowEditProfile(false);
    }
  };
  
  const handleCreateProfile = () => {
    if (newName.trim() && newEmail.trim()) {
      onCreateUser(newName.trim(), newEmail.trim());
      setShowCreateProfile(false);
    }
  };
  
  const handleClearData = () => {
    onClearData();
    setShowClearData(false);
  };
  
  const handleDeleteAccount = () => {
    onDeleteUser();
    setShowDeleteAccount(false);
  };
  
  // Settings sections
  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Profil',
      items: [
        {
          icon: User,
          label: 'Modifier le profil',
          action: () => setShowEditProfile(true),
          showChevron: true,
        },
        {
          icon: Lock,
          label: 'Changer le mot de passe',
          action: () => {},
          showChevron: true,
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          toggle: notifications,
          onToggle: setNotifications,
        },
        {
          icon: Scale,
          label: 'Unités',
          value: useLbs ? 'Livres (lbs)' : 'Kilogrammes (kg)',
          action: () => setUseLbs(!useLbs),
          showChevron: true,
        },
        {
          icon: Globe,
          label: 'Langue',
          value: 'Français',
          action: () => {},
          showChevron: true,
        },
      ],
    },
    {
      title: 'Données',
      items: [
        {
          icon: FileSpreadsheet,
          label: 'Exporter les données',
          action: () => {
            // Export data as JSON
            const data = localStorage.getItem('fittrack_performances');
            if (data) {
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'fittrack-data.json';
              a.click();
            }
          },
          showChevron: true,
        },
        {
          icon: Trash2,
          label: 'Supprimer l\'historique',
          action: () => setShowClearData(true),
          showChevron: true,
          danger: true,
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: LogOut,
          label: 'Déconnexion',
          action: () => onDeleteUser(),
          showChevron: true,
          danger: true,
        },
      ],
    },
  ];
  
  return (
    <div className="page-enter pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-[34px] font-bold text-white leading-tight">
          Réglages
        </h1>
        <p className="text-[15px] text-[#8E8E93] mt-1">
          Gérez votre compte et vos préférences
        </p>
      </header>
      
      {/* Profile Card */}
      <div className="px-5 mb-6">
        {user ? (
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 glass-elevated glass-highlight shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4FF90] to-[#32D74B] flex items-center justify-center shadow-lg">
      <span className="text-2xl font-bold text-black">
        {user.name.charAt(0).toUpperCase()}
      </span>
    </div>
    <div className="flex-1">
      <p className="text-[20px] font-semibold text-white">{user.name}</p>
      <p className="text-[15px] text-white/60">{user.email}</p>
    </div>
  </div>
</div>
        ) : (
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 glass-elevated glass-highlight shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
      <User size={28} className="text-white/60" />
    </div>
    <div className="flex-1">
      <p className="text-[17px] text-white font-medium mb-1">Pas de compte</p>
      <p className="text-[15px] text-white/60 mb-3">
        Créez un compte pour sauvegarder vos données
      </p>
      <Button
        onClick={() => setShowCreateProfile(true)}
        className="h-9 px-4 rounded-xl bg-[#D4FF90]/90 text-black hover:bg-[#D4FF90] font-medium btn-press shadow-md"
      >
        Créer un compte
      </Button>
    </div>
  </div>
</div>
        )}
      </div>
      
      {/* Premium Banner */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-r from-[#D4FF90] to-[#32D74B] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={24} className="text-black" />
            <span className="text-[17px] font-bold text-black">FitTrack Pro</span>
          </div>
          <p className="text-[15px] text-black/80 mb-3">
            Historique illimité, graphiques avancés,
programmes personnalisés et export des données.
          </p>
          <button className="h-10 px-4 bg-black text-white rounded-xl text-[15px] font-medium btn-press">
            Passer à Pro - Arrive Bientôt
          </button>
        </div>
      </div>
      <p className="px-5 mt-4 text-center text-[12px] text-white/50">
  Abonnement mensuel ou annuel. Annulable à tout moment depuis l’App Store.
</p>

      {/* Settings Groups */}
      <div className="px-5 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h2 className="text-[13px] font-medium text-white/50 uppercase tracking-wide mb-2 px-1">
              {group.title}
            </h2>
            <div className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/10 glass-elevated glass-highlight shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div
  key={itemIndex}
  onClick={('toggle' in item) ? undefined : item.action}
  className={cn(
    'flex items-center justify-between p-4 transition-colors hover:bg-white/5 active:bg-white/10',
    !('toggle' in item) && 'cursor-pointer',
    itemIndex !== group.items.length - 1 && 'border-b border-white/10'
  )}
>
                    <div className="flex items-center justify-between p-4 transition-colors hover:bg-white/5 active:bg-white/10">
                      <Icon 
                        size={20} 
                        className={cn(
                          item.danger ? 'text-[#FF453A]' : 'text-[#8E8E93]'
                        )} 
                      />
                      <span className={cn(
                        'text-[17px]',
                        item.danger ? 'text-[#FF453A]' : 'text-white/50'
                      )}>
                        {item.label}
                      </span>
                    </div>
                    
                    {'toggle' in item ? (
                      <div onClick={(e) => e.stopPropagation()}>
  <Switch 
    checked={item.toggle} 
    onCheckedChange={item.onToggle}
    className="data-[state=checked]:bg-[#D4FF90]"
  />
</div>
                    ) : 'value' in item ? (
                      <button 
                        onClick={item.action}
                        className="flex items-center gap-2 text-[15px] text-white/50"
                      >
                        {item.value}
                        {item.showChevron && <ChevronRight size={18} className="text-white/50" />}
                      </button>
                    ) : item.showChevron ? (
                      <button onClick={item.action}>
                        <ChevronRight size={20} className="text-white/50" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit Profile Modal */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Modifier le profil
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Nom</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white focus-visible:ring-[#D4FF90]"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white focus-visible:ring-[#D4FF90]"
              />
            </div>
            
            <Button
              onClick={handleSaveProfile}
              disabled={!name.trim()}
              className="w-full h-14 rounded-xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] btn-press mt-6 disabled:opacity-50"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Create Profile Modal */}
      <Dialog open={showCreateProfile} onOpenChange={setShowCreateProfile}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Créer un compte
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Nom</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Votre nom"
                className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white focus-visible:ring-[#D4FF90]"
              />
            </div>
            <div>
              <label className="text-[13px] text-[#8E8E93] mb-1.5 block">Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="votre@email.com"
                className="h-12 bg-[#2C2C2E] border-0 rounded-xl text-white focus-visible:ring-[#D4FF90]"
              />
            </div>
            
            <Button
              onClick={handleCreateProfile}
              disabled={!newName.trim() || !newEmail.trim()}
              className="w-full h-14 rounded-xl font-semibold text-[17px] bg-[#D4FF90] text-black hover:bg-[#c5f082] btn-press mt-6 disabled:opacity-50"
            >
              Créer le compte
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Clear Data Confirmation */}
      <Dialog open={showClearData} onOpenChange={setShowClearData}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Supprimer l'historique ?
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-[15px] text-[#8E8E93] mt-2">
            Cette action supprimera toutes vos performances enregistrées. Cette action est irréversible.
          </p>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowClearData(false)}
              className="flex-1 h-12 rounded-xl font-medium text-[17px] bg-[#2C2C2E] text-white hover:bg-[#38383A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleClearData}
              className="flex-1 h-12 rounded-xl font-medium text-[17px] bg-[#FF453A] text-white hover:bg-[#ff5a4f]"
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Confirmation */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="bg-[#1C1C1E] border-[#38383A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Supprimer le compte ?
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-[15px] text-[#8E8E93] mt-2">
            Cette action supprimera définitivement votre compte et toutes vos données.
          </p>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowDeleteAccount(false)}
              className="flex-1 h-12 rounded-xl font-medium text-[17px] bg-[#2C2C2E] text-white hover:bg-[#38383A]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 h-12 rounded-xl font-medium text-[17px] bg-[#FF453A] text-white hover:bg-[#ff5a4f]"
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
