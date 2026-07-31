import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as darkColors } from '@trackingPortal/themes/colors';
import { lightColors } from '@trackingPortal/themes/lightColors';
import { darkTheme } from '@trackingPortal/themes/darkTheme';
import { lightTheme } from '@trackingPortal/themes/lightTheme';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_STORAGE_KEY = 'app_theme_mode';

type AppColors = { [K in keyof typeof darkColors]: string };
interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  paperTheme: typeof darkTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  themeMode: 'system',
  setThemeMode: () => {},
  paperTheme: darkTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(v => {
        setThemeModeState(
          v === 'light' || v === 'dark' || v === 'system' ? v : 'system',
        );
      })
      .catch(() => setThemeModeState('system'));
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const isDark = useMemo(() => {
    if (themeMode === null) return systemScheme !== 'light';
    if (themeMode === 'system') return systemScheme !== 'light';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const value = useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    themeMode: themeMode ?? 'system',
    setThemeMode,
    paperTheme: isDark ? darkTheme : lightTheme,
  }), [isDark, themeMode]);

  // Keep the native splash in place until the persisted app preference is
  // known. This prevents the animated splash from briefly using the system
  // palette when the user explicitly selected the opposite theme.
  if (themeMode === null) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => useContext(ThemeContext);
