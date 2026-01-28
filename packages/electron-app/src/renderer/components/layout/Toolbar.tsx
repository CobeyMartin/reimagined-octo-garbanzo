/**
 * Toolbar Component
 * Top toolbar with tabs, tools, and actions
 */

import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { CompressionLevel } from '@pdf-editor/shared';
import './Toolbar.css';

interface ToolbarProps {
  activeTab: 'edit' | 'merge';
  onTabChange: (tab: 'edit' | 'merge') => void;
}

function Toolbar({ activeTab, onTabChange }: ToolbarProps) {
  const { currentPdf, currentTool, setCurrentTool, openPdf, savePdf, compressPdf, viewport, setViewport, isLoading } =
    useEditorStore();
  const [showCompressMenu, setShowCompressMenu] = useState(false);

  const handleZoomIn = () => {
    setViewport({ scale: Math.min(viewport.scale + 0.25, 3) });
  };

  const handleZoomOut = () => {
    setViewport({ scale: Math.max(viewport.scale - 0.25, 0.25) });
  };

  const handleCompress = async (level: CompressionLevel) => {
    setShowCompressMenu(false);
    await compressPdf(level);
  };

  return (
    <header className="toolbar">
      <div className="toolbar-section tabs">
        <button
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => onTabChange('edit')}
        >
          Edit
        </button>
        <button
          className={`tab ${activeTab === 'merge' ? 'active' : ''}`}
          onClick={() => onTabChange('merge')}
        >
          Merge
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section file-actions">
        <button className="btn-icon" onClick={openPdf} title="Open PDF">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </button>
        <button
          className="btn-icon"
          onClick={savePdf}
          disabled={!currentPdf}
          title="Save PDF"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
        
        <div className="toolbar-divider-small" />
        
        <div className="compress-dropdown">
          <button
            className="btn-icon"
            onClick={() => setShowCompressMenu(!showCompressMenu)}
            disabled={!currentPdf || isLoading}
            title="Compress PDF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="dropdown-arrow">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showCompressMenu && (
            <div className="compress-menu">
              <button onClick={() => handleCompress(25)}>
                <span>Light (25%)</span>
                <span className="compress-hint">Fastest, minimal reduction</span>
              </button>
              <button onClick={() => handleCompress(50)}>
                <span>Medium (50%)</span>
                <span className="compress-hint">Balanced compression</span>
              </button>
              <button onClick={() => handleCompress(75)}>
                <span>Heavy (75%)</span>
                <span className="compress-hint">Maximum reduction</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'edit' && currentPdf && (
        <>
          <div className="toolbar-divider" />

          <div className="toolbar-section tools">
            <button
              className={`btn-icon ${currentTool.type === 'select' ? 'active' : ''}`}
              onClick={() => setCurrentTool({ type: 'select' })}
              title="Select"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            </button>
            <button
              className={`btn-icon ${currentTool.type === 'highlight' ? 'active' : ''}`}
              onClick={() => setCurrentTool({ type: 'highlight', color: '#FFFF00' })}
              title="Highlight"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button
              className={`btn-icon ${currentTool.type === 'text' ? 'active' : ''}`}
              onClick={() => setCurrentTool({ type: 'text' })}
              title="Add Text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </button>
            <button
              className={`btn-icon ${currentTool.type === 'draw' ? 'active' : ''}`}
              onClick={() => setCurrentTool({ type: 'draw', color: '#FF0000', strokeWidth: 2 })}
              title="Draw"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-section zoom">
            <button className="btn-icon" onClick={handleZoomOut} title="Zoom Out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <span className="zoom-level">{Math.round(viewport.scale * 100)}%</span>
            <button className="btn-icon" onClick={handleZoomIn} title="Zoom In">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>

        </>
      )}

      <div className="toolbar-spacer" />

      {currentPdf && (
        <div className="toolbar-section file-info">
          <span className="file-name">{currentPdf.fileName}</span>
        </div>
      )}
    </header>
  );
}

export default Toolbar;
