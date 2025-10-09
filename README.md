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
    subgraph architecture_diagram [<h4>Architecture Diagram</h4>]
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
<p align="right"><a href="https://mermaid.live/view#base64:JSV7aW5pdDogeyAndGhlbWVWYXJpYWJsZXMnOiB7ICdmb250U2l6ZSc6ICczNnB4JywgJ2ZvbnRGYW1pbHknOiAnIlNlZ29lIFVJIiwgQXJpYWwsIHNhbnMtc2VyaWYnIH0gfX0lJQ0KZ3JhcGggVEQNCiAgICBzdWJncmFwaCBhcmNoaXRlY3R1cmVfZGlhZ3JhbSBbPGg0PkFyY2hpdGVjdHVyZSBEaWFncmFtPC9oND5dDQogICAgICAgIHN1YmdyYXBoIHVzZXJlbnYgW1VzZXIgRW52aXJvbm1lbnRdDQogICAgICAgICAgICBBLtVzZXIgdmlhIEJyb3dzZXIgSFRUUFNdOjo6dXNlck5vZGUNCiAgICAgICAgZW5kDQoNCiAgICAgICAgQigoR2F0ZXdheSkpOjo6Z2F0ZXdheU5vZGUNCiAgICAgICAgDQogICAgICAgIEEgLS0gUHJvdmlkZXMgRGF0YSBDb250ZXh0IC0tPiBCDQoNCiAgICAgICAgc3ViZ3JhcGggYm90bG9naWMgW0RhdGEgUXVhbGl0eSBCb3RdDQogICAgICAgICAgICBzdWJncmFwaCBpbmdlc3QgW0luZ2VzdF0NCiAgICAgICAgICAgICAgICBDW0RhdGEgSW5wdXQgYW5kIFBhcnNpbmddOjo6cHJvY2Vzc05vZGUNCiAgICAgICAgICAgIGVuZA0KICAgICAgICAgICAgc3ViZ3JhcGggcGlwZWxpbmVzIFtQaXBlbGluZXNdDQogICAgICAgICAgICAgICAgRFtQcm9tcHQgRW5naW5lZXJpbmddOjo6cHJvY2Vzc05vZGUNCiAgICAgICAgICAgIGVuZA0KICAgICAgICAgICAgc3ViZ3JhcGggYW5hbHl0aWNzIFtBbmFseXRpY3NdDQogICAgICAgICAgICAgICAgRVtHb29nbGUgR2VtaW5pIEFQSV06Ojp hcGlOb2RlDQogICAgICAgICAgICBlbmQNCiAgICAgICAgICAgIHN1YmdyYXBoIHByZXNlbnRhdGlvbiBbUHJlc2VudGF0aW9uXQ0KICAgICAgICAgICAgICAgIEZbUmVzdWx0cyBEYXNoYm9hcmRdOjo6b3V0cHV0Tm9kZQ0KICAgICAgICAgICAgICAgIEdbQUkgQXNzaXN0YW50XTo6Om91dHB1dE5vZGUNCiAgICAgICAgICAgICAgICBIW0V4cG9ydCBFbmdpbmVdOjo6b3V0cHV0Tm9kZQ0KICAgICAgICAgICAgZW5kDQogICAgICAgIGVuZA0KDQogICAgICAgIEIgLS0+IEMNCiAgICAgICAgQyAtLT4gRA0KICAgICAgICBEIC0tIFNlY3VyZSBBUEkgQ2FsbCAtLT4gRQ0KICAgICAgICBFIC0tIEpTT04gUmVzcG9uc2UgLS0+IEYNCiAgICAgICAgRiAtLT4gRw0KICAgICAgICBGLS0+IEgNCiAgICBlbmQNCiAgICANCiAgICBzdHlsZSBhcmNoaXRlY3R1cmVfZGlhZ3JhbSBmaWxsOiNGMUY1RjksaW50cm9rZTojQ0JENUUxLGNvbG9yOiMwZjE3MmENCiAgICBzdHlsZSB1c2VyZW52IGZpbGw6I0ZGRkZGRixzdHJva2U6Izk0QTNCOCxjb2xvcjojMGYxNzJhDQogICAgc3R5bGUgYm90bG9naWMgZmlsbDojRkZGRkZGLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmENCiAgICBzdHlsZSBpbmdlc3QgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmENCiAgICBzdHlsZSBwaXBlbGluZXMgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmENCiAgICBzdHlsZSBhbmFseXRpY3MgZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmENCiAgICBzdHlsZSBwcmVzZW50YXRpb24gZmlsbDojRjhGOUZBLHN0cm9rZTojREFEQ0UwLGNvbG9yOiMwZjE3MmENCg0KICAgIGNsYXNzRGVmIHVzZXJOb2RlIGZpbGw6I0ZFRkNFOODRzcm9rZTojRkJCRjI0LHN0cm9rZS13aWR0aDoycHgsY29sb3I6IzBmMTcyYQ0KICAgIGNsYXNzRGVmIGdhdGV3YXlOb2RlIGZpbGw6I0YxRjNGNCxzdHJva2U6IzcwNzU3QSxzdHJva2Utd2lkdGg6MnB4LGNvbG9yOiMwZjE3MmENCiAgICBjbGFzc0RlZiBwcm9jZXNzTm9kZSBmaWxsOiNFOUMzRkQsc3Ryb2tlOiM0Mjg1RjQsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJhDQogICAgY2xhc3NEZWYgYXBpTm9kZSBmaWxsOiNFNkY0RUEsc3Ryb2tlOiMzNEE4NTMsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJhDQogICAgY2xhc3NEZWYgb3V0cHV0Tm9kZSBmaWxsOiNGQ0U4RTZsc3Ryb2tlOiNFQTQzMzUsc3Ryb2tlLXdpZHRoOjJweCxjb2xvcjojMGYxNzJh" target="_blank" rel="noopener">Maximize Diagram</a></p>

### User Journey

```mermaid

graph TD
    subgraph user_journey [<h3>User Journey</h3>]

        subgraph sg1 [**1. Start**]
            A["**Initiate Session**<br><br>User opens the<br>Data Quality Bot<br>application.<br>"]:::startNode
        end

        subgraph sg2 [**2. Input & Context**]
            B["**Provide Data Context**<br><br>User inputs metadata,<br>statistics, and<br>business rules.<br>"]:::inputNode
            B --> B1["**Manual Entry**<br><br>Type or paste<br>details directly<br>into the form.<br>"]:::inputNode
            B --> B2["**File Upload**<br><br>Import context via<br>.sql and .csv files<br>for efficiency.<br>"]:::inputNode
        end
        
        subgraph sg3 [**3. AI Analysis**]
            C["**Trigger Analysis**<br><br>Click 'Analyze'<br>to start the AI<br>quality assessment.<br>"]:::analysisNode
            D["**Gemini Processing**<br><br>The app sends a detailed,<br>context-rich prompt for<br>each table to the AI.<br><br>"]:::analysisNode
            E["**Receive Results**<br><br>A structured JSON<br>response is returned<br>with all findings.<br>"]:::analysisNode
        end

        subgraph sg4 [**4. Insight & Action**]
            F["**Explore Dashboard**<br><br>Visualize results, filter<br>issues, and review<br>table health scores.<br>"]:::insightNode
            G["**Conversational AI**<br><br>Ask follow-up questions<br>to the integrated<br>AI Assistant.<br>"]:::insightNode
            H["**Export & Share**<br><br>Generate professional PDF<br>or PowerPoint reports<br>for stakeholders.<br>"]:::insightNode
        end
        
        subgraph sg5 [**5. Goal**]
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
<p align="right"><a href="https://mermaid.live/view#base64:Z3JhcGggVEQNCiAgICBzdWJncmFwaCB1c2VyX2pvdXJuZXkgWzxoMz5Vc2VyIEpvdXJuZXk8L2gzPl0NCg0KICAgICAgICBzdWJncmFwaCBzZzEgWyoqMS4gU3RhcnQqKl0NCiAgICAgICAgICAgIEFbIioqSW5pdGlhdGUgU2Vzc2lvbioqPGJyPjxicj5Vc2VyIG9wZW5zIHRoZTxicj5EYXRhIFF1YWxpdHkgQm90PGJyPmFwcGxpY2F0aW9uLjxicj4iXTo6OnN0YXJ0Tm9kZQ0KICAgICAgICBlbmQNCg0KICAgICAgICBzdWJncmFwaCBzZzIgWyoqMi4gSW5wdXQgJiBDb250ZXh0KipdDQogICAgICAgICAgICBCWyIqKlByb3ZpZGUgRGF0YSBDb250ZXh0Kio8YnI+PGJyPlVzZXIgaW5wdXRzIG1ldGFkYXRhLDxicj5zdGF0aXN0aWNzLCBhbmQ8YnI+YnVzaW5lc3MgcnVsZXMuPGJyPiJdOjo6aW5wdXROb2RlDQogICAgICAgICAgICBCIC0tPiBCMVsiKipNYW51YWwgRW50cnkqKjxicj48YnI+VHlwZSBvciBwYXN0ZTxicj5kZXRhaWxzIGRpcmVjdGx5PGJyPmludG8gdGhlIGZvcm0uPGJyPiJdOjo6aW5wdXROb2RlDQogICAgICAgICAgICBCIC0tPiBCMlsiKipGaWxlIFVwbG9hZCooPGJyPjxicj5JbXBvcnQgY29udGV4dCB2aWE8YnI+LnNxbCBhbmQgLmNzdiBmaWxlczxicj5mb3IgZWZmaWNpZW5jeS48YnI+Il06Ojp pbnB1dE5vZGUNCiAgICAgICAgZW5kDQogICAgICAgIA0KICAgICAgICBzdWJncmFwaCBzZzMgWyoqMy4gQUkgQW5hbHlzaXMqKl0NCiAgICAgICAgICAgIENbIioqVHJpZ2dlciBBbmFseXNpcyoqPGJyPjxicj5DbGljayAnQW5hbHl6ZSc8YnI+dG8gc3RhcnQgdGhlIEFJPGJyPnF1YWxpdHkgYXNzZXNzbWVudC48YnI+Il06Ojp hbmFseXNpc05vZGUNCiAgICAgICAgICAgIERbIioqR2VtaW5pIFByb2Nlc3NpbmcqKjxicj48YnI+VGhlIGFwcCBzZW5kcyBhIGRldGFpbGVkLDxicj5jb250ZXh0LXJpY2ggcHJvbXB0IGZvcjxicj5lYWNoIHRhYmxlIHRvIHRoZSBBS S48YnI+PGJyPiJdOjo6YW5hbHlzaXNOb2RlDQogICAgICAgICAgICBFWyIqKlJlY2VpdmUgUmVzdWx0cyoqPGJyPjxicj5BIHN0cnVjdHVyZWQgSlNPTjxicj5yZXNwb25zZSBpcyByZXR1cm5lZDxicj53aXRoIGFsbCBmaW5kaW5ncy48YnI+Il06Ojp hbmFseXNpc05vZGUNCiAgICAgICAgZW5kDQoNCiAgICAgICAgc3ViZ3JhcGggc2c0IFsqKjQuIEluc2lnaHQgJiBBY3Rpb24qKl0NCiAgICAgICAgICAgIEZbIioqRXhwbG9yZSBEYXNoYm9hcmQqKjxicj48YnI+VmlzdWFsaXplIHJlc3VsdHMsIGZpbHRlcjxicj5pc3N1ZXMsIGFuZCByZXZpZXc8YnI+dGFibGUgaGVhbHRoIHNjb3Jlcy48YnI+Il06Ojp pbnNpZ2h0Tm9kZQ0KICAgICAgICAgICAgR1siKipDb252ZXJzYXRpb25hbCBBSSoqPGJyPjxicj5Bc2sgZm9sbG93LXVwIHF1ZXN0aW9uczxicj50byB0aGUgaW50ZWdyYXRlZDxicj5BSSBBc3Npc3RhbnQuPGJyPiJdOjo6aW5zaWdodE5vZGUNCiAgICAgICAgICAgIEhbIioqRXhwb3J0ICYgU2hhcmUqKjxicj48YnI+R2VuZXJhdGUgcHJvZmVzc2lvbmFsIFBERjxicj5vciBQb3dlclBvaW50IHJlcG9ydHM8YnI+Zm9yIHN0YWtlaG9sZGVycy48YnI+Il06Ojp pbnNpZ2h0Tm9kZQ0KICAgICAgICBlbmQNCiAgICAgICAgDQogICAgICAgIHN1YmdyYXBoIHNnNSBbKio1LiBHb2FsKipdDQogICAgICAgICAgIEpbIioqQWNoaWV2ZSBEYXRhIEludGVncml0eSoqPGJyPjxicj5Vc2VyIGdhaW5zIGNsZWFyLCBhY3Rpb25hYmxlPGJyPmluc2lnaHRzIHRvIGltcHJvdmUgYW5kPGJyPm1haW50YWluIGRhdGEgcXVhbGl0eS48YnI+Il06Ojpnb2FsTm9kZQ0KICAgICAgICBlbmQNCiAgICBlbmQNCg0KICAgIEEgLS0+IEINCiAgICBCMSAtLT4gQw0KICAgIEIyIC0tPiBDDQogICAgQyAtLT4gRCAtLT4gRQ0KICAgIEUgLS0+IEYNCiAgICBGIC0tPiBHICYgSA0KICAgIEcgLS0+IEoNCiAgICBIIC0tPiBKDQogICAgDQogICAgc3R5bGUgdXNlcl9qb3VybmV5IGZpbGw6I0VGRjZGRixzdHJva2U6I0JGREJGRSxjb2xvcjojMWUyOTNiDQogICAgc3R5bGUgc2cxIGZpbGw6I0Y4RjlGQSxzdHJva2U6I0RBRENFMCxjb2xvcjojMGYxNzJhDQogICAgc3R5bGUgc2cyIGZpbGw6I0Y4RjlGQSxzdHJva2U6I0RBRENFMCxjb2xvcjojMGYxNzJhDQogICAgc3R5bGUgc2czIGZpbGw6I0Y4RjlGQSxzdHJva2U6I0RBRENFMCxjb2xvcjojMGYxNzJhDQogICAgc3R5bGUgc2c0IGZpbGw6I0Y4RjlGQSxzdHJva2U6I0RBRENFMCxjb2xvcjojMGYxNzJhDQogICAgc3R5bGUgc2c1IGZpbGw6I0Y4RjlGQSxzdHJva2U6I0RBRENFMCxjb2xvcjojMGYxNzJhDQoNCiAgICBjbGFzc0RlZiBzdGFydE5vZGUgZmlsbDojRThGMEZFLHN0cm9rZTojNEE5MEUyLHN0cm9rZS13aWR0aDozcHgsY29sb3I6IzIxMjUyOSxmb250LXdlaWdodDpib2xkDQogICAgY2xhc3NEZWYgaW5wdXROb2RlIGZpbGw6I0ZFRjlFNyxzdHJva2U6I0Y1QjA0MSxzdHJva2Utd2lkdGg6M3B4LGNvbG9yOiMyMTI1MjkNCiAgICBjbGFzc0RlZiBhbmFseXNpc05vZGUgZmlsbDojRkRFRkVGLHN0cm9rZTojRTc0QzNDLHN0cm9rZS13aWR0aDozcHgsY29sb3I6IzIxMjUyOQ0KICAgIGNsYXNzRGVmIGluc2lnaHROb2RlIGZpbGw6I0U4RjhGNSxzdHJva2U6IzJFQ0M3MSxzdHJva2Utd2lkdGg6M3B4LGNvbG9yOiMyMTI1MjkNCiAgICBjbGFzc0RlZiBnb2FsTm9kZSBmaWxsOiNFQUVCRkMsc3Ryb2tlOiM1RDY5QjEsc3Ryb9rZS13aWR0aDozcHgsY29sb3I6IzIxMjUyOSxmb250LXdlaWdodDpib2xk" target="_blank" rel="noopener">Maximize Diagram</a></p>

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