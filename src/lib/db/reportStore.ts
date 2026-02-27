import { STORE_REPORT } from './indexeddb';
import { putInStore, getFromStore, deleteFromStore } from './indexeddb';
import { ReportData } from '@/types';

export async function saveReportData(report: ReportData): Promise<void> {
  await putInStore<ReportData>(STORE_REPORT, report);
}

export async function loadReportData(id: string): Promise<ReportData | undefined> {
  return getFromStore<ReportData>(STORE_REPORT, id);
}

export async function deleteReportData(id: string): Promise<void> {
  await deleteFromStore(STORE_REPORT, id);
}

export async function loadAllReports(): Promise<ReportData[]> {
  // util function in case we need to list multiple reports
  const { getAllFromStore } = await import('./indexeddb');
  return getAllFromStore<ReportData>(STORE_REPORT);
}
