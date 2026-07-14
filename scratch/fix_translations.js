const fs = require('fs');
let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Define new translation keys for roleplay titles
const newKeys = {
  'en-IN': {
    scam_title_electricity_bill: 'Electricity Bill Disconnect',
    live_roleplay_title: 'Live Roleplay',
    roleplay_voice_mode: ' (Voice)',
  },
  'hi-IN': {
    scam_title_electricity_bill: 'बिजली बिल कटने का झांसा',
    live_roleplay_title: 'लाइव रोलप्ले',
    roleplay_voice_mode: ' (आवाज)',
  },
  'mr-IN': {
    scam_title_electricity_bill: 'वीज बिल कापण्याचा कट',
    live_roleplay_title: 'लाईव्ह रोलप्ले',
    roleplay_voice_mode: ' (आवाज)',
  },
  'ta-IN': {
    scam_title_electricity_bill: 'மின் கட்டணத் துண்டிப்பு மோசடி',
    live_roleplay_title: 'நேரடி பயிற்சி',
    roleplay_voice_mode: ' (குரல்)',
  },
  'te-IN': {
    scam_title_electricity_bill: 'విద్యుత్ బిల్లు నిలిపివేత మోసం',
    live_roleplay_title: 'లైవ్ రోల్-ప్లే',
    roleplay_voice_mode: ' (వాయిస్)',
  },
  'gu-IN': {
    scam_title_electricity_bill: 'વીજળી બિલ કાપવાનો સ્કેમ',
    live_roleplay_title: 'લાઈવ રોલપ્લે',
    roleplay_voice_mode: ' (અવાજ)',
  }
};

for (const lang of Object.keys(newKeys)) {
  content = content.replace(new RegExp(`'${lang}': \\{([^}]+)\\}`, 's'), (match, inner) => {
    let updatedInner = inner;
    for (const key of Object.keys(newKeys[lang])) {
      // Add key if not present
      if (!updatedInner.includes(`${key}:`)) {
        updatedInner += `\n    ${key}: '${newKeys[lang][key]}',`;
      }
    }
    return `'${lang}': {${updatedInner}}`;
  });
}

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('Translations successfully updated with roleplay keys.');
