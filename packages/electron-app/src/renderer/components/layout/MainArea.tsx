/**
 * MainArea Component
 * PDF viewer with annotation canvas overlay
 */

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../../store';
import PdfCanvas from '../pdf/PdfCanvas';
import AnnotationLayer from '../annotations/AnnotationLayer';
import './MainArea.css';

function MainArea() {
  const { currentPdf, viewport, setViewport, annotations } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setViewport({
        scrollX: containerRef.current.scrollLeft,
        scrollY: containerRef.current.scrollTop,
      });
    }
  }, [setViewport]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (!currentPdf) {
    return null;
  }

  const pageAnnotations = annotations.filter(
    (ann) => ann.pageIndex === viewport.currentPage
  );

  return (
    <div className="main-area" ref={containerRef}>
      <div
        className="pdf-container"
        style={{
          transform: `scale(${viewport.scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="page-wrapper">
          <PdfCanvas
            pdfBytes={currentPdf.bytes}
            pageIndex={viewport.currentPage}
            scale={viewport.scale}
          />
          <AnnotationLayer annotations={pageAnnotations} scale={viewport.scale} />
        </div>
      </div>
      <div className="page-indicator">
        Page {viewport.currentPage + 1} of {currentPdf.info.pageCount}
      </div>
    </div>
  );
}

export default MainArea;
