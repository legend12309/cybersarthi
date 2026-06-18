import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';

export default function LanguageSelectionScreen({ navigation }: any) {
  
  const setLanguageAndProceed = async (code: string) => {
    try {
      await AsyncStorage.setItem('cybersaathi.language', code);
      navigation.replace('MainTabs');
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const LanguageOption = ({ title, nativeTitle, code }: { title: string, nativeTitle: string, code: string }) => (
    <TouchableOpacity 
      style={styles.optionCard}
      onPress={() => setLanguageAndProceed(code)}
    >
      <View>
        <Text style={styles.nativeTitle}>{nativeTitle}</Text>
        <Text style={styles.englishTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="language" size={48} color={colors.primary} />
          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.subtitle}>Select the language you are most comfortable with.</Text>
        </View>
        
        <View style={styles.options}>
          <LanguageOption title="English" nativeTitle="English" code="en-IN" />
          <LanguageOption title="Hindi" nativeTitle="हिन्दी" code="hi-IN" />
          <LanguageOption title="Marathi" nativeTitle="मराठी" code="mr-IN" />
          <LanguageOption title="Tamil" nativeTitle="தமிழ்" code="ta-IN" />
          <LanguageOption title="Telugu" nativeTitle="తెలుగు" code="te-IN" />
          <LanguageOption title="Gujarati" nativeTitle="ગુજરાતી" code="gu-IN" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.containerPadding,
    gap: spacing.stackGap,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...typography.display,
    color: colors.onSurface,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },
  options: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  nativeTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  englishTitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
