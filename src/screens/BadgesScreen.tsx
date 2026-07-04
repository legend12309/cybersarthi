import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Share, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserStats, UserStats } from '../lib/dbServices';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

const LEVEL_PROGRESS: Record<string, number> = {
  'Level 2: Vigilant': 0.25,
  'Level 3: Sentry':   0.50,
  'Level 4: Defender': 0.75,
  'Level 5: Guardian': 1.0,
};

const BADGES = [
  { id: 'Scam Spotter',       titleKey: 'badges_spotter_title',   descKey: 'badges_spotter_desc',   icon: 'remove-red-eye', colorKey: 'success' },
  { id: 'Verified Protector', titleKey: 'badges_protector_title', descKey: 'badges_protector_desc', icon: 'verified-user',  colorKey: 'success' },
  { id: 'Sim Hero',           titleKey: 'badges_hero_title',      descKey: 'badges_hero_desc',      icon: 'sports-esports', colorKey: 'primary' },
  { id: 'Link Sentry',        titleKey: 'badges_sentry_title',    descKey: 'badges_sentry_desc',    icon: 'link',           colorKey: 'primary' },
  { id: 'Quiz Master',        titleKey: 'Quiz Master',            descKey: 'Score 80% or higher on any Quiz', icon: 'school', colorKey: 'warning' },
] as const;

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  success: { bg: colors.successDim, icon: colors.success },
  primary: { bg: colors.primaryGlow, icon: colors.primary },
  warning: { bg: colors.warningDim, icon: colors.warning },
  error:   { bg: colors.errorDim,   icon: colors.error   },
};

export default function BadgesScreen() {
  const { t, deviceId } = useLanguage();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (isFocused && deviceId) {
      setLoading(true);
      // console.log('[BADGES] About to call fetchUserStats with userId:', deviceId, 'type:', typeof deviceId);
      fetchUserStats(deviceId).then(data => {
        if (active) { setStats(data); setLoading(false); }
      });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, [isFocused, deviceId]);

  const getLocalizedLevel = (l?: string) => {
    if (!l) return t('badges_level_title');
    const map: Record<string, string> = {
      'Level 2: Vigilant': t('sim_badge_vigilant'),
      'Level 3: Sentry':   t('level_3_sentry'),
      'Level 4: Defender': t('level_4_defender'),
      'Level 5: Guardian': t('level_5_guardian'),
    };
    return map[l] || l;
  };

  const shareBadge = async (badgeName: string) => {
    try {
      const message = `मैंने CyberSaathi में "${badgeName}" बैज जीता! 🛡️ साइबर सुरक्षा सीखें: https://cybersaathi.in`;
      await Share.share({ message });
    } catch (error) {
      // console.warn('Error sharing badge:', error);
    }
  };

  const isBadgeUnlocked = (name: string) => stats?.unlockedBadges.includes(name) || false;
  const progress = LEVEL_PROGRESS[stats?.level || 'Level 2: Vigilant'] || 0.25;



  const progressStyle = React.useMemo(() => ({ flex: progress }), [progress]);
  const remainingStyle = React.useMemo(() => ({ flex: Math.max(0, 1 - progress) }), [progress]);

  if (loading && !stats) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Profile Hero ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.medalCircle}>
            <MaterialIcons name="military-tech" size={48} color={colors.primary} />
          </View>
          <Text style={styles.levelLabel}>{getLocalizedLevel(stats?.level)}</Text>
          <Text style={styles.levelSub}>{t('badges_level_subtitle')}</Text>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, progressStyle]} />
            <View style={remainingStyle} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress * 100)}{t('badges_progress_suffix') || '% to next level'}</Text>
        </View>

        {/* ── Stats row ─────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{stats?.unlockedBadges.length || 1}</Text>
            <Text style={styles.statLab}>{t('badges_stats_unlocked')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>5</Text>
            <Text style={styles.statLab}>{t('badges_stats_total')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{stats?.totalQuizScore || 0}</Text>
            <Text style={styles.statLab}>{t('badges_stats_score')}</Text>
          </View>
        </View>

        {/* ── Badge Grid ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>{t('badges_section_title')}</Text>
        <View style={styles.grid}>
          {BADGES.map(b => {
            const unlocked = isBadgeUnlocked(b.id);
            const c = COLOR_MAP[b.colorKey];
            const displayTitle = t(b.titleKey);
            return (
              <View key={b.id} style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
                {unlocked && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareBadge(displayTitle)}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <MaterialIcons name="share" size={20} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
                <View style={[styles.badgeIconWrap, { backgroundColor: unlocked ? c.bg : colors.surfaceBorder + '50' }]}>
                  <MaterialIcons name={b.icon as any} size={28} color={unlocked ? c.icon : colors.onSurfaceVariant + '60'} />
                  {!unlocked && (
                    <View style={styles.lockOverlay}>
                      <MaterialIcons name="lock" size={14} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeTitle, !unlocked && styles.lockedText]} numberOfLines={2}>
                  {displayTitle}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={3}>{t(b.descKey)}</Text>
                {unlocked && (
                  <View style={styles.unlockedChip}>
                    <MaterialIcons name="check" size={10} color={colors.success} />
                    <Text style={styles.unlockedText}>{t('badges_earned')}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

  // Hero card
  heroCard: {
    backgroundColor: colors.surface, borderRadius: theme.cardRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    padding: 24, alignItems: 'center', gap: 8,
  },
  medalCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: colors.primary + '40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  levelLabel: { fontFamily: 'Manrope_700Bold', fontSize: 22, color: colors.onSurface, letterSpacing: -0.3 },
  levelSub: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  progressTrack: {
    width: '100%', height: 8, borderRadius: 4,
    backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginTop: 8,
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  progressLabel: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: theme.borderRadius, borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingVertical: 18,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.surfaceBorder },
  statNum: { fontFamily: 'Manrope_700Bold', fontSize: 28, color: colors.primary, lineHeight: 32 },
  statLab: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 },

  sectionTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onSurface },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: CARD_W,
    backgroundColor: colors.surface, borderRadius: theme.cardRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    padding: 16, alignItems: 'center', gap: 8, minHeight: 170,
  },
  badgeLocked: { opacity: 0.55 },
  badgeIconWrap: {
    width: 58, height: 58, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.surfaceHigh, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  badgeTitle: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: colors.onSurface, textAlign: 'center' },
  lockedText: { color: colors.onSurfaceVariant },
  badgeDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 15 },
  shareButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh || colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.successDim, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  unlockedText: { fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: colors.success },
});
