import 'dotenv/config';
import { submitScamReport } from './src/lib/api.js';
import { fetchUserStats } from './src/lib/dbServices.js';

// Polyfill console.log to intercept [BADGES] and [SIMULATOR] logs
const originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && (args[0].startsWith('[BADGES]') || args[0].startsWith('[SIMULATOR]'))) {
    originalLog(...args);
  }
};

async function simulate() {
  const deviceId = 'usr_gznzoie2mr-ja7atatro8-90626vvhj7p'; // known valid device ID from DB
  const scamId = 'electricity_bill';
  const choice = 'scam';

  originalLog('\n--- STEP 1: Simulating ScamDetailScreen (Saving completion) ---');
  console.log('[SIMULATOR] About to save completion. userId:', deviceId, 'source:', 'simulator');
  await submitScamReport(deviceId, '', 0, choice === 'safe' ? 'safe' : 'scam', scamId, scamId, 'simulator');

  originalLog('\n--- STEP 2: Simulating BadgesScreen (Fetching stats) ---');
  console.log('[BADGES] About to call fetchUserStats with userId:', deviceId, 'type:', typeof deviceId);
  await fetchUserStats(deviceId);
}

simulate();
