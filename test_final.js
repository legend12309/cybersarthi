const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

const { classifyContent } = require('./src/lib/sarvam.ts');
require('dotenv').config({path: '.env'});

async function run() {
  try {
    const res = await classifyContent('Hello, you have won a lottery!', 'hi-IN', 'message');
    console.log('FINAL RESULT:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
