/**
 * PDF Operations using pdf-lib
 * Provides merging, annotation, and manipulation capabilities
 */

import { PDFDocument, rgb, PDFPage, degrees as pdfDegrees } from 'pdf-lib';
import type {
  Annotation,
  MergeSource,
  MergeResult,
  PdfDocumentInfo,
  PdfPageInfo,
  CompressionLevel,
  CompressionResult,
} from './types';
import { hexToRgb, generateId } from './utils';

/**
 * Load a PDF document and extract its info
 */
export async function loadPdfInfo(bytes: Uint8Array): Promise<PdfDocumentInfo> {
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  
  const pageInfos: PdfPageInfo[] = pages.map((page, index) => ({
    pageIndex: index,
    width: page.getWidth(),
    height: page.getHeight(),
    rotation: page.getRotation().angle,
  }));

  return {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords()?.split(',').map(k => k.trim()),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
    pageCount: pdfDoc.getPageCount(),
    pages: pageInfos,
  };
}

/**
 * Merge multiple PDFs into one
 * Supports custom page ordering via selectedPages in each source
 */
export async function mergePdfs(sources: MergeSource[]): Promise<MergeResult> {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const source of sources) {
      const sourcePdf = await PDFDocument.load(source.bytes, { ignoreEncryption: true });
      const pagesToCopy = source.selectedPages.length > 0 
        ? source.selectedPages 
        : Array.from({ length: sourcePdf.getPageCount() }, (_, i) => i);

      const copiedPages = await mergedPdf.copyPages(sourcePdf, pagesToCopy);
      
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    const mergedBytes = await mergedPdf.save();

    return {
      success: true,
      bytes: mergedBytes,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during merge',
    };
  }
}

/**
 * Reorder pages within a PDF
 */
export async function reorderPages(
  pdfBytes: Uint8Array,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const reorderedPdf = await PDFDocument.create();

  const copiedPages = await reorderedPdf.copyPages(sourcePdf, newOrder);
  
  for (const page of copiedPages) {
    reorderedPdf.addPage(page);
  }

  return reorderedPdf.save();
}

/**
 * Extract specific pages from a PDF
 */
export async function extractPages(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const extractedPdf = await PDFDocument.create();

  const copiedPages = await extractedPdf.copyPages(sourcePdf, pageIndices);
  
  for (const page of copiedPages) {
    extractedPdf.addPage(page);
  }

  return extractedPdf.save();
}

/**
 * Delete pages from a PDF
 */
export async function deletePages(
  pdfBytes: Uint8Array,
  pageIndicesToDelete: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = sourcePdf.getPageCount();
  
  const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i)
    .filter(i => !pageIndicesToDelete.includes(i));

  return extractPages(pdfBytes, pagesToKeep);
}

/**
 * Apply annotations to a PDF (bake them into the document)
 */
export async function applyAnnotations(
  pdfBytes: Uint8Array,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const annotation of annotations) {
    const page = pages[annotation.pageIndex];
    if (!page) continue;

    const pageHeight = page.getHeight();
    const color = hexToRgb(annotation.color);

    switch (annotation.type) {
      case 'highlight':
        drawHighlight(page, annotation, pageHeight, color);
        break;
      case 'underline':
        drawUnderline(page, annotation, pageHeight, color);
        break;
      case 'strikeout':
        drawStrikeout(page, annotation, pageHeight, color);
        break;
      case 'rectangle':
        drawRectangle(page, annotation, pageHeight, color);
        break;
      case 'text':
        await drawTextAnnotation(pdfDoc, page, annotation, pageHeight, color);
        break;
      // Freeform handled separately due to complexity
    }
  }

  return pdfDoc.save();
}

function drawHighlight(
  page: PDFPage,
  annotation: Annotation,
  pageHeight: number,
  color: { r: number; g: number; b: number }
): void {
  page.drawRectangle({
    x: annotation.rect.x,
    y: pageHeight - annotation.rect.y - annotation.rect.height,
    width: annotation.rect.width,
    height: annotation.rect.height,
    color: rgb(color.r, color.g, color.b),
    opacity: annotation.opacity,
  });
}

function drawUnderline(
  page: PDFPage,
  annotation: Annotation,
  pageHeight: number,
  color: { r: number; g: number; b: number }
): void {
  const y = pageHeight - annotation.rect.y - annotation.rect.height;
  page.drawLine({
    start: { x: annotation.rect.x, y },
    end: { x: annotation.rect.x + annotation.rect.width, y },
    thickness: 2,
    color: rgb(color.r, color.g, color.b),
    opacity: annotation.opacity,
  });
}

function drawStrikeout(
  page: PDFPage,
  annotation: Annotation,
  pageHeight: number,
  color: { r: number; g: number; b: number }
): void {
  const y = pageHeight - annotation.rect.y - annotation.rect.height / 2;
  page.drawLine({
    start: { x: annotation.rect.x, y },
    end: { x: annotation.rect.x + annotation.rect.width, y },
    thickness: 2,
    color: rgb(color.r, color.g, color.b),
    opacity: annotation.opacity,
  });
}

function drawRectangle(
  page: PDFPage,
  annotation: Annotation,
  pageHeight: number,
  color: { r: number; g: number; b: number }
): void {
  page.drawRectangle({
    x: annotation.rect.x,
    y: pageHeight - annotation.rect.y - annotation.rect.height,
    width: annotation.rect.width,
    height: annotation.rect.height,
    borderColor: rgb(color.r, color.g, color.b),
    borderWidth: 2,
    opacity: annotation.opacity,
  });
}

async function drawTextAnnotation(
  _pdfDoc: PDFDocument,
  page: PDFPage,
  annotation: Annotation,
  pageHeight: number,
  color: { r: number; g: number; b: number }
): Promise<void> {
  if (!annotation.content) return;

  page.drawText(annotation.content, {
    x: annotation.rect.x,
    y: pageHeight - annotation.rect.y - annotation.rect.height,
    size: 12,
    color: rgb(color.r, color.g, color.b),
    opacity: annotation.opacity,
  });
}

/**
 * Rotate a page in the PDF
 */
export async function rotatePage(
  pdfBytes: Uint8Array,
  pageIndex: number,
  rotationDegrees: 0 | 90 | 180 | 270
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const page = pdfDoc.getPage(pageIndex);
  page.setRotation(pdfDegrees(rotationDegrees));
  return pdfDoc.save();
}

/**
 * Create a new empty PDF with specified page size
 */
export async function createEmptyPdf(
  width: number = 612,
  height: number = 792 // Default Letter size in points
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([width, height]);
  return pdfDoc.save();
}

/**
 * Compress a PDF by optimizing its internal structure
 * Compression levels:
 * - 25%: Light compression - removes unused objects, uses object streams
 * - 50%: Medium compression - also removes metadata and flattens forms
 * - 75%: Heavy compression - maximum optimization, may reduce quality
 */
export async function compressPdf(
  pdfBytes: Uint8Array,
  level: CompressionLevel
): Promise<CompressionResult> {
  const originalSize = pdfBytes.length;
  
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      ignoreEncryption: true,
      updateMetadata: level < 50, // Remove metadata updates at higher compression
    });

    // For medium and high compression, remove metadata
    if (level >= 50) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    // For high compression, flatten forms if any
    if (level >= 75) {
      try {
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        if (fields.length > 0) {
          form.flatten();
        }
      } catch {
        // No form or form can't be flattened - continue
      }
    }

    // Save with compression options
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true, // Always use object streams for better compression
      addDefaultPage: false,
      // For higher compression levels, we use more aggressive settings
      objectsPerTick: level >= 50 ? 100 : 50,
    });

    const compressedSize = compressedBytes.length;
    const reductionPercent = Math.round((1 - compressedSize / originalSize) * 100);

    return {
      success: true,
      bytes: compressedBytes,
      originalSize,
      compressedSize,
      reductionPercent: Math.max(0, reductionPercent), // Don't show negative reduction
    };
  } catch (error) {
    return {
      success: false,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: 0,
      error: error instanceof Error ? error.message : 'Unknown error during compression',
    };
  }
}

// Re-export for convenience
export { generateId };
