const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const extractLangBlock = (lang) => {
  const startIdx = content.indexOf(`'${lang}': {`);
  if (startIdx === -1) return {};
  
  let braceCount = 1;
  let i = startIdx + `'${lang}': {`.length;
  let blockStr = '';
  
  while (braceCount > 0 && i < content.length) {
    const char = content[i];
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (braceCount > 0) blockStr += char;
    i++;
  }
  
  const map = {};
  const lines = blockStr.split('\n');
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join(':').trim();
      if (value.endsWith(',')) value = value.slice(0, -1).trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      if (key && !key.startsWith('//')) {
        map[key] = value;
      }
    }
  }
  return map;
};

const en = extractLangBlock('en-IN');
const langs = ['hi-IN', 'mr-IN', 'ta-IN', 'te-IN', 'gu-IN'];

for (const lang of langs) {
  const block = extractLangBlock(lang);
  console.log(`\n--- UNTRANSLATED IN ${lang} ---`);
  const untranslated = [];
  for (const key of Object.keys(en)) {
    if (en[key] === block[key]) {
      untranslated.push(key);
    }
  }
  console.log(untranslated);
}
