const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const port = 3000;

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// Route for uploading a PDF file
app.post('/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    // Check if a file was provided
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Extract text from the uploaded PDF file
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    
    // Send the extracted text as the response
    res.json({ text: data.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
