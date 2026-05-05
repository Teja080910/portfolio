const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfBuffer = fs.readFileSync('/home/teja/Downloads/resume.pdf');

pdfParse(pdfBuffer).then(function(data) {
    console.log(data.text);
}).catch(function(err) {
    console.error(err);
});
