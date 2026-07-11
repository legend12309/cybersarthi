import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Animated, Easing,
  TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { speechToText, chatWithSarvam, textToSpeech, classifyContent } from '../lib/sarvam';
import { useLanguage } from '../context/LanguageContext';
import { ChatInput } from '../components/ChatInput';

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
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const player = useAudioPlayer();
  const [messages, setMessages] = useState<Message[]>([]);

  const isMounted = useRef(true);
  const flatListRef = useRef<FlatList>(null);
  const recordingTimeoutRef = useRef<any>(null);
  const spokenLanguageRef = useRef<string | null>(null);

  // Animations for mic pulse
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    isMounted.current = true;
    
    // Pre-request permissions and pre-configure audio mode to eliminate delay on press
    const setupAudio = async () => {
      try {
        const { granted } = await AudioModule.requestRecordingPermissionsAsync();
        if (granted) {
          await AudioModule.setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
            playThroughEarpiece: false,
          } as any);
        }
      } catch (e) {
        console.warn('setupAudio error:', e);
      }
    };
    setupAudio();

    // Listen for playback finished
    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
        setAppState('idle');
      }
    });

    const welcomeText = t('voice_default_instruction');
    setMessages([{ id: 'welcome', sender: 'ai', text: welcomeText }]);
    
    // Auto-speak the greeting
    const speakWelcome = async () => {
      if (spokenLanguageRef.current === languageCode) return;
      spokenLanguageRef.current = languageCode;
      try {
        setAppState('playing');
        setMessages(prev => prev.map(m => m.id === 'welcome' ? { ...m, isAudioPlaying: true } : m));
        const audioUri = await textToSpeech(welcomeText, languageCode);
        if (isMounted.current && audioUri) {
          player.replace(audioUri);
          player.play();
        }
      } catch (err) {
        if (isMounted.current) {
          setAppState('idle');
          setMessages(prev => prev.map(m => m.id === 'welcome' ? { ...m, isAudioPlaying: false } : m));
        }
      }
    };
    speakWelcome();
    return () => { 
      isMounted.current = false; 
      subscription.remove();
      cleanupAudioAndRecording(); 
    };
  }, [languageCode, player]);

  useEffect(() => {
    if (!isFocused) { cleanupAudioAndRecording(); setAppState('idle'); }
  }, [isFocused]);

  useEffect(() => {
    // Auto-scroll when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (appState === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.6, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.4);
    }
  }, [appState]);

  const cleanupAudioAndRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (appState === 'recording' || appState === 'starting') {
      try { recorder.stop().catch((e) => console.warn('Recorder stop error', e)); } catch(e) {}
    }
    try { if (player.playing) player.pause(); } catch(e) {}
    try {
      AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, playThroughEarpiece: false } as any).catch((e) => console.warn('AudioMode err', e));
    } catch(e) {}
  };

  const getOfflineAIReply = (text: string, lang: string): string => {
    const q = text.toLowerCase().trim();
    const isHi = lang === 'hi-IN', isMr = lang === 'mr-IN',
          isTa = lang === 'ta-IN', isTe = lang === 'te-IN', isGu = lang === 'gu-IN';

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

  const handleSendMessage = useCallback(async (textToSend: string) => {
    const msgText = textToSend.trim();
    if (!msgText) return;

    try {
      // console.log('[PIPELINE] Starting chat...');
      const userMsgId = 'u_' + Date.now();
      setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: msgText }]);
      setAppState('thinking');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      let aiText = '';
      try { 
        aiText = await chatWithSarvam(msgText, languageCode); 
        // console.log('[PIPELINE] Chat result:', aiText);
      } catch (chatError) { 
        // console.log('[CHAT] error:', chatError);
        aiText = getOfflineAIReply(msgText, languageCode); 
        // console.log('[PIPELINE] Chat fallback result:', aiText);
      }
      
      if (!isMounted.current) return;
      
      const aiMsgId = 'a_' + Date.now();
      setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: aiText }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // console.log('[PIPELINE] Starting TTS...');
      setAppState('playing');
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isAudioPlaying: true } : m));
      
      let audio = '';
      try {
        audio = await textToSpeech(aiText, languageCode);
        // console.log('[PIPELINE] TTS result length:', audio?.length);
      } catch (ttsError) {
        // console.log('[TTS] error:', ttsError);
        if (isMounted.current) {
          setMessages(prev => [...prev, { id: 'err_tts_' + Date.now(), sender: 'ai', text: t('err_audio_failed') || 'Could not generate audio.' }]);
        }
        throw new Error('TTS failed'); // Skip playback
      }

      // console.log('[PIPELINE] Starting Audio Playback...');
      try {
        if (isMounted.current && audio) {
          player.replace(audio);
          player.play();
          // console.log('[PIPELINE] Audio Playback started.');
          // State transition to idle is handled by the player playbackStatusUpdate listener
        }
      } catch (playbackError) {
        // console.log('[AUDIO PLAYBACK] error:', playbackError);
        if (isMounted.current) {
          setMessages(prev => [...prev, { id: 'err_play_' + Date.now(), sender: 'ai', text: t('err_audio_failed') || 'Could not play audio.' }]);
          setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
          setAppState('idle');
        }
      }

    } catch (globalError) {
      // console.log('[PIPELINE] Global Chat/TTS error:', globalError);
      if (isMounted.current) {
        setMessages(prev => [...prev, { id: 'err_global_' + Date.now(), sender: 'ai', text: t('err_unexpected', 'An unexpected error occurred.') }]);
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
        setAppState('idle');
      }
    }
  }, [languageCode, t, player]);

  const handleTextSubmit = useCallback(async (text: string) => {
    if (!text || appState !== 'idle') return;

    try {
      // console.log('[PIPELINE] Starting text classification...');
      const userMsgId = 'u_' + Date.now();
      setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: `🔗 Checking: ${text}` }]);
      setAppState('thinking');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      let aiText = '';
      let audioText = '';
      try {
        const isUrl = /^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(text) || text.toLowerCase().includes('.com');
        const type = isUrl ? 'url' : 'message';
        
        const { verdict, explanation } = await classifyContent(text, languageCode, type);
        
        const verdictLabel = verdict === 'suspicious' 
          ? (languageCode === 'hi-IN' ? 'ख़तरा (SUSPICIOUS)' : 'SUSPICIOUS')
          : (languageCode === 'hi-IN' ? 'सुरक्षित (SAFE)' : 'SAFE');

        aiText = `[${verdictLabel}]\n${explanation}`;
        audioText = explanation; // Only read the explanation aloud
        // console.log('[PIPELINE] Classification result:', aiText);
      } catch (chatError) { 
        // console.log('[CHAT] error:', chatError);
        const fallbackLabel = languageCode === 'hi-IN' ? 'ख़तरा (SUSPICIOUS)' : 'SUSPICIOUS';
        const fallbackExp = languageCode === 'hi-IN' 
          ? 'नेटवर्क समस्या के कारण लिंक/संदेश की जाँच नहीं हो सकी। कृपया सावधान रहें।' 
          : 'Could not analyze the content due to a network issue. Please be cautious.';
        aiText = `[${fallbackLabel}]\n${fallbackExp}`; 
        audioText = fallbackExp;
        // console.log('[PIPELINE] Fallback result:', aiText);
      }
      
      if (!isMounted.current) return;
      
      const aiMsgId = 'a_' + Date.now();
      setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: aiText }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // console.log('[PIPELINE] Starting TTS...');
      setAppState('playing');
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isAudioPlaying: true } : m));
      
      let audio = '';
      try {
        audio = await textToSpeech(audioText, languageCode);
        // console.log('[PIPELINE] TTS result length:', audio?.length);
      } catch (ttsError) {
        // console.log('[TTS] error:', ttsError);
        if (isMounted.current) {
          setMessages(prev => [...prev, { id: 'err_tts_' + Date.now(), sender: 'ai', text: t('err_audio_failed') || 'Could not generate audio.' }]);
        }
        throw new Error('TTS failed');
      }

      // console.log('[PIPELINE] Starting Audio Playback...');
      try {
        if (isMounted.current && audio) {
          player.replace(audio);
          player.play();
          // console.log('[PIPELINE] Audio Playback started.');
        }
      } catch (playbackError) {
        // console.log('[AUDIO PLAYBACK] error:', playbackError);
        if (isMounted.current) {
          setMessages(prev => [...prev, { id: 'err_play_' + Date.now(), sender: 'ai', text: t('err_audio_failed') || 'Could not play audio.' }]);
          setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
          setAppState('idle');
        }
      }

    } catch (globalError) {
      // console.log('[PIPELINE] Global Chat/TTS error:', globalError);
      if (isMounted.current) {
        setMessages(prev => [...prev, { id: 'err_global_' + Date.now(), sender: 'ai', text: t('err_unexpected', 'An unexpected error occurred.') }]);
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
        setAppState('idle');
      }
    }
  }, [appState, languageCode, player, t]);

  const stopRecordingAndProcess = useCallback(async () => {
    if (appState !== 'recording') return;
    // console.log('[PIPELINE] Stopping recording...');
    setAppState('thinking');

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No audio URI found from recording');
      
      // console.log('[PIPELINE] Starting STT...');
      let userText = '';
      try { 
        userText = await speechToText(uri, languageCode); 
        // console.log('[PIPELINE] STT result:', userText);
      } catch (sttError: any) {
        // console.log('[STT] error:', sttError);
        if (isMounted.current) {
          const isDurationError = sttError.message?.toLowerCase().includes('duration') || 
                                  sttError.message?.toLowerCase().includes('30 second') ||
                                  sttError.message?.toLowerCase().includes('400');
          let errorMsg = t('err_stt_failed') || 'Could not recognize speech.';
          if (isDurationError) {
            if (languageCode === 'hi-IN') errorMsg = 'ऑडियो रिकॉर्डिंग 30 सेकंड से कम होनी चाहिए। कृपया छोटा संदेश आज़माएं।';
            else if (languageCode === 'mr-IN') errorMsg = 'ऑडिओ रेकॉर्डिंग ३० सेकंदांपेक्षा कमी असावे. कृपया लहान मेसेज रेकॉर्ड करा.';
            else if (languageCode === 'ta-IN') errorMsg = 'ஆடியோ பதிவு 30 வினாடிகளுக்கு குறைவாக இருக்க வேண்டும். தயவுசெய்து சிறிய செய்தியை முயற்சிக்கவும்.';
            else if (languageCode === 'te-IN') errorMsg = 'ఆడియో రికార్డింగ్ 30 సెకన్ల కంటే తక్కువ ఉండాలి. దయచేసి చిన్న సందేశాన్ని ప్రయత్నించండి.';
            else if (languageCode === 'gu-IN') errorMsg = 'ઓડિયો રેકોર્ડિંગ 30 સેકન્ડથી ઓછું હોવું જોઈએ. કૃપા કરીને ટૂંકો સંદેશ અજમાવો.';
            else errorMsg = 'Audio recording must be less than 30 seconds. Please try a shorter message.';
          }
          setMessages(prev => [...prev, { id: 'err_stt_' + Date.now(), sender: 'ai', text: errorMsg }]);
          setAppState('idle');
        }
        return;
      }
      
      if (isMounted.current) {
        if (userText.trim()) {
          await handleSendMessage(userText);
        } else {
          // console.log('[PIPELINE] STT result was empty. Resetting to idle.');
          setAppState('idle');
        }
      }
    } catch (globalError) { 
      // console.log('[PIPELINE] Global STT/Processing error:', globalError);
      if (isMounted.current) {
        setMessages(prev => [...prev, { id: 'err_global_stt_' + Date.now(), sender: 'ai', text: t('err_unexpected', 'An unexpected error occurred processing your audio.') }]);
        setAppState('idle'); 
      }
    }
  }, [appState, recorder, languageCode, t, handleSendMessage]);

  const startRecording = useCallback(async () => {
    if (appState !== 'idle') {
      // console.log('[MIC] Ignored press, appState is not idle:', appState);
      return;
    }
    // console.log('[PIPELINE] Starting recording process...');
    try {
      setAppState('starting');

      // Check cached permission first to avoid slow native OS prompt
      const status = await AudioModule.getRecordingPermissionsAsync();
      let granted = status.granted;
      if (!granted) {
        const req = await AudioModule.requestRecordingPermissionsAsync();
        granted = req.granted;
      }

      if (!granted) {
        // console.log('[MIC] Permission denied by user');
        if (isMounted.current) {
          setMessages(prev => [...prev, { id: 'err_perm_' + Date.now(), sender: 'ai', text: t('err_mic_permission') || 'Microphone permission denied. Please allow microphone access in Settings.' }]);
          setAppState('idle');
        }
        return;
      }

      // Audio mode is pre-set on mount, but check allowances
      await recorder.prepareToRecordAsync();
      recorder.record();
      setAppState('recording');
      // console.log('[PIPELINE] Recording started.');

      // Auto-stop recording at 28 seconds to prevent exceeding 30-second API limit
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      recordingTimeoutRef.current = setTimeout(() => {
        // console.log('[MIC] Auto-stopping recording (28s limit reached)');
        stopRecordingAndProcess();
      }, 28000);

    } catch (error) {
      // console.log('[MIC] error:', error);
      if (isMounted.current) {
        setMessages(prev => [...prev, { id: 'err_' + Date.now(), sender: 'ai', text: t('err_mic_permission') || 'Could not start microphone.' }]);
        setAppState('idle');
      }
    }
  }, [appState, recorder, t, stopRecordingAndProcess]);

  const handleMicPress = useCallback(() => {
    if (appState === 'idle') startRecording();
    else if (appState === 'recording') stopRecordingAndProcess();
  }, [appState, startRecording, stopRecordingAndProcess]);

  const handleStopSpeech = useCallback(async () => {
    if (player.playing) {
      player.pause();
    }
    setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
    setAppState('idle');
  }, [player]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return <MessageItem item={item} onStopSpeech={handleStopSpeech} t={t} />;
  }, [handleStopSpeech, t]);

  const statusInfo = {
    idle:      { color: colors.success,  label: t('voice_status_ready') },
    starting:  { color: colors.warning,  label: t('voice_status_starting') },
    recording: { color: colors.error,    label: t('voice_status_listening') },
    thinking:  { color: colors.primary,  label: t('voice_status_thinking')  },
    playing:   { color: colors.primary,  label: t('voice_status_speaking')  },
  }[appState];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <MaterialIcons name="security" size={22} color={colors.primary} />
          <Text style={styles.brandText}>{t('tab_voice')}</Text>
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
        style={styles.flex1}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />


      {/* ── Input Area (Voice-first) ─────────────────────────── */}
      <View style={styles.micContainer}>
        
        {/* Secondary Text Input */}
        <ChatInput
          onSubmit={handleTextSubmit}
          disabled={appState !== 'idle'}
          placeholder={t('home_link_scan_input') || 'Paste link or message...'}
          styleType="voice"
        />

        <View style={styles.micRingWrap}>
          {appState === 'recording' && (
            <Animated.View style={[styles.pulseRing, { top: 0, left: 0, transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          )}
          
          <TouchableOpacity
            style={[
              styles.heroMicBtn,
              styles.mb0,
              appState === 'recording' && styles.heroMicBtnRec,
              appState === 'thinking' && styles.heroMicBtnThinking,
              appState === 'playing' && styles.heroMicBtnPlaying
            ]}
            onPress={handleMicPress}
            disabled={appState === 'starting' || appState === 'thinking' || appState === 'playing'}
            activeOpacity={0.8}
          >
          {appState === 'thinking' ? (
            <ActivityIndicator size="large" color={colors.onPrimary} />
          ) : appState === 'playing' ? (
            <MaterialIcons name="volume-up" size={36} color={colors.onPrimary} />
          ) : (
            <MaterialIcons name={appState === 'recording' ? 'stop' : 'mic'} size={36} color={colors.onPrimary} />
          )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.micHelperText}>
          {appState === 'idle' ? t('home_mic_title') || 'Tap to Speak'
            : appState === 'recording' ? t('voice_status_listening')
            : appState === 'thinking' ? t('voice_status_thinking')
            : t('voice_status_speaking')}
        </Text>
      </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const MessageItem = React.memo(({ item, onStopSpeech, t }: { item: Message, onStopSpeech: () => void, t: any }) => {
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
          <TouchableOpacity style={styles.stopSpeech} onPress={onStopSpeech}>
            <MaterialIcons name="volume-off" size={14} color={colors.primary} />
            <Text style={styles.stopSpeechLabel}>{t('voice_status_speaking')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },

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
  bubbleText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, lineHeight: 21, flexWrap: 'wrap' },
  aiText: { color: colors.onSurface },
  userText: { color: colors.onPrimary },
  stopSpeech: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, backgroundColor: colors.primaryGlow,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, alignSelf: 'flex-start',
  },
  stopSpeechLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: colors.primary },

  indicator: { display: 'none' },
  indicatorText: { display: 'none' },
  recDot: { display: 'none' },

  micContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 16, paddingBottom: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderColor: colors.surfaceBorder,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  textInputContainer: {
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
    width: '90%',
  },
  textInput: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceBorder,
  },
  pulseRing: {
    position: 'absolute', top: 24,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.error,
  },
  heroMicBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginBottom: 16,
  },
  heroMicBtnRec: { backgroundColor: colors.error, shadowColor: colors.error },
  heroMicBtnThinking: { backgroundColor: colors.warning, shadowColor: colors.warning },
  heroMicBtnPlaying: { backgroundColor: colors.success, shadowColor: colors.success },
  micHelperText: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurfaceVariant },
  flex1: { flex: 1 },
  micRingWrap: { position: 'relative', marginBottom: 16 },
  mb0: { marginBottom: 0 },
});