import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

const LANGUAGES = [
  { code: 'hi-IN', native: 'हिंदी',    english: 'Hindi'    },
  { code: 'mr-IN', native: 'मराठी',   english: 'Marathi'  },
  { code: 'ta-IN', native: 'தமிழ்',   english: 'Tamil'    },
  { code: 'te-IN', native: 'తెలుగు',  english: 'Telugu'   },
  { code: 'en-IN', native: 'English',  english: 'English'  },
  { code: 'gu-IN', native: 'ગુજરાતી', english: 'Gujarati' },
];

export default function LanguageSelectionScreen({ navigation }: any) {
  const { t, changeLanguage, languageCode } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (languageCode) setSelected(languageCode);
  }, [languageCode]);

  const handleContinue = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await changeLanguage(selected);
      navigation.replace('Main');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : null} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('lang_welcome_title')}</Text>
        </View>
        <View style={styles.titleContainer}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="language" size={32} color={colors.primary} />
          </View>
          <Text style={styles.subtitle}>{t('lang_welcome_subtitle')}</Text>
        </View>

        {/* Language grid */}
        <View style={styles.grid}>
          {LANGUAGES.map(lang => {
            const active = selected === lang.code;
            return (
              <TouchableOpacity key={lang.code}
                style={[styles.card, active && styles.cardActive]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.85}
              >
                {/* Radio dot top-right */}
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

      {/* Sticky Continue */}
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
        <TouchableOpacity
          style={[styles.btn, (!selected || isSubmitting) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!selected || isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={[styles.btnText, (!selected || isSubmitting) && styles.btnTextDisabled]}>
            {t('lang_continue_btn')}
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
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 160 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold', fontSize: 24,
    color: colors.onSurface, textAlign: 'center', letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'PublicSans_400Regular', fontSize: 14,
    color: colors.onSurfaceVariant, textAlign: 'center',
    marginTop: 8, lineHeight: 20, maxWidth: 270,
  },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    padding: 20,
    minHeight: 130,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    justifyContent: 'flex-end',
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  radio: {
    position: 'absolute', top: 14, right: 14,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.surfaceBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioFill: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: colors.onPrimary,
  },
  nativeLabel: {
    fontFamily: 'Manrope_700Bold', fontSize: 18,
    color: colors.onSurface,
  },
  nativeLabelActive: { color: colors.primary },
  englishLabel: {
    fontFamily: 'PublicSans_400Regular', fontSize: 12,
    color: colors.onSurfaceVariant, marginTop: 4,
  },
  englishLabelActive: { color: colors.primary + 'BB' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background + 'EE',
    paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1, borderColor: colors.surfaceBorder,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: theme.buttonRadius,
    backgroundColor: colors.primary, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: { backgroundColor: colors.surfaceHigh, shadowOpacity: 0 },
  btnText: {
    fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary,
  },
  btnTextDisabled: { color: colors.onSurfaceVariant },
});
