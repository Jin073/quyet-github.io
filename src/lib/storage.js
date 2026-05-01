import { STORAGE_KEY } from './constants.js';
import { createDemoState } from './sampleData.js';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoState();
    const data = JSON.parse(raw);
    return {
      ...createDemoState(),
      ...data,
      settings: { theme: 'light', accent: 'indigo', currency: '$', ...(data.settings || {}) },
    };
  } catch {
    return createDemoState();
  }
}

export function saveState(state) {
  const payload = {
    transactions: state.transactions,
    categories: state.categories,
    assets: state.assets,
    investments: state.investments,
    snapshots: state.snapshots,
    settings: state.settings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
