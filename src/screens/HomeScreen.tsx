import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Modal, TextInput, ActivityIndicator,
  Linking, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { submitScamReport } from '../lib/dbServices';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { t, deviceId } = useLanguage();
  const scaleValue   = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.6)).current;
  const pulse2Scale  = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.35)).current;
  const insets = useSafeAreaInsets();

  const [scanModalVisible,   setScanModalVisible]   = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [linkInput,    setLinkInput]    = useState('');
  const [scanState,    setScanState]    = useState<'idle'|'scanning'|'result'>('idle');
  const [scanResult,   setScanResult]   = useState<'safe'|'suspicious'|null>(null);
  const [scanReason,   setScanReason]   = useState('');
  const [scanAdvice,   setScanAdvice]   = useState('');
  const [fraudType,    setFraudType]    = useState<'call'|'link'|'upi'|'other'>('call');
  const [scammerDetails, setScammerDetails] = useState('');
  const [amountLost,   setAmountLost]   = useState('');
  const [description,  setDescription]  = useState('');
  const [isSubmitted,  setIsSubmitted]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleScanLink = () => {
    const url = linkInput.trim().toLowerCase();
    if (!url) return;
    setScanState('scanning');
    setTimeout(() => {
      const containsDot = url.includes('.');
      if (!containsDot) { setScanResult('suspicious'); setScanReason(t('scanner_err_invalid')); setScanAdvice(t('scanner_advice_invalid')); setScanState('result'); return; }
      const isKnownSafe = ['google.com','google.co.in','sbi.co.in','amazon.in','amazon.com','gov.in','hdfcbank.com','icicibank.com','paytm.com'].some(d => url.includes(d));
      const hasSuspiciousExt = ['.xyz','.top','.tk','.click','.club','.site','.info','.live'].some(e => url.endsWith(e)||url.includes(e+'/'));
      const hasPhishingKw = ['jio','gift','reward','bill','electricity','cash','win','kyc','bonus','free','airtel','lotto'].some(w => url.includes(w));
      const isUnsecure = url.startsWith('http://');
      if (isKnownSafe) { setScanResult('safe'); setScanReason(t('scanner_safe_reason')); setScanAdvice(t('scanner_safe_advice')); }
      else if (hasSuspiciousExt || hasPhishingKw || isUnsecure) {
        setScanResult('suspicious');
        let r = t('scanner_suspicious_generic');
        if (hasSuspiciousExt) r = t('scanner_suspicious_ext');
        else if (isUnsecure) r = t('scanner_suspicious_unsecure');
        else if (hasPhishingKw) r = t('scanner_suspicious_keyword');
        setScanReason(r); setScanAdvice(t('scanner_suspicious_advice'));
      } else { setScanResult('suspicious'); setScanReason(t('scanner_unknown_reason')); setScanAdvice(t('scanner_unknown_advice')); }
      setScanState('result');
    }, 1800);
  };

  const handleSubmitReport = async () => {
    if (!scammerDetails.trim()) return;
    setIsSubmitting(true);
    try {
      if (deviceId) await submitScamReport(deviceId, `report_${fraudType}_lost_${amountLost||'0'}`, true);
      setIsSubmitted(true);
    } catch { } finally { setIsSubmitting(false); }
  };

  const resetScanner = () => { setLinkInput(''); setScanState('idle'); setScanResult(null); };
  const resetReporter = () => { setFraudType('call'); setScammerDetails(''); setAmountLost(''); setDescription(''); setIsSubmitted(false); };

  const isSafe = scanResult === 'safe';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <MaterialIcons name="warning-amber" size={20} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{t('home_alert_title')}</Text>
            <Text style={styles.alertBody} numberOfLines={2}>
              <Text style={{ fontFamily: 'Manrope_700Bold', color: colors.onSurface }}>{t('home_alert_highlight')}</Text>
              {t('home_alert_text')}
            </Text>
          </View>
        </View>

        {/* ── Mic Hero ───────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <TouchableOpacity
            style={styles.micOuter}
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
            <View style={[styles.actionIconBg, { backgroundColor: colors.errorDim }]}>
              <MaterialIcons name="report" size={26} color={colors.error} />
            </View>
            <Text style={styles.actionLabel}>{t('home_report_fraud')}</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} style={styles.actionChevron} />
          </TouchableOpacity>
        </View>

        {/* ── Quick tip card ─────────────────────────────────── */}
        <View style={styles.tipCard}>
          <MaterialIcons name="lightbulb" size={18} color={colors.warning} />
          <Text style={styles.tipText}>🇮🇳  National Cyber Helpline: <Text style={{ color: colors.primary, fontFamily: 'Manrope_700Bold' }}>1930</Text></Text>
        </View>
      </ScrollView>

      {/* ══ LINK SCANNER MODAL ══════════════════════════════════════════ */}
      <Modal animationType="slide" transparent visible={scanModalVisible} onRequestClose={() => setScanModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('home_scan_link')}</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {scanState === 'idle' && (
              <View style={styles.sheetBody}>
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
                <TouchableOpacity
                  style={[styles.sheetBtn, !linkInput.trim() && styles.sheetBtnDisabled]}
                  disabled={!linkInput.trim()}
                  onPress={handleScanLink}
                >
                  <Text style={styles.sheetBtnText}>{t('scanner_scan_btn')}</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={[styles.resultVerdict, { color: isSafe ? colors.success : colors.error }]}>
                    {isSafe ? t('scanner_result_safe') : t('scanner_result_suspicious')}
                  </Text>
                  <Text style={styles.resultReason}>{scanReason}</Text>
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
      <Modal animationType="slide" transparent visible={reportModalVisible} onRequestClose={() => setReportModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '92%', paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('home_report_fraud')}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {!isSubmitted ? (
                <>
                  <Text style={styles.inputLabel}>{t('report_type_label')}</Text>
                  <View style={styles.typeRow}>
                    {(['call','link','upi','other'] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, fraudType === type && styles.typeChipActive]}
                        onPress={() => setFraudType(type)}
                      >
                        <Text style={[styles.typeChipText, fraudType === type && styles.typeChipTextActive]}>
                          {t(`report_type_${type}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>
                    {fraudType === 'call' ? t('report_details_phone') : fraudType === 'link' ? t('report_details_link') : t('report_details_upi')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={fraudType === 'call' ? '+91 98765 43210' : fraudType === 'link' ? 'http://scam.site' : 'scammer@ybl'}
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

                  <TouchableOpacity
                    style={[styles.sheetBtn, (!scammerDetails.trim() || isSubmitting) && styles.sheetBtnDisabled]}
                    disabled={!scammerDetails.trim() || isSubmitting}
                    onPress={handleSubmitReport}
                  >
                    {isSubmitting
                      ? <ActivityIndicator size="small" color={colors.onPrimary} />
                      : <Text style={styles.sheetBtnText}>{t('report_submit_btn')}</Text>
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
                    <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:1930')}>
                      <MaterialIcons name="call" size={20} color="#fff" />
                      <Text style={styles.callBtnText}>{t('report_helpline_btn')}</Text>
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
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

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
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceBorder, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface },
  sheetBody: { gap: 14 },
  sheetBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  sheetBtnDisabled: { backgroundColor: colors.surfaceHigh, shadowOpacity: 0 },
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
  callBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: '#fff' },
  helplineSub: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center' },
});