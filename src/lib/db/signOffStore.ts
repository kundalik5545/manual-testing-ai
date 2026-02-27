import { STORE_SIGNOFF } from './indexeddb';
import { putInStore, getFromStore, deleteFromStore } from './indexeddb';
import { SignOff } from '@/types';

export async function saveSignOff(id: string, data: SignOff): Promise<void> {
  await putInStore<{ id: string; data: SignOff }>(STORE_SIGNOFF, { id, data });
}

export async function loadSignOff(id: string): Promise<SignOff | undefined> {
  const rec = await getFromStore<{ id: string; data: SignOff }>(STORE_SIGNOFF, id);
  return rec?.data;
}

export async function deleteSignOff(id: string): Promise<void> {
  await deleteFromStore(STORE_SIGNOFF, id);
}

export async function loadAllSignOffs(): Promise<{ id: string; data: SignOff }[]> {
  const { getAllFromStore } = await import('./indexeddb');
  return getAllFromStore<{ id: string; data: SignOff }>(STORE_SIGNOFF);
}
