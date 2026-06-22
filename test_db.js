import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing db fetch...');
  const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1);
  console.log('Users:', users, uErr);
  const { data: scores, error: qErr } = await supabase.from('quiz_scores').select('*').limit(1);
  console.log('Scores:', scores, qErr);
  const { data: reports, error: rErr } = await supabase.from('scam_reports').select('*').limit(1);
  console.log('Reports:', reports, rErr);
}

test();
