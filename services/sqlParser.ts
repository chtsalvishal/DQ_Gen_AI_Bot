import { TableInput } from '../types';

export type ParsedTableInfo = Omit<TableInput, 'id' | 'stats' | 'samples'>;

/**
 * A simple SQL parser to extract table name and schema from CREATE TABLE statements,
 * or table name, columns, and rules from basic SELECT statements.
 * This is not a full-fledged parser and works for basic statements.
 * @param sql The raw SQL string, which can contain multiple statements separated by ';'.
 * @returns An array of parsed table information objects.
 */
export const parseSql = (sql: string): ParsedTableInfo[] => {
  const statements = sql.split(';').filter(s => s.trim() !== '');

  return statements.map(statement => {
    // Keep original formatting for schema field if needed
    const originalStatement = statement.trim();
    // Normalize whitespace for easier regex matching
    const cleanStatement = originalStatement.replace(/\s\s+/g, ' ').trim();

    // 1. Check for CREATE TABLE statement
    // Handles CREATE TABLE, CREATE OR REPLACE TABLE, CREATE TABLE IF NOT EXISTS
    // and various quoted table names.
    const createTableMatch = cleanStatement.match(
      /\bCREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\])(?:\.(?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\]))?)/i
    );
    
    if (createTableMatch) {
      const tableName = createTableMatch[1];
      return {
        name: tableName,
        schema: originalStatement, // The full CREATE TABLE statement is the schema
        rules: '', // No business rules are parsed from a CREATE statement
      };
    }

    // 2. Check for SELECT statement (as a fallback)
    const fromMatch = cleanStatement.match(/\bFROM\s+((?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\])(?:\.(?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\]))*)/i);
    const selectMatch = cleanStatement.match(/\bSELECT\s+(.*?)\s+\bFROM\b/i);

    if (fromMatch && selectMatch) {
      const tableName = fromMatch[1];
      let columnsText = 'Could not parse columns.';
      
      if (selectMatch[1]) {
        if (selectMatch[1].trim() === '*') {
           columnsText = 'All columns (*)';
        } else {
          const columns = selectMatch[1]
            .split(',')
            .map(c => {
              const parts = c.trim().split(/\s+/);
              // Handles "col as alias" -> "alias", "schema.col" -> "col"
              let colName = parts[parts.length - 1];
              if (colName.includes('.')) {
                  colName = colName.substring(colName.lastIndexOf('.') + 1);
              }
              return colName.replace(/[`"\[\]]/g, ''); // Clean quotes from column name
            })
            .join(', ');
          columnsText = `Columns: ${columns}`;
        }
      }
      
      const whereMatch = cleanStatement.match(/\bWHERE\s+(.*?)(?:\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i);
      const rules = whereMatch && whereMatch[1] ? whereMatch[1].trim() : '';

      return {
        name: tableName,
        schema: columnsText, // For SELECT, "schema" is the list of columns
        rules: rules,
      };
    }

    // 3. Fallback for other unrecognized DML/DDL statements
    // Try to find a table name-like pattern as a best effort.
    const genericTableMatch = cleanStatement.match(/\b(?:INTO|UPDATE|FROM|TABLE)\s+((?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\])(?:\.(?:\w+|"[^"]+"|`[^`]+`|\[[^\]]+\]))*)/i);
    return {
      name: genericTableMatch ? genericTableMatch[1] : 'unknown_table',
      schema: originalStatement, // Put the whole statement in schema if we can't parse it
      rules: '',
    };
  });
};
