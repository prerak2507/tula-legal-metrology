// Offline queue manager for Mobile Field Verification (SIH Section 16)

export interface QueuedInspectionPayload {
  queueId: string;
  applicationId: string;
  instrumentId: string;
  timestamp: string;
  checklist: any[];
  testReadings: any[];
  evidencePhotos: any[];
  inspectorRemarks: string;
  result: 'PASS' | 'FAIL' | 'ADJUSTMENT_REQUIRED' | 'RETEST_REQUIRED';
  adjustmentDetails?: string;
  stampType?: any;
  status: 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';
}

const OFFLINE_QUEUE_KEY = 'lm_offline_inspection_queue_v1';

const memoryStore = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStore.set(key, value);
  },
};

class SyncQueueService {
  private listeners: Set<() => void> = new Set();

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public getQueue(): QueuedInspectionPayload[] {
    const raw = safeStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  public enqueue(payload: Omit<QueuedInspectionPayload, 'queueId' | 'status'>): QueuedInspectionPayload {
    const queue = this.getQueue();
    const item: QueuedInspectionPayload = {
      ...payload,
      queueId: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'PENDING_SYNC',
    };
    queue.push(item);
    safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
    return item;
  }

  public getPendingCount(): number {
    return this.getQueue().filter(i => i.status === 'PENDING_SYNC').length;
  }

  public markSynced(queueId: string): void {
    const queue = this.getQueue();
    const item = queue.find(i => i.queueId === queueId);
    if (item) {
      item.status = 'SYNCED';
      safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notify();
    }
  }

  public clearSynced(): void {
    const queue = this.getQueue().filter(i => i.status === 'PENDING_SYNC');
    safeStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    this.notify();
  }
}

export const syncQueue = new SyncQueueService();
