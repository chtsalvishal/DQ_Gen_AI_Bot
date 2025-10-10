import React, { useState } from 'react';
import { TableInput } from '../types';
import { TrashIcon, ChevronDownIcon, ChartBarIcon, CodeIcon, GavelIcon, FileTextIcon } from './icons';

interface TableInputFormProps {
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

const InputArea: React.FC<{
    id: keyof Omit<TableInput, 'id' | 'name'>;
    tableId: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ id, tableId, placeholder, value, onChange }) => (
    <textarea
        id={`${id}-${tableId}`}
        name={id}
        rows={8}
        className="block w-full text-sm shadow-sm border-slate-300 rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white focus:ring-brand-accent focus:border-brand-accent transition font-mono"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
    />
);

const TableInputForm: React.FC<TableInputFormProps> = ({ table, index, onChange, onRemove }) => {
  const [isCollapsed, setIsCollapsed] = useState(index > 0);
  const [activeTab, setActiveTab] = useState<TabName>('stats');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(table.id, { [name]: value });
  };
  
  const hasContent = (key: TabName) => !!table[key]?.trim();

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
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
            {activeTab === 'stats' && <InputArea id="stats" tableId={table.id} placeholder="e.g., min, max, null %, distinct count" value={table.stats} onChange={handleChange} />}
            {activeTab === 'schema' && <InputArea id="schema" tableId={table.id} placeholder="e.g., CREATE TABLE statements, or 'Columns: col1, col2'" value={table.schema} onChange={handleChange} />}
            {activeTab === 'rules' && <InputArea id="rules" tableId={table.id} placeholder="e.g., price > 0 AND status = 'completed'" value={table.rules} onChange={handleChange} />}
            {activeTab === 'samples' && <InputArea id="samples" tableId={table.id} placeholder="e.g., sample CSV rows, daily record counts" value={table.samples} onChange={handleChange} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableInputForm;