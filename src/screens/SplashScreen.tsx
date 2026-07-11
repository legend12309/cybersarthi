import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { colors } from '../lib/colors';

// Clean, minimalist splash screen inspired by Zomato/Swiggy.
// Uses the app's primary brand color as a solid background and white text for high contrast.
// The design stays dark and smooth to avoid a non‑trusted feel.

export default function SplashScreen({ navigation }: any) {
  const { t, isInitialized, hasSelectedLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current; // Fade‑in logo & text

  // Fade‑in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Smooth transition after initialization
  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({ index: 0, routes: [{ name: hasSelectedLanguage ? 'Main' : 'Language' }] });
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasSelectedLanguage, isInitialized, navigation, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.logoContainer}>
        <MaterialIcons name="security" size={120} color={colors.onPrimary} />
        <Text style={styles.title}>CyberSaathi</Text>
        <Text style={styles.tagline}>{t('splash_tagline') || 'Bharat ka Digital Suraksha Kavach'}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary, // solid brand blue – clean & eye‑friendly
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    color: colors.onPrimary,
    letterSpacing: -0.5,
    marginTop: 12,
  },
  tagline: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
    color: colors.onPrimary,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
});
