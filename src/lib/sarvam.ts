import axios from 'axios';
import { Audio } from 'expo-av';
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
    formData.append('model', 'saarika:v2.5');
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
    clearTimeout(timeoutId);

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

export async function chatWithSarvam(transcript: string, languageCode: string, mode: 'classification' | 'conversation' = 'conversation'): Promise<string> {
  try {
    const languageName = LANG_MAP[languageCode] || 'English';
    const systemPrompt = mode === 'classification'
      ? `You must respond ONLY in ${languageName}. Do not respond in English unless the target language is English.`
      : `You are CyberSaathi, a warm cybersecurity friend. Answer only about cyber scams and fraud. Reply in simple conversational language. Maximum 3 sentences. Never use technical jargon. You must respond ONLY in ${languageName}. Do not respond in English unless the target language is English.`;

    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        model: 'sarvam-30b',
        temperature: mode === 'classification' ? 0 : 0.7,
        max_tokens: mode === 'classification' ? 150 : 200,
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
    return response.data.choices[0]?.message?.content || '';
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection.');
    }
    console.error('Chat Error Details:', error?.response?.data || error);
    throw new Error('err_chat_failed');
  }
}

export async function classifyContent(content: string, languageCode: string): Promise<{verdict: 'safe' | 'suspicious', explanation: string}> {
  const prompt = `You are a strict cybersecurity classifier. Analyze the given URL or message for phishing/scam indicators (urgency, fake domains, requests for payment, suspicious shorteners, impersonation of banks/government/delivery services, fake threats, too-good-to-be-true offers).

You MUST respond starting with EXACTLY one of these two words in English, followed by a colon:
SUSPICIOUS: [your explanation in user's language]
SAFE: [your explanation in user's language]

Default to SUSPICIOUS if there is ANY doubt. Never default to SAFE unless completely certain the link/message is legitimate.

Input to analyze: ${content}`;

  const aiResponse = await chatWithSarvam(prompt, languageCode, 'classification');
  console.log('RAW AI classification response:', JSON.stringify(aiResponse));

  const normalized = aiResponse.trim().toUpperCase();
  const isSuspicious = !normalized.startsWith('SAFE:') && !normalized.startsWith('SAFE ');
  const verdict = isSuspicious ? 'suspicious' : 'safe';
  
  const explanation = aiResponse.replace(/^(SAFE:|SUSPICIOUS:|SAFE\s*:|SUSPICIOUS\s*:)\s*/i, '');
  
  return { verdict, explanation };
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for speech synthesis');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/text-to-speech`,
      {
        text: text,
        target_language_code: languageCode,
        speaker: 'priya',
        model: 'bulbul:v2',
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
    return audio;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please check your connection.');
    }
    console.error('TTS Error Details:', error?.response?.data || error);
    throw new Error('err_tts_failed');
  }
}

let currentSound: Audio.Sound | null = null;
let playbackResolve: (() => void) | null = null;
let currentPlayId = 0;

export async function playAudio(base64Audio: string): Promise<void> {
  // 1. Stop any currently playing audio and invalidate previous load sessions
  await stopAudio();
  const playId = ++currentPlayId;

  try {
    if (!base64Audio) throw new Error('Empty base64 audio provided to playAudio');

    const uri = FileSystem.cacheDirectory + 'sarvam_playback.wav';
    
    await FileSystem.writeAsStringAsync(uri, base64Audio, {
      encoding: 'base64' as any,
    });
    
    if (playId !== currentPlayId) return; // Cancelled/superseded

    // 2. Configure audio mode specifically for playback to avoid earpiece routing
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
    });

    if (playId !== currentPlayId) return; // Cancelled/superseded

    const { sound } = await Audio.Sound.createAsync({ uri });
    
    if (playId !== currentPlayId) {
      // Clean up if cancelled during sound creation
      await sound.unloadAsync().catch(() => {});
      return;
    }

    currentSound = sound;
    await sound.playAsync();

    return new Promise((resolve, reject) => {
      playbackResolve = resolve;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (playId !== currentPlayId) {
          sound.unloadAsync().catch(() => {});
          resolve();
          return;
        }
        if (!status.isLoaded) {
          if (status.error) {
            sound.unloadAsync().catch(() => {});
            if (currentSound === sound) currentSound = null;
            if (playbackResolve === resolve) playbackResolve = null;
            reject(new Error(status.error));
          }
          return;
        }
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (currentSound === sound) currentSound = null;
          if (playbackResolve === resolve) playbackResolve = null;
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Playback Error:', error);
    if (playId === currentPlayId) {
      currentSound = null;
      playbackResolve = null;
    }
    throw new Error('err_playback_failed');
  }
}

export async function stopAudio(): Promise<void> {
  // Invalidate any ongoing load session
  currentPlayId++;
  
  const sound = currentSound;
  currentSound = null;
  const resolve = playbackResolve;
  playbackResolve = null;

  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch (e) {
      console.warn('Error stopping audio:', e);
    }
  }

  if (resolve) {
    resolve();
  }
}
