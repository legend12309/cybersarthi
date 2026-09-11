import { evaluateRoleplayHeuristic, getLocalizedScenarioFeedback } from './src/data/scammerScripts';

function sanitizeForTTS(text: string): string {
  if (!text) return '';
  let clean = text;
  clean = clean.replace(/\([^)]*\)/g, ' ');
  clean = clean.replace(/\[[^\]]*\]/g, ' ');
  clean = clean.replace(/\{[^}]*\}/g, ' ');
  clean = clean.replace(/（[^）]*）/g, ' ');
  clean = clean.replace(/【[^】]*】/g, ' ');
  clean = clean.replace(/[*_~`#]+/g, '');
  clean = clean.replace(/https?:\/\/\S+/gi, ' link ');
  clean = clean.replace(/www\.\S+/gi, ' link ');
  clean = clean.replace(/₹/g, ' rupees ');
  clean = clean.replace(/(\d+),(\d+)/g, '$1$2');
  clean = clean.replace(/[-–—]/g, ' ');
  clean = clean.replace(/\s+/g, ' ');
  return clean.trim();
}

function prepareSafeBrowsingEntries(rawUrl: string): Array<{ url: string }> {
  const cleanUrl = (rawUrl || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanUrl) return [];
  return /^https?:\/\//i.test(cleanUrl)
    ? [{ url: cleanUrl }]
    : [{ url: `https://${cleanUrl}` }, { url: `http://${cleanUrl}` }];
}

function calculateUserLevel(xp: number): { level: number; title: string } {
  if (xp >= 1000) return { level: 5, title: 'Guardian' };
  if (xp >= 500) return { level: 4, title: 'Defender' };
  if (xp >= 250) return { level: 3, title: 'Sentry' };
  if (xp >= 100) return { level: 2, title: 'Vigilant' };
  return { level: 1, title: 'Novice' };
}

function isValidParticipantId(pid: string): boolean {
  return /^P-[0-9]{3,5}$/.test(pid);
}

let passed = 0;
let failed = 0;
const results: string[] = [];

function assert(description: string, condition: boolean, details?: string) {
  if (condition) {
    passed++;
    results.push(`  ✓ ${description}`);
  } else {
    failed++;
    results.push(`  ✗ FAIL: ${description}${details ? ` (${details})` : ''}`);
  }
}

console.log('===========================================================');
console.log(' CYBERSAATHI AUTOMATED UNIT TEST SUITE (37 ASSERTIONS)     ');
console.log(' Testing: Evaluation Heuristics, TTS Sanitization, Security');
console.log('===========================================================\n');

console.log('Running Suite 1: TTS Sanitization & Acoustic Pre-processing...');
assert('T01: Strips standard round parentheses', sanitizeForTTS('Hello (speaking sternly) this is police') === 'Hello this is police');
assert('T02: Strips square brackets', sanitizeForTTS('Warning [urgent alert] pay now') === 'Warning pay now');
assert('T03: Strips curly braces', sanitizeForTTS('Verification {code 402} required') === 'Verification required');
assert('T04: Strips full-width Indic/Asian parentheses', sanitizeForTTS('सावध रहा （शांततेत बोला） पैसे देऊ नका') === 'सावध रहा पैसे देऊ नका');
assert('T05: Strips thick black brackets', sanitizeForTTS('अंतिम चेतावणी 【कायदेशीर नोटीस】 आजच भरा') === 'अंतिम चेतावणी आजच भरा');
assert('T06: Strips markdown bold, italics, and headers', sanitizeForTTS('**CRITICAL:** # Immediate *action* needed') === 'CRITICAL: Immediate action needed');
assert('T07: Converts URLs to acoustic speech token "link"', sanitizeForTTS('Click https://sbi-kyc.in/pay now') === 'Click link now');
assert('T08: Converts Rupee symbol ₹ to "rupees"', sanitizeForTTS('Your fine is ₹5000 only') === 'Your fine is rupees 5000 only');
assert('T09: De-punctuates formatted currency amounts', sanitizeForTTS('Pay ₹3,240 immediately') === 'Pay rupees 3240 immediately');
assert('T10: Replaces hyphens and collapses repeated whitespace', sanitizeForTTS('Electricity—cut-off   notice  ') === 'Electricity cut off notice');

console.log('\nRunning Suite 2: Deterministic Roleplay Inoculation Heuristics...');
assert('T11: Refusal in Hindi ("नहीं दूंगा, यह फ्रॉड है") yields PASS', evaluateRoleplayHeuristic('User: नहीं दूंगा, यह फ्रॉड है', 'electricity_bill', 'hi-IN').verdict === 'PASS');
assert('T12: Refusal in Marathi ("मी पैसे देणार नाही, तक्रार करेन") yields PASS', evaluateRoleplayHeuristic('User: मी पैसे देणार नाही, तक्रार करेन', 'electricity_bill', 'mr-IN').verdict === 'PASS');
assert('T13: Refusal in English ("This is a scam, reporting to 1930") yields PASS', evaluateRoleplayHeuristic('User: This is a scam, reporting to 1930', 'electricity_bill', 'en-IN').verdict === 'PASS');
assert('T14: Compliance in Hindi ("ओटीपी भेज रहा हूं") yields NEEDS_PRACTICE', evaluateRoleplayHeuristic('User: ओटीपी भेज रहा हूं', 'electricity_bill', 'hi-IN').verdict === 'NEEDS_PRACTICE');
assert('T15: Compliance in Marathi ("मी पाठवतो पैसे") yields NEEDS_PRACTICE', evaluateRoleplayHeuristic('User: मी पाठवतो पैसे', 'electricity_bill', 'mr-IN').verdict === 'NEEDS_PRACTICE');
assert('T16: Compliance in English ("I am transferring the money right now") yields NEEDS_PRACTICE', evaluateRoleplayHeuristic('User: I am transferring the money right now', 'electricity_bill', 'en-IN').verdict === 'NEEDS_PRACTICE');
assert('T17: Immediate Call Disconnection / Hang-Up yields PASS (100% Defensive Inoculation)', evaluateRoleplayHeuristic('User: [Call Disconnected]', 'electricity_bill', 'hi-IN').verdict === 'PASS');
assert('T18: Empty user speech (immediate silence/hang-up) yields PASS', evaluateRoleplayHeuristic('', 'electricity_bill', 'hi-IN').verdict === 'PASS');
assert('T19: Refusal overriding target word ("I will never give my OTP") yields PASS', evaluateRoleplayHeuristic('User: I will never give my OTP to you scammer', 'electricity_bill', 'en-IN').verdict === 'PASS');
assert('T20: Refusal with statutory authority mention ("Calling 1912 electricity board") yields PASS', evaluateRoleplayHeuristic('User: Main 1912 par phone karke check karunga', 'electricity_bill', 'hi-IN').verdict === 'PASS');
assert('T21: Hindi feedback provides 1912 helpline advice', getLocalizedScenarioFeedback('electricity_bill', 'hi-IN', 'PASS').includes('1912'));
assert('T22: Digital Arrest scenario educational feedback warns against fake video calls', getLocalizedScenarioFeedback('digital_arrest', 'en-IN', 'PASS').includes('Digital Arrest'));

console.log('\nRunning Suite 3: Threat Intelligence URL Sanitization...');
assert('T23: Expands scheme-less URL to both HTTP and HTTPS', prepareSafeBrowsingEntries('sbi-kyc-update.apk').length === 2 && prepareSafeBrowsingEntries('sbi-kyc-update.apk')[0].url === 'https://sbi-kyc-update.apk' && prepareSafeBrowsingEntries('sbi-kyc-update.apk')[1].url === 'http://sbi-kyc-update.apk');
assert('T24: Preserves existing HTTPS scheme without duplicate prepending', prepareSafeBrowsingEntries('https://secure-portal.com/login')[0].url === 'https://secure-portal.com/login' && prepareSafeBrowsingEntries('https://secure-portal.com/login').length === 1);
assert('T25: Trims surrounding whitespace and quotes', prepareSafeBrowsingEntries('  "https://phishing-site.xyz"  ')[0].url === 'https://phishing-site.xyz');
assert('T26: Returns empty array for empty or whitespace-only input', prepareSafeBrowsingEntries('   ').length === 0);
assert('T27: Gracefully handles single quotes in URL input', prepareSafeBrowsingEntries("'mahautility-bill.in'")[0].url === 'https://mahautility-bill.in');

console.log('\nRunning Suite 4: Gamification Tier Thresholds...');
assert('T28: Score 0 XP maps to Level 1 Novice', calculateUserLevel(0).title === 'Novice');
assert('T29: Score 150 XP maps to Level 2 Vigilant', calculateUserLevel(150).title === 'Vigilant');
assert('T30: Score 300 XP maps to Level 3 Sentry', calculateUserLevel(300).title === 'Sentry');
assert('T31: Score 750 XP maps to Level 4 Defender', calculateUserLevel(750).title === 'Defender');
assert('T32: Score 1200 XP maps to Level 5 Guardian', calculateUserLevel(1200).title === 'Guardian');

console.log('\nRunning Suite 5: Empirical Research Study & PII Isolation...');
assert('T33: Valid Participant ID format (P-101) accepted', isValidParticipantId('P-101'));
assert('T34: Valid 5-digit Participant ID (P-00234) accepted', isValidParticipantId('P-00234'));
assert('T35: Rejects phone numbers as Participant IDs (Privacy Protection)', !isValidParticipantId('+919876543210'));
assert('T36: Rejects email addresses as Participant IDs (Privacy Protection)', !isValidParticipantId('student@university.edu'));
assert('T37: Rejects un-prefixed IDs (Requires standard P-XXX namespace)', !isValidParticipantId('101'));

console.log('\n===========================================================');
results.forEach(r => console.log(r));
console.log('===========================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎯 ALL 37/37 AUTOMATED UNIT TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}
