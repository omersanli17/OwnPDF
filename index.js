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
    const originalFileName = path.parse(file.originalname).name; // Extract the original filename without extension
    const newFileName = `${originalFileName}${path.extname(file.originalname)}`;
    cb(null, newFileName);
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
  
    const originalFileName = req.file.originalname; // Use originalname instead of filename
  
    // Parse the original filename and extension
    const { name, ext } = path.parse(originalFileName);
  
    // Create a new filename without the additional extension
    const newFileName = `${name}.${req.file.mimetype.split('/')[1]}`;
  
    const newFile = new File({
      filename: newFileName,
      contentType: req.file.mimetype,
      text: text
    });

    // Optionally store binary data:
    // newFile.data = await fs.readFile(filePath);

    await newFile.save();

    res.send({ message: 'Text extracted and file stored successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error extracting text and storing file' });
  } finally {
    // Cleanup temporary file (optional)
    // await fs.unlink(filePath);
  }
};
// Fetch text from the Mongo Database by filename
app.get('/get-text/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const file = await File.findOne({ filename: fileName });
    
    if (!file) {
      return res.status(404).send({ message: 'File not found' });
    }
    
    res.send({ text: file.text });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error fetching text' });
  }
});

app.post('/extract-image-text', upload.single('file'), async (req, res) => {
  const fileExtension = path.extname(req.file.filename);
  if (!allowedImageExtensions.includes(fileExtension)) {
    return res.status(400).send({ message: 'Invalid file type. Only images are allowed for image text extraction.' });
  }

  // Continue with image text extraction if the extension is valid
  await handleTextExtraction(req, res, extractTextFromImage);
});

app.post('/extract-pdf-text', upload.single('file'), async (req, res) => {
  await handleTextExtraction(req, res, extractTextFromPdf);
});

app.listen(port, () => console.log(`Server listening on port ${port}`));