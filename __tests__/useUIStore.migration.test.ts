import { describe, it, expect } from 'vitest';
import { useUIStore } from '../src/store/useUIStore';

describe('useUIStore Migration', () => {
  it('should migrate from version 0 to 1', () => {
    const options = useUIStore.persist.getOptions();
    expect(options.migrate).toBeDefined();
    
    const oldState = {
      isSidebarOpen: true
    };
    
    const migratedState = options.migrate!(oldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.isSidebarOpen).toBe(true);
    expect(migratedState?.theme).toBe('dark');
    expect(migratedState?.storyFontSize).toBe(100);
  });

  it('should preserve existing valid data during migration', () => {
    const options = useUIStore.persist.getOptions();
    
    const validOldState = {
      theme: 'light',
      storyFontSize: 120
    };
    
    const migratedState = options.migrate!(validOldState as unknown, 0) as Record<string, unknown>;
    
    expect(migratedState?.theme).toBe('light');
    expect(migratedState?.storyFontSize).toBe(120);
  });

  it('should handle undefined or null state gracefully', () => {
    const options = useUIStore.persist.getOptions();
    
    const migratedState1 = options.migrate!(undefined, 0);
    expect(migratedState1).toBeUndefined();

    const migratedState2 = options.migrate!(null, 0);
    expect(migratedState2).toBeNull();
  });
});
