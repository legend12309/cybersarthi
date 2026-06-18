import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../lib/colors';
import SecurityCard from '../components/SecurityCard';

export default function QuizScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Badges & Achievements</Text>
      
      <SecurityCard title="Novice Guardian" icon="star" iconColor={colors.warning}>
        <Text style={styles.description}>Complete 3 simulator scenarios to earn this badge.</Text>
      </SecurityCard>

      <SecurityCard title="Phishing Expert" icon="lock-closed" iconColor={colors.success}>
        <Text style={styles.description}>You correctly identified 5 phishing attempts!</Text>
      </SecurityCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontFamily: 'Manrope_700Bold', fontSize: 24, color: colors.onSurface, marginBottom: 24 },
  description: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant },
});