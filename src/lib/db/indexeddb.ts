// simple indexedDB helper
const DB_NAME = 'manualAiTester';
const DB_VERSION = 1;

export const STORE_TESTCASE = 'testCaseData';
export const STORE_REPORT = 'reportData';
export const STORE_DEFECTS = 'defects';
export const STORE_CHECKLISTS = 'checklists';
export const STORE_SIGNOFF = 'signOff';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      [
        STORE_TESTCASE,
        STORE_REPORT,
        STORE_DEFECTS,
        STORE_CHECKLISTS,
        STORE_SIGNOFF,
      ].forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function putInStore<T>(
  storeName: string,
  value: T,
): Promise<void> {
  await withStore<IDBValidKey>(storeName, 'readwrite', (store) =>
    store.put(value),
  );
}

export async function getFromStore<T>(
  storeName: string,
  key: string,
): Promise<T | undefined> {
  return withStore<T | undefined>(storeName, 'readonly', (store) =>
    store.get(key),
  );
}

export async function deleteFromStore(
  storeName: string,
  key: string,
): Promise<void> {
  await withStore<undefined>(storeName, 'readwrite', (store) =>
    store.delete(key),
  );
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  return withStore<T[]>(storeName, 'readonly', (store) => store.getAll());
}
