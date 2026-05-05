const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
let apiKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('GEMINI_API_KEY')) {
    apiKey = line.split('=')[1].trim().replace(/"/g, '');
  }
});

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash" });
    const result = await model.generateContent("Hello");
    console.log("gemini-3.1-flash SUCCESS:", result.response.text());
  } catch (e) {
    console.log("gemini-3.1-flash ERROR:", e.message);
  }
}
run();
