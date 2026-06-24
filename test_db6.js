const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY || supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('quiz_scores').select('*').limit(5);
  console.log(JSON.stringify(data, null, 2), error);
}
run();
