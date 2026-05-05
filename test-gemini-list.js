const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
let apiKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('GEMINI_API_KEY')) {
    apiKey = line.split('=')[1].trim().replace(/"/g, '');
  }
});

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
