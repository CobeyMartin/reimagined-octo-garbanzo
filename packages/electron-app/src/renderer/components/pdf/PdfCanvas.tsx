/**
 * PdfCanvas Component
 * Renders PDF pages using PDF.js
 */

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useEditorStore } from '../../store';

// Set up PDF.js worker using local file
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfCanvasProps {
  pdfBytes: Uint8Array;
  pageIndex: number;
  scale: number;
}

function PdfCanvas({ pdfBytes, pageIndex }: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setThumbnails } = useEditorStore();
  
  // Use a ref to track the bytes to avoid unnecessary re-renders
  const bytesRef = useRef<Uint8Array>(pdfBytes);
  const bytesChanged = bytesRef.current !== pdfBytes && 
    (bytesRef.current.length !== pdfBytes.length || 
     bytesRef.current[0] !== pdfBytes[0] ||
     bytesRef.current[pdfBytes.length - 1] !== pdfBytes[pdfBytes.length - 1]);
  
  if (bytesChanged) {
    bytesRef.current = pdfBytes;
  }

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    async function loadPdf() {
      try {
        setError(null);
        console.log('Loading PDF, bytes length:', bytesRef.current.length);
        
        // Create a copy of bytes for pdfjs
        const data = bytesRef.current.slice();
        loadingTask = pdfjsLib.getDocument({ data });
        const doc = await loadingTask.promise;
        
        if (cancelled) {
          doc.destroy();
          return;
        }
        
        console.log('PDF loaded, pages:', doc.numPages);
        setPdfDoc(doc);

        // Generate thumbnails for all pages
        const thumbnails: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) break;
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({
              canvasContext: ctx,
              viewport,
            }).promise;
            thumbnails.push(canvas.toDataURL('image/png'));
          }
        }
        
        if (!cancelled) {
          setThumbnails(thumbnails);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [bytesChanged, setThumbnails]);

  // Render current page when pdfDoc or pageIndex changes
  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    async function renderPage() {
      const canvas = canvasRef.current;
      if (!canvas || !pdfDoc) return;

      try {
        console.log('Rendering page:', pageIndex + 1);
        const page = await pdfDoc.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: 1.5 }); // Base scale for quality
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        setDimensions({ width: viewport.width, height: viewport.height });

        const ctx = canvas.getContext('2d');
        if (ctx && !cancelled) {
          // Clear canvas first
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;
          console.log('Page rendered successfully');
        }
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex]);

  if (error) {
    return (
      <div 
        className="pdf-canvas pdf-error"
        style={{
          width: 612,
          height: 792,
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#d32f2f',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ marginTop: 16 }}>Error loading PDF</p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>{error}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pdf-canvas"
      style={{
        width: dimensions.width || 612,
        height: dimensions.height || 792,
        backgroundColor: 'white',
      }}
    />
  );
}

export default PdfCanvas;