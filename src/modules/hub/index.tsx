import { ModuleRegistry, type GameModule } from '@/core/ModuleRegistry';
import { HubPage } from './HubPage';
import { CreatorTerminalPage } from './CreatorTerminalPage';
import { Home, Database, Globe2, TerminalSquare } from 'lucide-react';

export const initHubModule = async () => {
  const rootMod: GameModule = {
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
      { index: true, element: <HubPage /> }
    ]
  };

  const archiveMod: GameModule = {
    id: 'archive',
    name: 'THE ARCHIVE',
    description: 'Story Mode / Secure Files',
    version: '1.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/archive',
    icon: Database,
    color: 'var(--accent-archive)',
    titleKey: 'hub.archive.title',
    subtitleKey: 'hub.archive.subtitle',
    descKey: 'hub.archive.desc',
    routes: [] // Handled by AppRouter fallback for now
  };

  const networkMod: GameModule = {
    id: 'network',
    name: 'GLOBAL NETWORK',
    description: 'Workshop / Community',
    version: '1.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/workshop',
    icon: Globe2,
    color: 'var(--accent-network)',
    titleKey: 'hub.network.title',
    subtitleKey: 'hub.network.subtitle',
    descKey: 'hub.network.desc',
    routes: [] // Handled by AppRouter fallback for now
  };

  const creatorMod: GameModule = {
    id: 'creator',
    name: 'CREATOR TERMINAL',
    description: 'Studio / Level Builder',
    version: '1.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/creator',
    icon: TerminalSquare,
    color: 'var(--accent-studio)',
    titleKey: 'hub.studio.title',
    subtitleKey: 'hub.studio.subtitle',
    descKey: 'hub.studio.desc',
    routes: [
      { path: 'creator', element: <CreatorTerminalPage /> }
    ]
  };

  await ModuleRegistry.register(rootMod);
  await ModuleRegistry.register(archiveMod);
  await ModuleRegistry.register(networkMod);
  await ModuleRegistry.register(creatorMod);
};
