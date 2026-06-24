const axios = require('axios');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const definitions = response.data.definitions;
    console.log('Tables:', Object.keys(definitions));
    for (const tableName of Object.keys(definitions)) {
      console.log(`\nTable: ${tableName}`);
      console.log('Properties:', Object.keys(definitions[tableName].properties).map(p => `${p} (${definitions[tableName].properties[p].type})`));
    }
  } catch (e) {
    console.error('Error fetching OpenAPI spec:', e.message, e.response?.data);
  }
}
run();
