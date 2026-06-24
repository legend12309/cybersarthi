const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const userId = 'usr_manual_test_' + Date.now();
  console.log(`Starting simulator test for new user: ${userId}`);

  // 1. Initial Launch: getOrCreateUser
  console.log('\n--- Step 1: Initial Launch (getOrCreateUser) ---');
  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert(
      { id: userId, device_id: userId, preferred_language: 'hi-IN', level: 'Level 2: Vigilant' },
      { onConflict: 'device_id' }
    )
    .select()
    .single();

  if (userError) {
    console.error('Upsert User Error:', userError);
    return;
  }
  console.log('User created/upserted in DB:', userData);

  // 2. Complete 1 simulator scenario
  console.log('\n--- Step 2: Complete 1 Simulator Scenario ---');
  const { data: simData, error: simError } = await supabase
    .from('scam_reports')
    .insert([
      {
        user_id: userId,
        scammer_phone: '',
        amount_lost: 0,
        description: 'scam',
        scam_type: 'digital_arrest',
        fraud_type: 'digital_arrest',
        source: 'simulator',
        is_vulnerable: false
      }
    ])
    .select();

  if (simError) {
    console.error('Scam Report Insert Error:', simError);
    return;
  }
  console.log('Simulator completion recorded:', simData);

  // 3. Complete Quiz
  console.log('\n--- Step 3: Complete Quiz ---');
  const { data: quizData, error: quizError } = await supabase
    .from('quiz_scores')
    .insert([
      {
        user_id: userId,
        quiz_topic: 'General',
        scam_topic: 'General',
        score: 5,
        total_questions: 5
      }
    ])
    .select();

  if (quizError) {
    console.error('Quiz Score Insert Error:', quizError);
    return;
  }
  console.log('Quiz score recorded:', quizData);

  // 4. Fetch stats & check badges (like fetchUserStats in dbServices.ts)
  console.log('\n--- Step 4: Fetch Stats & Verify Badges ---');
  
  // A. Fetch level
  const { data: uData } = await supabase.from('users').select('level').eq('id', userId).single();
  console.log('Current Level in DB:', uData?.level);

  // B. Fetch quiz scores
  const { data: qScores } = await supabase.from('quiz_scores').select('*').eq('user_id', userId);
  const highestQuizScore = Math.max(0, ...qScores.map(q => q.score || 0));
  console.log('Quiz Scores in DB:', qScores);
  console.log('Highest Quiz Score:', highestQuizScore);

  // C. Fetch sim count
  const { data: sReports } = await supabase.from('scam_reports').select('*').eq('user_id', userId).eq('source', 'simulator');
  const simCount = new Set(sReports.map(s => s.scam_type)).size;
  console.log('Simulator reports in DB:', sReports);
  console.log('Unique simulator scenario count:', simCount);

  // D. Calculate badges
  const unlockedBadges = ['Verified Protector'];
  if (simCount >= 10) unlockedBadges.push('Sim Hero');
  if (simCount >= 5) unlockedBadges.push('Scam Spotter');
  if (simCount >= 1) unlockedBadges.push('Link Sentry');
  if (highestQuizScore >= 4) unlockedBadges.push('Quiz Master');

  console.log('\nCalculated Unlocked Badges:', unlockedBadges);

  const expectedBadges = ['Verified Protector', 'Link Sentry', 'Quiz Master'];
  const allMatch = expectedBadges.every(b => unlockedBadges.includes(b));
  if (allMatch) {
    console.log('\n✅ SUCCESS: Badges unlocked correctly! Verified Protector, Link Sentry, and Quiz Master are unlocked.');
  } else {
    console.log('\n❌ FAILURE: Missing expected badges.');
  }
}

runTest();
