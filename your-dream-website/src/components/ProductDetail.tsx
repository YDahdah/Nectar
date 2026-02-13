import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Minus, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { getPriceBySize, getRelatedProducts } from "@/data/products";
import ProductStructuredData from "@/components/ProductStructuredData";
import BreadcrumbStructuredData from "@/components/BreadcrumbStructuredData";
import image50ml from "@/assets/MEN/50ml.png";
import image50mlVip from "@/assets/MEN/50mlvip.png";
import image100ml from "@/assets/MEN/100ml.jpeg";
import image100mlVip from "@/assets/MEN/100mlvip.png";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import OptimizedImage from "./OptimizedImage";
import { getImageUrl } from "@/lib/config";

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description?: string;
    sizes: string[];
    topNotes?: string[];
    middleNotes?: string[];
    baseNotes?: string[];
  };
}

const ProductDetail = ({ product }: ProductDetailProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Show all sizes including VIP options
  const displaySizes = useMemo(
    () => product.sizes,
    [product.sizes]
  );
  
  // Initialize selectedSize with first size
  const [selectedSize, setSelectedSize] = useState(() => {
    return product.sizes && product.sizes.length > 0 ? product.sizes[0] : '';
  });

  // Quantity state
  const [quantity, setQuantity] = useState(1);

  // Calculate price based on selected size
  const currentPrice = useMemo(() => getPriceBySize(selectedSize), [selectedSize]);

  // Get image based on selected size
  const displayImage = useMemo(() => {
    const sizeLower = selectedSize.toLowerCase();
    if (sizeLower.includes("100ml") && sizeLower.includes("vip")) {
      return image100mlVip;
    }
    if (sizeLower.includes("100ml")) {
      return image100ml;
    }
    if (sizeLower.includes("50ml") && sizeLower.includes("vip")) {
      return image50mlVip;
    }
    if (sizeLower.includes("50ml")) {
      return image50ml;
    }
    return product.image;
  }, [selectedSize, product.image]);

  // Get related products
  const relatedProducts = useMemo(() => getRelatedProducts(product.id, 2), [product.id]);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.image,
      size: selectedSize,
      quantity: quantity,
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleSizeKeyDown = (e: React.KeyboardEvent, size: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedSize(size);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - $${currentPrice} USD`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied!",
          description: "Product link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link Copied!",
            description: "Product link has been copied to your clipboard.",
          });
        } catch (clipboardError) {
          toast({
            title: "Unable to share",
            description: "Please copy the URL manually.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent, action: 'increase' | 'decrease') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'increase') {
        handleIncreaseQuantity();
      } else {
        handleDecreaseQuantity();
      }
    }
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      image: product.image,
      size: selectedSize,
      quantity: quantity,
    });
    
    // Navigate to checkout page
    navigate("/checkout");
  };

  return (
    <main className="min-h-screen pt-16 sm:pt-20" id="main-content" role="main">
      {/* Structured Data for SEO */}
      <ProductStructuredData 
        product={product} 
        currentPrice={currentPrice}
        selectedSize={selectedSize}
      />
      <BreadcrumbStructuredData 
        items={[
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: product.name, url: `/product/${product.id}` },
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-4 sm:mb-8">
          <BreadcrumbList className="bg-[#f5f3f0] px-3 sm:px-4 py-2 rounded-sm overflow-x-auto">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/shop" className="text-[#2a2a2a] hover:text-accent transition-colors text-sm sm:text-base">
                  Shop
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#2a2a2a] text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-white rounded-sm overflow-hidden lg:sticky lg:top-24 w-full aspect-[3/4]">
              <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                <OptimizedImage
                  src={getImageUrl(displayImage)}
                  alt={product.name}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="w-full h-full object-contain"
                  style={{
                    objectFit: 'contain',
                    imageRendering: 'auto',
                    // Crop white margins by scaling up and centering
                    transform: 'scale(1.1)',
                    objectPosition: 'center',
                  }}
                  width={600}
                  height={800}
                />
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Title & Price */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 flex-1 min-w-0">
                  <span className="line-clamp-2">{product.name}</span>
                </h1>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:text-accent transition-colors rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation shrink-0"
                  aria-label="Share this product"
                  type="button"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-medium text-gray-900">${currentPrice} USD</span>
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-6">
              <label 
                id="size-label"
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="size-selector"
              >
                Size
              </label>
              <div 
                id="size-selector"
                className="flex flex-wrap gap-3"
                role="radiogroup"
                aria-labelledby="size-label"
              >
                {displaySizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      onKeyDown={(e) => handleSizeKeyDown(e, size)}
                      className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                        isSelected
                          ? "bg-gray-600 text-gray-200"
                          : "bg-white text-gray-800 border border-gray-300 hover:border-gray-400"
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Size: ${size}`}
                      type="button"
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label 
                id="quantity-label"
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="quantity-selector"
              >
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div 
                  id="quantity-selector"
                  className="flex items-center gap-3 border border-gray-300 rounded-lg"
                  role="group"
                  aria-labelledby="quantity-label"
                >
                  <button
                    onClick={handleDecreaseQuantity}
                    onKeyDown={(e) => handleQuantityKeyDown(e, 'decrease')}
                    className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                    aria-label="Decrease quantity"
                    aria-controls="quantity-value"
                    type="button"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span 
                    id="quantity-value"
                    className="w-12 text-center font-medium text-gray-900"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncreaseQuantity}
                    onKeyDown={(e) => handleQuantityKeyDown(e, 'increase')}
                    className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
                    aria-label="Increase quantity"
                    aria-controls="quantity-value"
                    type="button"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3" role="group" aria-label="Product actions">
              <button
                onClick={handleAddToCart}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAddToCart();
                  }
                }}
                className="w-full bg-gray-600 text-gray-200 px-6 py-4 flex items-center justify-center gap-2 font-medium hover:bg-gray-700 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label={`Add ${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.name} to cart`}
                type="button"
              >
                Add To Bag
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={handleBuyNow}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBuyNow();
                  }
                }}
                className="w-full bg-white text-gray-800 border-2 border-gray-800 px-6 py-4 font-medium hover:bg-gray-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label={`Buy ${quantity} ${quantity === 1 ? 'item' : 'items'} of ${product.name} now`}
                type="button"
              >
                Buy It Now
              </button>
            </div>

            {/* Description Section */}
            {(product.topNotes || product.middleNotes || product.baseNotes) && (
              <div className="pt-8">
                <h2 className="text-2xl font-medium text-gray-900 mb-4">Description</h2>
                <ul className="space-y-2 text-gray-700">
                  {product.topNotes && product.topNotes.length > 0 && (
                    <li>
                      <strong>Top notes:</strong> {product.topNotes.join(" and ")}
                    </li>
                  )}
                  {product.middleNotes && product.middleNotes.length > 0 && (
                    <li>
                      <strong>Middle notes:</strong> {product.middleNotes.join(" and ")}
                    </li>
                  )}
                  {product.baseNotes && product.baseNotes.length > 0 && (
                    <li>
                      <strong>Base notes:</strong> {product.baseNotes.join(", ")}.
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* You May Also Like Section */}
            {relatedProducts.length > 0 && (
              <div className="pt-8 sm:pt-12">
                <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-4 sm:mb-6">You May Also Like</h2>
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <Link
                      key={relatedProduct.id}
                      to={`/product/${relatedProduct.id}`}
                      className="group"
                    >
                      <div className="bg-white rounded-sm overflow-hidden mb-2">
                        <div className="aspect-[3/4] overflow-hidden">
                          <img
                            src={getImageUrl(relatedProduct.image)}
                            alt={relatedProduct.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                            fetchpriority="low"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 text-center">{relatedProduct.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
