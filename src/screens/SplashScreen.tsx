import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const checkNavigationRoute = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('cybersaathi.language');
        
        setTimeout(() => {
          if (storedLanguage) {
            navigation.replace('MainTabs');
          } else {
            navigation.replace('Language');
          }
        }, 2500);
      } catch (error) {
        console.error('Failed to check language in splash:', error);
        setTimeout(() => {
          navigation.replace('Language');
        }, 2500);
      }
    };

    checkNavigationRoute();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Ambient Glow behind the icon */}
        <View style={styles.glowOuter}>
          <View style={styles.glowInner} />
        </View>

        {/* Shield Icon */}
        <MaterialIcons name="shield" size={80} color="#2563EB" />

        {/* App Name */}
        <Text style={styles.title}>CyberSaathi</Text>

        {/* Thin Blue Divider */}
        <View style={styles.divider} />

        {/* Tagline */}
        <Text style={styles.tagline}>Your Trusted Friend in Digital Safety</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  glowOuter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2563EB',
    opacity: 0.08,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    color: '#1E293B',
    marginTop: 24,
    letterSpacing: -0.5,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: '#2563EB',
    marginVertical: 16,
    borderRadius: 1,
  },
  tagline: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
});
