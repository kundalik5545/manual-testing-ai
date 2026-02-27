import type { ReportData, TestCase } from '@/types';
import {
  reportInputSchema,
  testCaseInputSchema,
  testScenarioInputSchema,
  type ReportInput,
  type TestCaseInput,
} from '@/lib/schemas/reportSchema';

type ResourceName =
  | 'main'
  | 'testCases'
  | 'testScenarios'
  | 'tableOfContents'
  | 'databaseQueries'
  | 'sqlScripts';

type ResourceStatus = 'loading' | 'loaded' | 'missing' | 'failed';

export interface CombineResult {
  reportData: ReportData;
  testCases: TestCase[];
  warnings: string[];
  loadedResources: ResourceName[];
}

function ensureArray(
  value: string | string[] | undefined,
  fallback: string,
): string[] {
  if (!value) return [fallback];
  return Array.isArray(value) ? value : [value];
}

function normalizeTestCase(input: TestCaseInput): TestCase {
  return {
    id: input.testCaseId,
    name: input.testCaseName,
    module: input.module,
    location: input.location,
    priority: ensureArray(input.priority, 'Medium'),
    source: ensureArray(input.source, 'Manual'),
    status: 'Not Executed',
    testSteps: input.testSteps ? ensureArray(input.testSteps, '') : undefined,
    expectedResult: input.expectedResult,
    preconditions: input.preconditions,
    testData: input.testData,
    category: input.category,
  };
}

function normalizeFileName(name: string): string {
  return name.split(/[\\/]/).pop()?.toLowerCase() ?? name.toLowerCase();
}

async function parseJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text);
}

function findFileByName(
  fileMap: Map<string, File>,
  targetName?: string,
): File | undefined {
  if (!targetName) return undefined;

  const normalizedTarget = normalizeFileName(targetName);

  for (const [name, file] of fileMap.entries()) {
    if (normalizeFileName(name) === normalizedTarget) return file;
    if (normalizeFileName(file.name) === normalizedTarget) return file;
  }

  return undefined;
}

function buildPublicCandidatePaths(
  targetName: string,
  moduleFolderPath?: string,
): string[] {
  const normalized = targetName.split(/[\\/]/).pop() ?? targetName;
  const moduleFolder = moduleFolderPath?.replace(/^\/+|\/+$/g, '');

  const candidates = [`/html-reports/${normalized}`, `/${normalized}`];

  if (moduleFolder) {
    candidates.unshift(`/${moduleFolder}/${normalized}`);
    candidates.unshift(`/html-reports/${moduleFolder}/${normalized}`);
  }

  return Array.from(new Set(candidates));
}

async function fetchTextFromPublicPaths(
  targetName: string,
  moduleFolderPath?: string,
): Promise<string | null> {
  const candidates = buildPublicCandidatePaths(targetName, moduleFolderPath);

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractTestCaseArray(value: unknown): TestCaseInput[] {
  if (Array.isArray(value)) {
    return value.map((entry) => testCaseInputSchema.parse(entry));
  }

  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { testCases?: unknown[] }).testCases)
  ) {
    return (value as { testCases: unknown[] }).testCases.map((entry) =>
      testCaseInputSchema.parse(entry),
    );
  }

  throw new Error(
    'Referenced test cases file must be an array or an object with testCases array.',
  );
}

function extractScenarioArray(value: unknown): ReportInput['testScenarios'] {
  if (Array.isArray(value)) {
    return value.map((entry) => testScenarioInputSchema.parse(entry));
  }

  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { testScenarios?: unknown[] }).testScenarios)
  ) {
    return (value as { testScenarios: unknown[] }).testScenarios.map((entry) =>
      testScenarioInputSchema.parse(entry),
    );
  }

  throw new Error(
    'Referenced test scenarios file must be an array or an object with testScenarios array.',
  );
}

function parseSqlScriptsFromJsContent(content: string): Record<string, string> {
  const scripts: Record<string, string> = {};
  const pattern = /([A-Za-z0-9_]+)\s*:\s*`([\s\S]*?)`\s*,?/g;

  for (const match of content.matchAll(pattern)) {
    const queryId = match[1];
    const sqlScript = match[2].trim();
    if (queryId && sqlScript) {
      scripts[queryId] = sqlScript;
    }
  }

  return scripts;
}

async function extractSqlScriptsFromFile(
  fileMap: Map<string, File>,
  moduleFolderPath?: string,
): Promise<Record<string, string> | null> {
  const sqlScriptsFile = findFileByName(fileMap, 'sql-scripts.js');
  if (sqlScriptsFile) {
    const jsText = await sqlScriptsFile.text();
    return parseSqlScriptsFromJsContent(jsText);
  }

  const fetchedJsText = await fetchTextFromPublicPaths(
    'sql-scripts.js',
    moduleFolderPath,
  );
  if (!fetchedJsText) {
    return null;
  }

  return parseSqlScriptsFromJsContent(fetchedJsText);
}

export async function combineReportData(
  mainData: unknown,
  fileMap: Map<string, File>,
  onResourceUpdate?: (resource: ResourceName, status: ResourceStatus) => void,
): Promise<CombineResult> {
  onResourceUpdate?.('main', 'loading');
  const parsedMain = reportInputSchema.parse(mainData);
  onResourceUpdate?.('main', 'loaded');

  const warnings: string[] = [];
  const loadedResources: ResourceName[] = ['main'];

  let testCases: TestCase[] = [];
  if (parsedMain.testCases?.length) {
    testCases = parsedMain.testCases.map(normalizeTestCase);
    loadedResources.push('testCases');
    onResourceUpdate?.('testCases', 'loaded');
  } else if (parsedMain.testCasesFile) {
    onResourceUpdate?.('testCases', 'loading');
    const linkedTestCasesFile = findFileByName(
      fileMap,
      parsedMain.testCasesFile,
    );
    if (linkedTestCasesFile) {
      const externalTestCases = extractTestCaseArray(
        await parseJsonFile(linkedTestCasesFile),
      );
      testCases = externalTestCases.map(normalizeTestCase);
      loadedResources.push('testCases');
      onResourceUpdate?.('testCases', 'loaded');
    } else {
      const fetchedTestCasesText = await fetchTextFromPublicPaths(
        parsedMain.testCasesFile,
        parsedMain.moduleFolderPath,
      );

      if (fetchedTestCasesText) {
        const externalTestCases = extractTestCaseArray(
          JSON.parse(fetchedTestCasesText),
        );
        testCases = externalTestCases.map(normalizeTestCase);
        loadedResources.push('testCases');
        onResourceUpdate?.('testCases', 'loaded');
      } else {
        warnings.push(
          `Missing referenced test cases file: ${parsedMain.testCasesFile}`,
        );
        onResourceUpdate?.('testCases', 'missing');
      }
    }
  }

  let testScenarios = parsedMain.testScenarios;
  if (!testScenarios?.length && parsedMain.testScenariosFile) {
    onResourceUpdate?.('testScenarios', 'loading');
    const linkedScenariosFile = findFileByName(
      fileMap,
      parsedMain.testScenariosFile,
    );
    if (linkedScenariosFile) {
      testScenarios = extractScenarioArray(
        await parseJsonFile(linkedScenariosFile),
      );
      loadedResources.push('testScenarios');
      onResourceUpdate?.('testScenarios', 'loaded');
    } else {
      const fetchedScenariosText = await fetchTextFromPublicPaths(
        parsedMain.testScenariosFile,
        parsedMain.moduleFolderPath,
      );

      if (fetchedScenariosText) {
        testScenarios = extractScenarioArray(JSON.parse(fetchedScenariosText));
        loadedResources.push('testScenarios');
        onResourceUpdate?.('testScenarios', 'loaded');
      } else {
        warnings.push(
          `Missing referenced test scenarios file: ${parsedMain.testScenariosFile}`,
        );
        onResourceUpdate?.('testScenarios', 'missing');
      }
    }
  }

  let sqlScriptsByQueryId: Record<string, string> | null = null;
  if (parsedMain.databaseQueries?.length) {
    onResourceUpdate?.('sqlScripts', 'loading');
    sqlScriptsByQueryId = await extractSqlScriptsFromFile(
      fileMap,
      parsedMain.moduleFolderPath,
    );

    if (sqlScriptsByQueryId) {
      loadedResources.push('sqlScripts');
      onResourceUpdate?.('sqlScripts', 'loaded');
    } else {
      warnings.push('Missing optional SQL scripts file: sql-scripts.js');
      onResourceUpdate?.('sqlScripts', 'missing');
    }
  }

  if (parsedMain.databaseQueries?.length) {
    loadedResources.push('databaseQueries');
    onResourceUpdate?.('databaseQueries', 'loaded');
  }

  if (parsedMain.tableOfContents?.length) {
    loadedResources.push('tableOfContents');
    onResourceUpdate?.('tableOfContents', 'loaded');
  }

  const reportData: ReportData = {
    id: `${parsedMain.metaData.moduleName}-${parsedMain.metaData.version}`
      .toLowerCase()
      .replace(/\s+/g, '-'),
    moduleName: parsedMain.metaData.moduleName,
    module: parsedMain.metaData.module,
    version: parsedMain.metaData.version,
    environment: parsedMain.metaData.testEnvironment ?? 'N/A',
    testEnvironment: parsedMain.metaData.testEnvironment,
    lastUpdated: parsedMain.metaData.lastUpdated,
    preparedBy: parsedMain.metaData.preparedBy,
    reviewedBy: parsedMain.metaData.reviewedBy,
    testCasesFile: parsedMain.testCasesFile,
    testScenariosFile: parsedMain.testScenariosFile,
    moduleFolderPath: parsedMain.moduleFolderPath,
    executionChecklist: parsedMain.executionChecklist,
    knownIssues: parsedMain.knownIssues,
    tableOfContents: parsedMain.tableOfContents,
    testScenarios,
    databaseQueries: parsedMain.databaseQueries?.map((query) => ({
      ...query,
      sqlScript:
        sqlScriptsByQueryId?.[query.queryId] ??
        query.sqlScript ??
        '-- SQL script not available',
    })),
  };

  return { reportData, testCases, warnings, loadedResources };
}

export async function parseMainReportFile(file: File): Promise<unknown> {
  return parseJsonFile(file);
}
