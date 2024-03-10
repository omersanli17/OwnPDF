const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs/promises');
const mongoose = require('mongoose'); // Added Mongoose


const app = express();
const port = 3000;

const uploadDestination = 'uploads/';
const uploadLimit = 5 * 1024 * 1024; // 5MB limit

const allowedImageExtensions = ['.png', '.jpeg', '.jpg'];
const allowedPdfExtensions = ['.pdf']; // Added allowed PDF extensions

// Upload by name+.extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDestination);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

var upload = multer({ storage: storage });

const mongoURI = 'mongodb://localhost:27017/PDFDatabase'; // Replace with your actual connection string

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Error connecting to MongoDB:', error));

const FileSchema = new mongoose.Schema({ // Define Mongoose schema (optional)
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  text: {
    type: String
  },
  data: { // For storing binary data if needed
    type: Buffer
  }
});

const File = mongoose.model('File', FileSchema);

const extractTextFromImage = async (filePath) => {
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
  return text;
};

const extractTextFromPdf = async (filePath) => {
  const pdfData = await pdfParse(filePath);
  return pdfData.text;
};

const handleTextExtraction = async (req, res, extractionFunction) => {
  try {
    const filePath = path.join(__dirname, uploadDestination, req.file.filename);
    const text = await extractionFunction(filePath);
    res.send({ text });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error extracting text' });
  } finally {
    // Cleanup temporary file
    // Uncomment the line below if you want to delete the file after processing
    // await fs.unlink(filePath);
  }
};

app.post('/extract-image-text', upload.single('file'), async (req, res) => {
  await handleTextExtraction(req, res, extractTextFromImage);
});

app.post('/extract-pdf-text', upload.single('file'), async (req, res) => {
  await handleTextExtraction(req, res, extractTextFromPdf);
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
