import React from 'react';
import { ModuleRegistry, type GameModule } from '../../core/ModuleRegistry';
import { Link } from 'react-router-dom';

const GuessFuncPage = () => {
  return (
    <div className="p-8 min-h-screen bg-[var(--color-background)]">
      <h1 className="text-4xl font-mono tracking-widest uppercase opacity-50 mb-8">System.Engine.GuessFunc</h1>
      <div className="border border-[var(--color-border)] bg-[var(--color-muted)] p-12 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">ENGINE OFFLINE</h2>
        <p className="text-[var(--color-muted-foreground)] font-mono">Mathematical evaluator and graph renderer components are pending migration...</p>
      </div>
      <Link to="/" className="fixed top-8 right-8 text-xs font-mono tracking-widest uppercase border border-[var(--color-border)] px-4 py-2 rounded-full hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors duration-300">
        TERMINATE
      </Link>
    </div>
  );
};

export const initGuessFuncModule = async () => {
  const mod: GameModule = {
    id: 'guessfunc',
    name: 'GuessFunc',
    description: 'A math guessing game',
    version: '1.0.0',
    coreApiVersion: '^1.0.0',
    entryRoute: '/guessfunc',
    routes: [
      { path: 'guessfunc', element: <GuessFuncPage /> }
    ],
    init: () => {
      // In the new architecture, games do not inject themselves into the main Hub UI.
      // The Hub is strictly for the platform's core modes (Story, Workshop, Creator).
      // Games are only invoked via the Level Protocol when a level is played.
      console.log('[GuessFunc] Engine initialized. Awaiting level payload...');
    }
  };

  await ModuleRegistry.register(mod);
};
