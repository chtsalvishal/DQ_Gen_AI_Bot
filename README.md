<div align="center">
<img width="1200" height="475" alt="Data Quality Bot Banner showing the application interface with charts and detected issues." src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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

This application utilizes a simple, robust client-side architecture. The React frontend communicates directly and securely with the Google Gemini API to perform data quality analysis. There is no backend server, which simplifies deployment and reduces maintenance overhead.

```mermaid
graph TD
    subgraph "User's Device"
        A["👨‍💻<br/>User"] --> B["🌐<br/>Browser"];
    end

    subgraph "Client-Side Application"
        B --> C["React App<br/>(UI, State, Logic)"];
        C --> D["Google GenAI SDK"];
    end
    
    subgraph "Google Cloud"
        D -- "Secure API Call<br/>(HTTPS + API Key)" --> E["🚀<br/>Gemini API<br/>('gemini-2.5-flash')"];
        E -- "Structured JSON Response<br/>(Analysis Results)" --> D;
    end

    style A fill:#e3f2fd,stroke:#333,stroke-width:2px
    style B fill:#fffde7,stroke:#333,stroke-width:2px
    style C fill:#e0f7fa,stroke:#00796b,stroke-width:2px
    style D fill:#e0f7fa,stroke:#00796b,stroke-width:2px
    style E fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px
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