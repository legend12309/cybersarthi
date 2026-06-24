const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const deviceId = 'test_device_id_123';
  
  const { data: qData, error: qErr } = await supabase
    .from('quiz_scores')
    .insert([{ user_id: deviceId, scam_topic: 'General', score: 0.9 }])
    .select();
  
  console.log('Quiz Insert 0.9:', JSON.stringify(qData), 'Err:', JSON.stringify(qErr));

}
run();
