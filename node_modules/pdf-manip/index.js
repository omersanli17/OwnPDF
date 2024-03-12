const addBackgroundColor = require("./pdf-methods/addBackgroundColor");
const addMarginPDF = require("./pdf-methods/addMarginPDF.js");
const addPageNumbers = require("./pdf-methods/addPageNumbers");
const breakPDF = require("./pdf-methods/breakPDF");
const compressPDF = require("./pdf-methods/compressPDF");
const createPDF = require("./pdf-methods/createFileDoc");
const decryptPDF = require("./pdf-methods/decryptPDF.js");
const editMetaData = require("./pdf-methods/editMetaData");
const encryptPDF = require("./pdf-methods/encryptPDF");
const flattenPDFForm = require("./pdf-methods/flattenPDFForm");
const imageToPDF = require("./pdf-methods/imageToPDF");
const mergePDF = require("./pdf-methods/mergePDF");
const pdfArray = require("./pdf-methods/pdfArray");
const pdfArrayToBlob = require("./pdf-methods/pdfArrayToBlob");
const removeMetaData = require("./pdf-methods/removeMetaData");
const resizePDF = require("./pdf-methods/resizePDF");
const rotatePDF = require("./pdf-methods/rotatePDF");
const reversePDF = require("./pdf-methods/reversePDF");
const splitPDF = require("./pdf-methods/splitPDF");
const watermarkPDF = require("./pdf-methods/watermarkPDF.js");
const zipToBlob = require("./pdf-methods/zipToBlob");
const test = require("./pdf-methods/test.js");
module.exports = {
  addBackgroundColor,
  addMarginPDF,
  addPageNumbers,
  breakPDF,
  createPDF,
  compressPDF,
  decryptPDF,
  editMetaData,
  encryptPDF,
  flattenPDFForm,
  test,
  imageToPDF,
  mergePDF,
  pdfArray,
  pdfArrayToBlob,
  removeMetaData,
  resizePDF,
  rotatePDF,
  reversePDF,
  splitPDF,
  watermarkPDF,
  zipToBlob,
};
