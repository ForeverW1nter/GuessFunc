import React, { useEffect } from 'react';
import { Slot } from '../core/SlotManager';
import { useUI } from '../foundation/ui/UIManager';
import { Storage } from '../foundation/storage/StorageManager';

/**
 * Hub Module (Main Launcher)
 * The main dashboard that renders game modules via slots.
 */
export const Hub = () => {
  const { theme, setTheme, toast } = useUI();

  useEffect(() => {
    if (Storage.isFallback()) {
      toast({
        title: 'Incognito Mode Detected',
        description: 'Local storage disabled. Your progress will be lost after closing the tab.',
        type: 'error',
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Game Platform Hub</h1>
        <div className="flex gap-4">
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value as any)}
            className="bg-[var(--color-muted)] border-[var(--color-border)] rounded-md px-3 py-1"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </header>

      <main>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-[var(--color-muted-foreground)]">Available Games</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* The slot where all game modules inject their entry cards */}
            <Slot name="GAME_LIST" />
          </div>
        </section>
      </main>
    </div>
  );
};
