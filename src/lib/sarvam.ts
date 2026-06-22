import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

export async function speechToText(audioUri: string, languageCode: string): Promise<string> {
  console.log('API Key length:', API_KEY?.length);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const formData = new FormData();
    formData.append('model', 'saaras:v3');
    formData.append('mode', 'transcribe');
    formData.append('language_code', languageCode);
    formData.append('file', {
      uri: audioUri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as any);

    const response = await fetch(`${API_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
      },
      body: formData,
      signal: controller.signal as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.transcript || data.text || '';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    console.error('STT Error Details:', error);
    throw new Error('err_stt_failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

const LANG_MAP: Record<string, string> = {
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'gu-IN': 'Gujarati',
  'en-IN': 'English'
};

function isContaminated(text: string): boolean {
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

function isIncomplete(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  const lastChar = trimmed[trimmed.length - 1];
  const validEndings = ['.', '?', '!', '।', '"', ')'];
  return !validEndings.includes(lastChar);
}

function truncateToLastSentence(text: string): string {
  const matches = text.match(/[^.!?।]+[.!?।]/g);
  return matches ? matches.join(' ').trim() : text;
}

async function callSarvamChatAPI(transcript: string, languageCode: string, mode: 'classification' | 'conversation' = 'conversation'): Promise<any> {
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

export async function chatWithSarvam(prompt: string, languageCode: string, mode: 'classification' | 'conversation' = 'conversation'): Promise<string> {
  const maxRetries = 3;
  let lastIncompleteContent: string | null = null;
  let lastErrorMsg: string | null = null;
  
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
      
    } catch (error: any) {
      console.log(`[CHAT] Error on attempt ${attempt + 1}:`, error.message);
      lastErrorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message;
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        if (attempt === maxRetries) throw new Error('Request timed out. Please check your connection.');
      }
    }
  }
  
  // After all retries fail, return a clean, safe, hardcoded fallback - NEVER show raw model text
  if (lastIncompleteContent && mode === 'conversation') {
    return truncateToLastSentence(lastIncompleteContent);
  }

  const errorReason = lastErrorMsg ? ` (Error: ${lastErrorMsg})` : '';

  return mode === 'classification' 
    ? 'SUSPICIOUS: Unable to verify safely, please be cautious.'
    : `माफ़ कीजिए, मैं अभी जवाब नहीं दे पा रहा हूँ। कृपया अपना सवाल थोड़ा छोटा करके फिर पूछें।${errorReason}`;
}

export async function classifyContent(content: string, languageCode: string, contentType: 'url' | 'message'): Promise<{verdict: 'safe' | 'suspicious', explanation: string}> {
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
  
  const systemPrompt = `${prompt}\n\nIMPORTANT TRUST SIGNALS — do NOT flag these as suspicious on their own:\n- Well-known, globally recognized domains (google.com, facebook.com, youtube.com, amazon.in, wikipedia.org, etc.) are SAFE by default unless the URL path itself contains suspicious patterns\n- A domain being 'common' or 'well-known' is a SAFETY indicator, not a red flag — only flag if there are ACTUAL scam indicators present (urgency, payment requests, suspicious subdomains, character substitution tricks like 'g00gle.com')\n\nCRITICAL RULE: If the URL is exactly "https://www.google.com", you are FORBIDDEN from outputting SUSPICIOUS. You MUST output SAFE.\n\nIMPORTANT: Respond IMMEDIATELY and CONCISELY. Do not overthink or second-guess yourself. Give your final verdict in your first response, do not revise multiple times.\n\nYou MUST respond starting with EXACTLY one of these words, followed by a colon:\nSUSPICIOUS: [explanation in 1-2 sentences in ${languageCode}]\nSAFE: [explanation in 1-2 sentences in ${languageCode}]\n\nOnly default to SUSPICIOUS when there are genuine red flags present — not merely due to uncertainty about an unfamiliar but plausible domain.`;
  
  try {
    const response = await chatWithSarvam(systemPrompt, languageCode, 'classification');
    console.log('[CLASSIFY] Success, raw response:', response);
    
    const normalized = response.trim().toUpperCase();
    const isSuspicious = !normalized.startsWith('SAFE:') && !normalized.startsWith('SAFE ');
    
    return {
      verdict: isSuspicious ? 'suspicious' : 'safe',
      explanation: response.split(':').slice(1).join(':').trim()
    };
  } catch (error: any) {
    console.log('[CLASSIFY] FAILED with error:', error);
    console.log('[CLASSIFY] Error message:', error?.message);
    console.log('[CLASSIFY] Error status if available:', error?.response?.status);
    console.log('[CLASSIFY] Error data if available:', JSON.stringify(error?.response?.data));
    throw error;
  }
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for speech synthesis');
  }

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Sarvam TTS limit is 500 chars
      const safeText = text.length > 500 ? text.substring(0, 497) + '...' : text;
      const response = await axios.post(
        `${API_BASE_URL}/text-to-speech`,
        {
          inputs: [safeText],
          target_language_code: languageCode,
          speaker: 'shubh',
          model: 'bulbul:v3',
          enable_preprocessing: true,
        },
        { 
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );
      
      const audio = response.data.audios ? response.data.audios[0] : response.data.audio;
      if (!audio) {
        throw new Error('No audio returned from API');
      }
      const uri = FileSystem.cacheDirectory + 'sarvam_tts_' + Date.now() + '.wav';
      await FileSystem.writeAsStringAsync(uri, audio, {
        encoding: 'base64' as any,
      });
      return uri;
    } catch (error: any) {
      console.log('[TTS] Network error details:', error.message, error.code);
      if (attempt === maxRetries) {
        throw new Error('err_tts_failed');
      }
      console.log(`[TTS] Retrying attempt ${attempt + 1}...`);
    }
  }
  throw new Error('err_tts_failed');
}
