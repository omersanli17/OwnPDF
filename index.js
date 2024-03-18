const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fsRoot = require('fs');
const fs = require('fs/promises');
const mongoose = require('mongoose'); // Added Mongoose
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

const app = express();
const port = 3000;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
//
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('Error connecting to MongoDB:', error));
//7 
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
  // Extract file names for the merged record
  const file1Name = path.parse(files[0].originalname).name;
  const file2Name = path.parse(files[1].originalname).name;

  // Create a new PDF document for the merged result
  const mergedPdf = await PDFLibDocument.create();

  // Iterate through each loaded PDF document and append its pages to the merged document
  for (const file of files) {
    const filePath = path.join(__dirname, uploadDestination, file.filename);
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFLibDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  // Generate the merged PDF file as a buffer
  const mergedPdfBytes = await mergedPdf.save();

  // Generate the merged filename based on the original names
  const mergedFileName = `merged_${file1Name}_${file2Name}.pdf`;

  // Save the merged PDF file to the server (optional)
  const mergedFilePath = path.join(__dirname, uploadDestination, mergedFileName);
  await fs.writeFile(mergedFilePath, mergedPdfBytes);

  // Save the merged PDF file information to MongoDB
  const mergedFileRecord = new MergedFile({
    mergedFileName: mergedFileName,
    file1Name: files[0].originalname,
    file2Name: files[1].originalname,
    size: files.reduce((acc, file) => acc + file.size, 0)
  });

  await mergedFileRecord.save();

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

const ConvertedFileSchema = new mongoose.Schema({
  originalFileName: {
    type: String,
    required: true
  },
  convertedFileName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ConvertedFile = mongoose.model('ConvertedFile', ConvertedFileSchema);

app.post('/convert-pdf-to-docx', upload.single('file'), async (req, res) => {
  const pdfFilePath = path.join(__dirname, uploadDestination, req.file.filename);
  const docxFileName = `converted_docx_${req.file.filename}.docx`;
  const docxFilePath = path.join(__dirname, uploadDestination, docxFileName);
  
  // Call the python script to convert PDF to DOCX
  const command = `python pdf2docx_converter.py ${pdfFilePath} ${docxFilePath}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error converting PDF to DOCX: ${error.message}`);
      res.status(500).send({ message: 'Error converting PDF to DOCX' });
    } else {
      // Save the converted file information to MongoDB
      const convertedFileRecord = new ConvertedFile({
        originalFileName: req.file.originalname,
        convertedFileName: docxFileName
      });
      convertedFileRecord.save();
      
      console.log(`PDF converted to DOCX. DOCX file saved at ${docxFilePath}`);
      res.send({ message: 'PDF converted to DOCX successfully!', docxFilePath });
    }
  });
});

// EXCEL TO PDF
const ConvertedExcelFileSchema = new mongoose.Schema({
  originalFileName: {
    type: String,
    required: true
  },
  convertedFileName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ConvertedExcelFile = mongoose.model('ConvertedExcelFile', ConvertedExcelFileSchema);

app.post('/convert-excel-to-pdf', upload.single('file'), async (req, res) => {
  const excelFilePath = path.join(__dirname, uploadDestination, req.file.filename);
  const pdfFileName = `converted_pdf_${req.file.filename}.pdf`;
  const pdfFilePath = path.join(__dirname, uploadDestination, pdfFileName);

  const browser = await puppeteer.launch({ headless: true, slowMo: 500 });
  const page = await browser.newPage();

  const wb = xlsx.readFile(excelFilePath);
  const sheetName = wb.SheetNames[0];
  const sheetValue = wb.Sheets[sheetName];
  const htmlData = xlsx.utils.sheet_to_html(sheetValue);

  fsRoot.writeFile('excelToHtml.html', htmlData, function (err) {
    console.log('Data is successfully converted');
  });

  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
  await page.goto('file://' + path.join(__dirname, 'excelToHtml.html'), { waitUntil: 'networkidle2' }).catch(function () {
    console.log('Error while loading the file');
  });

  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
  await page.pdf({ path: pdfFilePath, format: 'A4', printBackground: true });

  await browser.close();

    // WHEN IT SUCCESSFULLY CONVERTS, DELETE HTML FILE AND, SAVE THE FILE TO MONGODB

  fsRoot.unlink('excelToHtml.html', function (err) {
    if (err) throw err;
    console.log('File deleted!');
  });

  const convertedExcelFileRecord = new ConvertedExcelFile({
    originalFileName: req.file.originalname,
    convertedFileName: pdfFileName
  });

  await convertedExcelFileRecord.save();

  res.send({ message: 'Excel converted to PDF successfully!', pdfFilePath });
});

// PDF TO POWERPOINT (PPTX) 
const ConvertedPPTXFileSchema = new mongoose.Schema({
  originalFileName: {
    type: String,
    required: true
  },
  convertedFileName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ConvertedPPTXFile = mongoose.model('ConvertedPPTXFile', ConvertedPPTXFileSchema);

app.post('/convert-pdf-to-pptx', upload.single('file'), async (req, res) => {
  const pdfFilePath = path.join(__dirname, uploadDestination, req.file.filename);
  const pptxFileName = `converted_pptx_${req.file.filename}.pptx`;
  const pptxFilePath = path.join(__dirname, uploadDestination, pptxFileName);

  // Call the python script to convert PDF to PPTX
  const command = `python pdf2pptx_converter.py ${pdfFilePath} ${pptxFilePath}`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send({ message: 'An error occurred during PDF to PPTX conversion.' });
    }
    console.log(stdout);
    console.log(stderr);

    // Save the converted PPTX file information to MongoDB
    const convertedPPTXFileRecord = new ConvertedPPTXFile({
      originalFileName: req.file.originalname,
      convertedFileName: pptxFileName
    });
    await convertedPPTXFileRecord.save();

    // Respond with the converted PPTX file path
    res.send({
      message: 'PDF converted to PPTX successfully!',
      pptxFilePath: `/uploads/${path.basename(pptxFilePath)}`,
    });
  });
});

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

    // Respond with a success message or the merged PDF file path
    res.send({
      message: 'PDF files merged successfully!',
      mergedFilePath: `/uploads/${path.basename(mergedFilePath)}`, // Adjust this path accordingly
      mergedFileRecord: path.basename(mergedFilePath) // Include the merged file record in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error merging PDF files.' });
  }
});


const CompressedFileSchema = new mongoose.Schema({
  uncompressedFilename: {
    type: String,
    required: true
  },
  compressedFilename: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CompressedFile = mongoose.model('CompressedFile', CompressedFileSchema);

app.post('/compress-pdf', upload.single('file'), async (req, res) => {
  const fileExtension = path.extname(req.file.filename);
  if (!allowedPdfExtensions.includes(fileExtension)) {
    return res.status(400).send({ message: 'Invalid file type. Only PDF files are allowed for compression.' });
  }

  const uncompressedFilePath = path.join(__dirname, uploadDestination, req.file.filename);
  const compressedFileName = `compressed_${req.file.filename}`;
  const compressedFilePath = path.join(__dirname, uploadDestination, compressedFileName);

  const command = `/usr/local/bin/shrinkpdf.sh -o ${compressedFilePath} ${uncompressedFilePath}`;
  exec(command, async (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(error || stderr);
      return res.status(500).send({ message: 'Error compressing PDF file.' });
    }

    const uncompressedFileSize = fsRoot.statSync(uncompressedFilePath).size;
    const compressedFileSize = fsRoot.statSync(compressedFilePath).size;

    if (compressedFileSize >= uncompressedFileSize) {
      fs.unlinkSync(compressedFilePath);
      return res.status(500).send({ message: 'Error compressing PDF file. Compressed file is not smaller.' });
    }

    // Save information to MongoDB
    try {
      const fileRecord = await CompressedFile.create({
        uncompressedFilename: req.file.filename,
        compressedFilename: compressedFileName
      });

      // Respond with the compressed file path and MongoDB document ID
      res.send({
        message: 'PDF file compressed successfully!',
        compressedFilePath: `/uploads/${path.basename(compressedFilePath)}`,
        fileId: fileRecord._id
      });
    } catch (mongoError) {
      console.error(mongoError);
      return res.status(500).send({ message: 'Error saving file information to MongoDB.' });
    }
  });
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