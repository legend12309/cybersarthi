import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSQL() {
  console.log('--- attempt quiz insert ---');
  const { error: e3 } = await supabase.from('quiz_scores').insert([
    {
      user_id: 'usr_gznzoie2mr-ja7atatro8-90626vvhj7p',
      quiz_topic: 'General',
      score: 100,
      total_questions: 5
    }
  ]);
  console.log('Quiz Insert error:', e3);
}
runSQL();
