import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GameEngineRegistry } from '@/core/GameEngineRegistry';
import type { IGameProtocol, IEngineEventBus } from '@/core/IGameProtocol';

class SimpleEventBus implements IEngineEventBus {
  private listeners: Record<string, Array<(payload?: unknown) => void>> = {};

  emit(event: string, payload?: unknown): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(payload));
  }

  on(event: string, callback: (payload?: unknown) => void): () => void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
}

const FAKE_LOADING_DELAY_MS = 300;

// Use 'TFunction' from i18next
const getEngineContent = (engine: IGameProtocol | null, t: TFunction) => {
  if (engine) {
    return (
      <div className="flex-1 w-full h-full relative">
        {engine.getRenderer()}
      </div>
    );
  }
  return (
    <div className="flex-1 flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] rounded-3xl uppercase">
      {t('hub.creator.noEngine', 'NO ENGINE SELECTED')}
    </div>
  );
};

export const CreatorTerminalPage = () => {
  const [engine, setEngine] = useState<IGameProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // In a real scenario, the user would select which engine to use from a menu.
    // For now, we auto-load 'guessfunc' to demonstrate the universal mount.
    const bootstrapEngine = async () => {
      try {
        setLoading(true);
        // Wait briefly for module chunks to settle if needed
        await new Promise(res => setTimeout(res, FAKE_LOADING_DELAY_MS));
        
        const available = GameEngineRegistry.getAvailableEngines();
        if (available.includes('guessfunc')) {
          const guessEngine = GameEngineRegistry.createEngine('guessfunc');
          const bus = new SimpleEventBus();
          
          bus.on('engine:ready', () => {
            setEngine(guessEngine);
            setLoading(false);
          });

          await guessEngine.init(bus);
        } else {
          console.warn('[Terminal] GuessFunc engine not found in registry');
          setLoading(false);
        }
      } catch (err) {
        console.error('[Terminal] Failed to mount engine:', err);
        setLoading(false);
      }
    };

    bootstrapEngine();

    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, [engine]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-background)] flex flex-col md:flex-row"
    >
      {/* Left Panel: Universal Engine Canvas */}
      <motion.div
        layoutId="card-container-creator"
        className="flex-1 p-4 md:p-8 h-[50vh] md:h-screen relative overflow-hidden flex flex-col"
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] rounded-3xl uppercase">
            {t('hub.creator.initializing', 'INITIALIZING WORKSPACE...')}
          </div>
        ) : getEngineContent(engine, t)}
      </motion.div>

      {/* Right Panel: Universal Controls & Telemetry */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-[400px] lg:w-[480px] p-6 md:p-12 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-muted)] flex flex-col relative z-10 overflow-y-auto"
      >
        <header className="mb-12">
          <motion.h1
            layoutId="card-title-creator"
            className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 text-[var(--accent-studio)] uppercase"
          >
            {engine ? engine.name : t('hub.creator.title', 'CREATOR')}
          </motion.h1>
          <p className="text-sm font-mono text-[var(--color-muted-foreground)] tracking-widest uppercase mt-4">
            {t('hub.creator.subtitle', 'System.Terminal.Active')}
          </p>
        </header>

        <div className="flex-1 w-full">
          {!loading && engine ? engine.getControlPanel() : null}
        </div>

        {/* Terminal / Exit */}
        <footer className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--color-muted-foreground)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-studio)] animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase">
              {engine ? `${engine.id}_v${engine.version}` : t('common.standby', 'Standby')}
            </span>
          </div>
          <Link
            to="/"
            className="text-xs font-mono tracking-widest uppercase border border-[var(--color-border)] px-4 py-2 rounded-full hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors duration-300"
          >
            {t('common.close', 'Close')}
          </Link>
        </footer>
      </motion.div>
    </motion.div>
  );
};
