import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.containerPadding * 2 - 16) / 2;

export default function LanguageSelectionScreen({ navigation }: any) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const setLanguageAndProceed = async (code: string) => {
    try {
      await AsyncStorage.setItem('cybersaathi.language', code);
      navigation.replace('MainTabs');
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  const LanguageOption = ({ title, nativeTitle, code }: { title: string, nativeTitle: string, code: string }) => {
    const isSelected = selectedLanguage === code;

    return (
      <TouchableOpacity 
        style={[
          styles.optionCard, 
          isSelected && styles.optionCardSelected
        ]}
        onPress={() => setSelectedLanguage(code)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[
            styles.radioOuter,
            isSelected && styles.radioOuterActive
          ]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        
        <View style={styles.cardTextContainer}>
          <Text style={[
            styles.nativeTitle,
            isSelected && styles.textSelected
          ]}>{nativeTitle}</Text>
          <Text style={[
            styles.englishTitle,
            isSelected && styles.textSecondarySelected
          ]}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-half" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Welcome to CyberSaathi</Text>
          <Text style={styles.subtitle}>Choose your language to get started.</Text>
        </View>
        
        <View style={styles.optionsGrid}>
          <LanguageOption title="Hindi" nativeTitle="हिंदी" code="hi-IN" />
          <LanguageOption title="Marathi" nativeTitle="मराठी" code="mr-IN" />
          <LanguageOption title="Tamil" nativeTitle="தமிழ்" code="ta-IN" />
          <LanguageOption title="Telugu" nativeTitle="తెలుగు" code="te-IN" />
          <LanguageOption title="English" nativeTitle="English" code="en-IN" />
          <LanguageOption title="Gujarati" nativeTitle="ગુજરાતી" code="gu-IN" />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedLanguage && styles.continueButtonDisabled
          ]}
          disabled={!selectedLanguage}
          onPress={() => selectedLanguage && setLanguageAndProceed(selectedLanguage)}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.continueText,
            !selectedLanguage && styles.continueTextDisabled
          ]}>
            Continue
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={20} 
            color={selectedLanguage ? colors.onPrimary : colors.onSurfaceVariant} 
            style={{ marginLeft: 8 }} 
          />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 140, // Extra padding to make sure content doesn't get covered by Continue button
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  title: {
    ...typography.display,
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  optionCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    alignItems: 'flex-end',
    width: '100%',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.onSurfaceVariant + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.onPrimary,
  },
  cardTextContainer: {
    width: '100%',
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
  textSelected: {
    color: colors.primary,
  },
  textSecondarySelected: {
    color: colors.onSurfaceVariant,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderColor: colors.background,
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  continueButtonDisabled: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: colors.onSurfaceVariant + '20',
  },
  continueText: {
    ...typography.titleMd,
    color: colors.onPrimary,
    fontFamily: 'Manrope_700Bold',
  },
  continueTextDisabled: {
    color: colors.onSurfaceVariant + '60',
  },
});
