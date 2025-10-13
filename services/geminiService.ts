import { GoogleGenAI, Type } from '@google/genai';
import { DataQualityInputs, GeminiApiResponse, Issue, RuleConflict, RuleEffectiveness, TableInput } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A helper function that wraps a Gemini API call with a retry mechanism,
 * featuring exponential backoff for handling 429 rate limit errors.
 * @param model The model to use for generation.
 * @param contents The prompt/contents for the model.
 * @param config The generation configuration.
 * @param retries The maximum number of retry attempts.
 * @param initialDelayMs The initial delay before the first retry.
 * @returns The API response on success.
 * @throws The last captured error if all retries fail.
 */
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
        // Not a rate limit error, re-throw immediately
        throw e;
      }
    }
  }
  throw lastError;
};

// New function to build prompt for a single table
const buildSingleTablePrompt = (table: TableInput, globalRules: string, history: string): string => {
  const tablePrompt = `
    --- TABLE: ${table.name || 'Unnamed Table'} ---

    1.  **Column-level statistics:**
        \`\`\`
        ${table.stats || 'Not provided.'}
        \`\`\`

    2.  **Schema definitions:**
        \`\`\`
        ${table.schema || 'Not provided.'}
        \`\`\`

    3.  **Sample data rows:**
        \`\`\`
        ${table.samples || 'Not provided.'}
        \`\`\`

    4.  **Business rules for this table:**
        \`\`\`
        ${table.rules || 'Not provided.'}
        \`\`\`
  `;

  return `
    You are a world-class Data Quality Bot integrated into a data engineering pipeline. 
    Your job is to analyze the following metadata and data profile report for a SINGLE TABLE to detect potential data quality issues, such as anomalies, null spikes, schema drift, or type mismatches.
    
    Analyze the following inputs to identify issues, rate their severity, suggest a cause, predict the impact, and recommend a solution.
    For each identified issue, you MUST specify the 'table_name' as exactly "${table.name}". If an issue is specific to a single column, you MUST also provide the 'column_name'.

    IMPORTANT: If an issue is a direct violation of one of the provided business rules (either from this table's "Business rules" section or the "Global business rules"), you MUST set the issue's 'type' to exactly "Business Rule Violation". For all other issues, use a descriptive type.

    In addition to detecting data quality issues, you MUST also perform two more analyses:
    1.  **Rule Effectiveness Analysis**: Based on the provided data samples and statistics, evaluate each business rule (both table-specific and global).
        - If a rule seems to be correctly identifying issues or is well-formulated based on the data, mark its status as "Effective".
        - If a rule has no violations in the sample data and the statistics do not suggest any violations, mark its status as "Never Triggered".
        - If a rule is too generic and seems to be violated by a large percentage of the sample data (e.g., > 50%), mark its status as "Overly Broad".
    2.  **Rule Conflict Analysis**: Check for logical contradictions between table-specific rules and global rules, or among the rules themselves.
        - For example, "customer_age must be > 18" conflicts with "customer_age must be < 16".

    **Inputs for table "${table.name}":**

    ${tablePrompt}

    --- GLOBAL CONTEXT ---

    5.  **Global business rules (apply to this table):**
        \`\`\`
        ${globalRules || 'Not provided.'}
        \`\`\`

    6.  **Historical anomalies or quality incidents (optional context):**
        \`\`\`
        ${history || 'Not provided.'}
        \`\`\`

    Respond with a structured JSON output that conforms to the provided schema. If no issues, effectiveness concerns, or conflicts are found, return empty arrays for the corresponding fields.
    `;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    issues_detected: {
      type: Type.ARRAY,
      description: 'A list of detected data quality issues.',
      items: {
        type: Type.OBJECT,
        properties: {
          table_name: {
            type: Type.STRING,
            description: 'The name of the table where the issue was found.',
          },
          column_name: {
            type: Type.STRING,
            description: 'The name of the column where the issue was found, if applicable.',
          },
          type: {
            type: Type.STRING,
            description: 'The type of issue, e.g., "Schema Drift", "Anomaly", "Business Rule Violation".',
          },
          description: {
            type: Type.STRING,
            description: 'A detailed description of the detected issue.',
          },
          severity: {
            type: Type.STRING,
            description: 'The severity rating: "Low", "Medium", or "High".',
          },
          possible_cause: {
            type: Type.STRING,
            description: 'A likely cause for the issue.',
          },
          impact: {
            type: Type.STRING,
            description: 'Potential impact on downstream processes.',
          },
          recommendation: {
            type: Type.STRING,
            description: 'Recommended steps for remediation.',
          },
        },
        required: ['table_name', 'type', 'description', 'severity', 'possible_cause', 'impact', 'recommendation'],
      },
    },
    rule_effectiveness: {
      type: Type.ARRAY,
      description: 'An analysis of how effective the provided business rules are.',
      items: {
        type: Type.OBJECT,
        properties: {
          rule: { type: Type.STRING, description: 'The business rule being analyzed.' },
          table_name: { type: Type.STRING, description: 'The table the rule applies to. Can be "Global".' },
          status: { type: Type.STRING, description: 'Evaluation of the rule: "Effective", "Never Triggered", or "Overly Broad".' },
          reasoning: { type: Type.STRING, description: 'The reasoning behind the status evaluation.' },
        },
        required: ['rule', 'table_name', 'status', 'reasoning'],
      },
    },
    rule_conflicts: {
      type: Type.ARRAY,
      description: 'A list of identified conflicts between business rules.',
      items: {
        type: Type.OBJECT,
        properties: {
          conflicting_rules: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The specific rules that are in conflict.',
          },
          table_name: {
            type: Type.STRING,
            description: 'The table where the conflict applies. Can be "Global" if it is a cross-table or global rule conflict.',
          },
          description: { type: Type.STRING, description: 'A description of why the rules conflict.' },
          recommendation: { type: Type.STRING, description: 'How to resolve the conflict.' },
        },
        required: ['conflicting_rules', 'description', 'recommendation'],
      },
    },
  },
  required: ['issues_detected'],
};

// New helper function to analyze a single table
const analyzeSingleTable = async (table: TableInput, globalRules: string, history: string): Promise<GeminiApiResponse> => {
  const prompt = buildSingleTablePrompt(table, globalRules, history);

  try {
    const response = await generateContentWithRetry(
      'gemini-2.5-flash',
      prompt,
      {
        temperature: 0,
        seed: 42,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    );
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as GeminiApiResponse;
    
    // Defensive check: ensure the model has correctly set the table name on all issues.
    if (result.issues_detected) {
      result.issues_detected.forEach(issue => {
        if (!issue.table_name) {
          issue.table_name = table.name;
        }
      });
    }

    return result;
  } catch (e) {
    console.error(`Error analyzing table "${table.name}" after all retries:`, e);
    // Return an empty result for this table to not fail the entire batch
    return { issues_detected: [] };
  }
};

export const analyzeDataQuality = async (inputs: DataQualityInputs): Promise<GeminiApiResponse> => {
  if (!inputs.tables || inputs.tables.length === 0) {
    return { issues_detected: [] };
  }

  const analysisPromises = inputs.tables.map(table =>
    analyzeSingleTable(table, inputs.rules, inputs.history)
  );
  
  const results = await Promise.all(analysisPromises);
  
  // Flatten the array of results (from each table) into a single list of issues.
  const allIssues: Issue[] = results.flatMap(result => result.issues_detected || []);
  const allEffectiveness: RuleEffectiveness[] = results.flatMap(result => result.rule_effectiveness || []);
  const allConflicts: RuleConflict[] = results.flatMap(result => result.rule_conflicts || []);
  
  return { 
    issues_detected: allIssues,
    rule_effectiveness: allEffectiveness,
    rule_conflicts: allConflicts
  };
};

export const generateSqlForIssues = async (tableName: string, issues: Issue[]): Promise<string> => {
  // Filter out issues that are too generic to generate SQL for, like schema drift
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

export const generateReportSummary = async (issues: Issue[], ruleEffectiveness: RuleEffectiveness[], ruleConflicts: RuleConflict[]): Promise<string> => {
  const effectivenessJson = ruleEffectiveness.length > 0 ? `
    **Rule Effectiveness Analysis JSON:**
    \`\`\`json
    ${JSON.stringify(ruleEffectiveness, null, 2)}
    \`\`\`
  ` : '';

  const conflictsJson = ruleConflicts.length > 0 ? `
    **Rule Conflict Analysis JSON:**
    \`\`\`json
    ${JSON.stringify(ruleConflicts, null, 2)}
    \`\`\`
  ` : '';
  
  const prompt = `
    You are a senior data analyst. Based on the following JSON data quality report, generate a well-structured executive summary in markdown format. 
    The summary should:
    1.  Start with a high-level overview of the findings from all sections (issues, effectiveness, conflicts).
    2.  Identify the most critical data quality issues (prioritizing 'High' severity).
    3.  Point out any recurring themes or patterns (e.g., specific tables with many issues, common issue types).
    4.  If rule effectiveness data is present, create a new section "### Business Rule Effectiveness" and summarize the findings. Highlight rules that are not effective ('Never Triggered' or 'Overly Broad') and suggest potential actions.
    5.  If rule conflict data is present, create a new section "### Business Rule Conflicts" and summarize any identified contradictions between rules, explaining the problem and the recommended resolution.
    6.  Conclude with a summary of the overall data health and a prioritized call to action.
    
    Structure your response with clear headings. Use bullet points for clarity.
    Your analysis must be based ONLY on the data provided.

    **Data Quality Issues JSON:**
    \`\`\`json
    ${JSON.stringify(issues, null, 2)}
    \`\`\`
    ${effectivenessJson}
    ${conflictsJson}
  `;

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