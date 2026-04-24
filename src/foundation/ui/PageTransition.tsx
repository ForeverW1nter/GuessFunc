import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="relative w-full h-full">
      {/* 
        We must use mode="popLayout" instead of "wait" for Shared Element Transitions (layoutId) to work.
        "wait" destroys the old component before the new one mounts, making layoutId interpolation impossible.
      */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>{outlet}</Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
