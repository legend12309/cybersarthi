const axios = require('axios');
require('dotenv').config({path: '.env'});

async function run() {
  const languageCode = 'en-IN';
  const content = 'http://2001:0db8:85a3:0000:0000:8a2e:0370:7334/secure-login'; // IPv6
  
  const prompt = \You are a strict cybersecurity classifier analyzing a URL for scams.
When you receive a URL:
1. Identify if it matches traditional scams (lottery, fake bank) or modern scams (AI voice, investment, remote access)
2. Decide if it is SAFE or SUSPICIOUS
URL to analyze: "\"\;

  const systemPrompt = \\\n\nIMPORTANT TRUST SIGNALS:
- Well-known domains (google.com, amazon.in) are SAFE by default unless the URL path contains suspicious patterns.
- Only flag if there are ACTUAL scam indicators present.
CRITICAL RULE: If the URL is exactly "https://www.google.com", you MUST output SAFE.

CRITICAL INSTRUCTION: You must output ONLY your final answer. Do not show your thinking process or write drafts.
Keep your ENTIRE response to maximum 1-2 sentences.

You MUST respond starting with EXACTLY one of these words, followed by a colon:
SUSPICIOUS: [explanation in 1-2 sentences in \]
SAFE: [explanation in 1-2 sentences in \]\;

  try {
    const res = await axios.post('https://api.sarvam.ai/v1/chat/completions', {
      model: 'sarvam-30b',
      temperature: 0.1,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: \You must respond ONLY in English. Do not respond in English unless the target language is English.\ },
        { role: 'user', content: systemPrompt }
      ]
    }, {
      headers: {
        'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('SUCCESS:', res.data.choices[0].message.content);
    console.log('FINISH REASON:', res.data.choices[0].finish_reason);
  } catch (err) {
    console.error('ERROR:', err.message, err.response?.data);
  }
}
run();
