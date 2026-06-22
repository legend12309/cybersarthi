import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'D:/CyberSaathi/.env' });

const API_BASE_URL = 'https://api.sarvam.ai';

const LANG_MAP = {
  'hi-IN': 'Hindi',
  'en-IN': 'English',
};

function getHeaders() {
  return { 'api-subscription-key': process.env.EXPO_PUBLIC_SARVAM_API_KEY };
}

async function callSarvamChatAPI(transcript, languageCode, mode = 'conversation') {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = mode === 'classification'
    ? `You must respond ONLY in ${languageName}. Do not respond in English unless the target language is English.`
    : `CRITICAL INSTRUCTION: You must output ONLY your final answer. Never write 'Attempt', 'Draft', 'Version', or show your thinking process in your response. Never use markdown formatting like asterisks. Never ask the user to shorten or rephrase their question. Always attempt to answer directly, no matter how long or detailed the question is. Summarize your answer concisely, but never refuse to engage with a long question. Write exactly one clean sentence or two, as if speaking directly to a friend, with no labels or meta-commentary whatsoever.\nRespond in ${languageName}.`;

  const response = await axios.post(
    `${API_BASE_URL}/v1/chat/completions`,
    {
      model: 'sarvam-30b',
      temperature: mode === 'classification' ? 0 : 0.4,
      max_tokens: mode === 'classification' ? 1500 : 800,
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

async function chatWithSarvam(prompt, languageCode, mode = 'conversation') {
  const maxRetries = 3;
  let lastIncompleteContent = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callSarvamChatAPI(prompt, languageCode, mode);
      const content = response?.data?.choices?.[0]?.message?.content;
      const finishReason = response?.data?.choices?.[0]?.finish_reason;
      
      if (content && content.trim().length > 0) {
        const text = content.trim();
        const contaminated = isContaminated(text);
        const incomplete = isIncomplete(text);
        
        console.log('[CHAT] Final answer finish_reason:', finishReason);
        console.log('[CHAT] Final answer length:', text.length);
        console.log('[CHAT] Final answer last 20 chars:', text.slice(-20));

        if (!contaminated && !incomplete) {
          return text;
        }

        if (!contaminated && incomplete) {
          lastIncompleteContent = text;
          console.log('[CHAT] Rejected - incomplete ending:', incomplete, 'finish_reason:', finishReason);
        } else {
          console.log(`[CHAT] Attempt ${attempt + 1} rejected - content: '${text}', contaminated: ${contaminated}`);
        }
      }
      
    } catch (error) {
      console.log(`[CHAT] Error on attempt ${attempt + 1}:`, error.message, error.response?.data);
    }
  }
  
  if (lastIncompleteContent && mode === 'conversation') {
    return truncateToLastSentence(lastIncompleteContent);
  }

  return mode === 'classification' 
    ? 'SUSPICIOUS: Unable to verify safely, please be cautious.'
    : 'माफ़ कीजिए, मैं अभी जवाब नहीं दे पा रहा हूँ। कृपया अपना सवाल थोड़ा छोटा करके फिर पूछें।';
}

chatWithSarvam("Hello, I've got a call from my college and the person asking to pay fees on this particular QR code or a bank statement given to me. What should I do?", "hi-IN", "conversation").then(console.log).catch(console.error);
