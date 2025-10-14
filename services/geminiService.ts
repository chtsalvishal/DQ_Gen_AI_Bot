import { GoogleGenAI, Type } from '@google/genai';
import { DataQualityInputs, GeminiApiResponse, GlobalRuleMap, Issue, RuleConflict, RuleEffectiveness, SchemaVisualizationData, TableInput } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This interface represents the complete, aggregated result after all parallel analyses are done.
export interface AggregatedAnalysisResult {
  issues: Issue[];
  ruleEffectiveness: RuleEffectiveness[];
  ruleConflicts: RuleConflict[];
  schemaVisualizationData: SchemaVisualizationData | null;
}

// This interface represents the data returned from the analysis of a SINGLE table.
interface SingleTableAnalysisResult extends GeminiApiResponse {
  inferred_relationships?: { to_table: string; on_column: string }[];
  hotspot_score?: number;
}


/**
 * A helper function that wraps a Gemini API call with a retry mechanism,
 * featuring exponential backoff for handling 429 rate limit errors.
 */
const generateContentWithRetry = async (
  model: string,
  contents: string,
  config: any,
  retries = 3,
  initialDelayMs = 2000 // Reduced initial delay for parallel calls
): Promise<any> => {
  let lastError: any = null;
  let delayMs = initialDelayMs + Math.random() * 1000; // Add jitter

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

export const mapGlobalRulesToTables = async (tables: TableInput[], globalRules: string): Promise<GlobalRuleMap> => {
  if (!globalRules || globalRules.trim() === '' || tables.length === 0) {
    return {};
  }
  const tableSchemas = tables.map(t => `
    --- TABLE: ${t.name} ---
    SCHEMA:
    ${t.schema}
  `).join('\n\n');

  const prompt = `
    You are an expert data architect. Your task is to map global business rules to the specific tables they apply to.
    Analyze the provided table schemas and the list of global business rules.
    Based on the column names and context in each schema, determine which tables each rule is relevant for.

    Return a JSON array of objects. Each object must have two keys: "rule" (the string of the global rule) and "tables" (an array of table names that the rule applies to).
    If a rule does not apply to any of the tables, do not include it in the output array.

    --- TABLE SCHEMAS ---
    ${tableSchemas}

    --- GLOBAL BUSINESS RULES ---
    ${globalRules}
  `;
  
  try {
    const response = await generateContentWithRetry(
      'gemini-2.5-flash',
      prompt,
      {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "A list of rule-to-table mappings.",
          items: {
            type: Type.OBJECT,
            properties: {
              rule: {
                type: Type.STRING,
                description: "The global business rule."
              },
              tables: {
                type: Type.ARRAY,
                description: "A list of table names this rule applies to.",
                items: {
                  type: Type.STRING,
                }
              }
            },
            required: ['rule', 'tables']
          }
        },
      }
    );
    const jsonText = response.text.trim();
    const resultArray: { rule: string; tables: string[] }[] = JSON.parse(jsonText);
    
    // Transform the array of objects back into the GlobalRuleMap format.
    const ruleMap: GlobalRuleMap = {};
    for (const item of resultArray) {
      if (item.rule && item.tables) {
        ruleMap[item.rule] = item.tables;
      }
    }
    return ruleMap;

  } catch(e) {
    console.error("Failed to map global rules to tables:", e);
    // FIX: Add detailed error object to the log for better debugging.
    if (e instanceof Error && (e as any).response) {
      console.error('API Error Response:', (e as any).response.data);
    }
    return {}; // Return empty map on failure
  }
}

const buildSingleTablePrompt = (table: TableInput, allTableNames: string[], applicableRules: string, history: string): string => {
  return `
    You are a world-class Data Quality Bot integrated into a data engineering pipeline. 
    Your job is to analyze the following metadata and data profile report for a SINGLE TABLE named "${table.name}".
    
    You must perform a comprehensive analysis and return a single, structured JSON object containing:
    1.  **Data Quality Issues**: Detect potential issues like anomalies, null spikes, schema drift, or type mismatches.
    2.  **Rule Effectiveness**: Evaluate EACH of the provided business rules below, which have been determined to apply to this table. Determine if each rule is 'Effective', 'Never Triggered', or 'Overly Broad'.
    3.  **Rule Conflicts**: Identify any logical contradictions between the provided rules.
    4.  **Relationship Inference**: Based on column names (like 'customer_id', 'order_id'), infer relationships to OTHER tables. The only valid target tables are: [${allTableNames.filter(t => t !== table.name).join(', ')}].
    5.  **Hotspot Score**: Calculate a data quality "hotspot score" by summing points for each issue: High=3, Medium=2, Low=1.

    IMPORTANT CONSTRAINTS:
    - For each identified issue, you MUST specify the 'table_name' as exactly "${table.name}".
    - If an issue violates a business rule, its 'type' MUST be exactly "Business Rule Violation".
    - Your entire response MUST be a single JSON object conforming to the provided schema. If a section has no findings, return an empty array or 0.

    --- INPUTS FOR TABLE: ${table.name} ---

    **Table Schema:**
    \`\`\`
    ${table.schema || 'Not provided.'}
    \`\`\`

    **Column Statistics:**
    \`\`\`
    ${table.stats || 'Not provided.'}
    \`\`\`

    **Applicable Business Rules for this Table:**
    \`\`\`
    ${applicableRules || 'Not provided.'}
    \`\`\`

    **Sample Data:**
    \`\`\`
    ${table.samples || 'Not provided.'}
    \`\`\`

    --- GLOBAL CONTEXT ---

    **Historical Context:**
    \`\`\`
    ${history || 'Not provided.'}
    \`\`\`
  `;
};

const singleTableResponseSchema = {
    type: Type.OBJECT,
    properties: {
        issues_detected: {
            type: Type.ARRAY,
            description: 'A list of detected data quality issues for this table.',
            items: {
                type: Type.OBJECT,
                properties: {
                    table_name: { type: Type.STRING },
                    column_name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
                    possible_cause: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                },
                required: ['table_name', 'type', 'description', 'severity', 'possible_cause', 'impact', 'recommendation'],
            },
        },
        rule_effectiveness: {
            type: Type.ARRAY,
            description: 'Analysis of business rule effectiveness for this table.',
            items: {
                type: Type.OBJECT,
                properties: {
                    rule: { type: Type.STRING },
                    table_name: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Effective', 'Never Triggered', 'Overly Broad'] },
                    reasoning: { type: Type.STRING },
                },
                required: ['rule', 'table_name', 'status', 'reasoning'],
            },
        },
        rule_conflicts: {
            type: Type.ARRAY,
            description: 'Identified conflicts between business rules relevant to this table.',
            items: {
                type: Type.OBJECT,
                properties: {
                    conflicting_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
                    table_name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                },
                required: ['conflicting_rules', 'description', 'recommendation'],
            },
        },
        inferred_relationships: {
            type: Type.ARRAY,
            description: "Relationships from this table to other tables.",
            items: {
                type: Type.OBJECT,
                properties: {
                    to_table: { type: Type.STRING, description: "The target table name." },
                    on_column: { type: Type.STRING, description: "The column name implying the relationship, e.g., 'customer_id'." }
                },
                required: ['to_table', 'on_column']
            }
        },
        hotspot_score: {
            type: Type.INTEGER,
            description: "The calculated hotspot score based on issue severity."
        }
    },
    required: ['issues_detected', 'rule_effectiveness', 'rule_conflicts', 'inferred_relationships', 'hotspot_score'],
};


const analyzeSingleTable = async (table: TableInput, allTableNames: string[], applicableRules: string, history: string): Promise<[string, SingleTableAnalysisResult]> => {
  const prompt = buildSingleTablePrompt(table, allTableNames, applicableRules, history);

  try {
    const response = await generateContentWithRetry(
      'gemini-2.5-flash',
      prompt,
      {
        temperature: 0,
        seed: 42,
        responseMimeType: 'application/json',
        responseSchema: singleTableResponseSchema,
      }
    );
    
    const jsonText = response.text.trim();
    // A simple guard to catch non-JSON responses before parsing
    if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        throw new Error("Invalid JSON response received from API.");
    }

    const result = JSON.parse(jsonText) as SingleTableAnalysisResult;
    
    // Defensive check: ensure the model has correctly set the table name on all issues.
    if (result.issues_detected) {
      result.issues_detected.forEach(issue => { issue.table_name = table.name; });
    }

    return [table.name, result];
  } catch (e) {
    console.error(`Error analyzing table "${table.name}" after all retries:`, e);
    // Return a minimal result for this table to not fail the entire batch
    const errorResult: SingleTableAnalysisResult = {
      issues_detected: [{
        table_name: table.name,
        type: 'Analysis Error',
        description: `Failed to analyze this table. Error: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'High',
        possible_cause: 'API error or malformed response.',
        impact: 'No data quality insights are available for this table.',
        recommendation: 'Check the browser console for details and try the analysis again.'
      }],
      rule_effectiveness: [],
      rule_conflicts: []
    };
    return [table.name, errorResult];
  }
};


export const analyzeDataQuality = async (inputs: DataQualityInputs, ruleMap: GlobalRuleMap): Promise<AggregatedAnalysisResult> => {
  if (!inputs.tables || inputs.tables.length === 0) {
    return { issues: [], ruleEffectiveness: [], ruleConflicts: [], schemaVisualizationData: null };
  }

  const allTableNames = inputs.tables.map(t => t.name);

  const analysisPromises = inputs.tables.map(table => {
    const relevantGlobalRules = Object.entries(ruleMap)
      .filter(([, tables]) => tables.includes(table.name))
      .map(([rule]) => rule)
      .join('\n');
    
    const allApplicableRules = [table.rules, relevantGlobalRules].filter(Boolean).join('\n');
    
    return analyzeSingleTable(table, allTableNames, allApplicableRules, inputs.history);
  });
  
  // Await all parallel analyses
  const resultsByTable = new Map(await Promise.all(analysisPromises));
  
  // Aggregate results
  const allIssues: Issue[] = [];
  const allEffectiveness: RuleEffectiveness[] = [];
  const allConflicts: RuleConflict[] = [];
  const vizData: SchemaVisualizationData = {
    nodes: [],
    edges: [],
    hotspots: [],
  };
  
  for (const table of inputs.tables) {
    const result = resultsByTable.get(table.name);
    if (!result) continue;

    allIssues.push(...(result.issues_detected || []));
    allEffectiveness.push(...(result.rule_effectiveness || []));
    allConflicts.push(...(result.rule_conflicts || []));

    // Build visualization data
    vizData.nodes.push({ id: table.name, label: table.name });
    
    if (result.inferred_relationships) {
        result.inferred_relationships.forEach(rel => {
            // Ensure the target table exists before creating an edge
            if(allTableNames.includes(rel.to_table)) {
                vizData.edges.push({ from: table.name, to: rel.to_table, label: rel.on_column });
            }
        });
    }
    if (result.hotspot_score !== undefined) {
        vizData.hotspots.push({ tableName: table.name, score: result.hotspot_score });
    }
  }
  
  return { 
    issues: allIssues,
    ruleEffectiveness: allEffectiveness,
    ruleConflicts: allConflicts,
    schemaVisualizationData: vizData.nodes.length > 0 ? vizData : null 
  };
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
      { temperature: 0, seed: 42 }
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
        { temperature: 0.2 }
      );
      return response.text;
  } catch (e) {
      console.error("Failed to generate summary report after retries:", e);
      return "### Report Generation Failed\n\nAn error occurred while generating the summary report, likely due to API rate limits or server load. The detailed issue list below is complete, but the AI-powered summary could not be created at this time. Please try the analysis again later.";
  }
};