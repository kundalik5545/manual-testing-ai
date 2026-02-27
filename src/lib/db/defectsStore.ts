import { STORE_DEFECTS } from './indexeddb';
import {
  putInStore,
  getFromStore,
  deleteFromStore,
  getAllFromStore,
} from './indexeddb';
import { Defect } from '@/types';

interface DefectRecord extends Defect {
  id: string;
}

function toRecord(defect: Defect): DefectRecord {
  return {
    ...defect,
    id: defect.bugId,
  };
}

function fromRecord(record: DefectRecord): Defect {
  const { id: _id, ...defect } = record;
  return defect;
}

export async function saveDefect(defect: Defect): Promise<void> {
  await putInStore<DefectRecord>(STORE_DEFECTS, toRecord(defect));
}

export async function loadDefect(bugId: string): Promise<Defect | undefined> {
  const record = await getFromStore<DefectRecord>(STORE_DEFECTS, bugId);
  return record ? fromRecord(record) : undefined;
}

export async function deleteDefect(bugId: string): Promise<void> {
  await deleteFromStore(STORE_DEFECTS, bugId);
}

export async function loadAllDefects(): Promise<Defect[]> {
  const records = await getAllFromStore<DefectRecord>(STORE_DEFECTS);
  return records.map(fromRecord);
}
