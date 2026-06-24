const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = 'usr_gznzoie2mr-ja7atatro8-90626vvhj7p';
  const { data: quizData, error: quizError } = await supabase
    .from('quiz_scores')
    .select('*')
    .eq('user_id', userId);
    
  console.log('Quiz data:', quizData);
}
run();
