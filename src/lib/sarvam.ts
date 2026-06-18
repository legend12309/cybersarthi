import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

export async function speechToText(audioUri: string, languageCode: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('model', 'saarika:v2');
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.transcript || data.text || '';
  } catch (error: any) {
    console.error('STT Error Details:', error);
    throw new Error('err_stt_failed');
  }
}

export async function chatWithSarvam(transcript: string, languageCode: string): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        model: 'sarvam-m',
        messages: [
          {
            role: 'system',
            content: 'You are CyberSaathi, a warm cybersecurity friend. Answer only about cyber scams and fraud. Reply in simple conversational language matching the user language. Maximum 3 sentences. Never use technical jargon.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
      },
      { 
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        } 
      }
    );
    return response.data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('Chat Error Details:', error?.response?.data || error);
    throw new Error('err_chat_failed');
  }
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/text-to-speech`,
      {
        inputs: [text],
        target_language_code: languageCode,
        speaker: 'meera',
        model: 'bulbul:v2',
        enable_preprocessing: true,
      },
      { 
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        } 
      }
    );
    
    const audio = response.data.audios ? response.data.audios[0] : response.data.audio;
    if (!audio) {
      throw new Error('No audio returned from API');
    }
    return audio;
  } catch (error: any) {
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
