const fs = require('fs');
const path = require('path');

const filePath = path.join('D:/CyberSaathi/src/lib/sarvam.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newFunctions = `
export async function roleplayWithSarvam(messages: {role: string, content: string}[]): Promise<string> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        \`\${API_BASE_URL}/v1/chat/completions\`,
        {
          model: 'sarvam-105b',
          temperature: 0.6,
          max_tokens: 1024,
          messages: messages,
        },
        { 
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );
      
      const content = response?.data?.choices?.[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  throw new Error('Failed to get roleplay response');
}

export async function evaluateRoleplay(transcript: string, scenarioType: string, languageCode: string): Promise<{verdict: 'PASS' | 'NEEDS_PRACTICE', feedback: string}> {
  const languageName = LANG_MAP[languageCode] || 'English';
  const systemPrompt = \`Review this conversation where a user was being scammed (Scenario: \${scenarioType}). Evaluate: did they share sensitive info, did they show good instincts (asking for verification, refusing links, staying calm), or did they fall for the scam. Give brief, encouraging feedback in 2-3 sentences, plus a clear PASS or NEEDS_PRACTICE verdict. You MUST start your response with the exact word "PASS:" or "NEEDS_PRACTICE:" followed by your feedback in \${languageName}.\`;

  const response = await axios.post(
    \`\${API_BASE_URL}/v1/chat/completions\`,
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
  if (!content) throw new Error('Empty evaluation response');

  if (content.startsWith('PASS:')) {
    return { verdict: 'PASS', feedback: content.replace('PASS:', '').trim() };
  } else if (content.startsWith('NEEDS_PRACTICE:')) {
    return { verdict: 'NEEDS_PRACTICE', feedback: content.replace('NEEDS_PRACTICE:', '').trim() };
  }

  return { verdict: 'NEEDS_PRACTICE', feedback: content };
}
`;

fs.writeFileSync(filePath, content + newFunctions, 'utf8');
console.log('Appended successfully');
