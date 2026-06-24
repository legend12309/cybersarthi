const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const testDeviceId = 'usr_test_device_unique_123';
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { id: testDeviceId, device_id: testDeviceId, preferred_language: 'en-IN' },
      { onConflict: 'device_id' }
    )
    .select()
    .single();

  console.log('Result:', data);
  console.log('Error:', error);
}
run();
