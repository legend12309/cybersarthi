import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, FlatList,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { speechToText, chatWithSarvam, textToSpeech, playAudio, stopAudio } from '../lib/sarvam';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAudioPlaying?: boolean;
}

type AppState = 'idle' | 'starting' | 'recording' | 'thinking' | 'playing';

export default function VoiceScreen({ navigation }: any) {
  const { t, languageCode } = useLanguage();
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const insets = useSafeAreaInsets();

  const isMounted = useRef(true);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    isMounted.current = true;
    Audio.requestPermissionsAsync();
    setMessages([{ id: 'welcome', sender: 'ai', text: t('voice_default_instruction') }]);
    return () => { isMounted.current = false; cleanupAudioAndRecording(); };
  }, [languageCode]);

  useEffect(() => {
    if (!isFocused) { cleanupAudioAndRecording(); setAppState('idle'); }
  }, [isFocused]);

  const cleanupAudioAndRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setRecording(null);
    stopAudio().catch(() => {});
    Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, playThroughEarpieceAndroid: false }).catch(() => {});
  };

  const getOfflineAIReply = (text: string, lang: string): string => {
    const q = text.toLowerCase().trim();
    const isHi = lang.startsWith('hi'), isMr = lang.startsWith('mr'),
          isTa = lang.startsWith('ta'), isTe = lang.startsWith('te'), isGu = lang.startsWith('gu');

    if (q.includes('electricity') || q.includes('bill') || q.includes('बिजली') || q.includes('बिल')) {
      if (isHi) return 'बिजली बिल स्कैम में जालसाज तुरंत कनेक्शन काटने की धमकी देते हैं। किसी भी अज्ञात नंबर पर पैसे न भेजें।';
      if (isMr) return 'वीज बिल घोटाळ्यात फसवणूक करणारे वीज कापण्याची धमकी देतात. कोणालाही पैसे पाठवू नका.';
      if (isGu) return 'લાઈટ બિલ ફ્રોડમાં સ્કેમર્સ ધમકી આપે છે. અજાણ્યા નંબર પર ક્યારેય ચૂકવણી ન કરો.';
      if (isTa) return 'மின் கட்டண மோசடியில் மின்சாரம் துண்டிக்கப்படும் என்று அச்சுறுத்துவார்கள். பணம் அனுப்ப வேண்டாம்.';
      if (isTe) return 'కరెంట్ బిల్లు మోసాలలో కనెక్షన్ కట్ చేస్తామని బెదిరిస్తారు. డబ్బులు పంపకండి.';
      return 'In electricity bill scams, fraudsters threaten immediate disconnection. Never pay on unknown numbers.';
    }
    if (q.includes('lottery') || q.includes('winner') || q.includes('win') || q.includes('लॉटरी') || q.includes('इनाम')) {
      if (isHi) return 'लॉटरी स्कैम में इनाम पाने के लिए पहले पैसे मांगे जाते हैं। असली लॉटरी कभी पैसे नहीं मांगती।';
      if (isMr) return 'लॉटरी घोटाळ्यात बक्षीस देण्यासाठी आधी शुल्क मागतात. वैध संस्था पैसे मागत नाही.';
      if (isGu) return 'લોટરી ફ્રોડમાં ઈનામ આપવા પ્રોસેસિંગ ફી માંગવામાં આવે. આ ફ્રોડ છે.';
      if (isTa) return 'லாட்டரி மோசடியில் பரிசு பெற முன்கூட்டிய பணம் கேட்பர். இது மோசடி.';
      if (isTe) return 'లాటరీ మోసాలలో బహుమతికి ముందే డబ్బు కడతారు. ఇది మోసం.';
      return 'In lottery scams, they demand an upfront fee to claim winnings. No legitimate lottery does this.';
    }
    if (q.includes('otp') || q.includes('kyc') || q.includes('pin') || q.includes('ओटीपी')) {
      if (isHi) return 'बैंक कर्मचारी कभी फोन पर OTP या PIN नहीं मांगते। किसी को भी न दें।';
      if (isMr) return 'बँक अधिकारी फोनवर ओटीपी मागत नाहीत. कोणाशीही शेअर करू नका.';
      if (isGu) return 'બેન્ક ક્યારેય ફોન પર OTP નથી માંગતી. શેર ન કરો.';
      if (isTa) return 'வங்கிகள் ஒருபோதும் தொலைபேசியில் ஓடிபி கேட்காது.';
      if (isTe) return 'బ్యాంకులు ఎన్నడూ ఫోన్‌లో OTP అడగవు.';
      return 'Bank officials never call to ask for OTPs or PINs. Never share them with anyone.';
    }
    if (isHi) return 'नमस्ते! मैं साइबरसाथी हूँ। किसी भी संदिग्ध कॉल, संदेश या लिंक के बारे में पूछें।';
    if (isMr) return 'नमस्कार! मी सायबरसाथी आहे. कोणत्याही संशयास्पद गोष्टीबद्दल विचारा.';
    if (isGu) return 'નમસ્તે! સાયબરસાથી. કોઈ શંકાસ્પદ બાબત પૂછો.';
    if (isTa) return 'வணக்கம்! சைபர்சாதி. மோசடி பற்றி கேளுங்கள்.';
    if (isTe) return 'నమస్తే! సైబర్‌సాథి. మోసాల గురించి అడగండి.';
    return 'Hello! I am CyberSaathi. Ask me to verify any suspicious call, message, link, or transaction.';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = textToSend || inputText.trim();
    if (!msgText) return;
    if (!textToSend) setInputText('');
    Keyboard.dismiss();
    const userMsgId = 'u_' + Date.now();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: msgText }]);
    setAppState('thinking');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    let aiText = '';
    try { aiText = await chatWithSarvam(msgText, languageCode); }
    catch { aiText = getOfflineAIReply(msgText, languageCode); }
    if (!isMounted.current) return;
    const aiMsgId = 'a_' + Date.now();
    setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: aiText }]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      setAppState('playing');
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isAudioPlaying: true } : m));
      const audio = await textToSpeech(aiText, languageCode);
      if (isMounted.current) await playAudio(audio);
    } catch { }
    finally {
      if (isMounted.current) {
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isAudioPlaying: false } : m));
        setAppState('idle');
      }
    }
  };

  const startRecording = async () => {
    if (appState !== 'idle') return;
    try {
      setAppState('starting');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, playThroughEarpieceAndroid: false });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        android: { extension: '.wav', outputFormat: Audio.AndroidOutputFormat.MPEG_4, audioEncoder: Audio.AndroidAudioEncoder.AAC, sampleRate: 16000, numberOfChannels: 1, bitRate: 128000 },
        ios: { extension: '.wav', audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: 16000, numberOfChannels: 1, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
        web: {},
      });
      await rec.startAsync();
      setRecording(rec);
      recordingRef.current = rec;
      setAppState('recording');
    } catch {
      setMessages(prev => [...prev, { id: 'err_' + Date.now(), sender: 'ai', text: t('err_mic_permission') }]);
      setAppState('idle');
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!recording) return;
    setAppState('thinking');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null); recordingRef.current = null;
      if (!uri) throw new Error('No audio');
      let userText = '';
      try { userText = await speechToText(uri, languageCode); }
      catch {
        setMessages(prev => [...prev, { id: 'err_stt_' + Date.now(), sender: 'ai', text: t('err_stt_failed') }]);
        setAppState('idle'); return;
      }
      if (userText.trim()) await handleSendMessage(userText);
      else setAppState('idle');
    } catch { setAppState('idle'); }
  };

  const handleMicPress = () => {
    if (appState === 'idle') startRecording();
    else if (appState === 'recording') stopRecordingAndProcess();
  };

  const handleStopSpeech = async () => {
    await stopAudio();
    setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
    setAppState('idle');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';
    return (
      <View style={[styles.msgRow, isAI ? styles.aiRow : styles.userRow]}>
        {isAI && (
          <View style={styles.avatar}>
            <MaterialIcons name="security" size={16} color={colors.onPrimary} />
          </View>
        )}
        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>
            {item.text}
          </Text>
          {item.isAudioPlaying && (
            <TouchableOpacity style={styles.stopSpeech} onPress={handleStopSpeech}>
              <MaterialIcons name="volume-off" size={14} color={colors.primary} />
              <Text style={styles.stopSpeechLabel}>{t('voice_status_speaking')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Status bar color/label
  const statusInfo = {
    idle:      { color: colors.success,  label: 'Ready' },
    starting:  { color: colors.warning,  label: 'Starting...' },
    recording: { color: colors.error,    label: t('voice_status_listening') },
    thinking:  { color: colors.primary,  label: t('voice_status_thinking')  },
    playing:   { color: colors.primary,  label: t('voice_status_speaking')  },
  }[appState];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <MaterialIcons name="security" size={22} color={colors.primary} />
          <Text style={styles.brandText}>AI Chat</Text>
        </View>
        {/* Status pill */}
        <View style={[styles.statusPill, { borderColor: statusInfo.color + '40', backgroundColor: statusInfo.color + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* ── Messages ─────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* ── State Indicators ─────────────────────────────────── */}
      {appState === 'thinking' && (
        <View style={styles.indicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.indicatorText}>{t('voice_status_thinking')}</Text>
        </View>
      )}
      {appState === 'recording' && (
        <View style={styles.indicator}>
          <View style={styles.recDot} />
          <Text style={[styles.indicatorText, { color: colors.error }]}>{t('voice_status_listening')}</Text>
        </View>
      )}

      {/* ── Input Row ────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={t('voice_default_instruction')?.slice(0, 30) + '…'}
            placeholderTextColor={colors.onSurfaceVariant + '60'}
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={() => handleSendMessage()}
            editable={appState === 'idle'}
          />
          {inputText.trim() ? (
            <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMessage()}>
              <MaterialIcons name="send" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, appState === 'recording' && styles.sendBtnRec]}
              onPress={handleMicPress}
              disabled={appState === 'starting' || appState === 'thinking' || appState === 'playing'}
            >
              <MaterialIcons name={appState === 'recording' ? 'stop' : 'mic'} size={22} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderColor: colors.surfaceBorder,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 12 },

  chatList: { padding: 16, gap: 12, paddingBottom: 16 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3 },
  aiRow: { justifyContent: 'flex-start', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  bubble: {
    maxWidth: '80%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  bubbleText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, lineHeight: 21 },
  aiText: { color: colors.onSurface },
  userText: { color: colors.onPrimary },
  stopSpeech: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, backgroundColor: colors.primaryGlow,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, alignSelf: 'flex-start',
  },
  stopSpeechLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: colors.primary },

  indicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  indicatorText: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderColor: colors.surfaceBorder,
    // Provide sufficient padding for gesture bars, without duplicating tab bar space if possible.
    paddingBottom: Math.max(10, insets.bottom),
  },
  input: {
    flex: 1, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingHorizontal: 16, fontSize: 14,
    fontFamily: 'PublicSans_400Regular', color: colors.onSurface,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  sendBtnRec: { backgroundColor: colors.error },
});