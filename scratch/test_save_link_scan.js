const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = 'usr_gznzoie2mr-ja7atatro8-90626vvhj7p';
  const { data, error } = await supabase
    .from('link_scans')
    .insert([
      {
        device_id: userId,
        url_scanned: 'https://test-link.com',
        verdict: 'safe',
        ai_explanation: 'test explanation'
      }
    ])
    .select();
  
  console.log('Result:', data);
  console.log('Error:', error);
}
run();
