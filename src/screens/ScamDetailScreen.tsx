import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ToastAndroid, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { submitScamReport } from '../lib/api';
import { chatWithSarvam, classifyContent } from '../lib/sarvam';
import scamsData from '../data/scams.json';

export default function ScamDetailScreen({ route, navigation }: any) {
  const { scamId } = route.params || { scamId: 'electricity_bill' };
  const { t, deviceId, languageCode } = useLanguage();
  const insets = useSafeAreaInsets();
  const [roleplayMode, setRoleplayMode] = useState<'text' | 'voice'>('text');
  const [userChoice,   setUserChoice]   = useState<'scam' | 'safe' | null>(null);
  
  const ROLEPLAY_ENABLED_SCENARIOS = ['electricity_bill'];
  const showRoleplayOption = ROLEPLAY_ENABLED_SCENARIOS.includes(scamId);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const isMounted = useRef(true);

  const [customAnalysisModalVisible, setCustomAnalysisModalVisible] = useState(false);
  const [customMsgInput, setCustomMsgInput] = useState('');
  const [customAnalysisState, setCustomAnalysisState] = useState<'idle'|'scanning'|'result'>('idle');
  const [customAnalysisVerdict, setCustomAnalysisVerdict] = useState<'safe'|'suspicious'|null>(null);
  const [customAnalysisReason, setCustomAnalysisReason] = useState('');

  const btnTextStyle = React.useMemo(() => [styles.sheetBtnText, { color: colors.onPrimary, opacity: customMsgInput.trim() ? 1 : 0.5 }], [customMsgInput]);
  const resultVerdictStyle = React.useMemo(() => [styles.resultVerdict, { color: customAnalysisVerdict === 'safe' ? colors.success : colors.error }], [customAnalysisVerdict]);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const scamInfo = scamsData.find(s => s.id === scamId) || scamsData[0];

  const handleChoice = async (choice: 'scam' | 'safe') => {
    if (userChoice || isSubmitting) return;
    setUserChoice(choice);
    setIsSubmitting(true);
    try {
      if (deviceId) {
        // console.log('[SIM_SAVE] userId:', deviceId, 'scenarioId:', scamId);
        const { data, error } = await submitScamReport(deviceId, '', 0, choice === 'safe' ? 'safe' : 'scam', scamId, scamId, 'simulator', choice === 'safe');
        // console.log('[SIM_SAVE] Result data:', JSON.stringify(data), 'error:', JSON.stringify(error));
      }
    } catch (e) {
      // console.warn('Failed to submit simulator telemetry:', e);
    }
    finally {
      if (isMounted.current) {
        setIsSubmitting(false);
        setShowAnalysis(true);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
      }
    }
  };

  const handleRoleplayPress = () => {
    if (scamId !== 'electricity_bill') {
      const msg = t('roleplay_unavailable') || 'Coming Soon';
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(msg, ToastAndroid.LONG, ToastAndroid.CENTER);
      } else {
        Alert.alert('Coming Soon', msg);
      }
      return;
    }
    navigation.navigate('ScamRoleplay', { scamId, mode: roleplayMode });
  };

  const isCorrect = userChoice === 'scam';

  const handleAnalyzeCustomMessage = async () => {
    if (!customMsgInput.trim()) return;
    setCustomAnalysisState('scanning');
    try {
      const { verdict, explanation } = await classifyContent(customMsgInput, languageCode, 'message');
      setCustomAnalysisVerdict(verdict);
      setCustomAnalysisReason(explanation);
    } catch (e) {
      setCustomAnalysisVerdict('suspicious');
      setCustomAnalysisReason('Could not analyze the message right now. Please be cautious.');
    } finally {
      setCustomAnalysisState('result');
    }
  };

  const resetCustomAnalysis = () => {
    setCustomMsgInput('');
    setCustomAnalysisState('idle');
    setCustomAnalysisVerdict(null);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{scamInfo.title}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* ── Roleplay Start Section ─────────────────────────────── */}
        {!showAnalysis && userChoice === null && (
          <View style={styles.roleplaySection}>
            <Text style={styles.roleplayTitle}>Live Scam Simulator</Text>
            <Text style={styles.roleplaySub}>Experience this scenario in a safe environment before you decide.</Text>
            
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, roleplayMode === 'text' && styles.toggleBtnActive]} 
                onPress={() => setRoleplayMode('text')}
              >
                <MaterialIcons name="chat" size={18} color={roleplayMode === 'text' ? colors.onPrimary : colors.onSurface} />
                <Text style={[styles.toggleText, roleplayMode === 'text' && styles.toggleTextActive]}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, roleplayMode === 'voice' && styles.toggleBtnActive]} 
                onPress={() => setRoleplayMode('voice')}
              >
                <MaterialIcons name="mic" size={18} color={roleplayMode === 'voice' ? colors.onPrimary : colors.onSurface} />
                <Text style={[styles.toggleText, roleplayMode === 'voice' && styles.toggleTextActive]}>Voice</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.startRoleplayBtn, !showRoleplayOption && { backgroundColor: colors.surfaceBorder }]}
              onPress={handleRoleplayPress}
            >
              <MaterialIcons name={showRoleplayOption ? "play-arrow" : "access-time"} size={24} color={showRoleplayOption ? colors.onPrimary : colors.onSurfaceVariant} />
              <Text style={[styles.startRoleplayBtnText, !showRoleplayOption && { color: colors.onSurfaceVariant }]}>
                {showRoleplayOption ? "Start Live Roleplay" : "Coming Soon"}
              </Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR skip to static version</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        )}

        {/* ── SMS Card ─────────────────────────────── */}
        <View style={styles.smsCard}>
          <View style={styles.smsHeader}>
            <View style={styles.smsAvatar}>
              <MaterialIcons name="sms" size={18} color={colors.onSurface} />
            </View>
            <View>
              <Text style={styles.smsSender}>{scamInfo.sender}</Text>
              <Text style={styles.smsTime}>{t('scam_detail_sms_header')}</Text>
            </View>
            <View style={styles.warningBadge}>
              <MaterialIcons name="warning-amber" size={14} color={colors.warning} />
              <Text style={styles.warningBadgeText}>SMS</Text>
            </View>
          </View>

          {/* SMS body */}
          <View style={styles.smsBody}>
            <Text style={styles.smsContent}>{scamInfo.content}</Text>
          </View>
        </View>

        {/* ── Choice Buttons ──────────────────────────────── */}
        {!showAnalysis ? (
          <View style={styles.choiceSection}>
            <Text style={styles.promptText}>{t('scam_detail_prompt')}</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity style={[styles.choiceBtn, styles.safeBtn]}
                onPress={() => handleChoice('safe')}
                disabled={userChoice !== null}
              >
                <MaterialIcons name="check-circle-outline" size={22} color={colors.onPrimary} />
                <Text style={styles.choiceBtnText}>{t('scam_detail_trust_btn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.choiceBtn, styles.scamBtn]}
                onPress={() => handleChoice('scam')}
                disabled={userChoice !== null}
              >
                <MaterialIcons name="dangerous" size={22} color={colors.onPrimary} />
                <Text style={styles.choiceBtnText}>{t('scam_detail_scam_btn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── Analysis Reveal ─────────────────────────── */
          <Animated.View style={[styles.resultSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Verdict */}
            <View style={[styles.verdictCard, isCorrect ? styles.verdictCorrect : styles.verdictWrong]}>
              <MaterialIcons
                name={isCorrect ? 'verified-user' : 'gpp-bad'}
                size={38}
                color={isCorrect ? colors.success : colors.error}
              />
              <View style={styles.flex1}>
                <Text style={[styles.verdictTitle, { color: isCorrect ? colors.success : colors.error }]}>
                  {isCorrect ? t('scam_detail_verdict_correct') : t('scam_detail_verdict_incorrect')}
                </Text>
                <Text style={styles.verdictSub}>
                  {isCorrect ? t('scam_detail_verdict_correct_sub') : t('scam_detail_verdict_incorrect_sub')}
                </Text>
              </View>
            </View>

            {/* Red flags */}
            <View style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>{t('scam_detail_analysis_title')}</Text>
              <View style={styles.gap12}>
                {scamInfo.redFlags.map((flag, i) => (
                  <View key={i} style={styles.flagRow}>
                    <View style={styles.flagIconBg}>
                      <MaterialIcons name="warning" size={14} color={colors.warning} />
                    </View>
                    <Text style={styles.flagText}>{flag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.adviceHead}>{t('scam_detail_advice_title')}</Text>
              <Text style={styles.adviceBody}>{scamInfo.advice}</Text>
            </View>

            {/* Continue */}
            <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
              <Text style={styles.continueBtnText}>{t('scam_detail_continue_btn')}</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.continueBtn, styles.customMsgBtn]}
              onPress={() => setCustomAnalysisModalVisible(true)}
              activeOpacity={0.9}
            >
              <MaterialIcons name="search" size={20} color={colors.primary} />
              <Text style={[styles.continueBtnText, styles.primaryText]}>Analyze Custom Message</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* ══ CUSTOM ANALYSIS MODAL ══════════════════════════════════════════ */}
      <Modal animationType="slide" transparent visible={customAnalysisModalVisible} onRequestClose={() => setCustomAnalysisModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: 40 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Analyze Custom Message</Text>
              <TouchableOpacity onPress={() => setCustomAnalysisModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {customAnalysisState === 'idle' && (
              <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Paste a suspicious message to analyze:</Text>
                <TextInput
                  style={[styles.input, styles.multiInput]}
                  placeholder="Paste message here..."
                  placeholderTextColor={colors.onSurfaceVariant + '70'}
                  value={customMsgInput}
                  onChangeText={setCustomMsgInput}
                  autoCapitalize="none"
                  multiline
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.sheetBtnPrimary}
                  disabled={!customMsgInput.trim()}
                  onPress={handleAnalyzeCustomMessage}
                >
                  <Text style={btnTextStyle}>
                    Analyze Message
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {customAnalysisState === 'scanning' && (
              <View style={styles.centerBlock}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzeText}>Analyzing message with AI...</Text>
              </View>
            )}

            {customAnalysisState === 'result' && (
              <View style={styles.sheetBody}>
                <View style={[styles.resultCard, customAnalysisVerdict === 'safe' ? styles.resultSafe : styles.resultDanger]}>
                  <MaterialIcons name={customAnalysisVerdict === 'safe' ? 'verified-user' : 'gpp-bad'} size={40} color={customAnalysisVerdict === 'safe' ? colors.success : colors.error} />
                  <Text style={resultVerdictStyle}>
                    {customAnalysisVerdict === 'safe' ? 'Looks Safe' : 'Suspicious'}
                  </Text>
                  <Text style={styles.resultReason}>{customAnalysisReason}</Text>
                </View>
                <TouchableOpacity style={styles.sheetBtn} onPress={resetCustomAnalysis}>
                  <Text style={styles.sheetBtnText}>Analyze Another</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
    flex: 1,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 20 },

  // SMS mockup
  smsCard: {
    backgroundColor: colors.surface, borderRadius: theme.cardRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder, overflow: 'hidden',
  },
  smsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: colors.surfaceHigh,
    borderBottomWidth: 1, borderColor: colors.surfaceBorder,
  },
  smsAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  smsSender: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onSurface },
  smsTime: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  warningBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    backgroundColor: colors.warningDim, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.warning + '30',
  },
  warningBadgeText: { fontFamily: 'Manrope_600SemiBold', fontSize: 10, color: colors.warning },
  smsBody: { padding: 18 },
  smsContent: { fontFamily: 'PublicSans_400Regular', fontSize: 15, color: colors.onSurface, lineHeight: 22 },

  // Choices
  choiceSection: { alignItems: 'center', gap: 16 },
  promptText: { fontFamily: 'Manrope_700Bold', fontSize: 17, color: colors.onSurface, textAlign: 'center' },
  choiceRow: { flexDirection: 'row', gap: 12, width: '100%' },
  choiceBtn: {
    flex: 1, height: 54, borderRadius: 27,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  safeBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  scamBtn: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  choiceBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onPrimary },

  // Analysis
  resultSection: { gap: 16 },
  verdictCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: theme.cardRadius, borderWidth: 1,
  },
  verdictCorrect: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  verdictWrong:   { backgroundColor: colors.errorDim,   borderColor: colors.error + '40'   },
  verdictTitle: { fontFamily: 'Manrope_700Bold', fontSize: 17, marginBottom: 4 },
  verdictSub:   { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },

  analysisCard: {
    backgroundColor: colors.surface, borderRadius: theme.cardRadius,
    borderWidth: 1, borderColor: colors.surfaceBorder, padding: 18,
  },
  analysisTitle: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onSurface, marginBottom: 14 },
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flagIconBg: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.warningDim, justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  flagText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant, flex: 1, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.surfaceBorder, marginVertical: 16 },
  adviceHead: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface, marginBottom: 8 },
  adviceBody: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 21 },

  continueBtn: {
    height: 54, borderRadius: 27, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  continueBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary },

  // Modal sheet styles
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
    marginRight: -10,
  },
  sheetBody: { gap: 14 },
  sheetBtn: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  sheetBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary },

  inputLabel: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: colors.onSurface },
  input: {
    height: 50, borderRadius: 12, backgroundColor: colors.surfaceHigh,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingHorizontal: 16, paddingTop: 12, fontSize: 14,
    fontFamily: 'PublicSans_400Regular', color: colors.onSurface,
  },

  centerBlock: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  analyzeText: { fontFamily: 'PublicSans_400Regular', fontSize: 14, color: colors.onSurfaceVariant },
  resultCard: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, gap: 10 },
  resultSafe: { backgroundColor: colors.successDim, borderColor: colors.success + '40' },
  resultDanger: { backgroundColor: colors.errorDim, borderColor: colors.error + '40' },
  resultVerdict: { fontFamily: 'Manrope_700Bold', fontSize: 18 },
  resultReason: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
  flex1: { flex: 1 },
  gap12: { gap: 12 },
  customMsgBtn: { backgroundColor: colors.surfaceHigh, marginTop: 12, borderWidth: 1, borderColor: colors.primary },
  primaryText: { color: colors.primary },
  multiInput: { height: 100, textAlignVertical: 'top' },
  sheetBtnPrimary: {
    height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  
  // Roleplay section
  roleplaySection: { backgroundColor: colors.surfaceHigh, padding: 20, borderRadius: theme.cardRadius, borderWidth: 1, borderColor: colors.primary + '40', alignItems: 'center', gap: 12 },
  roleplayTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface },
  roleplaySub: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 4 },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 20, padding: 4, borderWidth: 1, borderColor: colors.surfaceBorder },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontFamily: 'Manrope_600SemiBold', fontSize: 14, color: colors.onSurface },
  toggleTextActive: { color: colors.onPrimary },
  startRoleplayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 24, width: '100%', justifyContent: 'center', marginTop: 8 },
  startRoleplayBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onPrimary },
  orDivider: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12, marginTop: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
  orText: { fontFamily: 'PublicSans_400Regular', fontSize: 12, color: colors.onSurfaceVariant }
});
