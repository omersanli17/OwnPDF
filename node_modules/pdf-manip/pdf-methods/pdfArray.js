const fs = require("fs").promises;

const pdfArray = async (file) => {
  if (typeof file === Uint8Array) {
    return file;
  }
  const fileURL = URL.createObjectURL(file);
  const data = await fetch(fileURL);
  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
  // or
  // return arrayBuffer;
};

module.exports = pdfArray;
