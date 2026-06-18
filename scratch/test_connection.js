const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Manually parse .env file
const envPath = 'D:\\CyberSaathi\\.env';
if (!fs.existsSync(envPath)) {
  console.error('.env file does not exist at ' + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    envVars[key] = val;
  }
});

const url = envVars['EXPO_PUBLIC_SUPABASE_URL'];
const anonKey = envVars['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!url || !anonKey) {
  console.error('Supabase URL or Key missing in .env variables.');
  process.exit(1);
}

console.log('Connecting to Supabase at:', url);

// 2. Initialize Supabase client
const supabase = createClient(url, anonKey);

async function runTest() {
  console.log('\n--- 1. Testing Connection & Table: users ---');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Failed to query "users" table:', error.message);
      console.log('Ensure you ran the setup script in supabase_schema.sql on your Supabase dashboard SQL editor.');
    } else {
      console.log('✅ Connected successfully to "users" table. Current entries found:', data.length);
    }
  } catch (err) {
    console.error('❌ Connection failed with exception:', err.message);
  }

  console.log('\n--- 2. Testing Connection & Table: scam_reports ---');
  try {
    const { data, error } = await supabase
      .from('scam_reports')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Failed to query "scam_reports" table:', error.message);
    } else {
      console.log('✅ Connected successfully to "scam_reports" table. Current entries found:', data.length);
    }
  } catch (err) {
    console.error('❌ Connection failed with exception:', err.message);
  }

  console.log('\n--- 3. Testing Connection & Table: quiz_scores ---');
  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Failed to query "quiz_scores" table:', error.message);
    } else {
      console.log('✅ Connected successfully to "quiz_scores" table. Current entries found:', data.length);
    }
  } catch (err) {
    console.error('❌ Connection failed with exception:', err.message);
  }

  console.log('\n--- 4. Testing Guest Profile RLS Insertion ---');
  const tempUserId = 'test-guest-' + Math.random().toString(36).substring(7);
  try {
    // Attempt upsert user profile (Simulating guest registration)
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: tempUserId, language: 'en-IN', level: 'Level 2: Vigilant' })
      .select('id')
      .single();

    if (error) {
      console.error('❌ RLS policy failed or user creation block failed:', error.message);
    } else {
      console.log('✅ Inserted/Upserted mock user successfully: ID =', data.id);
      
      // Clean up mock user
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', tempUserId);

      if (deleteError) {
        console.warn('⚠️ Clean up failed (this is expected if RLS delete policy is off, which is standard for guest safety):', deleteError.message);
      } else {
        console.log('🧹 Cleaned up mock user from database.');
      }
    }
  } catch (err) {
    console.error('❌ Insert test failed with exception:', err.message);
  }
}

runTest();
