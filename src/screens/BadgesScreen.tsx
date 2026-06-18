import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';
import SecurityCard from '../components/SecurityCard';

export default function BadgesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="medal" size={48} color={colors.primary} />
          <Text style={styles.title}>Level 5 Guardian</Text>
          <Text style={styles.subtitle}>You are highly vigilant. Keep it up!</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>20</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Achievements</Text>

        <SecurityCard
          title="Scam Spotter"
          description="Identified 5 suspicious messages."
          icon="eye"
          status="safe"
        />
        <SecurityCard
          title="Verified Protector"
          description="Completed basic security setup."
          icon="shield-checkmark"
          status="safe"
        />
        <SecurityCard
          title="Sim Hero"
          description="Completed 3 scam simulations."
          icon="game-controller"
          status="safe"
        />
        <SecurityCard
          title="Link Sentry"
          description="Verify 10 suspicious links to unlock."
          icon="link"
          status="suspicious"
        />
        <SecurityCard
          title="Call Guardian"
          description="Scan 5 unknown voice calls."
          icon="mic"
          status="suspicious"
        />
        <SecurityCard
          title="Family Shield"
          description="Add 3 trusted contacts."
          icon="people"
          status="suspicious"
        />
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
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginTop: 16,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.display,
    color: colors.primary,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    marginTop: 8,
    marginBottom: 8,
  },
});
