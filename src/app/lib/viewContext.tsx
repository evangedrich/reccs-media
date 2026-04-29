'use client';

import { createContext, useContext, useState } from 'react';

const ViewContext = createContext<{
    showGlobe: boolean;
    toggleGlobe: () => void;
}>({ showGlobe: false, toggleGlobe: () => {} });

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const [showGlobe, setShowGlobe] = useState(false);
    return (
        <ViewContext.Provider value={{ showGlobe, toggleGlobe: () => setShowGlobe(v => !v) }}>
            {children}
        </ViewContext.Provider>
    );
}

export const useView = () => useContext(ViewContext);
