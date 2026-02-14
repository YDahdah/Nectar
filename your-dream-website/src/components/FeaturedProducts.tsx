import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { getFeaturedProducts } from "@/api/products";
import { prefetchShop } from "@/prefetch";
import { getImageUrl } from "@/lib/config";
import { getProductImageUrl } from "@/lib/productImages";
import { preloadCriticalImages } from "@/lib/imagePreloader";
import { FEATURED_PRODUCTS_LIMIT } from "@/constants";

const FeaturedProducts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const featuredProducts = getFeaturedProducts(FEATURED_PRODUCTS_LIMIT);

  useEffect(() => {
    // Preload first 4 product images (above the fold)
    const criticalImages = featuredProducts
      .slice(0, 4)
      .map(product => getImageUrl(getProductImageUrl(product.image)));
    
    preloadCriticalImages(criticalImages);
    
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="products" className="py-12 sm:py-16 lg:py-24 xl:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="label-tag mb-4"
          >
            Popular Now
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-medium"
          >
            Signature <span className="text-accent">Fragrances</span>
          </motion.h2>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            featuredProducts.map((product, index) => (
              <ProductCard key={product.id} {...product} index={index} />
            ))
          )}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-16"
        >
          <Link
            to="/shop"
            onMouseEnter={prefetchShop}
            className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide border-b-2 border-accent pb-1 hover:text-accent transition-colors"
          >
            View All Collection
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default memo(FeaturedProducts);
