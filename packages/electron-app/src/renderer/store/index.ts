/**
 * Zustand Store for PDF Editor State
 */

import { create } from 'zustand';
import type {
  Annotation,
  EditorTool,
  ViewportState,
  PdfDocumentInfo,
  MergeSource,
  MergePageItem,
  CompressionLevel,
} from '@pdf-editor/shared';
import { generateId } from '@pdf-editor/shared';

declare global {
  interface Window {
    electronAPI: import('../preload/index').ElectronAPI;
  }
}

interface EditorState {
  // Current PDF
  currentPdf: {
    fileName: string;
    filePath: string;
    bytes: Uint8Array;
    info: PdfDocumentInfo;
  } | null;
  
  // Annotations
  annotations: Annotation[];
  
  // Editor tool
  currentTool: EditorTool;
  
  // Viewport
  viewport: ViewportState;
  
  // Thumbnails
  thumbnails: string[];
  
  // Merge state
  mergeSources: MergeSource[];
  mergePages: MergePageItem[];
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  openPdf: () => Promise<void>;
  savePdf: () => Promise<void>;
  closePdf: () => void;
  
  setCurrentTool: (tool: EditorTool) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  
  setThumbnails: (thumbnails: string[]) => void;
  
  // Merge actions
  addMergeSource: (source: MergeSource) => void;
  removeMergeSource: (id: string) => void;
  reorderMergePages: (pages: MergePageItem[]) => void;
  executeMerge: () => Promise<void>;
  clearMerge: () => void;
  
  // Compression
  compressPdf: (level: CompressionLevel) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentPdf: null,
  annotations: [],
  currentTool: { type: 'select' },
  viewport: { scale: 1, scrollX: 0, scrollY: 0, currentPage: 0 },
  thumbnails: [],
  mergeSources: [],
  mergePages: [],
  isLoading: false,
  error: null,
  
  // Open PDF
  openPdf: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await window.electronAPI.openPdfDialog();
      if (result.canceled || result.filePaths.length === 0) {
        set({ isLoading: false });
        return;
      }
      
      const filePath = result.filePaths[0];
      const readResult = await window.electronAPI.readPdf(filePath);
      
      if (!readResult.success || !readResult.data) {
        throw new Error(readResult.error || 'Failed to read PDF');
      }
      
      const bytes = new Uint8Array(readResult.data);
      const infoResult = await window.electronAPI.getPdfInfo(bytes);
      
      if (!infoResult.success || !infoResult.data) {
        throw new Error(infoResult.error || 'Failed to get PDF info');
      }
      
      const fileName = filePath.split('/').pop() || 'document.pdf';
      
      set({
        currentPdf: {
          fileName,
          filePath,
          bytes,
          info: infoResult.data,
        },
        annotations: [],
        viewport: { scale: 1, scrollX: 0, scrollY: 0, currentPage: 0 },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to open PDF',
      });
    }
  },
  
  // Save PDF
  savePdf: async () => {
    const { currentPdf, annotations } = get();
    if (!currentPdf) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const result = await window.electronAPI.savePdfDialog();
      if (result.canceled || !result.filePath) {
        set({ isLoading: false });
        return;
      }
      
      // Apply annotations if any
      let bytesToSave = currentPdf.bytes;
      if (annotations.length > 0) {
        const annotatedResult = await window.electronAPI.applyAnnotations(
          currentPdf.bytes,
          annotations
        );
        if (annotatedResult.success && annotatedResult.data) {
          bytesToSave = annotatedResult.data;
        }
      }
      
      await window.electronAPI.writePdf(result.filePath, bytesToSave);
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to save PDF',
      });
    }
  },
  
  // Close PDF
  closePdf: () => {
    set({
      currentPdf: null,
      annotations: [],
      thumbnails: [],
      viewport: { scale: 1, scrollX: 0, scrollY: 0, currentPage: 0 },
    });
  },
  
  // Set current tool
  setCurrentTool: (tool) => {
    set({ currentTool: tool });
  },
  
  // Set viewport
  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },
  
  // Add annotation
  addAnnotation: (annotation) => {
    const now = Date.now();
    const newAnnotation: Annotation = {
      ...annotation,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      annotations: [...state.annotations, newAnnotation],
    }));
  },
  
  // Update annotation
  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((ann) =>
        ann.id === id ? { ...ann, ...updates, updatedAt: Date.now() } : ann
      ),
    }));
  },
  
  // Delete annotation
  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((ann) => ann.id !== id),
    }));
  },
  
  // Set thumbnails
  setThumbnails: (thumbnails) => {
    set({ thumbnails });
  },
  
  // Add merge source
  addMergeSource: (source) => {
    set((state) => {
      const newMergePages: MergePageItem[] = source.selectedPages.map((pageIndex) => ({
        id: generateId(),
        sourceId: source.id,
        sourceFileName: source.fileName,
        pageIndex,
      }));
      
      return {
        mergeSources: [...state.mergeSources, source],
        mergePages: [...state.mergePages, ...newMergePages],
      };
    });
  },
  
  // Remove merge source
  removeMergeSource: (id) => {
    set((state) => ({
      mergeSources: state.mergeSources.filter((s) => s.id !== id),
      mergePages: state.mergePages.filter((p) => p.sourceId !== id),
    }));
  },
  
  // Reorder merge pages
  reorderMergePages: (pages) => {
    set({ mergePages: pages });
  },
  
  // Execute merge
  executeMerge: async () => {
    const { mergeSources, mergePages } = get();
    if (mergeSources.length === 0) return;
    
    try {
      set({ isLoading: true, error: null });
      
      // Build sources with correct page order
      const orderedSources: MergeSource[] = mergeSources.map((source) => ({
        ...source,
        selectedPages: mergePages
          .filter((p) => p.sourceId === source.id)
          .map((p) => p.pageIndex),
      }));
      
      const result = await window.electronAPI.mergePdfs(orderedSources);
      
      if (!result.success || !result.bytes) {
        throw new Error(result.error || 'Merge failed');
      }
      
      // Save merged PDF
      const saveResult = await window.electronAPI.savePdfDialog();
      if (!saveResult.canceled && saveResult.filePath) {
        await window.electronAPI.writePdf(saveResult.filePath, result.bytes);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to merge PDFs',
      });
    }
  },
  
  // Clear merge
  clearMerge: () => {
    set({ mergeSources: [], mergePages: [] });
  },
  
  // Compress PDF
  compressPdf: async (level: CompressionLevel) => {
    const { currentPdf } = get();
    if (!currentPdf) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const result = await window.electronAPI.compressPdf(currentPdf.bytes, level);
      
      if (!result.success || !result.bytes) {
        throw new Error(result.error || 'Compression failed');
      }
      
      // Show save dialog
      const saveResult = await window.electronAPI.savePdfDialog();
      if (!saveResult.canceled && saveResult.filePath) {
        await window.electronAPI.writePdf(saveResult.filePath, result.bytes);
        
        // Show success message with stats
        const savedKB = Math.round((result.originalSize - result.compressedSize) / 1024);
        console.log(`Compressed: ${result.originalSize} -> ${result.compressedSize} bytes (saved ${savedKB}KB, ${result.reductionPercent}% reduction)`);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to compress PDF',
      });
    }
  },
  
  // Set loading
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  // Set error
  setError: (error) => {
    set({ error });
  },
}));
