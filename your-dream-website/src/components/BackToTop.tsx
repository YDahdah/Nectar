import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SCROLL_THRESHOLD = 400;

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // check initial position
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#C89A3A] text-white shadow-lg shadow-accent/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-accent/40 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[48px] min-h-[48px] touch-manipulation safe-area-bottom safe-area-right"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
