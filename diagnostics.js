import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSQL() {
  console.log('--- scam_reports WHERE source = simulator ---');
  const r1 = await supabase.from('scam_reports').select('*').eq('source', 'simulator');
  console.log(r1.data);
  
  console.log('--- quiz_scores ---');
  const r2 = await supabase.from('quiz_scores').select('*');
  console.log(r2.data);
  
  console.log('--- users ---');
  const r3 = await supabase.from('users').select('id, device_id');
  console.log(r3.data);
}
runSQL();
