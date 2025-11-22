import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import clsx from 'clsx';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center p-1 bg-gray-800/50 rounded-lg border border-white/5">
            <button
                onClick={() => setTheme('light')}
                className={clsx(
                    "p-1.5 rounded-md transition-all",
                    theme === 'light'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                title="Light Mode"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={clsx(
                    "p-1.5 rounded-md transition-all",
                    theme === 'system'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                title="System Preference"
            >
                <Monitor className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={clsx(
                    "p-1.5 rounded-md transition-all",
                    theme === 'dark'
                        ? "bg-gray-700 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                title="Dark Mode"
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    );
}
