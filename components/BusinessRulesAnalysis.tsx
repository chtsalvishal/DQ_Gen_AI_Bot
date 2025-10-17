import React, { useState } from 'react';
import { Issue, RuleEffectiveness, RuleConflict } from '../types';
import BusinessRulesViolations from './BusinessRulesViolations';
import RuleEffectivenessView from './RuleEffectivenessView';
import RuleConflictsView from './RuleConflictsView';
import { GavelIcon, ShieldCheckIcon, AlertIcon } from './icons';

interface BusinessRulesAnalysisProps {
    violations: Issue[];
    effectiveness: RuleEffectiveness[];
    conflicts: RuleConflict[];
}

type ActiveTab = 'violations' | 'effectiveness' | 'conflicts';

const TabButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            isActive
                ? 'bg-brand-primary text-white shadow'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
        {icon}
        <span>{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
            {count}
        </span>
    </button>
);


const BusinessRulesAnalysis: React.FC<BusinessRulesAnalysisProps> = ({ violations, effectiveness, conflicts }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('violations');

    return (
        <div>
            <h3 id="tour-step-biz-rules" className="text-xl font-bold text-slate-800 dark:text-white mb-4">Business Rule Analysis</h3>
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
                    <div className="flex flex-wrap items-center gap-2">
                        <TabButton
                            icon={<GavelIcon className="w-4 h-4" />}
                            label="Violations"
                            count={violations.length}
                            isActive={activeTab === 'violations'}
                            onClick={() => setActiveTab('violations')}
                        />
                         <TabButton
                            icon={<ShieldCheckIcon className="w-4 h-4" />}
                            label="Effectiveness"
                            count={effectiveness.length}
                            isActive={activeTab === 'effectiveness'}
                            onClick={() => setActiveTab('effectiveness')}
                        />
                         <TabButton
                            icon={<AlertIcon className="w-4 h-4" />}
                            label="Conflicts"
                            count={conflicts.length}
                            isActive={activeTab === 'conflicts'}
                            onClick={() => setActiveTab('conflicts')}
                        />
                    </div>
                </div>
                <div className="p-4">
                    {activeTab === 'violations' && <BusinessRulesViolations violations={violations} />}
                    {activeTab === 'effectiveness' && <RuleEffectivenessView effectiveness={effectiveness} />}
                    {activeTab === 'conflicts' && <RuleConflictsView conflicts={conflicts} />}
                </div>
            </div>
        </div>
    );
};

export default BusinessRulesAnalysis;