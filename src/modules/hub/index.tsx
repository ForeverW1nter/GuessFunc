import { ModuleRegistry, type GameModule } from '@/core/ModuleRegistry';
import { HubPage } from './HubPage';
import { CreatorTerminalPage } from './CreatorTerminalPage';
import { Home } from 'lucide-react';

export const initHubModule = async () => {
  const mod: GameModule = {
    id: 'hub',
    name: 'Hub',
    description: 'Core Hub Interface',
    version: '2.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/',
    isRoot: true,
    icon: Home,
    color: 'var(--accent-hub)',
    titleKey: 'nav.hub',
    routes: [
      { index: true, element: <HubPage /> },
      { path: 'creator', element: <CreatorTerminalPage /> }
    ]
  };

  await ModuleRegistry.register(mod);
};
