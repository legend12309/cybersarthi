const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: users, error: err1 } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('--- RECENT USERS ---');
  console.log(users);
  if (err1) console.error('Error fetching users:', err1);

  const { data: scans, error: err2 } = await supabase
    .from('link_scans')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(5);

  console.log('--- RECENT SCANS ---');
  console.log(scans);
  if (err2) console.error('Error fetching scans:', err2);
}
run();
