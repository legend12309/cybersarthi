import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { submitScamReport } from '../lib/dbServices';

export default function ScamDetailScreen({ route, navigation }: any) {
  const { scamId } = route.params || { scamId: 'electricity_bill' };
  const { t, deviceId } = useLanguage();
  const [userChoice,   setUserChoice]   = useState<'scam' | 'safe' | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeAnim]  = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  const getScamContent = () => {
    switch (scamId) {
      case 'electricity_bill': return {
        title: t('sim_card_electricity_title'), sender: 'AD-POWRBL',
        content: t('sim_elect_content'),
        redFlags: [t('sim_elect_flag_1'), t('sim_elect_flag_2'), t('sim_elect_flag_3')],
        advice: t('sim_elect_advice'),
      };
      case 'lucky_winner': return {
        title: t('sim_card_lucky_title'), sender: 'KBC-PRIZE',
        content: t('sim_lucky_content'),
        redFlags: [t('sim_lucky_flag_1'), t('sim_lucky_flag_2'), t('sim_lucky_flag_3')],
        advice: t('sim_lucky_advice'),
      };
      case 'upi_request': return {
        title: t('sim_card_upi_title'), sender: 'UPI-REFUND',
        content: t('sim_upi_content'),
        redFlags: [t('sim_upi_flag_1'), t('sim_upi_flag_2'), t('sim_upi_flag_3')],
        advice: t('sim_upi_advice'),
      };
      case 'kyc_call': return {
        title: t('sim_card_kyc_title'), sender: t('sim_kyc_sender'),
        content: t('sim_kyc_content'),
        redFlags: [t('sim_kyc_flag_1'), t('sim_kyc_flag_2'), t('sim_kyc_flag_3')],
        advice: t('sim_kyc_advice'),
      };
      default: return { title: 'Unknown', sender: 'UNKNOWN', content: '', redFlags: [], advice: '' };
    }
  };

  const scamInfo = getScamContent();

  const handleChoice = async (choice: 'scam' | 'safe') => {
    if (userChoice || isSubmitting) return;
    setUserChoice(choice);
    setIsSubmitting(true);
    try {
      if (deviceId) await submitScamReport(deviceId, scamId, choice === 'safe');
    } catch { }
    finally {
      setIsSubmitting(false);
      setShowAnalysis(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  };

  const isCorrect = userChoice === 'scam';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scam_detail_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── SMS Mockup Card ─────────────────────────────── */}
        <View style={styles.smsCard}>
          {/* SMS bubble header */}
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
              <TouchableOpacity
                style={[styles.choiceBtn, styles.trustBtn]}
                onPress={() => handleChoice('safe')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="check-circle-outline" size={22} color="#fff" />
                <Text style={styles.choiceBtnText}>{t('scam_detail_trust_btn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, styles.scamBtn]}
                onPress={() => handleChoice('scam')}
                activeOpacity={0.85}
              >
                <MaterialIcons name="dangerous" size={22} color="#fff" />
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
              <View style={{ flex: 1 }}>
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
              <View style={{ gap: 12 }}>
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
          </Animated.View>
        )}
      </ScrollView>
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  headerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: colors.onSurface },

  scroll: { padding: 20, paddingBottom: 40, gap: 20 },

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
  trustBtn: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  scamBtn: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  choiceBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: '#fff' },

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
});
