import React, { useState } from 'react';
import { TableInput } from '../types';
import { TrashIcon, ChevronDownIcon, ChartBarIcon, CodeIcon, GavelIcon, FileTextIcon } from './icons';
import HighlightedTextarea from './HighlightedTextarea';

interface TableInputFormProps {
  id?: string;
  table: TableInput;
  index: number;
  onChange: (id: string, updatedTable: Partial<TableInput>) => void;
  onRemove: (id: string) => void;
}

type TabName = 'stats' | 'schema' | 'rules' | 'samples';

const TABS: { id: TabName; label: string; icon: React.ReactNode }[] = [
    { id: 'stats', label: 'Statistics', icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'schema', label: 'Schema', icon: <CodeIcon className="w-4 h-4" /> },
    { id: 'rules', label: 'Rules', icon: <GavelIcon className="w-4 h-4" /> },
    { id: 'samples', label: 'Samples', icon: <FileTextIcon className="w-4 h-4" /> },
];

// Reusable highlighter for textareas where the first line is a header
const headerHighlighter = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const header = lines[0];
    const rest = lines.slice(1);
    return (
        <>
            <span className="text-sky-500 dark:text-sky-400 font-semibold">{header}</span>
            {rest.length > 0 && '\n'}
            {rest.join('\n')}
        </>
    );
};

// Highlighter for the Schema textarea (highlights SQL comments)
const schemaHighlighter = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line.split(/(--.*)/g).map((part, j) => {
                if (part.startsWith('--')) {
                    // This is a comment, style it to indicate status
                    return <span key={j} className="text-emerald-500 dark:text-emerald-400">{part}</span>;
                }
                // This is regular code, leave as is
                return part;
            })}
            {'\n'}
        </React.Fragment>
    ));
};

// Highlighter for the Rules textarea (highlights keywords, operators, etc.)
const rulesHighlighter = (text: string) => {
    if (!text) return null;
    const keywords = ['AND', 'OR', 'NOT', 'BETWEEN', 'LIKE', 'IN', 'IS', 'NULL'];
    const operators = />=|<=|<>|!=|>|<|=/;

    // Regex to capture all tokens of interest: keywords, operators, numbers, and strings
    const tokenRegex = new RegExp(
        `(\\b(?:${keywords.join('|')})\\b|${operators.source}|\\b\\d+(?:\\.\\d+)?\\b|'[^']*'|"[^"]*")`,
        'gi'
    );

    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line.split(tokenRegex).map((part, j) => {
                if (part && keywords.includes(part.toUpperCase())) {
                    return <span key={j} className="text-indigo-500 dark:text-indigo-400 font-semibold">{part}</span>;
                }
                if (part && operators.test(part)) {
                    return <span key={j} className="text-rose-500 dark:text-rose-400 font-semibold">{part}</span>;
                }
                if (part && /^\d+(\.\d+)?$/.test(part)) {
                    return <span key={j} className="text-sky-500 dark:text-sky-400">{part}</span>;
                }
                if (part && ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"')))) {
                    return <span key={j} className="text-emerald-500 dark:text-emerald-400">{part}</span>;
                }
                return part;
            })}
            {'\n'}
        </React.Fragment>
    ));
};

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-brand-primary text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
        role="tab"
        aria-selected={isActive}
    >
        {children}
    </button>
);

const TableInputForm: React.FC<TableInputFormProps> = ({ id, table, index, onChange, onRemove }) => {
  const [isCollapsed, setIsCollapsed] = useState(index > 0);
  const [activeTab, setActiveTab] = useState<TabName>('stats');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(table.id, { [name]: value });
  };
  
  const hasContent = (key: TabName) => !!table[key]?.trim();

  const commonTextareaProps = {
      rows: 8,
      onChange: handleChange,
  };

  return (
    <div id={id} className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center flex-grow min-w-0">
           <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-expanded={!isCollapsed}
            aria-controls={`table-content-${table.id}`}
           >
            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 ${!isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
           </button>
           <input
            type="text"
            name="name"
            value={table.name}
            onChange={handleChange}
            placeholder="Enter table name"
            className="text-lg font-semibold text-slate-800 dark:text-white bg-transparent border-none focus:ring-1 focus:ring-brand-accent rounded-md w-full ml-2 truncate"
           />
        </div>
        <div className="flex items-center flex-shrink-0">
            {isCollapsed && (
                <div className="flex items-center gap-1.5 mr-3">
                    {TABS.map(tab => (
                        hasContent(tab.id) && (
                            <span key={tab.id} title={`${tab.label} has content`} className="h-2 w-2 bg-emerald-400 rounded-full"></span>
                        )
                    ))}
                </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(table.id)}
              className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              aria-label={`Remove table ${table.name}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div id={`table-content-${table.id}`} className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3" role="tablist">
            {TABS.map(tab => (
              <TabButton
                key={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {hasContent(tab.id) && <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>}
              </TabButton>
            ))}
          </div>

          <div role="tabpanel">
            {activeTab === 'stats' && <HighlightedTextarea {...commonTextareaProps} id={`stats-${table.id}`} name="stats" placeholder="Column, Null %, Distinct Count, Min, Max..." value={table.stats} highlighter={headerHighlighter} />}
            {activeTab === 'schema' && <HighlightedTextarea {...commonTextareaProps} id={`schema-${table.id}`} name="schema" placeholder="-- Current Schema&#10;CREATE TABLE..." value={table.schema} highlighter={schemaHighlighter} />}
            {activeTab === 'rules' && <HighlightedTextarea {...commonTextareaProps} id={`rules-${table.id}`} name="rules" placeholder="e.g., price > 0 AND status = 'completed'" value={table.rules} highlighter={rulesHighlighter} />}
            {activeTab === 'samples' && <HighlightedTextarea {...commonTextareaProps} id={`samples-${table.id}`} name="samples" placeholder="e.g., sample CSV rows, daily record counts" value={table.samples} highlighter={headerHighlighter} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableInputForm;