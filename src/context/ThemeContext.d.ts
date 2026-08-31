import type { ReactNode } from 'react';

export type AppTheme =
  | 'light-yellow'
  | 'light-white'
  | 'dark-black'
  | 'dark-navy';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  primary: string;
  border: string;
};

export const THEME_OPTIONS: readonly AppTheme[];
export const THEME_COLORS: Record<AppTheme, ThemeColors>;
export const DEFAULT_THEME: AppTheme;
export const DEFAULT_FONT_SIZE: number;
export const MIN_FONT_SIZE: number;
export const MAX_FONT_SIZE: number;
export const FONT_SIZE_STEP: number;

export type ThemeContextValue = {
  theme: AppTheme;
  colors: ThemeColors;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (fontSize: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
};

export type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider(props: ThemeProviderProps): ReactNode;
export function useTheme(): ThemeContextValue;
