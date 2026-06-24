const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Let's run a query to check the columns of public.users
  // In postgres, we can use information_schema if we have permission, or we can query a system catalog.
  // Since we are anon, we might not have select permission on information_schema, but let's try.
  const { data: cols, error: err } = await supabase.from('users').select('*').limit(1);
  console.log('users columns from row:', cols ? Object.keys(cols[0]) : null);
  
  // Let's try to query public.quiz_scores
  const { data: quizCols } = await supabase.from('quiz_scores').select('*').limit(1);
  console.log('quiz_scores columns from row:', quizCols ? Object.keys(quizCols[0]) : null);

  // Let's try to query public.scam_reports
  const { data: scamCols } = await supabase.from('scam_reports').select('*').limit(1);
  console.log('scam_reports columns from row:', scamCols ? Object.keys(scamCols[0]) : null);

  // Let's try to query public.link_scans
  const { data: linkCols } = await supabase.from('link_scans').select('*').limit(1);
  console.log('link_scans columns from row:', linkCols ? Object.keys(linkCols[0]) : null);
}
run();
