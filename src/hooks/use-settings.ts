'use client';

import { useState, useEffect } from 'react';

export interface AppSettings {
  autoUpdateTranslationStatus: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoUpdateTranslationStatus: true,
};

const SETTINGS_KEY = 'lingoscraper-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 从 localStorage 加载设置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 保存设置到 localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  };

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
