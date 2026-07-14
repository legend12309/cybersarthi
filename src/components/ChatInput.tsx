import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../lib/colors';

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
  styleType?: 'voice' | 'roleplay';
}

export const ChatInput = React.memo(({ onSubmit, disabled, placeholder, styleType = 'voice' }: ChatInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText('');
  };

  const isVoice = styleType === 'voice';

  return (
    <View style={isVoice ? styles.voiceContainer : styles.roleplayContainer}>
      <TextInput
        style={isVoice ? styles.voiceInput : styles.roleplayInput}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={text}
        onChangeText={setText}
        multiline={isVoice}
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          isVoice ? styles.voiceSendBtn : styles.roleplaySendBtn,
          (!text.trim() || disabled) && (isVoice ? styles.voiceSendDisabled : styles.roleplaySendDisabled)
        ]}
        onPress={handleSend}
        disabled={disabled || !text.trim()}
      >
        <MaterialIcons name="send" size={isVoice ? 18 : 24} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
});

ChatInput.displayName = 'ChatInput';

const styles = StyleSheet.create({
  // VoiceScreen style
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignSelf: 'stretch',
  },
  voiceInput: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    maxHeight: 100,
  },
  voiceSendBtn: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSendDisabled: {
    backgroundColor: colors.surfaceBorder,
  },

  // ScamRoleplayScreen style
  roleplayContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleplayInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 24,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontFamily: 'PublicSans_400Regular',
  },
  roleplaySendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleplaySendDisabled: {
    opacity: 0.5,
  },
});
