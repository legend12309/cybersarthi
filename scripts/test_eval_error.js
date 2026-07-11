const axios = require('axios');
require('dotenv').config();

async function testEval() {
  const transcript = "Scammer: Hello, am I speaking to the owner of connection number 4521? This is Amit from the State Electricity Board. Your bill of ₹3,240 is overdue and we are dispatching a team to disconnect your power tonight.\nUser: Hello?\nScammer: Please pay immediately to avoid disconnection.\nUser: cut the power then";
  
  const systemPrompt = `Review this conversation where a user was being scammed (Scenario: electricity_bill). Evaluate: did they share sensitive info, did they show good instincts (asking for verification, refusing links, staying calm), or did they fall for the scam. Give brief, encouraging feedback in 2-3 sentences, plus a clear PASS or NEEDS_PRACTICE verdict. You MUST start your response with the exact word "PASS:" or "NEEDS_PRACTICE:" followed by your feedback in English.`;

  try {
    const response = await axios.post(
      `https://api.sarvam.ai/v1/chat/completions`,
      {
        model: 'sarvam-105b',
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
      },
      { 
        headers: {
          'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );
    console.log('Eval Success:', response.data.choices[0].message.content);
  } catch (error) {
    if (error.response) {
      console.log('Eval Error Data:', error.response.data);
    } else {
      console.log('Eval Network Error:', error.message);
    }
  }
}

testEval();
