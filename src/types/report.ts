export interface ReportData {
  id: string;
  moduleName: string;
  version: string;
  environment: string;
  lastUpdated: string;
  module?: string;
  preparedBy?: string;
  reviewedBy?: string;
  testEnvironment?: string;
  testCasesFile?: string;
  testScenariosFile?: string;
  moduleFolderPath?: string;
  executionChecklist?: string[];
  knownIssues?: Array<{
    title: string;
    description: string;
    workaround?: string;
  }>;
  tableOfContents?: Array<{
    id: string;
    title: string;
    icon?: string;
    description?: string;
  }>;
  testScenarios?: Array<{
    testCaseId: string;
    testCaseName: string;
    description?: string;
    category?: string;
  }>;
  databaseQueries?: Array<{
    queryId: string;
    description: string;
    sqlScript: string;
  }>;
  testObjective?: {
    mainGoal: string;
    scope?: string[];
    note?: string;
  };
  testPrerequisite?: {
    accessRequirement?: {
      environmentAccess?: string;
      userRole?: string;
      vpnAccess?: string;
      databaseAccess?: string;
    };
    businessRules?: string[];
    testDataRequirement?: Record<string, string>;
    testEnvSetup?: Record<string, string>;
  };
  sampleTestData?: Array<{
    testFieldName: string;
    testValue1?: string;
    testValue2?: string;
    description?: string;
  }>;
}

export type Report = ReportData;
