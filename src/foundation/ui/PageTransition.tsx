import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="relative w-full h-full min-h-screen isolate">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* 
            Using useOutlet() instead of <Outlet /> is CRITICAL for Framer Motion.
            It freezes the old route's React tree so it can animate out gracefully.
            Using absolute positioning prevents layout jumping and the "pure color" flash 
            because the old and new pages can cross-fade in the exact same DOM space.
          */}
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};