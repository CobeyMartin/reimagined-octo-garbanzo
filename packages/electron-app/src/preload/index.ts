/**
 * Preload Script
 * Exposes safe APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { MergeSource, Annotation, PdfDocumentInfo, CompressionLevel, CompressionResult } from '@pdf-editor/shared';

export interface ElectronAPI {
  // Dialog operations
  openPdfDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  savePdfDialog: () => Promise<{ canceled: boolean; filePath?: string }>;

  // File operations
  readPdf: (filePath: string) => Promise<{ success: boolean; data?: Buffer; error?: string }>;
  writePdf: (filePath: string, data: Uint8Array) => Promise<{ success: boolean; error?: string }>;

  // PDF operations
  getPdfInfo: (bytes: Uint8Array) => Promise<{ success: boolean; data?: PdfDocumentInfo; error?: string }>;
  mergePdfs: (sources: MergeSource[]) => Promise<{ success: boolean; bytes?: Uint8Array; error?: string }>;
  applyAnnotations: (bytes: Uint8Array, annotations: Annotation[]) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  reorderPages: (bytes: Uint8Array, newOrder: number[]) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  extractPages: (bytes: Uint8Array, pageIndices: number[]) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  deletePages: (bytes: Uint8Array, pageIndices: number[]) => Promise<{ success: boolean; data?: Uint8Array; error?: string }>;
  compressPdf: (bytes: Uint8Array, level: CompressionLevel) => Promise<CompressionResult>;
}

const electronAPI: ElectronAPI = {
  // Dialog operations
  openPdfDialog: () => ipcRenderer.invoke('dialog:openPdf'),
  savePdfDialog: () => ipcRenderer.invoke('dialog:savePdf'),

  // File operations
  readPdf: (filePath: string) => ipcRenderer.invoke('pdf:read', filePath),
  writePdf: (filePath: string, data: Uint8Array) =>
    ipcRenderer.invoke('pdf:write', filePath, data),

  // PDF operations
  getPdfInfo: (bytes: Uint8Array) => ipcRenderer.invoke('pdf:getInfo', bytes),
  mergePdfs: (sources: MergeSource[]) => ipcRenderer.invoke('pdf:merge', sources),
  applyAnnotations: (bytes: Uint8Array, annotations: Annotation[]) =>
    ipcRenderer.invoke('pdf:applyAnnotations', bytes, annotations),
  reorderPages: (bytes: Uint8Array, newOrder: number[]) =>
    ipcRenderer.invoke('pdf:reorderPages', bytes, newOrder),
  extractPages: (bytes: Uint8Array, pageIndices: number[]) =>
    ipcRenderer.invoke('pdf:extractPages', bytes, pageIndices),
  deletePages: (bytes: Uint8Array, pageIndices: number[]) =>
    ipcRenderer.invoke('pdf:deletePages', bytes, pageIndices),
  compressPdf: (bytes: Uint8Array, level: CompressionLevel) =>
    ipcRenderer.invoke('pdf:compress', bytes, level),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
