import { useState, useMemo, memo, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getPriceBySize } from "@/data/products";
import { prefetchProduct } from "@/prefetch";
import OptimizedImage from "./OptimizedImage";
import { getImageUrl } from "@/lib/config";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sizes?: string[];
  index?: number;
}

const ProductCard = ({ id, name, price, image, sizes = ["50ml", "50ml vip", "100ml", "100ml vip"], index = 0 }: ProductCardProps) => {
  // Show only 50ml and 100ml on the card (no VIP options); photo stays the same on click
  const displaySizes = useMemo(
    () => sizes.filter((size) => !size.toLowerCase().includes("vip")),
    [sizes]
  );
  const [selectedSize, setSelectedSize] = useState(displaySizes[0] || "50ml");
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();

  // Calculate price based on selected size
  const currentPrice = useMemo(() => getPriceBySize(selectedSize), [selectedSize]);

  const handleAddToCart = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id,
      name,
      price: currentPrice,
      image,
      size: selectedSize,
      quantity: 1,
    });
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [id, name, currentPrice, image, selectedSize, addToCart]);

  const handleSizeKeyDown = useCallback((e: React.KeyboardEvent, size: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedSize(size);
    }
  }, []);

  const handleSizeClick = useCallback((e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="group flex flex-col"
      aria-label={`Product: ${name}`}
    >
      {/* Product image - clickable to product page */}
      <Link 
        to={`/product/${id}`}
        onMouseEnter={prefetchProduct}
        className="block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
        aria-label={`View details for ${name}`}
      >
        <div className="relative bg-white rounded-sm overflow-hidden mb-0">
          <div className="aspect-[3/4] overflow-hidden">
            <OptimizedImage
              src={getImageUrl(image)}
              alt={`${name} perfume bottle`}
              priority={index < 16}
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 50vw"
              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              style={{
                // Crop white margins by scaling up slightly
                transform: 'scale(1.08)',
                objectPosition: 'center',
              }}
              width={300}
              height={400}
            />
          </div>
        </div>
      </Link>
      
      {/* Product info section with light grey background */}
      <div className="bg-gray-100 p-3 flex-1 flex flex-col">
        {/* Product name */}
        <h3 className="text-gray-800 text-sm font-normal mb-1">
          {name}
        </h3>
        
        {/* Price */}
        <p className="text-gray-800 text-sm font-normal mb-3" aria-label={`Price: ${currentPrice} USD`}>
          ${currentPrice} USD
        </p>
        
        {/* Size selector */}
        <div 
          className="flex gap-2 mb-3 flex-wrap"
          role="radiogroup"
          aria-label="Select size"
        >
          {displaySizes.map((size) => (
            <button
              key={size}
              onClick={(e) => handleSizeClick(e, size)}
              onKeyDown={(e) => handleSizeKeyDown(e, size)}
              className={`px-3 py-1.5 text-xs font-normal transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
                selectedSize === size
                  ? "bg-gray-600 text-gray-200"
                  : "bg-white text-gray-800 border border-gray-300"
              }`}
              role="radio"
              aria-checked={selectedSize === size}
              aria-label={`Size: ${size}`}
              type="button"
            >
              {size}
            </button>
          ))}
        </div>
        
        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleAddToCart(e);
            }
          }}
          className={`w-10 h-10 flex items-center justify-center transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
            addedToCart ? "bg-[#D4A84B] hover:bg-[#D4A84B]" : "bg-gray-600 hover:bg-gray-700"
          }`}
          aria-label={addedToCart ? `${name} added to cart` : `Add ${name} to cart`}
          aria-pressed={addedToCart}
          type="button"
        >
          {addedToCart ? (
            <>
              <Check className="w-4 h-4 text-gray-200" aria-hidden="true" />
              <span className="sr-only">Added to cart</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-gray-200" aria-hidden="true" />
              <span className="sr-only">Add to cart</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
};

export default memo(ProductCard);
