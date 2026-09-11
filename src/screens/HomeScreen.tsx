import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Modal, TextInput, ActivityIndicator,
  Linking, KeyboardAvoidingView, Platform, Dimensions, Alert, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { submitScamReport, saveLinkScan } from '../lib/api';
import { chatWithSarvam, classifyContent } from '../lib/sarvam';
import dailyAlerts from '../data/dailyAlerts.json';

const { width } = Dimensions.get('window');
const CARD_W = Math.floor((width - 40 - 12) / 2);

const SCAM_TYPES = [
  { id: 'otp_scam', label: 'OTP / Bank' },
  { id: 'kyc_scam', label: 'KYC Update' },
  { id: 'job_scam', label: 'Fake Job' },
  { id: 'lottery_scam', label: 'Lottery / Prize' },
  { id: 'upi_scam', label: 'UPI Fraud' },
  { id: 'electricity_scam', label: 'Electricity Bill' },
  { id: 'love_scam', label: 'Romance / Love' },
  { id: 'parcel_scam', label: 'Customs / Parcel' },
  { id: 'screen_share_scam', label: 'Screen Share' },
  { id: 'police_scam', label: 'Fake Police/CBI' },
  { id: 'other', label: 'Other' }
] as const;

const TypeChip = React.memo(({ type, isSelected, onPress, localizedLabel }: any) => (
  <TouchableOpacity style={[styles.typeChip, isSelected && styles.typeChipActive]}
    onPress={() => onPress(type.id)}
  >
    <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
      {localizedLabel}
    </Text>
  </TouchableOpacity>
));

TypeChip.displayName = 'TypeChip';

export default function HomeScreen({ navigation }: any) {
  const { t, deviceId, userId, languageCode, participantId, setParticipantId, logout } = useLanguage();
  const scaleValue   = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.6)).current;
  const pulse2Scale  = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.35)).current;
  const insets = useSafeAreaInsets();

  const [scanModalVisible,        setScanModalVisible]        = useState(false);
  const [reportModalVisible,      setReportModalVisible]      = useState(false);
  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [tempParticipantId,       setTempParticipantId]       = useState(participantId || '');
  const [searchQuery,             setSearchQuery]             = useState('');

  const [reportError, setReportError] = useState('');
  const [linkInput,    setLinkInput]    = useState('');
  const [scanState,    setScanState]    = useState<'idle'|'scanning'|'result'>('idle');
  const [scanResult,   setScanResult]   = useState<'safe'|'suspicious'|null>(null);
  const [scanReason,   setScanReason]   = useState('');
  const [scanAdvice,   setScanAdvice]   = useState('');
  const [scanSource,   setScanSource]   = useState('');
  const [fraudType,    setFraudType]    = useState<'otp_scam'|'kyc_scam'|'job_scam'|'lottery_scam'|'upi_scam'|'electricity_scam'|'love_scam'|'parcel_scam'|'screen_share_scam'|'police_scam'|'other'>('other');
  const [scammerDetails, setScammerDetails] = useState('');
  const [amountLost,   setAmountLost]   = useState('');
  const [description,  setDescription]  = useState('');
  const [isSubmitted,  setIsSubmitted]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState(false);
  const [roleplayProgress, setRoleplayProgress] = useState<Record<string, number>>({});
  const isFocused = useIsFocused();

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const activeUser = userId || deviceId;
    if (activeUser) {
      AsyncStorage.getItem(`@cybersaathi_roleplay_sessions_${activeUser}`).then(raw => {
        if (!active) return;
        if (raw) {
          try {
            const list = JSON.parse(raw);
            const progressMap: Record<string, number> = {};
            if (Array.isArray(list)) {
              for (const session of list) {
                if (session.scamId && !progressMap[session.scamId]) {
                  // If user passed or has a completed session, 100%, else step-based
                  progressMap[session.scamId] = session.verdict === 'PASS' ? 100 : Math.min(100, Math.max(20, (session.exchanges || 1) * 20));
                }
              }
            }
            setRoleplayProgress(progressMap);
          } catch (e) {
            setRoleplayProgress({});
          }
        } else {
          setRoleplayProgress({});
        }
      });
    } else {
      setRoleplayProgress({});
    }
    return () => { active = false; };
  }, [isFocused, userId, deviceId]);

  useEffect(() => {
    if (participantId) setTempParticipantId(participantId);
  }, [participantId]);

  const isSafe = scanResult === 'safe';

  // Memoized dynamic styles
  const sheetBtnTextStyle = React.useMemo(() => [
    styles.sheetBtnText,
    { 
      color: linkInput.trim() ? colors.onPrimary : colors.onSurfaceVariant, 
      opacity: linkInput.trim() ? 1 : 0.6 
    }
  ], [linkInput]);
  const resultVerdictStyle = React.useMemo(() => [styles.resultVerdict, { color: isSafe ? colors.success : colors.error }], [isSafe]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.timing(scaleValue, { toValue: 1.7, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacityValue, { toValue: 0, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );
    const pulse2 = Animated.loop(
      Animated.parallel([
        Animated.timing(pulse2Scale, { toValue: 1.35, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: 700 }),
        Animated.timing(pulse2Opacity, { toValue: 0, duration: 2200, easing: Easing.out(Easing.ease), useNativeDriver: true, delay: 700 }),
      ])
    );
    pulse.start(); pulse2.start();
    return () => { pulse.stop(); pulse2.stop(); };
  }, []);

  const handleScanLink = useCallback(async () => {
    const url = linkInput.trim();
    Keyboard.dismiss();
    if (!url) return;
    setScanState('scanning');
    
    try {
      const { verdict, explanation, source } = await classifyContent(url, languageCode, 'url');
      
      if (!isMounted.current) return;
      setScanResult(verdict);
      setScanReason(explanation);
      setScanAdvice(verdict === 'suspicious' ? t('scanner_suspicious_advice') : t('scanner_safe_advice'));
      setScanSource(source || 'sarvam');
      
      if (userId) {
        await saveLinkScan(userId, url, verdict, explanation);
      }
    } catch (e) {
      if (!isMounted.current) return;
      setScanResult('suspicious');
      setScanReason(t('scanner_error_reason', 'Could not analyze the link right now. Please be cautious.'));
      setScanAdvice(t('scanner_unknown_advice'));
    } finally {
      if (isMounted.current) {
        setScanState('result');
      }
    }
  }, [linkInput, languageCode, t, userId]);

  const resetScanner = useCallback(() => { setLinkInput(''); setScanState('idle'); setScanResult(null); setScanSource(''); }, []);
  const resetReporter = useCallback(() => { setFraudType('other'); setScammerDetails(''); setAmountLost(''); setDescription(''); setIsSubmitted(false); setReportError(''); setSubmitError(false); }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!scammerDetails.trim() && !description.trim()) {
      setReportError('Please provide either phone number/link/UPI or a description.');
      return;
    }
    setReportError('');
    setSubmitError(false);
    setIsSubmitting(true);
    try {
      if (userId) {
        await submitScamReport(
          userId,
          scammerDetails,
          parseFloat(amountLost) || 0,
          description,
          fraudType,
          fraudType,
          'user_report'
        );
      }
      if (!isMounted.current) return;
      setReportModalVisible(false);
      Alert.alert(
        t('report_saved', 'Report Saved'),
        t('report_saved_desc', 'Your report has been saved. For urgent action, also call National Cyber Helpline 1930.'),
        [
          { text: t('common_cancel', 'Cancel'), style: 'cancel' },
          { text: t('call_1930', 'Call 1930'), onPress: () => Linking.openURL('tel:1930') }
        ]
      );
      resetReporter();
    } catch (error) { 
      if (isMounted.current) setSubmitError(true);
    } finally { 
      if (isMounted.current) setIsSubmitting(false); 
    }
  }, [scammerDetails, description, amountLost, fraudType, userId, resetReporter, t]);

  const handleSelectFraudType = useCallback((id: any) => setFraudType(id), []);

  const handlePickScreenshot = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permission to scan screenshots.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      
      if (!result.canceled && result.assets?.[0]?.uri) {
        navigation.navigate('ScreenshotScanner', { imageUri: result.assets[0].uri });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select image.');
    }
  }, [navigation]);

  const handleSaveParticipantId = async () => {
    if (!tempParticipantId.trim()) return;
    await setParticipantId(tempParticipantId.trim());
    setParticipantModalVisible(false);
  };

  const handleQuickSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    setLinkInput(searchQuery.trim());
    setSearchQuery('');
    setScanState('idle');
    setScanResult(null);
    setScanModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* ── Top Header (Insightlancer: App / Greeting / Participant ID / Language / Bell) ── */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.appIconPill}>
              <MaterialIcons name="grid-view" size={20} color={colors.primary} />
            </View>
            <TouchableOpacity 
              style={styles.headerIconBtn} 
              onPress={() => navigation.navigate('Language')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="translate" size={17} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenterWrap} pointerEvents="none">
            <Text style={styles.headerCenterTitle}>Home</Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* Participant ID Pill for Research Tracking */}
            <TouchableOpacity 
              style={styles.participantPill}
              onPress={() => setParticipantModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="fingerprint" size={14} color={colors.primary} />
              <Text style={styles.participantText}>{participantId || 'ID'}</Text>
            </TouchableOpacity>

            {/* Helpline notification bell */}
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => Linking.openURL('tel:1930')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="notifications-none" size={20} color={colors.onSurface} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── User Greeting (Reference Style) ─────────────────── */}
        <View style={styles.greetingWrap}>
          <Text style={styles.userGreeting}>
            Hi <Text style={styles.userGreetingBold}>{participantId ? participantId : 'Defender'}!</Text>
          </Text>
          <Text style={styles.userSubGreeting}>
            {new Date().getHours() < 12 ? 'Good Morning' : (new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening')}
          </Text>
        </View>

        {/* ── Search / Verification Bar (Insightlancer Style) ─── */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('home_link_scan_input', 'Search or verify URL, phone, or UPI...')}
            placeholderTextColor={colors.onSurfaceVariant + '90'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleQuickSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleQuickSearchSubmit} style={styles.searchActionBtn}>
              <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Welcome Illustration Card (Reference Style) ─────── */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeDesc}>Let's safeguard your digital presence</Text>
            <TouchableOpacity 
              style={styles.welcomeBtn}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.85}
            >
              <Text style={styles.welcomeBtnText}>Ask CyberSaathi</Text>
              <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.welcomeIllustration}>
            <View style={styles.illustCircleBg}>
              <MaterialIcons name="security" size={42} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* ── Ongoing Projects / Threat Scenarios (Reference 2x2 Grid) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ongoing Scenarios</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sim')}>
            <Text style={styles.sectionLink}>view all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.threatGrid}>
          {/* Card 1: Deep Navy Hero Card (Matches Reference Left Top Card) */}
          <TouchableOpacity 
            style={[styles.threatCard, styles.threatCardNavy]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScamDetail', { scamId: 'electricity_bill' })}
          >
            <View style={styles.threatCardTop}>
              <Text style={styles.threatDateNavy}>{roleplayProgress['electricity_bill'] ? 'Completed' : 'New Scenario'}</Text>
              <MaterialIcons name="more-vert" size={16} color={colors.navyCardSub} />
            </View>
            <View style={styles.threatHeaderRow}>
              <View style={styles.threatIconNavyBg}>
                <MaterialIcons name="bolt" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.threatHeaderTexts}>
                <Text style={styles.threatTitleNavy} numberOfLines={1} ellipsizeMode="tail">Electricity Bill</Text>
                <Text style={styles.threatSubNavy} numberOfLines={1} ellipsizeMode="tail">Voice Roleplay</Text>
              </View>
            </View>
            <View style={styles.threatProgressWrap}>
              <View style={styles.threatProgressLabelRow}>
                <Text style={styles.threatProgressTextNavy}>Progress</Text>
                <Text style={styles.threatProgressPercentNavy}>{roleplayProgress['electricity_bill'] || 0}%</Text>
              </View>
              <View style={styles.threatProgressBarTrackNavy}>
                <View style={[styles.threatProgressBarFillNavy, { width: `${roleplayProgress['electricity_bill'] || 0}%` }]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2: Clean White Card (Matches Reference Right Top Card) */}
          <TouchableOpacity 
            style={[styles.threatCard, styles.threatCardWhite]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScamDetail', { scamId: 'fedex_parcel' })}
          >
            <View style={styles.threatCardTop}>
              <Text style={styles.threatDate}>{roleplayProgress['fedex_parcel'] ? 'Completed' : 'New Scenario'}</Text>
              <MaterialIcons name="more-vert" size={16} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.threatHeaderRow}>
              <View style={[styles.threatIconBg, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="local-shipping" size={18} color={colors.primary} />
              </View>
              <View style={styles.threatHeaderTexts}>
                <Text style={styles.threatTitle} numberOfLines={1} ellipsizeMode="tail">FedEx Hold</Text>
                <Text style={styles.threatSub} numberOfLines={1} ellipsizeMode="tail">Digital Arrest</Text>
              </View>
            </View>
            <View style={styles.threatProgressWrap}>
              <View style={styles.threatProgressLabelRow}>
                <Text style={styles.threatProgressText}>Progress</Text>
                <Text style={styles.threatProgressPercent}>{roleplayProgress['fedex_parcel'] || 0}%</Text>
              </View>
              <View style={styles.threatProgressBarTrack}>
                <View style={[styles.threatProgressBarFill, { width: `${roleplayProgress['fedex_parcel'] || 0}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 3: Clean White Card (SBI KYC) */}
          <TouchableOpacity 
            style={[styles.threatCard, styles.threatCardWhite]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScamDetail', { scamId: 'sbi_kyc' })}
          >
            <View style={styles.threatCardTop}>
              <Text style={styles.threatDate}>{roleplayProgress['sbi_kyc'] ? 'Completed' : 'New Scenario'}</Text>
              <MaterialIcons name="more-vert" size={16} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.threatHeaderRow}>
              <View style={[styles.threatIconBg, { backgroundColor: colors.warningDim }]}>
                <MaterialIcons name="account-balance" size={18} color={colors.warning} />
              </View>
              <View style={styles.threatHeaderTexts}>
                <Text style={styles.threatTitle} numberOfLines={1} ellipsizeMode="tail">SBI PAN Block</Text>
                <Text style={styles.threatSub} numberOfLines={1} ellipsizeMode="tail">Phishing SMS</Text>
              </View>
            </View>
            <View style={styles.threatProgressWrap}>
              <View style={styles.threatProgressLabelRow}>
                <Text style={styles.threatProgressText}>Progress</Text>
                <Text style={styles.threatProgressPercent}>{roleplayProgress['sbi_kyc'] || 0}%</Text>
              </View>
              <View style={styles.threatProgressBarTrack}>
                <View style={[styles.threatProgressBarFill, { width: `${roleplayProgress['sbi_kyc'] || 0}%`, backgroundColor: colors.warning }]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 4: Clean White Card (WhatsApp Emergency) */}
          <TouchableOpacity 
            style={[styles.threatCard, styles.threatCardWhite]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScamDetail', { scamId: 'whatsapp_family' })}
          >
            <View style={styles.threatCardTop}>
              <Text style={styles.threatDate}>{roleplayProgress['whatsapp_family'] ? 'Completed' : 'New Scenario'}</Text>
              <MaterialIcons name="more-vert" size={16} color={colors.onSurfaceVariant} />
            </View>
            <View style={styles.threatHeaderRow}>
              <View style={[styles.threatIconBg, { backgroundColor: colors.successDim }]}>
                <MaterialIcons name="family-restroom" size={18} color={colors.success} />
              </View>
              <View style={styles.threatHeaderTexts}>
                <Text style={styles.threatTitle} numberOfLines={1} ellipsizeMode="tail">WhatsApp Family</Text>
                <Text style={styles.threatSub} numberOfLines={1} ellipsizeMode="tail">Family Scam</Text>
              </View>
            </View>
            <View style={styles.threatProgressWrap}>
              <View style={styles.threatProgressLabelRow}>
                <Text style={styles.threatProgressText}>Progress</Text>
                <Text style={styles.threatProgressPercent}>{roleplayProgress['whatsapp_family'] || 0}%</Text>
              </View>
              <View style={styles.threatProgressBarTrack}>
                <View style={[styles.threatProgressBarFill, { width: `${roleplayProgress['whatsapp_family'] || 0}%`, backgroundColor: colors.accent }]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Quick Verification Folders (Reference Folder Rows) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Verification Tools</Text>
        </View>

        <View style={styles.toolsRow}>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => { resetScanner(); setScanModalVisible(true); }}
            activeOpacity={0.85}
          >
            <View style={styles.toolIconWrap}>
              <MaterialIcons name="qr-code-scanner" size={22} color={colors.primary} />
            </View>
            <Text style={styles.toolTitle} numberOfLines={1} adjustsFontSizeToFit>Scan Link</Text>
            <Text style={styles.toolSub} numberOfLines={1}>Verify URLs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={handlePickScreenshot}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: colors.warningDim }]}>
              <MaterialIcons name="image-search" size={22} color={colors.warning} />
            </View>
            <Text style={styles.toolTitle} numberOfLines={1} adjustsFontSizeToFit>Screenshot</Text>
            <Text style={styles.toolSub} numberOfLines={1}>OCR Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => { resetReporter(); setReportModalVisible(true); }}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconWrap, { backgroundColor: colors.errorDim }]}>
              <MaterialIcons name="report" size={22} color={colors.error} />
            </View>
            <Text style={styles.toolTitle} numberOfLines={1} adjustsFontSizeToFit>Report Scam</Text>
            <Text style={styles.toolSub} numberOfLines={1}>Log incidents</Text>
          </TouchableOpacity>
        </View>

        {/* ── Floating Voice Orb Quick Launcher ───────────────── */}
        <TouchableOpacity 
          style={styles.voiceBanner}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.9}
        >
          <View style={styles.voiceBannerLeft}>
            <View style={styles.micCircleMini}>
              <MaterialIcons name="mic" size={22} color={colors.onPrimary} />
            </View>
            <View style={styles.voiceBannerTexts}>
              <Text style={styles.voiceBannerTitle} numberOfLines={1} ellipsizeMode="tail">{t('home_mic_title')}</Text>
              <Text style={styles.voiceBannerSub} numberOfLines={1} ellipsizeMode="tail">Voice-to-voice in {languageCode.split('-')[0].toUpperCase()}</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={15} color={colors.onSurfaceVariant} style={styles.voiceBannerArrow} />
        </TouchableOpacity>

        {/* ── 1930 Helpline Banner (Clean footer style) ───────── */}
        <TouchableOpacity 
          style={styles.helplineBanner}
          onPress={() => Linking.openURL('tel:1930')}
          activeOpacity={0.85}
        >
          <View style={styles.helplineBadge}>
            <Text style={styles.helplineBadgeText}>1930</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.helplineTitle} numberOfLines={1}>National Cyber Helpline: 1930</Text>
            <Text style={styles.helplineDesc} numberOfLines={1}>Tap to report active financial cyber fraud 24/7</Text>
          </View>
          <MaterialIcons name="call" size={20} color={colors.primary} />
        </TouchableOpacity>

      </ScrollView>

      {/* ══ PARTICIPANT ID MODAL (Academic Research) ═══════════════════ */}
      <Modal animationType="fade" transparent visible={participantModalVisible} onRequestClose={() => setParticipantModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setParticipantModalVisible(false)} />
          <View style={styles.studyDialog}>
            <View style={styles.studyDialogIconWrap}>
              <MaterialIcons name="science" size={32} color={colors.primary} />
            </View>
            <Text style={styles.studyDialogTitle}>Participant Study ID</Text>
            <Text style={styles.studyDialogDesc}>
              Assign this device to a participant code (e.g. P-101 or EXP-01) to accurately partition research logs.
            </Text>
            <TextInput
              style={styles.studyInput}
              value={tempParticipantId}
              onChangeText={setTempParticipantId}
              placeholder="e.g. P-101"
              placeholderTextColor={colors.onSurfaceVariant + '70'}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.studyActions}>
              <TouchableOpacity style={styles.studyBtnCancel} onPress={() => setParticipantModalVisible(false)}>
                <Text style={styles.studyBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.studyBtnSave} onPress={handleSaveParticipantId}>
                <Text style={styles.studyBtnSaveText}>Save ID</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 }}
              onPress={async () => {
                setParticipantModalVisible(false);
                await logout();
                navigation.reset({ index: 0, routes: [{ name: 'ParticipantId' }] });
              }}
            >
              <MaterialIcons name="logout" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontFamily: 'Manrope_600SemiBold', fontSize: 13 }}>
                Log Out / Switch Participant
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ LINK SCANNER MODAL ══════════════════════════════════════════ */}
      <Modal animationType="slide" transparent visible={scanModalVisible} onRequestClose={() => setScanModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setScanModalVisible(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('home_scan_link')}</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {scanState === 'idle' && (
              <ScrollView contentContainerStyle={styles.reportScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>{t('scanner_input_label')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com"
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={linkInput}
                  onChangeText={setLinkInput}
                  autoCapitalize="none"
                  keyboardType="url"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.sheetBtnPrimary}
                  disabled={!linkInput.trim()}
                  onPress={handleScanLink}
                >
                  <Text style={sheetBtnTextStyle}>
                    {t('scanner_scan_btn')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {scanState === 'scanning' && (
              <View style={styles.centerBlock}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzeText}>{t('scanner_analyzing')}</Text>
              </View>
            )}

            {scanState === 'result' && (
              <View style={styles.sheetBody}>
                <View style={[styles.resultCard, isSafe ? styles.resultSafe : styles.resultDanger]}>
                  <MaterialIcons name={isSafe ? 'verified-user' : 'gpp-bad'} size={40} color={isSafe ? colors.success : colors.error} />
                  <Text style={resultVerdictStyle}>
                    {isSafe ? t('scanner_result_safe') : t('scanner_result_suspicious')}
                  </Text>
                  <Text style={styles.resultReason}>{scanReason}</Text>

                  {scanSource === 'google_safe_browsing' && (
                    <View style={styles.safeBrowsingBadge}>
                      <MaterialIcons name="security" size={14} color={colors.onSurface} />
                      <Text style={styles.safeBrowsingText}>Confirmed by Google Safe Browsing</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.adviceHead}>{t('scanner_advice_header')}</Text>
                <Text style={styles.adviceBody}>{scanAdvice}</Text>
                <TouchableOpacity style={styles.sheetBtn} onPress={resetScanner}>
                  <Text style={styles.sheetBtnText}>{t('scanner_scan_another')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ FRAUD REPORTER MODAL ════════════════════════════════════════ */}
      <Modal animationType="slide" transparent visible={reportModalVisible} onRequestClose={() => { if (!isSubmitting) setReportModalVisible(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => { if (!isSubmitting) setReportModalVisible(false); }} />
          <View style={[styles.sheet, { maxHeight: '92%', paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('home_report_fraud')}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {!isSubmitted ? (
                <>
                  {reportError ? <Text style={{ color: colors.error, fontFamily: 'Manrope_600SemiBold', marginBottom: -4 }}>{reportError}</Text> : null}
                  <Text style={styles.inputLabel}>{t('report_type_label')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {SCAM_TYPES.map(type => (
                      <TypeChip 
                        key={type.id} 
                        type={type} 
                        isSelected={fraudType === type.id} 
                        onPress={handleSelectFraudType} 
                        localizedLabel={t(type.id, type.label)}
                      />
                    ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>
                    {t('report_details_phone')} / Link / UPI ID
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('report_details_placeholder', '+91 98765 43210, link or UPI')}
                    placeholderTextColor={colors.onSurfaceVariant + '70'}
                    value={scammerDetails}
                    onChangeText={setScammerDetails}
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>
                    {t('report_amount_label')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('report_amount_placeholder', '0.00')}
                    placeholderTextColor={colors.onSurfaceVariant + '70'}
                    value={amountLost}
                    onChangeText={setAmountLost}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>
                    {t('report_description_label')}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={t('report_description_placeholder', 'Describe what happened...')}
                    placeholderTextColor={colors.onSurfaceVariant + '70'}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />

                  {submitError && (
                    <Text style={{ color: colors.error, fontFamily: 'PublicSans_400Regular', fontSize: 13 }}>
                      Failed to submit report. Please try again.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.sheetBtnPrimary, isSubmitting && styles.sheetBtnDisabled]}
                    onPress={handleSubmitReport}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.sheetBtnText}>{t('report_submit_btn')}</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.successBlock}>
                  <View style={styles.successIcon}>
                    <MaterialIcons name="check-circle" size={52} color={colors.success} />
                  </View>
                  <Text style={styles.successTitle}>{t('report_success_title')}</Text>
                  <Text style={styles.successDesc}>{t('report_success_desc')}</Text>
                  <View style={styles.helplineBox}>
                    <Text style={styles.helplineHead}>{t('report_helpline_header')}</Text>
                    <TouchableOpacity style={styles.callBtnPrimary} onPress={() => Linking.openURL('tel:1930')}>
                      <MaterialIcons name="call" size={20} color={colors.onPrimary} />
                      <Text style={styles.callBtnText}>{t('home_call_helpline') || '1930 Helpline'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.helplineSub}>{t('report_helpline_support')}</Text>
                  </View>
                  <TouchableOpacity style={styles.sheetBtn} onPress={() => setReportModalVisible(false)}>
                    <Text style={styles.sheetBtnText}>{t('common_ok')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110, gap: 18 },

  // Top Header (Insightlancer)
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  appIconPill: {
    width: 38,
    height: 38,
    borderRadius: 14,
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
  headerCenterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerCenterTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: colors.onSurface,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  participantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  participantText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.error,
  },

  // Greeting
  greetingWrap: {
    paddingVertical: 2,
  },
  userGreeting: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  userGreetingBold: {
    color: colors.primary,
  },
  userSubGreeting: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    height: '100%',
  },
  searchActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    borderWidth: 1.5,
    borderColor: colors.primary + '20',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  welcomeContent: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
  },
  welcomeDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 16,
  },
  welcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  welcomeBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
  welcomeIllustration: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustCircleBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
  },
  sectionLink: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },

  // 2x2 Ongoing Threats Grid
  threatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  threatCard: {
    width: CARD_W,
    height: 156,
    borderRadius: theme.cardRadius,
    padding: 12,
    justifyContent: 'space-between',
  },
  threatCardNavy: {
    backgroundColor: colors.navyCard,
    borderWidth: 1,
    borderColor: colors.navyCardBorder,
    shadowColor: colors.navyCard,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  threatCardWhite: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  threatCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threatDateNavy: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.navyCardSub,
  },
  threatDate: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  threatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  threatIconNavyBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatHeaderTexts: {
    flex: 1,
    minWidth: 0,
  },
  threatTitleNavy: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: colors.navyCardText,
  },
  threatSubNavy: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10.5,
    color: colors.navyCardSub,
    marginTop: 1,
  },
  threatTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12.5,
    color: colors.onSurface,
  },
  threatSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10.5,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  threatProgressWrap: {
    marginTop: 'auto',
  },
  threatProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  threatProgressTextNavy: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10,
    color: colors.navyCardSub,
  },
  threatProgressPercentNavy: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: colors.navyCardText,
  },
  threatProgressBarTrackNavy: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  threatProgressBarFillNavy: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  threatProgressText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  threatProgressPercent: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: colors.onSurface,
  },
  threatProgressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  threatProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Verification Tools Row
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  toolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11.5,
    color: colors.onSurface,
    textAlign: 'center',
  },
  toolSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },

  // Voice Quick Launcher Banner
  voiceBanner: {
    backgroundColor: colors.surface,
    borderRadius: theme.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  voiceBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  voiceBannerTexts: {
    flex: 1,
    minWidth: 0,
  },
  voiceBannerArrow: {
    marginLeft: 4,
  },
  micCircleMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceBannerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.onSurface,
  },
  voiceBannerSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },

  // 1930 Helpline Banner
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: theme.cardRadius,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  helplineBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  helplineBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.onPrimary,
  },
  helplineTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.primary,
  },
  helplineDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },

  // Participant Study Dialog
  studyDialog: {
    width: width - 48,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  studyDialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  studyDialogTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: 6,
  },
  studyDialogDesc: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  studyInput: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 18,
  },
  studyActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  studyBtnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyBtnCancelText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  studyBtnSave: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  studyBtnSaveText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.onPrimary,
  },

  // Modal Sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 12,
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10,
  },
  sheetBody: { gap: 14 },
  sheetBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  sheetBtnDisabled: { backgroundColor: colors.surfaceBorder, shadowOpacity: 0 },
  sheetBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary },

  // Inputs
  inputLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: colors.onSurface },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'PublicSans_400Regular',
    color: colors.onSurface,
  },
  textArea: {
    height: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  // Scanner Result
  centerBlock: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  analyzeText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant },
  resultCard: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, gap: 10 },
  resultSafe: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  resultDanger: { backgroundColor: colors.errorDim, borderColor: colors.error + '40' },
  resultVerdict: { fontFamily: 'Manrope_700Bold', fontSize: 18 },
  resultReason: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
  safeBrowsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  safeBrowsingText: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: colors.onSurface },
  adviceHead: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  adviceBody: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20 },

  // Report Form
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceHigh,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeChipText: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  typeChipTextActive: { color: colors.primary, fontFamily: 'Manrope_600SemiBold' },

  // Success Block
  successBlock: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: colors.onSurface, textAlign: 'center' },
  successDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  helplineBox: {
    width: '100%',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  helplineHead: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  flex1: { flex: 1 },
  reportScroll: { gap: 16, paddingBottom: 32 },
  sheetBtnPrimary: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  callBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  callBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onPrimary },
  helplineSub: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center' },
});
