import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export const THEME_OPTIONS = [
  'light-yellow',
  'light-white',
  'dark-black',
  'dark-navy',
];

export const THEME_COLORS = {
  'light-yellow': {
    background: '#FFF8D6',
    surface: '#FFFDF2',
    text: '#332B00',
    mutedText: '#6B5D1E',
    primary: '#8A6800',
    border: '#E5D384',
  },
  'light-white': {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    text: '#18212B',
    mutedText: '#596573',
    primary: '#315E8A',
    border: '#D5DCE3',
  },
  'dark-black': {
    background: '#000000',
    surface: '#171717',
    text: '#F5F5F5',
    mutedText: '#B8B8B8',
    primary: '#E8C75A',
    border: '#383838',
  },
  'dark-navy': {
    background: '#071525',
    surface: '#10253B',
    text: '#F1F7FF',
    mutedText: '#AFC3D8',
    primary: '#7DB7E8',
    border: '#294661',
  },
};

export const DEFAULT_THEME = 'light-yellow';
export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 32;
export const FONT_SIZE_STEP = 2;

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [fontSize, setFontSizeState] = useState(DEFAULT_FONT_SIZE);

  const setTheme = useCallback((nextTheme) => {
    if (!THEME_OPTIONS.includes(nextTheme)) {
      throw new Error(`Tema inválido: ${nextTheme}`);
    }

    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const currentIndex = THEME_OPTIONS.indexOf(currentTheme);
      const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;

      return THEME_OPTIONS[nextIndex];
    });
  }, []);

  const setFontSize = useCallback((nextFontSize) => {
    if (!Number.isFinite(nextFontSize) || nextFontSize <= 0) {
      throw new Error('O tamanho da fonte deve ser um número maior que zero.');
    }

    setFontSizeState(Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, nextFontSize)));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSizeState((currentSize) =>
      Math.min(currentSize + FONT_SIZE_STEP, MAX_FONT_SIZE),
    );
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeState((currentSize) =>
      Math.max(currentSize - FONT_SIZE_STEP, MIN_FONT_SIZE),
    );
  }, []);

  const value = useMemo(
    () => ({
      theme,
      colors: THEME_COLORS[theme],
      setTheme,
      toggleTheme,
      fontSize,
      setFontSize,
      increaseFontSize,
      decreaseFontSize,
    }),
    [
      theme,
      setTheme,
      toggleTheme,
      fontSize,
      setFontSize,
      increaseFontSize,
      decreaseFontSize,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider.');
  }

  return context;
}
