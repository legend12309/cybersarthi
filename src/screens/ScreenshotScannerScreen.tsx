import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { analyzeScreenshot, classifyContent } from '../lib/sarvam';

const { width } = Dimensions.get('window');

export default function ScreenshotScannerScreen({ route, navigation }: any) {
  const { imageUri } = route.params || {};
  const { t, languageCode } = useLanguage();
  const insets = useSafeAreaInsets();

  const [loadingState, setLoadingState] = useState<'idle' | 'reading' | 'classifying' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [verdict, setVerdict] = useState<'safe' | 'suspicious' | null>(null);
  const [explanation, setExplanation] = useState('');
  const [advice, setAdvice] = useState('');

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const startAnalysis = useCallback(async () => {
    try {
      if (!isMounted.current) return;
      setLoadingState('reading');
      setErrorMessage('');

      // Step 1: Sarvam Vision OCR
      const extractedText = await analyzeScreenshot(imageUri, languageCode);
      
      if (!isMounted.current) return;
      if (!extractedText || extractedText.trim().length === 0) {
        setLoadingState('error');
        setErrorMessage(t('scanner_err_no_text'));
        return;
      }

      // Step 2: Classifier
      setLoadingState('classifying');
      const result = await classifyContent(extractedText, languageCode, 'message');
      
      if (!isMounted.current) return;
      setVerdict(result.verdict);
      setExplanation(result.explanation);
      setAdvice(result.verdict === 'suspicious' ? t('scanner_suspicious_advice') : t('scanner_safe_advice'));
      setLoadingState('done');
    } catch (err: any) {
      if (!isMounted.current) return;
      // console.error('[VISION] Analysis Error:', err);
      setLoadingState('error');
      if (err.message?.includes('No readable text') || err.message?.includes('no text')) {
        setErrorMessage(t('scanner_err_no_text'));
      } else {
        setErrorMessage(t('scanner_err_image'));
      }
    }
  }, [imageUri, languageCode, t]);

  useEffect(() => {
    if (imageUri) {
      startAnalysis();
    } else {
      setLoadingState('error');
      setErrorMessage(t('scanner_err_image'));
    }
  }, [imageUri, startAnalysis, t]);

  const isSafe = verdict === 'safe';

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home_scan_screenshot')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Image Preview ───────────────────────────────────── */}
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
          </View>
        )}

        {/* ── Loading States ──────────────────────────────────── */}
        {(loadingState === 'reading' || loadingState === 'classifying') && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {loadingState === 'reading' ? t('scanner_reading_screenshot') : t('scanner_analyzing_scam')}
            </Text>
          </View>
        )}

        {/* ── Error State ─────────────────────────────────────── */}
        {loadingState === 'error' && (
          <View style={styles.errorBlock}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.retryBtn} onPress={startAnalysis}>
              <Text style={styles.retryBtnText}>{t('retry', 'Try Again')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Result UI ───────────────────────────────────────── */}
        {loadingState === 'done' && verdict && (
          <View style={styles.resultBlock}>
            <View style={[styles.resultCard, isSafe ? styles.resultSafe : styles.resultDanger]}>
              <MaterialIcons name={isSafe ? 'verified-user' : 'gpp-bad'} size={40} color={isSafe ? colors.success : colors.error} />
              <Text style={[styles.resultVerdict, { color: isSafe ? colors.success : colors.error }]}>
                {isSafe ? t('scanner_result_safe') : t('scanner_result_suspicious')}
              </Text>
              <Text style={styles.resultReason}>{explanation}</Text>
            </View>

            <Text style={styles.adviceHead}>{t('scanner_advice_header')}</Text>
            <Text style={styles.adviceBody}>{advice}</Text>

            <TouchableOpacity activeOpacity={0.7} style={styles.backHomeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backHomeBtnText}>{t('go_back', 'Go Back')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
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
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  errorBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  errorText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  retryBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: colors.onPrimary,
  },
  resultBlock: {
    gap: 16,
  },
  resultCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  resultSafe: {
    backgroundColor: colors.successDim,
    borderColor: colors.success + '40',
  },
  resultDanger: {
    backgroundColor: colors.errorDim,
    borderColor: colors.error + '40',
  },
  resultVerdict: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  resultReason: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  adviceHead: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
    marginTop: 8,
  },
  adviceBody: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  backHomeBtn: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backHomeBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
});
