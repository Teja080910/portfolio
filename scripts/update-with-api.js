const fs = require('fs');
const http = require('http');

const pdfBase64 = fs.readFileSync('/home/teja/Downloads/resume.pdf', 'base64');

const data = JSON.stringify({ fileBase64: pdfBase64 });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/parse-resume',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('parsed_resume.json', responseBody);
    console.log('Successfully saved to parsed_resume.json');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
