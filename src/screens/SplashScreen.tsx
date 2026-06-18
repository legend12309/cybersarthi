import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const { isInitialized, hasSelectedLanguage, t } = useLanguage();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const animDone   = useRef(false);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    // Navigate after splash
    const t1 = setTimeout(() => {
      animDone.current = true;
    }, 2600);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (animDone.current && isInitialized) {
      navigation.replace('Language');
    }
  }, [isInitialized, navigation]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });

  return (
    <View style={styles.container}>
      {/* Radial glow backdrop */}
      <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowRingInner, { opacity: glowOpacity }]} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        {/* Shield badge */}
        <View style={styles.iconBadge}>
          <MaterialIcons name="security" size={56} color={colors.primary} />
        </View>

        <Text style={styles.title}>CyberSaathi</Text>

        <View style={styles.divider} />

        <Text style={styles.tagline}>{t('splash_tagline')}</Text>

        {/* Dots loader */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryGlow,
  },
  glowRingInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  iconBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 34,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginVertical: 16,
  },
  tagline: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.72,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceBorder,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
});
