const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix duplicate activeOpacity
      // We look for <TouchableOpacity activeOpacity={0.7} ... activeOpacity={X}
      // and remove the activeOpacity={0.7} 
      
      // We will parse it simply: if a line or block contains both activeOpacity={0.7} and another activeOpacity
      // Actually, let's just use a regex that captures the tag from <TouchableOpacity to >
      const newContent = content.replace(/<TouchableOpacity([^>]+)>/g, (match, inner) => {
        const matches = inner.match(/activeOpacity={[^}]+}/g);
        if (matches && matches.length > 1) {
          // Remove the first activeOpacity={0.7}
          let newInner = inner.replace(/\s*activeOpacity={0\.7}/, '');
          return `<TouchableOpacity${newInner}>`;
        }
        return match;
      });
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Fixed ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done.');
