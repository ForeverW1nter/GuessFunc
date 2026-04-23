import React from 'react';
import { ModuleRegistry, type GameModule } from '../../core/ModuleRegistry';
import { useSlotStore } from '../../core/SlotManager';
import { Link } from 'react-router-dom';

const GuessFuncCard = () => {
  return (
    <Link to="/guessfunc" className="group">
      <div className="border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-muted)] p-6 rounded-lg shadow-sm transition-all h-full border">
        <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-primary)]">GuessFunc</h3>
        <p className="text-[var(--color-muted-foreground)]">A math guessing game powered by Desmos.</p>
      </div>
    </Link>
  );
};

const GuessFuncPage = () => {
  return (
    <div className="p-8 h-screen bg-[var(--color-background)]">
      <h1 className="text-4xl font-bold">Welcome to GuessFunc</h1>
      <p className="mt-4 text-[var(--color-muted-foreground)]">Game engine and Web Workers go here...</p>
      <Link to="/" className="mt-8 text-[var(--color-primary)] hover:underline inline-block">← Back to Hub</Link>
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
      { path: '/guessfunc', element: <GuessFuncPage /> }
    ],
    init: () => {
      // Inject the card into the GAME_LIST slot
      useSlotStore.getState().inject('GAME_LIST', GuessFuncCard);
    }
  };

  await ModuleRegistry.register(mod);
};
