import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Toolbar from './components/layout/Toolbar';
import MainArea from './components/layout/MainArea';
import MergePanel from './components/merge/MergePanel';
import { useEditorStore } from './store';

function App() {
  const [activeTab, setActiveTab] = useState<'edit' | 'merge'>('edit');
  const { currentPdf } = useEditorStore();

  return (
    <div className="app-container">
      <Toolbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        {activeTab === 'edit' && <Sidebar />}
        <div className="editor-area">
          {activeTab === 'edit' ? (
            currentPdf ? (
              <MainArea />
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <h2>No PDF Open</h2>
                  <p>Open a PDF file to start editing, or switch to Merge tab to combine PDFs.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => useEditorStore.getState().openPdf()}
                  >
                    Open PDF
                  </button>
                </div>
              </div>
            )
          ) : (
            <MergePanel />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
