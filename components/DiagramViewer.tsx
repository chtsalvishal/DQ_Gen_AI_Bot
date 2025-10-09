import React, { useEffect, useRef } from 'react';
import { XIcon } from './icons';

// We need to declare the mermaid global object to satisfy TypeScript
declare global {
  interface Window {
    mermaid: any;
  }
}

interface DiagramViewerProps {
  title: string;
  mermaidCode: string;
  isOpen: boolean;
  onClose: () => void;
}

const DiagramViewer: React.FC<DiagramViewerProps> = ({ title, mermaidCode, isOpen, onClose }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const uniqueId = `mermaid-diagram-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (isOpen && window.mermaid && diagramRef.current) {
        // Clear previous render to prevent duplicates
        diagramRef.current.innerHTML = `<pre class="mermaid" id="${uniqueId}">${mermaidCode}</pre>`;
        try {
            window.mermaid.run({
                nodes: [document.getElementById(uniqueId)],
            });
        } catch (e) {
            console.error("Mermaid rendering error:", e);
            if (diagramRef.current) {
                diagramRef.current.innerHTML = "Error rendering diagram. Please check the console.";
            }
        }
    }
  }, [isOpen, mermaidCode, uniqueId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagram-title"
    >
      <div className="bg-slate-50 dark:bg-brand-dark rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h2 id="diagram-title" className="text-xl font-bold text-brand-primary dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            aria-label="Close diagram viewer"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6 flex justify-center items-center">
            <div ref={diagramRef} className="w-full h-full flex items-center justify-center">
                {/* Mermaid will render here */}
            </div>
        </main>
      </div>
    </div>
  );
};

export default DiagramViewer;
