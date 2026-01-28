/**
 * SortablePageItem Component
 * Draggable page thumbnail for merge reordering
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MergePageItem } from '@pdf-editor/shared';
import './SortablePageItem.css';

interface SortablePageItemProps {
  page: MergePageItem;
  index: number;
}

function SortablePageItem({ page, index }: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-page-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="order-number">{index + 1}</span>
      <div className="page-thumbnail">
        {page.thumbnailDataUrl ? (
          <img src={page.thumbnailDataUrl} alt={`Page ${page.pageIndex + 1}`} />
        ) : (
          <div className="page-placeholder">
            <div className="spinner"></div>
          </div>
        )}
      </div>
      <div className="page-info">
        <span className="source-name" title={page.sourceFileName}>
          {page.sourceFileName.length > 12
            ? page.sourceFileName.slice(0, 10) + '...'
            : page.sourceFileName}
        </span>
        <span className="original-page">Page {page.pageIndex + 1}</span>
      </div>
    </div>
  );
}

export default SortablePageItem;
