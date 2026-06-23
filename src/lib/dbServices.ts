import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  language: string;
  level: string;
}

export interface UserStats {
  totalQuizScore: number;
  completedSimulations: number;
  level: string;
  unlockedBadges: string[];
}

/**
 * Get or create a user profile in the database based on their unique device ID.
 * If offline or database fails, returns a local mock profile so the app doesn't crash.
 */
export async function getOrCreateUser(deviceId: string, languageCode: string): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    id: deviceId,
    language: languageCode,
    level: 'Level 2: Vigilant',
  };

  try {
    // Atomically upsert user record to avoid Primary Key violation race conditions
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { id: deviceId, language: languageCode, level: 'Level 2: Vigilant' },
        { onConflict: 'id' }
      )
      .select('id, language, level')
      .single();

    if (error) {
      console.warn('Supabase getOrCreateUser upsert error:', error);
      return fallbackProfile;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Supabase getOrCreateUser unexpected error:', error);
    return fallbackProfile;
  }
}

/**
 * Update the user's selected language in the database.
 */
export async function updateUserLanguage(deviceId: string, languageCode: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ language: languageCode })
      .eq('id', deviceId);

    if (error) {
      console.warn('Supabase updateUserLanguage error:', error);
    }
  } catch (error) {
    console.error('Supabase updateUserLanguage unexpected error:', error);
  }
}

/**
 * Submit a new quiz score.
 */
export async function submitQuizScore(userId: string, scamTopic: string, score: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('quiz_scores')
      .insert([
        {
          user_id: userId,
          scam_topic: scamTopic,
          score: score,
        },
      ]);

    if (error) {
      console.warn('Supabase submitQuizScore error:', error);
    }
  } catch (error) {
    console.error('Supabase submitQuizScore unexpected error:', error);
  }
}

/**
 * Submit a new scam report from the Simulator or Home screen.
 */
export async function submitScamReport(userId: string, scamType: string, isVulnerable: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('scam_reports')
      .insert([
        {
          user_id: userId,
          scam_type: scamType,
          is_vulnerable: isVulnerable,
        },
      ]);

    if (error) {
      console.warn('Supabase submitScamReport error:', error);
    }
  } catch (error) {
    console.error('Supabase submitScamReport unexpected error:', error);
  }
}

/**
 * Fetch a user's total accumulated score, completed simulations, level, and unlocked badges list.
 */
export async function fetchUserStats(userId: string): Promise<UserStats> {
  const fallbackStats: UserStats = {
    totalQuizScore: 0,
    completedSimulations: 0,
    level: 'Level 2: Vigilant',
    unlockedBadges: ['Verified Protector'], // Default badge
  };

  try {
    console.log('[BADGES] fetchUserStats called with userId:', userId, 'type:', typeof userId);

    // 1. Fetch user's level
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('level')
      .eq('id', userId)
      .maybeSingle();

    let userLevel = fallbackStats.level;
    if (!userError && userData) {
      userLevel = userData.level;
    }

    // 2. Fetch sum of quiz scores
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', userId);
      
    console.log('[BADGES] Quiz scores result:', JSON.stringify(quizData), 'error:', JSON.stringify(quizError));

    let totalScore = 0;
    let highestQuizScore = 0;
    if (!quizError && quizData) {
      totalScore = quizData.reduce((acc, curr) => acc + (curr.score || 0), 0);
      highestQuizScore = Math.max(0, ...quizData.map(q => q.score || 0));
    }

    // 3. Fetch completed simulations count
    const { data: simData, error: simError } = await supabase
      .from('scam_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'simulator');
      
    console.log('[BADGES] Simulator completions result:', JSON.stringify(simData), 'error:', JSON.stringify(simError));

    let simCount = 0;
    if (!simError && simData) {
      // Count unique scam simulations
      const uniqueScams = new Set(simData.map(s => s.scam_type));
      simCount = uniqueScams.size;
    }

    console.log('[BADGES_CHECK] userId:', userId, 'simCount:', simCount, 'bestQuizScore:', highestQuizScore);

    // 4. Calculate achievements/unlocked badges based on stats
    const unlockedBadges = ['Verified Protector']; // Always unlocked

    if (simCount >= 10) {
      unlockedBadges.push('Sim Hero');
    }
    if (simCount >= 5) {
      unlockedBadges.push('Scam Spotter');
    }
    if (simCount >= 1) {
      unlockedBadges.push('Link Sentry');
    }
    
    // Quiz Master requires an 80% score. The quiz has 5 questions, so 80% is 4 out of 5.
    if (highestQuizScore >= 4) {
      unlockedBadges.push('Quiz Master');
    }

    // Update level in database if it changes
    let computedLevel = 'Level 2: Vigilant';
    if (unlockedBadges.length >= 5) {
      computedLevel = 'Level 5: Guardian';
    } else if (unlockedBadges.length >= 4) {
      computedLevel = 'Level 4: Defender';
    } else if (unlockedBadges.length >= 3) {
      computedLevel = 'Level 3: Sentry';
    }

    if (computedLevel !== userLevel) {
      // Try to update level asynchronously
      supabase
        .from('users')
        .update({ level: computedLevel })
        .eq('id', userId)
        .then(
          ({ error }) => {
            if (error) console.warn('Supabase async level update error:', error);
          },
          (err: any) => {
            console.error('Supabase async level update rejection:', err);
          }
        );
      userLevel = computedLevel;
    }

    return {
      totalQuizScore: totalScore,
      completedSimulations: simCount,
      level: userLevel,
      unlockedBadges,
    };
  } catch (error) {
    console.error('Supabase fetchUserStats unexpected error:', error);
    return fallbackStats;
  }
}
