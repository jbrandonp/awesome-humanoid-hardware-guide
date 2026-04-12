import { Home, Stethoscope, BarChart3, Bed, CreditCard, ShoppingCart, Image } from 'lucide-react';

export type ViewType = 'consultation' | 'dashboard' | 'imaging' | 'bed-management' | 'smart-card' | 'procurement';

interface NavigationBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function NavigationBar({ activeView, onViewChange }: NavigationBarProps) {
  const navItems = [
    { id: 'consultation' as ViewType, label: 'Consultation', icon: Stethoscope },
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: BarChart3 },
    { id: 'imaging' as ViewType, label: 'Imagerie', icon: Image },
    { id: 'bed-management' as ViewType, label: 'Gestion Lits', icon: Bed },
    { id: 'smart-card' as ViewType, label: 'Carte Santé', icon: CreditCard },
    { id: 'procurement' as ViewType, label: 'Approvisionnement', icon: ShoppingCart },
  ];

  return (
    <nav className="flex items-center gap-2 p-3 bg-medical-surface border-b border-medical-border shadow-sm">
      <div className="flex items-center gap-2 mr-4">
        <Home className="w-5 h-5 text-medical-primary" />
        <span className="font-bold text-lg">Système de Santé Résilient</span>
      </div>
      <div className="flex gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive 
                ? 'bg-medical-primary text-white' 
                : 'bg-medical-surface hover:bg-medical-border text-slate-300 hover:text-white'}`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}