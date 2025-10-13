import { GoogleGenAI, Type } from '@google/genai';
import { DataQualityInputs, Issue, RuleConflict, RuleEffectiveness, SchemaVisualizationData, FullAnalysisResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateContentWithRetry = async (
  model: string,
  contents: string,
  config: any,
  retries = 3,
  initialDelayMs = 4000
): Promise<any> => {
  let lastError: any = null;
  let delayMs = initialDelayMs;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return response;
    } catch (e) {
      lastError = e;
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Rate limit hit. Retrying in ${delayMs}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      } else {
        throw e;
      }
    }
  }
  throw lastError;
};

export const performFullAnalysis = async (inputs: DataQualityInputs): Promise<FullAnalysisResponse> => {
  if (!inputs.tables || inputs.tables.length === 0) {
    return { 
        issues_detected: [], 
        rule_analysis: [], 
        rule_conflicts: [], 
        schema_visualizations: { nodes: [], edges: [], ruleCoverage: [], hotspots: [] } 
    };
  }

  const tableContext = inputs.tables.map(table => `
    --- TABLE: ${table.name || 'Unnamed Table'} ---
    Schema:
    ${table.schema || 'Not provided.'}
    Statistics:
    ${table.stats || 'Not provided.'}
    Samples:
    ${table.samples || 'Not provided.'}
    Table-Specific Rules:
    ${table.rules || 'Not provided.'}
  `).join('\n\n');

  const allRules = `
    Global Rules: ${inputs.rules || 'None'}
    ${inputs.tables.map(t => `Rules for ${t.name}: ${t.rules || 'None'}`).join('\n')}
  `;

  const schemaSummary = inputs.tables.map(table => {
      const columns = (table.schema.match(/CREATE TABLE[\s\S]*?\(([\s\S]*?)\)/i) || ["", ""])[1]
        .split('\n')
        .map(line => line.trim().split(/\s+/)[0])
        .filter(c => c && c !== 'PRIMARY' && c !== 'FOREIGN' && c !== 'UNIQUE')
        .join(', ');
      
      return `Table: ${table.name}\nColumns: ${columns}`;
    }).join('\n');

  const prompt = `
    You are a world-class Data Quality and Governance Bot. Your task is to perform a complete, multi-faceted analysis based on the provided database context.
    You MUST perform all three of the following tasks and return a single, consolidated JSON object that adheres to the provided schema.

    ---
    ### DATABASE CONTEXT
    ---
    ${tableContext}

    Global Business Rules:
    ${inputs.rules || 'Not provided.'}

    Historical Context:
    ${inputs.history || 'Not provided.'}

    ---
    ### TASK 1: Data Quality Issue Detection
    ---
    **GOAL:** Analyze each table's context to identify data quality issues like anomalies, schema drift, etc.
    **INSTRUCTIONS:**
    - For each issue, you MUST specify 'table_name'.
    - If an issue violates a business rule, its 'type' MUST be exactly "Business Rule Violation".
    - The output for this task should populate the 'issues_detected' array in the final JSON.

    ---
    ### TASK 2: Meta-Analysis (Rules Engine)
    ---
    **GOAL:** Assess rule effectiveness and detect conflicts.
    **INSTRUCTIONS:**
    1.  **Rule Effectiveness:** Compare all business rules against the issues you detected in TASK 1. For each rule, determine its 'status' ('Triggered', 'Not Triggered', 'High Volume'), and provide an 'observation' and 'recommendation'. This populates the 'rule_analysis' array.
    2.  **Rule Conflicts:** Analyze all business rules for contradictions or overlaps. For each conflict, detail the 'conflicting_rules', an 'explanation', and a 'recommendation'. This populates the 'rule_conflicts' array.

    ---
    ### TASK 3: Schema Visualization Data Generation
    ---
    **GOAL:** Generate data for front-end visualizations.
    **INSTRUCTIONS:**
    1.  **Nodes & Edges:** Create a 'nodes' list for all tables. Infer relationships between tables (e.g., based on 'customer_id' columns) to create an 'edges' list.
    2.  **Rule Coverage:** Calculate a 'coverage' score (0.0 to 1.0) for each table based on how many of its columns are governed by rules. This populates 'ruleCoverage'.
    3.  **Anomaly Hotspots:** Count issue severities for each table and calculate a weighted 'score' (high*5 + medium*2 + low*1). This populates 'hotspots'.
    - The output for this task should populate the 'schema_visualizations' object.

    ---
    **FINAL OUTPUT:**
    Respond with a single, structured JSON output that conforms to the provided schema, containing the results of all three tasks.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      issues_detected: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            table_name: { type: Type.STRING },
            column_name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING },
            possible_cause: { type: Type.STRING },
            impact: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['table_name', 'type', 'description', 'severity', 'possible_cause', 'impact', 'recommendation'],
        },
      },
      rule_analysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            rule_statement: { type: Type.STRING },
            status: { type: Type.STRING },
            observation: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['rule_statement', 'status', 'observation', 'recommendation'],
        },
      },
      rule_conflicts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            conflicting_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ['conflicting_rules', 'explanation', 'recommendation'],
        },
      },
      schema_visualizations: {
        type: Type.OBJECT,
        properties: {
          nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING } } } },
          edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { from: { type: Type.STRING }, to: { type: Type.STRING }, label: { type: Type.STRING } } } },
          ruleCoverage: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tableName: { type: Type.STRING }, coverage: { type: Type.NUMBER } } } },
          hotspots: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tableName: { type: Type.STRING }, highSeverityCount: { type: Type.INTEGER }, mediumSeverityCount: { type: Type.INTEGER }, lowSeverityCount: { type: Type.INTEGER }, score: { type: Type.NUMBER } } } },
        },
        required: ['nodes', 'edges', 'ruleCoverage', 'hotspots'],
      },
    },
    required: ['issues_detected', 'rule_analysis', 'rule_conflicts', 'schema_visualizations'],
  };

  try {
    const response = await generateContentWithRetry(
      'gemini-2.5-flash',
      prompt,
      {
        temperature: 0.1,
        seed: 42,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    );
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FullAnalysisResponse;
  } catch (e) {
    console.error("Failed to perform full analysis:", e);
    throw new Error("The AI model failed to return a valid analysis. Please check the inputs and try again.");
  }
};


export const generateSqlForIssues = async (tableName: string, issues: Issue[]): Promise<string> => {
  const actionableIssues = issues.filter(issue => 
    issue.type !== 'Schema Drift' && !issue.description.toLowerCase().includes('data type mismatch')
  );

  if (actionableIssues.length === 0) {
    return `-- No actionable issues found that can be directly queried.
-- Issues like schema drift or data type mismatches need to be addressed in the ETL process or table definition.`;
  }

  const issuesJson = JSON.stringify(actionableIssues.map(i => ({ 
    type: i.type, 
    description: i.description, 
    column_name: i.column_name 
  })), null, 2);

  const prompt = `
    You are an expert SQL developer. For the table named \`${tableName}\`, a data quality analysis found the following issues:

    ${issuesJson}

    Please write standard SQL queries to help a data engineer identify the exact rows that have these problems.
    - For each issue, provide a commented header explaining what the query is for (e.g., -- Checks for: [Issue Description]).
    - Then, provide a single, runnable SQL query to find the rows matching that issue. Use SELECT * FROM \`${tableName}\` WHERE ...
    - Use standard SQL dialect that is generally compatible with systems like BigQuery, Snowflake, and PostgreSQL.
    - If an issue is too abstract to write a precise query for, provide a best-effort query with a comment explaining any assumptions.
    - Combine all queries into a single, well-formatted SQL script.
  `;

  try {
    const response = await generateContentWithRetry(
      'gemini-2.5-flash',
      prompt,
      {
        temperature: 0,
        seed: 42,
      }
    );
    return response.text;
  } catch (e) {
    console.error(`Failed to generate SQL for table "${tableName}" after retries:`, e);
    return `-- An error occurred while generating SQL queries. Please try again.`;
  }
};

export const generateReportSummary = async (
  issues: Issue[], 
  ruleEffectiveness: RuleEffectiveness[] | null, 
  ruleConflicts: RuleConflict[] | null
): Promise<string> => {
  
  let prompt = `
    You are a senior data analyst. Based on the following JSON data quality reports, generate a comprehensive, well-structured executive summary in markdown format. 
    Your report must synthesize insights from all the data sources provided below.

    Structure your response with clear headings (e.g., "### Key Findings"). Use bullet points for clarity.
    Your analysis must be based ONLY on the data provided.

    The report should contain the following sections in this order:
    1.  **Executive Summary**: A high-level overview of the most critical findings from all analyses.
    2.  **Key Data Quality Findings**: A summary of the most important issues detected in the data, prioritizing by severity.
    3.  **Business Rule Performance**: An analysis of how the business rules performed. Mention which rules were effective (Triggered), which were not (Not Triggered), and any that had high violation volumes.
    4.  **Rule Conflicts and Resolutions**: If there are any rule conflicts, describe them and summarize the recommendations for resolving them. If there are no conflicts, state that clearly.
    5.  **Overall Recommendations**: A final, actionable call to action for the data team.

    **Source 1: Data Quality Issues Detected**
    \`\`\`json
    ${JSON.stringify(issues, null, 2)}
    \`\`\`
  `;

  if (ruleEffectiveness && ruleEffectiveness.length > 0) {
    prompt += `
    \n**Source 2: Rule Effectiveness Analysis**
    \`\`\`json
    ${JSON.stringify(ruleEffectiveness, null, 2)}
    \`\`\`
    `;
  }

  if (ruleConflicts && ruleConflicts.length > 0) {
    prompt += `
    \n**Source 3: Rule Conflict Analysis**
    \`\`\`json
    ${JSON.stringify(ruleConflicts, null, 2)}
    \`\`\`
    `;
  }

  try {
      const response = await generateContentWithRetry(
        'gemini-2.5-flash',
        prompt,
        {
          temperature: 0.2,
        }
      );
      return response.text;
  } catch (e) {
      console.error("Failed to generate summary report after retries:", e);
      return "### Report Generation Failed\n\nAn error occurred while generating the summary report, likely due to API rate limits or server load. The detailed issue list below is complete, but the AI-powered summary could not be created at this time. Please try the analysis again later.";
  }
};