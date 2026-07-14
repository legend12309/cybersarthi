const fs = require('fs');
let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Define new translation keys for roleplay titles and UI elements
const newKeys = {
  'en-IN': {
    scam_title_electricity_bill: 'Electricity Bill Disconnect',
    live_roleplay_title: 'Live Roleplay',
    roleplay_voice_mode: ' (Voice)',
    live_scam_simulator: 'Live Scam Simulator',
    experience_safe_environment: 'Experience this scenario in a safe environment before you decide.',
    coming_soon: 'Coming Soon',
    skip_to_static: 'OR skip to static version',
    roleplay_text_btn: 'Text',
    roleplay_voice_btn: 'Voice',
    start_live_roleplay: 'Start Live Roleplay',
  },
  'hi-IN': {
    scam_title_electricity_bill: 'बिजली बिल कटने का झांसा',
    live_roleplay_title: 'लाइव रोलप्ले',
    roleplay_voice_mode: ' (आवाज)',
    live_scam_simulator: 'लाइव स्कैम सिम्युलेटर',
    experience_safe_environment: 'निर्णय लेने से पहले इस परिदृश्य का सुरक्षित वातावरण में अनुभव करें।',
    coming_soon: 'जल्द ही आ रहा है',
    skip_to_static: 'या स्थिर संस्करण पर जाएं',
    roleplay_text_btn: 'टेक्स्ट',
    roleplay_voice_btn: 'आवाज',
    start_live_roleplay: 'लाइव रोलप्ले शुरू करें',
  },
  'mr-IN': {
    scam_title_electricity_bill: 'वीज बिल कापण्याचा कट',
    live_roleplay_title: 'लाईव्ह रोलप्ले',
    roleplay_voice_mode: ' (आवाज)',
    live_scam_simulator: 'थेट स्कॅम सिम्युलेटर',
    experience_safe_environment: 'निर्णय घेण्यापूर्वी या परिस्थितीचा सुरक्षित वातावरणात अनुभव घ्या.',
    coming_soon: 'लवकरच येत आहे',
    skip_to_static: 'किंवा थेट माहिती वाचा',
    roleplay_text_btn: 'टेक्स्ट',
    roleplay_voice_btn: 'आवाज',
    start_live_roleplay: 'थेट सराव सुरू करा',
  },
  'ta-IN': {
    scam_title_electricity_bill: 'மின் கட்டணத் துண்டிப்பு மோசடி',
    live_roleplay_title: 'நேரடி பயிற்சி',
    roleplay_voice_mode: ' (குரல்)',
    live_scam_simulator: 'நேரடி மோசடி சிமுலேட்டர்',
    experience_safe_environment: 'முடிவெடுப்பதற்கு முன் இந்த சூழலை பாதுகாப்பான முறையில் அனுபவித்து உணருங்கள்.',
    coming_soon: 'விரைவில் வருகிறது',
    skip_to_static: 'அல்லது நிலையான பதிப்பிற்குச் செல்லவும்',
    roleplay_text_btn: 'உரை',
    roleplay_voice_btn: 'குரல்',
    start_live_roleplay: 'நேரடி பயிற்சியைத் தொடங்கு',
  },
  'te-IN': {
    scam_title_electricity_bill: 'విద్యుత్ బిల్లు నిలిపివేత మోసం',
    live_roleplay_title: 'లైవ్ రోల్-ప్లే',
    roleplay_voice_mode: ' (వాయిస్)',
    live_scam_simulator: 'లైవ్ స్కామ్ సిమ్యులేటర్',
    experience_safe_environment: 'మీరు నిర్ణయించుకునే ముందు ఈ స్కామ్ కనెక్షన్‌ను సురక్షిత వాతావరణంలో అనుభవించండి.',
    coming_soon: 'త్వరలో వస్తుంది',
    skip_to_static: 'లేదా సాధారణ వివరాలకు వెళ్ళండి',
    roleplay_text_btn: 'టెక్స్ట్',
    roleplay_voice_btn: 'వాయిస్',
    start_live_roleplay: 'లైవ్ రోల్-ప్లే ప్రారంభించండి',
  },
  'gu-IN': {
    scam_title_electricity_bill: 'વીજળી બિલ કાપવાનો સ્કેમ',
    live_roleplay_title: 'લાઈવ રોલપ્લે',
    roleplay_voice_mode: ' (અવાજ)',
    live_scam_simulator: 'લાઈવ સ્કેમ સિમ્યુલેટર',
    experience_safe_environment: 'નિર્ણય લેતા પહેલા આ પરિસ્થિતિનો સુરક્ષિત વાતાવરણમાં અનુભવ કરો.',
    coming_soon: 'ટૂંક સમયમાં આવશે',
    skip_to_static: 'અથવા માહિતી પર જાઓ',
    roleplay_text_btn: 'ટેક્સ્ટ',
    roleplay_voice_btn: 'અવાજ',
    start_live_roleplay: 'લાઈવ રોલપ્લે શરૂ કરો',
  }
};

for (const lang of Object.keys(newKeys)) {
  content = content.replace(new RegExp(`'${lang}': \\{([^}]+)\\}`, 's'), (match, inner) => {
    let updatedInner = inner;
    for (const key of Object.keys(newKeys[lang])) {
      // Add or update key
      const keyPattern = new RegExp(`\\b${key}:`, 'g');
      if (!updatedInner.match(keyPattern)) {
        updatedInner += `\n    ${key}: '${newKeys[lang][key]}',`;
      } else {
        // Replace existing
        updatedInner = updatedInner.replace(new RegExp(`${key}:\\s*'[^']*',?`, 'g'), `${key}: '${newKeys[lang][key]}',`);
      }
    }
    return `'${lang}': {${updatedInner}}`;
  });
}

// Ensure the button labels in ScamDetailScreen are single words
content = content.replace(/'hi-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace(/scam_detail_trust_btn:\s*'[^']*',?/, "scam_detail_trust_btn: 'सुरक्षित',");
  inner = inner.replace(/scam_detail_scam_btn:\s*'[^']*',?/, "scam_detail_scam_btn: 'स्कैम',");
  return inner;
});

content = content.replace(/'mr-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace(/scam_detail_trust_btn:\s*'[^']*',?/, "scam_detail_trust_btn: 'सुरक्षित',");
  inner = inner.replace(/scam_detail_scam_btn:\s*'[^']*',?/, "scam_detail_scam_btn: 'स्कॅम',");
  return inner;
});

content = content.replace(/'ta-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace(/scam_detail_trust_btn:\s*'[^']*',?/, "scam_detail_trust_btn: 'பாதுகாப்பானது',");
  inner = inner.replace(/scam_detail_scam_btn:\s*'[^']*',?/, "scam_detail_scam_btn: 'மோசடி',");
  return inner;
});

content = content.replace(/'te-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace(/scam_detail_trust_btn:\s*'[^']*',?/, "scam_detail_trust_btn: 'సురక్షితం',");
  inner = inner.replace(/scam_detail_scam_btn:\s*'[^']*',?/, "scam_detail_scam_btn: 'మోసం',");
  return inner;
});

content = content.replace(/'gu-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace(/scam_detail_trust_btn:\s*'[^']*',?/, "scam_detail_trust_btn: 'સુરક્ષિત',");
  inner = inner.replace(/scam_detail_scam_btn:\s*'[^']*',?/, "scam_detail_scam_btn: 'સ્કેમ',");
  return inner;
});

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('Translations successfully updated with new UI keys.');
