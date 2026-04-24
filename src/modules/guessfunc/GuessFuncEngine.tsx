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
    
    // Simulate async resource loading or web worker setup if needed
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
