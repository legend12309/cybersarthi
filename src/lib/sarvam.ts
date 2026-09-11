import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { unzipSync } from 'fflate';
import { checkSafeBrowsing } from './safeBrowsing';
import { getScriptedScammerResponse, evaluateRoleplayHeuristic } from '../data/scammerScripts';

const API_BASE_URL = process.env.EXPO_PUBLIC_SARVAM_API_URL || 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

export const getSarvamLanguageCode = (appLanguage: string): string => {
  if (!appLanguage) return 'hi-IN';
  if (appLanguage.includes('-')) return appLanguage;
  const map: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    bn: 'bn-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    or: 'or-IN',
  };
  return map[appLanguage] || 'hi-IN';
};

export async function speechToText(audioUri: string, languageCode: string): Promise<string> {
  try {
    const uriLower = audioUri.toLowerCase();
    let ext = 'm4a';
    let mimeType = 'audio/x-m4a';

    if (uriLower.endsWith('.wav')) {
      ext = 'wav';
      mimeType = 'audio/wav';
    } else if (uriLower.endsWith('.mp3')) {
      ext = 'mp3';
      mimeType = 'audio/mpeg';
    } else if (uriLower.endsWith('.aac')) {
      ext = 'aac';
      mimeType = 'audio/aac';
    } else if (uriLower.endsWith('.mp4') || uriLower.endsWith('.m4a')) {
      ext = 'm4a';
      mimeType = 'audio/x-m4a';
    }

    const sarvamLang = getSarvamLanguageCode(languageCode);

    // Use expo-file-system legacy uploadAsync which performs native multipart uploads
    // and avoids React Native Hermes 'Unsupported FormDataPart implementation'
    const result = await FileSystem.uploadAsync(`${API_BASE_URL}/speech-to-text`, audioUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      headers: {
        'api-subscription-key': API_KEY,
      },
      parameters: {
        model: 'saaras:v3',
        mode: 'transcribe',
        language_code: sarvamLang,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      console.warn(`[STT] API returned HTTP ${result.status}:`, result.body);
      throw new Error(`API Error ${result.status}: ${result.body}`);
    }

    const data = JSON.parse(result.body || '{}');
    return data.transcript || data.text || '';
  } catch (error: any) {
    console.warn('[STT] Speech to text failed:', error?.message || error);
    throw error;
  }
}

const LANG_MAP: Record<string, string> = {
  'hi-IN': 'Hindi. आपको केवल हिंदी (Hindi) में ही उत्तर देना अनिवार्य है।',
  'mr-IN': 'Marathi. तुम्हाला फक्त मराठी (Marathi) मध्येच उत्तर देणे बंधनकारक आहे।',
  'bn-IN': 'Bengali. আপনাকে কেবল বাংলা (Bengali) ভাষাতেই উত্তর দিতে হবে।',
  'ta-IN': 'Tamil. நீங்கள் தமிழ் (Tamil) மொழியில் மட்டுமே பதிலளிக்க வேண்டும்.',
  'te-IN': 'Telugu. మీరు తెలుగు (Telugu) లో మాత్రమే సమాధానం చెప్పాలి.',
  'gu-IN': 'Gujarati. તમારે ફક્ત ગુજરાતી (Gujarati) માં જ જવાબ આપવો ફરજિયાત છે.',
  'en-IN': 'English'
};

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`]+|www\.[^\s<>"'{}|\\^`]+|[a-zA-Z0-9.-]+\.(?:com|in|org|net|co|top|xyz|biz|info|site|online|club|app|live|vip|ru|cn)[^\s<>"'{}|\\^`]*)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches.map(u => u.trim().replace(/[.,;!?)]+$/, ''))));
}

function isContaminated(text: string): boolean {
  const contaminationMarkers = [
    /attempt\s*\d/i,
    /draft\s*\d/i,
    /version\s*\d/i,
    /let me (try|rewrite|reconsider)/i,
    /more conversational/i,
    /simpler language/i,
  ];
  return contaminationMarkers.some(pattern => pattern.test(text));
}

function isIncomplete(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  const lastChar = trimmed[trimmed.length - 1];
  const validEndings = ['.', '?', '!', '।', '"', ')', ':', '”', '\'', '’', '`', '*', '-'];
  return !validEndings.includes(lastChar);
}

function truncateToLastSentence(text: string): string {
  const matches = text.match(/[^.!?।]+[.!?।]/g);
  return matches ? matches.join(' ').trim() : text;
}

async function callSarvamChatAPI(transcript: string, languageCode: string, mode: 'classification' | 'conversation' = 'conversation'): Promise<any> {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = mode === 'classification'
    ? `You must respond ONLY in ${languageName}. However, you MUST start your response with the English words "SAFE:" or "SUSPICIOUS:" followed by your explanation in ${languageName}. Do not translate the "SAFE:" or "SUSPICIOUS:" labels.`
    : `You are CyberSaathi, a friendly and intelligent cybersecurity assistant.
Answer the user's specific question directly, accurately, and reassuringly.
Rules:
- Directly address what the user asked about (e.g. explain the concept, evaluate the scenario, or answer greetings naturally).
- Do NOT repeat generic disclaimers or canned advice.
- Mention reporting to 1930 / cybercrime.gov.in ONLY if the user explicitly says they already lost money or have been defrauded.
- If it is a suspicious message or call, advise them to ignore, block, or check via official apps without repeating boilerplate.
IMPORTANT VOICE/SPOKEN RULES:
- Keep your ENTIRE reply strictly between 2 to 3 natural spoken sentences (under 350 characters) so it speaks cleanly via audio.
- Do NOT use bullet points, numbered lists, asterisks, or markdown formatting.
- Speak in a natural, polite, and reassuring conversational tone.
Respond strictly in ${languageName}.`;

    const response = await axios.post(
    `${API_BASE_URL}/v1/chat/completions`,
    {
      model: 'sarvam-105b-conversations',
      temperature: mode === 'classification' ? 0.1 : 0.35,
      max_tokens: mode === 'classification' ? 300 : 260,
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
      timeout: 10000
    }
  );
  return response;
}

export async function chatWithSarvam(prompt: string, languageCode: string, mode: 'classification' | 'conversation' = 'conversation'): Promise<string> {
  const maxRetries = 1;
  let lastIncompleteContent: string | null = null;
  let lastErrorMsg: string | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callSarvamChatAPI(prompt, languageCode, mode);
      const choice = response?.data?.choices?.[0];
      const content = choice?.message?.content;
      
      if (content && content.trim().length > 0) {
        const text = content.trim();
        if (mode === 'classification') {
          return text;
        }

        const contaminated = isContaminated(text);
        if (!contaminated) {
          return text;
        }
      }

      // If content was empty but reasoning_content exists, extract final Indic response
      const reasoning = choice?.message?.reasoning_content;
      if (reasoning && typeof reasoning === 'string' && mode === 'conversation') {
        const lines = reasoning.split('\n').map(l => l.trim()).filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].replace(/^["'«»]+|["'«»]+$/g, '').trim();
          if (line.length > 20 && !line.startsWith('Wait') && !line.startsWith('Let') && !line.startsWith('The user') && !line.startsWith('Check') && !line.startsWith('Key')) {
            return line;
          }
        }
      }
      
    } catch (error: any) {
      console.warn(`[CHAT] Attempt ${attempt + 1} issue:`, error.message);
      lastErrorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message;
      const status = error.response?.status;
      if (status === 429) {
        throw new Error('API_LIMIT_REACHED');
      }
    }
  }
  
  // If model produced a partial answer, salvage it cleanly
  if (lastIncompleteContent && mode === 'conversation') {
    const salvaged = truncateToLastSentence(lastIncompleteContent);
    if (salvaged && salvaged.trim().length > 10) {
      return salvaged;
    }
  }

  const fallbackByLang: Record<string, string> = {
    'hi-IN': 'माफ़ कीजिए, सर्वर से संपर्क नहीं हो सका। कृपया अपना सवाल दोबारा पूछें या इंटरनेट कनेक्शन जाँचें।',
    'mr-IN': 'माफ करा, सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.',
    'bn-IN': 'দুঃখিত, সার্ভারের সাথে যোগাযোগ করা যায়নি। দয়া করে আবার চেষ্টা করুন।',
    'ta-IN': 'மன்னிக்கவும், சேவையகத்துடன் தொடர்பு கொள்ள முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
    'te-IN': 'క్షమించండి, సర్వర్‌తో కనెక్ట్ అవ్వడం సాధ్యం కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    'gu-IN': 'માફ કરશો, સર્વર સાથે સંપર્ક થઈ શક્યો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
    'en-IN': 'I apologize, could not connect to the assistant. Please try asking again.',
  };

  const cleanFallback = fallbackByLang[languageCode] || fallbackByLang['en-IN'];

  return mode === 'classification' 
    ? 'SUSPICIOUS: Unable to verify safely, please be cautious.'
    : cleanFallback;
}


export async function classifyContent(content: string, languageCode: string, contentType: 'url' | 'message'): Promise<{verdict: 'safe' | 'suspicious', explanation: string, source?: string}> {
  const langNames: Record<string, string> = {
    'hi-IN': 'Hindi',
    'mr-IN': 'Marathi',
    'bn-IN': 'Bengali',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'gu-IN': 'Gujarati',
    'en-IN': 'English',
  };
  const targetLang = langNames[languageCode] || 'English';

  const prompt = contentType === 'url' 
    ? `You are a strict cybersecurity classifier trained to detect both traditional and modern scam patterns common in India:
TRADITIONAL PATTERNS: lottery/prize scams, fake bank calls asking for OTP/PIN, KYC update threats, electricity disconnection threats, fake police/legal threats, advance fee fraud.
MODERN PATTERNS: Pig butchering scams (unexpected "wrong number" texts followed by excessive politeness, mentions of foreign locations/businesses, and requests to move to WhatsApp/Telegram), AI voice cloning scams (fake voice calls from 'family members'), deepfake video call scams, fake investment/crypto schemes promising high returns, fake delivery/customs fee scams via WhatsApp, QR code payment redirection scams, fake job offers via Telegram/WhatsApp groups, romance scams via dating apps, fake loan apps with predatory terms, screen-sharing remote access scams (AnyDesk/TeamViewer), SIM swap social engineering attempts, fake customer support numbers found via search ads.

Analyze the given content against BOTH categories. Look for: urgency tactics, unexpected "wrong number" friendliness, unverified contact requests, requests for OTP/PIN/personal info, suspicious links/shorteners, too-good-to-be-true offers, emotional manipulation, requests to install remote-access apps, or impersonation of trusted entities (banks, government, family, delivery services, customer support).
URL: "${content}"`
    : `You are a strict cybersecurity classifier trained to detect both traditional and modern scam patterns common in India:
TRADITIONAL PATTERNS: lottery/prize scams, fake bank calls asking for OTP/PIN, KYC update threats, electricity disconnection threats, fake police/legal threats, advance fee fraud.
MODERN PATTERNS: Pig butchering scams (unexpected "wrong number" texts followed by excessive politeness, mentions of foreign locations/businesses, and requests to move to WhatsApp/Telegram), AI voice cloning scams (fake voice calls from 'family members'), deepfake video call scams, fake investment/crypto schemes promising high returns, fake delivery/customs fee scams via WhatsApp, QR code payment redirection scams, fake job offers via Telegram/WhatsApp groups, romance scams via dating apps, fake loan apps with predatory terms, screen-sharing remote access scams (AnyDesk/TeamViewer), SIM swap social engineering attempts, fake customer support numbers found via search ads.

Analyze the given content against BOTH categories. Look for: urgency tactics, unexpected "wrong number" friendliness, unverified contact requests, requests for OTP/PIN/personal info, suspicious links/shorteners, too-good-to-be-true offers, emotional manipulation, requests to install remote-access apps, or impersonation of trusted entities (banks, government, family, delivery services, customer support).
Message: "${content}"`;
  
  const systemPrompt = `${prompt}\n\nIMPORTANT TRUST SIGNALS — do NOT flag these as suspicious on their own:\n- Well-known, globally recognized domains (google.com, facebook.com, youtube.com, amazon.in, wikipedia.org, etc.) are SAFE by default unless the URL path itself contains suspicious patterns\n- A domain being 'common' or 'well-known' is a SAFETY indicator, not a red flag — only flag if there are ACTUAL scam indicators present (urgency, payment requests, suspicious subdomains, character substitution tricks like 'g00gle.com')\n- Official Indian government and banking domains like '*.gov.in', '*.sbi.co.in', '*.sbi', '*.nic.in', '*.hdfcbank.com', '*.icicibank.com' are SAFE.\n- Messages that warn users NOT to share OTPs or passwords (e.g. 'Do not share OTP with anyone', 'Bank never asks for OTP') are safety notices, NOT scams.\n\nCRITICAL RULE: If the URL is exactly "https://www.google.com", you are FORBIDDEN from outputting SUSPICIOUS. You MUST output SAFE.\n\nIMPORTANT: Respond IMMEDIATELY and CONCISELY. Do not overthink or second-guess yourself. Give your final verdict in your first response, do not revise multiple times.\n\nYou MUST respond starting with EXACTLY one of these words, followed by a colon:\nSUSPICIOUS: [explanation in 1-2 sentences in ${targetLang}]\nSAFE: [explanation in 1-2 sentences in ${targetLang}]\n\nOnly default to SUSPICIOUS when there are genuine red flags present — not merely due to uncertainty about an unfamiliar but plausible domain.`;
  const fetchSarvamClassification = async () => {
    try {
      const response = await chatWithSarvam(systemPrompt, languageCode, 'classification');
      
      const trimmed = response.trim();
      const cleanText = trimmed.replace(/^[^a-zA-Z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A80-\u0AFF]+/, '');
      const upper = cleanText.toUpperCase();

      const safePrefixes = [
        'SAFE',
        'सुरक्षित',
        'સુરક્ષિત',
        'নিরাপদ',
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
      
      return { verdict, explanation, source: 'sarvam' };
    } catch (error: any) {
      throw error;
    }
  };

  if (contentType === 'url') {
    const [sarvamResult, safeBrowsingResult] = await Promise.all([
      fetchSarvamClassification(),
      checkSafeBrowsing(content),
    ]);

    if (safeBrowsingResult.isThreat) {
      return {
        verdict: 'suspicious',
        explanation: `Google Safe Browsing has flagged this link as a known ${safeBrowsingResult.threatType?.toLowerCase().replace('_', ' ')} threat. Do not visit this link.`,
        source: 'google_safe_browsing'
      };
    }

    return sarvamResult as {verdict: 'safe' | 'suspicious', explanation: string, source: string};
  }

  // If contentType === 'message', extract embedded URLs and check with Safe Browsing too
  const embeddedUrls = extractUrls(content);
  if (embeddedUrls.length > 0) {
    const [sarvamResult, safeBrowsingResults] = await Promise.all([
      fetchSarvamClassification(),
      Promise.all(embeddedUrls.map(u => checkSafeBrowsing(u))),
    ]);

    const threatIndex = safeBrowsingResults.findIndex(r => r.isThreat);
    if (threatIndex !== -1) {
      const threat = safeBrowsingResults[threatIndex];
      const threatUrl = embeddedUrls[threatIndex];
      return {
        verdict: 'suspicious',
        explanation: `Google Safe Browsing confirmed a malicious link in this message (${threatUrl} - ${threat.threatType?.toLowerCase().replace('_', ' ')}). Do not open any links or send money.`,
        source: 'google_safe_browsing'
      };
    }

    return sarvamResult as {verdict: 'safe' | 'suspicious', explanation: string, source: string};
  }

  return (await fetchSarvamClassification()) as {verdict: 'safe' | 'suspicious', explanation: string, source: string};
}

export async function cleanupTTSCache() {
  try {
    const dirUri = FileSystem.cacheDirectory;
    if (!dirUri) return;
    const cleanDir = dirUri.endsWith('/') ? dirUri : `${dirUri}/`;
    const files = await FileSystem.readDirectoryAsync(cleanDir);
    const ttsFiles = files.filter(f => f.startsWith('sarvam_tts_') && f.endsWith('.wav'));
    
    // Sort by timestamp (newest first)
    ttsFiles.sort((a, b) => {
      const tsA = parseInt(a.replace('sarvam_tts_', '').replace('.wav', ''), 10) || 0;
      const tsB = parseInt(b.replace('sarvam_tts_', '').replace('.wav', ''), 10) || 0;
      return tsB - tsA;
    });

    // Keep the most recent 5, delete the rest
    const filesToDelete = ttsFiles.slice(5);
    for (const file of filesToDelete) {
      await FileSystem.deleteAsync(cleanDir + file, { idempotent: true });
    }
  } catch (err) {
    // Fail silently on cleanup
  }
}

// Helper to clean up text before sending to TTS
function sanitizeForTTS(text: string): string {
  if (!text) return '';

  // 1. Strip bracketed stage directions or parenthetical asides
  // E.g. "(रोते हुए घबराई आवाज में) पापा! मेरा एक्सीडेंट हो गया..." -> "पापा! मेरा एक्सीडेंट हो गया..."
  const withoutBrackets = text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/（[^）]*）/g, ' ')
    .replace(/【[^】]*】/g, ' ');

  // 2. If removing bracket contents emptied the entire text (e.g. the entire sentence was in parentheses),
  // fallback to removing only the bracket punctuation marks themselves so the spoken dialogue is preserved!
  let clean = withoutBrackets.trim().length > 0
    ? withoutBrackets
    : text.replace(/[{}\[\]()（）【】]/g, ' ');

  clean = clean.replace(/[*_~`#]+/g, ''); // Remove markdown formatting
  clean = clean.replace(/https?:\/\/\S+/gi, ' link '); // Replace URLs with 'link'
  clean = clean.replace(/www\.\S+/gi, ' link ');
  clean = clean.replace(/₹/g, ' rupees '); // Replace ₹ symbol
  clean = clean.replace(/(\d+),(\d+)/g, '$1$2'); // Remove commas in numbers (e.g. 3,240 -> 3240)
  clean = clean.replace(/[-–—]/g, ' '); // Replace hyphens and dashes with spaces
  clean = clean.replace(/\s+/g, ' '); // Collapse repeated whitespace
  return clean.trim();
}


// Helper to truncate text at a clean sentence boundary before sending to TTS
function truncateToSafeTTSLength(text: string, maxLength: number = 470): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('।'),
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  if (lastPunctuation > 120) {
    return truncated.substring(0, lastPunctuation + 1).trim();
  }
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 120) {
    return truncated.substring(0, lastSpace).trim() + '.';
  }
  return truncated.trim() + '...';
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Clean and sanitize text, then enforce sentence-boundary-aware 470 char limit
  const sanitized = sanitizeForTTS(text);
  const safeText = truncateToSafeTTSLength(sanitized, 470);
  
  // Verify that safeText contains actual speakable characters (alphanumeric or Indic)
  const hasSpeakableChars = /[a-zA-Z0-9\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A80-\u0AFF\u0980-\u09FF\u0C80-\u0CFF\u0D00-\u0D7F]/.test(safeText);
  if (!safeText || safeText.trim().length === 0 || !hasSpeakableChars) {
    return '';
  }

  const maxRetries = 1;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Fire-and-forget cache cleanup (don't block TTS)
      cleanupTTSCache().catch(() => {});

      const response = await axios.post(
        `${API_BASE_URL}/text-to-speech`,
        {
          inputs: [safeText],
          target_language_code: getSarvamLanguageCode(languageCode),
          speaker: 'shubh',
          model: 'bulbul:v3',
          enable_preprocessing: true,
        },
        { 
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: 18000
        }
      );
      
      const audio = response.data.audios ? response.data.audios[0] : response.data.audio;
      if (!audio) {
        throw new Error('No audio returned from API');
      }

      // Try writing audio to file system for high performance native playback
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (baseDir) {
        try {
          const cleanDir = baseDir.endsWith('/') ? baseDir : `${baseDir}/`;
          const uri = `${cleanDir}sarvam_tts_${Date.now()}_${Math.floor(Math.random() * 10000)}.wav`;
          await FileSystem.writeAsStringAsync(uri, audio, {
            encoding: 'base64' as any,
          });
          return uri;
        } catch (fsWriteError) {
          console.warn('[TTS] Failed to write audio file to cache, using base64 data URI:', fsWriteError);
        }
      }

      // Fallback to data URI if file system write is not available
      return `data:audio/wav;base64,${audio}`;
    } catch (error: any) {
      console.warn(`[TTS] Synthesis attempt ${attempt + 1} failed:`, error?.response?.data || error?.message || error);
      if (attempt === maxRetries) {
        if (error.response?.status === 429) {
          throw new Error('API_LIMIT_REACHED');
        }
        throw new Error('err_tts_failed');
      }
    }
  }
  throw new Error('err_tts_failed');
}

export async function analyzeScreenshot(imageUri: string, languageCode: string): Promise<string> {
  // console.log('[VISION] Starting screenshot analysis...');
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60s global timeout
  let jobId: string | null = null;
  try {
    // 1. Create Job
    const createRes = await fetch(`${API_BASE_URL}/doc-digitization/job/v1`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        'Content-Type': 'application/json',
      },
      signal: abortController.signal as any,
      body: JSON.stringify({
        job_parameters: {
          language: languageCode,
          output_format: 'md',
        },
      }),
    });
    
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Job creation failed: ${errText}`);
    }
    
    const createData = await createRes.json();
    jobId = createData.job_id;
    // console.log('[VISION] Job initialized:', jobId);
    
    const lowerUri = imageUri.toLowerCase();
    const isJpg = lowerUri.includes('.jpg') || lowerUri.includes('.jpeg');
    const isWebp = lowerUri.includes('.webp');
    const ext = isJpg ? 'jpg' : (isWebp ? 'webp' : 'png');
    const fileName = `screenshot.${ext}`;
    const mimeType = isJpg ? 'image/jpeg' : (isWebp ? 'image/webp' : 'image/png');

    // 2. Get Upload URL
    const uploadRes = await fetch(`${API_BASE_URL}/doc-digitization/job/v1/upload-files`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        'Content-Type': 'application/json',
      },
      signal: abortController.signal as any,
      body: JSON.stringify({
        job_id: jobId,
        files: [fileName],
      }),
    });
    
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Failed to get upload URLs: ${errText}`);
    }
    
    const uploadData = await uploadRes.json();
    const uploadUrlObj = uploadData.upload_urls?.[fileName];
    const uploadUrl = typeof uploadUrlObj === 'string' ? uploadUrlObj : (uploadUrlObj?.file_url || uploadUrlObj?.url);
    
    if (!uploadUrl) {
      throw new Error('Upload URL not found in response');
    }
    
    // 3. Upload File
    let blob: any;
    try {
      // Replaced by FileSystem.uploadAsync below
    } catch (error) {
      throw new Error('Failed to read local image file.');
    }
    
    const uploadHeaders: Record<string, string> = {
      'Content-Type': mimeType,
    };
    if (uploadUrl.includes('windows.net') || uploadUrl.includes('blob.core.windows.net')) {
      uploadHeaders['x-ms-blob-type'] = 'BlockBlob';
    }
    
    try {
      const putRes = await FileSystem.uploadAsync(uploadUrl, imageUri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: uploadHeaders,
      });
      
      if (putRes.status !== 200 && putRes.status !== 201) {
        throw new Error(`File upload failed: ${putRes.body}`);
      }
    } catch (error: any) {
      throw error;
    }
    
    // console.log('[VISION] Upload complete');
    
    // 4. Start Job
    const startRes = await fetch(`${API_BASE_URL}/doc-digitization/job/v1/${jobId}/start`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        'Content-Type': 'application/json',
      },
      signal: abortController.signal as any,
      body: JSON.stringify({
        job_id: jobId,
      }),
    });
    
    if (!startRes.ok) {
      const errText = await startRes.text();
      throw new Error(`Failed to start job: ${errText}`);
    }
    
    // 5. Poll Status
    let status = 'processing';
    let attempts = 0;
    let jobDetails: any = null;
    
    while (attempts < 15) {
      attempts++;
      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const statusRes = await fetch(`${API_BASE_URL}/doc-digitization/job/v1/${jobId}/status`, {
        method: 'GET',
        headers: {
          'api-subscription-key': API_KEY,
        },
        signal: abortController.signal as any,
      });
      
      if (!statusRes.ok) {
        // console.warn(`[VISION] Status poll failed (attempt ${attempts})`);
        continue;
      }
      
      const statusData = await statusRes.json();
      status = statusData.job_state?.toLowerCase() || statusData.status?.toLowerCase();
      jobDetails = statusData.job_details;
      
      // console.log('[VISION] Polling attempt:', attempts, 'status:', status);
      
      if (status === 'completed' || status === 'failed') {
        break;
      }
    }
    
    if (status !== 'completed') {
      throw new Error(status === 'failed' ? 'Job failed on server' : 'Job timed out');
    }
    
    // 6. Get Download URLs
    let outputFiles: string[] = [];
    if (jobDetails && Array.isArray(jobDetails.outputs)) {
      outputFiles = jobDetails.outputs.map((o: any) => o.file_name);
    } else if (jobDetails && Array.isArray(jobDetails)) {
      for (const d of jobDetails) {
        if (d.outputs && Array.isArray(d.outputs)) {
          outputFiles.push(...d.outputs.map((o: any) => o.file_name));
        }
      }
    }
    
    if (outputFiles.length === 0) {
      outputFiles = ['screenshot.md'];
    }
    
    const downloadRes = await fetch(`${API_BASE_URL}/doc-digitization/job/v1/${jobId}/download-files`, {
      method: 'POST',
      headers: {
        'api-subscription-key': API_KEY,
        'Content-Type': 'application/json',
      },
      signal: abortController.signal as any,
      body: JSON.stringify({
        job_id: jobId,
        files: outputFiles,
      }),
    });
    
    if (!downloadRes.ok) {
      const errText = await downloadRes.text();
      throw new Error(`Failed to get download URLs: ${errText}`);
    }
    
    const downloadData = await downloadRes.json();
    const downloadUrlObj = downloadData.download_urls?.[outputFiles[0]];
    const downloadUrl = typeof downloadUrlObj === 'string' ? downloadUrlObj : (downloadUrlObj?.file_url || downloadUrlObj?.url);
    
    if (!downloadUrl) {
      throw new Error('Download URL not found in response');
    }
    
    // 7. Fetch Extracted Text
    const textRes = await fetch(downloadUrl, { signal: abortController.signal as any });
    if (!textRes.ok) {
      throw new Error('Failed to download result text');
    }
    
    const arrayBuffer = await textRes.arrayBuffer();
    const zipUint8 = new Uint8Array(arrayBuffer);
    
    const unzipped = unzipSync(zipUint8);
    const mdFileName = Object.keys(unzipped).find(name => name.endsWith('.md'));
    if (!mdFileName) {
      throw new Error('No .md file found in zip archive');
    }
    
    const mdBuffer = unzipped[mdFileName];
    let extractedText = '';
    if (typeof TextDecoder !== 'undefined') {
      extractedText = new TextDecoder('utf-8').decode(mdBuffer);
    } else {
      // Simple fallback decoding for UTF-8 Uint8Array
      extractedText = Array.from(mdBuffer).map(c => String.fromCharCode(c)).join('');
    }
    
    // console.log('[VISION] Extracted text:', extractedText);
    return extractedText;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Analysis timed out after 60 seconds.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (jobId) {
      fetch(`${API_BASE_URL}/doc-digitization/job/v1/${jobId}`, {
        method: 'DELETE',
        headers: { 'api-subscription-key': API_KEY }
      }).catch(() => {});
    }
  }
}

export async function roleplayWithSarvam(
  messages: {role: string, content: string}[],
  languageCode: string = 'hi-IN',
  scamId: string = 'electricity_bill',
  exchangeTurn: number = 1,
  userText: string = ''
): Promise<string> {
  // Fast online attempt with sarvam-105b-conversations
  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        model: 'sarvam-105b-conversations',
        temperature: 0.55,
        max_tokens: 160,
        messages: messages,
      },
      { 
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        timeout: 5500
      }
    );
    
    const choice = response?.data?.choices?.[0];
    const content = choice?.message?.content;
    if (content && content.trim().length > 0) {
      return content.trim();
    }

    // If model produced reasoning content, extract the response cleanly
    const reasoning = choice?.message?.reasoning_content;
    if (reasoning && typeof reasoning === 'string') {
      const lines = reasoning.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].replace(/^["'«»]+|["'«»]+$/g, '').trim();
        if (line.length > 20 && !line.startsWith('Wait') && !line.startsWith('Let') && !line.startsWith('The user') && !line.startsWith('Check') && !line.startsWith('Key')) {
          return line;
        }
      }
    }
  } catch (error: any) {
    console.warn(`[ROLEPLAY API] Online call skipped or timed out (${error.message}). Using scenario dialogue matrix.`);
    if (error.response?.status === 429) {
      throw new Error('API_LIMIT_REACHED');
    }
  }

  // Instant zero-lag scenario-adaptive scripted response
  return getScriptedScammerResponse(scamId, languageCode, exchangeTurn, userText);
}

export async function evaluateRoleplay(
  transcript: string,
  scenarioType: string,
  languageCode: string
): Promise<{verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string}> {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = `Review this conversation where a user was being scammed (Scenario: ${scenarioType}).
CRITICAL EVALUATION RULES:
1. If the user agrees to pay, asks how to pay, asks for payment details (like amount or UPI ID), clicks a link, or shares personal/financial info, they FAILED. Verdict must be NEEDS_PRACTICE.
2. They only PASS if they explicitly refuse to comply, challenge the scammer, recognize the scam, refuse to pay, or hang up/disconnect the call without giving information.
Give brief, educational feedback in 2-3 sentences, plus a clear PASS or NEEDS_PRACTICE verdict. You MUST start your response with the exact word "PASS:" or "NEEDS_PRACTICE:" followed by your feedback in ${languageName}.`;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        model: 'sarvam-105b-conversations',
        temperature: 0.1,
        max_tokens: 300,
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
        timeout: 6500
      }
    );

    const choice = response?.data?.choices?.[0];
    let content = choice?.message?.content?.trim();

    if (!content && choice?.message?.reasoning_content) {
      const reasoning = choice.message.reasoning_content;
      if (typeof reasoning === 'string') {
        const passMatch = reasoning.match(/PASS:\s*([^\n]+)/i);
        const practiceMatch = reasoning.match(/NEEDS_PRACTICE:\s*([^\n]+)/i);
        if (passMatch) content = `PASS: ${passMatch[1]}`;
        else if (practiceMatch) content = `NEEDS_PRACTICE: ${practiceMatch[1]}`;
      }
    }

    if (content) {
      if (content.startsWith('PASS:')) {
        return { verdict: 'PASS', feedback: content.replace('PASS:', '').trim() };
      } else if (content.startsWith('NEEDS_PRACTICE:')) {
        return { verdict: 'NEEDS_PRACTICE', feedback: content.replace('NEEDS_PRACTICE:', '').trim() };
      }
    }
  } catch (error: any) {
    console.warn('[EVALUATE] Sarvam online evaluation timed out or unavailable:', error.message);
  }

  // Robust, offline-safe heuristic evaluation tailored to the specific scam scenario and language
  return evaluateRoleplayHeuristic(transcript, scenarioType, languageCode);
}


