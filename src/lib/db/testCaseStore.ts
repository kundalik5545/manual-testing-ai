import { STORE_TESTCASE } from './indexeddb';
import { putInStore, getFromStore, deleteFromStore } from './indexeddb';
import { Status } from '@/types';

export interface TestCaseDataRecord {
  id: string; // report id
  statuses: Record<string, Status>;
  screenshots: Record<string, string[]>;
  actualResults: Record<string, string>;
}

export async function saveTestCaseData(record: TestCaseDataRecord): Promise<void> {
  await putInStore<TestCaseDataRecord>(STORE_TESTCASE, record);
}

export async function loadTestCaseData(reportId: string): Promise<TestCaseDataRecord | undefined> {
  return getFromStore<TestCaseDataRecord>(STORE_TESTCASE, reportId);
}

export async function deleteTestCaseData(reportId: string): Promise<void> {
  await deleteFromStore(STORE_TESTCASE, reportId);
}
