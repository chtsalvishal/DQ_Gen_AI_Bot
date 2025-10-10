
const NORMALIZATION_MAP: Record<string, string[]> = {
  'Schema Drift': ['schema', 'drift', 'data type', 'mismatch', 'added column', 'removed column', 'type change'],
  'Data Completeness': ['completeness', 'null', 'missing', 'empty', 'sparsity'],
  'Anomaly Detection': ['anomaly', 'outlier', 'unexpected', 'spike', 'unusual'],
  'Formatting & Consistency': ['format', 'consistency', 'case', 'whitespace', 'invalid char'],
  'Uniqueness & Duplication': ['duplicate', 'unique', 'uniqueness', 'primary key violation'],
  'Data Freshness': ['freshness', 'stale', 'outdated', 'latency'],
};

/**
 * Normalizes raw issue type strings from the AI into standardized categories.
 * This helps in grouping similar issues that might be phrased differently.
 * @param rawType The original issue type string from the Gemini API.
 * @returns A standardized category name.
 */
export const normalizeIssueType = (rawType: string): string => {
  if (!rawType) return 'Uncategorized';
  const lowerType = rawType.toLowerCase();

  for (const [canonicalType, keywords] of Object.entries(NORMALIZATION_MAP)) {
    for (const keyword of keywords) {
      if (lowerType.includes(keyword)) {
        return canonicalType;
      }
    }
  }
  // Fallback for uncategorized types: clean up and title-case the original.
  return rawType
    .split('/')[0] // Take the first part if it's a compound type
    .trim()
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};
