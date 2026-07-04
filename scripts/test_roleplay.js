const axios = require('axios');
require('dotenv').config();
const { scammerPersonas } = require('../src/data/scammerPersonas');

const API_BASE_URL = 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY;

const headers = {
  'api-subscription-key': API_KEY,
  'Content-Type': 'application/json'
};

async function testRoleplay() {
  console.log('--- STARTING LIVE ROLEPLAY TEST (electricity_bill) ---');
  
  const languageName = 'English';
  // Read the persona directly and replace variable
  let systemPrompt = scammerPersonas['electricity_bill'].replace('${languageName}', languageName);

  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Hello?' }
  ];

  try {
    // 1. Scammer first message
    let res = await axios.post(`${API_BASE_URL}/v1/chat/completions`, {
      model: 'sarvam-105b', temperature: 0.6, max_tokens: 4096, messages
    }, { headers, timeout: 35000 });
    
    let scammerMsg = res.data.choices[0].message.content;
    if (!scammerMsg) {
      scammerMsg = res.data.choices[0].message.reasoning_content; 
    }
    console.log(`Scammer: ${scammerMsg?.trim()}`);
    messages.push({ role: 'assistant', content: scammerMsg || '' });

    // 2. User response 1
    const userMsg1 = "What is your name and employee ID?";
    console.log(`User: ${userMsg1}`);
    messages.push({ role: 'user', content: userMsg1 });

    // 3. Scammer second message
    res = await axios.post(`${API_BASE_URL}/v1/chat/completions`, {
      model: 'sarvam-105b', temperature: 0.6, max_tokens: 4096, messages
    }, { headers, timeout: 35000 });
    
    scammerMsg = res.data.choices[0].message.content;
    if (!scammerMsg) scammerMsg = res.data.choices[0].message.reasoning_content;
    console.log(`Scammer: ${scammerMsg?.trim()}`);
    messages.push({ role: 'assistant', content: scammerMsg || '' });

    // 4. User response 2 (reveal)
    const userMsg2 = "I don't believe this, I'm hanging up and calling the official number";
    console.log(`User: ${userMsg2}`);
    messages.push({ role: 'user', content: userMsg2 });

    // 5. Scammer third message
    res = await axios.post(`${API_BASE_URL}/v1/chat/completions`, {
      model: 'sarvam-105b', temperature: 0.6, max_tokens: 4096, messages
    }, { headers, timeout: 35000 });
    
    scammerMsg = res.data.choices[0].message.content;
    if (!scammerMsg) scammerMsg = res.data.choices[0].message.reasoning_content;
    console.log(`Scammer: ${scammerMsg?.trim()}`);
    messages.push({ role: 'assistant', content: scammerMsg || '' });

  } catch (err) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

testRoleplay();
