import React, { useState, useEffect } from 'react';
import { CodeIcon, XIcon, ClipboardIcon, CheckIcon } from './icons';

interface SqlDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sqlContent: string;
  tableName: string;
  isLoading: boolean;
}

/**
 * A basic, safe SQL syntax highlighter component.
 * It identifies keywords and comments and wraps them in styled spans for readability.
 */
const SqlHighlighter: React.FC<{ code: string }> = ({ code }) => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'COUNT', 'AVG', 'SUM', 'MIN', 'MAX', 'IS', 'NULL', 'NOT', 'LIKE', 'IN', 'UNION', 'ALL', 'DESC', 'ASC', 'CAST'];
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

    return (
        <pre className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 overflow-x-auto font-mono">
            <code>
                {code.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {line.trim().startsWith('--') 
                            ? <span className="text-slate-400 dark:text-slate-500">{line}</span> 
                            : line.split(keywordRegex).map((part, j) => 
                                keywords.includes(part.toUpperCase()) ? 
                                <span key={j} className="text-sky-500 dark:text-sky-400 font-bold">{part}</span> : 
                                part
                            )
                        }
                        {'\n'}
                    </React.Fragment>
                ))}
            </code>
        </pre>
    );
};

const SqlDisplayModal: React.FC<SqlDisplayModalProps> = ({ isOpen, onClose, sqlContent, tableName, isLoading }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    // Reset copy status when new SQL content is loaded for a different table
    setCopyStatus('idle');
  }, [sqlContent, tableName]);

  if (!isOpen) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    });
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200" 
        onClick={onClose} 
        role="dialog" 
        aria-modal="true"
    >
        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-scale {
            animation: fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        <div 
            className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in-scale" 
            onClick={e => e.stopPropagation()}
        >
            <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                    <CodeIcon className="w-6 h-6 mr-3 text-brand-primary dark:text-brand-secondary" />
                    Generated SQL for <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md ml-2 text-brand-accent">{tableName}</span>
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close modal">
                    <XIcon className="w-5 h-5" />
                </button>
            </header>
            
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-brand-dark min-h-[300px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                        <svg className="animate-spin h-10 w-10 text-brand-primary dark:text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="mt-4 text-md font-medium text-slate-700 dark:text-slate-300">Generating SQL Queries...</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The AI is crafting validation scripts based on the findings.</p>
                    </div>
                ) : (
                    <SqlHighlighter code={sqlContent} />
                )}
            </div>
            
            <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-sm pr-4">
                    AI-generated content. Please review queries carefully before executing on production systems.
                </p>
                <button
                    onClick={handleCopy}
                    disabled={isLoading || !sqlContent || copyStatus === 'copied'}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white transition-all duration-200 flex-shrink-0 ${
                        copyStatus === 'copied' 
                        ? 'bg-emerald-500' 
                        : 'bg-brand-primary hover:bg-slate-800 dark:bg-brand-secondary dark:hover:bg-sky-600'
                    } disabled:bg-slate-400 disabled:cursor-not-allowed`}
                >
                    {copyStatus === 'copied' ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-5 h-5" />
                            <span>Copy to Clipboard</span>
                        </>
                    )}
                </button>
            </footer>
        </div>
    </div>
  );
};

export default SqlDisplayModal;