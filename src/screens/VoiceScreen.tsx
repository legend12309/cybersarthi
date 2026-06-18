import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import { typography } from '../lib/typography';
import { speechToText, chatWithSarvam, textToSpeech, playAudio } from '../lib/sarvam';

type AppState = 'idle' | 'recording' | 'thinking' | 'playing';

export default function VoiceScreen({ navigation }: any) {
  const [appState, setAppState] = useState<AppState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [languageCode, setLanguageCode] = useState<string>('hi-IN');

  useEffect(() => {
    const loadLanguage = async () => {
      const code = await AsyncStorage.getItem('cybersaathi.language');
      if (code) {
        setLanguageCode(code);
      }
    };
    loadLanguage();
    Audio.requestPermissionsAsync();
  }, []);

  const startRecording = async () => {
    try {
      setErrorMsg('');
      setTranscript('');
      setReply('');
      setAppState('recording');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.aac',
          outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
      setErrorMsg('Failed to start recording. Please check microphone permissions.');
      setAppState('idle');
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recording) return;
    
    setAppState('thinking');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) throw new Error('No audio recorded');

      const userText = await speechToText(uri, languageCode);
      setTranscript(userText);

      const aiReply = await chatWithSarvam(userText, languageCode);
      setReply(aiReply);

      const aiAudioBase64 = await textToSpeech(aiReply, languageCode);

      setAppState('playing');
      await playAudio(aiAudioBase64);

      setAppState('idle');
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setAppState('idle');
    }
  };

  const handleMicPress = () => {
    if (appState === 'idle') {
      startRecording();
    }
  };

  const handleEndSession = () => {
    if (appState === 'recording') {
      stopRecordingAndProcess();
    } else {
      setAppState('idle');
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.brandText}>CyberSaathi</Text>
        </View>
        <Ionicons name="person-circle" size={32} color={colors.primary} />
      </View>

      <ScrollView contentContainerStyle={styles.chatArea}>
        <View style={styles.statusIndicator}>
          {appState === 'recording' && <Ionicons name="recording" size={24} color={colors.error} style={{ marginRight: 8 }} />}
          {appState === 'thinking' && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          {appState === 'playing' && <Ionicons name="volume-high" size={24} color={colors.primary} style={{ marginRight: 8 }} />}
          
          <Text style={styles.statusText}>
            {appState === 'idle' && "CyberSaathi Assistant"}
            {appState === 'recording' && "CyberSaathi is listening..."}
            {appState === 'thinking' && "Analyzing your request..."}
            {appState === 'playing' && "CyberSaathi is speaking..."}
          </Text>
        </View>

        {errorMsg ? (
          <View style={[styles.bubble, styles.errorBubble]}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {transcript ? (
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userText}>{transcript}</Text>
          </View>
        ) : null}

        {reply ? (
          <View style={[styles.bubble, styles.aiBubble]}>
            <Text style={styles.aiText}>{reply}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[styles.micFab, appState === 'recording' && styles.micFabActive]}
          onPress={handleMicPress}
          disabled={appState !== 'idle'}
        >
          <Ionicons name="mic" size={40} color={colors.onPrimary} />
        </TouchableOpacity>
        
        {(appState === 'recording' || appState === 'playing') && (
          <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
            <Ionicons name="close-circle-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
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
  chatArea: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  statusText: {
    ...typography.titleMd,
    color: colors.primary,
  },
  bubble: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  userText: {
    ...typography.bodyLg,
    color: colors.surface,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  aiText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  errorBubble: {
    backgroundColor: colors.error + '20',
    alignSelf: 'center',
    borderColor: colors.error,
    borderWidth: 1,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
  },
  bottomControls: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  micFab: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  micFabActive: {
    backgroundColor: colors.error,
    transform: [{ scale: 1.1 }],
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  endButtonText: {
    ...typography.labelSm,
    color: colors.error,
  },
});