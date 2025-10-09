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
%%{init: { 'themeVariables': { 'fontSize': '36px', 'fontFamily': '"Segoe UI", Arial, sans-serif' } }}%%
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
```
<p align="right"><a href="https://mermaid.live/view#base64:eyJjb2RlIjoiJSV7aW5pdDogeyAndGhlbWVWYXJpYWJsZXMnOiB7ICdmb250U2l6ZSc6ICczNnB4JywgJ2ZvbnRGYW1pbHknOiAnXCJTZWdvZSBVSVwiLCBBcmlhbCwgc2Fucy1zZXJpZicgfSB9fSUlXG5ncmFwaCBURFxuICAgIHN1YmdyYXBoIGFyY2hpdGVjdHVyZV9kaWFncmFtIFtcIkFyY2hpdGVjdHVyZSBEaWFncmFtXCJdXG4gICAgICAgIHN1YmdyYXBoIHVzZXJlbnYgW1wiVXNlciBFbnZpcm9ubWVudFwiXVxuICAgICAgICAgICAgQVtcIlVzZXIgdmlhIEJyb3dzZXIgKEhUVFBTKVwiXTo6OnVzZXJOb2RlXG4gICAgICAgIGVuZFxuXG4gICAgICAgIEIoKEdhdGV3YXkpKTo6OmdhdGV3YXlOb2RlXG4gICAgICAgIFxuICAgICAgICBBIC0tIFwiUHJvdmlkZXMgRGF0YSBDb250ZXh0XCIgLS0+IEJcblxuICAgICAgICBzdWJncmFwaCBib3Rsb2dpYyBbXCJEYXRhIFF1YWxpdHkgQm90XCJdXG4gICAgICAgICAgICBzdWJncmFwaCBpbmdlc3QgW0luZ2VzdF1cbiAgICAgICAgICAgICAgICBDW1wiRGF0YSBJbnB1dCBhbmQgUGFyc2luZ1wiXTo6OnByb2Nlc3NOb2RlXG4gICAgICAgICAgICBlbmRcbiAgICAgICAgICAgIHN1YmdyYXBoIHBpcGVsaW5lcyBbUGlwZWxpbmVzXVxuICAgICAgICAgICAgICAgIEVbXCJQcm9tcHQgRW5naW5lZXJpbmddOjo6cHJvY2Vzc05vZGVcbiAgICAgICAgICAgIGVuZFxuICAgICAgICAgICAgc3ViZ3JhcGggYW5hbHl0aWNzIFtBbmFseXRpY3NdXG4gICAgICAgICAgICAgICAgRVtcIkdvb2dsZSBHZW1pbmkgQVBJXCJdOjo6YXBpTm9kZVxuICAgICAgICAgICAgZW5kXG4gICAgICAgICAgICBzdWJncmFwaCBwcmVzZW50YXRpb24gW1ByZXNlbnRhdGlvbl1cbiAgICAgICAgICAgICAgICBGW1wiUmVzdWx0cyBEYXNoYm9hcmRcIl06OjpvdXRwdXROb2RlXG4gICAgICAgICAgICAgICAgR1tcIkFJIExzc2lzdGFudFwiXTo6Om91dHB1dE5vZGVcbiAgICAgICAgICAgICAgICBIW1wiRXhwb3J0IEVuZ2luZVwiXTo6Om91dHB1dE5vZGVcbiAgICAgICAgICAgIGVuZFxuICAgICAgICBlbmRcblxuICAgICAgICBCIC0tPiBDXG4gICAgICAgIEMgLS0+IERcbiAgICAgICAgRCAtLSBcIlNlY3VyZSBBUEkgQ2FsbFwiIC0tPiBFXG4gICAgICAgIEUgLS0gXCJKU09OIFJlc3BvbnNlXCIgLS0+IEZcbiAgICAgICAgRiAtLT4gR1xuICAgICAgICBGIC0tPiBIXG4gICAgZW5kXG4gICAgXG4gICAgc3R5bGUgYXJjaGl0ZWN0dXJlX2RpYWdyYW0gZmlsbDojRjFGNUZZLHlncm9rZTojQ0JENUUxLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSB1c2VyZW52IGZpbGw6I0ZGRkZGRixzdHJva2U6Izk0QTNCOCxjb2xvcjojMGYxNzJhXG4gICAgc3R5bGUgYm90bG9naWMgZmlsbDojRkZGRkZGLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBpbmdlc3QgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBwaXBlbGluZXMgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBhbmFseXRpY3MgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBwcmVzZW50YXRpb24gZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcblxuICAgIGNsYXNzRGVmIHVzZXJOb2RlIGZpbGw6I0ZFRkNFOODRzcm9rZTojRkJCRjI0LHN0cm9rZS13aWR0aDoycHgsY29sb3I6IzBmMTcyYVxuICAgIGNsYXNzRGVmIGdhdGV3YXlOb2RlIGZpbGw6I0YxRjNGNCxzdHJva2U6IzcwNzU3QSxzdHJva2Utd2lkdGg6MnB4LGNvbG9yOiMwZjE3MmFcbiAgICBjbGFzc0RlZiBwcm9jZXNzTm9kZSBmaWxsOiNFOUMzRkQsc3Ryb2tlOiM0Mjg1RjQsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJhXG4gICAgY2xhc3NEZWYgYXBpTm9kZSBmaWxsOiNFNkY0RUEsc3Ryb2tlOiMzNEE4NTMsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJhXG4gICAgY2xhc3NEZWYgb3V0cHV0Tm9kZSBmaWxsOiNGQ0U4RTZsc3Ryb2tlOiNFQTQzMzUsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJhIiwibWVybWFpZCI6IntcInRoZW1lXCI6XCJkZWZhdWx0XCJ9IiwiYXV0b1N5bmMiOnRydWV9" target="_blank" rel="noopener">Maximize Diagram</a></p>

### User Journey

```mermaid
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
```
<p align="right"><a href="https://mermaid.live/view#base64:eyJjb2RlIjoiZ3JhcGggVERcbiAgICBzdWJncmFwaCB1c2VyX2pvdXJuZXkgW1wiVXNlciBKb3VybmV5XCJdXG5cbiAgICAgICAgc3ViZ3JhcGggc2cxIFtcIioqMS4gU3RhcnQqKlwiXVxuICAgICAgICAgICAgQVtcIioqSW5pdGlhdGUgU2Vzc2lvbioqPGJyPjxicj5Vc2VyIG9wZW5zIHRoZTxicj5EYXRhIFF1YWxpdHkgQm90PGJyPmFwcGxpY2F0aW9uLjxicj5cIl06OjpzdGFydE5vZGVcbiAgICAgICAgZW5kXG5cbiAgICAgICAgc3ViZ3JhcGggc2cyIFtcIioqMi4gSW5wdXQgJiBDb250ZXh0KipcIl1xuICAgICAgICAgICAgQltcIioqUHJvdmlkZSBEYXRhIENvbnRleHQqKjxicj48YnI+VXNlciBpbnB1dHMgbWV0YWRhdGEsPGJyPnN0YXRpc3RpY3MsIGFuZDxicj5idXNpbmVzcyBydWxlcy48YnI+XCJdOjo6aW5wdXROb2RlXG4gICAgICAgICAgICBCIC0tPiBCMVtcIioqTWFudWFsIEVudHJ5Kio8YnI+PGJyPlR5cGUgb3IgcGFzdGU8YnI+ZGV0YWlscyBkaXJlY3RseTxicj5pbnRvIHRoZSBmb3JtLjxicj5cIl06Ojp pbnB1dE5vZGVcbiAgICAgICAgICAgIEIgLS0+IEIyW1wiKipGaWxlIFVwbG9hZCooPGJyPjxicj5JbXBvcnQgY29udGV4dCB2aWE8YnI+LnNxbCBhbmQgLmNzdiBmaWxlczxicj5mb3IgZWZmaWNpZW5jeS48YnI+XCJdOjo6aW5wdXROb2RlXG4gICAgICAgIGVuZFxuICAgICAgICBcbiAgICAgICAgc3ViZ3JhcGggc2czIFtcIioqMy4gQUkgQW5hbHlzaXMqKlwiXVxuICAgICAgICAgICAgQ1tcIioqVHJpZ2dlciBBbmFseXNpcyoqPGJyPjxicj5DbGljayAnQW5hbHl6ZSc8YnI+dG8gc3RhcnQgdGhlIEFJPGJyPnF1YWxpdHkgYXNzZXNzbWVudC48YnI+XCJdOjo6YW5hbHlzaXNOb2RlXG4gICAgICAgICAgICBEW1wiKipHZW1pbmkgUHJvY2Vzc2luZyoqPGJyPjxicj5UaGUgYXBwIHNlbmRzIGEgZGV0YWlsZWQsPGJyPmNvbnRleHQtcmljaCBwcm9tcHQgZm9yPGJyPmVhY2ggdGFibGUgdG8gdGhlIEFJLjxicj48YnI+XCJdOjo6YW5hbHlzaXNOb2RlXG4gICAgICAgICAgICBFW1wiKipSZWNlaXZlIFJlc3VsdHMqKjxicj48YnI+QSBzdHJ1Y3R1cmVkIEpTT048YnI+cmVzcG9uc2UgaXMgcmV0dXJuZWQ8YnI+d2l0aCBhbGwgZmluZGluZ3MuPGJyPlwiXTo6OmFuYWx5c2lzTm9kZVxuICAgICAgICBlbmRcblxuICAgICAgICBzdWJncmFwaCBzZzQgW1wiKio0LiBJbnNpZ2h0ICYgQWN0aW9uKipcIl1xuICAgICAgICAgICAgRltcIioqRXhwbG9yZSBEYXNoYm9hcmQqKjxicj48YnI+VmlzdWFsaXplIHJlc3VsdHMsIGZpbHRlcjxicj5pc3N1ZXMsIGFuZCByZXZpZXc8YnI+dGFibGUgaGVhbHRoIHNjb3Jlcy48YnI+XCJdOjo6aW5zaWdodE5vZGVcbiAgICAgICAgICAgIEdbXCIqKkNvbnZlcnNhdGlvbmFsIEFJKio8YnI+PGJyPkFzayBmb2xsb3ctdXAgcXVlc3Rpb25zPGJyPnRvIHRoZSBpbnRlZ3JhdGVkPGJyPkFJIExzc2lzdGFudC48YnI+XCJdOjo6aW5zaWdodE5vZGVcbiAgICAgICAgICAgIEhbXCIqKkV4cG9ydCAmIFNoYXJlKio8YnI+PGJyPkdlbmVyYXRlIHByb2Zlc3Npb25hbCBQREY8YnI+b3IgUG93ZXJQb2ludCByZXBvcnRzPGJyPmZvciBzdGFrZWhvbGRlcnMuPGJyPlwiXTo6Omluc2lnaHROb2RlXG4gICAgICAgIGVuZFxuICAgICAgICBcbiAgICAgICAgc3ViZ3JhcGggc2c1IFtcIioqNS4gR29hbCoqXCJdXG4gICAgICAgICAgIEpbXCIqKkFjaGlldmUgRGF0YSBJbnRlZ3JpdHkqKjxicj48YnI+VXNlciBnYWlucyBjbGVhciwgYWN0aW9uYWJsZTxicj5pbnNpZ2h0cyB0byBpbXByb3ZlIGFuZDxicj5tYWludGFpbiBkYXRhIHF1YWxpdHkuPGJyPlwiXTo6OmdvYWxOb2RlXG4gICAgICAgIGVuZFxuICAgIGVuZFxuXG4gICAgQSAtLT4gQlxuICAgIEIxIC0tPiBDXG4gICAgQjIgLS0+IEMgXG4gICAgQyAtLT4gRCAtLT4gRVxuICAgIEUgLS0+IEYgXG4gICAgRiAtLT4gRyAmIEggXG4gICAgRyAtLT4gSlxuICAgIEggLS0+IEpcbiAgICBcbiAgICBzdHlsZSB1c2VyX2pvdXJuZXkgZmlsbDojRUZGNkZGLHN0cm9rZTojQkZEQkZFLGNvbG9yOiMxZTI5M2JcbiAgICBzdHlsZSBzZzEgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBzZzIgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBzZzMgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBzZzQgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcbiAgICBzdHlsZSBzZzUgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmFcblxuICAgIGNsYXNzRGVmIHN0YXJ0Tm9kZSBmaWxsOiNFOEYwRkUsc3Ryb2tlOiM0QTkwRTIsY3Ryb2tlLXdpZHRoOjNweCxjb2xvcjojMjEyNTI5LGZvbnQtd2VpZ2h0OmJvbGRcbiAgICBjbGFzc0RlZiBpbnB1dE5vZGUgZmlsbDojRkVGOUU3LHN0cm9rZTojRjVCMDQxLHN0cm9rZS13aWR0aDozcHgsY29sb3I6IzIxMjUyOVxuICAgIGNsYXNzRGVmIGFuYWx5c2lzTm9kZSBmaWxsOiNGREVGRUYsc3Ryb2tlOiNFNzRDMyMsc3Ryb2tlLXdpZHRoOjNweCxjb2xvcjojMjEyNTI5XG4gICAgY2xhc3NEZWYgaW5zaWdodE5vZGUgZmlsbDojRThGOEY1LHN0cm9rZTojMkVDQzcxLHN0cm9rZS13aWR0aDozcHgsY29sb3I6IzIxMjUyOVxuICAgIGNsYXNzRGVmIGdvYWxOb2RlIGZpbGw6I0VBRUJGQyxzdHJva2U6IzVENjlCMSxzdHJva2Utd2lkdGg6M3B4LGNvbG9yOiMyMTI1Mjkmb250LXdlaWdodDpib2xkIiwibWVybWFpZCI6IntcInRoZW1lXCI6XCJkZWZhdWx0XCJ9IiwiYXV0b1N5bmMiOnRydWV9" target="_blank" rel="noopener">Maximize Diagram</a></p>

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