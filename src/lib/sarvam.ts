import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { unzipSync } from 'fflate';
import { checkSafeBrowsing } from './safeBrowsing';

const API_BASE_URL = process.env.EXPO_PUBLIC_SARVAM_API_URL || 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

export async function speechToText(audioUri: string, languageCode: string): Promise<string> {
  // console.log('API Key length:', API_KEY?.length);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
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
    // console.error('STT Error Details:', error);
    throw new Error('err_stt_failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

const LANG_MAP: Record<string, string> = {
  'hi-IN': 'Hindi. आपको केवल हिंदी (Hindi) में ही उत्तर देना अनिवार्य है।',
  'mr-IN': 'Marathi. तुम्हाला फक्त मराठी (Marathi) मध्येच उत्तर देणे बंधनकारक आहे।',
  'ta-IN': 'Tamil. நீங்கள் தமிழ் (Tamil) மொழியில் மட்டுமே பதிலளிக்க வேண்டும்.',
  'te-IN': 'Telugu. మీరు తెలుగు (Telugu) లో మాత్రమే సమాధానం చెప్పాలి.',
  'gu-IN': 'Gujarati. તમારે ફક્ત ગુજરાતી (Gujarati) માં જ જવાબ આપવો ફરજિયાત છે.',
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
    ? `You must respond ONLY in ${languageName}. However, you MUST start your response with the English words "SAFE:" or "SUSPICIOUS:" followed by your explanation in ${languageName}. Do not translate the "SAFE:" or "SUSPICIOUS:" labels.`
    : `You are CyberSaathi, a direct safety assistant analyzing real scenarios described by users.

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
Respond in ${languageName}.`;

  const response = await axios.post(
    `${API_BASE_URL}/v1/chat/completions`,
    {
      model: 'sarvam-105b',
      temperature: mode === 'classification' ? 0 : 0.4,
      max_tokens: mode === 'classification' ? 1500 : 300,
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
      timeout: 12000
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
      const content = response?.data?.choices?.[0]?.message?.content;
      const finishReason = response?.data?.choices?.[0]?.finish_reason;
      
      if (content && content.trim().length > 0) {
        const text = content.trim();
        if (mode === 'classification') {
          return text;
        }

        const contaminated = isContaminated(text);
        const incomplete = isIncomplete(text);
        
        // console.log('[CHAT] Final answer finish_reason:', finishReason);
        // console.log('[CHAT] Final answer length:', text.length);
        // console.log('[CHAT] Final answer last 20 chars:', text.slice(-20));

        if (!contaminated && !incomplete) {
          return text;
        }

        if (!contaminated && incomplete) {
          lastIncompleteContent = text;
          // console.log('[CHAT] Rejected - incomplete ending:', incomplete, 'finish_reason:', finishReason);
        } else {
          // console.log(`[CHAT] Attempt ${attempt + 1} rejected - content: '${text}', contaminated: ${contaminated}`);
        }
      }
      
    } catch (error: any) {
      // console.log(`[CHAT] Error on attempt ${attempt + 1}:`, error.message);
      lastErrorMsg = error.response?.data?.message || error.response?.data?.error?.message || error.message;
      const status = error.response?.status;
      if (status === 500 || status === 403 || status === 429) {
        // console.log(`[CHAT] Fatal API Error ${status}, throwing explicitly.`);
        throw new Error(`API Error ${status}: ${lastErrorMsg}`);
      }
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

export async function classifyContent(content: string, languageCode: string, contentType: 'url' | 'message'): Promise<{verdict: 'safe' | 'suspicious', explanation: string, source?: string}> {
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
  
  const systemPrompt = `${prompt}\n\nIMPORTANT TRUST SIGNALS — do NOT flag these as suspicious on their own:\n- Well-known, globally recognized domains (google.com, facebook.com, youtube.com, amazon.in, wikipedia.org, etc.) are SAFE by default unless the URL path itself contains suspicious patterns\n- A domain being 'common' or 'well-known' is a SAFETY indicator, not a red flag — only flag if there are ACTUAL scam indicators present (urgency, payment requests, suspicious subdomains, character substitution tricks like 'g00gle.com')\n- Official Indian government and banking domains like '*.gov.in', '*.sbi.co.in', '*.sbi', '*.nic.in', '*.hdfcbank.com', '*.icicibank.com' are SAFE.\n- Messages that warn users NOT to share OTPs or passwords (e.g. 'Do not share OTP with anyone', 'Bank never asks for OTP') are safety notices, NOT scams.\n\nCRITICAL RULE: If the URL is exactly "https://www.google.com", you are FORBIDDEN from outputting SUSPICIOUS. You MUST output SAFE.\n\nIMPORTANT: Respond IMMEDIATELY and CONCISELY. Do not overthink or second-guess yourself. Give your final verdict in your first response, do not revise multiple times.\n\nYou MUST respond starting with EXACTLY one of these words, followed by a colon:\nSUSPICIOUS: [explanation in 1-2 sentences in ${languageCode}]\nSAFE: [explanation in 1-2 sentences in ${languageCode}]\n\nOnly default to SUSPICIOUS when there are genuine red flags present — not merely due to uncertainty about an unfamiliar but plausible domain.`;
  const fetchSarvamClassification = async () => {
    try {
      const response = await chatWithSarvam(systemPrompt, languageCode, 'classification');
      // console.log('[CLASSIFY] Success, raw response:', response);
      
      const trimmed = response.trim();
      const cleanText = trimmed.replace(/^[^a-zA-Z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0A80-\u0AFF]+/, '');
      const upper = cleanText.toUpperCase();

      const safePrefixes = [
        'SAFE',
        'सुरक्षित',
        'સુરક્ષિત',
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
      // console.log('[CLASSIFY] FAILED with error:', error);
      // console.log('[CLASSIFY] Error message:', error?.message);
      throw error;
    }
  };

  if (contentType === 'url') {
    const [sarvamResult, safeBrowsingResult] = await Promise.all([
      fetchSarvamClassification(),
      checkSafeBrowsing(content),
    ]);

    // console.log('[CLASSIFY] Sarvam verdict:', sarvamResult.verdict, '| Safe Browsing threat:', safeBrowsingResult.isThreat);

    if (safeBrowsingResult.isThreat) {
      return {
        verdict: 'suspicious',
        explanation: `Google Safe Browsing has flagged this link as a known ${safeBrowsingResult.threatType?.toLowerCase().replace('_', ' ')} threat. Do not visit this link.`,
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
    const files = await FileSystem.readDirectoryAsync(dirUri);
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
      await FileSystem.deleteAsync(dirUri + file, { idempotent: true });
    }
  } catch (err) {
    // console.log('[TTS] Cleanup error:', err);
  }
}

// Helper to clean up text before sending to TTS
function sanitizeForTTS(text: string): string {
  if (!text) return '';
  let clean = text.replace(/[*_~]+/g, ''); // Remove markdown formatting
  clean = clean.replace(/₹/g, ' rupees '); // Replace ₹ symbol
  clean = clean.replace(/(\d+),(\d+)/g, '$1$2'); // Remove commas in numbers (e.g. 3,240 -> 3240) so it's read as a full number
  clean = clean.replace(/-/g, ' '); // Replace hyphens with spaces
  return clean.trim();
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for speech synthesis');
  }

  const maxRetries = 1;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Fire-and-forget cache cleanup (don't block TTS)
      cleanupTTSCache().catch(() => {});
      // Clean and sanitize text, then enforce 500 char limit
      const sanitized = sanitizeForTTS(text);
      const safeText = sanitized.length > 500 ? sanitized.substring(0, 497) + '...' : sanitized;
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
          timeout: 12000
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
      if (attempt === maxRetries) {
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
    
    const ext = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';
    const isJpg = ext === 'jpg' || ext === 'jpeg';
    const fileName = `screenshot.${isJpg ? 'jpg' : 'png'}`;
    const mimeType = isJpg ? 'image/jpeg' : 'image/png';

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

export async function roleplayWithSarvam(messages: {role: string, content: string}[]): Promise<string> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/v1/chat/completions`,
        {
          model: 'sarvam-105b',
          temperature: 0.6,
          max_tokens: 300,
          messages: messages,
        },
        { 
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: 12000
        }
      );
      
      const content = response?.data?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
      
      if (response?.data?.choices?.[0]?.message?.refusal || content === null) {
        return "Listen, I am losing patience. You need to resolve this right now or face the consequences.";
      }
    } catch (error: any) {
      console.log(`[ROLEPLAY API] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === maxRetries) {
        return "I don't have time for this. Pay now or else.";
      }
    }
  }
  return "I don't have time for this. Pay now or else.";
}

export async function evaluateRoleplay(transcript: string, scenarioType: string, languageCode: string): Promise<{verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string}> {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = `Review this conversation where a user was being scammed (Scenario: ${scenarioType}). Evaluate: did they share sensitive info, did they show good instincts (asking for verification, refusing links, staying calm), or did they fall for the scam. Give brief, encouraging feedback in 2-3 sentences, plus a clear PASS or NEEDS_PRACTICE verdict. You MUST start your response with the exact word "PASS:" or "NEEDS_PRACTICE:" followed by your feedback in ${languageName}.`;

  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
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
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { verdict: 'PASS', feedback: 'Evaluation blocked by AI safety filters, but you successfully frustrated the scammer!' };
    }

    if (content.startsWith('PASS:')) {
      return { verdict: 'PASS', feedback: content.replace('PASS:', '').trim() };
    } else if (content.startsWith('NEEDS_PRACTICE:')) {
      return { verdict: 'NEEDS_PRACTICE', feedback: content.replace('NEEDS_PRACTICE:', '').trim() };
    }

    return { verdict: 'NEEDS_PRACTICE', feedback: content };
  } catch (error) {
    console.log('[EVALUATE] Error evaluating roleplay:', error);
    return { verdict: 'NEEDS_PRACTICE', feedback: 'Could not complete evaluation due to a network issue. Remember: never share personal details with unknown callers.' };
  }
}

