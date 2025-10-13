import React from 'react';
import { RuleConflict } from '../types';
import { AlertIcon, BulbIcon, WrenchIcon, CodeIcon, CheckCircleIcon } from './icons';

const ConflictCard: React.FC<{ conflict: RuleConflict }> = ({ conflict }) => {
    return (
        <div className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg shadow-sm border-l-4 border-amber-500">
            <div className="p-4">
                <h4 className="flex items-center text-md font-semibold text-amber-800 dark:text-amber-300 mb-3">
                    <AlertIcon className="h-5 w-5 mr-2" />
                    Potential Conflict Detected
                </h4>
                <div className="space-y-4">
                    <div>
                        <h5 className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            <CodeIcon className="w-4 h-4 mr-2" />
                            Conflicting Rules
                        </h5>
                        <div className="space-y-2 pl-6">
                            {conflict.conflicting_rules.map((rule, index) => (
                                <code key={index} className="block text-xs font-mono p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md text-slate-700 dark:text-slate-300">
                                    {rule}
                                </code>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h5 className="flex items-start text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            <BulbIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            Explanation
                        </h5>
                        <p className="text-sm text-slate-800 dark:text-slate-400 pl-6">{conflict.explanation}</p>
                    </div>
                     <div>
                        <h5 className="flex items-start text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            <WrenchIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            Recommendation
                        </h5>
                        <p className="text-sm text-slate-800 dark:text-slate-400 pl-6">{conflict.recommendation}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface RuleConflictReportProps {
    analysis: RuleConflict[] | null;
}

const RuleConflictReport: React.FC<RuleConflictReportProps> = ({ analysis }) => {
    if (analysis === null) {
        return null; // Don't render if analysis hasn't run
    }

    if (analysis.length === 0) {
        return (
            <div className="text-center p-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-lg font-medium text-emerald-800 dark:text-emerald-300">No Conflicts Found</h3>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">Great news! The bot analyzed your business rules and found no contradictions or overlaps.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {analysis.map((conflict, index) => (
                <ConflictCard key={index} conflict={conflict} />
            ))}
        </div>
    );
};

export default RuleConflictReport;