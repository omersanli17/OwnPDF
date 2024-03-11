const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs/promises');
const mongoose = require('mongoose'); // Added Mongoose
const { PDFDocument: PDFLibDocument } = require('pdf-lib');


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

const MergedFileSchema = new mongoose.Schema({
  mergedFileName: {
    type: String,
    required: true
  },
  file1Name: {
    type: String,
    required: true
  },
  file2Name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
});

const MergedFile = mongoose.model('MergedFile', MergedFileSchema);

const mergePDFs = async (files) => {
  // Load the PDF files
  const pdfDocuments = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(__dirname, uploadDestination, file.filename);
      const pdfBytes = await fs.readFile(filePath);
      return PDFLibDocument.load(pdfBytes);
    })
  );

  // Create a new PDF document for the merged result
  const mergedPdf = await PDFLibDocument.create();

  // Iterate through each loaded PDF document and append its pages to the merged document
  for (const pdfDoc of pdfDocuments) {
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  // Generate the merged PDF file as a buffer
  const mergedPdfBytes = await mergedPdf.save();

  // Save the merged PDF file to the server (optional)
  const mergedFilePath = path.join(__dirname, uploadDestination, 'merged.pdf');
  await fs.writeFile(mergedFilePath, mergedPdfBytes);

  // Return the merged PDF file path
  return mergedFilePath;
};


// SPLIT PDF
const SplitFileSchema = new mongoose.Schema({
  splitFileName: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  startPage: {
    type: Number,
    required: true
  },
  endPage: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
});

const SplitFile = mongoose.model('SplitFile', SplitFileSchema);

const splitPDF = async (req, filePath, startPage, endPage) => {
  const pdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const newPdf = await PDFLibDocument.create();
  const pages = await newPdf.copyPages(pdfDoc, [startPage - 1, endPage - 1]);
  pages.forEach((page) => newPdf.addPage(page));
  const newPdfBytes = await newPdf.save();

  // Parse the original filename and extension
  const { name, ext } = path.parse(req.file.originalname);

  // Save the split PDF file to the server (optional)
  const splitFileName = `splitted_${name}_startPage${startPage}_endPage${endPage}.pdf`;
  const newFilePath = path.join(__dirname, uploadDestination, splitFileName);
  await fs.writeFile(newFilePath, newPdfBytes);

  // Save split file information to MongoDB
  const splitFileRecord = new SplitFile({
    splitFileName: splitFileName,
    originalFileName: req.file.originalname,
    startPage: startPage,
    endPage: endPage,
    size: newPdfBytes.length
  });

  await splitFileRecord.save();

  return newFilePath;
};


app.post('/split-pdf', upload.single('file'), async (req, res) => {
  const { startPage, endPage } = req.body;
  if (!startPage || !endPage) {
    return res.status(400).send({ message: 'Please provide start and end page numbers for splitting the PDF.' });
  }
  if (startPage > endPage) {
    return res.status(400).send({ message: 'Start page cannot be greater than end page.' });
  }
  const filePath = path.join(__dirname, uploadDestination, req.file.filename);
  const newFilePath = await splitPDF(req, filePath, startPage, endPage);
  res.send({ message: 'PDF split successfully!', newFilePath });
});

app.post('/merge-pdfs', upload.array('files', 2), async (req, res) => {
  try {
    // Ensure that at least two PDF files are provided for merging
    if (!req.files || req.files.length < 2) {
      return res.status(400).send({ message: 'Please provide at least two PDF files for merging.' });
    }

    // Call the mergePDFs function with the uploaded files
    const mergedFilePath = await mergePDFs(req.files);

    // Extract file names for the merged record
    const file1Name = req.files[0].originalname;
    const file2Name = req.files[1].originalname;
    
    // Create a new MergedFile document
    const mergedFileRecord = new MergedFile({
      mergedFileName: path.basename(mergedFilePath),
      file1Name,
      file2Name,
      size: req.files.reduce((acc, file) => acc + file.size, 0)
    });

    // Save the merged file record to the MongoDB database
    await mergedFileRecord.save();

    // Respond with a success message or the merged PDF file path
    res.send({
      message: 'PDF files merged successfully!',
      mergedFilePath: '/uploads/merged.pdf', // Adjust this path accordingly
      mergedFileRecord: mergedFileRecord // Include the merged file record in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error merging PDF files.' });
  }
});

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