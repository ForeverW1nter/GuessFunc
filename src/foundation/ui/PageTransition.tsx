import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="w-full min-h-screen">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full min-h-screen"
        >
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
