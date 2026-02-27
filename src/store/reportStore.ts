import { create } from 'zustand';
import { ReportData, TestCase } from '@/types';
import { z } from 'zod';
import {
  combineReportData,
  parseMainReportFile,
} from '@/lib/services/reportDataCombiner';
import { saveReportData } from '@/lib/db/reportStore';
import { loadTestCaseData, saveTestCaseData } from '@/lib/db/testCaseStore';

interface ReportState {
  reportData: ReportData | null;
  testCases: TestCase[];
  screenshotsByTestCase: Record<string, string[]>;
  isLoading: boolean;
  loadWarnings: string[];
  loadError: string | null;
  loadedResources: string[];
  loadReport: (files: File[]) => Promise<void>;
  clearReport: () => void;
  updateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  addScreenshot: (testCaseId: string, imageDataUrl: string) => Promise<void>;
  deleteScreenshot: (
    testCaseId: string,
    screenshotIndex: number,
  ) => Promise<void>;
}

function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load report due to an unknown error.';
}

async function resolveMainReportFile(files: File[]): Promise<File> {
  const jsonFiles = files.filter((file) =>
    file.name.toLowerCase().endsWith('.json'),
  );
  if (!jsonFiles.length) {
    throw new Error('Please upload at least one JSON report file.');
  }

  for (const file of jsonFiles) {
    try {
      const candidate = await parseMainReportFile(file);
      if (
        candidate &&
        typeof candidate === 'object' &&
        'metaData' in candidate &&
        candidate.metaData
      ) {
        return file;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    'Could not find a valid main report JSON (missing metaData).',
  );
}

export const useReportStore = create<ReportState>((set, get) => ({
  reportData: null,
  testCases: [],
  screenshotsByTestCase: {},
  isLoading: false,
  loadWarnings: [],
  loadError: null,
  loadedResources: [],
  loadReport: async (files: File[]) => {
    set({
      isLoading: true,
      loadWarnings: [],
      loadError: null,
      loadedResources: [],
    });

    try {
      const mainFile = await resolveMainReportFile(files);
      const mainPayload = await parseMainReportFile(mainFile);
      const fileMap = new Map(files.map((file) => [file.name, file]));

      const combined = await combineReportData(mainPayload, fileMap);
      const persistedExecution = await loadTestCaseData(combined.reportData.id);

      const hydratedTestCases = combined.testCases.map((testCase) => ({
        ...testCase,
        status: persistedExecution?.statuses[testCase.id] ?? testCase.status,
        actualResult: persistedExecution?.actualResults[testCase.id] ?? '',
      }));

      await saveReportData(combined.reportData);
      await saveTestCaseData({
        id: combined.reportData.id,
        statuses: hydratedTestCases.reduce<Record<string, TestCase['status']>>(
          (acc, testCase) => {
            acc[testCase.id] = testCase.status;
            return acc;
          },
          {},
        ),
        screenshots: persistedExecution?.screenshots ?? {},
        actualResults: hydratedTestCases.reduce<Record<string, string>>(
          (acc, testCase) => {
            acc[testCase.id] = testCase.actualResult ?? '';
            return acc;
          },
          {},
        ),
      });

      set({
        reportData: combined.reportData,
        testCases: hydratedTestCases,
        screenshotsByTestCase: persistedExecution?.screenshots ?? {},
        loadWarnings: combined.warnings,
        loadedResources: combined.loadedResources,
        isLoading: false,
        loadError: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        loadError: getFriendlyErrorMessage(error),
      });
    }
  },
  clearReport: () =>
    set({
      reportData: null,
      testCases: [],
      screenshotsByTestCase: {},
      loadWarnings: [],
      loadError: null,
      loadedResources: [],
    }),
  updateTestCase: async (id: string, data: Partial<TestCase>) => {
    set((state) => ({
      testCases: state.testCases.map((tc: TestCase) =>
        tc.id === id ? { ...tc, ...data } : tc,
      ),
    }));

    const { reportData, testCases, screenshotsByTestCase } = get();
    if (!reportData) {
      return;
    }

    await saveTestCaseData({
      id: reportData.id,
      statuses: testCases.reduce<Record<string, TestCase['status']>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.status;
          return acc;
        },
        {},
      ),
      screenshots: screenshotsByTestCase,
      actualResults: testCases.reduce<Record<string, string>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.actualResult ?? '';
          return acc;
        },
        {},
      ),
    });
  },
  addScreenshot: async (testCaseId: string, imageDataUrl: string) => {
    set((state) => ({
      screenshotsByTestCase: {
        ...state.screenshotsByTestCase,
        [testCaseId]: [
          ...(state.screenshotsByTestCase[testCaseId] ?? []),
          imageDataUrl,
        ],
      },
    }));

    const { reportData, testCases, screenshotsByTestCase } = get();
    if (!reportData) {
      return;
    }

    await saveTestCaseData({
      id: reportData.id,
      statuses: testCases.reduce<Record<string, TestCase['status']>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.status;
          return acc;
        },
        {},
      ),
      screenshots: screenshotsByTestCase,
      actualResults: testCases.reduce<Record<string, string>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.actualResult ?? '';
          return acc;
        },
        {},
      ),
    });
  },
  deleteScreenshot: async (testCaseId: string, screenshotIndex: number) => {
    set((state) => ({
      screenshotsByTestCase: {
        ...state.screenshotsByTestCase,
        [testCaseId]: (state.screenshotsByTestCase[testCaseId] ?? []).filter(
          (_image, index) => index !== screenshotIndex,
        ),
      },
    }));

    const { reportData, testCases, screenshotsByTestCase } = get();
    if (!reportData) {
      return;
    }

    await saveTestCaseData({
      id: reportData.id,
      statuses: testCases.reduce<Record<string, TestCase['status']>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.status;
          return acc;
        },
        {},
      ),
      screenshots: screenshotsByTestCase,
      actualResults: testCases.reduce<Record<string, string>>(
        (acc, testCase) => {
          acc[testCase.id] = testCase.actualResult ?? '';
          return acc;
        },
        {},
      ),
    });
  },
}));
