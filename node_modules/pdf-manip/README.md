PDF Manip: A Simple and Powerful PDF Manipulation Tool
======================================================

PDF Manip is a simple and powerful tool for boosting your PDF tasks. Built on top of pdf-lib, it adds cool features like color backgrounds, margins, page numbers, and more. You can easily break, create, and compress PDFs, decrypt, edit, and encrypt securely, flatten forms, convert images, merge files, and handle arrays. Plus, you can manage metadata, resize, rotate, reverse pages, split, and watermark PDFs effortlessly on the client side without the need of any server. You can even convert zip files to Blob for smooth workflows.

Features
--------

* Break, create, and compress PDFs
* Decrypt, edit, and encrypt securely
* Flatten forms, convert images, merge files, and handle arrays
* Manage metadata, resize, rotate, reverse pages, split, and watermark PDFs
* Convert zip files to Blob
* Add color backgrounds, margins, and page numbers

Installation
------------

To install the latest stable version:

- With npm

```bash
npm install --save pdf-manip
```

- With yarn

```bash
yarn add pdf-manip
```

This assumes you're using [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/lang/en/) as your package manager.


## Methods
Here are some of the methods available in PDF Manip:

- [addBackgroundColor(options)](#add-a-background-color-to-a-pdf): Add a color background to a PDF page.
- [addMargins(options)](#add-margin-to-a-pdf): Add margin to a PDF.
- [addPageNumbers(options)](#add-page-numbers-to-a-pdf): Add page numbers to a PDF.
- [breakPDF(options)](#break-a-pdf-into-multiple-files): Break a PDF into multiple files.
- [Modify Existing PDFs Get PDFDocument Object](#modify-existing-pdfs-Get-PDFDocument-Object)
    - [Empty PDF Document](#Empty-PDF-Document)
    - [PDF Document From File](#PDF-Document-From-File)
    - [PDF Document From Unit8Array/ArrayBuffer](#PDF-Document-From-Unit8Array/ArrayBuffer)
- [compressPDF(options)](#compress-a-pdf): Compress a PDF.

- [decryptPDF(options)](#decrypt-a-pdf): Decrypt a PDF.
- [encryptPDF(options)](#encrypt-a-pdf): Encrypt a PDF.
- [flattenForms(options)](#flatten-pdf-forms): Flatten forms in a PDF.
- [convertImageToPDF(options)](#jpg-to-pdf): Convert an image to a PDF.
- [mergePDFs(options)](#merge-pdf): Merge multiple PDFs into one.
- [resizePDF(options)](#resize-pdf): Resize a PDF.
- [rotatePDF(options)](#rotate-pdf): Rotate a PDF.
- [reversePages(options)](#reverse-the-order-of-pages-in-a-pdf): Reverse the order of pages in a PDF.
- [splitPDF(options)](#split-pdf): Split a PDF into multiple files.
- [watermarkPDF(options)](#add-awatermark-to-a-pdf): Add a watermark to a PDF.
- [convertZipToBlob(options)](#convert-a-zip-file-to-blob): Convert a zip file to Blob.

## Usage
To use functionalities available in ***pdf-manip***, import [methods](#methods) from the index.js(in pdf-manip) file:
```js
const { methodName1, methodName2, ... } = require('pdf-manip');
```


### Add a Background Color to a PDF 
```js
import {addBackgroundColor} from "pdf-manip";
const bgColorAddedPDF = await addBackgroundColor({
  pdfBytes: yourPdfBytes,
  pageNumber: 1,
  color: '#ff0000',
});
```

### Add Margin to a PDF
```js
import { addMarginPDF } from "pdf-manip";

const AddedMarginPDFDocument = await addMarginPDF(
  fileDoc,
  marginMillimeter,
  degree
);
/*
fileDoc is a PDFDocument Object
marginMillimeter? : optional paramenter : array of length 4
  marginMillimeter[0] -> Left
  marginMillimeter[1] -> Top
  marginMillimeter[2] -> Right
  marginMillimeter[3] -> Bottom
degree? rotate pdf angle : integer
*/
```

### Add Page Numbers to PDF

```js
import { addPageNumbers } from "pdf-manip";

const PDFDocumentWithPageNumbers = await addPageNumbers(
  fileDoc,
  pageNumberPosition,
  margin,
  startingPage,
  endingPage,
  startingNumber,
  textSize
);
/*
fileDoc is a PDFDocument Object
pageNumberPosition? : optional : is one of the following string
  - b-l : Bottom Left
  - b-c : Bottom Center : Default
  - b-r : Bottom Right
  - t-l : Top Left
  - t-c : Top Center
  - t-r : Top Right
margin? : optional : is one of the following string
  - Recommended : Default
  - Small
  - Big
startingPage? : optional : is a integer should be >=1 and <=max pages in pdf
endingPage? : optional : is a integer should be >=1 and <=max pages in pdf and >= startingPage
startingNumber? : optional : is a integer denoting the first page number : 1 by default
textSize? : optional 16 by default is a integer
*/
```

### Break a PDF Into Multiple PDF Files

```js
import { breakPDF } from "pdf-manip";

const BreakPDFDocumentsArray = await breakPDF(
  fileDoc,
  pagesInEachFile,
  haveLastPDF,
  degree,
  breakRange
);
/*
fileDoc is a PDFDocument Object
pagesInEachFile is a integer denoting Number of Pages in Each Broken PDF
haveLastPDF is a boolean to whether return the last pdf document irrespective of maxPages
degree? is a optional parameter and integer
breakRange? is a optional paramenter that is a array of two integers [start,stop] that splits the pdf(both inclisive) before breaking it
*/
```

## Compress a PDF
```js
import { compressPDF } from "pdf-manip";
const compressedPdf = await compressPDF(file, quality);
// Quality is between 0 and 1. It represents the desired compression level.
```



### Modify Existing PDFs Get PDFDocument Object

To Modify Esisting PDF Files You Need to First Convert It Into a PDFDocument Object

#### Empty PDF Document

```js
import { createFileDoc } from "pdf-manip";

const EmptyPDFDocument = await createFileDoc.EmptyPDFDocument();
```

#### PDF Document From File

```js
import { createFileDoc } from "pdf-manip";

const PDFDocument = await createFileDoc.PDFDocumentFromFile(file); 
// file is a HTML File Object from input tag
```

#### PDF Document From Unit8Array/ArrayBuffer

```js
import { createFileDoc } from "pdf-manip";

const PDFDocument = await createFileDoc.PDFDocumentFromPDFArray(fileArray); 
// fileArray is a Unit8Array/ArrayBuffer
```

### Decrypt a PDF
```js
import { decryptPDF } from "pdf-manip";
const decryptedPDF = await decryptPDF(encryptedFile, password);
```

### Edit Metadata of a PDF
***options***: An object containing the new metadata values. The following properties are supported:<br>
`title`: The title of the PDF document.<br>
`subject`: The subject of the PDF document.<br>
`author`: The author of the PDF document.<br>
`creator`: The creator of the PDF document.<br>
`producer`: The producer of the PDF document.<br>
`keywords`: The keywords associated with the PDF document.<br>
`documentCreationDate`: The date and time the PDF document was created.<br>
`documentModificationDate`: The date and time the PDF document was last modified.<br>

### Encrypt a PDF
> Note: Before you encrypt your pdf make sure that it doesn't contain any text or images
```js
import { encryptPDF } from "pdf-manip";
const encryptedPdf = await encryptPDF(fileDoc, password);

// The output will be a new file with the same name as the input but with .epdf
```

### Flatten PDF Forms

```js
import { flattenPDFForm } from "pdf-manip";

const PDFDocumentWithFormsFlattened = await flattenPDFForm(fileDoc);
/*
fileDoc is a PDFDocument Object
*/
```

### JPG To PDF

```js
import { imageToPDF } from "pdf-manip";

const PDFDocumentFromJPG = await imageToPDF(
  image,
  pageNumberPosition,
  margin,
  startingPage,
  endingPage,
  startingNumber,
  textSize
);
/*
image is a base64 data string
pageSize? : optional : is one of the following string
  - Same as Image
  - 2A0 , 4A0 , A[0-10] , B[0-10] , C[0-9] , Executive , Folio , Legal , Letter , RA[0-4] , SR[0-4] , Tabloid 
pageOrientation? : optional : should pe portrait in case of Same as Image
imagePosition? : optional : should be Start in case of Same as Image
degree? : rotate created PDF
marginMillimeter? : optional paramenter : array of length 4
  marginMillimeter[0] -> Left
  marginMillimeter[1] -> Top
  marginMillimeter[2] -> Right
  marginMillimeter[3] -> Bottom
*/
```

### Merge PDF

```js
import { mergePDF } from "pdf-manip";

const MergedPDFDocument = await mergePDF(filesDocArray); // filesDocArray is a Array of PDFDocument Object
```

### Resize PDF

```js
import { resizePDF } from "pdf-manip";

const PDFDocumentWithFormsFlattened = await resizePDF(
  fileDoc,
  size,
  orientation,
  position,
  degree
);
/*
fileDoc is a PDFDocument Object
size? optional paramenter : string : 2A0 , 4A0 , A[0-10] , B[0-10] , C[0-9] , Executive , Folio , Legal , Letter , RA[0-4] , SR[0-4] , Tabloid 
orientation? optional paramenter : string : Portrait or Landscape
position? optional parameter - Where The Content Should Be : string : Start , Center , End
degree? rotate pdf angle : integer
*/
```

### Rotate PDF

```js
import { rotatePDF } from "pdf-manip";

const RotatedPDFDocument = await rotatePDF(fileDoc, degrees);
/*
fileDoc is a PDFDocument Object
degrees is a integer
*/
```

### Split PDF

```js
import { splitPDF } from "pdf-manip";

const SplitPDFDocument = await splitPDF(fileDoc, range, degree);
/*
fileDoc is a PDFDocument Object
range : Page Numbers(both inclusive) is array of two integers - [start,stop]
degree? is a optional parameter and integer
*/
```

### Add a Watermark to a PDF
```js
import { watermarkPDF } from "pdf-manip";
const watermarkedPDF = await watermarkPDF(fileDoc, watermarkText);
// watermarkText: String (optional), default value is 'CONFIDENTIAL'
```

## Convert a Zip File to Blob
```js
import { zipToBlob } from "pdf-manip";
const blobFile = await zipToBlob(zipBuffer);
/* 
The zipToBlob function expects a JSZip object as its input. 
JSZip is a JavaScript library that provides methods for creating, reading, and editing .zip files. 
*/
```


## Contributing
We welcome contributions to PDF Manip! Please submit a [pull request](https://github.com/geekymehta/pdf-manip/pulls) with your changes.

## License
PDF Manip is released under the ***MIT License***.

## Support
If you have any questions or need help with PDF Manip, please open an [issue](https://github.com/geekymehta/pdf-manip/issues) on [GitHub](https://github.com/geekymehta/pdf-manip).

## Bugs
If you find any bugs, please open an [issue](https://github.com/geekymehta/pdf-manip/issues) on [GitHub](https://github.com/geekymehta/pdf-manip).

## Acknowledgements
PDF Manip is built on top of [pdf-lib](https://pdf-lib.js.org/).

## Changelog
***1.0.0: Initial release***
Don't hesitate to reach out if you need any further information or clarification. Happy coding!