declare module 'pdf-parse' {
  interface PDFParseData {
    text?: string
    numpages?: number
    numrender?: number
    info?: any
    metadata?: any
    version?: string
  }

  function pdfParse(data: Buffer | Uint8Array | ArrayBuffer | string, options?: any): Promise<PDFParseData>

  export default pdfParse
}
