import React, { useState, useEffect, useMemo } from 'react';
import { XIcon } from './icons';
import { Issue, SchemaVisualizationData, RuleEffectiveness, RuleConflict } from '../types';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const FORM_TOUR_STEPS: TourStep[] = [
    {
        selector: '#tour-step-1',
        title: 'Quick Start',
        content: 'The easiest way to see the bot in action is to load our **sample e-commerce dataset**. Click here to begin!',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-sql-upload',
        title: 'Import from SQL',
        content: 'Alternatively, you can automatically populate **tables, schemas, and rules** by uploading a **.sql file** containing CREATE TABLE statements.',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-csv-upload',
        title: 'Import Column Statistics',
        content: 'You can also upload a single **CSV file** containing column statistics for all your tables. The bot will automatically distribute the stats to the correct tables.',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-2',
        title: 'Provide Table Context',
        content: 'This is where you provide the details for each table. You can edit the **name, schema, statistics, and business rules** manually.',
        placement: 'right',
    },
    {
        selector: '#tour-step-3',
        title: 'Add More Tables',
        content: 'You can analyze multiple tables at once. Click here to **add another table** form to your analysis.',
        placement: 'top',
    },
    {
        selector: '#tour-step-4',
        title: 'Set Global Rules',
        content: "Define **business rules** here that should apply to ALL tables in your analysis.",
        placement: 'top',
    },
    {
        selector: '#tour-step-5',
        title: 'Start Analysis',
        content: "Once you're ready, click this button to let the AI **analyze your data quality**. The results will appear on the right.",
        placement: 'top',
    },
];

const ANALYSIS_TOUR_STEPS: TourStep[] = [
    {
        selector: '#tour-step-analysis-sidebar',
        title: 'Navigate Your Report',
        content: "This sidebar is your control center. It shows a **summary** of findings, allows you to **filter by severity**, and helps you navigate between different views.",
        placement: 'right',
    },
    {
        selector: '#tour-step-analysis-ai-report',
        title: 'AI-Generated Summary',
        content: "Start with the AI's **executive summary** of all findings. You can generate it if you haven't already, and **export it to PDF** for sharing.",
        placement: 'bottom',
    },
    {
        selector: '#tour-step-table-health',
        title: 'Table Health Overview',
        content: "Quickly assess the health of each table. The **donut chart** shows the severity breakdown of issues. **Click any card** to drill down into that table's specific problems.",
        placement: 'bottom',
    },
    {
        selector: '#tour-step-issue-hotspots',
        title: 'Discover Issue Hotspots',
        content: "Identify the most common types of issues across all your tables. This helps you find **systemic problems**. Click a card to see all issues of that type.",
        placement: 'bottom',
    },
    {
        selector: '#tour-step-biz-rules',
        title: 'Analyze Business Rules',
        content: "This section details business rule **violations**, analyzes how effective your rules are (**effectiveness**), and detects any logical **conflicts** between them.",
        placement: 'bottom',
    },
    {
        selector: '#tour-step-analysis-viz-nav',
        title: 'Visualize Relationships',
        content: "Click here for an **interactive diagram** of your table relationships and an **anomaly heatmap** to see which tables are most problematic.",
        placement: 'right',
    },
    {
        selector: '#tour-step-ask-ai',
        title: 'Ask Follow-up Questions',
        content: "Have more questions? Click here to open a **chat with an AI assistant** that can help you dig deeper into your specific results.",
        placement: 'bottom',
    }
];

interface TourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[] | null;
  schemaVisualizationData: SchemaVisualizationData | null;
  ruleEffectiveness: RuleEffectiveness[] | null;
  ruleConflicts: RuleConflict[] | null;
}

const findElementWithRetry = (selector: string, retries = 5, delay = 100): Promise<HTMLElement | null> => {
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
            const element = document.querySelector<HTMLElement>(selector);
            if (element || attempts >= retries) {
                clearInterval(interval);
                resolve(element);
            }
            attempts++;
        }, delay);
    });
};

const HighlightedContent: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={index} className="text-brand-secondary font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </>
    );
};

const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose, issues, schemaVisualizationData, ruleEffectiveness, ruleConflicts }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  
  const tourSteps = useMemo(() => {
    if (issues && issues.length > 0) {
      let steps = [...ANALYSIS_TOUR_STEPS];
      
      if (!schemaVisualizationData) {
        steps = steps.filter(step => step.selector !== '#tour-step-analysis-viz-nav');
      }

      const businessRuleViolations = issues.filter(i => i.type === 'Business Rule Violation');
      const hasBusinessRuleContent = businessRuleViolations.length > 0 || (ruleEffectiveness && ruleEffectiveness.length > 0) || (ruleConflicts && ruleConflicts.length > 0);
      if (!hasBusinessRuleContent) {
        steps = steps.filter(step => step.selector !== '#tour-step-biz-rules');
      }
      
      return steps;
    }
    return FORM_TOUR_STEPS;
  }, [issues, schemaVisualizationData, ruleEffectiveness, ruleConflicts]);

  const currentStep = tourSteps[currentStepIndex];

  const updateHighlightBox = () => {
    if (currentStep) {
        const targetElement = document.querySelector<HTMLElement>(currentStep.selector);
        if (targetElement) {
            setHighlightBox(targetElement.getBoundingClientRect());
        }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStepIndex(0);
        setHighlightBox(null);
      }, 300);
      return;
    }

    if (!currentStep) return;

    let isCancelled = false;

    const positionTour = async () => {
      const targetElement = await findElementWithRetry(currentStep.selector);
      if (isCancelled) return;

      if (targetElement) {
        if (targetElement.id === 'tour-step-2' && targetElement.clientHeight === 0) {
            (targetElement.querySelector('button[aria-expanded="false"]') as HTMLElement)?.click();
        }
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        const timer = setTimeout(() => {
          if (!isCancelled) {
            setHighlightBox(targetElement.getBoundingClientRect());
          }
        }, 350);
      } else {
        console.warn(`Tour step element not found: ${currentStep.selector}. Skipping.`);
        handleNext();
      }
    };

    positionTour();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentStepIndex, tourSteps]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updateHighlightBox);
    window.addEventListener('scroll', updateHighlightBox);
    return () => {
        window.removeEventListener('resize', updateHighlightBox);
        window.removeEventListener('scroll', updateHighlightBox);
    };
  }, [isOpen, currentStep]);

  const handleNext = () => {
    setHighlightBox(null);
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setHighlightBox(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const tooltipPosition = useMemo(() => {
    if (!highlightBox || !currentStep) return { display: 'none' };
    
    const placement = currentStep.placement || 'bottom';
    const offset = 16 + 8; // 16px offset + 8px padding
    let top = 0, left = 0, transform = '';

    switch (placement) {
      case 'top':
        top = highlightBox.top - offset;
        left = highlightBox.left + highlightBox.width / 2;
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        top = highlightBox.bottom + offset;
        left = highlightBox.left + highlightBox.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = highlightBox.top + highlightBox.height / 2;
        left = highlightBox.left - offset;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = highlightBox.top + highlightBox.height / 2;
        left = highlightBox.right + offset;
        transform = 'translateY(-50%)';
        break;
    }
    return { top: `${top}px`, left: `${left}px`, transform };
  }, [highlightBox, currentStep]);
  
  const Arrow = () => {
    if (!currentStep) return null;
    const placement = currentStep.placement || 'bottom';
    const size = 8;
    let path = '', style: React.CSSProperties = {};

    switch (placement) {
      case 'top': 
        path = `M0,0 L${size},${size} L${size * 2},0 Z`;
        style = { bottom: `-${size}px`, left: `calc(50% - ${size}px)`};
        break;
      case 'bottom': 
        path = `M0,${size} L${size},0 L${size * 2},${size} Z`;
        style = { top: `-${size}px`, left: `calc(50% - ${size}px)`};
        break;
      case 'left': 
        path = `M${size},0 L0,${size} L${size},${size * 2} Z`;
        style = { right: `-${size}px`, top: `calc(50% - ${size}px)`};
        break;
      case 'right': 
        path = `M0,0 L${size},${size} L0,${size * 2} Z`;
        style = { left: `-${size}px`, top: `calc(50% - ${size}px)`};
        break;
    }

    return (
        <svg
            className="absolute fill-current text-slate-800 dark:text-slate-900"
            width={size * 2}
            height={size * 2}
            style={style}
        >
            <path d={path} />
        </svg>
    );
  };

  const SVGMaskStyle = () => (
    <style>{`
        #tour-mask-rect {
            transition: x 0.3s ease-in-out, y 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out;
        }
    `}</style>
  );

  if (!currentStep) return null;

  return (
    <div className={`fixed inset-0 z-[999] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} role="dialog" aria-modal="true">
        <SVGMaskStyle />

        {/* SVG mask definition for the cutout effect */}
        <svg className="absolute w-0 h-0">
            <defs>
                <mask id="tour-mask">
                    <rect x="0" y="0" width="100vw" height="100vh" fill="white" />
                    {highlightBox && (
                        <rect
                            id="tour-mask-rect"
                            x={highlightBox.left - 8}
                            y={highlightBox.top - 8}
                            width={highlightBox.width + 16}
                            height={highlightBox.height + 16}
                            rx="12"
                            fill="black"
                        />
                    )}
                </mask>
            </defs>
        </svg>
        
        {/* The translucent, blurred, and clickable overlay */}
        <div 
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            style={{ 
                mask: highlightBox ? 'url(#tour-mask)' : 'none', 
                WebkitMask: highlightBox ? 'url(#tour-mask)' : 'none',
            }}
            onClick={onClose}
        ></div>

        {/* The tooltip and highlight border */}
        {highlightBox && isOpen && (
            <>
                <div
                    className="absolute pointer-events-none rounded-xl ring-2 ring-brand-secondary transition-all duration-300 ease-in-out"
                    style={{
                        left: highlightBox.left - 8,
                        top: highlightBox.top - 8,
                        width: highlightBox.width + 16,
                        height: highlightBox.height + 16,
                    }}
                />

                <div
                    className="absolute w-72 p-4 bg-slate-800 dark:bg-slate-900 text-white rounded-lg shadow-2xl animate-fade-in-scale"
                    style={tooltipPosition}
                >
                    <style>{`
                        @keyframes fadeInScale {
                            from { opacity: 0; transform: ${tooltipPosition.transform} scale(0.9); }
                            to { opacity: 1; transform: ${tooltipPosition.transform} scale(1); }
                        }
                        .animate-fade-in-scale { animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    `}</style>
                    
                    <Arrow />
                    
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-md text-brand-secondary">{currentStep.title}</h3>
                        <span className="text-xs text-slate-400">{currentStepIndex + 1} / {tourSteps.length}</span>
                    </div>
                    
                    <p className="text-sm text-slate-300 mb-4">
                        <HighlightedContent text={currentStep.content} />
                    </p>

                    <div className="flex justify-between items-center">
                        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Skip</button>
                        <div>
                            {currentStepIndex > 0 && (
                                <button onClick={handlePrev} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 mr-2">Prev</button>
                            )}
                            <button onClick={handleNext} className="px-4 py-1 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-sky-600">
                                {currentStepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default TourOverlay;