import { STORE_CHECKLISTS } from './indexeddb';
import { putInStore, getFromStore, deleteFromStore } from './indexeddb';

export interface ChecklistRecord {
  id: string; // report id or checklist name
  items: string[];
  completed: boolean[]; // parallel to items
}

export async function saveChecklist(record: ChecklistRecord): Promise<void> {
  await putInStore<ChecklistRecord>(STORE_CHECKLISTS, record);
}

export async function loadChecklist(id: string): Promise<ChecklistRecord | undefined> {
  return getFromStore<ChecklistRecord>(STORE_CHECKLISTS, id);
}

export async function deleteChecklist(id: string): Promise<void> {
  await deleteFromStore(STORE_CHECKLISTS, id);
}

export async function loadAllChecklists(): Promise<ChecklistRecord[]> {
  const { getAllFromStore } = await import('./indexeddb');
  return getAllFromStore<ChecklistRecord>(STORE_CHECKLISTS);
}
