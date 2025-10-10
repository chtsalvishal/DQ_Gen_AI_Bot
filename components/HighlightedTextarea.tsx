import React, { useRef } from 'react';

interface HighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  highlighter: (text: string) => React.ReactNode;
}

// Consistent styles to ensure the backdrop and textarea align perfectly
const commonClasses = "block w-full px-3 py-2 text-sm font-mono whitespace-pre-wrap break-word rounded-md leading-relaxed";

const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({ highlighter, value, ...props }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync scrolling between the textarea and the backdrop
  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const textValue = String(value || '');

  return (
    <div className="relative w-full">
      {/* Backdrop for syntax highlighting */}
      <div
        ref={backdropRef}
        className={`absolute inset-0 overflow-auto pointer-events-none select-none ${commonClasses}`}
        aria-hidden="true"
      >
        {/* The highlighter function provides the styled content */}
        {highlighter(textValue)}
      </div>
      
      {/* The actual, interactive textarea */}
      <textarea
        ref={textareaRef}
        value={textValue}
        {...props}
        onScroll={handleScroll}
        className={`relative bg-transparent text-transparent caret-slate-800 dark:caret-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm focus:ring-brand-accent focus:border-brand-accent transition ${commonClasses}`}
        spellCheck="false"
      />
    </div>
  );
};

export default HighlightedTextarea;