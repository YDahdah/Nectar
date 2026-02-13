import { useMemo, memo, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ShopSidebar from "@/components/ShopSidebar";
import SkipLink from "@/components/SkipLink";
import ItemListStructuredData from "@/components/ItemListStructuredData";
import MetaTags from "@/components/MetaTags";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { useShop } from "@/contexts/ShopContext";
import { getBrandFromName } from "@/data/products";

// Fisher-Yates shuffle algorithm for randomizing array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Cache shuffled products to avoid re-shuffling on every render
let cachedShuffledProducts: typeof products | null = null;

const Shop = () => {
  const { selectedGender, setSelectedGender, selectedBrand, setSelectedBrand } = useShop();
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by gender
    if (selectedGender !== "all") {
      filtered = filtered.filter((product) => product.gender === selectedGender);
    }
    
    // Filter by brand
    if (selectedBrand) {
      filtered = filtered.filter((product) => getBrandFromName(product.name) === selectedBrand);
    } else if (selectedGender === "all" && !selectedBrand) {
      // Use cached shuffled products only when no filters are applied
      if (!cachedShuffledProducts) {
        cachedShuffledProducts = shuffleArray(products);
      }
      return cachedShuffledProducts;
    }
    
    return filtered;
  }, [selectedGender, selectedBrand]);

  // Simulate loading state when filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Short delay for smooth transition
    return () => clearTimeout(timer);
  }, [selectedGender, selectedBrand]);

  const pageTitle = useMemo(() => {
    const genderText = selectedGender === "all" 
      ? "All Fragrances" 
      : selectedGender === "men" 
        ? "Men's Fragrances" 
        : selectedGender === "women" 
          ? "Women's Fragrances" 
          : "Unisex Fragrances";
    return `${genderText} - Nectar`;
  }, [selectedGender]);

  const pageDescription = useMemo(() => {
    return selectedGender === "all"
      ? "Browse our complete collection of luxury fragrances. Discover premium perfumes for men, women, and unisex scents."
      : selectedGender === "men"
        ? "Explore our collection of men's luxury fragrances. Premium perfumes crafted for the modern gentleman."
        : selectedGender === "women"
          ? "Discover elegant women's fragrances. Luxury perfumes that capture sophistication and femininity."
          : "Shop unisex fragrances that transcend gender. Versatile scents for everyone.";
  }, [selectedGender]);

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title={pageTitle}
        description={pageDescription}
        image="/favicon.png"
      />
      <SkipLink />
      <Header />
      {/* Structured Data for Shop Page */}
      {!isLoading && filteredProducts.length > 0 && (
        <ItemListStructuredData 
          products={filteredProducts} 
          listName={selectedGender === "all" ? "All Fragrances" : `${selectedGender === "men" ? "Men's" : selectedGender === "women" ? "Women's" : "Unisex"} Fragrances`}
        />
      )}
      <main id="main-content" className="pt-16 sm:pt-20" role="main">
        {/* Hero Banner */}
        <section className="py-12 sm:py-16 lg:py-20 xl:py-28 text-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="label-tag mb-4"
            >
              Our Collection
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic font-medium mb-4 sm:mb-6"
            >
              Explore Our <span className="text-accent">Fragrances</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto px-2"
            >
              Each fragrance is carefully crafted to evoke emotions and create unforgettable memories.
            </motion.p>
          </div>
        </section>

        {/* Filters + Products */}
        <section className="pb-16 sm:pb-24 lg:pb-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="mb-6 sm:mb-8">
              <ShopSidebar
                selectedGender={selectedGender}
                onGenderChange={setSelectedGender}
                selectedBrand={selectedBrand}
                onBrandChange={setSelectedBrand}
              />
            </div>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <ProductCardSkeleton key={index} />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 xl:gap-10">
                    {filteredProducts.map((product, index) => (
                      <ProductCard 
                        key={product.id} 
                        {...product} 
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg">
                      No products found in this category.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default memo(Shop);
