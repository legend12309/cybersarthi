import React, { useEffect } from 'react';
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
import CustomSplashScreen      from './src/screens/SplashScreen';
import ScamDetailScreen        from './src/screens/ScamDetailScreen';
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
          if (route.name === 'Home')   iconName = focused ? 'home'           : 'home';
          if (route.name === 'Chat')   iconName = focused ? 'mic'            : 'mic-none';
          if (route.name === 'Sim')    iconName = 'sports-esports';
          if (route.name === 'Badges') iconName = focused ? 'emoji-events'   : 'emoji-events';
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 11,
          marginBottom: 3,
        },
        tabBarStyle: {
          backgroundColor:  colors.surface,
          borderTopWidth:   1,
          borderTopColor:   colors.surfaceBorder,
          height:           62 + insets.bottom,
          paddingBottom:    8 + insets.bottom,
          paddingTop:       6,
          elevation:        0,
          shadowOpacity:    0,
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

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
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
            <Stack.Screen name="Splash"     component={CustomSplashScreen} />
            <Stack.Screen name="Language"   component={LanguageSelectionScreen} />
            <Stack.Screen name="Main"       component={MainTabs} />
            <Stack.Screen name="ScamDetail" component={ScamDetailScreen} />
            <Stack.Screen name="Quiz"       component={QuizScreen} />
            <Stack.Screen name="ScreenshotScanner" component={ScreenshotScannerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
