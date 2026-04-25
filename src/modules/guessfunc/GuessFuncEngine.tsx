import type { IGameProtocol, IEngineEventBus } from '@/core/IGameProtocol';
import type { ReactNode } from 'react';
import { GuessFuncCanvas } from './GuessFuncCanvas';
import { GuessFuncControls } from './GuessFuncControls';
import { useGuessFuncStore } from './store/guessFuncStore';

export class GuessFuncEngine implements IGameProtocol {
  public readonly id = 'guessfunc';
  public readonly name = 'GUESS FUNC';
  public readonly version = '1.0.0';
  
  private eventBus: IEngineEventBus | null = null;

  async init(eventBus: IEngineEventBus): Promise<void> {
    this.eventBus = eventBus;
    // Reset store on init to ensure clean slate
    useGuessFuncStore.getState().reset();
    
    // Listen for level payload from host
    this.eventBus.on('engine:loadLevel', (payload: unknown) => {
      console.log(`[GuessFuncEngine] Received level payload:`, payload);
      if (payload && typeof payload === 'object') {
        const p = payload as { targetExpression: string; initialExpression: string; params: Record<string, number> };
        useGuessFuncStore.getState().loadLevelData(p);
      }
    });

    // Subscribe to success event
    useGuessFuncStore.subscribe((state) => {
      if (state.isSuccess) {
        this.eventBus?.emit('engine:success', { isMatch: true });
      }
    });
    
    console.log(`[GuessFuncEngine] Initialized with EventBus`);
    this.eventBus.emit('engine:ready', { id: this.id });
  }

  getRenderer(): ReactNode {
    return <GuessFuncCanvas />;
  }

  getControlPanel(): ReactNode {
    return <GuessFuncControls />;
  }

  destroy(): void {
    console.log(`[GuessFuncEngine] Destroyed`);
    this.eventBus = null;
  }
}
