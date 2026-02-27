import type { ReportData, TestCase } from '@/types';
import {
  reportInputSchema,
  testCaseInputSchema,
  type ReportInput,
  type TestCaseInput,
} from '@/lib/schemas/reportSchema';

type ResourceName =
  | 'main'
  | 'testCases'
  | 'testScenarios'
  | 'tableOfContents'
  | 'databaseQueries';

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
    return reportInputSchema.shape.testScenarios.unwrap().parse(value);
  }

  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { testScenarios?: unknown[] }).testScenarios)
  ) {
    return reportInputSchema.shape.testScenarios
      .unwrap()
      .parse((value as { testScenarios: unknown[] }).testScenarios);
  }

  throw new Error(
    'Referenced test scenarios file must be an array or an object with testScenarios array.',
  );
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
      warnings.push(
        `Missing referenced test cases file: ${parsedMain.testCasesFile}`,
      );
      onResourceUpdate?.('testCases', 'missing');
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
      warnings.push(
        `Missing referenced test scenarios file: ${parsedMain.testScenariosFile}`,
      );
      onResourceUpdate?.('testScenarios', 'missing');
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
    databaseQueries: parsedMain.databaseQueries,
  };

  return { reportData, testCases, warnings, loadedResources };
}

export async function parseMainReportFile(file: File): Promise<unknown> {
  return parseJsonFile(file);
}
