export async function checkSafeBrowsing(url: string): Promise<{ isThreat: boolean; threatType?: string }> {
  const apiKey = process.env.EXPO_PUBLIC_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    // console.log('[SAFE_BROWSING] API Key missing, skipping check');
    return { isThreat: false };
  }

  const cleanUrl = url.trim().replace(/^["']|["']$/g, '');
  if (!cleanUrl) return { isThreat: false };

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  // Google Safe Browsing requires a scheme (http/https). If user omitted scheme, test both.
  const threatEntries = /^https?:\/\//i.test(cleanUrl)
    ? [{ url: cleanUrl }]
    : [{ url: `https://${cleanUrl}` }, { url: `http://${cleanUrl}` }];

  const body = {
    client: { clientId: 'cybersaathi', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal as any,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      return { isThreat: true, threatType: data.matches[0].threatType };
    }
    return { isThreat: false };
  } catch (error) {
    // If Safe Browsing call fails, fail open gracefully to let Sarvam AI analyze it
    return { isThreat: false };
  }
}
