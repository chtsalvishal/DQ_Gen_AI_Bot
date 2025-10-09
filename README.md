# Data Quality Bot

An intelligent bot that analyzes data metadata and profile reports to detect potential data quality issues like anomalies, schema drift, and type mismatches, providing actionable recommendations.

## Key Features & Benefits

This tool is designed to save time, improve data reliability, and foster a data-driven culture by making data quality analysis accessible and insightful.

-   **Proactive Issue Detection**: Identify silent data corruption, schema drift, and anomalies *before* they impact downstream dashboards, machine learning models, or business decisions.
-   **AI-Powered Deep Analysis**: Go beyond traditional, rigid data validation rules. The Gemini API understands the context of your data—its structure, statistics, and business logic—to uncover subtle, complex issues that are nearly impossible to find manually.
-   **Drastic Efficiency Gains**: Automate the tedious, time-consuming process of manual data profiling and inspection. Free up your data teams to focus on generating value from data, not just cleaning it.
-   **Improved Data Trust & Governance**: Build confidence across your organization with transparent, explainable data quality reports. The bot provides clear causes, impacts, and recommendations, making it easier to enforce data governance standards.
-   **Enhanced Collaboration**: The interactive dashboard, conversational AI assistant, and exportable PDF/PowerPoint reports make it simple to share findings and collaborate on solutions between technical and business teams.
-   **Context-Aware & Holistic**: By analyzing schemas, column statistics, sample data, and business rules together, the bot gains a holistic understanding of your data's intended state, leading to more accurate and relevant findings.

## Use Cases

The Data Quality Bot is a versatile tool for anyone who relies on high-quality data.

-   **Data Engineers**: Validate data integrity after ETL/ELT pipeline runs, detect unexpected changes from source systems, and ensure schema consistency across environments.
-   **Data Analysts & Scientists**: Ensure the reliability of datasets before performing exploratory analysis or training machine learning models. Reduce time spent on data cleaning and debugging.
-   **Data Stewards & Governance Teams**: Monitor the health of critical data assets, enforce enterprise-wide quality standards, and create a centralized view of data quality issues.
-   **Business Intelligence (BI) Developers**: Quickly troubleshoot inconsistencies in reports and dashboards by tracing them back to underlying data quality problems.

## How It Works

1.  **Provide Context**: Users input data context for one or more database tables. This includes table schemas, column-level statistics (e.g., null percentages, distinct counts), sample data rows, and business rules. Input can be provided manually or streamlined by uploading SQL files for schemas and CSV files for statistics.
2.  **AI-Powered Analysis**: The application constructs a detailed, context-rich prompt for each table and sends it to the `gemini-2.5-flash` model. The model is instructed to act as an expert data quality analyst, identifying issues based on the provided information.
3.  **Structured Results**: Gemini returns a structured JSON object containing a list of detected issues, each with a description, severity level (High, Medium, Low), possible cause, potential impact, and a recommended solution.
4.  **Visualize & Explore**: The results are displayed in an interactive dashboard where users can filter issues by severity, view a health summary for each table, and drill down into specific problems grouped by table and column.
5.  **Conversational Insights**: A built-in chat assistant allows users to ask follow-up questions about the results in natural language, making it easy to understand complex relationships and prioritize fixes.
6.  **Export & Share**: Findings can be exported into professional, stakeholder-ready formats, including a detailed PDF report or a PowerPoint presentation.

## Architecture

### Architecture Diagram

```mermaid
%%{init: { 'themeVariables': { 'fontSize': '16px', 'fontFamily': 'Arial' } }}%%
graph TD
    subgraph application_boundary [Application Boundary]
        subgraph userenv [User Environment]
            A[User via Browser HTTPS]:::userNode
        end

        B((Gateway)):::gatewayNode
        
        A -- Provides Data Context --> B

        subgraph botlogic [Data Quality Bot]
            subgraph ingest [Ingest]
                C[Data Input and Parsing]:::processNode
            end
            subgraph pipelines [Pipelines]
                D[Prompt Engineering]:::processNode
            end
            subgraph analytics [Analytics]
                E[Google Gemini API]:::apiNode
            end
            subgraph presentation [Presentation]
                F[Results Dashboard]:::outputNode
                G[AI Assistant]:::outputNode
                H[Export Engine]:::outputNode
            end
        end

        B --> C
        C --> D
        D -- Secure API Call --> E
        E -- JSON Response --> F
        F --> G
        F --> H
    end
    
    style application_boundary fill:#F1F5F9,stroke:#CBD5E1,color:#0f172a
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
```

### User Journey

```mermaid
%%{init: { 'themeVariables': { 'fontSize': '16px', 'fontFamily': 'Arial' } }}%%
graph TD
    subgraph user_journey [User Journey Flow]
        subgraph sg1 [Start]
            A[User Opens App]:::startNode
        end

        subgraph sg2 [Input]
            B{Provide Data Context}:::inputNode
            B1[Manual entry]:::inputNode
            B2[Upload SQL or CSV]:::inputNode
        end
        
        subgraph sg3 [Analysis]
            C[Click Analyze]:::analysisNode
            D[Bot calls Gemini API]:::analysisNode
            E[Receive Issues]:::analysisNode
        end

        subgraph sg4 [Insight and Action]
            F[View Dashboard]:::insightNode
            F1[Filter issues]:::insightNode
            F2[Review Health]:::insightNode
            G[Open AI Chat]:::insightNode
            H[Generate Summary]:::insightNode
            I[Export Reports]:::insightNode
            I1[PDF]:::insightNode
            I2[PowerPoint]:::insightNode
        end
        
        subgraph sg5 [Goal]
           J[Actionable Insights]:::goalNode
        end
    end

    A --> B
    B --> B1
    B --> B2
    B1 --> C
    B2 --> C
    C --> D
    D --> E
    E --> F
    F --> F1
    F --> F2
    F --> G
    F --> H
    H --> I
    I --> I1
    I --> I2
    I1 --> J
    I2 --> J
    G --> J
    
    style user_journey fill:#F1F5F9,stroke:#CBD5E1,color:#0f172a
    style sg1 fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    style sg2 fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    style sg3 fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    style sg4 fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    style sg5 fill:#FFFFFF,stroke:#DADCE0,color:#0f172a
    
    classDef startNode fill:#E8F0FE,stroke:#4285F4,stroke-width:2px,color:#0f172a
    classDef inputNode fill:#FEFCE8,stroke:#FBBC05,stroke-width:2px,color:#0f172a
    classDef analysisNode fill:#FCE8E6,stroke:#EA4335,stroke-width:2px,color:#0f172a
    classDef insightNode fill:#E6F4EA,stroke:#34A853,stroke-width:2px,color:#0f172a
    classDef goalNode fill:#E8EAF6,stroke:#3F51B5,stroke-width:2px,color:#0f172a
```

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xyAamros_C8svURq2EOGfViMYlkMgmEk

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`