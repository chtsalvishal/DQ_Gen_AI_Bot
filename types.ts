export interface TableInput {
  id: string;
  name: string;
  stats: string;
  schema: string;
  samples: string;
  rules: string;
}

export interface DataQualityInputs {
  tables: TableInput[];
  rules: string;
  history: string;
}

export interface Issue {
  table_name: string;
  column_name?: string;
  type: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  possible_cause: string;
  impact: string;
  recommendation: string;
}

export interface GeminiApiResponse {
  issues_detected: Issue[];
}

export interface RuleEffectiveness {
  rule_statement: string;
  status: 'Triggered' | 'Not Triggered' | 'High Volume';
  observation: string;
  recommendation: string;
}

export interface RuleConflict {
  conflicting_rules: string[];
  explanation: string;
  recommendation: string;
}

export interface MetaAnalysisResponse {
  rule_analysis: RuleEffectiveness[];
  rule_conflicts: RuleConflict[];
}

// --- New types for Schema Visualization ---
export interface SchemaNode {
  id: string; // full table name
  label: string; // short table name
}

export interface SchemaEdge {
  from: string; // full source table name
  to: string; // full target table name
  label: string; // the column name that connects them
}

export interface RuleCoverage {
  tableName: string;
  coverage: number; // A score from 0 to 1
}

export interface AnomalyHotspot {
  tableName: string;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  score: number; // A weighted score for heatmap intensity
}

export interface SchemaVisualizationData {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  ruleCoverage: RuleCoverage[];
  hotspots: AnomalyHotspot[];
}

// --- New type for the consolidated API response ---
export interface FullAnalysisResponse {
  issues_detected: Issue[];
  rule_analysis: RuleEffectiveness[];
  rule_conflicts: RuleConflict[];
  schema_visualizations: SchemaVisualizationData;
}