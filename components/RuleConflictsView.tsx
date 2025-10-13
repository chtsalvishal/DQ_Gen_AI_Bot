import React from 'react';
import { RuleConflict } from '../types';
import { AlertIcon, WrenchIcon, GavelIcon } from './icons';

interface RuleConflictsViewProps {
    conflicts: RuleConflict[];
}

const RuleConflictsView: React.FC<RuleConflictsViewProps> = ({ conflicts }) => {

    if (conflicts.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <AlertIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-md font-medium text-slate-700 dark:text-slate-300">No Rule Conflicts Detected</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The AI did not find any logical contradictions between the provided business rules.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {conflicts.map((conflict, index) => (
                <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-grow">
                            <h4 className="text-md font-semibold text-amber-800 dark:text-amber-200">Potential Rule Conflict</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{conflict.description}</p>
                            
                            <div className="mt-4 space-y-3">
                                <div>
                                    <h5 className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        <GavelIcon className="w-4 h-4 mr-2" />
                                        Conflicting Rules
                                    </h5>
                                    <ul className="space-y-1.5 pl-2">
                                        {conflict.conflicting_rules.map((rule, rIndex) => (
                                            <li key={rIndex} className="text-sm text-slate-800 dark:text-slate-200 p-2 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-xs">
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                     <h5 className="flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        <WrenchIcon className="w-4 h-4 mr-2" />
                                        Recommendation
                                    </h5>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 pl-2">{conflict.recommendation}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RuleConflictsView;
