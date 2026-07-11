const fs = require('fs');
const path = require('path');

const targetFile = 'D:/CyberSaathi/src/lib/translations.ts';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(/badges_sentry_desc: (.*),/g, (match, p1) => {
    return `badges_sentry_desc: ${p1},\n    badges_quiz_title: 'Quiz Master',\n    badges_quiz_desc: 'Completed cybersecurity quizzes.',`;
});

fs.writeFileSync(targetFile, content);
console.log('Successfully updated translations.');
