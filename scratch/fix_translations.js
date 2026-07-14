const fs = require('fs');
let content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// Replace tab_voice
content = content.replace(/'hi-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'आवाज',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'क्विज मास्टर',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'साइबर सुरक्षा प्रश्नोत्तरी पूरी की।',");
  return inner;
});

content = content.replace(/'mr-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'आवाज',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'क्विज मास्टर',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'सायबर सुरक्षा प्रश्नमंजुषा पूर्ण केली.',");
  return inner;
});

content = content.replace(/'ta-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'குரல்',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'வினாடி வினா மாஸ்டர்',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'சைபர் பாதுகாப்பு வினாடி வினாக்களை முடித்தவர்.',");
  return inner;
});

content = content.replace(/'te-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'వాయిస్',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'క్విజ్ మాస్టర్',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'సైబర్ సెక్యూరిటీ క్విజ్‌లను పూర్తి చేసారు.',");
  return inner;
});

content = content.replace(/'gu-IN': \{([^}]+)\}/s, (match) => {
  let inner = match;
  inner = inner.replace("tab_voice: 'Voice',", "tab_voice: 'અવાજ',");
  inner = inner.replace("badges_quiz_title: 'Quiz Master',", "badges_quiz_title: 'ક્વિઝ માસ્ટર',");
  inner = inner.replace("badges_quiz_desc: 'Completed cybersecurity quizzes.',", "badges_quiz_desc: 'સાયબર સુરક્ષા ક્વિઝ પૂર્ણ કરી.',");
  return inner;
});

fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('Translations updated successfully.');
