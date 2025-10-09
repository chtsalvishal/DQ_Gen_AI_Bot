# Data Quality Bot

An intelligent bot that analyzes data metadata and profile reports to detect potential data quality issues like anomalies, schema drift, and type mismatches, providing actionable recommendations.

## Solution Overview

The Data Quality Bot is a powerful web application designed for data engineers, analysts, and data stewards to proactively identify and address data quality issues. By leveraging the analytical capabilities of the Google Gemini API, the application goes beyond traditional rule-based validation, uncovering subtle anomalies, schema drifts, and inconsistencies that are difficult to detect manually.

### How It Works

1.  **Provide Context**: Users input data context for one or more database tables. This includes table schemas, column-level statistics (e.g., null percentages, distinct counts), sample data rows, and business rules. Input can be provided manually or streamlined by uploading SQL files for schemas and CSV files for statistics.
2.  **AI-Powered Analysis**: The application constructs a detailed, context-rich prompt for each table and sends it to the `gemini-2.5-flash` model. The model is instructed to act as an expert data quality analyst, identifying issues based on the provided information.
3.  **Structured Results**: Gemini returns a structured JSON object containing a list of detected issues, each with a description, severity level (High, Medium, Low), possible cause, potential impact, and a recommended solution.
4.  **Visualize & Explore**: The results are displayed in an interactive dashboard where users can filter issues by severity, view a health summary for each table, and drill down into specific problems grouped by table and column.
5.  **Conversational Insights**: A built-in chat assistant allows users to ask follow-up questions about the results in natural language, making it easy to understand complex relationships and prioritize fixes.
6.  **Export & Share**: Findings can be exported into professional, stakeholder-ready formats, including a detailed PDF report or a PowerPoint presentation.

### Architecture Diagram

```mermaid
%%{init: { 'themeVariables': { 'fontSize': '16px', 'fontFamily': 'Arial' } }}%%
graph TD
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
    
    style userenv fill:#F8F9FA,stroke:#5F6368,color:#0f172a
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