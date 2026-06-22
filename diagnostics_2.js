import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSQL() {
  console.log('--- users schema ---');
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'users' });
  console.log('rpc error:', error);
  // fallback if rpc not defined
  const { data: d2, error: e2 } = await supabase.from('users').select('*').limit(1);
  console.log('first user:', d2);
  
  // Actually, I can just use supabase to select from information_schema.columns
  // wait, postgrest might not expose information_schema.
  // I will just use fetch to get swagger docs maybe? No.
}
runSQL();
