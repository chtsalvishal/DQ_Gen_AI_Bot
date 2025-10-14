// FIX: Removed self-import of TableInput which caused a declaration conflict.

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

export interface RuleEffectiveness {
  rule: string;
  table_name: string;
  status: 'Effective' | 'Never Triggered' | 'Overly Broad';
  reasoning: string;
}

export interface RuleConflict {
  conflicting_rules: string[];
  table_name?: string;
  description: string;
  recommendation: string;
}

export interface GeminiApiResponse {
  issues_detected: Issue[];
  rule_effectiveness?: RuleEffectiveness[];
  rule_conflicts?: RuleConflict[];
}

export interface SchemaNode {
  id: string;
  label: string;
}

export interface SchemaEdge {
  from: string;
  to: string;
  label: string;
}

export interface Hotspot {
  tableName: string;
  score: number; // The weighted score of issues
}

export interface SchemaVisualizationData {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  hotspots: Hotspot[];
}

// A map where the key is a global rule and the value is an array of table names it applies to.
export type GlobalRuleMap = Record<string, string[]>;