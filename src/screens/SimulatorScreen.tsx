import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, theme } from '../lib/colors';
import { useLanguage } from '../context/LanguageContext';
import { fetchUserStats } from '../lib/dbServices';
import { getLocalizedScenarioFeedback } from '../data/scammerScripts';

const { width } = Dimensions.get('window');

import scamsData from '../data/scams.json';
import { getLocalizedScenarios } from '../data/localizedScams';

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  warning: { bg: colors.warningDim, text: colors.warning },
  success: { bg: colors.successDim, text: colors.success },
  primary: { bg: colors.primaryGlow, text: colors.primary },
  error:   { bg: colors.errorDim,   text: colors.error   },
};

export default function SimulatorScreen({ navigation }: any) {
  const { t, languageCode, userId, deviceId } = useLanguage();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [level, setLevel] = useState('Level 1: Novice');
  const [roleplayHistory, setRoleplayHistory] = useState<any[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedRoleplay, setSelectedRoleplay] = useState<any | null>(null);

  const scenarios = React.useMemo(() => {
    const localized = getLocalizedScenarios(scamsData, languageCode);
    return localized.map((s, i) => ({
      ...s,
      icon: ['receipt-long', 'local-shipping', 'account-balance', 'family-restroom', 'emoji-events', 'qr-code-scanner', 'work', 'phonelink-erase', 'card-giftcard', 'policy'][i % 10],
      colorKey: ['warning', 'error', 'primary', 'warning', 'success', 'primary', 'success', 'error', 'warning', 'error'][i % 10],
    }));
  }, [languageCode]);

  useEffect(() => {
    let active = true;
    const activeUser = userId || deviceId;
    if (isFocused && activeUser) {
      fetchUserStats(activeUser).then(data => { if (active && data) setLevel(data.level); });
      AsyncStorage.getItem(`@cybersaathi_roleplay_sessions_${activeUser}`).then(raw => {
        if (active && raw) {
          try {
            setRoleplayHistory(JSON.parse(raw));
          } catch (e) {}
        } else if (active) {
          setRoleplayHistory([]);
        }
      });
    }
    return () => { active = false; };
  }, [isFocused, userId, deviceId]);

  const getLocalizedLevel = (l: string) => {
    const map: Record<string, string> = {
      'Level 1: Novice':   t('sim_badge_novice') || 'Level 1: Novice',
      'Level 2: Vigilant': t('sim_badge_vigilant'),
      'Level 3: Sentry':   t('level_3_sentry'),
      'Level 4: Defender': t('level_4_defender'),
      'Level 5: Guardian': t('level_5_guardian'),
    };
    return map[l] || l;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.levelPill}>
            <MaterialIcons name="military-tech" size={16} color={colors.primary} />
            <Text style={styles.levelText}>{getLocalizedLevel(level)}</Text>
          </View>
          <Text style={styles.title}>{t('sim_practice_title')}</Text>
          <Text style={styles.subtitle}>{t('sim_practice_subtitle')}</Text>
        </View>

        {/* Hero Featured Card (Insightlancer Deep Navy Card) */}
        <TouchableOpacity style={styles.heroCardNavy}
          onPress={() => navigation.navigate('ScamDetail', { scamId: scenarios[0].id })}
          activeOpacity={0.85}
        >
          <View style={styles.heroCardTop}>
            <View style={styles.heroIconNavyBg}>
              <MaterialIcons name={scenarios[0].icon as any} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.hotBadge}>
              <MaterialIcons name="local-fire-department" size={12} color="#FFFFFF" />
              <Text style={styles.hotBadgeText}>{t('sim_featured_badge', 'FEATURED')}</Text>
            </View>
          </View>
          <Text style={styles.heroTitleNavy}>{scenarios[0].title}</Text>
          <Text style={styles.heroDescNavy} numberOfLines={2}>{scenarios[0].content}</Text>
          
          <View style={styles.heroActionRow}>
            <View style={styles.heroActionBtn}>
              <Text style={styles.heroActionBtnText}>{t('sim_card_electricity_button') || 'Try Scenario'}</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            </View>
            <View style={styles.roleplayBadgePill}>
              <MaterialIcons name="record-voice-over" size={14} color="#FFFFFF" />
              <Text style={styles.roleplayBadgeText}>{t('sim_voice_text_badge', 'Voice & Text')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quiz Banner (Insightlancer Clean White Card) */}
        <TouchableOpacity style={styles.quizBanner}
          onPress={() => navigation.navigate('Quiz')}
          activeOpacity={0.85}
        >
          <View style={styles.quizIconWrap}>
            <MaterialIcons name="school" size={24} color={colors.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.quizBannerTitle}>{t('sim_quiz_title') || 'Test Your Knowledge'}</Text>
            <Text style={styles.quizBannerDesc}>{t('sim_quiz_desc') || 'Take a quick 5-question quiz to earn points!'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Past Roleplays & Transcripts Banner */}
        <TouchableOpacity 
          style={styles.pastRoleplaysBanner}
          onPress={() => setHistoryModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.historyIconWrap}>
            <MaterialIcons name="history-edu" size={24} color={colors.primary} />
          </View>
          <View style={styles.historyTextContainer}>
            <Text style={styles.historyBannerTitle} numberOfLines={1}>
              {t('sim_past_roleplays_title')}
            </Text>
            <Text style={styles.historyBannerDesc} numberOfLines={2}>
              {roleplayHistory.length > 0 
                ? t('sim_past_roleplays_desc').replace('{count}', String(roleplayHistory.length))
                : t('sim_past_roleplays_desc_zero')}
            </Text>
          </View>
          <View style={styles.bannerRightAction}>
            {roleplayHistory.length > 0 && (
              <View style={styles.historyCountPill}>
                <Text style={styles.historyCountText}>{roleplayHistory.length}</Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </View>
        </TouchableOpacity>

        {/* Scenario List (Insightlancer "My Team" Style) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('sim_more_scenarios') || 'More Scenarios'}</Text>
          <Text style={styles.sectionLink}>{t('sim_scenarios_available').replace('{count}', String(scenarios.length - 1))}</Text>
        </View>

        {scenarios.slice(1).map(s => {
          const c = COLOR_MAP[s.colorKey];
          return (
            <TouchableOpacity key={s.id}
              style={styles.scenarioRow}
              onPress={() => navigation.navigate('ScamDetail', { scamId: s.id })}
              activeOpacity={0.8}
            >
              <View style={[styles.scenarioIconBg, { backgroundColor: c.bg }]}>
                <MaterialIcons name={s.icon as any} size={22} color={c.text} />
              </View>
              <View style={styles.flex1}>
                <View style={styles.scenarioTitleRow}>
                  <Text style={styles.scenarioTitle} numberOfLines={1} ellipsizeMode="tail">
                    {s.title}
                  </Text>
                  <View style={styles.simAvailableBadge}>
                    <MaterialIcons name="record-voice-over" size={10} color={colors.primary} />
                    <Text style={styles.simAvailableBadgeText}>{t('live_roleplay_title', 'Live Sim')}</Text>
                  </View>
                </View>
                <Text style={styles.scenarioDesc} numberOfLines={1} ellipsizeMode="tail">{s.content}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} style={styles.chevronIcon} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Past Roleplays Modal ────────────────────────────── */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (selectedRoleplay) {
            setSelectedRoleplay(null);
          } else {
            setHistoryModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                {selectedRoleplay && (
                  <TouchableOpacity
                    style={styles.modalBackBtn}
                    onPress={() => setSelectedRoleplay(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedRoleplay ? t('sim_modal_title_detail') : t('sim_modal_title_list')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setSelectedRoleplay(null);
                  setHistoryModalVisible(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {selectedRoleplay ? (
              /* Detail View: Full Transcript & Evaluation */
              <ScrollView 
                style={styles.detailScroll} 
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Scenario Header Bar */}
                <View style={styles.detailScenarioHeader}>
                  <Text style={styles.detailScenarioTitle} numberOfLines={1}>
                    {t('scam_title_' + selectedRoleplay.scamId, selectedRoleplay.scamTitle)}
                  </Text>
                  <View style={[
                    styles.badgePill,
                    selectedRoleplay.verdict === 'PASS' ? styles.badgePass : styles.badgeFail
                  ]}>
                    <MaterialIcons
                      name={selectedRoleplay.verdict === 'PASS' ? "check-circle" : "error-outline"}
                      size={12}
                      color={selectedRoleplay.verdict === 'PASS' ? colors.success : colors.warning}
                    />
                    <Text style={[
                      styles.badgePillText,
                      { color: selectedRoleplay.verdict === 'PASS' ? colors.success : colors.warning }
                    ]}>
                      {selectedRoleplay.verdict === 'PASS' ? t('sim_verdict_pill_deflected') : t('sim_verdict_pill_practice')}
                    </Text>
                  </View>
                </View>

                {/* Result Card */}
                <View style={[
                  styles.verdictBanner,
                  selectedRoleplay.verdict === 'PASS' ? styles.verdictBannerPass : styles.verdictBannerFail
                ]}>
                  <View style={styles.verdictHeader}>
                    <MaterialIcons 
                      name={selectedRoleplay.verdict === 'PASS' ? "verified-user" : "warning"} 
                      size={20} 
                      color={selectedRoleplay.verdict === 'PASS' ? colors.success : colors.warning} 
                    />
                    <Text style={[
                      styles.verdictTitle,
                      { color: selectedRoleplay.verdict === 'PASS' ? colors.success : colors.warning }
                    ]}>
                      {selectedRoleplay.verdict === 'PASS' ? t('sim_verdict_deflected') : t('sim_verdict_practice')}
                    </Text>
                  </View>
                  <Text style={styles.verdictFeedback}>
                    {(selectedRoleplay.feedback && !selectedRoleplay.feedback.includes('network issue') && !selectedRoleplay.feedback.includes('Could not complete'))
                      ? selectedRoleplay.feedback
                      : getLocalizedScenarioFeedback(selectedRoleplay.scamId, languageCode, selectedRoleplay.verdict)}
                  </Text>
                  <Text style={styles.verdictMeta}>
                    {new Date(selectedRoleplay.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })} • {t('sim_user_responses').replace('{count}', String(selectedRoleplay.exchanges))}
                  </Text>
                </View>

                {/* Conversation Transcript */}
                <Text style={styles.transcriptSectionTitle}>{t('sim_conversation_log')}</Text>
                <View style={styles.transcriptWrap}>
                  {selectedRoleplay.messages
                    ?.filter((msg: any) => msg.role !== 'system' && msg.role !== 'system_context')
                    .map((msg: any, idx: number) => {
                      const isUser = msg.role === 'user';
                      const content = (isUser && (msg.content === 'Hello?' || msg.id === 'usr0'))
                        ? t('initial_user_hello', 'Hello?')
                        : msg.content;
                      return (
                        <View key={idx} style={[styles.tRow, isUser ? styles.tRowUser : styles.tRowScammer]}>
                          <Text style={[styles.tSender, isUser ? styles.tSenderUser : styles.tSenderScammer]}>
                            {isUser ? t('sim_sender_you') : t('sim_sender_scammer')}
                          </Text>
                          <View style={[styles.tBubble, isUser ? styles.tBubbleUser : styles.tBubbleScammer]}>
                            <Text style={[styles.tBubbleText, isUser ? styles.tBubbleTextUser : styles.tBubbleTextScammer]}>
                              {content}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                </View>
              </ScrollView>
            ) : (
              /* List View */
              roleplayHistory.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <MaterialIcons name="military-tech" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
                  <Text style={styles.modalEmptyTitle}>{t('sim_modal_empty_title')}</Text>
                  <Text style={styles.modalEmptySub}>
                    {t('sim_modal_empty_sub')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={roleplayHistory}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[styles.roleplayList, { paddingBottom: insets.bottom + 24 }]}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.roleplayItemCard}
                      onPress={() => setSelectedRoleplay(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.roleplayItemHeader}>
                        <View style={[
                          styles.badgePill,
                          item.verdict === 'PASS' ? styles.badgePass : styles.badgeFail
                        ]}>
                          <MaterialIcons
                            name={item.verdict === 'PASS' ? "check-circle" : "error-outline"}
                            size={12}
                            color={item.verdict === 'PASS' ? colors.success : colors.warning}
                          />
                          <Text style={[
                            styles.badgePillText,
                            { color: item.verdict === 'PASS' ? colors.success : colors.warning }
                          ]}>
                            {item.verdict === 'PASS' ? t('sim_verdict_pill_deflected') : t('sim_verdict_pill_practice')}
                          </Text>
                        </View>
                        <Text style={styles.roleplayItemDate}>
                          {new Date(item.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>

                      <Text style={styles.roleplayItemTitle}>
                        {t('scam_title_' + item.scamId, item.scamTitle)}
                      </Text>
                      <Text style={styles.roleplayItemFeedback} numberOfLines={2}>
                        {(item.feedback && !item.feedback.includes('network issue') && !item.feedback.includes('Could not complete'))
                          ? item.feedback
                          : getLocalizedScenarioFeedback(item.scamId, languageCode, item.verdict)}
                      </Text>

                      <View style={styles.roleplayItemFooter}>
                        <Text style={styles.roleplayItemTurns}>
                          {t('sim_dialogue_turns').replace('{count}', String(item.exchanges))}
                        </Text>
                        <View style={styles.viewTranscriptBtn}>
                          <Text style={styles.viewTranscriptText}>{t('sim_view_transcript')}</Text>
                          <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )
            )}
          </View>
        </View>

      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100, gap: 16 },

  header: { gap: 6, marginBottom: 2 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  levelText: { fontFamily: 'Manrope_700Bold', fontSize: 12, color: colors.primary },
  title: { fontFamily: 'Manrope_700Bold', fontSize: 24, color: colors.onSurface, letterSpacing: -0.3 },
  subtitle: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },

  // Insightlancer Deep Navy Hero Card
  heroCardNavy: {
    backgroundColor: colors.navyCard,
    borderRadius: 22,
    padding: 20,
    gap: 10,
    shadowColor: colors.navyCard,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.navyCardBorder,
  },
  heroCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconNavyBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: '#FFFFFF', letterSpacing: 0.5 },
  heroTitleNavy: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: '#FFFFFF' },
  heroDescNavy: { fontFamily: 'PublicSans_400Regular', fontSize: 13, color: colors.navyCardSub, lineHeight: 18 },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroActionBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: colors.primary },
  roleplayBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  roleplayBadgeText: { fontFamily: 'PublicSans_400Regular', fontSize: 11, color: colors.navyCardSub },

  // Quiz Banner
  quizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quizIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizBannerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onSurface },
  quizBannerDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: colors.onSurface },
  sectionLink: { fontFamily: 'PublicSans_400Regular', fontSize: 12, color: colors.onSurfaceVariant },

  // Scenario row ("My Team" list style)
  scenarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 14,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  scenarioIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  flex1: { flex: 1, minWidth: 0, justifyContent: 'center' },
  scenarioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  scenarioTitle: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 13.5, 
    color: colors.onSurface,
    flexShrink: 1,
  },
  simAvailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    flexShrink: 0,
  },
  simAvailableBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  scenarioDesc: { 
    fontFamily: 'PublicSans_400Regular', 
    fontSize: 12, 
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  chevronIcon: {
    flexShrink: 0,
    marginLeft: 4,
  },

  // Past Roleplays Banner
  pastRoleplaysBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
    shadowColor: '#0B1527',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  historyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTextContainer: {
    flex: 1,
    paddingRight: 6,
  },
  bannerRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  historyBannerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: colors.onSurface },
  historyCountPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  historyCountText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  historyBannerDesc: { fontFamily: 'PublicSans_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    flex: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmpty: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  modalEmptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: colors.onSurface,
    marginTop: 8,
  },
  modalEmptySub: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 19,
  },
  roleplayList: {
    paddingVertical: 12,
    gap: 12,
  },
  roleplayItemCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 8,
  },
  roleplayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePass: {
    backgroundColor: colors.successDim,
  },
  badgeFail: {
    backgroundColor: colors.warningDim,
  },
  badgePillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
  roleplayItemDate: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  roleplayItemTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: colors.onSurface,
  },
  roleplayItemFeedback: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 12.5,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  roleplayItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  roleplayItemTurns: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11.5,
    color: colors.onSurfaceVariant,
  },
  viewTranscriptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewTranscriptText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: colors.primary,
  },

  // Detail View Styles
  detailScenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  detailScenarioTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: colors.onSurface,
    flex: 1,
    marginRight: 10,
  },
  detailScroll: {
    paddingVertical: 10,
  },
  verdictBanner: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
  },
  verdictBannerPass: {
    backgroundColor: colors.successDim,
    borderColor: colors.success + '40',
  },
  verdictBannerFail: {
    backgroundColor: colors.warningDim,
    borderColor: colors.warning + '40',
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  verdictFeedback: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 19,
  },
  verdictMeta: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  transcriptSectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 10,
  },
  transcriptWrap: {
    gap: 10,
    paddingBottom: 20,
  },
  tRow: {
    gap: 4,
  },
  tRowUser: {
    alignItems: 'flex-end',
  },
  tRowScammer: {
    alignItems: 'flex-start',
  },
  tSender: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    paddingHorizontal: 4,
  },
  tSenderUser: {
    color: colors.primary,
  },
  tSenderScammer: {
    color: colors.error,
  },
  tBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '85%',
  },
  tBubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  tBubbleScammer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderBottomLeftRadius: 2,
  },
  tBubbleText: {
    fontFamily: 'PublicSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  tBubbleTextUser: {
    color: colors.onPrimary,
  },
  tBubbleTextScammer: {
    color: colors.onSurface,
  },
});