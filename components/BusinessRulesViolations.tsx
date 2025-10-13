import React, { useMemo } from 'react';
import { Issue } from '../types';
import { getShortTableName } from './ResultsDisplay';
import SeverityBadge from './SeverityBadge';
// FIX: Imported GavelIcon.
import { TableIcon, ColumnIcon, GavelIcon } from './icons';

interface BusinessRulesViolationsProps {
    violations: Issue[];
}

const BusinessRulesViolations: React.FC<BusinessRulesViolationsProps> = ({ violations }) => {
    const issuesByTable = useMemo(() => {
        return violations.reduce((acc, issue) => {
            const tableName = issue.table_name || 'General Issues';
            if (!acc[tableName]) {
                acc[tableName] = [];
            }
            acc[tableName].push(issue);
            return acc;
        }, {} as Record<string, Issue[]>);
    }, [violations]);

    const sortedTableNames = Object.keys(issuesByTable).sort((a, b) => a.localeCompare(b));

    if (violations.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <GavelIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-md font-medium text-slate-700 dark:text-slate-300">No Business Rule Violations</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The provided data appears to comply with all specified business rules.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedTableNames.map(tableName => (
                <div key={tableName} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center space-x-3">
                            <TableIcon className="h-6 w-6 text-brand-primary dark:text-brand-secondary flex-shrink-0" />
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-white truncate" title={tableName}>
                                {getShortTableName(tableName)}
                            </h4>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {issuesByTable[tableName].map((issue, index) => (
                            <div key={index} className="flex items-start justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                                <div className="flex-grow">
                                    <p className="text-sm text-slate-800 dark:text-slate-200">{issue.description}</p>
                                    {issue.column_name && (
                                        <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <ColumnIcon className="w-3 h-3 mr-1.5" />
                                            <span>Column: {issue.column_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                    <SeverityBadge severity={issue.severity} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BusinessRulesViolations;
