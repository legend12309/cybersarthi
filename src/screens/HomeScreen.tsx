import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Modal, TextInput, ActivityIndicator,
  Linking, KeyboardAvoidingView, Platform, Dimensions, Alert, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { submitScamReport, saveLinkScan } from '../lib/api';
import { chatWithSarvam, classifyContent } from '../lib/sarvam';
import dailyAlerts from '../data/dailyAlerts.json';

const { width } = Dimensions.get('window');

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
  const { t, deviceId, languageCode } = useLanguage();
  const scaleValue   = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.6)).current;
  const pulse2Scale  = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.35)).current;
  const insets = useSafeAreaInsets();

  const [scanModalVisible,   setScanModalVisible]   = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
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

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const isSafe = scanResult === 'safe';

  // Memoized dynamic styles to prevent GC stutters on low-end devices
  const sheetStyle = React.useMemo(() => [styles.sheet, { maxHeight: '92%' as any, paddingBottom: Math.max(48, insets.bottom + 24) }], [insets.bottom]);
  const reportSheetStyle = React.useMemo(() => [styles.sheet, { maxHeight: '92%' as any, paddingBottom: Math.max(48, insets.bottom + 24) }], [insets.bottom]);
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
    const url = linkInput.trim().toLowerCase();
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
      
      // Save to Supabase
      if (deviceId) {
        await saveLinkScan(deviceId, url, verdict, explanation);
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
  }, [linkInput, languageCode, t, deviceId]);

  const resetScanner = useCallback(() => { setLinkInput(''); setScanState('idle'); setScanResult(null); setScanSource(''); }, []);
  const resetReporter = useCallback(() => { setFraudType('other'); setScammerDetails(''); setAmountLost(''); setDescription(''); setIsSubmitted(false); setReportError(''); }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!scammerDetails.trim() && !description.trim()) {
      setReportError('Please provide either phone number/link/UPI or a description.');
      return;
    }
    setReportError('');
    setIsSubmitting(true);
    try {
      if (deviceId) {
        await submitScamReport(
          deviceId,
          scammerDetails,
          parseFloat(amountLost) || 0,
          description,
          fraudType, // Keep this as scamType for backwards compat
          fraudType, // Also pass it as the new fraud_type column
          'user_report' // source column
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
  }, [scammerDetails, description, amountLost, fraudType, deviceId, resetReporter, t]);

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
      // console.error('Image picker error:', err);
      Alert.alert('Error', 'Could not select image.');
    }
  }, [navigation]);


  // Pick one alert based on day-of-month modulo 10
  const alertIndex = new Date().getDate() % 10;
  const currentAlert = dailyAlerts[alertIndex] || dailyAlerts[0];
  const activeAlertData = (currentAlert as any)[languageCode] || (currentAlert as any)['en-IN'];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <MaterialIcons name="security" size={24} color={colors.primary} />
            <Text style={styles.brandText}>CyberSaathi</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Language')}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Scam Alert Banner ──────────────────────────────── */}
        <TouchableOpacity 
          style={styles.alertBanner} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ScamDetail', { scamId: currentAlert.scamId })}
        >
          <View style={styles.alertIconWrap}>
            <MaterialIcons name="warning-amber" size={20} color={colors.warning} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.alertTitle}>{activeAlertData.title}</Text>
            <Text style={styles.alertBody} numberOfLines={2}>
              <Text style={styles.alertHighlight}>{activeAlertData.highlight}</Text>
              {activeAlertData.text}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ── Mic Hero ───────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <TouchableOpacity style={styles.micOuter}
            onPress={() => navigation.navigate('Chat')}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: scaleValue }], opacity: opacityValue }]} />
            <Animated.View style={[styles.pulseRing2, { transform: [{ scale: pulse2Scale }], opacity: pulse2Opacity }]} />
            <View style={styles.micCircle}>
              <MaterialIcons name="mic" size={52} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>{t('home_mic_title')}</Text>
          <Text style={styles.heroSub}>{t('home_mic_subtitle')}</Text>
        </View>

        {/* ── Quick Actions ──────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => { resetScanner(); setScanModalVisible(true); }} activeOpacity={0.8}>
            <View style={styles.actionIconBg}>
              <MaterialIcons name="qr-code-scanner" size={26} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{t('home_scan_link')}</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} style={styles.actionChevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => { resetReporter(); setReportModalVisible(true); }} activeOpacity={0.8}>
            <View style={[styles.actionIconBg, styles.bgErrorDim]}>
              <MaterialIcons name="report" size={26} color={colors.error} />
            </View>
            <Text style={styles.actionLabel}>{t('home_report_fraud')}</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} style={styles.actionChevron} />
          </TouchableOpacity>
        </View>

        <View style={[styles.actionsRow, styles.mt12]}>
          <TouchableOpacity style={styles.actionCard} onPress={handlePickScreenshot} activeOpacity={0.8}>
            <View style={[styles.actionIconBg, styles.bgWarningDim]}>
              <MaterialIcons name="image-search" size={26} color={colors.warning} />
            </View>
            <Text style={styles.actionLabel}>{t('home_scan_screenshot')}</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} style={styles.actionChevron} />
          </TouchableOpacity>
        </View>

        {/* ── Quick tip card ─────────────────────────────────── */}
        <View style={styles.tipCard}>
          <MaterialIcons name="lightbulb" size={18} color={colors.warning} />
          <Text style={styles.tipText}>🇮🇳  National Cyber Helpline: <Text style={styles.primaryBold}>1930</Text></Text>
        </View>
      </ScrollView>

      {/* ══ LINK SCANNER MODAL ══════════════════════════════════════════ */}
      <Modal animationType="slide" transparent visible={scanModalVisible} onRequestClose={() => setScanModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
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
        <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
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
                    autoCorrect={false}
                  />

                  <Text style={styles.inputLabel}>{t('report_amount_label')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="₹5,000 (optional)"
                    placeholderTextColor={colors.onSurfaceVariant + '70'}
                    value={amountLost}
                    onChangeText={setAmountLost}
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>{t('report_desc_label')}</Text>
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder={t('report_desc_placeholder')}
                    placeholderTextColor={colors.onSurfaceVariant + '70'}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                  />

                  {submitError && (
                    <View style={[styles.alertBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40', marginBottom: 8 }]}>
                      <View style={[styles.alertIconWrap, { backgroundColor: colors.error + '30' }]}>
                        <MaterialIcons name="error-outline" size={20} color={colors.error} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.alertTitle, { color: colors.error }]}>{t('error', 'Error')}</Text>
                        <Text style={[styles.alertBody, { color: colors.onSurface }]}>{t('report_submit_error', 'Could not submit report. Please try again.')}</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.error, shadowColor: colors.error }]}
                    disabled={isSubmitting}
                    onPress={handleSubmitReport}
                  >
                    {isSubmitting
                      ? <ActivityIndicator size="small" color={colors.onPrimary} />
                      : <Text style={[styles.sheetBtnText, { color: colors.onPrimary }]}>
                          {submitError ? t('report_submit_retry', 'Retry') : t('report_submit_btn')}
                        </Text>
                    }
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
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100, gap: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: colors.onSurface, letterSpacing: -0.3 },
  profileBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: colors.primary + '30',
    justifyContent: 'center', alignItems: 'center',
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.warningDim, borderWidth: 1, borderColor: colors.warning + '35',
    borderRadius: theme.cardRadius, padding: 14,
  },
  alertIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.warning + '20', justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  alertTitle: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.warning, marginBottom: 3 },
  alertBody: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },

  // Hero mic
  heroWrap: { alignItems: 'center', paddingVertical: 28 },
  micOuter: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pulseRing: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.primaryGlow,
  },
  pulseRing2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.primaryGlow,
  },
  micCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24,
    elevation: 12,
  },
  heroTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface, textAlign: 'center', marginBottom: 6 },
  heroSub: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 250 },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: theme.cardRadius,
    padding: 16, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  actionIconBg: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  actionLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: colors.onSurface },
  actionChevron: { position: 'absolute', top: 16, right: 12 },

  // Tip
  tipCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: theme.badgeRadius,
    padding: 14, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  tipText: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, flex: 1 },

  // Modal sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingTop: 12,
    shadowColor: colors.onSurface, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -10, // To align nicely while keeping the large touch target
  },
  sheetBody: { gap: 14 },
  sheetBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  sheetBtnDisabled: { backgroundColor: colors.surfaceBorder, shadowOpacity: 0 },
  sheetBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary },

  // Inputs
  inputLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: colors.onSurface },
  input: {
    height: 50, borderRadius: 12, backgroundColor: colors.surfaceHigh,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingHorizontal: 16, fontSize: 14,
    fontFamily: 'PublicSans_400Regular', color: colors.onSurface,
  },

  // Scanner result
  centerBlock: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  analyzeText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant },
  resultCard: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, gap: 10 },
  resultSafe: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  resultDanger: { backgroundColor: colors.errorDim, borderColor: colors.error + '40' },
  resultVerdict: { fontFamily: 'Manrope_700Bold', fontSize: 18 },
  resultReason: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
  safeBrowsingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: colors.surfaceBorder },
  safeBrowsingText: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, color: colors.onSurface },
  adviceHead: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  adviceBody: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 20 },

  // Report form
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surfaceHigh,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  typeChipText: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant },
  typeChipTextActive: { color: colors.primary, fontFamily: 'Manrope_600SemiBold' },

  // Success
  successBlock: { alignItems: 'center', gap: 14, paddingVertical: 8 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.successDim, justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: colors.onSurface, textAlign: 'center' },
  successDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  helplineBox: {
    width: '100%', backgroundColor: colors.surfaceHigh, borderRadius: 16,
    padding: 18, alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  helplineHead: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 24, backgroundColor: colors.error,
    paddingHorizontal: 24, gap: 8,
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  callBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onPrimary },
  helplineSub: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center' },
  flex1: { flex: 1 },
  alertHighlight: { fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  bgErrorDim: { backgroundColor: colors.errorDim },
  bgWarningDim: { backgroundColor: colors.warningDim },
  mt12: { marginTop: 12 },
  primaryBold: { color: colors.primary, fontFamily: 'Manrope_700Bold' },
  reportScroll: { gap: 16, paddingBottom: 32 },
  sheetBtnPrimary: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  callBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: 24, backgroundColor: colors.primary,
    paddingHorizontal: 24, gap: 8,
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  }
});