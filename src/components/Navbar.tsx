import React from 'react';
import {
  Compass,
  Sparkles,
  Layers,
  BarChart3,
  Home,
  CheckSquare,
  Bot,
  Settings,
  Flame,
  Menu,
  X,
  Mic,
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  profile: UserProfile;
  onOpenAICoach: () => void;
  onOpenSettings: () => void;
  pendingAssignmentsCount: number;
  companionsEnabled?: boolean;
  onToggleCompanions?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  profile,
  onOpenAICoach,
  onOpenSettings,
  pendingAssignmentsCount,
  companionsEnabled = true,
  onToggleCompanions,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'skill-studio', label: 'Skill Studio', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'explore', label: 'Explore', icon: <Compass className="w-4 h-4" /> },
    { id: 'mba-hub', label: 'MBA Hub', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'assignments',
      label: 'Planner',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : undefined,
    },
    { id: 'my-growth', label: 'My Growth', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectTab('home')}>
            <div className="relative w-10 h-10 rounded-2xl bg-cobalt-600 text-white flex items-center justify-center border-2 border-ink-900 shadow-pop-sm transform transition-transform group-hover:scale-105 group-hover:rotate-[-2deg] active:scale-95">
              <span className="font-display font-black text-lg tracking-tight">GL</span>
              {/* Mini Pop Dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-honey-400 border border-ink-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg sm:text-xl text-ink-900 tracking-tight">
                  The Growth Lab
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-300 text-ink-900 border-2 border-ink-900 shadow-pop-sm rotate-[-1deg]">
                  ★ Studio
                </span>
              </div>
              <p className="text-[11px] text-ink-500 font-semibold tracking-wide hidden sm:block">
                Learn · Think · Create · Grow
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-cream-100 p-1.5 rounded-2xl border-2 border-cream-200/80 shadow-soft">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-cobalt-700 border-2 border-ink-900 shadow-pop-sm font-extrabold translate-y-[-1px]'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-white/80'
                  }`}
                >
                  <span className={isActive ? 'text-cobalt-600' : 'text-ink-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="w-5 h-5 rounded-full bg-pink-500 border border-ink-900 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mochi & Piko Companion Switch */}
            {onToggleCompanions && (
              <button
                onClick={onToggleCompanions}
                title={companionsEnabled ? 'Mochi & Piko are active! Click to let them nap' : 'Mochi & Piko are napping. Click to wake them'}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border-2 border-ink-900 transition-all ${
                  companionsEnabled
                    ? 'bg-pink-100 text-pink-900 shadow-pop-sm hover:scale-105'
                    : 'bg-cream-200 text-ink-500 hover:text-ink-900'
                }`}
              >
                <span>🐾</span>
                <span>{companionsEnabled ? 'Mochi & Piko' : 'Resting'}</span>
              </button>
            )}

            {/* Streak Counter */}
            <div
              title={`${profile.streakDays} day practice streak!`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-300 text-ink-950 font-black text-xs border-2 border-ink-900 shadow-pop-sm cursor-pointer hover-wiggle transition-all"
              onClick={() => onSelectTab('my-growth')}
            >
              <Flame className="w-4 h-4 fill-amber-600 text-amber-600" />
              <span>{profile.streakDays}d streak</span>
            </div>

            {/* AI Coach Button */}
            <button
              onClick={onOpenAICoach}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cobalt-600 text-white hover:bg-cobalt-700 border-2 border-ink-900 shadow-pop-sm transition-all text-xs font-black active:scale-95 hover-wiggle"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              title="Settings & Personalization"
              className="w-9 h-9 rounded-xl bg-white border-2 border-cream-200 flex items-center justify-center text-ink-600 hover:text-ink-900 hover:border-ink-900 hover:shadow-pop-sm transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar */}
            <button
              onClick={() => onSelectTab('my-growth')}
              className="w-9 h-9 rounded-xl bg-ink-900 text-white font-extrabold text-xs flex items-center justify-center border-2 border-ink-900 shadow-pop-sm hover:scale-105 transition-all"
              title={`${profile.name} — ${profile.degree}`}
            >
              CB
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ink-700 hover:bg-cream-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-white px-4 pt-3 pb-6 space-y-1 shadow-soft-lg animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-semibold ${
                activeTab === item.id
                  ? 'bg-cobalt-600 text-white font-bold'
                  : 'text-ink-700 hover:bg-cream-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-cobalt-100 text-cobalt-700 text-xs font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-ink-500 px-2">
            <span>Signed in as Charu Bansal</span>
            <span className="font-semibold text-cobalt-600">{profile.year}</span>
          </div>
        </div>
      )}
    </header>
  );
};
