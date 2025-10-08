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

## Architecture Diagram

<div style="background-color: #4A89F3; color: white; padding: 12px 20px; font-family: sans-serif; font-size: 16px; border-radius: 4px;">
  <b>Architecture: General > Data Quality Analysis > Client-Side AI Processing</b>
</div>

```mermaid
graph LR
    %% Main containers for visual grouping
    subgraph user_env [User Environment]
        direction TB
        A["💻<br><b>Standard Devices</b><br>User via Browser (HTTPS)"]
    end

    subgraph gateway_sub [" "]
      direction LR
      B((Gateway))
    end
    
    A --> B

    subgraph bot_logic ["Data Quality Bot (Client-Side Logic)"]
        direction LR

        subgraph ingest_sub [Ingest]
            direction TB
            C["📝<br><b>Data Input & Parsing</b><br>Manual Entry, SQL/CSV Uploads"]
        end

        subgraph pipelines_sub [Pipelines]
            direction TB
            D["⚙️<br><b>Prompt Engineering</b><br>Constructs contextual prompts"]
        end

        subgraph analytics_sub [Analytics]
            direction TB
            E["✨<br><b>Google Gemini API</b><br>Analyzes data and returns structured JSON"]
        end

        subgraph app_sub ["Application & Presentation"]
            direction TB
            F["📊<br><b>Results Dashboard</b><br>Visualizes issues"]
            G["💬<br><b>AI Assistant</b><br>For conversational insights"]
            H["📤<br><b>Export Engine</b><br>Generates PDF & PPTX"]
        end
    end

    B --> C
    C --> D
    D -- "Secure API Call" --> E
    E -- "JSON Response" --> F
    F --> G & H & A
    
    %% Style Definitions to mimic GCP diagram
    style user_env fill:#f3e5f5,stroke:#6a1b9a,stroke-width:1px
    style A fill:#fff,stroke:#6a1b9a,stroke-width:2px
    style B fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#6a1b9a
    
    style ingest_sub fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    style C fill:#fff,stroke:#1565c0,stroke-width:2px

    style pipelines_sub fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    style D fill:#fff,stroke:#1565c0,stroke-width:2px

    style analytics_sub fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    style E fill:#fff,stroke:#1565c0,stroke-width:2px
    
    style app_sub fill:#e3f2fd,stroke:#1565c0,stroke-width:1px
    style F fill:#fff,stroke:#1565c0,stroke-width:2px
    style G fill:#fff,stroke:#1565c0,stroke-width:2px
    style H fill:#fff,stroke:#1565c0,stroke-width:2px
```

## User Journey

The following diagram illustrates the typical workflow a user follows when interacting with the Data Quality Bot, from providing initial data to exporting final, actionable insights.

```mermaid
graph TD
    subgraph "1. Start"
        A[👨‍💻 User Opens App]
    end

    subgraph "2. Input Phase"
        B{Provide Data Context}
        B1[📝 Manually enters data]
        B2[📤 Uploads SQL & CSV files]
    end
    
    subgraph "3. Analysis Phase"
        C[🚀 Clicks 'Analyze Data']
        D["🤖 Bot constructs prompts & calls Gemini API"]
        E["✨ Gemini returns a structured list of issues"]
    end

    subgraph "4. Insight & Action Phase"
        F[📊 Views Interactive Dashboard]
        F1[🔍 Filters issues by severity/table]
        F2[🩺 Reviews Table Health & Hotspots]
        G[💬 Opens AI Chat Assistant for questions]
        H[📜 Generates AI-powered Summary]
        I[📤 Exports Professional Reports]
        I1[📄 Detailed PDF Format]
        I2[💻 PowerPoint Slides Format]
    end
    
    subgraph "5. Goal"
       J[✅ User has actionable insights to improve data quality]
    end

    A --> B
    B --> B1 & B2
    B1 --> C
    B2 --> C
    C --> D
    D --> E
    E --> F
    F --> F1 & F2 & G & H
    H --> I
    I --> I1 & I2
    I1 --> J
    I2 --> J
    G --> J
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