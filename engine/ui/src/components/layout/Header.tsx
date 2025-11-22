import { Search, Bell, Settings, User, Sun, Moon, ChevronDown } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  projectPath?: string;
  projectName?: string;
  onRefresh?: () => void;
  onOpenProject?: () => void;
  onNewProject?: () => void;
  onCloseProject?: () => void;
  isLoading?: boolean;
  onToggleNotifications?: () => void;
  notificationCount?: number;
}

export function Header({
  onToggleNotifications,
  notificationCount = 0
}: HeaderProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();

  // ... (useEffect)

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // ... (window controls)

  return (
    <header
      className="flex h-14 items-center justify-between bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-4 transition-all duration-300"
      data-tauri-drag-region
    >
      {/* ... (Left Section) */}

      {/* ... (Center Section) */}

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center justify-end gap-2 w-1/3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all hover-scale"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleNotifications}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all hover-scale relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>

        <button
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all hover-scale"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-2" />

        <button
          className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
          aria-label="User profile"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
            ZC
          </div>
          <span className="text-xs font-medium text-gray-300 group-hover:text-white">Admin</span>
          <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}
