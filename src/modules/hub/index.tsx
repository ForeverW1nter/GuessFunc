import { ModuleRegistry, type GameModule } from '@/core/ModuleRegistry';
import { HubPage } from './HubPage';

export const initHubModule = async () => {
  const mod: GameModule = {
    id: 'hub',
    name: 'Hub',
    description: 'Core Hub Interface',
    version: '2.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/',
    routes: [
      { index: true, element: <HubPage /> }
    ]
  };

  await ModuleRegistry.register(mod);
};
