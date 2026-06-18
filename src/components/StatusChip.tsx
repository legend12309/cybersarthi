import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../lib/colors';

interface Props {
  status: 'safe' | 'suspicious' | 'warning';
  label: string;
}

export default function StatusChip({ status, label }: Props) {
  let bgColor = colors.success + '20';
  let textColor = colors.success;

  if (status === 'warning') {
    bgColor = colors.warning + '20';
    textColor = colors.warning;
  } else if (status === 'suspicious') {
    bgColor = colors.error + '20';
    textColor = colors.error;
  }

  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  text: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
