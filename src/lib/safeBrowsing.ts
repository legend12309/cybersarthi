export async function checkSafeBrowsing(url: string): Promise<{ isThreat: boolean; threatType?: string }> {
  const apiKey = process.env.EXPO_PUBLIC_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    // console.log('[SAFE_BROWSING] API Key missing, skipping check');
    return { isThreat: false };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    client: { clientId: 'cybersaathi', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // console.log('[SAFE_BROWSING] Response:', JSON.stringify(data));

    if (data.matches && data.matches.length > 0) {
      return { isThreat: true, threatType: data.matches[0].threatType };
    }
    return { isThreat: false };
  } catch (error) {
    // console.log('[SAFE_BROWSING] Error:', error);
    // If this check fails, don't block the whole flow — fall back to Sarvam's verdict alone
    return { isThreat: false };
  }
}
