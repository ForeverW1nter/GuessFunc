import { useState, useEffect, useCallback } from 'react';
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [eventBus] = useState(() => new SimpleEventBus());
  const { t } = useTranslation();

  const handleResetLevel = useCallback(() => {
    setIsSuccess(false);
    eventBus.emit('engine:loadLevel', {
      targetExpression: "a * sin(x)",
      initialExpression: "sin(x)",
      params: { a: 2 }
    });
  }, [eventBus]);

  useEffect(() => {
    const bootstrapEngine = async () => {
      try {
        setLoading(true);
        await new Promise(res => setTimeout(res, FAKE_LOADING_DELAY_MS));
        
        const availableEngines = GameEngineRegistry.getAvailableEngines();
        if (availableEngines.length > 0) {
          const targetEngineId = availableEngines[0];
          const dynamicEngine = GameEngineRegistry.createEngine(targetEngineId);
          
          eventBus.on('engine:ready', () => {
            setEngine(dynamicEngine);
            setLoading(false);
            handleResetLevel();
          });

          eventBus.on('engine:success', () => {
            setIsSuccess(true);
          });

          await dynamicEngine.init(eventBus);
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
  }, [eventBus, handleResetLevel]);

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
        <div className="flex-1 w-full flex flex-col">
          {!loading && engine ? engine.getControlPanel() : null}
          
          {/* Creator Terminal specific Success Overlay */}
          {isSuccess && (
            <div className="mt-8 p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-green-500 font-bold tracking-widest mb-4 uppercase">
                {t('hub.creator.syncComplete', 'TEST SYNC COMPLETE')}
              </h3>
              <button 
                onClick={handleResetLevel}
                className="w-full text-xs font-mono tracking-widest uppercase bg-green-500 text-black px-4 py-3 rounded-xl hover:bg-green-400 transition-colors duration-300"
              >
                {t('hub.creator.resetEngine', 'RESET ENGINE')}
              </button>
            </div>
          )}
        </div>
      }
    />
  );
};
