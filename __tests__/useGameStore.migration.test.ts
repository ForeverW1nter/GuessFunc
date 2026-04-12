import { describe, it, expect } from 'vitest';
import { useGameStore } from '../src/store/useGameStore';

describe('useGameStore Migration', () => {
  it('should migrate from version 0 to 1', () => {
    const options = useGameStore.persist.getOptions();
    expect(options.migrate).toBeDefined();
    
    const oldState = {
      foo: 'bar'
    };
    
    const migratedState = options.migrate!(oldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.foo).toBe('bar');
    expect(migratedState?.completedLevels).toEqual([]);
    expect(migratedState?.seenChapters).toEqual([]);
    expect(migratedState?.readFiles).toEqual([]);
  });

  it('should preserve existing valid data during migration', () => {
    const options = useGameStore.persist.getOptions();
    
    const validOldState = {
      completedLevels: ['route1/chapter1/level1'],
      seenChapters: ['route1/chapter1'],
      readFiles: ['file1']
    };
    
    const migratedState = options.migrate!(validOldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.completedLevels).toEqual(['route1/chapter1/level1']);
    expect(migratedState?.seenChapters).toEqual(['route1/chapter1']);
    expect(migratedState?.readFiles).toEqual(['file1']);
  });

  it('should handle undefined or null state gracefully', () => {
    const options = useGameStore.persist.getOptions();
    
    const migratedState1 = options.migrate!(undefined, 0);
    expect(migratedState1).toBeUndefined();

    const migratedState2 = options.migrate!(null, 0);
    expect(migratedState2).toBeNull();
  });
});
