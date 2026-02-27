import { STORE_DEFECTS } from './indexeddb';
import { putInStore, getFromStore, deleteFromStore } from './indexeddb';
import { Defect } from '@/types';

export async function saveDefect(defect: Defect): Promise<void> {
  // using bugId as key
  await putInStore<Defect>(STORE_DEFECTS, defect);
}

export async function loadDefect(bugId: string): Promise<Defect | undefined> {
  return getFromStore<Defect>(STORE_DEFECTS, bugId);
}

export async function deleteDefect(bugId: string): Promise<void> {
  await deleteFromStore(STORE_DEFECTS, bugId);
}

export async function loadAllDefects(): Promise<Defect[]> {
  const { getAllFromStore } = await import('./indexeddb');
  return getAllFromStore<Defect>(STORE_DEFECTS);
}
