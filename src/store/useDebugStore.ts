import { create } from 'zustand';

export interface DebugLog {
  id: number;
  timestamp: number;
  type: 'error' | 'warn' | 'info' | 'render' | 'state';
  source: string;
  message: string;
}

interface DebugStore {
  isEnabled: boolean;
  isOverlayOpen: boolean;
  logs: DebugLog[];
  renderCounts: Record<string, number>;
  nextId: number;

  enable: () => void;
  disable: () => void;
  toggleOverlay: () => void;
  addLog: (log: Omit<DebugLog, 'id' | 'timestamp'>) => void;
  trackRender: (componentName: string) => void;
  clearLogs: () => void;
}

const MAX_LOGS = 200;

export const useDebugStore = create<DebugStore>()((set, get) => ({
  isEnabled: false,
  isOverlayOpen: false,
  logs: [],
  renderCounts: {},
  nextId: 1,

  enable: () => set({ isEnabled: true }),
  disable: () => set({ isEnabled: false, isOverlayOpen: false }),

  toggleOverlay: () => set((s) => ({ isOverlayOpen: !s.isOverlayOpen })),

  addLog: (log) => {
    if (!get().isEnabled) return;
    const id = get().nextId;
    set((s) => ({
      nextId: id + 1,
      logs: [...s.logs.slice(-MAX_LOGS), { ...log, id, timestamp: Date.now() }],
    }));
  },

  trackRender: (componentName) => {
    if (!get().isEnabled) return;
    set((s) => ({
      renderCounts: {
        ...s.renderCounts,
        [componentName]: (s.renderCounts[componentName] ?? 0) + 1,
      },
    }));
  },

  clearLogs: () => set({ logs: [], renderCounts: {}, nextId: 1 }),
}));
