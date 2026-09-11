import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';

export default function ParticipantIdScreen({ navigation }: any) {
  const { participantId, setParticipantId, hasSelectedLanguage, t } = useLanguage();
  const [inputVal, setInputVal] = useState(participantId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinue = async (idToSave?: string) => {
    const targetId = (idToSave || inputVal).trim().toUpperCase();
    if (!targetId) {
      Alert.alert('Required', 'Please enter a participant ID or tap "Auto-Assign" to continue.');
      return;
    }
    setIsSubmitting(true);
    try {
      await setParticipantId(targetId);
      if (!hasSelectedLanguage) {
        navigation.replace('Language');
      } else {
        navigation.replace('Main');
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleAutoAssign = async () => {
    const randomCode = 'P-' + Math.floor(100 + Math.random() * 900);
    await handleContinue(randomCode);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView 
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Badge Icon */}
          <View style={styles.headerWrap}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="science" size={38} color={colors.primary} />
            </View>
            <View style={styles.tagPill}>
              <MaterialIcons name="verified" size={14} color={colors.primary} />
              <Text style={styles.tagPillText}>Research Study Onboarding</Text>
            </View>
            <Text style={styles.title}>Participant ID</Text>
            <Text style={styles.subtitle}>
              Please enter your assigned Study Participant ID (e.g. P-101 or EXP-01) to link your simulation assessments and research data.
            </Text>
          </View>

          {/* Input Card */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Participant Code</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="fingerprint" size={24} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={inputVal}
                onChangeText={setInputVal}
                placeholder="e.g. P-101"
                placeholderTextColor={colors.onSurfaceVariant + '70'}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={16}
              />
              {inputVal.length > 0 && (
                <TouchableOpacity onPress={() => setInputVal('')} style={styles.clearBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <MaterialIcons name="cancel" size={18} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.inputHint}>
              Assigned by the study coordinator. If not provided, you can auto-assign one below.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              style={[styles.primaryBtn, (!inputVal.trim() || isSubmitting) && styles.btnDisabled]}
              onPress={() => handleContinue()}
              disabled={!inputVal.trim() || isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, (!inputVal.trim() || isSubmitting) && styles.btnDisabledText]}>
                Save & Continue
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color={inputVal.trim() && !isSubmitting ? colors.onPrimary : colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleAutoAssign}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <MaterialIcons name="autorenew" size={18} color={colors.primary} />
              <Text style={styles.secondaryBtnText}>Auto-Assign ID & Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    justifyContent: 'space-between',
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  tagPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },

  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: 1,
  },
  clearBtn: {
    padding: 4,
  },
  inputHint: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 10,
    lineHeight: 17,
  },

  actionsWrap: {
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onPrimary,
  },
  btnDisabled: {
    backgroundColor: colors.surfaceHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabledText: {
    color: colors.onSurfaceVariant,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
  },
  secondaryBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
});
