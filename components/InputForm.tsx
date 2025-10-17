import React from 'react';
import { DataQualityInputs, TableInput } from '../types';
import { SparklesIcon, PlusIcon, UploadIcon, GavelIcon, HistoryIcon, ShieldCheckIcon } from './icons';
import TableInputForm from './TableInputForm';
import { parseSql } from '../services/sqlParser';
import { sampleEcommerceData } from '../resources/sample-ecommerce-data';

interface InputFormProps {
  onAnalyze: (inputs: DataQualityInputs) => void;
  isLoading: boolean;
}

// A new reusable component for the global context cards
const GlobalContextCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accentColorClass: string;
}> = ({ icon, title, subtitle, children, accentColorClass }) => (
    <div className={`relative border ${accentColorClass} rounded-lg shadow-sm p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50`}>
        <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-opacity-10 text-opacity-80 ${accentColorClass.replace('border-', 'bg-').replace('dark:border-', 'dark:bg-')}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-md font-semibold text-slate-800 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
        </div>
        <div>
            {children}
        </div>
    </div>
);


const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [inputs, setInputs] = React.useState<DataQualityInputs>({
    tables: [
      {
        id: crypto.randomUUID(),
        name: 'customer_orders',
        stats: `Column, Null %, Distinct Count, Min, Max
order_id, 0%, 10000, 1, 10000
customer_age, 5%, 60, 18, 78
order_amount, 28%, 4500, 10.50, 950.00`,
        schema: `-- Previous Schema
CREATE TABLE customer_orders (
  order_id INT,
  customer_age INT,
  order_amount DECIMAL(10, 2)
);

-- Current Schema
CREATE TABLE customer_orders (
  order_id INT,
  customer_age STRING, 
  order_amount DECIMAL(10, 2),
  shipping_address STRING
);`,
        samples: `order_id,customer_age,order_amount,shipping_address
1001,"25",150.75,"123 Maple St"
1002,"42",89.99,"456 Oak Ave"
1003,"thirty-one",, "789 Pine Ln"
1004,"28",215.50,"321 Elm Ct"`,
        rules: 'order_amount must be > 0. customer_age must be a valid integer between 18 and 120.',
      },
    ],
    rules: '',
    history: '',
  });

  const loadSampleData = () => {
    const tablesWithIds = sampleEcommerceData.tables.map(table => ({
      ...table,
      id: crypto.randomUUID(),
    }));
    setInputs({
      ...sampleEcommerceData,
      tables: tablesWithIds,
    });
  };

  const handleTableChange = (id: string, updatedTable: Partial<TableInput>) => {
    setInputs((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => (table.id === id ? { ...table, ...updatedTable } : table)),
    }));
  };
  
  const handleGlobalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSqlFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const sqlContent = e.target?.result as string;
        if (sqlContent) {
            const parsedInfos = parseSql(sqlContent);
            const newTables: TableInput[] = parsedInfos.map(info => ({
              id: crypto.randomUUID(),
              name: info.name,
              schema: info.schema,
              rules: info.rules,
              stats: '',
              samples: '',
            }));
            setInputs(prev => ({...prev, tables: newTables}));
        }
    };
    reader.onerror = () => {
        console.error("Error reading SQL file.");
        alert("An error occurred while reading the SQL file.");
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const normalizeTableName = (name: string) => {
    return name.replace(/[`"\[\]]/g, '').toLowerCase();
  };

  const handleParseAndDistributeStats = (fileContent: string) => {
    if (!fileContent.trim()) return;

    const lines = fileContent.trim().split('\n');
    if (lines.length < 2) {
      alert("Statistics CSV must have a header row and at least one data row.");
      return;
    }

    const headerLine = lines[0];
    const delimiter = ','; // Assume CSV
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const findIndex = (possibleNames: string[]) => {
      for(const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index > -1) return index;
      }
      return -1;
    };

    const colIndices = {
      schema: findIndex(['schema']),
      table: findIndex(['table']),
      column: findIndex(['column']),
      dataType: findIndex(['data type', 'datatype']),
      nullPercent: findIndex(['null %', 'null%']),
      distinctCount: findIndex(['distinct count', 'distinctcount']),
      min: findIndex(['min']),
      max: findIndex(['max']),
    };

    if (colIndices.table === -1 || colIndices.column === -1) {
      alert("Statistics CSV must contain 'Table' and 'Column' headers.");
      return;
    }

    const statsByTable: { [normalizedTableName: string]: string[] } = {};
    const dataRows = lines.slice(1);

    dataRows.forEach(line => {
      if (!line.trim()) return;
      const cells = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      
      const schema = colIndices.schema !== -1 ? cells[colIndices.schema] : null;
      const tableName = cells[colIndices.table];

      if (!tableName) return;
      
      const fullTableName = schema && schema.toLowerCase() !== 'n/a' ? `${schema}.${tableName}` : tableName;
      const normalizedTableName = normalizeTableName(fullTableName);
      
      const getCell = (index: number) => index !== -1 ? (cells[index] || 'N/A') : 'N/A';
      
      const statLine = [
        getCell(colIndices.column),
        getCell(colIndices.dataType),
        getCell(colIndices.nullPercent),
        getCell(colIndices.distinctCount),
        getCell(colIndices.min),
        getCell(colIndices.max),
      ].join(', ');

      if (!statsByTable[normalizedTableName]) {
        statsByTable[normalizedTableName] = [];
      }
      statsByTable[normalizedTableName].push(statLine);
    });

    setInputs(prev => {
      const newTables = prev.tables.map(table => {
        const normalizedCurrentTableName = normalizeTableName(table.name);
        const newStats = statsByTable[normalizedCurrentTableName];

        if (newStats) {
          const statHeader = 'Column, Data Type, Null %, Distinct Count, Min, Max';
          return {
            ...table,
            stats: `${statHeader}\n${newStats.join('\n')}`,
          };
        }
        return table;
      });
      return {...prev, tables: newTables};
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
            handleParseAndDistributeStats(text);
        }
    };
    reader.onerror = () => {
        console.error("Error reading file.");
        alert("An error occurred while reading the file.");
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const addTable = () => {
    setInputs((prev) => ({
      ...prev,
      tables: [
        ...prev.tables,
        { id: crypto.randomUUID(), name: `new_table_${prev.tables.length + 1}`, stats: '', schema: '', samples: '', rules: '' },
      ],
    }));
  };

  const removeTable = (id: string) => {
    setInputs((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== id),
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(inputs);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Provide Data Context</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add tables manually, import files, or load our comprehensive sample dataset.</p>
      </div>
      
      <div className="border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
          <ShieldCheckIcon className="mx-auto h-8 w-8 text-brand-accent" />
          <h3 className="mt-2 text-md font-medium text-slate-800 dark:text-white">Explore More Features</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Load our sample e-commerce dataset to see the bot handle multiple tables, schema drift, and more complex issues.
          </p>
          <button
              type="button"
              id="tour-step-1"
              onClick={loadSampleData}
              className="mt-4 w-full sm:w-auto cursor-pointer inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition"
          >
              <SparklesIcon className="w-5 h-5 mr-2 -ml-1" />
              Load E-commerce Dataset
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center">
            <div>
                <h3 className="text-md font-medium text-slate-800 dark:text-white">Import from SQL</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload a .sql file to auto-populate tables.
                </p>
            </div>
            <div className="mt-auto pt-3">
                <label 
                    htmlFor="sql-upload" 
                    id="tour-step-sql-upload" 
                    className="w-full cursor-pointer inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition"
                >
                    <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
                    Upload SQL File
                </label>
                <input
                    id="sql-upload"
                    type="file"
                    accept=".sql,text/plain"
                    className="hidden"
                    onChange={handleSqlFileChange}
                />
            </div>
        </div>

        <div className="flex flex-col border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-center">
            <div>
                <h3 className="text-md font-medium text-slate-800 dark:text-white">Import Statistics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload a CSV with column stats.
                </p>
            </div>
            <div className="mt-auto pt-3">
                <label 
                    htmlFor="stats-upload" 
                    id="tour-step-csv-upload" 
                    className="w-full cursor-pointer inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition"
                >
                    <UploadIcon className="w-5 h-5 mr-2 -ml-1" />
                    Upload Statistics CSV
                </label>
                <input
                    id="stats-upload"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    </div>

      <div className="space-y-4">
        {inputs.tables.map((table, index) => (
          <TableInputForm 
            id={index === 0 ? 'tour-step-2' : undefined}
            key={table.id}
            table={table}
            index={index}
            onChange={handleTableChange}
            onRemove={removeTable}
          />
        ))}
      </div>

      <button
        type="button"
        id="tour-step-3"
        onClick={addTable}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-dashed border-slate-400 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent transition"
      >
        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
        Add Another Table
      </button>
      
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h3 className="text-lg font-medium text-slate-800 dark:text-white text-center">Global Context</h3>
        <GlobalContextCard
            icon={<GavelIcon className="w-5 h-5" />}
            title="Global Business Rules"
            subtitle="These rules apply to ALL tables in the analysis."
            accentColorClass="border-indigo-300 dark:border-indigo-700 text-indigo-500"
        >
            <textarea
                id="tour-step-4"
                name="rules"
                rows={3}
                className="block w-full text-sm shadow-sm border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white focus:ring-brand-accent focus:border-brand-accent transition"
                placeholder="e.g., All ID columns must be universally unique"
                value={inputs.rules}
                onChange={handleGlobalChange}
            />
        </GlobalContextCard>
        <GlobalContextCard
            icon={<HistoryIcon className="w-5 h-5" />}
            title="Historical Anomalies"
            subtitle="Provide context on past issues (optional)."
            accentColorClass="border-sky-300 dark:border-sky-700 text-sky-500"
        >
            <textarea
                id="history"
                name="history"
                rows={3}
                className="block w-full text-sm shadow-sm border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white focus:ring-brand-accent focus:border-brand-accent transition"
                placeholder="e.g., 'Last week, user_id had a 10% null spike'"
                value={inputs.history}
                onChange={handleGlobalChange}
            />
        </GlobalContextCard>
      </div>

      <button
        type="submit"
        id="tour-step-5"
        disabled={isLoading || inputs.tables.length === 0}
        className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-slate-400 disabled:cursor-not-allowed dark:bg-brand-secondary dark:hover:bg-sky-600 dark:focus:ring-offset-slate-900 transition-all duration-300"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2 -ml-1" />
            Analyze Data Quality
          </>
        )}
      </button>
    </form>
  );
};

export default InputForm;
