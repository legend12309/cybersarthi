const axios = require('axios');
require('dotenv').config();

async function testRoleplay() {
  try {
    const response = await axios.post(
      `https://api.sarvam.ai/v1/chat/completions`,
      {
        model: 'sarvam-105b',
        temperature: 0.6,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: 'You are a scammer pretending to be from the electricity board. Threaten to cut the power.' },
          { role: 'user', content: 'cut the power then' }
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
    console.log('Success Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('Error Data:', error.response.data);
      console.log('Error Status:', error.response.status);
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

testRoleplay();
