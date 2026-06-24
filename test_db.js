const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const deviceId = 'test_device_id_123';
  
  // Test insert quiz score
  const { data: qData, error: qErr } = await supabase
    .from('quiz_scores')
    .insert([{ user_id: deviceId, quiz_topic: 'General', score: 9, total_questions: 10 }])
    .select();
  
  console.log('Quiz Insert:', JSON.stringify(qData), 'Err:', JSON.stringify(qErr));

  // Test fetch quiz score
  const { data: qFetch, error: qFetchErr } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('user_id', deviceId);

  console.log('Quiz Fetch:', JSON.stringify(qFetch), 'Err:', JSON.stringify(qFetchErr));
}
run();
