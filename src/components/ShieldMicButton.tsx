import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';

interface Props {
  onPress: () => void;
  style?: ViewStyle;
  isListening?: boolean;
}

export default function ShieldMicButton({ onPress, style, isListening }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isListening && styles.listening,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="mic" size={36} color={colors.surface} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  listening: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
});
