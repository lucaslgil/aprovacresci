import { create } from 'zustand';

export type Permission = string;

interface PermissionsStore {
  permissions: Permission[];
  setPermissions: (permissions: Permission[]) => void;
  clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsStore>((set) => ({
  permissions: [],
  setPermissions: (permissions) => set({ permissions }),
  clearPermissions: () => set({ permissions: [] }),
}));
