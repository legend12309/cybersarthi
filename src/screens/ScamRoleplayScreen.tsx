import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing, ToastAndroid, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { ChatInput } from '../components/ChatInput';
import { submitScamReport } from '../lib/api';
import { roleplayWithSarvam, evaluateRoleplay, speechToText, textToSpeech } from '../lib/sarvam';
import { scammerPersonas } from '../data/scammerPersonas';
import scamsData from '../data/scams.json';

type Message = { id: string, role: 'user' | 'assistant' | 'system' | 'system_context', content: string };

export default function ScamRoleplayScreen({ route, navigation }: any) {
  const { scamId, mode } = route.params || { scamId: 'electricity_bill', mode: 'text' };
  const { t, deviceId, languageCode } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const [exchanges, setExchanges] = useState(0);
  const [evaluation, setEvaluation] = useState<{verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string} | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);
  const insets = useSafeAreaInsets();

  // Audio Hooks & Animations
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const player = useAudioPlayer();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const recordingTimeoutRef = useRef<any>(null);
  const startedLanguageRef = useRef<string | null>(null);
  const playTokenRef = useRef(0);



  const languageName = {
    'hi-IN': 'Hindi. आपको केवल हिंदी (Hindi) में ही जवाब देना है।',
    'mr-IN': 'Marathi. तुम्हाला फक्त मराठी (Marathi) मध्येच उत्तर द्यायचे आहे।',
    'bn-IN': 'Bengali. আপনাকে কেবল বাংলা (Bengali) ভাষাতেই উত্তর দিতে হবে।',
    'ta-IN': 'Tamil. நீங்கள் தமிழ் (Tamil) மொழியில் மட்டுமே பதிலளிக்க வேண்டும்.',
    'te-IN': 'Telugu. మీరు తెలుగు (Telugu) లో మాత్రమే సమాధానం చెప్పాలి.',
    'gu-IN': 'Gujarati. તમારે ફક્ત ગુજરાતી (Gujarati) માં જ જવાબ આપવાનો છે.',
    'en-IN': 'English'
  }[languageCode] || 'English';

  const rawPersona = scammerPersonas[scamId] || scammerPersonas['electricity_bill'];
  const persona = rawPersona.replace('${languageName}', languageName);
  
  const scamInfo = scamsData.find(s => s.id === scamId) || scamsData[0];

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
    if (mode === 'voice') {
      setupAudio();
    }
    
    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        setIsTyping(false);
      }
    });

    startRoleplay();
    
    return () => { 
      isMounted.current = false; 
      subscription.remove();
      cleanupAudioAndRecording();
    };
  }, [mode]);

  useEffect(() => {
    if (isRecording) {
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
    return () => pulseLoop.current?.stop();
  }, [isRecording]);

  const cleanupAudioAndRecording = () => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    try { recorder.stop().catch(() => {}); } catch(e) {}
    try { if (player.playing) player.pause(); } catch(e) {}
    try {
      AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, playThroughEarpiece: false } as any).catch(() => {});
    } catch(e) {}
  };

  const getInitialScammerMessage = (lang: string) => {
    switch (lang) {
      case 'hi-IN': return "नमस्ते, क्या मेरी बात कनेक्शन नंबर 4521 के मालिक से हो रही है? मैं राज्य बिजली बोर्ड से अमित बोल रहा हूँ। आपका 3,240 रुपये का बिल बकाया है और हम आज रात आपकी बिजली काटने के लिए एक टीम भेज रहे हैं।";
      case 'mr-IN': return "नमस्कार, मी राज्य वीज मंडळातून अमित बोलत आहे. तुमचे ₹3,240 चे बिल प्रलंबित आहे आणि आज रात्री तुमचे कनेक्शन कापले जाईल.";
      case 'bn-IN': return "নমস্কার, আমি রাজ্য বিদ্যুৎ পর্ষদ থেকে অমিত বলছি। আপনার ৩,২৪০ টাকার বিল বকেয়া আছে এবং আজ রাতে আপনার বিদ্যুৎ সংযোগ বিচ্ছিন্ন করা হবে।";
      case 'ta-IN': return "வணக்கம், நான் மின்சார வாரியத்திலிருந்து அமித் பேசுகிறேன். உங்கள் மின் கட்டணம் ₹3,240 நிலுவையில் உள்ளது. இன்று இரவு மின்சாரம் துண்டிக்கப்படும்.";
      case 'te-IN': return "నమస్తే, నేను విద్యుత్ బోర్డు నుండి అమిత్ మాట్లాడుతున్నాను. మీ కరెంటు బిల్లు ₹3,240 పెండింగ్‌లో ఉంది, ఈ రాత్రికి కనెక్షన్ కట్ చేయబడుతుంది.";
      case 'gu-IN': return "નમસ્તે, હું વીજળી બોર્ડમાંથી અમિત બોલું છું. તમારું ₹3,240 નું બિલ બાકી છે અને આજે રાત્રે તમારું કનેક્શન કાપી નાખવામાં આવશે.";
      default: return "Hello, am I speaking to the owner of connection number 4521? This is Amit from the State Electricity Board. Your bill of ₹3,240 is overdue and we are dispatching a team to disconnect your power tonight.";
    }
  };

  const startRoleplay = async () => {
    if (startedLanguageRef.current === languageCode) return;
    startedLanguageRef.current = languageCode;
    try {
      const firstMsg = getInitialScammerMessage(languageCode);
      const initialMessages: Message[] = [
        { id: 'sysctx', role: 'system_context', content: 'You received a call from an unknown number. The caller claims to be from the Electricity Board.' },
        { id: 'sys', role: 'system', content: persona },
        { id: 'usr0', role: 'user', content: 'Hello?' },
        { id: 'ast0', role: 'assistant', content: firstMsg }
      ];
      setMessages(initialMessages);
      
      if (mode === 'voice') {
        playTokenRef.current += 1;
        const currentToken = playTokenRef.current;
        try { if (player.playing) player.pause(); } catch(e) {}

        try {
          const audioUri = await textToSpeech(firstMsg, languageCode);
          if (isMounted.current && currentToken === playTokenRef.current && audioUri) {
            try {
              player.replace(audioUri);
              player.play();
            } catch (playErr) {
              console.log('[ROLEPLAY] Player error on start:', playErr);
              if (isMounted.current) setIsTyping(false);
            }
          } else {
            if (isMounted.current) setIsTyping(false);
          }
        } catch (ttsErr) {
          console.log('[ROLEPLAY] TTS failed on start, continuing in text mode:', ttsErr);
          if (isMounted.current) setIsTyping(false);
        }
      } else {
        setIsTyping(false);
      }
    } catch (error) {
      console.log('[ROLEPLAY] Error starting roleplay:', error);
      if (isMounted.current) {
        // Don't crash — just show the messages without audio and let user continue
        setIsTyping(false);
      }
    }
  };

  const performEvaluation = useCallback(async (finalMessages: Message[]) => {
    const transcript = finalMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'User' : 'Scammer'}: ${m.content}`)
      .join('\n');
      
    const result = await evaluateRoleplay(transcript, scamId, languageCode);
    if (!isMounted.current) return;
    
    setEvaluation(result);
    setIsTyping(false);

    // Call submitScamReport silently
    try {
      if (deviceId) {
        await submitScamReport(deviceId, '', 0, result.verdict === 'PASS' ? 'safe' : 'scam', scamId, scamId, 'simulator', result.verdict === 'PASS');
      }
    } catch (e) {
      // Silent fail
    }
  }, [scamId, languageCode, deviceId]);

  const processUserMessage = useCallback(async (userMsg: string) => {
    const newMessages: Message[] = [...messages, { id: 'u_' + Date.now(), role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      if (exchanges >= 3) {
        // Evaluate now instead of getting another response
        await performEvaluation(newMessages);
      } else {
        const apiMessages = newMessages.filter(m => m.role !== 'system_context').map(m => ({ role: m.role, content: m.content }));
        const scammerResponse = await roleplayWithSarvam(apiMessages as any);
        if (!isMounted.current) return;
        setMessages([...newMessages, { id: 'a_' + Date.now(), role: 'assistant', content: scammerResponse }]);
        setExchanges(prev => prev + 1);
        
        if (mode === 'voice') {
          playTokenRef.current += 1;
          const currentToken = playTokenRef.current;
          try { if (player.playing) player.pause(); } catch(e) {}

          try {
            const audioUri = await textToSpeech(scammerResponse, languageCode);
            if (isMounted.current && currentToken === playTokenRef.current && audioUri) {
              try {
                player.replace(audioUri);
                player.play();
              } catch (playErr) {
                console.log('[ROLEPLAY] Player error:', playErr);
                if (isMounted.current) setIsTyping(false);
              }
            } else {
              if (isMounted.current) setIsTyping(false);
            }
          } catch (ttsErr) {
            console.log('[ROLEPLAY] TTS failed, continuing without audio:', ttsErr);
            if (isMounted.current) setIsTyping(false);
          }
        } else {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.log('[ROLEPLAY] Error processing message:', error);
      if (isMounted.current) {
        let fallbackMsg = "Hello? I can't hear you clearly. Look, the disconnection is scheduled right now, tell me quickly!";
        if (languageCode === 'hi-IN') {
          fallbackMsg = "हेलो? आपकी आवाज़ साफ़ नहीं आ रही है। सुनिए, कनेक्शन कटने वाला है, जल्दी बताइए!";
        } else if (languageCode === 'mr-IN') {
          fallbackMsg = "हॅलो? तुमचा आवाज स्पष्ट येत नाहीये. ऐका, कनेक्शन कापले जाणार आहे, लवकर सांगा!";
        } else if (languageCode === 'ta-IN') {
          fallbackMsg = "ஹலோ? உங்கள் குரல் தெளிவாக கேட்கவில்லை. இணைப்பு துண்டிக்கப்படப் போகிறது, சீக்கிரம் சொல்லுங்கள்!";
        } else if (languageCode === 'te-IN') {
          fallbackMsg = "హలో? మీ వాయిస్ స్పష్టంగా వినిపించడం లేదు. కనెక్షన్ కట్ కాబోతోంది, త్వరగా చెప్పండి!";
        } else if (languageCode === 'gu-IN') {
          fallbackMsg = "હેલો? તમારો અવાજ સ્પષ્ટ નથી આવી રહ્યો. કનેક્શન કપાઈ જશે, જલ્દી જણાવો!";
        }

        setMessages(prev => [...prev, { 
          id: 'err_' + Date.now().toString(),
          role: 'assistant', 
          content: fallbackMsg
        }]);
        setIsTyping(false);
      }
    }
  }, [messages, exchanges, scamId, languageCode, mode, player, performEvaluation]);

  const handleSendText = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    await processUserMessage(text.trim());
  }, [isTyping, processUserMessage]);

  const toggleRecord = useCallback(async () => {
    if (isTyping) return; // Ignore if AI is speaking or thinking

    if (isRecording) {
      setIsRecording(false);
      setIsTyping(true); // Lock while processing
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error("No audio URI");
        
        const transcript = await speechToText(uri, languageCode);
        if (transcript.trim()) {
           await processUserMessage(transcript);
        } else {
           setIsTyping(false);
        }
      } catch (err) {
        console.log('[ROLEPLAY] Voice STT error:', err);
        if (isMounted.current) {
          ToastAndroid.show(t('err_unexpected', 'Could not process audio. Try again.'), ToastAndroid.SHORT);
          setIsTyping(false);
          setIsRecording(false);
        }
      }
    } else {
      try {
        // Check cached permission first to avoid slow native OS prompt
        const status = await AudioModule.getRecordingPermissionsAsync();
        let granted = status.granted;
        if (!granted) {
          const req = await AudioModule.requestRecordingPermissionsAsync();
          granted = req.granted;
        }
        if (!granted) return;

        // Audio mode is pre-set on mount, but check allowances
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      } catch (err) {
        console.log("Could not start recording", err);
      }
    }
  }, [isTyping, isRecording, recorder, languageCode, navigation, scamId, processUserMessage]);

  const forceReveal = useCallback(async () => {
    if (isTyping && messages.length <= 1) return; // Wait for initial message
    setIsTyping(true);
    cleanupAudioAndRecording(); // Stop playback/recording if revealing
    try {
      await performEvaluation(messages);
    } catch (error) {
      console.log('[ROLEPLAY] Error evaluating:', error);
      if (isMounted.current) {
        setEvaluation({ verdict: 'NEEDS_PRACTICE', feedback: 'Network error during evaluation. Always be cautious with unknown callers.' });
        setIsTyping(false);
      }
    }
  }, [isTyping, messages, performEvaluation]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{scamInfo?.title || 'Roleplay'}</Text>
            <Text style={styles.headerSub}>Live Roleplay {mode === 'voice' ? '(Voice)' : ''}</Text>
          </View>
        </View>

        {!evaluation && (
          <TouchableOpacity style={styles.revealBtn} onPress={forceReveal} disabled={isTyping}>
            <MaterialIcons name="security" size={18} color={colors.warning} />
            <Text style={styles.revealBtnText}>{t('i_think_this_is_scam', 'I think this is a scam')}</Text>
          </TouchableOpacity>
        )}

        <ScrollView 
          ref={scrollViewRef} 
          contentContainerStyle={[styles.chatScroll, evaluation && { paddingBottom: 80 + insets.bottom }]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            if (msg.role === 'system') return null;
            if (msg.role === 'system_context') {
              return (
                <View key={msg.id} style={styles.contextBubble}>
                  <Text style={styles.contextText}>{msg.content}</Text>
                </View>
              );
            }
            return (
              <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleScammer]}>
                {msg.role === 'assistant' && (
                  <Text style={styles.scammerLabel}>{scamInfo?.sender || t('unknown_number', 'Unknown Number')}</Text>
                )}
                <Text style={[styles.bubbleText, msg.role === 'user' && { color: colors.onPrimary }]}>
                  {msg.content}
                </Text>
              </View>
            );
          })}
          {isTyping && (
            <View style={[styles.bubble, styles.bubbleScammer]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {evaluation && (
            <View style={[styles.evalCard, evaluation.verdict === 'PASS' ? styles.evalPass : styles.evalFail]}>
              <MaterialIcons name={evaluation.verdict === 'PASS' ? 'verified' : 'warning'} size={32} color={evaluation.verdict === 'PASS' ? colors.success : colors.error} />
              <Text style={[styles.evalVerdict, { color: evaluation.verdict === 'PASS' ? colors.success : colors.error }]}>
                {evaluation.verdict === 'PASS' ? t('eval_pass', 'PASS') : t('eval_needs_practice', 'NEEDS PRACTICE')}
              </Text>
              <Text style={styles.evalFeedback}>{evaluation.feedback}</Text>
              
              <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.continueBtnText}>{t('complete_scenario', 'Complete Scenario')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {!evaluation && (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {mode === 'text' ? (
              <ChatInput
                onSubmit={handleSendText}
                disabled={isTyping}
                placeholder={t('type_response', 'Type a response...')}
                styleType="roleplay"
              />
            ) : (
              <View style={styles.micWrapper}>
                {isRecording && (
                  <Animated.View style={[
                    styles.micPulse,
                    { transform: [{ scale: pulseScale }], opacity: pulseOpacity }
                  ]} />
                )}
                <TouchableOpacity style={[styles.micBtn, isRecording && styles.micBtnActive, isTyping && { opacity: 0.5 }]} 
                  onPress={toggleRecord} 
                  disabled={isTyping}
                >
                  <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={32} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.surfaceBorder },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  headerSub: { fontSize: 12, fontFamily: 'PublicSans_400Regular', color: colors.primary },
  
  revealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningDim, padding: 12, gap: 8 },
  revealBtnText: { color: colors.warning, fontFamily: 'Manrope_700Bold', fontSize: 14 },

  chatScroll: { padding: 16, gap: 16, paddingBottom: 32 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 16 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleScammer: { alignSelf: 'flex-start', backgroundColor: colors.surfaceHigh, borderWidth: 1, borderColor: colors.surfaceBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'PublicSans_400Regular', color: colors.onSurface, lineHeight: 22 },
  scammerLabel: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: colors.error, marginBottom: 4 },
  
  contextBubble: { alignSelf: 'center', backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginVertical: 8, borderWidth: 1, borderColor: colors.surfaceBorder },
  contextText: { fontSize: 13, fontFamily: 'PublicSans_400Regular', color: colors.onSurfaceVariant, textAlign: 'center' },

  evalCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12, marginTop: 16 },
  evalPass: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  evalFail: { backgroundColor: colors.errorDim, borderColor: colors.error + '40' },
  evalVerdict: { fontSize: 20, fontFamily: 'Manrope_700Bold' },
  evalFeedback: { fontSize: 15, fontFamily: 'PublicSans_400Regular', color: colors.onSurface, textAlign: 'center', lineHeight: 22 },
  continueBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 12 },
  continueBtnText: { color: colors.onPrimary, fontFamily: 'Manrope_700Bold', fontSize: 15 },

  inputArea: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.surfaceBorder, minHeight: 80 },
  input: { flex: 1, height: 48, backgroundColor: colors.surfaceHigh, borderRadius: 24, paddingHorizontal: 16, color: colors.onSurface, fontFamily: 'PublicSans_400Regular' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  
  micWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  micBtnActive: { backgroundColor: colors.error },
  micPulse: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error, zIndex: 1 }
});
