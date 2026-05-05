const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Read API key from .env manually
const env = fs.readFileSync('.env', 'utf-8');
let apiKey = '';
env.split('\n').forEach(line => {
  if (line.startsWith('GEMINI_API_KEY')) {
    apiKey = line.split('=')[1].trim().replace(/"/g, '');
  }
});

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello");
    console.log(modelName + " SUCCESS:", result.response.text());
  } catch (e) {
    console.log(modelName + " ERROR:", e.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-flash-latest");
  await testModel("gemini-1.5-pro");
  await testModel("gemini-pro");
}
run();
