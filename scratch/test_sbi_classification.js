const axios = require('axios');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

async function run() {
  const languageCode = 'en-IN';
  const content = 'Dear Customer, your SBI account statement for June is ready. Log in at onlinesbi.sbi.co.in to view. Do not share OTP with anyone. — SBI Customer Care';
  
  const prompt = `You are a strict cybersecurity classifier trained to detect both traditional and modern scam patterns common in India:
TRADITIONAL PATTERNS: lottery/prize scams, fake bank calls asking for OTP/PIN, KYC update threats, electricity disconnection threats, fake police/legal threats, advance fee fraud.
MODERN PATTERNS: AI voice cloning scams (fake voice calls from 'family members'), deepfake video call scams, fake investment/crypto schemes promising high returns, fake delivery/customs fee scams via WhatsApp, QR code payment redirection scams, fake job offers via Telegram/WhatsApp groups, romance scams via dating apps, fake loan apps with predatory terms, screen-sharing remote access scams (AnyDesk/TeamViewer), SIM swap social engineering attempts, fake customer support numbers found via search ads.

Analyze the given content against BOTH categories. Look for: urgency tactics, unverified contact requests, requests for OTP/PIN/personal info, suspicious links/shorteners, too-good-to-be-true offers, emotional manipulation, requests to install remote-access apps, or impersonation of trusted entities (banks, government, family, delivery services, customer support).
Message: "${content}"`;

  const systemPrompt = `${prompt}

IMPORTANT TRUST SIGNALS — do NOT flag these as suspicious on their own:
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
    const res = await axios.post('https://api.sarvam.ai/v1/chat/completions', {
      model: 'sarvam-30b',
      temperature: 0,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: `You must respond ONLY in English. Do not respond in Hindi unless the target language is Hindi.` },
        { role: 'user', content: systemPrompt }
      ]
    }, {
      headers: {
        'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('FULL RESPONSE:', JSON.stringify(res.data));
  } catch (err) {
    console.error('ERROR:', err.message, err.response?.data);
  }
}
run();
