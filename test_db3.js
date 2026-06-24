const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || supabaseAnonKey); // we need service role or just run a generic query if possible, but anon key can't query information_schema usually

// Alternatively, let's just try score: 90
async function run() {
  const deviceId = 'test_device_id_123';
  
  const { data: qData, error: qErr } = await supabase
    .from('quiz_scores')
    .insert([{ user_id: deviceId, scam_topic: 'General', score: 90, total_questions: 100 }])
    .select();
  
  console.log('Quiz Insert 90/100:', JSON.stringify(qData), 'Err:', JSON.stringify(qErr));

  // try with just score (if total_questions is not there)
}
run();
