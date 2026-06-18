import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { spacing } from '../lib/spacing';
import SecurityCard from '../components/SecurityCard';

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={styles.brandText}>CyberSaathi</Text>
          </View>
          <Ionicons name="person-circle" size={32} color={colors.primary} />
        </View>

        <SecurityCard 
          title="Daily Scam Alert" 
          icon="warning" 
          iconColor={colors.tertiary}
        >
          <Text style={styles.alertText}>
            <Text style={{ fontFamily: 'PublicSans_700Bold' }}>Fake Electricity Bill</Text> threats are on the rise. Tap to learn how to stay safe.
          </Text>
        </SecurityCard>

        <TouchableOpacity 
          style={styles.mainActionCard}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.9}
        >
          <View style={styles.micCircle}>
            <Ionicons name="mic" size={48} color={colors.onPrimary} />
          </View>
          <Text style={styles.mainActionTitle}>Tap to ask CyberSaathi anything</Text>
          <Text style={styles.mainActionSubtitle}>
            I'm here to help you verify messages, links, or callers instantly.
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Scan Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="headset-outline" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Report Fraud</Text>
          </TouchableOpacity>
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
    gap: spacing.stackGap,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    ...typography.headlineLg,
    color: colors.primary,
  },
  alertText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  mainActionCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  micCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  mainActionTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  mainActionSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  actionText: {
    ...typography.labelSm,
    color: colors.primary,
    marginTop: 8,
  },
});