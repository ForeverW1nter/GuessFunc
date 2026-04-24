import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="relative w-full h-full min-h-screen">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "linear" }}
          className="absolute inset-0 w-full h-full"
        >
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
