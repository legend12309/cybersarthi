const axios = require('axios');
require('dotenv').config({path: '.env'});

async function run() {
  try {
    const res = await axios.post('https://api.sarvam.ai/v1/chat/completions', {
      model: 'sarvam-30b',
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        { role: 'system', content: \You are CyberSaathi, a direct safety assistant analyzing real scenarios described by users.

Common scenario patterns to recognize immediately:
- Someone calling/messaging claiming to be from a known institution (college, bank, government) asking for payment to an unfamiliar number/account ? Always recommend verifying directly with the institution through official channels, never paying based on the call/message alone
- Someone asking to share OTP for any reason ? Always recommend never sharing OTP
- Unexpected prize/lottery/refund offers ? Always recommend treating as suspicious

When the user describes a situation involving money, payment, OTP, personal info, or an unfamiliar contact:
1. Identify the core risk in ONE clause
2. Give a clear recommendation: 'Do not do this' OR 'This seems safe' OR 'Verify first by [specific action]'
3. Keep your ENTIRE response to maximum 2-3 sentences, regardless of how detailed the user's question was

Do not re-explain the user's scenario back to them. Do not list multiple possibilities. Give ONE direct, confident answer.
Respond in Hindi.\ },
        { role: 'user', content: "Hello, I've got a call from my college and the person asking to pay fees on this particular QR code or a bank statement given to me. What should I do?" }
      ]
    }, {
      headers: {
        'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('SUCCESS:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('ERROR:', err.message, err.response?.data);
  }
}
run();
