import { create } from 'zustand';
import type { Transaction } from '../types';

interface UiState {
  isModalOpen: boolean;
  editingTransaction: Transaction | null;
  openNewModal: () => void;
  openEditModal: (tx: Transaction) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isModalOpen: false,
  editingTransaction: null,
  openNewModal: () => set({ isModalOpen: true, editingTransaction: null }),
  openEditModal: (tx) => set({ isModalOpen: true, editingTransaction: tx }),
  closeModal: () => set({ isModalOpen: false, editingTransaction: null }),
}));
