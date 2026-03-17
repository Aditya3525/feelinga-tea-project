'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { AppProviderProps, ThemeContextValue, ThemeMode } from '../types/app';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: AppProviderProps) {
    const [theme, setTheme] = useState<ThemeMode>('light');

    useEffect(() => {
        const saved = (localStorage.getItem('feelinga_theme') || 'light') as ThemeMode;
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
    }, []);

    const toggleTheme = () => {
        const next: ThemeMode = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('feelinga_theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
