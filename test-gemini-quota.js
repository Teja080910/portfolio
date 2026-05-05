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

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Respond with the word SUCCESS if you can read this.");
    console.log(modelName + " SUCCESS:", result.response.text());
  } catch (e) {
    console.log(modelName + " ERROR:", e.message);
  }
}

async function run() {
  await testModel("gemini-2.0-flash-lite");
  await testModel("gemini-2.5-flash-lite");
  await testModel("gemini-flash-latest");
}
run();
