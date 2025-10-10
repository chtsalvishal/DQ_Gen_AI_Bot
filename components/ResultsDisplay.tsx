import React, { useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import { Issue } from '../types';
import IssueCard from './IssueCard';
import Loader from './Loader';
import { ErrorIcon, CheckCircleIcon, ChevronDownIcon, ColumnIcon, ExportIcon, PresentationIcon, SparklesIcon, XIcon, CodeIcon } from './icons';
import SeverityBadge from './SeverityBadge';
import { generatePdfReport, generatePptxReport, generateSummaryPdf } from '../services/exportService';
import AnalysisSidebar from './AnalysisSidebar';
import { generateSqlForIssues } from '../services/geminiService';
import SqlDisplayModal from './SqlDisplayModal';

const DashboardView = lazy(() => import('./DashboardView'));

/**
 * A robust inline markdown parser that handles bold text (`**...**`).
 * It splits a line of text by the bold delimiter and wraps the appropriate segments in `<strong>` tags.
 * @param text The plain text line which may contain markdown.
 * @returns A React fragment with the formatted text.
 */
const renderInlineMarkdown = (text: string) => {
  // Split by bold markdown (**...**), keeping the captured delimiters.
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // This is a bold part; remove the asterisks and wrap in <strong>.
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        // This is a regular text part.
        return part;
      })}
    </>
  );
};

/**
 * A professional and robust markdown renderer component.
 * It correctly groups list items and applies a cleaner, more report-like style than the previous version.
 * @param text The raw markdown string from the AI model.
 * @returns A formatted React component.
 */
const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const elements: React.ReactNode[] = [];
  const lines = text.split('\n');
  let listItemsBuffer: string[] = [];

  const flushListBuffer = () => {
    if (listItemsBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-outside pl-6 my-3 space-y-1.5 text-slate-600 dark:text-slate-300">
          {listItemsBuffer.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItemsBuffer = []; // Clear the buffer
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('### ')) {
      flushListBuffer();
      elements.push(<h3 key={index} className="text-lg font-semibold mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">{renderInlineMarkdown(trimmedLine.substring(4))}</h3>);
    } else if (trimmedLine.startsWith('## ')) {
      flushListBuffer();
      elements.push(<h2 key={index} className="text-xl font-bold mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{renderInlineMarkdown(trimmedLine.substring(3))}</h2>);
    } else if (trimmedLine.startsWith('# ')) {
      flushListBuffer();
      elements.push(<h1 key={index} className="text-2xl font-extrabold mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">{renderInlineMarkdown(trimmedLine.substring(2))}</h1>);
    } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      listItemsBuffer.push(trimmedLine.substring(2));
    } else if (trimmedLine !== '') {
      flushListBuffer();
      elements.push(<p key={index} className="my-3 leading-relaxed text-slate-700 dark:text-slate-300">{renderInlineMarkdown(trimmedLine)}</p>);
    } else {
      flushListBuffer();
    }
  });

  flushListBuffer(); // Ensure any trailing list gets rendered

  return <div className="font-sans">{elements}</div>;
};


/**
 * Extracts the simple table name from a fully qualified name.
 * e.g., "[dbo].[MyTable]" -> "MyTable", "schema.table_name" -> "table_name"
 */
export const getShortTableName = (fullName: string): string => {
  if (!fullName) return 'Unnamed Table';
  // Remove brackets, backticks, and double quotes
  const cleanedName = fullName.replace(/[`"\[\]]/g, '');
  // Get the last part after any dots
  const parts = cleanedName.split('.');
  return parts[parts.length - 1];
};


interface ColumnIssuesGroupProps {
  columnName: string;
  issues: Issue[];
}

const ColumnIssuesGroup: React.FC<ColumnIssuesGroupProps> = ({ columnName, issues }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    const severityCounts = useMemo(() => {
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, { High: 0, Medium: 0, Low: 0 } as Record<Issue['severity'], number>);
    }, [issues]);

    return (
        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-3 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
                aria-expanded={isExpanded}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 min-w-0">
                        <ColumnIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <h4 className="text-md font-medium text-slate-700 dark:text-slate-200 truncate" title={columnName}>{columnName}</h4>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                        <div className="flex items-center space-x-2">
                          {severityCounts.High > 0 && <SeverityBadge severity="High" count={severityCounts.High} />}
                          {severityCounts.Medium > 0 && <SeverityBadge severity="Medium" count={severityCounts.Medium} />}
                          {severityCounts.Low > 0 && <SeverityBadge severity="Low" count={severityCounts.Low} />}
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[10000px]' : 'max-h-0'}`}>
              <div className="px-3 pb-3">
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                  {issues.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              </div>
            </div>
        </div>
    );
};

interface TableIssuesGroupProps {
  tableName: string;
  issues: Issue[];
  isInitiallyExpanded?: boolean;
  onGenerateSql: (tableName: string, issues: Issue[]) => void;
  isSqlLoadingForTable: boolean;
}

const TableIssuesGroup: React.FC<TableIssuesGroupProps> = ({ tableName, issues, onGenerateSql, isSqlLoadingForTable }) => {
  const issuesByColumn = useMemo(() => {
    const grouped: Record<string, Issue[]> = { 'Table-Level Issues': [] };
    issues.forEach(issue => {
        const key = issue.column_name || 'Table-Level Issues';
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(issue);
    });
    if (grouped['Table-Level Issues'].length === 0) {
        delete grouped['Table-Level Issues'];
    }
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Table-Level Issues') return -1;
        if (b === 'Table-Level Issues') return 1;
        return a.localeCompare(b);
    });

    return sortedKeys.reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
    }, {} as Record<string, Issue[]>);
  }, [issues]);

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm" id={`table-group-${tableName.replace(/\s+/g, '-')}`}>
        <div className="p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white break-words" title={tableName}>{tableName}</h3>
            <button 
                onClick={() => onGenerateSql(tableName, issues)}
                disabled={isSqlLoadingForTable}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                aria-label={`Generate validation SQL for ${tableName}`}
            >
                {isSqlLoadingForTable ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <CodeIcon className="w-4 h-4" />
                )}
                <span>Generate SQL</span>
            </button>
        </div>
        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50">
          <div className="space-y-3 pt-4">
            {Object.keys(issuesByColumn).map(columnName => (
                <ColumnIssuesGroup
                    key={columnName}
                    columnName={columnName}
                    issues={issuesByColumn[columnName]}
                />
            ))}
          </div>
        </div>
    </div>
  );
};


const IdleState: React.FC = () => (
  <div className="text-center p-8 flex flex-col justify-center items-center h-full">
    <div>
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-200">Waiting for analysis</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your data quality report will appear here once the analysis is complete.</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
    <ErrorIcon className="mx-auto h-12 w-12 text-red-500" />
    <h3 className="mt-4 text-lg font-medium text-red-800 dark:text-red-300">Analysis Failed</h3>
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>
  </div>
);

const NoIssuesState: React.FC = () => (
    <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
    <h3 className="mt-4 text-lg font-medium text-green-800 dark:text-green-300">No Issues Detected</h3>
    <p className="mt-1 text-sm text-green-600 dark:text-green-400">Great job! The bot didn't find any data quality issues.</p>
  </div>
);

const AIReportSection: React.FC<{
  report: string | null;
  isLoading: boolean;
  onGenerate: () => void;
}> = ({ report, isLoading, onGenerate }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (isLoading) {
    return (
      <div className="mt-8 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-6 text-center shadow-inner animate-pulse">
        <div className="flex flex-col items-center justify-center text-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary dark:text-brand-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-4 text-md font-medium text-slate-900 dark:text-slate-200">Generating Summary...</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The AI is analyzing the findings.</p>
        </div>
      </div>
    );
  }

  if (report) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50"
          aria-expanded={isExpanded}
        >
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">AI-Generated Report</h3>
            <div className="flex items-center gap-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        generateSummaryPdf(report);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Export summary to PDF"
                >
                    <ExportIcon className="w-4 h-4" />
                    <span>Export PDF</span>
                </button>
                <ChevronDownIcon className={`w-6 h-6 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[5000px]' : 'max-h-0'}`}>
          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50">
            <div className="pt-4">
              <SimpleMarkdownRenderer text={report} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-brand-dark p-6 text-center shadow-inner">
        <SparklesIcon className="mx-auto h-12 w-12 text-brand-accent" />
        <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-white">Need a Quick Summary?</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">Let our AI generate an executive summary of the key findings and recommendations.</p>
        <button
            onClick={onGenerate}
            disabled={isLoading}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-accent rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all flex-shrink-0"
        >
            <SparklesIcon className="w-5 h-5 -ml-1" />
            Generate AI Summary
        </button>
    </div>
  );
};


interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  issues: Issue[] | null;
  report: string | null;
  isReportLoading: boolean;
  onGenerateReport: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, issues, report, isReportLoading, onGenerateReport }) => {
    const [activeSelection, setActiveSelection] = useState<'dashboard' | string>('dashboard');
    const [displayMode, setDisplayMode] = useState<'dashboard' | 'list'>('dashboard');
    const [activeSeverityFilter, setActiveSeverityFilter] = useState<Issue['severity'] | 'All'>('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState<string | 'All'>('All');
    const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
    const [sqlState, setSqlState] = useState<{ isLoading: boolean; content: string | null; forTable: string | null }>({
      isLoading: false,
      content: null,
      forTable: null,
    });
    
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const isResizing = useRef(false);

    const handleGenerateSql = async (tableName: string, tableIssues: Issue[]) => {
        if (sqlState.isLoading && sqlState.forTable === tableName) return;
    
        setIsSqlModalOpen(true);
        setSqlState({ isLoading: true, content: null, forTable: tableName });
        try {
          const sql = await generateSqlForIssues(tableName, tableIssues);
          setSqlState({ isLoading: false, content: sql, forTable: tableName });
        } catch (error) {
          console.error("Failed to generate SQL:", error);
          const errorMessage = '-- Failed to generate SQL. Please check the console for errors and try again.';
          setSqlState({ isLoading: false, content: errorMessage, forTable: tableName });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing.current) {
            const newWidth = e.clientX;
            const minWidth = 280;
            const maxWidth = 600;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
              setSidebarWidth(newWidth);
            }
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);
    
    const issuesByTable = useMemo(() => {
        if (!issues) return {};
        return issues.reduce((acc, issue) => {
            const tableName = issue.table_name || 'General Issues';
            if (!acc[tableName]) {
                acc[tableName] = [];
            }
            acc[tableName].push(issue);
            return acc;
        }, {} as Record<string, Issue[]>);
    }, [issues]);
    
    useEffect(() => {
        if (issues && issues.length > 0) {
            setActiveSelection('dashboard');
            setDisplayMode('dashboard');
            setActiveSeverityFilter('All');
            setActiveTypeFilter('All');
        }
    }, [issues]);

    const { filteredIssuesByTable, filteredIssuesFlat } = useMemo(() => {
        if (!issues) return { filteredIssuesByTable: {}, filteredIssuesFlat: [] };

        const filteredFlat = issues.filter(issue => {
            const severityMatch = activeSeverityFilter === 'All' || issue.severity === activeSeverityFilter;
            const typeMatch = activeTypeFilter === 'All' || issue.type === activeTypeFilter;
            return severityMatch && typeMatch;
        });

        const filteredByTable = filteredFlat.reduce((acc, issue) => {
            const tableName = issue.table_name || 'General Issues';
            if (!acc[tableName]) {
                acc[tableName] = [];
            }
            acc[tableName].push(issue);
            return acc;
        }, {} as Record<string, Issue[]>);
        
        return { filteredIssuesByTable: filteredByTable, filteredIssuesFlat: filteredFlat };
    }, [issues, activeSeverityFilter, activeTypeFilter]);


    const handleSidebarSelection = (selection: 'dashboard' | string) => {
        setActiveSelection(selection);
        setActiveTypeFilter('All');
        if (selection === 'dashboard') {
            setDisplayMode('dashboard');
        } else {
            setDisplayMode('list');
        }
    };

    const handleIssueTypeSelect = (issueType: string) => {
      setActiveSelection('dashboard');
      setDisplayMode('list');
      setActiveTypeFilter(issueType);
    };

    const handleTableSelect = (tableName: string) => {
        const fullTableName = Object.keys(issuesByTable).find(key => getShortTableName(key) === tableName) || tableName;
        setActiveSelection(fullTableName);
        setDisplayMode('list');
    };
    
    const renderMainContent = () => {
        if (displayMode === 'dashboard') {
            return (
                <Suspense fallback={<div className="text-center py-10">Loading Dashboard...</div>}>
                   <DashboardView
                       issues={filteredIssuesFlat}
                       onIssueTypeSelect={handleIssueTypeSelect}
                       onTableSelect={handleTableSelect}
                    />
                </Suspense>
            );
        }

        // LIST VIEW
        let tablesToRender = filteredIssuesByTable;
        if (activeSelection !== 'dashboard') {
            tablesToRender = { [activeSelection]: filteredIssuesByTable[activeSelection] || [] };
        }
        const tableNames = Object.keys(tablesToRender);

        return (
            <div className="space-y-6">
                 {activeTypeFilter !== 'All' && (
                     <div className="p-2.5 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex justify-between items-center text-sm">
                        <p className="text-sky-800 dark:text-sky-200">
                            <span className="font-semibold">Filtering by issue type:</span> {activeTypeFilter}
                        </p>
                        <button onClick={() => setActiveTypeFilter('All')} className="p-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors">
                            <XIcon className="w-4 h-4 text-sky-600 dark:text-sky-300"/>
                            <span className="sr-only">Clear issue type filter</span>
                        </button>
                    </div>
                )}
                <div className="space-y-4">
                    {tableNames.length > 0 && tableNames.some(name => tablesToRender[name] && tablesToRender[name].length > 0) ? (
                        tableNames.map((tableName) => {
                            if (!tablesToRender[tableName] || tablesToRender[tableName].length === 0) return null;
                            return (
                                <TableIssuesGroup
                                  key={tableName} 
                                  tableName={tableName} 
                                  issues={tablesToRender[tableName]}
                                  onGenerateSql={handleGenerateSql}
                                  isSqlLoadingForTable={sqlState.isLoading && sqlState.forTable === tableName}
                                />
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            No issues match the selected filter.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (isLoading) return <Loader />;
        if (error) return <ErrorState message={error} />;
        if (issues === null) return <IdleState />;
        if (issues.length === 0) return <NoIssuesState />;
        
        return (
            <div className="w-full">
                 <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analysis Report</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{issues.length} total issues found across {Object.keys(issuesByTable).length} tables.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                         <button 
                            onClick={() => generatePdfReport(issues)} 
                            disabled={!issues || issues.length === 0}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Export report to PDF"
                        >
                            <ExportIcon className="w-4 h-4" />
                            <span>Export PDF</span>
                        </button>
                        <button 
                            onClick={() => generatePptxReport(issues)} 
                            disabled={!issues || issues.length === 0}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Export report to slides"
                        >
                            <PresentationIcon className="w-4 h-4" />
                            <span>Export Slides</span>
                        </button>
                    </div>
                </div>

                <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-lg">
                    <aside className="flex-shrink-0" style={{ width: `${sidebarWidth}px` }}>
                       <div className="h-full overflow-y-auto p-4">
                        <AnalysisSidebar
                            issues={issues}
                            issuesByTable={issuesByTable}
                            activeSelection={activeSelection}
                            onSelectionChange={handleSidebarSelection}
                            activeSeverityFilter={activeSeverityFilter}
                            onSeverityFilterChange={setActiveSeverityFilter}
                        />
                       </div>
                    </aside>
                    
                    <div
                      onMouseDown={handleMouseDown}
                      className="w-2 flex-shrink-0 cursor-col-resize hover:bg-brand-secondary/50 transition-colors"
                      title="Resize sidebar"
                    />

                    <main className="flex-grow p-6 min-w-0 bg-slate-50 dark:bg-slate-900/50 rounded-r-lg">
                        <div className="space-y-8">
                           <AIReportSection
                                report={report}
                                isLoading={isReportLoading}
                                onGenerate={onGenerateReport}
                            />
                           {renderMainContent()}
                        </div>
                    </main>
                </div>
                <SqlDisplayModal
                    isOpen={isSqlModalOpen}
                    onClose={() => setIsSqlModalOpen(false)}
                    isLoading={sqlState.isLoading && sqlState.content === null}
                    sqlContent={sqlState.content || ''}
                    tableName={sqlState.forTable || ''}
                />
            </div>
        )
    };
    
    return (
        <div className="bg-transparent min-h-[500px] flex flex-col">
            <div className="flex-grow flex items-start justify-center">
                 {renderContent()}
            </div>
        </div>
    );
};

export default ResultsDisplay;