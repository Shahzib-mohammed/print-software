// ===================================================================
// Document Page Counter & Analyzer
// Analyzes uploaded documents (PDF, DOCX, images) to determine page count
// ===================================================================

import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

export interface DocumentAnalysis {
  pageCount: number;
  format: string;
  isPdf: boolean;
}

/**
 * Accurately counts pages for PDF files, and estimates for other formats.
 */
export async function analyzeDocument(filePath: string): Promise<DocumentAnalysis> {
  const ext = path.extname(filePath).toLowerCase();

  // 1. PDF Files: Exact page count using pdf-lib
  if (ext === ".pdf") {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();
      return {
        pageCount: Math.max(1, pageCount),
        format: "pdf",
        isPdf: true,
      };
    } catch (err) {
      console.warn("Could not parse PDF pages via pdf-lib, falling back to 1:", err);
      return { pageCount: 1, format: "pdf", isPdf: true };
    }
  }

  // 2. Images: 1 page per image
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return {
      pageCount: 1,
      format: ext.replace(".", ""),
      isPdf: false,
    };
  }

  // 3. Word documents (.docx): Standard office estimate (can later plug in LibreOffice headless)
  if ([".docx", ".doc"].includes(ext)) {
    // For local dev, calculate approximate pages by file size heuristic, defaulting to at least 1
    const stats = fs.statSync(filePath);
    const estimatedPages = Math.max(1, Math.ceil(stats.size / 30000));
    return {
      pageCount: estimatedPages,
      format: ext.replace(".", ""),
      isPdf: false,
    };
  }

  // Default fallback
  return { pageCount: 1, format: ext.replace(".", ""), isPdf: false };
}
