import React from 'react';
import { RuleEffectiveness } from '../types';
// FIX: Imported ShieldCheckIcon.
import { CheckCircleIcon, AlertIcon, SearchIcon, TableIcon, ShieldCheckIcon } from './icons';

interface RuleEffectivenessViewProps {
    effectiveness: RuleEffectiveness[];
}

const statusConfig = {
    'Effective': {
        icon: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
        colorClasses: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500',
        textClasses: 'text-emerald-800 dark:text-emerald-300',
    },
    'Never Triggered': {
        icon: <SearchIcon className="h-5 w-5 text-sky-500" />,
        colorClasses: 'bg-sky-50 dark:bg-sky-900/20 border-sky-500',
        textClasses: 'text-sky-800 dark:text-sky-300',
    },
    'Overly Broad': {
        icon: <AlertIcon className="h-5 w-5 text-amber-500" />,
        colorClasses: 'bg-amber-50 dark:bg-amber-900/20 border-amber-500',
        textClasses: 'text-amber-800 dark:text-amber-300',
    },
};

const RuleEffectivenessView: React.FC<RuleEffectivenessViewProps> = ({ effectiveness }) => {

    if (effectiveness.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-md font-medium text-slate-700 dark:text-slate-300">No Effectiveness Analysis Available</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The AI could not provide an analysis of rule effectiveness for the given data.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {effectiveness.map((item, index) => {
                const config = statusConfig[item.status] || statusConfig['Never Triggered'];
                return (
                    <div key={index} className={`p-4 rounded-lg border-l-4 shadow-sm ${config.colorClasses}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.textClasses} ${config.colorClasses.split(' ')[0]}`}>
                                        {config.icon}
                                        <span className="ml-1.5">{item.status}</span>
                                    </span>
                                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                        <TableIcon className="w-3 h-3 mr-1" />
                                        <span>{item.table_name}</span>
                                    </div>
                                </div>
                                <p className="text-sm font-mono bg-slate-100 dark:bg-slate-900/50 p-2 rounded-md text-slate-800 dark:text-slate-200">{item.rule}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 pl-1">{item.reasoning}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RuleEffectivenessView;
