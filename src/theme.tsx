'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: 'light',
  setColorMode: () => {},
  toggleColorMode: () => {},
});

const STORAGE_KEY = 'ses-color-mode';

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ColorMode | null;
      if (stored === 'dark' || stored === 'light') {
        setColorModeState(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY, colorMode);
    } catch {
      // localStorage unavailable
    }
  }, [colorMode]);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ColorModeContext.Provider value={{ colorMode, setColorMode, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function useColorModeValue<T>(lightValue: T, darkValue: T): T {
  const { colorMode } = useColorMode();
  return colorMode === 'light' ? lightValue : darkValue;
}
