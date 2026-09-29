import { convertPdfToWord } from './pdfToWord';
import { convertPdfToPowerPoint } from './pdfToPowerPoint';
import { convertPdfToExcel } from './pdfToExcel';
import { convertWordToPdf } from './wordToPdf';
import { convertPowerPointToPdf } from './powerpointToPdf';
import { convertExcelToPdf } from './excelToPdf';
import { ConversionResult } from './types';

export {
  convertPdfToWord,
  convertPdfToPowerPoint,
  convertPdfToExcel,
  convertWordToPdf,
  convertPowerPointToPdf,
  convertExcelToPdf,
};
export * from './types';

export async function executeConversion(
  conversionType: string,
  buffer: Buffer,
  filename: string
): Promise<ConversionResult> {
  switch (conversionType) {
    case 'pdf-to-word':
      return convertPdfToWord(buffer, filename);
    case 'pdf-to-powerpoint':
      return convertPdfToPowerPoint(buffer, filename);
    case 'pdf-to-excel':
      return convertPdfToExcel(buffer, filename);
    case 'word-to-pdf':
      return convertWordToPdf(buffer, filename);
    case 'powerpoint-to-pdf':
      return convertPowerPointToPdf(buffer, filename);
    case 'excel-to-pdf':
      return convertExcelToPdf(buffer, filename);
    default:
      throw new Error(`Unsupported conversion type: "${conversionType}".`);
  }
}
