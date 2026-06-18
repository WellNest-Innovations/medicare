"use client";
import { OfflineVital } from "@/types";

const DB_NAME = "medplatform_offline";
const STORE   = "pending_vitals";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveOfflineVital(vital: Omit<OfflineVital, "id" | "synced">): Promise<string> {
  const db  = await openDB();
  const id  = crypto.randomUUID();
  const row: OfflineVital = { ...vital, id, synced: false };
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(row);
    req.onsuccess = () => resolve(id);
    req.onerror   = () => reject(req.error);
  });
}

export async function getPendingVitals(): Promise<OfflineVital[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as OfflineVital[]).filter((v) => !v.synced));
    req.onerror   = () => reject(req.error);
  });
}

export async function markVitalSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const get   = store.get(id);
    get.onsuccess = () => {
      const record = get.result as OfflineVital;
      if (record) {
        store.put({ ...record, synced: true });
      }
      resolve();
    };
    get.onerror = () => reject(get.error);
  });
}

export async function syncPendingVitals(
  submitFn: (vital: OfflineVital) => Promise<void>
): Promise<number> {
  const pending = await getPendingVitals();
  let synced = 0;
  for (const vital of pending) {
    try {
      await submitFn(vital);
      await markVitalSynced(vital.id);
      synced++;
    } catch {
      // Leave in queue; retry next sync
    }
  }
  return synced;
}
