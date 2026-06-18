import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';
import SecurityCard from '../components/SecurityCard';

export default function SimulatorScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.levelBadge}>
            <Ionicons name="medal" size={20} color={colors.primary} />
            <Text style={styles.levelText}>Level 2: Vigilant</Text>
          </View>
          <Text style={styles.title}>Practice Your Safety Skills</Text>
          <Text style={styles.subtitle}>Master how to spot and stop scams in real-time.</Text>
        </View>

        <SecurityCard 
          title="Fake Electricity Bill" 
          description="Most Common"
          icon="receipt-outline"
        >
          <TouchableOpacity style={styles.startSimButton}>
            <Ionicons name="play" size={20} color={colors.primary} />
            <Text style={styles.startSimText}>Start Sim</Text>
          </TouchableOpacity>
        </SecurityCard>

        <SecurityCard 
          title="The Lucky Winner SMS" 
          description="New"
          icon="chatbubble-ellipses-outline"
        >
          <TouchableOpacity style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </SecurityCard>

        <SecurityCard 
          title="Suspicious UPI Request" 
          description="Hard"
          icon="wallet-outline"
        >
          <TouchableOpacity style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </SecurityCard>

        <SecurityCard 
          title="Bank KYC Update Call" 
          icon="headset-outline"
        >
          <TouchableOpacity style={styles.chevronButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </SecurityCard>
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
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 4,
  },
  levelText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  startSimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  startSimText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  chevronButton: {
    position: 'absolute',
    right: 16,
    top: 24,
  },
});