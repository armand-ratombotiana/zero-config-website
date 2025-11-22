import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentTheme: 'light' | 'dark'; // The actual applied theme (resolved from system)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('zeroconfig_theme');
        return (saved as Theme) || 'dark'; // Default to dark
    });

    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        let appliedTheme: 'light' | 'dark' = 'dark';

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            appliedTheme = systemTheme;
        } else {
            appliedTheme = theme;
        }

        root.classList.add(appliedTheme);
        root.setAttribute('data-theme', appliedTheme);
        setCurrentTheme(appliedTheme);
        localStorage.setItem('zeroconfig_theme', theme);

    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const newTheme = mediaQuery.matches ? 'dark' : 'light';
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            setCurrentTheme(newTheme);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
