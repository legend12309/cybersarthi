const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('link_scans').select('*').limit(1);
  console.log('link_scans error:', error);
  console.log('link_scans data:', data);
}
run();
