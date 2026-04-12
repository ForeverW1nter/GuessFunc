import { describe, it, expect } from 'vitest';
import { useAudioStore } from '../src/store/useAudioStore';

describe('useAudioStore Migration', () => {
  it('should migrate from version 0 to 1', () => {
    const options = useAudioStore.persist.getOptions();
    expect(options.migrate).toBeDefined();
    
    const oldState = {
      currentBgmId: 'epic'
    };
    
    const migratedState = options.migrate!(oldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.currentBgmId).toBe('epic');
    expect(migratedState?.isMuted).toBe(false);
    expect(migratedState?.volume).toBe(0.5);
  });

  it('should preserve existing valid data during migration', () => {
    const options = useAudioStore.persist.getOptions();
    
    const validOldState = {
      isMuted: true,
      volume: 0.8
    };
    
    const migratedState = options.migrate!(validOldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.isMuted).toBe(true);
    expect(migratedState?.volume).toBe(0.8);
  });

  it('should handle undefined or null state gracefully', () => {
    const options = useAudioStore.persist.getOptions();
    
    const migratedState1 = options.migrate!(undefined, 0);
    expect(migratedState1).toBeUndefined();

    const migratedState2 = options.migrate!(null, 0);
    expect(migratedState2).toBeNull();
  });
});
