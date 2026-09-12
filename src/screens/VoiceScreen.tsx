import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, FlatList, Animated, Easing,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
  Modal, Alert, Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { speechToText, chatWithSarvam, textToSpeech, classifyContent } from '../lib/sarvam';
import { useLanguage } from '../context/LanguageContext';
import { ChatInput } from '../components/ChatInput';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isAudioPlaying?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

type AppState = 'idle' | 'starting' | 'recording' | 'thinking' | 'playing';

const LANGUAGE_LABELS: Record<string, string> = {
  'hi-IN': 'हिन्दी',
  'en-IN': 'English',
  'mr-IN': 'मराठी',
  'ta-IN': 'தமிழ்',
  'te-IN': 'తెలుగు',
  'gu-IN': 'ગુજરાતી',
};

const QUICK_PROMPTS: Record<string, Array<{ id: string; label: string; query: string }>> = {
  'hi-IN': [
    { id: 'elec', label: '⚡ बिजली बिल धमकी', query: 'मुझे मैसेज आया कि आज रात बिजली कट जाएगी और इस नंबर पर संपर्क करें। क्या यह फ्रॉड है?' },
    { id: 'otp', label: '🔒 बैंक KYC व OTP कॉल', query: 'बैंक अधिकारी बनकर कोई मेरा OTP और आधार नंबर मांग रहा है। क्या मुझे देना चाहिए?' },
    { id: 'arrest', label: '👮 डिजिटल अरेस्ट क्या है?', query: 'पुलिस बनकर फोन आया कि मेरे आधार पर मनी लॉन्ड्रिंग केस है और मुझे डिजिटल अरेस्ट करेंगे।' },
    { id: 'lottery', label: '🎁 लॉटरी व ईनाम SMS', query: 'मुझे 25 लाख की लॉटरी का व्हाट्सएप संदेश मिला है और 5000 प्रोसेसिंग फीस मांग रहे हैं।' },
  ],
  'mr-IN': [
    { id: 'elec', label: '⚡ वीज बिल धमकी', query: 'मला मेसेज आला आहे की आज रात्री वीज कापली जाईल आणि या नंबरवर संपर्क करा. ही फसवणूक आहे का?' },
    { id: 'otp', label: '🔒 बँक KYC व OTP कॉल', query: 'बँक अधिकारी बनून कोणीतरी माझा OTP आणि आधार नंबर मागत आहे. मी द्यायला हवा का?' },
    { id: 'arrest', label: '👮 डिजिटल अरेस्ट काय आहे?', query: 'पोलीस बनून फोन आला की माझ्या नावावर मनी लाँड्रिंग केस आहे आणि डिजिटल अरेस्ट करतील.' },
    { id: 'lottery', label: '🎁 लॉटरी व बक्षीस SMS', query: 'मला २५ लाखांच्या लॉटरीचा व्हॉट्सॲप मेसेज आला आहे आणि प्रोसेसिंग फी मागत आहेत.' },
  ],
  'ta-IN': [
    { id: 'elec', label: '⚡ மின்சார பில் மோசடி', query: 'இன்று இரவு மின்சாரம் துண்டிக்கப்படும் என்று மெசேஜ் வந்துள்ளது. இது மோசடியா?' },
    { id: 'otp', label: '🔒 வங்கி KYC & OTP', query: 'வங்கி அதிகாரி என்று கூறி ஒருவர் எனது OTP மற்றும் ஆதாரை கேட்கிறார். கொடுக்கலாமா?' },
    { id: 'arrest', label: '👮 டிஜிட்டல் அரெஸ்ட்', query: 'போலீஸ் என்று கூறி என் மீது வழக்கு இருப்பதாக மிரட்டி பணம் கேட்கிறார்கள். நான் என்ன செய்ய வேண்டும்?' },
    { id: 'lottery', label: '🎁 லாட்டரி பரிசு SMS', query: '25 லட்சம் லாட்டரி பரிசு விழுந்ததாகக் கூறி முன்பணம் கேட்கிறார்கள்.' },
  ],
  'te-IN': [
    { id: 'elec', label: '⚡ కరెంట్ బిల్లు మోసం', query: 'ఈ రాత్రి కరెంట్ కట్ చేస్తామని మెసేజ్ వచ్చింది. ఇది ఫ్రాడ్ అవుతుందా?' },
    { id: 'otp', label: '🔒 బ్యాంక్ KYC & OTP', query: 'బ్యాంక్ మేనేజర్ అని చెప్పి నా OTP మరియు ఆధార్ అడుగుతున్నారు. ఇవ్వవచ్చా?' },
    { id: 'arrest', label: '👮 డిజిటల్ అరెస్ట్', query: 'పోలీస్ అని చెప్పి నాపై కేసు ఉందని బెదిరిస్తున్నారు. నేను ఏం చేయాలి?' },
    { id: 'lottery', label: '🎁 లాటరీ ప్రైజ్ మెసేజ్', query: '25 లక్షల లాటరీ వచ్చిందని ముందే ఫీజు కట్టమంటున్నారు. ఇది నిజమేనా?' },
  ],
  'gu-IN': [
    { id: 'elec', label: '⚡ લાઈટ બિલ ફ્રોડ', query: 'મને મેસેજ આવ્યો કે આજે રાત્રે વીજળી કપાઈ જશે. શું આ સ્કેમ છે?' },
    { id: 'otp', label: '🔒 બેન્ક KYC અને OTP', query: 'બેન્ક કર્મચારી બનીને કોઈ મારો OTP અને આધાર માંગી રહ્યું છે. શું આપવો જોઈએ?' },
    { id: 'arrest', label: '👮 ડિજિટલ અરેસ્ટ શું છે?', query: 'પોલીસ બનીને ફોન આવ્યો કે મારા નામે કેસ છે અને ડિજિટલ અરેસ્ટ કરશે.' },
    { id: 'lottery', label: '🎁 લોટરી અને ઇનામ SMS', query: 'મને 25 લાખની લોટરીનો મેસેજ મળ્યો છે અને પ્રોસેસિંગ ફી માંગી રહ્યા છે.' },
  ],
  'en-IN': [
    { id: 'elec', label: '⚡ Electricity Bill Scam', query: 'Someone sent an SMS saying my electricity bill is unpaid and power will be cut tonight. Is this fraud?' },
    { id: 'otp', label: '🔒 Bank KYC & OTP Call', query: 'A caller claiming to be bank staff is asking for my OTP for KYC update. Is it safe?' },
    { id: 'arrest', label: '👮 Digital Arrest Threat', query: 'A caller claiming to be CBI or Police says I am under digital arrest for money laundering. What should I do?' },
    { id: 'lottery', label: '🎁 Lottery Prize Message', query: 'I received a message saying I won a 25 Lakh prize but need to pay a small processing fee first.' },
  ],
  default: [
    { id: 'elec', label: '⚡ Electricity Bill Scam', query: 'Someone sent an SMS saying my electricity bill is unpaid and power will be cut tonight. Is this fraud?' },
    { id: 'otp', label: '🔒 Bank KYC & OTP Call', query: 'A caller claiming to be bank staff is asking for my OTP for KYC update. Is it safe?' },
    { id: 'arrest', label: '👮 Digital Arrest Threat', query: 'A caller claiming to be CBI or Police says I am under digital arrest for money laundering. What should I do?' },
    { id: 'lottery', label: '🎁 Lottery Prize Message', query: 'I received a message saying I won a 25 Lakh prize but need to pay a small processing fee first.' },
  ],
};

export default function VoiceScreen({ navigation }: any) {
  const { t, languageCode, userId } = useLanguage();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [appState, setAppState] = useState<AppState>('idle');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session_' + Date.now());
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const isMounted = useRef(true);
  const flatListRef = useRef<FlatList>(null);
  const playTokenRef = useRef(0);
  const recordingTimeoutRef = useRef<any>(null);
  const spokenLanguageRef = useRef<string | null>(null);

  // Dual ripple animations for mic orb
  const pulseScale    = useRef(new Animated.Value(1)).current;
  const pulseOpacity  = useRef(new Animated.Value(0.5)).current;
  const pulse2Scale   = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.35)).current;
  const pulseLoop     = useRef<Animated.CompositeAnimation | null>(null);

  // Helper to persist chat sessions per user
  const saveCurrentSession = useCallback(async (updatedMessages: Message[], sessionId: string) => {
    try {
      const userMessages = updatedMessages.filter(m => m.sender === 'user');
      if (userMessages.length === 0) return;

      const firstUserMsg = userMessages[0]?.text || 'Cyber Safety Query';
      const title = firstUserMsg.length > 38 ? firstUserMsg.substring(0, 35) + '...' : firstUserMsg;
      
      const storageKey = `@cybersaathi_chat_sessions_${userId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      let list: ChatSession[] = raw ? JSON.parse(raw) : [];

      const existingIndex = list.findIndex(s => s.id === sessionId);
      const sessionObj: ChatSession = {
        id: sessionId,
        title,
        timestamp: Date.now(),
        messages: updatedMessages,
      };

      if (existingIndex >= 0) {
        list[existingIndex] = sessionObj;
      } else {
        list.unshift(sessionObj);
      }

      list = list.slice(0, 30);
      await AsyncStorage.setItem(storageKey, JSON.stringify(list));
      if (isMounted.current) {
        setPastSessions(list);
      }
    } catch (e) {
      console.warn('[VOICE] Error saving chat session:', e);
    }
  }, [userId]);

  // Load chat history for the active user
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storageKey = `@cybersaathi_chat_sessions_${userId}`;
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const list: ChatSession[] = JSON.parse(raw);
          if (isMounted.current) setPastSessions(list);
          if (list.length > 0 && list[0]?.messages?.length > 0) {
            if (isMounted.current) {
              setCurrentSessionId(list[0].id);
              setMessages(list[0].messages);
            }
            return;
          }
        }
        const welcomeText = t('voice_default_instruction');
        if (isMounted.current) {
          setMessages([{ id: 'welcome', sender: 'ai', text: welcomeText }]);
          setCurrentSessionId('session_' + Date.now());
        }
      } catch (err) {
        const welcomeText = t('voice_default_instruction');
        if (isMounted.current) setMessages([{ id: 'welcome', sender: 'ai', text: welcomeText }]);
      }
    };

    loadChatHistory();
  }, [userId]);

  useEffect(() => {
    isMounted.current = true;
    
    // Pre-request permissions and pre-configure audio mode to eliminate delay on press
    const setupAudio = async () => {
      try {
        await AudioModule.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          playThroughEarpiece: false,
        } as any);
      } catch (e) {
        try {
          await AudioModule.setAudioModeAsync({
            playsInSilentMode: true,
            playThroughEarpiece: false,
          } as any);
        } catch (_) {}
      }
      try {
        await AudioModule.requestRecordingPermissionsAsync();
      } catch (e) {}
    };
    setupAudio();

    // Listen for playback finished
    const subscription = (player as any).addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish || status.error) {
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
        setAppState('idle');
      }
    });

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
    const timeoutId = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (appState === 'recording') {
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.38, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse2Scale, { toValue: 1.2, duration: 1600, delay: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse2Opacity, { toValue: 0, duration: 1600, delay: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseScale.setValue(1);
      pulseOpacity.setValue(0.5);
      pulse2Scale.setValue(1);
      pulse2Opacity.setValue(0.35);
    }
    return () => pulseLoop.current?.stop();
  }, [appState]);

  const cleanupAudioAndRecording = () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    try { recorder.stop().catch(() => {}); } catch(e) {}
    try { if (player.playing) player.pause(); } catch(e) {}
    try {
      AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, playThroughEarpiece: false } as any).catch(() => {});
    } catch(e) {}
  };

  const getOfflineAIReply = (text: string, lang: string): string => {
    const q = text.toLowerCase().trim();
    const isHi = lang === 'hi-IN', isMr = lang === 'mr-IN',
          isTa = lang === 'ta-IN', isTe = lang === 'te-IN', isGu = lang === 'gu-IN';

    // 1. Digital Arrest / Police / CBI / Court
    if (q.includes('arrest') || q.includes('cbi') || q.includes('police') || q.includes('अरेस्ट') || q.includes('पुलिस') || q.includes('कोर्ट')) {
      if (isHi) return 'सावधान! कानून में डिजिटल अरेस्ट जैसा कोई नियम नहीं होता। पुलिस या सीबीआई कभी भी वीडियो कॉल पर पूछताछ या पैसे की मांग नहीं करती। तुरंत कॉल काट दें और नंबर ब्लॉक करें।';
      if (isMr) return 'सावधान! कायद्यात डिजिटल अरेस्ट अशी कोणतीही पद्धत नाही. पोलीस किंवा सीबीआय कधीही व्हिडिओ कॉलवर चौकशी किंवा पैसे मागत नाहीत. ताबडतोब कॉल कट करा.';
      if (isGu) return 'સાવધાન! કાયદામાં ડિજિટલ અરેસ્ટ જેવું કશું હોતું નથી. પોલીસ ક્યારેય વિડિયો કૉલ પર તપાસ કે પૈસા નથી માંગતી. તરત કૉલ કાપી નાખો.';
      if (isTa) return 'எச்சரிக்கை! சட்டத்தில் டிஜிட்டல் அரெஸ்ட் என்று எதுவும் இல்லை. போலீசார் வீடியோ காலில் விசாரணையோ பணமோ கேட்க மாட்டார்கள். உடனே அழைப்பை துண்டிக்கவும்.';
      if (isTe) return 'జాగ్రత్త! చట్టంలో డిజిటల్ అరెస్ట్ లేదు. పోలీసులు వీడియో కాల్‌లో విచారణ లేదా డబ్బులు అడగరు. వెంటనే కాల్ కట్ చేయండి.';
      return 'Warning! There is no legal procedure called Digital Arrest. Police or CBI never investigate or demand money over video calls. Hang up immediately.';
    }

    // 2. Electricity / Utility bill
    if (q.includes('electricity') || q.includes('bill') || q.includes('बिजली') || q.includes('बिल') || q.includes('power')) {
      if (isHi) return 'बिजली बिल स्कैम में जालसाज आज रात बिजली काटने का झूठा डर दिखाते हैं। किसी भी अनजान नंबर या लिंक पर पैसे न भेजें। अपने बिजली विभाग के आधिकारिक ऐप पर ही बिल चेक करें।';
      if (isMr) return 'वीज बिल घोटाळ्यात फसवणूक करणारे वीज कापण्याची धमकी देतात. कोणालाही पैसे पाठवू नका. अधिकृत ॲपवरच बिल तपासा.';
      if (isGu) return 'લાઈટ બિલ ફ્રોડમાં સ્કેમર્સ ધમકી આપે છે. અજાણ્યા નંબર પર ક્યારેય ચૂકવણી ન કરો. માત્ર અધિકૃત એપ પર જ બિલ ચકાસો.';
      if (isTa) return 'மின் கட்டண மோசடியில் மின்சாரம் துண்டிக்கப்படும் என்று அச்சுறுத்துவார்கள். பணம் அனுப்ப வேண்டாம். அதிகாரப்பூர்வ செயலியில் பார்க்கவும்.';
      if (isTe) return 'కరెంట్ బిల్లు మోసాలలో కనెక్షన్ కట్ చేస్తామని బెదిరిస్తారు. డబ్బులు పంపకండి. అధికారిక యాప్‌లోనే చెక్ చేయండి.';
      return 'In electricity scams, fraudsters threaten immediate disconnection. Never pay on unknown numbers. Check only on the official electricity utility app.';
    }

    // 3. OTP / KYC / Banking / PIN
    if (q.includes('otp') || q.includes('kyc') || q.includes('pin') || q.includes('ओटीपी') || q.includes('पिन') || q.includes('केवाईसी') || q.includes('bank')) {
      if (isHi) return 'बैंक या कोई भी सरकारी अधिकारी कभी फोन पर OTP, पासवर्ड या कार्ड नंबर नहीं मांगते। किसी के भी साथ OTP साझा न करें, वरना खाता खाली हो सकता है।';
      if (isMr) return 'बँक कर्मचारी कधीही फोनवर ओटीपी किंवा पिन मागत नाहीत. कोणाशीही ओटीपी शेअर करू नका.';
      if (isGu) return 'બેન્ક ક્યારેય ફોન પર OTP કે પાસવર્ડ નથી માંગતી. કોઈની સાથે પણ OTP શેર ન કરો.';
      if (isTa) return 'வங்கிகள் ஒருபோதும் தொலைபேசியில் ஓடிபி கேட்காது. உங்கள் ஓடிபியை யாரிடமும் பகிராதீர்கள்.';
      if (isTe) return 'బ్యాంకులు ఎన్నడూ ఫోన్‌లో OTP అడగవు. ఎవరితోనూ OTP పంచుకోవద్దు.';
      return 'Bank officials never call to ask for OTPs, PINs, or passwords. Never share them with anyone.';
    }

    // 4. Lost Money / Fraud complaint / 1930
    if (q.includes('loss') || q.includes('fraud') || q.includes('1930') || q.includes('पैसा') || q.includes('कट गया') || q.includes('ठगी') || q.includes('शिकायत') || q.includes('रिपोर्ट')) {
      if (isHi) return 'घबराइए मत! तुरंत 1930 डायल करके नेशनल साइबर क्राइम पोर्टल पर शिकायत दर्ज कराएं और अपने बैंक को कॉल करके खाते को फ्रीज करवाएं।';
      if (isMr) return 'घाबरू नका! ताबडतोब 1930 वर कॉल करून सायबर पोर्टलवर तक्रार नोंदवा आणि बँक खातं तात्पुरतं ब्लॉक करा.';
      if (isGu) return 'ગભરાશો નહીં! તરત જ 1930 પર કૉલ કરીને સાયબર પોર્ટલ પર ફરિયાદ નોંધાવો અને બેન્ક ખાતું ફ્રીઝ કરાવો.';
      if (isTa) return 'பயப்பட வேண்டாம்! உடனே 1930 ஐ அழைத்து புகார் அளிக்கவும் மற்றும் வங்கியை தொடர்பு கொண்டு கணக்கை முடக்கவும்.';
      if (isTe) return 'భయపడవద్దు! వెంటనే 1930 కి కాల్ చేసి సైబర్ పోర్టల్‌లో ఫిర్యాదు చేయండి మరియు బ్యాంకు ఖాతాను బ్లాక్ చేయండి.';
      return 'Do not panic! Immediately dial 1930 to file a complaint on cybercrime.gov.in and call your bank to freeze transactions.';
    }

    // 5. Courier / FedEx / Parcel / Customs
    if (q.includes('courier') || q.includes('fedex') || q.includes('parcel') || q.includes('customs') || q.includes('पार्सल') || q.includes('कूरियर') || q.includes('कस्टम')) {
      if (isHi) return 'कूरियर या कस्टम्स के नाम पर ड्रग्स या अवैध सामान मिलने का डर दिखाकर पैसे ऐंठना आम फ्रॉड है। असली कस्टम्स कभी फोन पर पैसे नहीं मांगते। तुरंत नंबर ब्लॉक करें।';
      if (isMr) return 'कुरिअर किंवा कस्टम्सच्या नावाने भीती दाखवून पैसे उकळणे हा मोठा घोटाळा आहे. घाबरू नका, नंबर ब्लॉक करा.';
      if (isGu) return 'કુરિયર કે કસ્ટમ્સના નામે ડરાવીને પૈસા પડાવવાનો આ ફ્રોડ છે. સાવધાન રહો અને નંબર બ્લોક કરો.';
      if (isTa) return 'கொரியர் அல்லது சுங்கத்துறை பெயரில் மிரட்டி பணம் பறிப்பது மோசடி. உடனடியாக எண்ணை பிளாக் செய்யவும்.';
      if (isTe) return 'కొరియర్ లేదా కస్టమ్స్ పేరుతో బెదిరించి డబ్బులు వసూలు చేయడం మోసం. వెంటనే నంబర్‌ను బ్లాక్ చేయండి.';
      return 'Scammers claim illegal items were found in your parcel to extort money. Real customs never call to demand money. Block the number.';
    }

    // 6. Lottery / Prize / Reward points / KBC
    if (q.includes('lottery') || q.includes('winner') || q.includes('win') || q.includes('लॉटरी') || q.includes('इनाम') || q.includes('रिवॉर्ड') || q.includes('kbc')) {
      if (isHi) return 'लॉटरी स्कैम में इनाम देने के लिए पहले प्रोसेसिंग फीस या टैक्स मांगा जाता है। असली लॉटरी कभी पैसे नहीं मांगती, यह पूरी तरह फर्जी है।';
      if (isMr) return 'लॉटरी घोटाळ्यात बक्षीस देण्यासाठी आधी शुल्क मागतात. खरी लॉटरी कधीही पैसे मागत नाही, हे पूर्णपणे बनावट आहे.';
      if (isGu) return 'લોટરી ફ્રોડમાં ઈનામ આપવા પ્રોસેસિંગ ફી માંગવામાં આવે છે. આ સંપૂર્ણપણે નકલી છે.';
      if (isTa) return 'லாட்டரி மோசடியில் பரிசு பெற முன்கூட்டிய பணம் கேட்பர். இது போலியானது, பணம் செலுத்த வேண்டாம்.';
      if (isTe) return 'లాటరీ మోసాలలో బహుమతికి ముందే రుసుము అడుగుతారు. ఇది పూర్తిగా మోసం, డబ్బులు కట్టవద్దు.';
      return 'In lottery scams, they demand upfront fees or taxes to release winnings. Real lotteries never ask for money.';
    }

    // 7. Work from home / Job / Telegram task / Investment
    if (q.includes('job') || q.includes('task') || q.includes('telegram') || q.includes('investment') || q.includes('जॉब') || q.includes('नौकरी') || q.includes('इन्वेस्ट')) {
      if (isHi) return 'यूट्यूब वीडियो लाइक करने या घर बैठे कमाई के नाम पर टेलीग्राम टास्क फ्रॉड बहुत बढ़ गए हैं। शुरुआत में थोड़े पैसे देकर बाद में लाखों ठग लिए जाते हैं। तुरंत बाहर निकलें।';
      if (isMr) return 'टेलिग्राम टास्क किंवा घरातून काम करून कमाईच्या नावाखाली मोठा घोटाळा चालतो. अशा ग्रुप्समधून ताबडतोब बाहेर पडा.';
      if (isGu) return 'ટેલિગ્રામ ટાસ્ક અથવા ઘરે બેઠા કમાણીના નામે મોટો ફ્રોડ થાય છે. ક્યારેય કોઈ અજાણ્યા સ્કીમમાં પૈસા ન લગાવો.';
      if (isTa) return 'டெலிகிராம் டாஸ்க் அல்லது வேலை வாய்ப்பு என்ற பெயரில் பணம் பறிப்பார்கள். எச்சரிக்கையாக இருங்கள்.';
      if (isTe) return 'టెలిగ్రామ్ టాస్క్ లేదా వర్క్ ఫ్రమ్ హోమ్ పేరుతో మోసం చేస్తారు. ఎలాంటి పెట్టుబడి పెట్టవద్దు.';
      return 'Work-from-home video rating and Telegram task jobs are predatory scams designed to steal your savings. Never invest or send money.';
    }

    // 8. General Cyber Safety / Greeting
    if (isHi) return 'नमस्ते! मैं साइबरसाथी हूँ। किसी भी संदिग्ध कॉल, मैसेज, लॉटरी या ऑनलाइन फ्रॉड के बारे में बेझिझक पूछें। मैं आपकी सुरक्षा के लिए हमेशा तैयार हूँ।';
    if (isMr) return 'नमस्कार! मी सायबरसाथी आहे. कोणत्याही संशयास्पद कॉल, मेसेज किंवा ऑनलाइन फसवणुकीबद्दल विचारा. मी तुमच्या मदतीसाठी सदैव तयार आहे.';
    if (isGu) return 'નમસ્તે! હું સાયબરસાથી છું. કોઈપણ શંકાસ્પદ કૉલ, મેસેજ કે ઓનલાઇન ફ્રોડ વિશે પૂછો. હું તમારી સુરક્ષા માટે હંમેશા હાજર છું.';
    if (isTa) return 'வணக்கம்! நான் சைபர்சாதி. எந்தவொரு சந்தேகத்திற்கிடமான அழைப்பு அல்லது மோசடி பற்றியும் கேளுங்கள்.';
    if (isTe) return 'నమస్తే! నేను సైబర్‌సాథి. ఏదైనా అనుమానాస్పద కాల్, మెసేజ్ లేదా మోసం గురించి అడగండి.';
    return 'Hello! I am CyberSaathi, your digital safety assistant. Feel free to ask about any suspicious call, message, payment link, or cyber threat.';
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
      const aiMsg: Message = { id: aiMsgId, sender: 'ai', text: aiText };
      setMessages(prev => {
        const next = [...prev, aiMsg];
        saveCurrentSession(next, currentSessionId);
        return next;
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Start TTS and playback with safe fallback
      setAppState('playing');
      setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: m.id === aiMsgId })));

      try {
        const audio = await textToSpeech(aiText, languageCode);
        if (isMounted.current && audio) {
          player.replace({ uri: audio });
          player.play();
        } else if (isMounted.current) {
          setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
          setAppState('idle');
        }
      } catch (ttsOrPlaybackError) {
        console.warn('[VOICE] TTS or playback non-fatal error in handleSendMessage:', ttsOrPlaybackError);
        if (isMounted.current) {
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
    const trimmed = text?.trim();
    if (!trimmed || appState !== 'idle') return;

    // Check if input is explicitly a URL / Web link
    const isUrl = /^(https?:\/\/|[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$)/i.test(trimmed) || 
                  (/^https?:\/\//i.test(trimmed)) || 
                  (((trimmed.includes('.com') || trimmed.includes('.in') || trimmed.includes('.org') || trimmed.includes('.net') || trimmed.includes('.xyz')) && !trimmed.includes(' ')));

    if (!isUrl) {
      // Natural conversational question or report -> send to chat assistant
      await handleSendMessage(trimmed);
      return;
    }

    try {
      const userMsgId = 'u_' + Date.now();
      setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: `🔗 Checking: ${trimmed}` }]);
      setAppState('thinking');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      let aiText = '';
      let audioText = '';
      try {
        const { verdict, explanation } = await classifyContent(trimmed, languageCode, 'url');
        
        const verdictLabel = verdict === 'suspicious' 
          ? (languageCode === 'hi-IN' ? 'ख़तरा (SUSPICIOUS)' : 'SUSPICIOUS')
          : (languageCode === 'hi-IN' ? 'सुरक्षित (SAFE)' : 'SAFE');

        aiText = `[${verdictLabel}]\n${explanation}`;
        audioText = explanation;
      } catch (chatError) { 
        const fallbackLabel = languageCode === 'hi-IN' ? 'ख़तरा (SUSPICIOUS)' : 'SUSPICIOUS';
        const fallbackExp = languageCode === 'hi-IN' 
          ? 'नेटवर्क समस्या के कारण लिंक की जाँच नहीं हो सकी। कृपया सावधान रहें।' 
          : 'Could not analyze the link due to a network issue. Please be cautious.';
        aiText = `[${fallbackLabel}]\n${fallbackExp}`; 
        audioText = fallbackExp;
      }
      
      if (!isMounted.current) return;
      
      const aiMsgId = 'a_' + Date.now();
      const aiMsg: Message = { id: aiMsgId, sender: 'ai', text: aiText };
      setMessages(prev => {
        const next = [...prev, aiMsg];
        saveCurrentSession(next, currentSessionId);
        return next;
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      setAppState('playing');
      setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: m.id === aiMsgId })));

      try {
        const audio = await textToSpeech(audioText, languageCode);
        if (isMounted.current && audio) {
          player.replace({ uri: audio });
          player.play();
        } else if (isMounted.current) {
          setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
          setAppState('idle');
        }
      } catch (ttsOrPlaybackError) {
        console.warn('[VOICE] TTS or playback non-fatal error in handleTextSubmit:', ttsOrPlaybackError);
        if (isMounted.current) {
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
          const isNetworkErr = sttError?.message?.includes('Unable to resolve host') || 
                               sttError?.message?.includes('Network Error') ||
                               sttError?.message?.includes('ENOTFOUND') ||
                               sttError?.message?.includes('network');
          const isDurationError = sttError.message?.toLowerCase().includes('duration') || 
                                  sttError.message?.toLowerCase().includes('30 second') ||
                                  sttError.message?.toLowerCase().includes('400');
          let errorMsg = t('err_stt_failed') || 'Could not recognize speech.';
          if (isNetworkErr) {
            if (languageCode === 'hi-IN') errorMsg = 'इंटरनेट कनेक्शन नहीं है। कृपया नेटवर्क जांचें और पुनः प्रयास करें।';
            else if (languageCode === 'mr-IN') errorMsg = 'इंटरनेट कनेक्शन नाही. कृपया नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.';
            else if (languageCode === 'ta-IN') errorMsg = 'இணைய இணைப்பு இல்லை. தயவுசெய்து நெட்வொர்க்கை சரிபார்க்கவும்.';
            else if (languageCode === 'te-IN') errorMsg = 'ఇంటర్నెట్ కనెక్షన్ లేదు. దయచేసి నెట్‌వర్క్‌ను తనిఖీ చేయండి.';
            else if (languageCode === 'gu-IN') errorMsg = 'ઇન્ટરનેટ કનેક્શન નથી. કૃપા કરીને નેટવર્ક તપાસો.';
            else errorMsg = 'No internet connection. Please check your network and try again.';
          } else if (isDurationError) {
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

  const handleNewChat = useCallback(() => {
    if (player.playing) player.pause();
    const newSessionId = 'session_' + Date.now();
    const welcomeText = t('voice_default_instruction');
    setCurrentSessionId(newSessionId);
    setMessages([{ id: 'welcome_' + Date.now(), sender: 'ai', text: welcomeText }]);
    setAppState('idle');
  }, [t, player]);

  const handleClearChat = handleNewChat;

  const handleSelectSession = useCallback((session: ChatSession) => {
    if (player.playing) player.pause();
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setAppState('idle');
    setHistoryModalVisible(false);
  }, [player]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      const storageKey = `@cybersaathi_chat_sessions_${userId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      let list: ChatSession[] = raw ? JSON.parse(raw) : [];
      list = list.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(list));
      setPastSessions(list);
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (e) {
      console.warn('[VOICE] Error deleting session:', e);
    }
  }, [userId, currentSessionId, handleNewChat]);

  const handleReplaySpeech = useCallback(async (textToPlay: string, msgId: string) => {
    if (appState !== 'idle') return;
    try {
      setAppState('playing');
      setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: m.id === msgId })));
      const audioUri = await textToSpeech(textToPlay, languageCode);
      if (isMounted.current && audioUri) {
        player.replace({ uri: audioUri });
        player.play();
      } else if (isMounted.current) {
        setAppState('idle');
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
      }
    } catch (err) {
      if (isMounted.current) {
        setAppState('idle');
        setMessages(prev => prev.map(m => ({ ...m, isAudioPlaying: false })));
      }
    }
  }, [appState, languageCode, player]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return (
      <MessageItem 
        item={item} 
        onStopSpeech={handleStopSpeech} 
        onReplaySpeech={handleReplaySpeech}
        t={t} 
      />
    );
  }, [handleStopSpeech, handleReplaySpeech, t]);

  const getStatusLabel = (state: AppState, lang: string): string => {
    const isHi = lang === 'hi-IN';
    const isMr = lang === 'mr-IN';
    const isTa = lang === 'ta-IN';
    const isTe = lang === 'te-IN';
    const isGu = lang === 'gu-IN';

    switch (state) {
      case 'idle':
        if (isHi) return 'तैयार';
        if (isMr) return 'तयार';
        if (isTa) return 'தயார்';
        if (isTe) return 'సిద్ధం';
        if (isGu) return 'તૈયાર';
        return 'Ready';
      case 'starting':
        if (isHi) return 'शुरू...';
        if (isMr) return 'सुरू...';
        if (isTa) return 'தொடங்குகிறது...';
        if (isTe) return 'ప్రారంభం...';
        if (isGu) return 'શરૂ...';
        return 'Starting...';
      case 'recording':
        if (isHi) return 'सुन रहा है...';
        if (isMr) return 'ऐकत आहे...';
        if (isTa) return 'கேட்கிறது...';
        if (isTe) return 'వింటోంది...';
        if (isGu) return 'સાંભળે છે...';
        return 'Listening...';
      case 'thinking':
        if (isHi) return 'सोच रहा है...';
        if (isMr) return 'विचार...';
        if (isTa) return 'யோசிக்கிறது...';
        if (isTe) return 'ఆలోచన...';
        if (isGu) return 'વિચારે છે...';
        return 'Thinking...';
      case 'playing':
        if (isHi) return 'बोल रहा है...';
        if (isMr) return 'बोलत आहे...';
        if (isTa) return 'பேசுகிறது...';
        if (isTe) return 'మాట్లాడుతోంది...';
        if (isGu) return 'બોલે છે...';
        return 'Speaking...';
    }
  };

  const statusInfo = {
    idle:      { color: colors.success,  label: getStatusLabel('idle', languageCode) },
    starting:  { color: colors.warning,  label: getStatusLabel('starting', languageCode) },
    recording: { color: colors.error,    label: getStatusLabel('recording', languageCode) },
    thinking:  { color: colors.primary,  label: getStatusLabel('thinking', languageCode) },
    playing:   { color: colors.primary,  label: getStatusLabel('playing', languageCode) },
  }[appState];

  const activePrompts = QUICK_PROMPTS[languageCode] || QUICK_PROMPTS.default;
  const langName = LANGUAGE_LABELS[languageCode] || 'Hindi';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ── Top Header (Insightlancer Style) ────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appIconPill}>
              <MaterialIcons name="record-voice-over" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerBrandTitle} numberOfLines={1}>{t('voice_assistant_title', 'Voice Assistant')}</Text>
              <View style={styles.headerSubRow}>
                <Text style={styles.headerBrandSub} numberOfLines={1}>{langName}</Text>
                <View style={styles.headerSubDot} />
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                  <Text style={[styles.statusLabel, { color: statusInfo.color }]} numberOfLines={1}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* New Chat */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={handleNewChat}
              activeOpacity={0.8}
              accessibilityLabel="New Chat"
            >
              <MaterialIcons name="add-comment" size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* Chat History */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => setHistoryModalVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="Past Conversations"
            >
              <MaterialIcons name="history" size={17} color={colors.onSurface} />
            </TouchableOpacity>

            {/* Language Switcher */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Language')}
              activeOpacity={0.8}
              accessibilityLabel="Change language"
            >
              <MaterialIcons name="translate" size={16} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Messages & Hero Banner ──────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.flex1}
          contentContainerStyle={styles.chatList}
          ListHeaderComponent={
            messages.length <= 1 ? (
              <View style={styles.heroBannerWrap}>
                <View style={styles.voiceHeroCard}>
                  <View style={styles.voiceHeroTop}>
                    <View style={styles.voiceHeroIconWrap}>
                      <MaterialIcons name="graphic-eq" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.voiceHeroBadge}>
                      <MaterialIcons name="security" size={12} color="#FFFFFF" />
                      <Text style={styles.voiceHeroBadgeText}>LIVE SHIELD</Text>
                    </View>
                  </View>
                  <Text style={styles.voiceHeroTitle}>Real-time Voice Defense</Text>
                  <Text style={styles.voiceHeroDesc}>
                    Tap the microphone below to ask about any suspicious phone call, link, SMS, or payment request in {langName}.
                  </Text>
                </View>

                {/* Quick Prompts Carousel */}
                <View style={styles.quickPromptsSection}>
                  <Text style={styles.quickPromptsHeader}>Common Scams to Check:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsRow}>
                    {activePrompts.map(p => (
                      <TouchableOpacity 
                        key={p.id}
                        style={styles.quickPromptCard}
                        onPress={() => handleSendMessage(p.query)}
                        disabled={appState !== 'idle'}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickPromptCardText}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* ── Insightlancer Bottom Voice Deck ──────────────────── */}
        <View style={[styles.voiceDeck, { paddingBottom: isKeyboardVisible ? 10 : Math.max(16, insets.bottom + 8) }]}>
          {/* Secondary text input */}
          <ChatInput
            onSubmit={handleTextSubmit}
            disabled={appState !== 'idle'}
            placeholder={t('home_link_scan_input') || 'Type message or paste link...'}
            styleType="voice"
          />

          {/* Voice Orb with Multi-ring Ripple Animation */}
          <View style={styles.orbWrap}>
            {appState === 'recording' && (
              <>
                <Animated.View style={[styles.pulseRingOuter, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                <Animated.View style={[styles.pulseRingInner, { transform: [{ scale: pulse2Scale }], opacity: pulse2Opacity }]} />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.heroMicBtn,
                appState === 'recording' && styles.heroMicBtnRec,
                appState === 'thinking' && styles.heroMicBtnThinking,
                appState === 'playing' && styles.heroMicBtnPlaying,
              ]}
              onPress={handleMicPress}
              disabled={appState === 'starting' || appState === 'thinking' || appState === 'playing'}
              activeOpacity={0.85}
            >
              {appState === 'thinking' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : appState === 'playing' ? (
                <MaterialIcons name="volume-up" size={34} color="#FFFFFF" />
              ) : appState === 'recording' ? (
                <MaterialIcons name="stop" size={34} color="#FFFFFF" />
              ) : (
                <MaterialIcons name="mic" size={34} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Dynamic Status Helper Text */}
          <Text style={styles.micHelperText}>
            {appState === 'idle' ? `Tap to speak in ${langName}`
              : appState === 'recording' ? 'Listening... Tap to send & analyze'
              : appState === 'thinking' ? 'CyberSaathi is thinking...'
              : 'Speaking response • Tap to stop'}
          </Text>
        </View>

        {/* ── Past Conversations Modal ──────────────────────── */}
        <Modal
          visible={historyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setHistoryModalVisible(false)}
        >
          <View style={styles.historyModalOverlay}>
            <View style={styles.historyModalContent}>
              <View style={styles.historyHeaderRow}>
                <View style={styles.historyHeaderLeft}>
                  <MaterialIcons name="history" size={22} color={colors.primary} />
                  <Text style={styles.historyTitle}>Past Conversations</Text>
                </View>
                <TouchableOpacity
                  style={styles.historyCloseBtn}
                  onPress={() => setHistoryModalVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={20} color={colors.onSurface} />
                </TouchableOpacity>
              </View>

              {pastSessions.length === 0 ? (
                <View style={styles.historyEmpty}>
                  <MaterialIcons name="forum" size={44} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
                  <Text style={styles.historyEmptyTitle}>No Past Conversations</Text>
                  <Text style={styles.historyEmptySub}>
                    Conversations you have with CyberSaathi will appear here for easy review.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={pastSessions}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.historyItemCard,
                        item.id === currentSessionId && styles.historyItemActive
                      ]}
                      onPress={() => handleSelectSession(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.historyItemIcon}>
                        <MaterialIcons
                          name={item.id === currentSessionId ? "chat" : "chat-bubble-outline"}
                          size={20}
                          color={item.id === currentSessionId ? colors.primary : colors.onSurfaceVariant}
                        />
                      </View>
                      <View style={styles.historyItemBody}>
                        <Text style={styles.historyItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.historyItemDate}>
                          {new Date(item.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} • {item.messages.length} messages
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.historyDeleteBtn}
                        onPress={() => handleDeleteSession(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const MessageItem = React.memo(({ 
  item, 
  onStopSpeech, 
  onReplaySpeech,
  t 
}: { 
  item: Message; 
  onStopSpeech: () => void; 
  onReplaySpeech: (text: string, id: string) => void;
  t: any;
}) => {
  const isAI = item.sender === 'ai';
  return (
    <View style={[styles.msgRow, isAI ? styles.aiRow : styles.userRow]}>
      {isAI && (
        <View style={styles.aiAvatar}>
          <MaterialIcons name="security" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[styles.bubbleWrap, isAI ? styles.aiBubbleWrap : styles.userBubbleWrap]}>
        {isAI && (
          <View style={styles.bubbleHeaderRow}>
            <Text style={styles.aiSenderText}>CyberSaathi</Text>
            <TouchableOpacity 
              style={styles.replayIconBtn}
              onPress={() => item.isAudioPlaying ? onStopSpeech() : onReplaySpeech(item.text, item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons 
                name={item.isAudioPlaying ? "volume-up" : "volume-mute"} 
                size={16} 
                color={item.isAudioPlaying ? colors.primary : colors.onSurfaceVariant} 
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.bubbleText, isAI ? styles.aiText : styles.userText]}>
            {item.text}
          </Text>
          {item.isAudioPlaying && (
            <TouchableOpacity style={styles.stopSpeech} onPress={onStopSpeech}>
              <MaterialIcons name="volume-off" size={13} color={colors.primary} />
              <Text style={styles.stopSpeechLabel}>{t('voice_status_speaking') || 'Speaking... Tap to stop'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

MessageItem.displayName = 'MessageItem';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },

  // Top Header (Insightlancer Style)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  appIconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerBrandTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: colors.onSurface,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  headerBrandSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11.5,
    color: colors.onSurfaceVariant,
  },
  headerSubDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.onSurfaceVariant,
    opacity: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  // Hero Banner for Initial Welcome State
  heroBannerWrap: {
    marginBottom: 16,
    gap: 16,
  },
  voiceHeroCard: {
    backgroundColor: colors.navyCard,
    borderRadius: 22,
    padding: 18,
    gap: 8,
    shadowColor: colors.navyCard,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.navyCardBorder,
  },
  voiceHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceHeroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  voiceHeroBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  voiceHeroTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  voiceHeroDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.navyCardSub,
    lineHeight: 18,
  },

  // Quick Prompts Section
  quickPromptsSection: {
    gap: 8,
  },
  quickPromptsHeader: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
  },
  quickPromptsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  quickPromptCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickPromptCardText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },

  // Chat messages list
  chatList: { padding: 16, gap: 14, paddingBottom: 24 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3 },
  aiRow: { justifyContent: 'flex-start', gap: 10 },
  userRow: { justifyContent: 'flex-end' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bubbleWrap: {
    maxWidth: '82%',
  },
  aiBubbleWrap: {
    alignItems: 'flex-start',
  },
  userBubbleWrap: {
    alignItems: 'flex-end',
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubbleSender: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
  },
  aiSenderText: {
    color: colors.primary,
  },
  userSenderText: {
    color: colors.onSurfaceVariant,
  },
  replayIconBtn: {
    padding: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, lineHeight: 21, flexWrap: 'wrap' },
  aiText: { color: colors.onSurface },
  userText: { color: colors.onPrimary },
  stopSpeech: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stopSpeechLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: colors.primary },

  // Insightlancer Bottom Voice Deck
  voiceDeck: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingTop: 12,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  orbWrap: {
    position: 'relative',
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRingOuter: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.error,
  },
  pulseRingInner: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error,
  },
  heroMicBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroMicBtnRec: { backgroundColor: colors.error, shadowColor: colors.error },
  heroMicBtnThinking: { backgroundColor: colors.warning, shadowColor: colors.warning },
  heroMicBtnPlaying: { backgroundColor: colors.success, shadowColor: colors.success },
  micHelperText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  flex1: { flex: 1 },

  // Past Conversations Modal Styles
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '45%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  historyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    paddingVertical: 12,
    gap: 10,
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  historyItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  historyItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyItemBody: {
    flex: 1,
    gap: 3,
  },
  historyItemTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  historyItemDate: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  historyDeleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  historyEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  historyEmptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
    marginTop: 8,
  },
  historyEmptySub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});