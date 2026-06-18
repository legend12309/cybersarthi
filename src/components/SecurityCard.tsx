import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';

interface Props {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  status?: 'safe' | 'suspicious' | 'blocked';
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export default function SecurityCard({ title, description, icon, iconColor = colors.primary, status, rightAction, children, style }: Props) {
  const getStatusColor = () => {
    if (status === 'safe') return colors.success;
    if (status === 'suspicious') return colors.warning;
    if (status === 'blocked') return colors.error;
    return iconColor;
  };

  const accentColor = getStatusColor();

  return (
    <View style={[styles.card, style]}>
      {/* Left accent bar */}
      <View style={[styles.leftAccent, { backgroundColor: accentColor }]} />
      
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                <Ionicons name={icon} size={22} color={iconColor} />
              </View>
            )}
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>{title}</Text>
              {description && <Text style={styles.description}>{description}</Text>}
            </View>
          </View>
          {status && (
            <View style={[styles.statusChip, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.statusText, { color: accentColor }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          )}
          {rightAction && (
            <View style={styles.rightActionContainer}>
              {rightAction}
            </View>
          )}
        </View>
        {children && <View style={styles.childrenContainer}>{children}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
  },
  cardContent: {
    padding: 16,
    paddingLeft: 20, // Add extra padding to clear the left accent bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: 'PublicSans_600SemiBold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  description: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 20,
  },
  childrenContainer: {
    marginTop: 12,
  },
  rightActionContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
