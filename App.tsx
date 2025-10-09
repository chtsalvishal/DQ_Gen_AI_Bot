import React, { useState, lazy, Suspense } from 'react';
import { analyzeDataQuality, generateReportSummary } from './services/geminiService';
import { DataQualityInputs, Issue } from './types';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { GithubIcon, BotIcon, ChatIcon, PanelLeftCloseIcon, PanelRightOpenIcon } from './components/icons';

const ChatView = lazy(() => import('./components/ChatView'));
const DiagramViewer = lazy(() => import('./components/DiagramViewer'));

const architectureDiagramCode = `
%%{init: { 'themeVariables': { 'fontSize': '16px', 'fontFamily': '"Segoe UI", Arial, sans-serif' } }}%%
graph TD
    subgraph architecture_diagram ["Architecture Diagram"]
        subgraph userenv ["User Environment"]
            A["User via Browser (HTTPS)"]:::userNode
        end

        B((Gateway)):::gatewayNode
        
        A -- "Provides Data Context" --> B

        subgraph botlogic ["Data Quality Bot"]
            subgraph ingest [Ingest]
                C["Data Input and Parsing"]:::processNode
            end
            subgraph pipelines [Pipelines]
                D["Prompt Engineering"]:::processNode
            end
            subgraph analytics [Analytics]
                E["Google Gemini API"]:::apiNode
            end
            subgraph presentation [Presentation]
                F["Results Dashboard"]:::outputNode
                G["AI Assistant"]:::outputNode
                H["Export Engine"]:::outputNode
            end
        end

        B --> C
        C --> D
        D -- "Secure API Call" --> E
        E -- "JSON Response" --> F
        F --> G
        F --> H
    end
    
    style architecture_diagram fill:#F1F5F9,stroke:#CBD5E1,color:#0f172a
    style userenv fill:#FFFFFF,stroke:#94A3B8,color:#0f172a
    style botlogic fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    style ingest fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style pipelines fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style analytics fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style presentation fill:#F8F9FA,stroke:#DADCE0,color:#0f172a

    classDef userNode fill:#FEFCE8,stroke:#FBBF24,stroke-width:2px,color:#0f172a
    classDef gatewayNode fill:#F1F3F4,stroke:#70757A,stroke-width:2px,color:#0f172a
    classDef processNode fill:#E9F3FD,stroke:#4285F4,stroke-width:2px,color:#0f172a
    classDef apiNode fill:#E6F4EA,stroke:#34A853,stroke-width:2px,color:#0f172a
    classDef outputNode fill:#FCE8E6,stroke:#EA4335,stroke-width:2px,color:#0f172a
`;

const userJourneyDiagramCode = `
graph TD
    subgraph user_journey ["User Journey"]

        subgraph sg1 ["**1. Start**"]
            A["**Initiate Session**<br><br>User opens the<br>Data Quality Bot<br>application.<br>"]:::startNode
        end

        subgraph sg2 ["**2. Input & Context**"]
            B["**Provide Data Context**<br><br>User inputs metadata,<br>statistics, and<br>business rules.<br>"]:::inputNode
            B --> B1["**Manual Entry**<br><br>Type or paste<br>details directly<br>into the form.<br>"]:::inputNode
            B --> B2["**File Upload**<br><br>Import context via<br>.sql and .csv files<br>for efficiency.<br>"]:::inputNode
        end
        
        subgraph sg3 ["**3. AI Analysis**"]
            C["**Trigger Analysis**<br><br>Click 'Analyze'<br>to start the AI<br>quality assessment.<br>"]:::analysisNode
            D["**Gemini Processing**<br><br>The app sends a detailed,<br>context-rich prompt for<br>each table to the AI.<br><br>"]:::analysisNode
            E["**Receive Results**<br><br>A structured JSON<br>response is returned<br>with all findings.<br>"]:::analysisNode
        end

        subgraph sg4 ["**4. Insight & Action**"]
            F["**Explore Dashboard**<br><br>Visualize results, filter<br>issues, and review<br>table health scores.<br>"]:::insightNode
            G["**Conversational AI**<br><br>Ask follow-up questions<br>to the integrated<br>AI Assistant.<br>"]:::insightNode
            H["**Export & Share**<br><br>Generate professional PDF<br>or PowerPoint reports<br>for stakeholders.<br>"]:::insightNode
        end
        
        subgraph sg5 ["**5. Goal**"]
           J["**Achieve Data Integrity**<br><br>User gains clear, actionable<br>insights to improve and<br>maintain data quality.<br>"]:::goalNode
        end
    end

    A --> B
    B1 --> C
    B2 --> C
    C --> D --> E
    E --> F
    F --> G & H
    G --> J
    H --> J
    
    style user_journey fill:#EFF6FF,stroke:#BFDBFE,color:#1e293b
    style sg1 fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style sg2 fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style sg3 fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style sg4 fill:#F8F9FA,stroke:#DADCE0,color:#0f172a
    style sg5 fill:#F8F9FA,stroke:#DADCE0,color:#0f172a

    classDef startNode fill:#E8F0FE,stroke:#4A90E2,stroke-width:3px,color:#212529,font-weight:bold
    classDef inputNode fill:#FEF9E7,stroke:#F5B041,stroke-width:3px,color:#212529
    classDef analysisNode fill:#FDEFEF,stroke:#E74C3C,stroke-width:3px,color:#212529
    classDef insightNode fill:#E8F8F5,stroke:#2ECC71,stroke-width:3px,color:#212529
    classDef goalNode fill:#EAEBFC,stroke:#5D69B1,stroke-width:3px,color:#212529,font-weight:bold
`;

interface DiagramData {
  title: string;
  mermaidCode: string;
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [diagramToShow, setDiagramToShow] = useState<DiagramData | null>(null);

  const handleAnalyze = async (inputs: DataQualityInputs) => {
    setIsFormCollapsed(true);
    setIsLoading(true);
    setError(null);
    setIssues(null);
    setReport(null);
    setIsChatOpen(false);

    try {
      const result = await analyzeDataQuality(inputs);
      setIssues(result.issues_detected);
    } catch (err) {
      setError('An error occurred while analyzing the data. Please check your inputs and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!issues || issues.length === 0) return;
    setIsReportLoading(true);
    setReport(null);
    try {
      const summaryReport = await generateReportSummary(issues);
      setReport(summaryReport);
    } catch (reportError) {
      console.error("Failed to generate summary report:", reportError);
      setReport("### Report Generation Failed\n\nAn error occurred while generating the summary. Please try again later.");
    } finally {
      setIsReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-dark text-slate-800 dark:text-slate-200 font-sans flex flex-col h-screen">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <BotIcon className="h-8 w-8 text-brand-primary dark:text-brand-secondary" />
              <h1 className="text-2xl font-bold text-brand-primary dark:text-white">
                Data Quality Bot
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {issues && issues.length > 0 && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-brand-accent rounded-lg shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all"
                  aria-label="Start chat with AI assistant"
                >
                  <ChatIcon className="w-4 h-4" />
                  <span>Ask AI</span>
                </button>
              )}
              <button
                onClick={() => setDiagramToShow({ title: 'Architecture Diagram', mermaidCode: architectureDiagramCode })}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all"
                aria-label="View Architecture Diagram"
              >
                Architecture
              </button>
               <button
                onClick={() => setDiagramToShow({ title: 'User Journey Diagram', mermaidCode: userJourneyDiagramCode })}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all"
                aria-label="View User Journey Diagram"
              >
                User Journey
              </button>
              <a
                href="https://github.com/google/generative-ai-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <GithubIcon className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Slides in and out using transform for smooth animation */}
        <aside
          className={`absolute inset-y-0 left-0 z-30
            w-full max-w-md lg:max-w-lg xl:max-w-xl
            bg-white dark:bg-slate-900
            transition-transform duration-300 ease-in-out
            ${isFormCollapsed ? '-translate-x-full' : 'translate-x-0'}`
          }
          aria-hidden={isFormCollapsed}
        >
          <div className="h-full overflow-y-auto p-6 border-r border-slate-200 dark:border-slate-800">
            <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>
        </aside>

        {/* The button's position transitions smoothly with the sidebar */}
        <button
          onClick={() => setIsFormCollapsed(!isFormCollapsed)}
          className={`
            absolute top-1/2 z-40
            flex items-center justify-center
            w-7 h-14 rounded-md
            bg-slate-800 text-slate-300
            border border-slate-700
            shadow-lg
            hover:bg-brand-accent hover:border-brand-accent hover:text-white
            focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-slate-900
            transition-all duration-300 ease-in-out
            ${isFormCollapsed
              ? 'left-2 -translate-y-1/2'
              // On mobile, position at 100% width. On larger screens, use fixed rem values.
              // The -translate-x-1/2 centers the button on the dividing line.
              : 'left-full -translate-x-1/2 -translate-y-1/2 md:left-[28rem] lg:left-[32rem] xl:left-[36rem]'
            }
          `}
          aria-label={isFormCollapsed ? 'Show data context panel' : 'Hide data context panel'}
          title={isFormCollapsed ? 'Show data context panel' : 'Hide data context panel'}
        >
          {isFormCollapsed
              ? <PanelRightOpenIcon className="w-5 h-5" />
              : <PanelLeftCloseIcon className="w-5 h-5" />
          }
        </button>
        
        {/* Right Panel: Main content area gets a margin pushed to make space for the sidebar on larger screens */}
        <main className={`
          flex-1 overflow-y-auto
          transition-[margin-left] duration-300 ease-in-out
          ${isFormCollapsed ? 'ml-0' : 'md:ml-[28rem] lg:ml-[32rem] xl:ml-[36rem]'}
        `}>
          <div className="p-4 sm:p-6 lg:p-8">
            <ResultsDisplay
              isLoading={isLoading}
              error={error}
              issues={issues}
              report={report}
              isReportLoading={isReportLoading}
              onGenerateReport={handleGenerateReport}
            />
          </div>
        </main>
      </div>


      <Suspense fallback={null}>
          <ChatView 
              issues={issues || []} 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
          />
      </Suspense>

      <Suspense fallback={null}>
            {diagramToShow && (
                <DiagramViewer
                    isOpen={!!diagramToShow}
                    onClose={() => setDiagramToShow(null)}
                    title={diagramToShow.title}
                    mermaidCode={diagramToShow.mermaidCode}
                />
            )}
      </Suspense>
    </div>
  );
};

export default App;