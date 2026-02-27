import { create } from 'zustand';
import { Status } from '@/types';

// helper type for the `set` function used by zustand
import type { StateCreator } from 'zustand';

// If you prefer a simple alias:
// type SetState = (partial: Partial<ExecutionState> | ((state: ExecutionState) => Partial<ExecutionState>)) => void;

interface ExecutionState {
  testCaseStatuses: Record<string, Status>;
  screenshots: Record<string, string[]>;
  actualResults: Record<string, string>;
  updateStatus: (testCaseId: string, status: Status) => Promise<void>;
  addScreenshot: (testCaseId: string, image: string) => Promise<void>;
  deleteScreenshot: (testCaseId: string, index: number) => Promise<void>;
  updateActualResult: (testCaseId: string, result: string) => Promise<void>;
  syncToIndexedDB: () => Promise<void>;
  loadFromIndexedDB: () => Promise<void>;
}

export const useExecutionStore = create<ExecutionState>((set, get, store) => ({
  testCaseStatuses: {},
  screenshots: {},
  actualResults: {},
  updateStatus: async (testCaseId: string, status: Status) => {
    // TODO: persist status changes
    set((state) => ({
      testCaseStatuses: { ...state.testCaseStatuses, [testCaseId]: status },
    }));
  },
  addScreenshot: async (testCaseId: string, image: string) => {
    set((state) => {
      const arr = state.screenshots[testCaseId] || [];
      return {
        screenshots: { ...state.screenshots, [testCaseId]: [...arr, image] },
      };
    });
  },
  deleteScreenshot: async (testCaseId: string, index: number) => {
    set((state) => {
      const arr = state.screenshots[testCaseId] || [];
      arr.splice(index, 1);
      return { screenshots: { ...state.screenshots, [testCaseId]: arr } };
    });
  },
  updateActualResult: async (testCaseId: string, result: string) => {
    set((state) => ({
      actualResults: { ...state.actualResults, [testCaseId]: result },
    }));
  },
  syncToIndexedDB: async () => {
    // TODO: implement sync
  },
  loadFromIndexedDB: async () => {
    // TODO: implement loading
  },
}));
