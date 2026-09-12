import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Share, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserStats, UserStats } from '../lib/dbServices';

const { width } = Dimensions.get('window');
const CARD_W = Math.floor((width - 40 - 12) / 2);

const LEVEL_PROGRESS: Record<string, number> = {
  'Level 1: Novice':   0.0,
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
  { id: 'Quiz Master',        titleKey: 'badges_quiz_title',      descKey: 'badges_quiz_desc',      icon: 'school', colorKey: 'warning' },
] as const;

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  success: { bg: colors.successDim, icon: colors.success },
  primary: { bg: colors.primaryGlow, icon: colors.primary },
  warning: { bg: colors.warningDim, icon: colors.warning },
  error:   { bg: colors.errorDim,   icon: colors.error   },
};

export default function BadgesScreen({ navigation }: any) {
  const { t, userId, participantId, logout } = useLanguage();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (isFocused && userId) {
      setLoading(true);
      fetchUserStats(userId)
        .then(data => {
          if (active) { setStats(data); setLoading(false); }
        })
        .catch(() => {
          if (active) { setLoading(false); }
        });
    } else {
      setLoading(false);
    }
    return () => { active = false; };
  }, [isFocused, userId]);

  const handleSwitchUser = () => {
    logout().then(() => {
      navigation.reset({ index: 0, routes: [{ name: 'ParticipantId' }] });
    });
  };

  const getLocalizedLevel = (l?: string) => {
    if (!l) return t('badges_level_title');
    const map: Record<string, string> = {
      'Level 1: Novice':   t('level_1_novice', 'Level 1: Novice'),
      'Level 2: Vigilant': t('sim_badge_vigilant'),
      'Level 3: Sentry':   t('level_3_sentry'),
      'Level 4: Defender': t('level_4_defender'),
      'Level 5: Guardian': t('level_5_guardian'),
    };
    return map[l] || l;
  };

  const shareBadge = async (badgeName: string) => {
    try {
      const message = t('badge_share_msg', `I just earned the "${badgeName}" badge on CyberSaathi! 🛡️ Learn cyber safety: https://cybersaathi.in`)
        .replace('{badgeName}', badgeName);
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
      <SafeAreaView edges={['top']} style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Insightlancer Profile Hero (Deep Navy Card) ── */}
        <View style={styles.heroCardNavy}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="shield" size={38} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{participantId ? participantId : 'Cyber Defender'}</Text>
          <Text style={styles.userRole}>{getLocalizedLevel(stats?.level)}</Text>

          <TouchableOpacity style={styles.switchUserBtn} onPress={handleSwitchUser} activeOpacity={0.8}>
            <MaterialIcons name="swap-horiz" size={14} color="#93C5FD" />
            <Text style={styles.switchUserText}>{t('switch_user', 'Switch User / Log Out')}</Text>
          </TouchableOpacity>

          {/* 3 Metrics Columns */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>{stats?.unlockedBadges?.length || 0}</Text>
              <Text style={styles.metricLabel}>{t('badges_stats_unlocked')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>{stats?.totalQuizScore || 0}</Text>
              <Text style={styles.metricLabel}>{t('badges_stats_score')}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <Text style={styles.metricNum}>5</Text>
              <Text style={styles.metricLabel}>{t('badges_stats_total')}</Text>
            </View>
          </View>

          {/* Progress Bar inside Navy Card */}
          <View style={styles.progressWrapNavy}>
            <View style={styles.progressLabelsNavy}>
              <Text style={styles.progressTextNavy}>{t('next_level', 'Next Level')}</Text>
              <Text style={styles.progressPercentNavy}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressTrackNavy}>
              <View style={[styles.progressFillNavy, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* ── Section Header ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('badges_section_title')}</Text>
        </View>
        
        {(!stats?.unlockedBadges || stats.unlockedBadges.length === 0) && (
          <View style={styles.emptyStateContainer}>
            <MaterialIcons name="info-outline" size={22} color={colors.primary} />
            <Text style={styles.emptyStateText}>{t('badges_empty_state', 'You have not unlocked any badges yet. Try taking a quiz or scanning a link!')}</Text>
          </View>
        )}

        <View style={styles.grid}>
          {BADGES.map(b => {
            const unlocked = isBadgeUnlocked(b.id);
            const c = COLOR_MAP[b.colorKey];
            const displayTitle = t(b.titleKey);
            return (
              <View key={b.id} style={[styles.badgeCard, !unlocked && styles.badgeLocked]}>
                {unlocked && (
                  <TouchableOpacity style={styles.shareButton}
                    onPress={() => shareBadge(displayTitle)}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <MaterialIcons name="share" size={16} color={colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
                <View style={[styles.badgeIconWrap, { backgroundColor: unlocked ? c.bg : colors.primaryLight }]}>
                  <MaterialIcons name={b.icon as any} size={26} color={unlocked ? c.icon : colors.onSurfaceVariant + '60'} />
                  {!unlocked && (
                    <View style={styles.lockOverlay}>
                      <MaterialIcons name="lock" size={12} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeTitle, !unlocked && styles.lockedText]} numberOfLines={1}>
                  {displayTitle}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{t(b.descKey)}</Text>
                <View style={styles.badgeFooter}>
                  {unlocked ? (
                    <View style={styles.unlockedChip}>
                      <MaterialIcons name="check" size={12} color={colors.success} />
                      <Text style={styles.unlockedText}>{t('badges_earned')}</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedChip}>
                      <MaterialIcons name="lock" size={11} color={colors.onSurfaceVariant} />
                      <Text style={styles.lockedChipText}>Locked</Text>
                    </View>
                  )}
                </View>
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
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100, gap: 16 },

  // Insightlancer Profile Hero (Deep Navy Blue)
  heroCardNavy: {
    backgroundColor: colors.navyCard,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: colors.navyCard,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.navyCardBorder,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userRole: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.navyCardSub,
    marginTop: 2,
    marginBottom: 6,
  },
  switchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 2,
    marginBottom: 16,
  },
  switchUserText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#93C5FD',
  },

  // 3 Metrics Columns
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  metricNum: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  metricLabel: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10,
    color: colors.navyCardSub,
    marginTop: 2,
  },

  // Navy Progress Section
  progressWrapNavy: {
    width: '100%',
    marginTop: 18,
  },
  progressLabelsNavy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTextNavy: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.navyCardSub,
  },
  progressPercentNavy: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  progressTrackNavy: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFillNavy: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
  },
  sectionLink: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },

  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyStateText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: 'PublicSans_400Regular',
    color: colors.onSurface,
    lineHeight: 18,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  badgeCard: {
    width: CARD_W,
    height: 184,
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeLocked: {
    opacity: 0.7,
  },
  badgeIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  badgeTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
    textAlign: 'center',
    minHeight: 18,
  },
  lockedText: {
    color: colors.onSurfaceVariant,
  },
  badgeDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 15,
    height: 32,
  },
  badgeFooter: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successDim,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unlockedText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: colors.success,
  },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedChipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
});
