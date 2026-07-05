require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('--- Testing Supabase ---');
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase keys in .env');
    return false;
  }
  const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase Query Error:', error);
      return false;
    }
    console.log('Supabase Connection & Query: SUCCESS. Found users:', data.length);
    return true;
  } catch (err) {
    console.error('Supabase Exception:', err);
    return false;
  }
}

async function testSarvamChat() {
  console.log('--- Testing Sarvam Chat ---');
  if (!process.env.EXPO_PUBLIC_SARVAM_API_KEY) {
    console.error('Missing Sarvam API key in .env');
    return false;
  }
  const url = process.env.EXPO_PUBLIC_SARVAM_API_URL || 'https://api.sarvam.ai';
  try {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY
      },
      body: JSON.stringify({
        model: 'sarvam-2b-v0.5',
        messages: [{ role: 'user', content: 'Say hello' }],
        temperature: 0.1
      })
    });
    const data = await response.json();
    if (data.choices && data.choices[0]) {
      console.log('Sarvam Chat: SUCCESS');
      return true;
    }
    console.error('Sarvam Chat Failure:', data);
    return false;
  } catch (err) {
    console.error('Sarvam Exception:', err);
    return false;
  }
}

async function runAll() {
  const supabaseOk = await testSupabase();
  const sarvamOk = await testSarvamChat();
  console.log('\n--- AUDIT RESULTS ---');
  console.log('Supabase API:', supabaseOk ? 'PASS' : 'FAIL');
  console.log('Sarvam API:', sarvamOk ? 'PASS' : 'FAIL');
}

runAll();
