import React, { useState, Suspense, lazy } from 'react';
import { Issue, RuleEffectiveness, RuleConflict } from '../types';
import { GavelIcon, ShieldCheckIcon, AlertIcon } from './icons';

// Lazy load the components to be shown in tabs
const BusinessRulesViolations = lazy(() => import('./BusinessRulesViolations'));
const RuleEffectivenessReport = lazy(() => import('./RuleEffectivenessReport'));
const RuleConflictReport = lazy(() => import('./RuleConflictReport'));

interface RulesAnalysisTabsProps {
    businessRuleIssues: Issue[];
    ruleEffectivenessAnalysis: RuleEffectiveness[] | null;
    ruleConflictAnalysis: RuleConflict[] | null;
}

const TabButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    count?: number;
}> = ({ isActive, onClick, icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            isActive
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        role="tab"
        aria-selected={isActive}
    >
        {icon}
        <span>{label}</span>
        {count !== undefined && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isActive ? 'bg-brand-accent/10 text-brand-accent' : 'bg-slate-200 dark:bg-slate-700'
            }`}>
                {count}
            </span>
        )}
    </button>
);


const RulesAnalysisTabs: React.FC<RulesAnalysisTabsProps> = ({
    businessRuleIssues,
    ruleEffectivenessAnalysis,
    ruleConflictAnalysis,
}) => {
    const [activeTab, setActiveTab] = useState<'violations' | 'effectiveness' | 'conflicts'>('violations');

    // Determine if any rule analysis content exists.
    // The tab should show if the analysis has run (not null), even if the result is an empty array.
    const hasEffectivenessContent = ruleEffectivenessAnalysis !== null;
    const hasConflictContent = ruleConflictAnalysis !== null;
    const hasViolations = businessRuleIssues.length > 0;

    // Don't render if there's nothing to show
    if (!hasViolations && !hasEffectivenessContent && !hasConflictContent) {
        return null;
    }
    
    // Default tab logic
    React.useEffect(() => {
        if (hasViolations) {
            setActiveTab('violations');
        } else if (hasEffectivenessContent) {
            setActiveTab('effectiveness');
        } else if (hasConflictContent) {
            setActiveTab('conflicts');
        }
    }, [hasViolations, hasEffectivenessContent, hasConflictContent]);


    return (
        <div>
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {hasViolations && (
                        <TabButton
                            isActive={activeTab === 'violations'}
                            onClick={() => setActiveTab('violations')}
                            icon={<GavelIcon className="w-5 h-5" />}
                            label="Rule Violations"
                            count={businessRuleIssues.length}
                        />
                    )}
                     {hasEffectivenessContent && (
                        <TabButton
                            isActive={activeTab === 'effectiveness'}
                            onClick={() => setActiveTab('effectiveness')}
                            icon={<ShieldCheckIcon className="w-5 h-5" />}
                            label="Rule Effectiveness"
                            count={ruleEffectivenessAnalysis?.length}
                        />
                    )}
                    {hasConflictContent && (
                        <TabButton
                            isActive={activeTab === 'conflicts'}
                            onClick={() => setActiveTab('conflicts')}
                            icon={<AlertIcon className="w-5 h-5" />}
                            label="Rule Conflicts"
                            count={ruleConflictAnalysis?.length}
                        />
                    )}
                </nav>
            </div>
            <div className="mt-6">
                <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
                    {activeTab === 'violations' && (
                        <BusinessRulesViolations issues={businessRuleIssues} />
                    )}
                    {activeTab === 'effectiveness' && (
                        <RuleEffectivenessReport
                            analysis={ruleEffectivenessAnalysis}
                        />
                    )}
                    {activeTab === 'conflicts' && (
                        <RuleConflictReport
                            analysis={ruleConflictAnalysis}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default RulesAnalysisTabs;