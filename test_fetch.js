import 'dotenv/config';
import { fetchUserStats } from './src/lib/dbServices.js';

// Setup polyfill for console.log
const originalLog = console.log;
console.log = (...args) => originalLog(...args);

async function run() {
  const testId = 'usr_gznzoie2mr-ja7atatro8-90626vvhj7p'; // The ID we found in the db that actually has a scam report
  console.log('--- Testing fetchUserStats ---');
  const stats = await fetchUserStats(testId);
  console.log('\n--- Final Stats Returned ---');
  console.log(JSON.stringify(stats, null, 2));
}

run();
