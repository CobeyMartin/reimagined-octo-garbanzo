/**
 * MergePanel Component
 * Drag-and-drop interface for merging multiple PDFs
 */

import { useCallback, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEditorStore } from '../../store';
import SortablePageItem from './SortablePageItem';
import { generateId } from '@pdf-editor/shared';
import './MergePanel.css';

// Set up PDF.js worker using local file
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function MergePanel() {
  const { mergeSources, mergePages, addMergeSource, removeMergeSource, reorderMergePages, executeMerge, clearMerge, isLoading } = useEditorStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mergePages.findIndex((p) => p.id === active.id);
      const newIndex = mergePages.findIndex((p) => p.id === over.id);
      reorderMergePages(arrayMove(mergePages, oldIndex, newIndex));
    }
  }, [mergePages, reorderMergePages]);

  const generateThumbnails = async (bytes: Uint8Array, sourceId: string, pageCount: number) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
      
      for (let i = 0; i < pageCount; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.3 });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const thumbnailDataUrl = canvas.toDataURL('image/png');
          
          // Get fresh state and update the specific page
          const { mergePages } = useEditorStore.getState();
          const updatedPages = mergePages.map(p => 
            (p.sourceId === sourceId && p.pageIndex === i) 
              ? { ...p, thumbnailDataUrl } 
              : p
          );
          useEditorStore.getState().reorderMergePages(updatedPages);
        }
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf'
    );

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const infoResult = await window.electronAPI.getPdfInfo(bytes);

      if (infoResult.success && infoResult.data) {
        const sourceId = generateId();
        const pageCount = infoResult.data.pageCount;
        addMergeSource({
          id: sourceId,
          fileName: file.name,
          bytes,
          pageCount,
          selectedPages: Array.from({ length: pageCount }, (_, i) => i),
        });
        // Generate thumbnails after a small delay to ensure state is updated
        setTimeout(() => generateThumbnails(bytes, sourceId, pageCount), 100);
      }
    }
  }, [addMergeSource]);

  const handleAddFiles = async () => {
    const result = await window.electronAPI.openPdfDialog();
    if (result.canceled) return;

    for (const filePath of result.filePaths) {
      const readResult = await window.electronAPI.readPdf(filePath);
      if (!readResult.success || !readResult.data) continue;

      const bytes = new Uint8Array(readResult.data);
      const infoResult = await window.electronAPI.getPdfInfo(bytes);

      if (infoResult.success && infoResult.data) {
        const fileName = filePath.split('/').pop() || 'document.pdf';
        const sourceId = generateId();
        const pageCount = infoResult.data.pageCount;
        addMergeSource({
          id: sourceId,
          fileName,
          bytes,
          pageCount,
          selectedPages: Array.from({ length: pageCount }, (_, i) => i),
        });
        // Generate thumbnails after a small delay to ensure state is updated
        setTimeout(() => generateThumbnails(bytes, sourceId, pageCount), 100);
      }
    }
  };

  return (
    <div className="merge-panel">
      <div className="merge-header">
        <h2>Merge PDFs</h2>
        <p>Drag and drop PDF files below, then rearrange pages as needed.</p>
      </div>

      <div
        className={`drop-zone ${isDraggingOver ? 'drag-over' : ''} ${mergeSources.length > 0 ? 'has-files' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleFileDrop}
      >
        {mergeSources.length === 0 ? (
          <div className="drop-zone-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Drop PDF files here</span>
            <button className="btn btn-secondary" onClick={handleAddFiles}>
              Or browse files
            </button>
          </div>
        ) : (
          <div className="files-list">
            {mergeSources.map((source) => (
              <div key={source.id} className="file-item">
                <span className="file-name">{source.fileName}</span>
                <span className="page-count">{source.pageCount} pages</span>
                <button
                  className="btn-icon remove-btn"
                  onClick={() => removeMergeSource(source.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button className="btn btn-secondary add-more-btn" onClick={handleAddFiles}>
              + Add more files
            </button>
          </div>
        )}
      </div>

      {mergePages.length > 0 && (
        <div className="pages-section">
          <h3>Page Order</h3>
          <p className="hint">Drag pages to rearrange the final order</p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mergePages.map((p) => p.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="pages-grid">
                {mergePages.map((page, index) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {mergeSources.length > 0 && (
        <div className="merge-actions">
          <button className="btn btn-secondary" onClick={clearMerge}>
            Clear All
          </button>
          <button
            className="btn btn-primary"
            onClick={executeMerge}
            disabled={isLoading || mergePages.length === 0}
          >
            {isLoading ? 'Merging...' : `Merge ${mergePages.length} Pages`}
          </button>
        </div>
      )}
    </div>
  );
}

export default MergePanel;
