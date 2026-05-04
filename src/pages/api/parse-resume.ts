import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileBase64 } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const pdfBuffer = Buffer.from(fileBase64, 'base64');
    
    // Robustly bypass Turbopack require rewriting
    const pdfParseModule = eval("require('pdf-parse')");
    let parseFunc = pdfParseModule;
    if (typeof parseFunc !== 'function') {
      parseFunc = pdfParseModule.default || pdfParseModule.PDFParse;
    }
    
    if (typeof parseFunc !== 'function') {
      throw new Error('Failed to resolve pdf-parse function. Exports: ' + Object.keys(pdfParseModule).join(', '));
    }

    let pdfData;
    try {
      if (parseFunc.prototype && parseFunc.prototype.parse) {
        const p = new parseFunc();
        pdfData = await p.parse(pdfBuffer);
      } else {
        pdfData = await parseFunc(pdfBuffer);
      }
    } catch (e: any) {
      throw new Error('PDF parsing error: ' + e.message);
    }

    const resumeText = pdfData.text;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in your .env file. Please add it to use the AI extraction.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract the following information from the resume text provided below.
      Format the response STRICTLY as a JSON object matching this TypeScript interface exactly, with NO markdown formatting around the output (just raw JSON):
      {
        "about": { "type": "string (e.g., Full Stack Developer)", "list": ["string (bullets)"] },
        "skills": [ { "skilltype": "string (e.g., Frontend, Backend)", "skills": ["string"] } ],
        "experience": [ { "type": "string (Full-Time, Internship)", "location": "string", "duration": "string", "role": "string", "decription": "string" } ],
        "education": [ { "name": "string", "duration": "string", "course": "string", "branch": "string", "keyachivements": "string" } ],
        "projects": [ { "name": "string", "description": "string", "duration": "string", "weblink": "string", "skills": ["string"] } ],
        "certificates": [ { "name": "string", "duration": "string", "link": "string" } ]
      }
      
      Resume Text:
      ${resumeText}
    `;

    const result = await model.generateContent(prompt);
    
    let jsonString = result.response.text();
    if (!jsonString) {
      throw new Error("Failed to generate JSON from LLM: Empty string");
    }

    jsonString = jsonString.replace(/^```json/g, '').replace(/```$/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
