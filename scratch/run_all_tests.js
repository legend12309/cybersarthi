import axios from 'axios';
import fs from 'fs';

// Manually parse .env file
let API_KEY = '';
try {
  const envContent = fs.readFileSync('D:/CyberSaathi/.env', 'utf8');
  const match = envContent.match(/EXPO_PUBLIC_SARVAM_API_KEY\s*=\s*(.*)/);
  if (match && match[1]) {
    API_KEY = match[1].trim();
  }
} catch (e) {
  console.error('Could not read .env file:', e.message);
}

const API_BASE_URL = 'https://api.sarvam.ai';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

const LANG_MAP = {
  'hi-IN': 'Hindi',
  'en-IN': 'English'
};

function isContaminated(text) {
  const contaminationMarkers = [
    /attempt\s*\d/i,
    /draft\s*\d/i,
    /version\s*\d/i,
    /\*\*/,
    /let me (try|rewrite|reconsider)/i,
    /^\s*\*\s/,
    /more conversational/i,
    /simpler language/i,
  ];
  return contaminationMarkers.some(pattern => pattern.test(text));
}

function isIncomplete(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  const lastChar = trimmed[trimmed.length - 1];
  const validEndings = ['.', '?', '!', '।', '"', ')'];
  return !validEndings.includes(lastChar);
}

function truncateToLastSentence(text) {
  const matches = text.match(/[^.!?।]+[.!?।]/g);
  return matches ? matches.join(' ').trim() : text;
}

async function callSarvamChatAPI(transcript, languageCode, mode = 'conversation') {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = mode === 'classification'
    ? `You must respond ONLY in ${languageName}. However, you MUST start your response with the English words "SAFE:" or "SUSPICIOUS:" followed by your explanation in ${languageName}. Do not translate the "SAFE:" or "SUSPICIOUS:" labels.`
    : `You are CyberSaathi, a direct safety assistant analyzing real scenarios described by users.

Common scenario patterns to recognize immediately:
- Someone calling/messaging claiming to be from a known institution (college, bank, government) asking for payment to an unfamiliar number/account → Always recommend verifying directly with the institution through official channels, never paying based on the call/message alone
- Someone asking to share OTP for any reason → Always recommend never sharing OTP
- Unexpected prize/lottery/refund offers → Always recommend treating as suspicious

When the user describes a situation involving money, payment, OTP, personal info, or an unfamiliar contact:
1. Identify the core risk in ONE clause
2. Give a clear recommendation: 'Do not do this' OR 'This seems safe' OR 'Verify first by [specific action]'
3. Keep your ENTIRE response to maximum 2-3 sentences, regardless of how detailed the user's question was

Do not re-explain the user's scenario back to them. Do not list multiple possibilities. Give ONE direct, confident answer.
CRITICAL INSTRUCTION: You must output ONLY your final answer. Do not show your thinking process or write drafts.
Respond in ${languageName}.`;

  const response = await axios.post(
    `${API_BASE_URL}/v1/chat/completions`,
    {
      model: 'sarvam-105b',
      temperature: mode === 'classification' ? 0 : 0.4,
      max_tokens: mode === 'classification' ? 1500 : 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
    },
    { 
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      timeout: 45000
    }
  );
  return response;
}

async function chatWithSarvam(prompt, languageCode, mode = 'conversation') {
  const maxRetries = 2;
  let lastIncompleteContent = null;
  let lastErrorMsg = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callSarvamChatAPI(prompt, languageCode, mode);
      const content = response?.data?.choices?.[0]?.message?.content;
      
      if (content && content.trim().length > 0) {
        const text = content.trim();
        if (mode === 'classification') {
          return text;
        }

        const contaminated = isContaminated(text);
        const incomplete = isIncomplete(text);
        
        if (!contaminated && !incomplete) {
          return text;
        }

        if (!contaminated && incomplete) {
          lastIncompleteContent = text;
        }
      }
      
    } catch (error) {
      lastErrorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message;
    }
  }
  
  if (lastIncompleteContent && mode === 'conversation') {
    return truncateToLastSentence(lastIncompleteContent);
  }

  const errorReason = lastErrorMsg ? ` (Error: ${lastErrorMsg})` : '';
  return mode === 'classification' 
    ? 'SUSPICIOUS: Unable to verify safely, please be cautious.'
    : `माफ़ कीजिए, मैं अभी जवाब नहीं दे पा रहा हूँ। कृपया अपना सवाल थोड़ा छोटा करके फिर पूछें।${errorReason}`;
}

async function classifyContent(content, languageCode, contentType) {
  const prompt = contentType === 'url' 
    ? `You are a strict cybersecurity classifier trained to detect both traditional and modern scam patterns common in India:
TRADITIONAL PATTERNS: lottery/prize scams, fake bank calls asking for OTP/PIN, KYC update threats, electricity disconnection threats, fake police/legal threats, advance fee fraud.
MODERN PATTERNS: AI voice cloning scams (fake voice calls from 'family members'), deepfake video call scams, fake investment/crypto schemes promising high returns, fake delivery/customs fee scams via WhatsApp, QR code payment redirection scams, fake job offers via Telegram/WhatsApp groups, romance scams via dating apps, fake loan apps with predatory terms, screen-sharing remote access scams (AnyDesk/TeamViewer), SIM swap social engineering attempts, fake customer support numbers found via search ads.

Analyze the given content against BOTH categories. Look for: urgency tactics, unverified contact requests, requests for OTP/PIN/personal info, suspicious links/shorteners, too-good-to-be-true offers, emotional manipulation, requests to install remote-access apps, or impersonation of trusted entities (banks, government, family, delivery services, customer support).
URL: "${content}"`
    : `You are a strict cybersecurity classifier trained to detect both traditional and modern scam patterns common in India:
TRADITIONAL PATTERNS: lottery/prize scams, fake bank calls asking for OTP/PIN, KYC update threats, electricity disconnection threats, fake police/legal threats, advance fee fraud.
MODERN PATTERNS: AI voice cloning scams (fake voice calls from 'family members'), deepfake video call scams, fake investment/crypto schemes promising high returns, fake delivery/customs fee scams via WhatsApp, QR code payment redirection scams, fake job offers via Telegram/WhatsApp groups, romance scams via dating apps, fake loan apps with predatory terms, screen-sharing remote access scams (AnyDesk/TeamViewer), SIM swap social engineering attempts, fake customer support numbers found via search ads.

Analyze the given content against BOTH categories. Look for: urgency tactics, unverified contact requests, requests for OTP/PIN/personal info, suspicious links/shorteners, too-good-to-be-true offers, emotional manipulation, requests to install remote-access apps, or impersonation of trusted entities (banks, government, family, delivery services, customer support).
Message: "${content}"`;
  
  const systemPrompt = `${prompt}\n\nIMPORTANT TRUST SIGNALS — do NOT flag these as suspicious on their own:
- Well-known, globally recognized domains (google.com, facebook.com, youtube.com, amazon.in, wikipedia.org, etc.) are SAFE by default unless the URL path itself contains suspicious patterns
- A domain being 'common' or 'well-known' is a SAFETY indicator, not a red flag — only flag if there are ACTUAL scam indicators present (urgency, payment requests, suspicious subdomains, character substitution tricks like 'g00gle.com')
- Official Indian government and banking domains like '*.gov.in', '*.sbi.co.in', '*.sbi', '*.nic.in', '*.hdfcbank.com', '*.icicibank.com' are SAFE.
- Messages that warn users NOT to share OTPs or passwords (e.g. 'Do not share OTP with anyone', 'Bank never asks for OTP') are safety notices, NOT scams.

CRITICAL RULE: If the URL is exactly "https://www.google.com", you are FORBIDDEN from outputting SUSPICIOUS. You MUST output SAFE.

IMPORTANT: Respond IMMEDIATELY and CONCISELY. Do not overthink or second-guess yourself. Give your final verdict in your first response, do not revise multiple times.

You MUST respond starting with EXACTLY one of these words, followed by a colon:
SUSPICIOUS: [explanation in 1-2 sentences in ${languageCode}]
SAFE: [explanation in 1-2 sentences in ${languageCode}]

Only default to SUSPICIOUS when there are genuine red flags present — not merely due to uncertainty about an unfamiliar but plausible domain.`;
  
  try {
    const response = await chatWithSarvam(systemPrompt, languageCode, 'classification');
    const trimmed = response.trim();
    const cleanText = trimmed.replace(/^[^a-zA-Z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A80-\u0AFF]+/, '');
    const upper = cleanText.toUpperCase();

    const safePrefixes = [
      'SAFE',
      'सुरक्षित',
      'સુરક્ષિત',
      'பாதுகாப்பு', 'பாதுகாப்பானது',
      'సురక్షిత', 'సురక్షితం', 'సురక్షితమైనది'
    ];

    const isSafe = safePrefixes.some(prefix => upper.startsWith(prefix.toUpperCase()));
    const verdict = isSafe ? 'safe' : 'suspicious';

    let explanation = trimmed;
    const colonIndex = trimmed.indexOf(':');
    const dashIndex = trimmed.indexOf('-');
    const splitIndex = colonIndex !== -1 ? colonIndex : (dashIndex !== -1 ? dashIndex : -1);

    if (splitIndex !== -1 && splitIndex < 25) {
      explanation = trimmed.substring(splitIndex + 1).trim();
    } else {
      explanation = trimmed.replace(/^(\*\*|###)?\s*(SAFE|SUSPICIOUS|सुरक्षित|संदिग्ध|असुरक्षित|संशयास्पद|શંકાસ્પદ|பாதுகாப்பானது|சந்தேகத்திற்குரியது)\s*(\*\*|###)?\s*[:\-\s]*/i, '').trim();
    }

    if (!explanation) {
      explanation = trimmed;
    }
    
    return {
      verdict,
      explanation,
      raw: response
    };
  } catch (error) {
    console.log('[CLASSIFY] FAILED with error:', error.message);
    throw error;
  }
}

async function runTests() {
  const voiceTests = [
    {
      id: "Voice Test 1",
      lang: "hi-IN",
      text: "Mujhe ek call aaya jisme bol rahe the ki mai TRAI se hoon aur mera mobile number illegal activities ke liye use ho raha hai. Unhone kaha ki mera number kal band ho jayega jab tak mai apna Aadhaar verify nahi karta. Unhone mujhe ek WhatsApp call pe connect kiya jahan ek officer ne kaha ki mai unhe apni screen share karoon Anydesk app se. Kya mujhe yeh karna chahiye?"
    },
    {
      id: "Voice Test 2",
      lang: "hi-IN",
      text: "Maine OLX pe apna purana phone becha. Buyer ne kaha ki wo PhonePe se paisa bhejega. Usne mujhe ek QR code bheja aur kaha ki scan karo aur 5000 rupaye ka amount enter karo toh paisa aayega. Maine socha yeh receive karne ka tarika hai. Maine scan kiya aur PIN dala toh mere account se 5000 kat gaye. Kya hua mujhe?"
    },
    {
      id: "Voice Test 3",
      lang: "hi-IN",
      text: "Mujhe mere bete ke number se call aaya. Usne kaha ki usका accident ho gaya hai aur wo hospital mein hai. Usne kaha ki abhi phone kisi aur ke paas hai. Usne 50,000 rupaye ki emergency mein maंग ki kisi number pe bhejne ke liye. Awaaz bilkul mere bete jaise thi. Kya mujhe paisa bhejni chahiye?"
    },
    {
      id: "Voice Test 4",
      lang: "en-IN",
      text: "I received an email from support@amazon-helpdesk.co saying my Prime account is suspended due to suspicious activity. It had an Amazon logo and looked exactly like their real emails. They asked me to click a link and re-enter my card details to reactivate. The link was amazon-account-verify.net. I'm about to click it — is this safe?"
    }
  ];

  const messageTests = [
    {
      id: "Message 1 (HDFC)",
      lang: "en-IN",
      type: "message",
      text: "Hi, this is HDFC Bank AI assistant. We've detected unusual login from Mumbai. To secure your account, verify your card number and CVV at: hdfc-secure-verify.in/auth"
    },
    {
      id: "Message 2 (Job Offer)",
      lang: "en-IN",
      type: "message",
      text: "Congratulations! You've been shortlisted for a Data Entry role at Infosys BPO. Salary ₹35,000/month. Join our WhatsApp group for onboarding: https://chat.whatsapp.com/XYZ123. Registration fee of ₹500 required for ID verification."
    },
    {
      id: "Message 3 (CBI Digital Arrest)",
      lang: "en-IN",
      type: "message",
      text: "This is CBI Cyber Crime Division. Your Aadhaar number has been linked to illegal transactions worth ₹4.3 Lakhs. You are under Digital Arrest. Stay online and do not contact anyone or you will be physically arrested within 2 hours. Call back on 9876543210."
    },
    {
      id: "Message 4 (SBI SAFE - English)",
      lang: "en-IN",
      type: "message",
      text: "Dear Customer, your SBI account statement for June is ready. Log in at onlinesbi.sbi.co.in to view. Do not share OTP with anyone. — SBI Customer Care"
    },
    {
      id: "Message 4 (SBI SAFE - Hindi)",
      lang: "hi-IN",
      type: "message",
      text: "Dear Customer, your SBI account statement for June is ready. Log in at onlinesbi.sbi.co.in to view. Do not share OTP with anyone. — SBI Customer Care"
    },
    {
      id: "Message 5 (Crypto)",
      lang: "en-IN",
      type: "message",
      text: "Join our SEBI-registered crypto trading group. Members earned 340% returns last month. Minimum investment ₹10,000. Telegram: t.me/IndiaProTraders. Limited slots available today only."
    },
    {
      id: "Message 6 (QR Code)",
      lang: "en-IN",
      type: "message",
      text: "Hi, I saw your item on OLX. I want to buy it. I'm sending ₹15,000 via Google Pay. Please scan this QR code to receive the payment: [QR image attached]. Enter your UPI PIN to confirm receipt."
    },
    {
      id: "Message 7 (DHL)",
      lang: "en-IN",
      type: "message",
      text: "Your international parcel from USA is held at Delhi customs. Pay ₹2,340 customs clearance fee within 24 hours or parcel will be returned. Pay here: dhl-customs-india.com/pay"
    }
  ];

  console.log("=== RUNNING VOICE TESTS (CONVERSATION MODE) ===");
  for (const t of voiceTests) {
    console.log(`\n--- ${t.id} (${t.lang}) ---`);
    console.log(`Input: ${t.text}`);
    try {
      const start = Date.now();
      const response = await chatWithSarvam(t.text, t.lang, 'conversation');
      console.log(`Duration: ${Date.now() - start}ms`);
      console.log(`Output: ${response}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }

  console.log("\n=== RUNNING MESSAGE TESTS (CLASSIFICATION MODE) ===");
  for (const t of messageTests) {
    console.log(`\n--- ${t.id} (${t.lang}) ---`);
    console.log(`Input: ${t.text}`);
    try {
      const start = Date.now();
      const result = await classifyContent(t.text, t.lang, t.type);
      console.log(`Duration: ${Date.now() - start}ms`);
      console.log(`Verdict: ${result.verdict.toUpperCase()}`);
      console.log(`Raw output: ${result.raw}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

runTests().catch(console.error);
