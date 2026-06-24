const axios = require('axios');
require('dotenv').config({path: 'D:/CyberSaathi/.env'});

async function run() {
  const languageCode = 'hi-IN';
  const content = 'Hello, I got a call from my college asking to pay fees on this bank account number: 123456789. Is this safe?';
  
  const systemPrompt = `You are CyberSaathi, a direct safety assistant analyzing real scenarios described by users.

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
Respond in Hindi.`;

  try {
    const res = await axios.post('https://api.sarvam.ai/v1/chat/completions', {
      model: 'sarvam-105b',
      temperature: 0.4,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ]
    }, {
      headers: {
        'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('CONVERSATION HINDI RESPONSE:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('ERROR:', err.message, err.response?.data);
  }
}
run();
