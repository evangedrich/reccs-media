'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ViewContext = createContext<{
    showGlobe: boolean;
    toggleGlobe: () => void;
    isDark: boolean;
    toggleDark: () => void;
    isOffline: boolean;
    toggleOffline: () => void;
}>({ showGlobe: false, toggleGlobe: () => {}, isDark: true, toggleDark: () => {}, isOffline: false, toggleOffline: () => {} });

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const [showGlobe, setShowGlobe] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [themeOverridden, setThemeOverridden] = useState(false);

    useEffect(() => {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }, []);

    useEffect(() => {
        if (!themeOverridden) return;
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    }, [isDark, themeOverridden]);

    function toggleDark() {
        setThemeOverridden(true);
        setIsDark(v => !v);
    }

    return (
        <ViewContext.Provider value={{ showGlobe, toggleGlobe: () => setShowGlobe(v => !v), isDark, toggleDark, isOffline, toggleOffline: () => setIsOffline(v => !v) }}>
            {children}
        </ViewContext.Provider>
    );
}

export const useView = () => useContext(ViewContext);
