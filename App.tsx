import 'react-native-url-polyfill/auto';
import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI.',
  'Could not connect to development server',
]);
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  PublicSans_400Regular,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';

import HomeScreen              from './src/screens/HomeScreen';
import VoiceScreen             from './src/screens/VoiceScreen';
import SimulatorScreen         from './src/screens/SimulatorScreen';
import BadgesScreen            from './src/screens/BadgesScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import ParticipantIdScreen    from './src/screens/ParticipantIdScreen';
import CustomSplashScreen      from './src/screens/SplashScreen';
import ScamDetailScreen        from './src/screens/ScamDetailScreen';
import ScamRoleplayScreen      from './src/screens/ScamRoleplayScreen';
import QuizScreen              from './src/screens/QuizScreen';
import ScreenshotScannerScreen from './src/screens/ScreenshotScannerScreen';
import { colors }              from './src/lib/colors';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

SplashScreen.preventAutoHideAsync();

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type TabIconName =
  | 'home' | 'home-outlined'
  | 'mic' | 'mic-none'
  | 'sports-esports'
  | 'emoji-events' | 'emoji-events';

function MainTabs() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'help';
          if (route.name === 'Home')   iconName = focused ? 'home'           : 'home-filled';
          if (route.name === 'Chat')   iconName = focused ? 'mic'            : 'mic-none';
          if (route.name === 'Sim')    iconName = focused ? 'sports-esports' : 'sports-esports';
          if (route.name === 'Badges') iconName = focused ? 'emoji-events'   : 'emoji-events';
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? colors.primaryLight : 'transparent'
            }}>
              <MaterialIcons name={iconName} size={22} color={focused ? colors.primary : colors.onSurfaceVariant} />
            </View>
          );
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor:  colors.surface,
          borderTopWidth:   1,
          borderTopColor:   colors.surfaceBorder,
          height:           62 + insets.bottom,
          paddingBottom:    8 + insets.bottom,
          paddingTop:       6,
          elevation:        8,
          shadowColor:      '#0B1527',
          shadowOffset:     { width: 0, height: -3 },
          shadowOpacity:    0.05,
          shadowRadius:     12,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          shadowOpacity:   0,
          elevation:       0,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceBorder,
        } as any,
        headerTitleStyle: {
          fontFamily: 'Manrope_700Bold',
          fontSize: 18,
          color: colors.onSurface,
        },
        headerTintColor: colors.onSurface,
      })}
    >
      <Tab.Screen name="Home"   component={HomeScreen}      options={{ title: t('tab_home'),   headerShown: false }} />
      <Tab.Screen name="Chat"   component={VoiceScreen}     options={{ title: t('tab_chat'),   headerShown: false }} />
      <Tab.Screen name="Sim"    component={SimulatorScreen} options={{ title: t('tab_sim'),    headerShown: false }} />
      <Tab.Screen name="Badges" component={BadgesScreen}    options={{ title: t('tab_badges'), headerShown: false }} />
    </Tab.Navigator>
  );
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  state = { hasError: false, error: null as any };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 }}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#0F172A', fontSize: 20, fontFamily: 'Manrope_700Bold', marginBottom: 12, textAlign: 'center' }}>Application Error</Text>
          <ScrollView style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '100%', maxHeight: 300, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ color: '#DC2626', fontSize: 13, fontFamily: 'monospace' }}>{String(this.state.error?.stack || this.state.error)}</Text>
          </ScrollView>
          <TouchableOpacity 
            style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: 'white', fontFamily: 'Manrope_700Bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LanguageProvider>
          <NavigationContainer
            theme={{
              dark: false,
              fonts: {
                regular: { fontFamily: 'PublicSans_400Regular', fontWeight: '400' as const },
                medium:  { fontFamily: 'Manrope_600SemiBold',   fontWeight: '600' as const },
                bold:    { fontFamily: 'Manrope_700Bold',        fontWeight: '700' as const },
                heavy:   { fontFamily: 'Manrope_700Bold',        fontWeight: '900' as const },
              },
              colors: {
                primary:      colors.primary,
                background:   colors.background,
                card:         colors.surface,
                text:         colors.onSurface,
                border:       colors.surfaceBorder,
                notification: colors.error,
              },
            }}
          >
            <Stack.Navigator 
              screenOptions={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }} 
              initialRouteName="Splash"
            >
              <Stack.Screen name="Splash"        component={CustomSplashScreen} />
              <Stack.Screen name="ParticipantId" component={ParticipantIdScreen} />
              <Stack.Screen name="Language"      component={LanguageSelectionScreen} />
              <Stack.Screen name="Main"          component={MainTabs} />
              <Stack.Screen name="ScamDetail" component={ScamDetailScreen} />
              <Stack.Screen name="ScamRoleplay" component={ScamRoleplayScreen} />
              <Stack.Screen name="Quiz"       component={QuizScreen} />
              <Stack.Screen name="ScreenshotScanner" component={ScreenshotScannerScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </LanguageProvider>
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
