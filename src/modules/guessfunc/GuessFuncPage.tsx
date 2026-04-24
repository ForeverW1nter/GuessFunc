import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraphRenderer } from './components/GraphRenderer';
import { Theme } from 'mafs';

import { motion } from 'framer-motion';

export const GuessFuncPage = () => {
  const [expression, setExpression] = useState('a * sin(x) + b');
  const [params, setParams] = useState<Record<string, number>>({ a: 1, b: 0 });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const currentThemeColor = Theme.blue; // Matches modern blue accent

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-background)] flex flex-col md:flex-row"
    >
      {/* Left Panel: Math Canvas */}
      <motion.div
        layoutId="card-container-guessfunc"
        className="flex-1 p-4 md:p-8 h-[50vh] md:h-screen relative overflow-hidden"
      >
        <div className="w-full h-full relative group rounded-3xl border border-[var(--color-border)] bg-[var(--color-muted)] shadow-2xl overflow-hidden">
          {/* A subtle glowing backdrop behind the graph */}
          <div className="absolute inset-0 bg-[var(--accent-guessfunc)] opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />
          <GraphRenderer
            expression={expression}
            parameters={params}
            lineColor={currentThemeColor}
            height={800} // Will naturally be constrained by flex layout via Mafs container scaling
          />
        </div>
      </motion.div>

      {/* Right Panel: Controls & Telemetry */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="w-full md:w-[400px] lg:w-[480px] p-6 md:p-12 border-t md:border-t-0 md:border-l border-[var(--color-border)] bg-[var(--color-muted)] flex flex-col relative z-10 overflow-y-auto"
      >
        <header className="mb-12">
          <motion.h1
            layoutId="card-title-guessfunc"
            className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 text-[var(--accent-guessfunc)]"
          >
            GUESS FUNC
          </motion.h1>
          <p className="text-sm font-mono text-[var(--color-muted-foreground)] tracking-widest uppercase mt-4">
            System.Engine.Active
          </p>
        </header>

        {/* Input Block */}
        <section className="mb-10 space-y-4">
          <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Function Expression [ y = f(x) ]
          </label>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            placeholder="e.g. sin(x) + a"
            spellCheck={false}
          />
        </section>

        {/* Sliders Block */}
        <section className="space-y-8 flex-1">
          {Object.entries(params).map(([key, val]) => (
            <div key={key} className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted-foreground)]">
                  Variable [{key}]
                </label>
                <span className="font-mono text-sm">{val.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={val}
                onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                className="w-full accent-[var(--color-primary)] bg-[var(--color-border)] h-1 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
              />
            </div>
          ))}
        </section>

        {/* Terminal / Exit */}
        <footer className="mt-12 pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--color-muted-foreground)]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase">Engine Live</span>
          </div>
          <Link
            to="/"
            className="text-xs font-mono tracking-widest uppercase border border-[var(--color-border)] px-4 py-2 rounded-full hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors duration-300"
          >
            Terminate
          </Link>
        </footer>
      </motion.div>
    </motion.div>
  );
};
