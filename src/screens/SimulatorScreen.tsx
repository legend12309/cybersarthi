import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserStats } from '../lib/dbServices';

const { width } = Dimensions.get('window');

import scamsData from '../data/scams.json';

const SCENARIOS = scamsData.map((s, i) => ({
  ...s,
  icon: ['receipt-long', 'local-shipping', 'account-balance', 'family-restroom', 'emoji-events', 'qr-code-scanner', 'work', 'phonelink-erase', 'card-giftcard', 'policy'][i % 10],
  colorKey: ['warning', 'error', 'primary', 'warning', 'success', 'primary', 'success', 'error', 'warning', 'error'][i % 10],
}));

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  warning: { bg: colors.warningDim, text: colors.warning },
  success: { bg: colors.successDim, text: colors.success },
  primary: { bg: colors.primaryGlow, text: colors.primary },
  error:   { bg: colors.errorDim,   text: colors.error   },
};

export default function SimulatorScreen({ navigation }: any) {
  const { t, deviceId } = useLanguage();
  const isFocused = useIsFocused();
  const [level, setLevel] = useState('Level 2: Vigilant');

  useEffect(() => {
    let active = true;
    if (isFocused && deviceId) {
      fetchUserStats(deviceId).then(data => { if (active && data) setLevel(data.level); });
    }
    return () => { active = false; };
  }, [isFocused, deviceId]);

  const getLocalizedLevel = (l: string) => {
    const map: Record<string, string> = {
      'Level 2: Vigilant': t('sim_badge_vigilant'),
      'Level 3: Sentry':   t('level_3_sentry'),
      'Level 4: Defender': t('level_4_defender'),
      'Level 5: Guardian': t('level_5_guardian'),
    };
    return map[l] || l;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.levelPill}>
            <MaterialIcons name="military-tech" size={16} color={colors.primary} />
            <Text style={styles.levelText}>{getLocalizedLevel(level)}</Text>
          </View>
          <Text style={styles.title}>{t('sim_practice_title')}</Text>
          <Text style={styles.subtitle}>{t('sim_practice_subtitle')}</Text>
        </View>

        {/* Hero featured card */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('ScamDetail', { scamId: SCENARIOS[0].id })}
          activeOpacity={0.85}
        >
          <View style={styles.heroCardTop}>
            <View style={[styles.heroIconBg, { backgroundColor: COLOR_MAP[SCENARIOS[0].colorKey].bg }]}>
              <MaterialIcons name={SCENARIOS[0].icon as any} size={28} color={COLOR_MAP[SCENARIOS[0].colorKey].text} />
            </View>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>HOT</Text></View>
          </View>
          <Text style={styles.heroCardTitle}>{SCENARIOS[0].title}</Text>
          <Text style={styles.heroCardDesc} numberOfLines={2}>{SCENARIOS[0].content}</Text>
          <View style={styles.heroCardBtn}>
            <Text style={styles.heroCardBtnText}>{t('sim_card_electricity_button') || 'Try Scenario'}</Text>
            <MaterialIcons name="play-arrow" size={18} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Quiz Banner */}
        <TouchableOpacity
          style={styles.quizBanner}
          onPress={() => navigation.navigate('Quiz')}
          activeOpacity={0.85}
        >
          <View style={styles.flex1}>
            <Text style={styles.quizBannerTitle}>{t('sim_quiz_title') || 'Test Your Knowledge'}</Text>
            <Text style={styles.quizBannerDesc}>{t('sim_quiz_desc') || 'Take a quick 5-question quiz to earn points!'}</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Scenario List */}
        <Text style={styles.sectionLabel}>{t('sim_more_scenarios') || 'More Scenarios'}</Text>
        {SCENARIOS.slice(1).map(s => {
          const c = COLOR_MAP[s.colorKey];
          return (
            <TouchableOpacity
              key={s.id}
              style={styles.scenarioRow}
              onPress={() => navigation.navigate('ScamDetail', { scamId: s.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.scenarioIconBg, { backgroundColor: c.bg }]}>
                <MaterialIcons name={s.icon as any} size={22} color={c.text} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.scenarioTitle}>{s.title}</Text>
                <Text style={styles.scenarioDesc} numberOfLines={1}>{s.content}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

  header: { gap: 8, marginBottom: 4 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '30',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  levelText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: colors.primary },
  title: { fontFamily: 'Manrope_700Bold', fontSize: 26, color: colors.onSurface, letterSpacing: -0.3 },
  subtitle: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },

  // Hero card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    padding: 20, gap: 10,
  },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroIconBg: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  newBadge: {
    backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: colors.onSurface },
  heroCardTitle: { fontFamily: 'Manrope_700Bold', fontSize: 17, color: colors.onSurface },
  heroCardDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 19 },
  heroCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 12, height: 42, gap: 6,
    marginTop: 4,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  heroCardBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.onPrimary },

  quizBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  quizBannerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onSurface },
  quizBannerDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },

  sectionLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurfaceVariant },

  // Scenario row
  scenarioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: theme.borderRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    padding: 14,
  },
  scenarioIconBg: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scenarioTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface, marginBottom: 3 },
  scenarioDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 12, color: colors.onSurfaceVariant },
  flex1: { flex: 1 },
});