from pdf2docx import Converter
import sys

def convert_pdf_to_docx(pdf_path, docx_path):
    try:
        # Convert PDF to DOCX
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        print(f"Conversion successful. DOCX file saved at {docx_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_pdf_to_docx.py <input_pdf_path> <output_docx_path>")
    else:
        input_pdf_path = sys.argv[1]
        output_docx_path = sys.argv[2]
        convert_pdf_to_docx(input_pdf_path, output_docx_path)
