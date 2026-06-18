import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.containerPadding * 2 - 16) / 2;

export default function BadgesScreen() {
  const BadgeCard = ({ title, desc, icon, isUnlocked, status }: any) => {
    const iconBgColor = isUnlocked
      ? status === 'safe'
        ? colors.secondary + '20'
        : colors.primary + '20'
      : colors.onSurfaceVariant + '15';
      
    const iconColor = isUnlocked
      ? status === 'safe'
        ? colors.secondary
        : colors.primary
      : colors.onSurfaceVariant + '80';

    return (
      <View style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}>
        <View style={[styles.badgeIconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={28} color={iconColor} />
        </View>
        <Text style={styles.badgeTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.badgeDesc} numberOfLines={2}>{desc}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.medalCircle}>
            <Ionicons name="medal" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Level 5 Guardian</Text>
          <Text style={styles.subtitle}>You are highly vigilant. Keep it up!</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>20</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Achievements</Text>

        <View style={styles.grid}>
          <BadgeCard
            title="Scam Spotter"
            desc="Identified 5 suspicious messages."
            icon="eye"
            isUnlocked={true}
            status="safe"
          />
          <BadgeCard
            title="Verified Protector"
            desc="Completed basic security setup."
            icon="shield-checkmark"
            isUnlocked={true}
            status="safe"
          />
          <BadgeCard
            title="Sim Hero"
            desc="Completed 3 scam simulations."
            icon="game-controller"
            isUnlocked={true}
            status="safe"
          />
          <BadgeCard
            title="Link Sentry"
            desc="Verify 10 suspicious links to unlock."
            icon="link"
            isUnlocked={false}
            status="suspicious"
          />
          <BadgeCard
            title="Call Guardian"
            desc="Scan 5 unknown voice calls."
            icon="mic"
            isUnlocked={false}
            status="suspicious"
          />
          <BadgeCard
            title="Family Shield"
            desc="Add 3 trusted contacts."
            icon="people"
            isUnlocked={false}
            status="suspicious"
          />
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
    paddingBottom: 88, // bottom nav height offset
    gap: spacing.stackGap,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  medalCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginVertical: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLine: {
    width: 1,
    height: 32,
    backgroundColor: colors.onSurfaceVariant + '20',
  },
  statNumber: {
    ...typography.display,
    color: colors.primary,
    fontSize: 28,
    lineHeight: 32,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: 12,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  badgeCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.onSurfaceVariant + '10',
    minHeight: 156,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeTitle: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    ...typography.labelSm,
    fontSize: 11,
    lineHeight: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
