import React, { useState } from 'react';
import { RuleEffectiveness } from '../types';
import { GavelIcon, CheckCircleIcon, AlertIcon, ChevronDownIcon, BulbIcon, WrenchIcon } from './icons';

const StatusBadge: React.FC<{ status: RuleEffectiveness['status'] }> = ({ status }) => {
    const styles = {
        'Triggered': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        'Not Triggered': 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-300',
        'High Volume': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    };
    const icons: Record<RuleEffectiveness['status'], React.ReactNode> = {
        'Triggered': <CheckCircleIcon className="w-4 h-4 mr-1.5" />,
        'Not Triggered': <AlertIcon className="w-4 h-4 mr-1.5" />,
        'High Volume': <AlertIcon className="w-4 h-4 mr-1.5 text-amber-500" />,
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
            {icons[status]}
            {status}
        </span>
    );
};

const RuleCard: React.FC<{ rule: RuleEffectiveness }> = ({ rule }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const statusBorders: Record<RuleEffectiveness['status'], string> = {
        'Triggered': 'border-l-4 border-emerald-500',
        'Not Triggered': 'border-l-4 border-slate-400',
        'High Volume': 'border-l-4 border-amber-500',
    };

    return (
        <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm ${statusBorders[rule.status]}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50 rounded-lg"
                aria-expanded={isExpanded}
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{rule.rule_statement}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                        <StatusBadge status={rule.status} />
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="pt-3 space-y-2">
                         <div className="flex items-start">
                            <BulbIcon className="h-4 w-4 text-sky-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Observation</h4>
                                <p className="text-sm text-slate-800 dark:text-slate-400">{rule.observation}</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <WrenchIcon className="h-4 w-4 text-emerald-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Recommendation</h4>
                                <p className="text-sm text-slate-800 dark:text-slate-400">{rule.recommendation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface RuleEffectivenessReportProps {
    analysis: RuleEffectiveness[] | null;
}

const RuleEffectivenessReport: React.FC<RuleEffectivenessReportProps> = ({ analysis }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!analysis || analysis.length === 0) {
        return null; // Don't render anything if there were no rules to analyze
    }

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-50"
              aria-expanded={isExpanded}
            >
                <div className="flex justify-between items-center w-full">
                    <h3 className="flex items-center text-lg font-semibold text-slate-800 dark:text-white">
                        <GavelIcon className="w-5 h-5 mr-3 text-brand-accent" />
                        Rule Effectiveness Analysis
                    </h3>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-500 dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[5000px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="pt-4 space-y-3">
                        {analysis.map((rule, index) => (
                            <RuleCard key={index} rule={rule} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuleEffectivenessReport;