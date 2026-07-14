const fs = require('fs');
let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Replace translations block by block with correct exact target strings
content = content.replace(/'hi-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'आवाज',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'क्विज मास्टर',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'साइबर सुरक्षा प्रश्नोत्तरी पूरी की।',");
  inner = inner.replace("scam_detail_trust_btn: 'भरोसा / सुरक्षित',", "scam_detail_trust_btn: 'सुरक्षित',");
  inner = inner.replace("scam_detail_scam_btn: 'ब्लॉक / स्कैम',", "scam_detail_scam_btn: 'स्कैम',");
  return inner;
});

content = content.replace(/'mr-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'आवाज',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'क्विज मास्टर',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'सायबर सुरक्षा प्रश्नमंजुषा पूर्ण केली.',");
  inner = inner.replace("scam_detail_trust_btn: 'विश्वास / सुरक्षित',", "scam_detail_trust_btn: 'सुरक्षित',");
  inner = inner.replace("scam_detail_scam_btn: 'ब्लॉक / स्कॅम',", "scam_detail_scam_btn: 'स्कॅम',");
  return inner;
});

content = content.replace(/'ta-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'குரல்',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'வினாடி வினா மாஸ்டர்',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'சைபர் பாதுகாப்பு வினாடி வினாக்களை முடித்தவர்.',");
  inner = inner.replace("scam_detail_trust_btn: 'நம்பிக்கை / பாதுகாப்பானது',", "scam_detail_trust_btn: 'பாதுகாப்பானது',");
  inner = inner.replace("scam_detail_scam_btn: 'தடு / மோசடி',", "scam_detail_scam_btn: 'மோசடி',");
  return inner;
});

content = content.replace(/'te-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'వాయిస్',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'క్విజ్ మాస్టర్',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'సైబర్ సెక్యూరిటీ క్విజ్‌లను పూర్తి చేసారు.',");
  inner = inner.replace("scam_detail_trust_btn: 'నమ్మకం / సురక్షితం',", "scam_detail_trust_btn: 'సురక్షితం',");
  inner = inner.replace("scam_detail_scam_btn: 'బ్లాక్ / మోసం',", "scam_detail_scam_btn: 'మోసం',");
  return inner;
});

content = content.replace(/'gu-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'અવાજ',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'ક્વિઝ માસ્ટર',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'સાયબર સુરક્ષા ક્વિઝ પૂર્ણ કરી.',");
  inner = inner.replace("scam_detail_trust_btn: 'વિશ્વાસ / સુરક્ષિત',", "scam_detail_trust_btn: 'સુરક્ષિત',");
  inner = inner.replace("scam_detail_scam_btn: 'બ્લોક / સ્કેમ',", "scam_detail_scam_btn: 'સ્કેમ',");
  return inner;
});

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('Translations updated successfully.');
