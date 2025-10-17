import React, { useState, useEffect, useMemo } from 'react';
import { XIcon } from './icons';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
    {
        selector: '#tour-step-1',
        title: 'Quick Start',
        content: 'The easiest way to see the bot in action is to load our sample e-commerce dataset. Click here to begin!',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-sql-upload',
        title: 'Import from SQL',
        content: 'Alternatively, you can automatically populate tables, schemas, and rules by uploading a .sql file containing CREATE TABLE statements.',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-csv-upload',
        title: 'Import Column Statistics',
        content: 'You can also upload a single CSV file containing column statistics for all your tables. The bot will automatically distribute the stats to the correct tables.',
        placement: 'bottom',
    },
    {
        selector: '#tour-step-2',
        title: 'Provide Table Context',
        content: 'This is where you provide the details for each table. You can edit the name, schema, statistics, and business rules manually.',
        placement: 'right',
    },
    {
        selector: '#tour-step-3',
        title: 'Add More Tables',
        content: 'You can analyze multiple tables at once. Click here to add another table form to your analysis.',
        placement: 'top',
    },
    {
        selector: '#tour-step-4',
        title: 'Set Global Rules',
        content: 'Define business rules here that should apply to ALL tables in your analysis.',
        placement: 'top',
    },
    {
        selector: '#tour-step-5',
        title: 'Start Analysis',
        content: "Once you're ready, click this button to let the AI analyze your data quality. The results will appear on the right.",
        placement: 'top',
    },
];

interface TourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const currentStep = TOUR_STEPS[currentStepIndex];

  useEffect(() => {
    if (!isOpen) {
      // Use a timeout to allow the exit animation to complete before resetting state
      setTimeout(() => {
        setCurrentStepIndex(0);
        setHighlightBox(null);
      }, 300);
      return;
    }

    const targetElement = document.querySelector<HTMLElement>(currentStep.selector);
    if (targetElement) {
      // Ensure element is not collapsed by an accordion
      if (targetElement.id === 'tour-step-2' && targetElement.clientHeight === 0) {
        (targetElement.querySelector('button[aria-expanded="false"]') as HTMLElement)?.click();
      }
      
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      
      const updatePosition = () => {
        setHighlightBox(targetElement.getBoundingClientRect());
      };
      
      const timer = setTimeout(updatePosition, 300); // Delay to allow for animations
      return () => clearTimeout(timer);
    } else {
      handleNext();
    }
  }, [isOpen, currentStepIndex]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const targetElement = document.querySelector(currentStep.selector);
      if (targetElement) {
        setHighlightBox(targetElement.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const overlayPath = useMemo(() => {
    const { width, height } = windowSize;
    if (!highlightBox || !isOpen) {
      return `M0,0 H${width} V${height} H0 Z`;
    }
    const padding = 8;
    const x = highlightBox.left - padding;
    const y = highlightBox.top - padding;
    const w = highlightBox.width + padding * 2;
    const h = highlightBox.height + padding * 2;
    
    return `M0,0 H${width} V${height} H0 Z M${x},${y} h${w} v${h} h-${w} Z`;
  }, [highlightBox, windowSize, isOpen]);

  const tooltipPosition = useMemo(() => {
    if (!highlightBox) return { display: 'none' };
    
    const placement = currentStep.placement || 'bottom';
    const offset = 12;
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

  return (
    <div className={`fixed inset-0 z-[999] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} role="dialog" aria-modal="true">
      <svg width="100%" height="100%" className="absolute inset-0">
        <path
          d={overlayPath}
          fill="rgba(15, 23, 42, 0.7)"
          fillRule="evenodd"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>

      {highlightBox && isOpen && (
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
            <span className="text-xs text-slate-400">{currentStepIndex + 1} / {TOUR_STEPS.length}</span>
          </div>
          
          <p className="text-sm text-slate-300 mb-4">{currentStep.content}</p>

          <div className="flex justify-between items-center">
             <button onClick={onClose} className="text-xs text-slate-400 hover:text-white">Skip</button>
             <div>
                {currentStepIndex > 0 && (
                    <button onClick={handlePrev} className="px-3 py-1 text-sm rounded-md bg-slate-700 hover:bg-slate-600 mr-2">Prev</button>
                )}
                <button onClick={handleNext} className="px-4 py-1 text-sm font-semibold rounded-md bg-brand-secondary hover:bg-sky-600">
                    {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourOverlay;
