import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Easing, ToastAndroid, Alert, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAudioRecorder, useAudioPlayer, AudioModule, RecordingPresets } from 'expo-audio';
import { colors, theme } from '../lib/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import { ChatInput } from '../components/ChatInput';
import { submitScamReport } from '../lib/api';
import { roleplayWithSarvam, evaluateRoleplay, speechToText, textToSpeech } from '../lib/sarvam';
import { scammerPersonas } from '../data/scammerPersonas';
import scamsData from '../data/scams.json';

type Message = { id: string, role: 'user' | 'assistant' | 'system' | 'system_context', content: string };

export default function ScamRoleplayScreen({ route, navigation }: any) {
  const { scamId, mode } = route.params || { scamId: 'electricity_bill', mode: 'text' };
  const { t, deviceId, userId, languageCode, participantId } = useLanguage();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [exchanges, setExchanges] = useState(0);
  const [evaluation, setEvaluation] = useState<{verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string} | null>(null);

  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [expertRating, setExpertRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);

  // Audio Hooks & Animations
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer();
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const recordingTimeoutRef = useRef<any>(null);
  const startedLanguageRef = useRef<string | null>(null);
  const playTokenRef = useRef(0);
  const pendingFinalEvalRef = useRef<Message[] | null>(null);
  const finalEvalTimeoutRef = useRef<any>(null);
  const performEvaluationRef = useRef<(msgs: Message[]) => Promise<void>>(async () => {});



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
    if (mode === 'voice') {
      setupAudio();
    }
    
    const subscription = (player as any).addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish || status.error) {
        setIsTyping(false);
        setIsAudioLoading(false);
      }
    });

    startRoleplay();
    
    return () => { 
      isMounted.current = false; 
      subscription.remove();
      cleanupAudioAndRecording();
      if (finalEvalTimeoutRef.current) {
        clearTimeout(finalEvalTimeoutRef.current);
        finalEvalTimeoutRef.current = null;
      }
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

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
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

  const cleanupAudioAndRecording = () => {
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    if (finalEvalTimeoutRef.current) {
      clearTimeout(finalEvalTimeoutRef.current);
      finalEvalTimeoutRef.current = null;
    }
    try { recorder.stop().catch(() => {}); } catch(e) {}
    try { if (player.playing) player.pause(); } catch(e) {}
    try {
      AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, playThroughEarpiece: false } as any).catch(() => {});
    } catch(e) {}
  };

  const getInitialScammerMessage = (scam: string, lang: string) => {
    const openings: Record<string, Record<string, string>> = {
      electricity_bill: {
        'hi-IN': "नमस्ते, मैं राज्य बिजली बोर्ड से वरिष्ठ प्रवर्तन अधिकारी अमित शर्मा (आईडी #EZ-8821) बोल रहा हूँ। आपके कनेक्शन #4521 पर ₹3,240 का बकाया बिल है। हमारा लाइनमैन आपके ट्रांसफार्मर पर पहुँच चुका है और 10 मिनट में बिजली काटने का वर्क आर्डर जारी है।",
        'mr-IN': "नमस्कार, मी राज्य वीज मंडळातून वरिष्ठ अधिकारी अमित शर्मा (आयडी #EZ-8821) बोलत आहे. तुमच्या कनेक्शन #4521 वर ₹3,240 चे बिल प्रलंबित आहे. आमचे तंत्रज्ञ तुमच्या भागात पोहोचले असून पुढील 10 मिनिटांत वीज कापण्याचे आदेश आहेत.",
        'bn-IN': "নমস্কার, আমি রাজ্য বিদ্যুৎ পর্ষদ থেকে বরিষ্ঠ আধিকারিক অমিত শর্মা (আইডি #EZ-8821) বলছি। আপনার কানেকশন #4521-এ ₹৩,২৪০ বকেয়া আছে। আমাদের লাইনম্যান এলাকায় পৌঁছে গেছে এবং ১০ মিনিটের মধ্যে সংযোগ বিচ্ছিন্ন করার নির্দেশ রয়েছে।",
        'ta-IN': "வணக்கம், நான் மின்சார வாரியத்தின் தலைமை அதிகாரி அமித் சர்மா (ஐடி #EZ-8821) பேசுகிறேன். இணைப்பு #4521-ல் ₹3,240 கட்டணம் நிலுவையில் உள்ளது. இன்னும் 10 நிமிடங்களில் மின்சாரம் துண்டிக்கப்பட உத்தரவு பிறப்பிக்கப்பட்டுள்ளது.",
        'te-IN': "నమస్తే, నేను విద్యుత్ బోర్డు సీనియర్ అధికారి అమిత్ శర్మ (ఐడీ #EZ-8821) మాట్లాడుతున్నాను. మీ కనెక్షన్ #4521 పై ₹3,240 బకాయి ఉంది. 10 నిమిషాల్లో కనెక్షన్ కట్ చేయడానికి లైన్‌మెన్ సిద్ధంగా ఉన్నారు.",
        'gu-IN': "નમસ્તે, હું વીજળી બોર્ડના વરિષ્ઠ અધિકારી અમિત શર્મા (આઈડી #EZ-8821) બોલું છું. તમારા કનેક્શન #4521 પર ₹3,240 નું બિલ બાકી છે. 10 મિનિટમાં પાવર કટ કરવાનો વર્ક ઓર્ડર જારી થયેલ છે.",
        'en-IN': "Hello, this is Senior Enforcement Officer Amit Sharma (ID #EZ-8821) from the State Electricity Board. Disconnection Work Order #WO-9941 is active for connection #4521 with an overdue balance of ₹3,240. The field technician is at your transformer right now.",
      },
      fedex_parcel: {
        'hi-IN': "हेलो! मैं मुंबई कस्टम्स व एंटी-नारकोटिक्स विंग से इंस्पेक्टर विक्रम राठौर बोल रहा हूँ। आपके आधार से लिंक पार्सल #FDX-984399 में 150 ग्राम ड्रग्स और जाली पासपोर्ट जब्त हुए हैं। आपके खिलाफ गैर-जमानती अरेस्ट वारंट जारी हुआ है!",
        'mr-IN': "हॅलो! मी मुंबई कस्टम्स अँटी-नारकोटिक्स विंगमधून इन्स्पेक्टर विक्रम राठोड बोलतोय. तुमच्या आधारशी लिंक पार्सल #FDX-984399 मध्ये अमली पदार्थ जप्त झाले आहेत. तुमच्याविरुद्ध अरेस्ट वॉरंट निघाले आहे!",
        'en-IN': "This is Inspector Vikram Rathore from Mumbai Customs & Anti-Narcotics Wing (Badge #NCB-409). International FedEx parcel #FDX-984399 in your name has been seized with 150g MDMA narcotics. An arrest warrant is active against you!",
      },
      sbi_kyc: {
        'hi-IN': "नमस्ते, मैं भारतीय स्टेट बैंक सेंट्रल हेड ऑफिस मुंबई से मुख्य प्रबंधक राजेश मल्होत्रा बोल रहा हूँ। पैन कार्ड अपडेट न होने के कारण आपका योनो एसबीआई खाता और एटीएम कार्ड आज ब्लॉक कर दिया गया है।",
        'mr-IN': "नमस्कार, मी स्टेट बँक मुख्य कार्यालयातून मॅनेजर राजेश मल्होत्रा बोलत आहे. पॅन कार्ड लिंक नसल्याने तुमचे योनो खाते आणि एटीएम आज ब्लॉक करण्यात आले आहे.",
        'en-IN': "Hello, this is Senior Chief Manager Rajesh Malhotra from SBI Centralized Fraud & KYC Operations, Mumbai. Your SBI YONO account and ATM card have been frozen due to an expired PAN card.",
      },
      whatsapp_family: {
        'hi-IN': "(रोते हुए घबराई आवाज में) पापा/मम्मी! मेरा बहुत बुरा एक्सीडेंट हो गया है, फोन चकनाचूर हो गया। मैं अस्पताल की इमरजेंसी में हूँ, ऑपरेशन के लिए तुरंत ₹15,000 चाहिए वरना डॉक्टर इलाज शुरू नहीं करेंगे!",
        'mr-IN': "(रडत घाबरलेल्या आवाजात) बाबा/आई! माझा खूप मोठा अपघात झालाय, फोन फुटला. मी हॉस्पिटलच्या इमर्जन्सी वॉर्डमध्ये आहे, तत्काळ ₹15,000 पाठवा नाहीतर डॉक्टर उपचार करणार नाहीत!",
        'en-IN': "(crying and panicked) Hello? I had a terrible road accident and my phone got crushed! I am in the hospital emergency casualty ward right now and need ₹15,000 immediately for emergency admission!",
      },
      kbc_lottery: {
        'hi-IN': "बहुत-बहुत बधाई हो! मैं केबीसी जियो हेड ऑफिस मुंबई से राणा प्रताप सिंह बोल रहा हूँ। आपके मोबाइल नंबर ने केबीसी 2026 लकी ड्रा में 25 लाख रुपये का पहला इनाम जीता है!",
        'mr-IN': "खूप खूप अभिनंदन! मी केबीसी जिओ कार्यालयातून राणा प्रताप सिंह बोलत आहे. तुमच्या मोबाईल क्रमांकाने 25 लाखांची पहिली लॉटरी जिंकली आहे!",
        'en-IN': "Congratulations! This is Rana Pratap Singh, Operations Manager for KBC Head Office & Jio All-India Lucky Draw. Your mobile number has won the 1st Mega Prize of ₹25,00,000!",
      },
      olx_qr: {
        'hi-IN': "नमस्ते, मैं आर्मी कैंटोनमेंट से सूबेदार मेजर कुलदीप यादव बोल रहा हूँ। मुझे आपका सोफा तुरंत खरीदना है, कल सुबह मेरी पुणे पोस्टिंग है। मैं आर्मी मर्चेंट क्यूआर कोड भेज रहा हूँ, स्कैन करके अपना पेमेंट ले लीजिए।",
        'mr-IN': "नमस्कार, मी मिलिटरी कॅम्पमधून मेजर कुलदीप यादव बोलतोय. मला तुमचे फर्निचर ताबडतोब खरेदी करायचे आहे. मी आर्मी क्यूआर कोड पाठवला आहे, लगेच स्कॅन करून पैसे घ्या.",
        'en-IN': "Hello, this is Subedar Major Kuldeep Yadav from the Military Cantonment. I want to buy your listed item right away before my army transfer tomorrow. I am sending you our Army Merchant QR code to receive the payment.",
      },
      wfh_job: {
        'hi-IN': "नमस्ते! मैं स्नेहा कपूर, ग्लोबल डिजिटल मार्केटिंग से टैलेंट एक्विजिशन हेड बात कर रही हूँ। आप घर बैठे रोजाना सिर्फ यूट्यूब वीडियो लाइक करके ₹3,000 से ₹5,000 कमा सकते हैं। तुरंत ₹150 का वेलकम बोनस पाएं!",
        'mr-IN': "नमस्कार! मी स्नेहा कपूर, ग्लोबल मार्केटिंगमधून बोलतेय. तुम्ही घरबसल्या युट्यूब व्हिडिओ लाईक करून रोज ₹३,००० ते ₹५,००० कमवू शकता. लगेच ₹१५० वेलकम बोनस घ्या!",
        'en-IN': "Hello! This is Sneha Kapoor, Global Talent Acquisition Lead. You can easily earn ₹3,000 to ₹5,000 daily from home simply by liking YouTube videos. Get an instant ₹150 welcome bonus right now!",
      },
      trai_disconnect: {
        'hi-IN': "ट्राई अनुपालन नोटिस: मैं दूरसंचार विभाग (TRAI) केंद्रीय प्रवर्तन विंग से आदित्य सक्सेना बोल रहा हूँ। आपके नंबर से 17 आपराधिक शिकायतें मिली हैं। अगले 2 घंटे में आपका सिम कार्ड पूरी तरह बंद कर दिया जाएगा!",
        'mr-IN': "ट्राई नोटीस: मी दूरसंचार विभागातून (TRAI) अधिकारी आदित्य सक्सेना बोलतोय. तुमच्या नंबरवरून गैरव्यवहाराच्या तक्रारी आल्या आहेत. पुढील २ तासांत तुमचे सर्व सिम कार्ड ब्लॉक केले जातील!",
        'en-IN': "TRAI Compliance Notice: This is Aditya Saxena from the Telecom Regulatory Authority of India Enforcement Unit. 17 criminal complaints are filed against your mobile. Your SIM card will be deactivated in 2 hours!",
      },
      credit_card_points: {
        'hi-IN': "नमस्कार सर, मैं बैंक कार्ड रिवॉर्ड्स हेड ऑफिस से संजय वर्मा बोल रहा हूँ। आपके क्रेडिट कार्ड पर 18,450 रिवॉर्ड पॉइंट्स (कीमत ₹7,380) आज रात 12 बजे एक्सपायर हो रहे हैं। इन्हें तुरंत अपने बैंक खाते में नकद ट्रांसफर करवाएं।",
        'mr-IN': "नमस्कार, मी बँक कार्ड रिवॉर्ड्स विभागातून संजय वर्मा बोलतोय. तुमच्या क्रेडिट कार्डचे 18,450 रिवॉर्ड पॉईंट्स (रुपये 7,380) आज रात्री संपत आहेत. हे पैसे थेट खात्यात ट्रान्सफर करून घ्या.",
        'en-IN': "Hello, this is Sanjay Verma from Bank Card Loyalty & Rewards Division. You have 18,450 reward points worth ₹7,380 expiring at midnight. Let me help you credit this directly as cash into your bank account.",
      },
      digital_arrest: {
        'hi-IN': "सावधान! मैं सीबीआई हेडक्वार्टर नई दिल्ली से डीसीपी संदीप सिंघल बोल रहा हूँ। आप ₹3.8 करोड़ के मनी लॉन्ड्रिंग केस में मुख्य संदिग्ध हैं। आप इस वक्त 'डिजिटल अरेस्ट' में हैं! कॉल काटा तो 15 मिनट में स्वाट टीम आपके घर का दरवाजा तोड़ेगी!",
        'mr-IN': "सावधान! मी सीबीआय नवी दिल्लीतून डीसीपी संदीप सिंघल बोलतोय. तुम्ही ₹३.८ कोटी मनी लाँड्रिंग प्रकरणात संशयित आहात. तुम्ही सध्या 'डिजिटल अरेस्ट' मध्ये आहात! कॉल कट केला तर पोलीस तुमच्या घरी पोहोचेल!",
        'en-IN': "SILENCE! This is DCP Sandeep Singhal, Cyber Crime Special Task Force, CBI Headquarters, New Delhi. You are the prime suspect in a ₹3.8 Crore money laundering case. You are under immediate DIGITAL ARREST right now! Do not disconnect this call!",
      },
    };

    const scamDict = openings[scam] || openings.electricity_bill;
    return scamDict[lang] || scamDict['en-IN'] || scamDict['hi-IN'];
  };

  const getSystemContextDescription = (scam: string, title: string) => {
    switch (scam) {
      case 'fedex_parcel': return 'You received a call from an alleged Customs & Narcotics inspector claiming illegal drugs were found in a FedEx parcel in your name.';
      case 'sbi_kyc': return 'You received an urgent call from an alleged Bank Manager claiming your account is blocked due to an expired PAN card.';
      case 'whatsapp_family': return 'You received an emergency call from someone claiming to be your family member in a serious road accident needing urgent medical money.';
      case 'kbc_lottery': return 'You received an excited call claiming your mobile number won a ₹25 Lakhs KBC lottery prize.';
      case 'olx_qr': return 'You received a call from an alleged Army Officer wanting to buy your item online using a reverse QR code payment.';
      case 'wfh_job': return 'You received a call offering ₹3,000-₹5,000/day for a work-from-home YouTube video rating job.';
      case 'trai_disconnect': return 'You received a call from someone claiming to be a TRAI official warning that your SIM card will be deactivated in 2 hours.';
      case 'credit_card_points': return 'You received a call from a bank rewards specialist claiming you have ₹7,380 worth of expiring reward points.';
      case 'digital_arrest': return 'You received a threatening call from an alleged CBI Officer placing you under immediate "Digital Arrest" for money laundering.';
      default: return `You received a suspicious call regarding ${title}. The caller demands immediate action.`;
    }
  };

  const startRoleplay = async () => {
    if (startedLanguageRef.current === languageCode) return;
    startedLanguageRef.current = languageCode;
    try {
      const firstMsg = getInitialScammerMessage(scamId, languageCode);
      const contextDesc = getSystemContextDescription(scamId, scamInfo?.title || 'Unknown Scenario');
      const contextMessages: Message[] = [
        { id: 'sysctx', role: 'system_context', content: contextDesc },
        { id: 'sys', role: 'system', content: persona },
        { id: 'usr0', role: 'user', content: t('initial_user_hello', 'Hello?') },
      ];
      const assistantMsg: Message = { id: 'ast0', role: 'assistant', content: firstMsg };
      
      // Render initial message immediately with zero delay
      setMessages([...contextMessages, assistantMsg]);
      setIsTyping(false);

      if (mode === 'voice') {
        playTokenRef.current += 1;
        const currentToken = playTokenRef.current;
        try { if (player.playing) player.pause(); } catch(e) {}

        setIsAudioLoading(true);
        textToSpeech(firstMsg, languageCode)
          .then((audioUri) => {
            if (isMounted.current && currentToken === playTokenRef.current && audioUri) {
              try {
                player.replace({ uri: audioUri });
                player.play();
              } catch (playErr) {
                console.log('[ROLEPLAY] Player error on start:', playErr);
              }
            }
          })
          .catch((ttsErr) => {
            console.log('[ROLEPLAY] TTS failed on start, continuing in text mode:', ttsErr);
          })
          .finally(() => {
            if (isMounted.current) setIsAudioLoading(false);
          });
      }
    } catch (error: any) { if (error.message === 'API_LIMIT_REACHED') { Alert.alert('Research Limit Reached', 'The API token budget for this month has been reached. Please contact the study coordinator to rotate the API key.'); return; }
      console.log('[ROLEPLAY] Error starting roleplay:', error);
      if (isMounted.current) {
        // Don't crash — just show the messages without audio and let user continue
        setIsTyping(false);
      }
    }
  };

  const performEvaluation = useCallback(async (finalMessages: Message[]) => {
    pendingFinalEvalRef.current = null;
    if (finalEvalTimeoutRef.current) {
      clearTimeout(finalEvalTimeoutRef.current);
      finalEvalTimeoutRef.current = null;
    }
    setIsEvaluating(true);
    setIsTyping(true);
    try { if (player.playing) player.pause(); } catch(e) {}

    const transcript = finalMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'User' : 'Scammer'}: ${m.content}`)
      .join('\n');
      
    const result = await evaluateRoleplay(transcript, scamId, languageCode);
    if (!isMounted.current) return;
    
    setEvaluation(result);
    setIsTyping(false);
    setIsEvaluating(false);

    // Call submitScamReport silently with participant tracking
    try {
      const activeUser = userId || deviceId;
      if (activeUser) {
        const participantTag = participantId ? `[Participant: ${participantId}] ` : '';
        await submitScamReport(
          activeUser, 
          participantId || 'ANON_STUDY', 
          0, 
          `${participantTag}${result.verdict === 'PASS' ? 'PASS' : 'NEEDS_PRACTICE'}: ${result.feedback.substring(0, 100)}`, 
          scamId, 
          scamId, 
          'simulator_study', 
          result.verdict !== 'PASS'
        );

        // Save session locally for past roleplays history
        const storageKey = `@cybersaathi_roleplay_sessions_${activeUser}`;
        const raw = await AsyncStorage.getItem(storageKey);
        let list = raw ? JSON.parse(raw) : [];
        const sessionRecord = {
          id: 'roleplay_' + Date.now(),
          timestamp: Date.now(),
          scamId,
          scamTitle: scamInfo?.title || scamId,
          verdict: result.verdict,
          feedback: result.feedback,
          messages: finalMessages.filter(m => m.role !== 'system_context' && m.role !== 'system'),
          exchanges: finalMessages.filter(m => m.role === 'user').length,
        };
        list.unshift(sessionRecord);
        list = list.slice(0, 30);
        await AsyncStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch (e) {
      // Silent fail
    }
  }, [scamId, languageCode, userId, deviceId, participantId, scamInfo]);

  useEffect(() => {
    performEvaluationRef.current = performEvaluation;
  }, [performEvaluation]);

  const processUserMessage = useCallback(async (userMsg: string) => {
    const newMessages: Message[] = [...messages, { id: 'u_' + Date.now(), role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const nextExchange = exchanges + 1;
      const isFinalTurn = nextExchange >= 5;

      const apiMessages = newMessages.filter(m => m.role !== 'system_context').map(m => ({ role: m.role, content: m.content }));
      
      const langNames: Record<string, string> = {
        'en-IN': 'English', 'hi-IN': 'Hindi', 'mr-IN': 'Marathi', 
        'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'gu-IN': 'Gujarati'
      };
      const currentLangName = langNames[languageCode] || 'English';

      const turnInstruction = isFinalTurn
        ? `\n\n(Turn ${nextExchange} - FINAL ULTIMATUM: Deliver your most aggressive final threat or tell technician Ramesh to pull the fuse right now. Respond strictly and entirely in ${currentLangName}. Keep your reply strictly under 2 short punchy sentences. Do not use English.)`
        : `\n\n(Turn ${nextExchange}: Respond strictly and entirely in ${currentLangName}. Actively counter and weaponize what the user specifically argued. Keep it fast-paced, authoritative, and strictly under 2 short punchy sentences. Do not use English.)`;

      const finalMessages = apiMessages.map((m, idx) => {
        if (idx === apiMessages.length - 1 && m.role === 'user') {
          return {
            ...m,
            content: `${m.content}${turnInstruction}`
          };
        }
        return m;
      });

      const scammerResponse = await roleplayWithSarvam(finalMessages as any, languageCode, scamId, nextExchange, userMsg);
      if (!isMounted.current) return;

      const updatedMessagesWithScammer: Message[] = [
        ...newMessages, 
        { id: 'a_' + Date.now(), role: 'assistant', content: scammerResponse }
      ];

      // INSTANT UI UPDATE: Show scammer text immediately with zero delay
      setMessages(updatedMessagesWithScammer);
      setExchanges(nextExchange);
      if (isFinalTurn) {
        setIsCallEnded(true);
      }
      setIsTyping(false);

      if (mode === 'voice') {
        playTokenRef.current += 1;
        const currentToken = playTokenRef.current;
        try { if (player.playing) player.pause(); } catch(e) {}

        setIsAudioLoading(true);
        textToSpeech(scammerResponse, languageCode)
          .then((audioUri) => {
            if (isMounted.current && currentToken === playTokenRef.current && audioUri) {
              try {
                player.replace({ uri: audioUri });
                player.play();
              } catch (playErr) {
                console.log('[ROLEPLAY] Player error:', playErr);
              }
            }
          })
          .catch((ttsErr) => {
            console.log('[ROLEPLAY] TTS failed, showing text without audio:', ttsErr);
          })
          .finally(() => {
            if (isMounted.current) setIsAudioLoading(false);
          });
      }
    } catch (error: any) { if (error.message === 'API_LIMIT_REACHED') { Alert.alert('Research Limit Reached', 'The API token budget for this month has been reached. Please contact the study coordinator to rotate the API key.'); return; }
      console.log('[ROLEPLAY] Error processing message:', error);
      if (isMounted.current) {
        let fallbackMsg = "Hello? Speak clearly! My time is being wasted. Are you going to comply immediately or should we proceed with enforcement actions?";
        if (languageCode === 'hi-IN') {
          fallbackMsg = "हेलो? साफ़ बोलिए! समय बर्बाद मत कीजिए। क्या आप तुरंत समाधान करेंगे या हम सीधे कानूनी व सख्त कार्रवाई करें?";
        } else if (languageCode === 'mr-IN') {
          fallbackMsg = "हॅलो? स्पष्ट बोला! वेळ वाया घालवू नका. तुम्ही त्वरित प्रक्रिया पूर्ण करणार आहात की आम्ही कारवाई सुरू करू?";
        } else if (languageCode === 'ta-IN') {
          fallbackMsg = "ஹலோ? தெளிவாக பேசுங்கள்! நேரத்தை வீணடிக்காதீர்கள். உடனே தீர்வு காண்கிறீர்களா அல்லது கடுமையான நடவடிக்கை எடுக்கவா?";
        } else if (languageCode === 'te-IN') {
          fallbackMsg = "హలో? స్పష్టంగా మాట్లాడండి! సమయం వృధా చేయవద్దు. వెంటనే పరిష్కరిస్తారా లేక చట్టపరమైన చర్యలు తీసుకోమంటారా?";
        } else if (languageCode === 'gu-IN') {
          fallbackMsg = "હેલો? સ્પષ્ટ બોલો! સમય બગાડશો નહીં. તમે અત્યારે જ ઉકેલ લાવો છો કે અમે સીધી કાર્યવાહી શરૂ કરીએ?";
        }

        setMessages(prev => [...prev, { 
          id: 'err_' + Date.now().toString(),
          role: 'assistant', 
          content: fallbackMsg
        }]);
        setIsTyping(false);
      }
    }
  }, [messages, exchanges, scamId, languageCode, languageName, mode, player, performEvaluation]);

  const handleSendText = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    await processUserMessage(text.trim());
  }, [isTyping, processUserMessage]);

  const stopRecordingAndProcess = useCallback(async () => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    setIsRecording(false);
    setIsTranscribing(true);
    setIsTyping(true); // Lock while processing
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("No audio URI");
      
      const transcript = await speechToText(uri, languageCode);
      if (isMounted.current) setIsTranscribing(false);
      if (transcript.trim()) {
         await processUserMessage(transcript);
      } else {
         if (isMounted.current) setIsTyping(false);
      }
    } catch (err) {
      console.log('[ROLEPLAY] Voice STT error:', err);
      if (isMounted.current) {
        setIsTranscribing(false);
        ToastAndroid.show(t('err_unexpected', 'Could not process audio. Try again.'), ToastAndroid.SHORT);
        setIsTyping(false);
        setIsRecording(false);
      }
    }
  }, [recorder, languageCode, processUserMessage, t]);

  const toggleRecord = useCallback(async () => {
    if (isTyping || isTranscribing) return; // Ignore if processing

    // Allow user to interrupt scammer speech
    try { if (player.playing) player.pause(); } catch(e) {}

    if (isRecording) {
      await stopRecordingAndProcess();
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

        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
        }
        recordingTimeoutRef.current = setTimeout(() => {
          stopRecordingAndProcess();
        }, 28000);
      } catch (err) {
        console.log("Could not start recording", err);
      }
    }
  }, [isTyping, isTranscribing, isRecording, player, recorder, stopRecordingAndProcess]);

  const forceReveal = useCallback(async () => {
    if (isTyping && messages.length <= 1) return;
    pendingFinalEvalRef.current = null;
    if (finalEvalTimeoutRef.current) {
      clearTimeout(finalEvalTimeoutRef.current);
      finalEvalTimeoutRef.current = null;
    }
    try { if (player.playing) player.pause(); } catch(e) {}
    if (isRecording) {
      setIsRecording(false);
      try { await recorder.stop(); } catch(e) {}
    }
    setIsTyping(true);
    await performEvaluation(messages);
  }, [isTyping, messages, player, isRecording, recorder, performEvaluation]);

  const handleRestartRoleplay = useCallback(() => {
    startedLanguageRef.current = null;
    pendingFinalEvalRef.current = null;
    if (finalEvalTimeoutRef.current) {
      clearTimeout(finalEvalTimeoutRef.current);
      finalEvalTimeoutRef.current = null;
    }
    setEvaluation(null);
    setIsCallEnded(false);
    setIsEvaluating(false);
    setShowTranscript(false);
    setExchanges(0);
    setExpertRating(null);
    setRatingSubmitted(false);
    setIsTyping(true);
    startRoleplay();
  }, [languageCode]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('scam_title_' + scamId, scamInfo?.title)}</Text>
            <Text style={styles.headerSub} numberOfLines={1}>{t('live_roleplay_title')}{mode === 'voice' ? t('roleplay_voice_mode') : ''}</Text>
          </View>
        </View>

        {/* Live Voice Call Simulator Mode */}
        {mode === 'voice' && !evaluation ? (
          <View style={styles.liveCallContainer}>
            {/* Center Caller Hero */}
            <View style={styles.liveCallCard}>
              <View style={styles.liveCallBadge}>
                <View style={styles.liveCallDot} />
                <Text style={styles.liveCallBadgeText}>LIVE CALL SIMULATOR</Text>
              </View>

              <Text style={styles.liveCallerName} numberOfLines={1}>{scamInfo?.sender || 'Electricity Dept Official'}</Text>
              <Text style={styles.liveCallerSub}>Simulated Scammer • Indian Mobile</Text>

              {/* Centered Avatar and Concentric Pulsing Audio Rings */}
              <View style={styles.liveCallAvatarWrap}>
                <Animated.View style={[
                  styles.liveCallPulseRing,
                  { transform: [{ scale: pulseScale }], opacity: pulseOpacity }
                ]} />
                <View style={[styles.liveCallAvatar, (isRecording || isTyping || isAudioLoading) && styles.liveCallAvatarActive]}>
                  <MaterialIcons name="phone-in-talk" size={42} color="#FFFFFF" />
                </View>
              </View>

              {/* Status Indicator */}
              <Text style={styles.liveCallStatusText}>
                {isEvaluating
                  ? t('eval_calculating', 'AI Coach is calculating your safety score...')
                  : isCallEnded
                  ? t('eval_call_ended', '🔴 Call Disconnected by Scammer')
                  : isRecording 
                  ? t('call_listening', 'Listening to your voice...') 
                  : isTranscribing 
                  ? t('call_processing', 'Processing your speech...') 
                  : isTyping 
                  ? t('call_replying', 'Scammer is replying...') 
                  : isAudioLoading 
                  ? t('call_speaking', 'Scammer is speaking...') 
                  : t('call_connected_tap', 'Connected • Tap mic to speak')}
              </Text>

              {/* Latest Live Transcript Snippet */}
              <View style={styles.liveCallTranscriptBox}>
                <MaterialIcons name="graphic-eq" size={18} color={colors.primary} />
                <Text style={styles.liveCallTranscriptText} numberOfLines={3}>
                  {messages[messages.length - 1]?.content || 'Listening for connection...'}
                </Text>
              </View>
            </View>

            {/* Bottom Controls Row: When Call is Ended vs Ongoing */}
            <View style={[styles.liveCallControlsRow, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {isCallEnded ? (
                <View style={styles.callEndedVoiceWrap}>
                  <TouchableOpacity 
                    style={styles.viewScoreBtnVoice}
                    onPress={() => performEvaluation(messages)}
                    disabled={isEvaluating}
                    activeOpacity={0.85}
                  >
                    {isEvaluating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="assessment" size={22} color="#FFFFFF" />
                        <Text style={styles.viewScoreBtnVoiceText}>{t('view_safety_score', 'View Safety Score & Report')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Mic / Speak Button */}
                  <View style={styles.callActionUnit}>
                    <TouchableOpacity 
                      style={[styles.callBtnCircle, styles.callBtnMic, isRecording && styles.callBtnMicActive, (isTyping || isTranscribing || isEvaluating) && { opacity: 0.6 }]}
                      onPress={toggleRecord}
                      disabled={isTyping || isTranscribing || isEvaluating}
                      activeOpacity={0.85}
                    >
                      <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.callBtnLabel}>{isRecording ? t('btn_send', 'Send') : (isTyping || isTranscribing) ? t('btn_wait', 'Wait') : t('btn_speak', 'Speak')}</Text>
                  </View>

                  {/* Hang up / Flag as Scam Button */}
                  <View style={styles.callActionUnit}>
                    <TouchableOpacity 
                      style={[styles.callBtnCircle, styles.callBtnHangup]}
                      onPress={forceReveal}
                      disabled={(isTyping && messages.length <= 1) || isEvaluating}
                      activeOpacity={0.85}
                    >
                      <MaterialIcons name="call-end" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.callBtnLabel}>{t('btn_end_flag', 'End / Flag')}</Text>
                  </View>
                </>
              )}
            </View>

          </View>
        ) : (
          /* Text Chat Mode or Evaluation Mode */
          <>
            {!evaluation && !isCallEnded && mode === 'text' && (
              <TouchableOpacity style={styles.revealBtn} onPress={forceReveal} disabled={isTyping || isEvaluating}>
                <MaterialIcons name="security" size={18} color={colors.warning} />
                <Text style={styles.revealBtnText}>{t('i_think_this_is_scam', 'I think this is a scam')}</Text>
              </TouchableOpacity>
            )}

            <ScrollView 
              ref={scrollViewRef} 
              contentContainerStyle={[
                styles.chatScroll, 
                evaluation 
                  ? { paddingBottom: 80 + insets.bottom } 
                  : { paddingBottom: isKeyboardVisible ? 24 : 32 }
              ]}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {!evaluation && messages.map((msg) => {
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
              {!evaluation && isTyping && (
                <View style={[styles.bubble, styles.bubbleScammer]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}

              {/* Call Disconnected Banner in Text Mode */}
              {isCallEnded && !evaluation && (
                <View style={styles.callEndedCardText}>
                  <View style={styles.callEndedHeaderRow}>
                    <MaterialIcons name="call-end" size={20} color={colors.error} />
                    <Text style={styles.callEndedTitle}>{t('call_disconnected_title', 'Call Disconnected by Scammer')}</Text>
                  </View>
                  <Text style={styles.callEndedSub}>
                    {t('call_disconnected_sub', 'The scammer terminated the call. Tap below to see your safety score and AI coach evaluation!')}
                  </Text>
                  <TouchableOpacity 
                    style={styles.viewScoreBtnText}
                    onPress={() => performEvaluation(messages)}
                    disabled={isEvaluating}
                    activeOpacity={0.85}
                  >
                    {isEvaluating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="assessment" size={20} color="#FFFFFF" />
                        <Text style={styles.viewScoreBtnTextLabel}>{t('view_safety_score', 'View Safety Score & Report')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Judge Report Card */}
              {evaluation && (
                <View style={[styles.evalCard, evaluation.verdict === 'PASS' ? styles.evalPass : styles.evalFail]}>
                  {/* Centered Badge Icon exactly above verdict text */}
                  <View style={[styles.evalBadgeIconWrap, { backgroundColor: evaluation.verdict === 'PASS' ? colors.successDim : colors.errorDim }]}>
                    <MaterialIcons 
                      name={evaluation.verdict === 'PASS' ? 'verified' : 'gpp-bad'} 
                      size={40} 
                      color={evaluation.verdict === 'PASS' ? colors.success : colors.error} 
                    />
                  </View>
                  <Text style={[styles.evalVerdict, { color: evaluation.verdict === 'PASS' ? colors.success : colors.error }]}>
                    {evaluation.verdict === 'PASS' ? t('eval_pass', 'PASS: SCAM AVOIDED') : t('eval_needs_practice', 'NEEDS PRACTICE')}
                  </Text>
                  <Text style={styles.evalFeedback}>{evaluation.feedback}</Text>

                  {/* Three Stat Cards with equal width and equal gaps */}
                  <View style={styles.evalStatsRow}>
                    <View style={styles.evalStatCard}>
                      <Text style={styles.evalStatNum}>{Math.max(1, exchanges)}</Text>
                      <Text style={styles.evalStatLabel}>{t('stat_turns', 'Turns')}</Text>
                    </View>
                    <View style={styles.evalStatCard}>
                      <Text style={[styles.evalStatNum, { color: evaluation.verdict === 'PASS' ? colors.success : colors.warning }]}>
                        {evaluation.verdict === 'PASS' ? '100%' : '40%'}
                      </Text>
                      <Text style={styles.evalStatLabel}>{t('stat_safety', 'Safety')}</Text>
                    </View>
                    <View style={styles.evalStatCard}>
                      <Text style={[styles.evalStatNum, { color: evaluation.verdict === 'PASS' ? colors.success : colors.error }]}>
                        {evaluation.verdict === 'PASS' ? t('stat_secure', 'SECURE') : t('stat_caution', 'CAUTION')}
                      </Text>
                      <Text style={styles.evalStatLabel}>{t('stat_outcome', 'Outcome')}</Text>
                    </View>
                  </View>

                  {/* Toggle Conversation Transcript */}
                  <TouchableOpacity 
                    style={styles.toggleTranscriptBtn} 
                    onPress={() => setShowTranscript(prev => !prev)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name={showTranscript ? "expand-less" : "expand-more"} size={20} color={colors.primary} />
                    <Text style={styles.toggleTranscriptText}>
                      {showTranscript ? t('hide_transcript', 'Hide Conversation Log') : t('review_transcript', 'Review Conversation Transcript')}
                    </Text>
                  </TouchableOpacity>

                  {showTranscript && (
                    <View style={styles.inlineTranscriptWrap}>
                      {messages.filter(m => m.role !== 'system_context' && m.role !== 'system').map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                          <View key={idx} style={[styles.inlineTRow, isUser ? styles.inlineTRowUser : styles.inlineTRowScammer]}>
                            <Text style={[styles.inlineTSender, isUser ? styles.inlineTSenderUser : styles.inlineTSenderScammer]}>
                              {isUser ? t('sim_sender_you', 'You') : (scamInfo?.sender || t('sim_sender_scammer', 'Scammer'))}
                            </Text>
                            <View style={[styles.inlineTBubble, isUser ? styles.inlineTBubbleUser : styles.inlineTBubbleScammer]}>
                              <Text style={[styles.inlineTBubbleText, isUser && { color: colors.onPrimary }]}>
                                {msg.content}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  
                  {/* Expert Evaluation Study: Qualitative Realism Rating */}
                  <View style={styles.expertRatingBox}>
                    <Text style={styles.expertRatingTitle}>{t('expert_review_title', 'Expert Heuristic Review')}</Text>
                    <Text style={styles.expertRatingSub}>{t('expert_review_sub', 'How realistically did the AI simulate this fraud pattern?')}</Text>

                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity 
                          key={star} 
                          onPress={() => {
                            setExpertRating(star);
                            setRatingSubmitted(true);
                          }}
                          style={styles.starBtn}
                        >
                          <MaterialIcons 
                            name={(expertRating && expertRating >= star) ? 'star' : 'star-border'} 
                            size={28} 
                            color={(expertRating && expertRating >= star) ? colors.warning : colors.onSurfaceVariant} 
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    {ratingSubmitted && (
                      <Text style={styles.ratingSavedText}>✓ Rating logged for Participant {participantId || 'N/A'}</Text>
                    )}
                  </View>

                  {/* Two Bottom Buttons of equal width aligned to the exact same baseline */}
                  <View style={styles.evalBottomButtonsRow}>
                    <TouchableOpacity style={styles.evalPracticeAgainBtn} onPress={handleRestartRoleplay} activeOpacity={0.85}>
                      <Text style={styles.evalPracticeAgainBtnText}>Practice Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.evalCompleteBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                      <Text style={styles.evalCompleteBtnText}>{t('complete_scenario', 'Complete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {!evaluation && !isCallEnded && mode === 'text' && (
              <View style={[
                styles.inputArea, 
                { paddingBottom: isKeyboardVisible ? 6 : Math.max(insets.bottom, 12) + 6 }
              ]}>
                <ChatInput
                  onSubmit={handleSendText}
                  disabled={isTyping || isEvaluating}
                  placeholder={t('type_response', 'Type a response...')}
                  styleType="roleplay"
                />
              </View>
            )}
          </>
        )}

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderColor: colors.surfaceBorder 
  },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  headerSub: { fontSize: 11, fontFamily: 'PublicSans_400Regular', color: colors.primary, marginTop: 1 },
  
  revealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warningDim, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderColor: colors.warning + '30' },
  revealBtnText: { color: colors.warning, fontFamily: 'Manrope_700Bold', fontSize: 13 },

  chatScroll: { paddingHorizontal: 20, paddingTop: 14, gap: 14, paddingBottom: 32 },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: 18 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleScammer: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: 'PublicSans_400Regular', color: colors.onSurface, lineHeight: 21 },
  scammerLabel: { fontSize: 11, fontFamily: 'Manrope_700Bold', color: colors.error, marginBottom: 4 },
  
  contextBubble: { alignSelf: 'center', backgroundColor: colors.surfaceHigh, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginVertical: 6, borderWidth: 1, borderColor: colors.surfaceBorder },
  contextText: { fontSize: 12, fontFamily: 'PublicSans_400Regular', color: colors.onSurfaceVariant, textAlign: 'center' },

  // Live Voice Call Simulator Styles
  liveCallContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  liveCallCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  liveCallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  liveCallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  liveCallBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  liveCallerName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'center',
  },
  liveCallerSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 20,
  },
  liveCallAvatarWrap: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  liveCallPulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.error,
  },
  liveCallAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 2,
  },
  liveCallAvatarActive: {
    backgroundColor: colors.error,
  },
  liveCallStatusText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 10,
    textAlign: 'center',
  },
  liveCallTranscriptBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  liveCallTranscriptText: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurface,
    lineHeight: 18,
  },
  liveCallControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  callActionUnit: {
    alignItems: 'center',
    gap: 8,
  },
  callBtnCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  callBtnMic: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
  },
  callBtnMicActive: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  callBtnHangup: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  callBtnLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.onSurface,
  },

  // AI Judge Report Card Styles
  evalCard: { 
    padding: 20, 
    borderRadius: theme.cardRadius, 
    borderWidth: 1, 
    alignItems: 'center', 
    gap: 10, 
    marginTop: 10,
    backgroundColor: colors.surface,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  evalPass: { borderColor: colors.success + '40' },
  evalFail: { borderColor: colors.error + '40' },
  evalBadgeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  evalVerdict: { fontSize: 18, fontFamily: 'Manrope_700Bold', textAlign: 'center' },
  evalFeedback: { fontSize: 13.5, fontFamily: 'PublicSans_400Regular', color: colors.onSurface, textAlign: 'center', lineHeight: 20 },
  
  evalStatsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginVertical: 10,
  },
  evalStatCard: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  evalStatNum: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
  },
  evalStatLabel: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10.5,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  evalBottomButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  evalPracticeAgainBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalPracticeAgainBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  evalCompleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  evalCompleteBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.onPrimary,
  },

  // Expert Heuristic Review Box
  expertRatingBox: {
    width: '100%',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 4,
  },
  expertRatingTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: colors.onSurface,
  },
  expertRatingSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starBtn: {
    padding: 4,
  },
  ratingSavedText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: colors.success,
    marginTop: 6,
  },

  inputArea: { 
    flexDirection: 'row', 
    paddingHorizontal: 20,
    paddingVertical: 12, 
    gap: 12, 
    backgroundColor: colors.surface, 
    borderTopWidth: 1, 
    borderColor: colors.surfaceBorder 
  },

  // Call Ended Banner & Buttons (Voice & Text)
  callEndedVoiceWrap: {
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  viewScoreBtnVoice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewScoreBtnVoiceText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  callEndedCardText: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  callEndedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callEndedTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: colors.error,
  },
  callEndedSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12.5,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  viewScoreBtnText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewScoreBtnTextLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Inline Transcript Viewer on Evaluation Card
  toggleTranscriptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'center',
  },
  toggleTranscriptText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: colors.primary,
  },
  inlineTranscriptWrap: {
    width: '100%',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inlineTRow: {
    gap: 2,
  },
  inlineTRowUser: {
    alignItems: 'flex-end',
  },
  inlineTRowScammer: {
    alignItems: 'flex-start',
  },
  inlineTSender: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10.5,
    paddingHorizontal: 4,
  },
  inlineTSenderUser: {
    color: colors.primary,
  },
  inlineTSenderScammer: {
    color: colors.error,
  },
  inlineTBubble: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: '90%',
  },
  inlineTBubbleUser: {
    backgroundColor: colors.primary,
  },
  inlineTBubbleScammer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  inlineTBubbleText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurface,
    lineHeight: 16,
  },
});
