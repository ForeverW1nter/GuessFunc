import { create } from 'zustand';
import { IndexedDBHelper } from '../../utils/indexedDB';
import { GAME_CONSTANTS } from '../../utils/constants';
import type { ModPackage } from './types';

const dbHelper = new IndexedDBHelper(GAME_CONSTANTS.MOD_STORE.DB_NAME, GAME_CONSTANTS.MOD_STORE.STORE_NAME);

export interface ModStoreState {
  installedMods: Record<string, ModPackage>;
  modOrder: string[];
  isInitialized: boolean;
  
  // Actions
  init: () => Promise<void>;
  installMod: (modId: string, modData: ModPackage) => Promise<void>;
  updateMod: (modId: string, modData: ModPackage) => Promise<void>;
  uninstallMod: (modId: string) => Promise<void>;
  isInstalled: (modId: string) => boolean;
  reorderMods: (startIndex: number, endIndex: number) => void;
}

export const useModStore = create<ModStoreState>((set, get) => ({
  installedMods: {},
  modOrder: [],
  isInitialized: false,

  init: async () => {
    try {
      await dbHelper.init();
      const allMods = await dbHelper.getAll<ModPackage>();
      const modsMap: Record<string, ModPackage> = {};
      allMods.forEach(mod => {
        modsMap[mod.manifest.id] = mod;
      });
      // Migrate old STORY_EDITOR_DATA from localStorage if it exists and hasn't been migrated
      const cachedData = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.STORY_EDITOR_DATA);
      if (cachedData && !modsMap['local_workspace']) {
        try {
          const editorData = JSON.parse(cachedData);
          if (editorData && Array.isArray(editorData.routes) && editorData.routes.length > 0) {
            const localMod: ModPackage = {
              manifest: {
                id: 'local_workspace',
                title: 'My Local Workspace',
                author: 'Me',
                description: 'Migrated from local storage',
                version: '1.0.0'
              },
              storyData: { routes: editorData.routes }
            };
            await dbHelper.set('local_workspace', localMod);
            modsMap['local_workspace'] = localMod;
            localStorage.removeItem(GAME_CONSTANTS.STORAGE_KEYS.STORY_EDITOR_DATA); // Clean up after migration
          }
        } catch (e) {
          console.error('Failed to migrate STORY_EDITOR_DATA', e);
        }
      }

      // Load modOrder from localStorage
      let savedOrder: string[] = [];
      try {
        const orderStr = localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.MOD_ORDER);
        if (orderStr) {
          savedOrder = JSON.parse(orderStr);
        }
      } catch (e) {
        console.error('Failed to parse modOrder', e);
      }

      // Ensure local_workspace is always at the top if it's not in the list, or just ensure all keys are in order
      const allKeys = Object.keys(modsMap);
      const newOrder = savedOrder.filter(id => allKeys.includes(id));
      allKeys.forEach(id => {
        if (!newOrder.includes(id)) {
          if (id === 'local_workspace') {
            newOrder.unshift(id);
          } else {
            newOrder.push(id);
          }
        }
      });
      localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.MOD_ORDER, JSON.stringify(newOrder));

      set({ installedMods: modsMap, modOrder: newOrder, isInitialized: true });
    } catch (e) {
      console.error('Failed to initialize Mod Store from IndexedDB', e);
    }
  },

  installMod: async (modId: string, modData: ModPackage) => {
    // Ensure manifest.id is set
    modData.manifest.id = modId;
    
    // Update the route description to match the mod manifest if it exists
    modData.storyData.routes.forEach(r => {
      r.description = modData.manifest.description || r.description;
      r.modId = modId;
    });
    
    await dbHelper.set(modId, modData);
    
    const state = get();
    const newOrder = [...state.modOrder];
    if (!newOrder.includes(modId)) {
      newOrder.push(modId);
      localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.MOD_ORDER, JSON.stringify(newOrder));
    }
    
    set({
      installedMods: { ...state.installedMods, [modId]: modData },
      modOrder: newOrder
    });
  },

  updateMod: async (modId: string, modData: ModPackage) => {
    await dbHelper.set(modId, modData);
    set((state) => ({
      installedMods: { ...state.installedMods, [modId]: modData }
    }));
  },

  uninstallMod: async (modId: string) => {
    const modData = await dbHelper.get<ModPackage>(modId);
    if (!modData) return;
    
    await dbHelper.remove(modId);
    
    const newMods = { ...get().installedMods };
    delete newMods[modId];
    
    const newOrder = get().modOrder.filter(id => id !== modId);
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.MOD_ORDER, JSON.stringify(newOrder));
    
    set({ installedMods: newMods, modOrder: newOrder });
  },

  isInstalled: (modId: string) => {
    return !!get().installedMods[modId];
  },

  reorderMods: (startIndex: number, endIndex: number) => {
    const currentOrder = [...get().modOrder];
    const [removed] = currentOrder.splice(startIndex, 1);
    currentOrder.splice(endIndex, 0, removed);
    
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.MOD_ORDER, JSON.stringify(currentOrder));
    set({ modOrder: currentOrder });
  }
}));
