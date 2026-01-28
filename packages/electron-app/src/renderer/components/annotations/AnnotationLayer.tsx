/**
 * AnnotationLayer Component
 * Canvas overlay for drawing and displaying annotations
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store';
import type { Annotation, Rect } from '@pdf-editor/shared';
import './AnnotationLayer.css';

interface AnnotationLayerProps {
  annotations: Annotation[];
  scale: number;
}

function AnnotationLayer({ annotations, scale }: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTool, addAnnotation, viewport } = useEditorStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);

  // Get canvas dimensions from parent PDF canvas
  useEffect(() => {
    const pdfCanvas = canvasRef.current?.parentElement?.querySelector('.pdf-canvas') as HTMLCanvasElement;
    if (pdfCanvas && canvasRef.current) {
      canvasRef.current.width = pdfCanvas.width;
      canvasRef.current.height = pdfCanvas.height;
    }
  }, [viewport.currentPage, scale]);

  // Render annotations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    for (const annotation of annotations) {
      drawAnnotation(ctx, annotation);
    }

    // Draw current selection
    if (currentRect && isDrawing) {
      ctx.fillStyle = currentTool.color || 'rgba(255, 255, 0, 0.4)';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.globalAlpha = 1;
    }
  }, [annotations, currentRect, isDrawing, currentTool.color]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { rect, color, opacity, type } = annotation;

    ctx.save();
    ctx.globalAlpha = opacity;

    switch (type) {
      case 'highlight':
        ctx.fillStyle = color;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        break;

      case 'underline':
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y + rect.height);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
        ctx.stroke();
        break;

      case 'strikeout':
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rect.x, rect.y + rect.height / 2);
        ctx.lineTo(rect.x + rect.width, rect.y + rect.height / 2);
        ctx.stroke();
        break;

      case 'rectangle':
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        break;

      case 'text':
        if (annotation.content) {
          ctx.fillStyle = color;
          ctx.font = '14px sans-serif';
          ctx.fillText(annotation.content, rect.x, rect.y + 14);
        }
        break;
    }

    ctx.restore();
  };

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool.type === 'select') return;

    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  }, [currentTool.type, getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const coords = getCanvasCoords(e);
    setCurrentRect({
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y),
    });
  }, [isDrawing, startPoint, getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRect || currentRect.width < 5 || currentRect.height < 5) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentRect(null);
      return;
    }

    // Create annotation based on current tool
    addAnnotation({
      type: currentTool.type === 'draw' ? 'rectangle' : currentTool.type as Annotation['type'],
      pageIndex: viewport.currentPage,
      rect: currentRect,
      color: currentTool.color || '#FFFF00',
      opacity: 0.4,
    });

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  }, [isDrawing, currentRect, currentTool, viewport.currentPage, addAnnotation]);

  return (
    <canvas
      ref={canvasRef}
      className="annotation-layer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: currentTool.type === 'select' ? 'default' : 'crosshair',
      }}
    />
  );
}

export default AnnotationLayer;
