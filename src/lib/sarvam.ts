import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/build/legacy';

const API_BASE_URL = 'https://api.sarvam.ai';
const API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || '';

const getHeaders = () => ({
  'api-subscription-key': API_KEY,
});

export async function speechToText(audioUri: string, languageCode: string): Promise<string> {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.transcript || data.text || '';
  } catch (error: any) {
    console.error('STT Error Details:', error);
    throw new Error('Could not convert speech to text.');
  }
}

export async function chatWithSarvam(transcript: string, languageCode: string): Promise<string> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        model: 'sarvam-2b',
        messages: [
          {
            role: 'system',
            content: `You are CyberSaathi, a warm cybersecurity friend. Answer only about cyber scams and fraud. Reply in simple conversational language matching the user language. Maximum 3 sentences. Never use technical jargon.`,
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
    throw new Error('Could not get a response from AI.');
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
    throw new Error('Could not convert text to speech.');
  }
}

export async function playAudio(base64Audio: string): Promise<void> {
  try {
    if (!base64Audio) throw new Error('Empty base64 audio provided to playAudio');

    const uri = FileSystem.cacheDirectory + 'sarvam_playback.wav';
    
    // Use the literal string 'base64' to avoid any undefined EncodingType issues
    await FileSystem.writeAsStringAsync(uri, base64Audio, {
      encoding: 'base64' as any,
    });

    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();

    return new Promise((resolve, reject) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Playback Error:', error);
    throw new Error('Could not play audio.');
  }
}
