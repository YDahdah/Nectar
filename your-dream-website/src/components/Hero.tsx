import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import OptimizedImage from "./OptimizedImage";
import homepageHero from "@/assets/MEN/Homepage pic.png";

const Hero = memo(function Hero() {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  // Note: OptimizedImage component with priority={true} already handles preloading
  // No need for duplicate preload link here

  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {/* Logo Only */}
      <div className="w-full px-4 sm:px-6 lg:px-12 py-4">
        <div className="container mx-auto">
          <Logo showLink={false} variant="hero" className="items-start" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid lg:grid-cols-2 items-center">
        {/* Left Content */}
        <div className="relative px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
          {/* Decorative gold circles pattern - hidden on very small screens */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
            <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-[#D4A84B]/30" />
            <div className="absolute top-40 right-20 w-24 h-24 rounded-full border border-[#D4A84B]/20" />
            <div className="absolute bottom-32 left-32 w-16 h-16 rounded-full border border-[#D4A84B]/25" />
          </div>

          <div className="relative z-10">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-xs font-sans uppercase tracking-[0.2em] mb-4 sm:mb-6"
            >
              THE ART OF SCENT
            </motion.p>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal leading-tight mb-6 sm:mb-8 text-black"
            >
              Where{" "}
              <span className="italic" style={{ color: "#D4A84B" }}>Elegance</span> Meets Soul
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-gray-400 text-sm sm:text-base font-sans max-w-md mb-8 sm:mb-10 leading-relaxed"
            >
              Discover fragrances that tell stories, evoke emotions, and leave an unforgettable impression.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap gap-4 mb-8 sm:mb-12"
            >
              <Link to="/shop">
                <button className="text-white px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-sans uppercase tracking-wide transition-colors hover:opacity-90 touch-manipulation" style={{ backgroundColor: "#D4A84B" }}>
                  EXPLORE COLLECTION
                </button>
              </Link>
            </motion.div>

            {/* Scroll indicator */}
            <motion.button
              onClick={scrollToProducts}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-start text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
            >
              <span className="text-xs font-sans uppercase tracking-wider mb-2">SCROLL</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </motion.button>
          </div>
        </div>

        {/* Right Image */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[600px] bg-white flex items-center justify-center py-8 lg:py-0"
        >
          <div className="relative w-full h-full flex items-center justify-center bg-white">
            <motion.div
              className="w-full max-w-[240px] sm:max-w-sm lg:max-w-md xl:max-w-lg z-10 bg-white"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <OptimizedImage
                src={homepageHero}
                alt="Nectar Perfume - luxury fragrance"
                className="w-full object-contain bg-white"
                priority
                loading="eager"
                width={480}
                height={720}
                sizes="(min-width: 1280px) 480px, (min-width: 1024px) 384px, (min-width: 640px) 240px, 240px"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default Hero;
