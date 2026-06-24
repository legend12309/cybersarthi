const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = 'usr_test_device_unique_123';
  const { data, error } = await supabase
    .from('link_scans')
    .insert([
      {
        user_id: userId,
        url_scanned: 'https://test-success.com',
        verdict: 'safe',
        ai_explanation: 'This works!'
      }
    ])
    .select();

  console.log('Result:', data);
  console.log('Error:', error);
}
run();
