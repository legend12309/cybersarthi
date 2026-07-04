const fs = require('fs');
const path = require('path');

const filesToClean = [
  'src/lib/dbServices.ts',
  'src/lib/safeBrowsing.ts',
  'src/lib/sarvam.ts',
  'src/screens/VoiceScreen.tsx',
  'src/screens/BadgesScreen.tsx',
  'src/screens/HomeScreen.tsx',
  'src/screens/QuizScreen.tsx',
  'src/screens/ScamDetailScreen.tsx',
  'src/screens/ScreenshotScannerScreen.tsx'
];

filesToClean.forEach(file => {
  const fullPath = path.join('D:/CyberSaathi', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace console.log, console.warn, console.error with // console.log etc.
    content = content.replace(/^(\s*)console\.(log|warn|error)\(/gm, '$1// console.$2(');
    
    // In sarvam.ts, also reduce the timeout from 45000 to 15000
    if (file.endsWith('sarvam.ts')) {
      content = content.replace(/timeout:\s*45000/g, 'timeout: 15000');
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Cleaned ${file}`);
  }
});
