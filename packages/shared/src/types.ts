/**
 * Shared types for PDF Editor Suite
 */

// Annotation types
export type AnnotationType = 
  | 'highlight' 
  | 'underline' 
  | 'strikeout' 
  | 'freeform' 
  | 'text' 
  | 'rectangle'
  | 'arrow';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  pageIndex: number;
  rect: Rect;
  color: string;
  opacity: number;
  createdAt: number;
  updatedAt: number;
  content?: string; // For text annotations
  points?: Point[]; // For freeform drawings
}

// PDF Document types
export interface PdfPageInfo {
  pageIndex: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PdfDocumentInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  pages: PdfPageInfo[];
}

// Merge types
export interface MergeSource {
  id: string;
  fileName: string;
  bytes: Uint8Array;
  pageCount: number;
  selectedPages: number[]; // Indices of pages to include
}

export interface MergePageItem {
  id: string;
  sourceId: string;
  sourceFileName: string;
  pageIndex: number;
  thumbnailDataUrl?: string;
}

export interface MergeResult {
  success: boolean;
  bytes?: Uint8Array;
  error?: string;
}

// Editor state types
export interface EditorTool {
  type: 'select' | 'highlight' | 'underline' | 'strikeout' | 'text' | 'draw' | 'eraser';
  color?: string;
  strokeWidth?: number;
}

// Compression types
export type CompressionLevel = 25 | 50 | 75;

export interface CompressionResult {
  success: boolean;
  bytes?: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  error?: string;
}

export interface ViewportState {
  scale: number;
  scrollX: number;
  scrollY: number;
  currentPage: number;
}

// IPC message types (for Electron and VS Code extension)
export type IpcCommand = 
  | { type: 'LOAD_PDF'; payload: { bytes: Uint8Array; fileName: string } }
  | { type: 'SAVE_PDF'; payload: { bytes: Uint8Array; fileName: string } }
  | { type: 'MERGE_PDFS'; payload: { sources: MergeSource[] } }
  | { type: 'ADD_ANNOTATION'; payload: { annotation: Annotation } }
  | { type: 'UPDATE_ANNOTATION'; payload: { annotation: Annotation } }
  | { type: 'DELETE_ANNOTATION'; payload: { annotationId: string } }
  | { type: 'EXPORT_PDF'; payload: { annotations: Annotation[] } };

export type IpcResponse =
  | { type: 'PDF_LOADED'; payload: PdfDocumentInfo }
  | { type: 'PDF_SAVED'; payload: { success: boolean; path?: string } }
  | { type: 'MERGE_COMPLETE'; payload: MergeResult }
  | { type: 'ERROR'; payload: { message: string } };
