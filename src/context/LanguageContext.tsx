import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../lib/translations';
import { getOrCreateUser } from '../lib/api';
import { supabase } from '../lib/supabase';

interface LanguageContextProps {
  languageCode: string;
  deviceId: string | null;
  changeLanguage: (code: string) => Promise<void>;
  t: (key: string) => string;
  isInitialized: boolean;
  hasSelectedLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Helper to generate a unique random string (UUID replacement)
const generateUUID = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    '-' +
    Math.random().toString(36).substring(2, 15) +
    '-' +
    Math.random().toString(36).substring(2, 15)
  );
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageCode, setLanguageCode] = useState<string>('hi-IN'); // Default to Hindi
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);

  useEffect(() => {
    const initializeProfileAndLanguage = async () => {
      try {
        // 1. Get or generate unique device/user ID
        let storedDeviceId = await AsyncStorage.getItem('cybersaathi.device_id');
        if (!storedDeviceId) {
          storedDeviceId = 'usr_' + generateUUID();
          await AsyncStorage.setItem('cybersaathi.device_id', storedDeviceId);
        }
        setDeviceId(storedDeviceId);

        // 2. Load stored language locally
        const storedLanguage = await AsyncStorage.getItem('cybersaathi.language');
        if (storedLanguage) {
          setHasSelectedLanguage(true);
          setLanguageCode(storedLanguage);
        } else {
          setLanguageCode('hi-IN');
        }

        const activeLanguage = storedLanguage || 'hi-IN';

        // 3. Register/fetch user from Supabase database
        const dbProfile = await getOrCreateUser(storedDeviceId, activeLanguage);
        
        // If database profile has a different language, sync it
        if (dbProfile && dbProfile.language && dbProfile.language !== activeLanguage && !storedLanguage) {
          setLanguageCode(dbProfile.language);
          await AsyncStorage.setItem('cybersaathi.language', dbProfile.language);
          setHasSelectedLanguage(true);
        }
      } catch (error) {
        console.error('Localization context initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeProfileAndLanguage();
  }, []);

  const changeLanguage = async (code: string) => {
    const prevCode = languageCode;
    const prevSelected = hasSelectedLanguage;
    setLanguageCode(code);
    setHasSelectedLanguage(true);
    try {
      await AsyncStorage.setItem('cybersaathi.language', code);
      if (deviceId) {
        // Sync language to Supabase backend database profile
        const { error } = await supabase.from('users').update({ preferred_language: code }).eq('device_id', deviceId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to change language, rolling back local state:', error);
      setLanguageCode(prevCode);
      setHasSelectedLanguage(prevSelected);
      await AsyncStorage.setItem('cybersaathi.language', prevCode);
    }
  };

  /**
   * Translate a key into the active language, falling back to English if missing.
   */
  const t = (key: string): string => {
    const languageTranslations = translations[languageCode];
    if (languageTranslations && languageTranslations[key]) {
      return languageTranslations[key];
    }
    // Fallback to English
    const englishTranslations = translations['en-IN'];
    if (englishTranslations && englishTranslations[key]) {
      return englishTranslations[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ languageCode, deviceId, changeLanguage, t, isInitialized, hasSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
