import { supabase } from './supabase';

export async function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Supabase request timed out')), ms))
  ]);
}

// TODO (Post-Hackathon): Upgrade to Supabase Auth with proper JWT-based RLS.
// Currently relying on application-layer device_id / user_id checks as a temporary workaround 
// since current RLS policies are overly permissive (USING true).

export interface UserProfile {
  id: string;
  language: string;
  level: string;
}

export async function getOrCreateUser(deviceId: string, languageCode: string): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    id: deviceId,
    language: languageCode,
    level: 'Level 2: Vigilant',
  };

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('users')
        .upsert(
          { id: deviceId, device_id: deviceId, preferred_language: languageCode },
          { onConflict: 'device_id' }
        )
        .select('id, preferred_language')
        .single()
    );

    if (error) {
      console.warn('Supabase getOrCreateUser error:', error);
      return fallbackProfile;
    }

    return {
      id: data.id,
      language: data.preferred_language,
      level: 'Level 2: Vigilant'
    };
  } catch (error) {
    console.error('Supabase getOrCreateUser unexpected error:', error);
    return fallbackProfile;
  }
}

export async function submitScamReport(userId: string, phone: string, amount: number, description: string, scamType: string, fraudType: string = 'other', source: string = 'user_report', isVulnerable: boolean = false): Promise<{ data: any, error: any }> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('scam_reports')
        .insert([
          {
            user_id: userId,
            scammer_phone: phone,
            amount_lost: amount,
            description: description,
            scam_type: scamType,
            fraud_type: fraudType,
            source: source,
            is_vulnerable: isVulnerable
          },
        ])
        .select()
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Supabase submitScamReport unexpected error:', error);
    throw error;
  }
}

export async function saveQuizScore(userId: string, topic: string, score: number, total: number): Promise<{ data: any, error: any }> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('quiz_scores')
        .insert([
          {
            user_id: userId,
            quiz_topic: topic,
            scam_topic: topic,
            score: score,
            total_questions: total
          },
        ])
        .select()
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Supabase saveQuizScore unexpected error:', error);
    throw error;
  }
}

export async function saveLinkScan(userId: string, url: string, verdict: string, explanation: string): Promise<void> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('link_scans')
        .insert([
          {
            user_id: userId,
            url_scanned: url,
            verdict: verdict,
            ai_explanation: explanation
          },
        ])
    );

    if (error) {
      console.warn('Supabase saveLinkScan error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Supabase saveLinkScan unexpected error:', error);
  }
}

export async function getUserReports(userId: string) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('scam_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    );

    if (error) {
      console.warn('Supabase getUserReports error:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Supabase getUserReports unexpected error:', error);
    return [];
  }
}
