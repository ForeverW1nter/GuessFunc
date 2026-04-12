import { useModStore } from '../features/mods/store';
import { useStoryStore } from './useStoryStore';

/**
 * Initializes the reactive sync between the ModStore (IndexedDB) 
 * and the StoryStore (Runtime Level Data).
 * This completely decouples the two stores following FSD principles.
 */
export const initStoreSync = () => {
  useModStore.subscribe((state, prevState) => {
    // Only sync if the installedMods object reference has changed or modOrder has changed
    if (state.installedMods !== prevState.installedMods || state.isInitialized !== prevState.isInitialized || state.modOrder !== prevState.modOrder) {
      if (state.isInitialized) {
        const allMods = state.installedMods;
        const modOrder = state.modOrder;
        
        const modRoutes = modOrder
          .map(modId => allMods[modId])
          .filter(Boolean)
          .flatMap((m) => 
            m.storyData.routes.map((r) => ({ ...r, modId: m.manifest.id }))
          );
          
        useStoryStore.getState().setModRoutes(modRoutes);
      }
    }
  });
};
