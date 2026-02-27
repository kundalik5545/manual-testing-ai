import { z } from 'zod';

const stringOrStringArray = z.union([z.string(), z.array(z.string())]);

export const metaDataSchema = z.object({
  module: z.string().optional(),
  moduleName: z.string().min(1),
  version: z.string().min(1),
  testEnvironment: z.string().optional(),
  lastUpdated: z.string().min(1),
  preparedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
});

export const testCaseInputSchema = z.object({
  testCaseId: z.string().min(1),
  testCaseName: z.string().min(1),
  module: z.string().default('General'),
  location: z.string().default('N/A'),
  priority: stringOrStringArray.default('Medium'),
  source: stringOrStringArray.default('Manual'),
  testSteps: stringOrStringArray.optional(),
  expectedResult: z.string().optional(),
  preconditions: z.string().optional(),
  testData: z.string().optional(),
  category: z.string().optional(),
});

export const testScenarioInputSchema = z.object({
  testCaseId: z.string(),
  testCaseName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const reportInputSchema = z.object({
  metaData: metaDataSchema,
  testObjective: z
    .object({
      mainGoal: z.string(),
      scope: z.array(z.string()).optional(),
      note: z.string().optional(),
    })
    .optional(),
  testCases: z.preprocess(
    (value) => (typeof value === 'string' ? undefined : value),
    z.array(testCaseInputSchema).optional(),
  ),
  testScenarios: z.preprocess(
    (value) => (typeof value === 'string' ? undefined : value),
    z.array(testScenarioInputSchema).optional(),
  ),
  databaseQueries: z
    .array(
      z.object({
        queryId: z.string(),
        description: z.string(),
        sqlScript: z.string().optional(),
      }),
    )
    .optional(),
  executionChecklist: z.array(z.string()).optional(),
  knownIssues: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        workaround: z.string().optional(),
      }),
    )
    .optional(),
  tableOfContents: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        icon: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  testCasesFile: z.string().optional(),
  testScenariosFile: z.string().optional(),
  moduleFolderPath: z.string().optional(),
  testPrerequisite: z
    .object({
      accessRequirement: z
        .object({
          environmentAccess: z.string().optional(),
          userRole: z.string().optional(),
          vpnAccess: z.string().optional(),
          databaseAccess: z.string().optional(),
        })
        .optional(),
      businessRules: z.array(z.string()).optional(),
      testDataRequirement: z.record(z.string()).optional(),
      testEnvSetup: z.record(z.string()).optional(),
    })
    .optional(),
  sampleTestData: z
    .array(
      z.object({
        testFieldName: z.string(),
        testValue1: z.string().optional(),
        testValue2: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
export type TestCaseInput = z.infer<typeof testCaseInputSchema>;

export function validateReportInput(data: unknown): ReportInput {
  return reportInputSchema.parse(data);
}
