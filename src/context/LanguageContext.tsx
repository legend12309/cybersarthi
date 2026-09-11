import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../lib/translations';
import { getOrCreateUser } from '../lib/api';
import { supabase } from '../lib/supabase';

interface LanguageContextProps {
  languageCode: string;
  deviceId: string | null;
  participantId: string | null;
  userId: string;
  setParticipantId: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  changeLanguage: (code: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  isInitialized: boolean;
  hasSelectedLanguage: boolean;
  hasConfirmedParticipantId: boolean;
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
  const [participantId, setParticipantIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(false);
  const [hasConfirmedParticipantId, setHasConfirmedParticipantId] = useState<boolean>(false);

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

        // Load or initialize Participant ID (for Academic Research Study)
        let storedParticipantId = await AsyncStorage.getItem('cybersaathi.participant_id');
        let confirmedFlag = await AsyncStorage.getItem('cybersaathi.participant_id_confirmed');
        if (confirmedFlag === 'true') {
          setHasConfirmedParticipantId(true);
        }
        if (!storedParticipantId) {
          const shortHash = (storedDeviceId.split('_')[1] || '101').substring(0, 3).toUpperCase();
          storedParticipantId = `P-${shortHash}`;
          await AsyncStorage.setItem('cybersaathi.participant_id', storedParticipantId);
        }
        setParticipantIdState(storedParticipantId);

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

  const userId = participantId 
    ? `usr_${participantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}` 
    : (deviceId || 'usr_guest');

  const setParticipantId = async (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) return;
    setParticipantIdState(cleanId);
    setHasConfirmedParticipantId(true);
    const isolatedUserId = `usr_${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    try {
      await AsyncStorage.setItem('cybersaathi.participant_id', cleanId);
      await AsyncStorage.setItem('cybersaathi.participant_id_confirmed', 'true');
      getOrCreateUser(isolatedUserId, languageCode).catch(() => {});
    } catch (error) {
      console.error('Failed to save participant ID:', error);
    }
  };

  const logout = async () => {
    setParticipantIdState(null);
    setHasConfirmedParticipantId(false);
    try {
      await AsyncStorage.removeItem('cybersaathi.participant_id');
      await AsyncStorage.removeItem('cybersaathi.participant_id_confirmed');
    } catch (error) {
      console.error('Failed to clear participant session:', error);
    }
  };

  /**
   * Translate a key into the active language, falling back to English if missing.
   */
  const t = (key: string, fallback?: string): string => {
    const languageTranslations = translations[languageCode];
    if (languageTranslations && languageTranslations[key]) {
      return languageTranslations[key];
    }
    // Fallback to English
    const englishTranslations = translations['en-IN'];
    if (englishTranslations && englishTranslations[key]) {
      return englishTranslations[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      languageCode, 
      deviceId, 
      participantId,
      userId,
      setParticipantId,
      logout,
      changeLanguage, 
      t, 
      isInitialized, 
      hasSelectedLanguage, 
      hasConfirmedParticipantId 
    }}>
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
