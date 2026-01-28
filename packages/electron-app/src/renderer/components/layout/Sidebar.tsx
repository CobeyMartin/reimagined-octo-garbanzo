/**
 * Sidebar Component
 * Shows page thumbnails for navigation
 */

import { useEditorStore } from '../../store';
import './Sidebar.css';

function Sidebar() {
  const { currentPdf, thumbnails, viewport, setViewport } = useEditorStore();

  if (!currentPdf) {
    return (
      <aside className="sidebar">
        <div className="sidebar-empty">
          <span>No document</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>Pages</span>
        <span className="page-count">{currentPdf.info.pageCount}</span>
      </div>
      <div className="thumbnail-list">
        {thumbnails.length > 0 ? (
          thumbnails.map((thumbnail, index) => (
            <div
              key={index}
              className={`thumbnail-item ${viewport.currentPage === index ? 'active' : ''}`}
              onClick={() => setViewport({ currentPage: index })}
            >
              <img src={thumbnail} alt={`Page ${index + 1}`} />
              <span className="page-number">{index + 1}</span>
            </div>
          ))
        ) : (
          Array.from({ length: currentPdf.info.pageCount }).map((_, index) => (
            <div
              key={index}
              className={`thumbnail-item placeholder ${viewport.currentPage === index ? 'active' : ''}`}
              onClick={() => setViewport({ currentPage: index })}
            >
              <div className="thumbnail-placeholder">
                <span>{index + 1}</span>
              </div>
              <span className="page-number">{index + 1}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
