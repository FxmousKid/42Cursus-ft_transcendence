import { Trophy, Users, Settings, BarChart2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface ProfileNavigationProps {
  activeSection: string;
  pendingRequestsCount: number;
  onChange: (sectionId: string) => void;
}

const ProfileNavigation = ({ activeSection, pendingRequestsCount, onChange }: ProfileNavigationProps) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      id: 'matches',
      label: 'Matchs',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      id: 'friends',
      label: 'Amis',
      icon: <Users className="h-4 w-4" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex justify-center max-w-6xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-1.5 flex gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "relative flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-medium",
              activeSection === item.id
                ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white"
                : "text-white/60 hover:text-white/90 hover:bg-white/5"
            )}
          >
            <span className={cn(
              "transition-colors",
              activeSection === item.id ? "text-blue-400" : "text-white/60"
            )}>
              {item.icon}
            </span>
            <span>{item.label}</span>
            
            {item.badge && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-medium bg-blue-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
            
            {activeSection === item.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-gray-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileNavigation; 