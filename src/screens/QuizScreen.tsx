import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../lib/colors';
import quizData from '../data/quiz.json';
import { useLanguage } from '../context/LanguageContext';
import { saveQuizScore } from '../lib/api';

export default function QuizScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { userId, t, languageCode } = useLanguage();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const rawQuestion = quizData[currentIndex] || quizData[0];
  const question = {
    ...rawQuestion,
    ...(rawQuestion?.translations?.[languageCode as keyof typeof rawQuestion.translations] || {})
  };

  const handleSelect = (index: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(index);
    const isCorrect = index === question.correctAnswerIndex;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    // Smoothly scroll to reveal explanation and Next button
    setTimeout(() => {
      if (isMounted.current) {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 120);
  };

  const handleNextQuestion = () => {
    const isLast = currentIndex >= quizData.length - 1;
    if (!isLast) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      // Reset scroll position to top for the new question
      setTimeout(() => {
        if (isMounted.current) {
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        }
      }, 50);
    } else {
      finishQuiz(score);
    }
  };

  const finishQuiz = async (finalScore: number) => {
    setIsFinished(true);
    if (userId) {
      try {
        await saveQuizScore(userId, 'General', finalScore, quizData.length);
      } catch (e) {
        Alert.alert(t('error', 'Error'), t('submit_failed', 'Could not save your score.'));
      }
    }
  };

  const shareBadge = async () => {
    const message = t('badge_share_msg_quiz', `🛡️ I just scored ${score}/${quizData.length} on the CyberSaathi Security Quiz! Can you beat my score?`)
      .replace('{score}', score.toString())
      .replace('{total}', quizData.length.toString());
    
    try {
      await Share.share({ message });
    } catch (error) {
      // console.log('Error sharing', error);
    }
  };

  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[
            styles.finishedScrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 48) }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.trophyIconContainer}>
            <MaterialIcons name="emoji-events" size={72} color={colors.primary} />
          </View>
          
          <Text style={styles.resultTitle}>{t('quiz_completed', 'Quiz Completed!')}</Text>
          <Text style={styles.scoreText}>{score} / {quizData.length}</Text>
          
          <View style={styles.badgeCard}>
            <MaterialIcons name="security" size={44} color={colors.success} />
            <Text style={styles.badgeName}>
              {score === quizData.length
                ? t('badge_cyber_guardian', 'Cyber Guardian')
                : score >= 3
                ? t('badge_vigilant_citizen', 'Vigilant Citizen')
                : t('badge_trainee', 'Trainee')}
            </Text>
            <Text style={styles.badgeSub}>
              {score === quizData.length
                ? 'Outstanding! You aced all cybersecurity scenarios.'
                : score >= 3
                ? 'Great awareness! You recognized critical fraud indicators.'
                : 'Keep practicing to master recognizing cyber threats.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={shareBadge} activeOpacity={0.85}>
            <MaterialIcons name="share" size={20} color={colors.onPrimary} />
            <Text style={styles.shareBtnText}>{t('share_badge', 'Share Badge')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, styles.homeBtn]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>{t('return_home', 'Return Home')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const isAnswered = selectedOption !== null;
  const isUserCorrect = selectedOption === question.correctAnswerIndex;
  const progressPercent = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="arrow-back" size={26} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t('quiz_question_label', 'Question')} {currentIndex + 1} of {quizData.length}
          </Text>
        </View>
        <View style={styles.scorePill}>
          <MaterialIcons name="star" size={16} color="#F59E0B" />
          <Text style={styles.scorePillText}>{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Question & Options ScrollView */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 56) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.questionText}>{question.question}</Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {question.options.map((opt: string, i: number) => {
            const isSelected = selectedOption === i;
            const isCorrect = i === question.correctAnswerIndex;

            let buttonStyle: any = styles.optionBtn;
            let textStyle: any = styles.optionText;

            if (isAnswered) {
              if (isCorrect) {
                buttonStyle = styles.correctOptionBtn;
                textStyle = styles.correctOptionText;
              } else if (isSelected) {
                buttonStyle = styles.wrongOptionBtn;
                textStyle = styles.wrongOptionText;
              } else {
                buttonStyle = styles.dimmedOptionBtn;
                textStyle = styles.dimmedOptionText;
              }
            }

            return (
              <TouchableOpacity
                key={`opt-${currentIndex}-${i}`}
                style={buttonStyle}
                onPress={() => handleSelect(i)}
                activeOpacity={0.8}
                disabled={isAnswered}
              >
                <Text style={textStyle}>{opt}</Text>
                
                {isAnswered && (
                  <View style={styles.optionIconContainer}>
                    {isCorrect && (
                      <MaterialIcons name="check-circle" size={22} color={colors.success} />
                    )}
                    {isSelected && !isCorrect && (
                      <MaterialIcons name="cancel" size={22} color={colors.error} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation Card & Next Button */}
        {isAnswered && (
          <View style={styles.feedbackSection}>
            <View style={[
              styles.explanationCard,
              isUserCorrect ? styles.explanationCardCorrect : styles.explanationCardWrong
            ]}>
              <View style={styles.explanationHeaderRow}>
                <MaterialIcons
                  name={isUserCorrect ? 'check-circle' : 'info'}
                  size={22}
                  color={isUserCorrect ? colors.success : colors.error}
                />
                <Text style={[
                  styles.explanationStatus,
                  { color: isUserCorrect ? '#065F46' : '#991B1B' }
                ]}>
                  {isUserCorrect
                    ? t('quiz_correct_badge', 'Correct Answer!')
                    : t('quiz_incorrect_badge', 'Incorrect')}
                </Text>
              </View>

              <Text style={styles.explanationTitle}>
                {t('quiz_explanation_title', 'Why this matters')}:
              </Text>
              <Text style={styles.explanationBody}>{question.explanation}</Text>
            </View>

            {/* Next / Finish Button */}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex < quizData.length - 1
                  ? t('quiz_next_question', 'Next Question')
                  : t('quiz_view_results', 'View Results')}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: colors.onSurface,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scorePillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#92400E',
  },

  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: 24,
    lineHeight: 28,
  },

  optionsList: {
    gap: 12,
  },
  
  // Clean, modern card styling with 100% OPAQUE background
  // No elevation to prevent Android hardware shadow clipping bug
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  optionText: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    lineHeight: 22,
    marginRight: 10,
  },

  // Correct Option: Crisp solid pastel emerald, 100% opaque
  correctOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  correctOptionText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
    marginRight: 10,
  },

  // Wrong Option: Crisp solid pastel crimson, 100% opaque
  wrongOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  wrongOptionText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#991B1B',
    lineHeight: 22,
    marginRight: 10,
  },

  // Dimmed Option (unselected other options when answered)
  dimmedOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  dimmedOptionText: {
    flex: 1,
    fontFamily: 'PublicSans_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginRight: 10,
  },

  optionIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },

  // Feedback & Explanation
  feedbackSection: {
    marginTop: 24,
  },
  explanationCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  explanationCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  explanationCardWrong: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  explanationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  explanationStatus: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  explanationTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  explanationBody: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 22,
  },

  // Next / Continue Button
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    marginTop: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onPrimary,
  },

  // Finished Screen
  finishedScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  trophyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF2FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    marginTop: 8,
  },
  scoreText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 48,
    color: colors.primary,
    marginVertical: 10,
  },
  badgeCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    marginVertical: 24,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  badgeName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    marginTop: 12,
  },
  badgeSub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    width: '100%',
    height: 52,
    borderRadius: 26,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onPrimary,
  },
  homeBtn: {
    backgroundColor: 'transparent',
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
});
