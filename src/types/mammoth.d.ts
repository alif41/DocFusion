declare module 'mammoth' {
  export interface ConvertResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export interface ExtractRawTextResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export function convertToHtml(input: { buffer: Buffer }): Promise<ConvertResult>;
  export function extractRawText(input: { buffer: Buffer }): Promise<ExtractRawTextResult>;
}
