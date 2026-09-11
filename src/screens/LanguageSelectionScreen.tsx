import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { useWindowDimensions } from 'react-native';

const LANGUAGES = [
  { code: 'hi-IN', native: 'हिंदी',    english: 'Hindi'    },
  { code: 'mr-IN', native: 'मराठी',   english: 'Marathi'  },
  { code: 'ta-IN', native: 'தமிழ்',   english: 'Tamil'    },
  { code: 'te-IN', native: 'తెలుగు',  english: 'Telugu'   },
  { code: 'en-IN', native: 'English',  english: 'English'  },
  { code: 'gu-IN', native: 'ગુજરાતી', english: 'Gujarati' },
];

export default function LanguageSelectionScreen({ navigation }: any) {
  const { t, changeLanguage, languageCode, hasConfirmedParticipantId } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 40 - 12) / 2;

  useEffect(() => {
    if (languageCode) setSelected(languageCode);
  }, [languageCode]);

  const handleContinue = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await changeLanguage(selected);
      if (!hasConfirmedParticipantId) {
        navigation.replace('ParticipantId');
      } else {
        navigation.replace('Main');
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Button (only when can go back) */}
        {navigation.canGoBack() && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Section */}
        <View style={styles.heroWrap}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="language" size={34} color={colors.primary} />
          </View>
          <View style={styles.tagPill}>
            <MaterialIcons name="translate" size={14} color={colors.primary} />
            <Text style={styles.tagPillText}>Select Language • भाषा चयन</Text>
          </View>
          <Text style={styles.title}>{t('lang_welcome_title') || 'Welcome to CyberSaathi'}</Text>
          <Text style={styles.subtitle}>{t('lang_welcome_subtitle') || 'Choose your preferred language to continue'}</Text>
        </View>

        {/* Language grid */}
        <View style={styles.grid}>
          {LANGUAGES.map(lang => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity 
                key={lang.code}
                style={[styles.card, { width: cardWidth }, active && styles.cardActive]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.85}
              >
                {/* Radio indicator top-right */}
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioFill} />}
                </View>

                <Text style={[styles.nativeLabel, active && styles.nativeLabelActive]}>
                  {lang.native}
                </Text>
                <Text style={[styles.englishLabel, active && styles.englishLabelActive]}>
                  {lang.english}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Continue Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
        <TouchableOpacity
          style={[styles.btn, (!selected || isSubmitting) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!selected || isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={[styles.btnText, (!selected || isSubmitting) && styles.btnTextDisabled]}>
            {t('lang_continue_btn') || 'Continue'}
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={selected && !isSubmitting ? colors.onPrimary : colors.onSurfaceVariant}
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  heroWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  tagPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    height: 126,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#EEF4FD',
  },
  radio: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioFill: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  nativeLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 19,
    color: colors.onSurface,
  },
  nativeLabelActive: {
    color: colors.primary,
  },
  englishLabel: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  englishLabelActive: {
    color: colors.primary,
    opacity: 0.85,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background + 'F4',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: colors.surfaceHigh,
    shadowOpacity: 0,
  },
  btnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onPrimary,
  },
  btnTextDisabled: {
    color: colors.onSurfaceVariant,
  },
});
