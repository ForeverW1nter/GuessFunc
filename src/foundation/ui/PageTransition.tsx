import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full min-h-screen"
      >
        {/* 
          Using useOutlet() instead of <Outlet /> is CRITICAL for Framer Motion.
          It freezes the old route's React tree so it can animate out gracefully 
          instead of instantly updating to the new route's content and causing visual bugs.
        */}
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
};