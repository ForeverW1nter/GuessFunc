import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { GameEngineRegistry } from '@/core/GameEngineRegistry';
import type { IGameProtocol, IEngineEventBus } from '@/core/IGameProtocol';
import { TerminalLayout } from '@/foundation/ui/layouts/TerminalLayout';

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
    // Dynamically load the first available engine from the registry.
    // This decouples the Hub from knowing about any specific engine like 'guessfunc'.
    const bootstrapEngine = async () => {
      try {
        setLoading(true);
        // Wait briefly for module chunks to settle if needed
        await new Promise(res => setTimeout(res, FAKE_LOADING_DELAY_MS));
        
        const availableEngines = GameEngineRegistry.getAvailableEngines();
        if (availableEngines.length > 0) {
          const targetEngineId = availableEngines[0];
          const dynamicEngine = GameEngineRegistry.createEngine(targetEngineId);
          const bus = new SimpleEventBus();
          
          bus.on('engine:ready', () => {
            setEngine(dynamicEngine);
            setLoading(false);

            // In Creator Terminal, we simulate sending a level to the engine
            // In Archive/Network mode, this would come from a real level configuration.
            bus.emit('engine:loadLevel', {
              targetExpression: "sin(x) + a",
              initialExpression: "x",
              params: { a: 2 },
              passSimilarity: 99
            });
          });

          await dynamicEngine.init(bus);
        } else {
          console.warn('[Terminal] No engines found in registry');
          setLoading(false);
        }
      } catch (err) {
        console.error('[Terminal] Failed to mount engine:', err);
        setLoading(false);
      }
    };

    bootstrapEngine();

    return () => {
      // Keep track of the local variable to clean it up, avoiding dependency array issues
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (engine) {
        engine.destroy();
      }
    };
  }, [engine]);

  return (
    <TerminalLayout
      layoutId="creator"
      title={engine ? engine.name : t('hub.creator.title', 'CREATOR')}
      subtitle={t('hub.creator.subtitle', 'System.Terminal.Active')}
      accentColorVar="var(--accent-studio)"
      statusText={engine ? `${engine.id}_v${engine.version}` : t('common.standby', 'Standby')}
      onClosePath="/"
      leftPanelContent={
        loading ? (
          <div className="flex-1 flex items-center justify-center font-mono tracking-widest text-[var(--color-muted-foreground)] border border-[var(--color-border)] rounded-3xl uppercase">
            {t('hub.creator.initializing', 'INITIALIZING WORKSPACE...')}
          </div>
        ) : getEngineContent(engine, t)
      }
      rightPanelContent={
        <div className="flex-1 w-full">
          {!loading && engine ? engine.getControlPanel() : null}
        </div>
      }
    />
  );
};
