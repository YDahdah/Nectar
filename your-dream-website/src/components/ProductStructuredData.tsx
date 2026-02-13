import { useMemo } from "react";
import { useLocation } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  sizes?: string[];
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
}

interface ProductStructuredDataProps {
  product: Product;
  currentPrice?: number;
  selectedSize?: string;
}

const ProductStructuredData = ({ 
  product, 
  currentPrice,
  selectedSize 
}: ProductStructuredDataProps) => {
  const location = useLocation();
  
  // Get the base URL
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://nectar-perfumes.com';
  
  const productUrl = `${baseUrl}${location.pathname}`;
  
  // Handle image URLs - Vite processes imported images and serves them with hashed filenames
  // For structured data, we'll use the image path as-is since browsers resolve it correctly
  // In production builds, Vite will have processed these images
  const getImageUrl = (imagePath: string): string => {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If it's a relative path starting with /, use as is
    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }
    // For imported assets in Vite, they're processed and available at runtime
    // We'll use a placeholder that will be resolved by the browser
    // The actual image URL will be resolved when the page loads
    // For SEO, we'll construct a reasonable URL based on the filename
    const filename = imagePath.split('/').pop() || imagePath;
    // Try to use the image as-is first (Vite handles imports)
    return imagePath.includes('/assets/') ? imagePath : `${baseUrl}/${filename}`;
  };
  
  const imageUrl = getImageUrl(product.image);
  
  // Calculate price range if multiple sizes
  const priceRange = useMemo(() => {
    if (currentPrice) {
      return {
        min: currentPrice,
        max: currentPrice,
      };
    }
    
    // Default price range based on sizes
    const prices = product.sizes?.map(size => {
      const sizeLower = size.toLowerCase();
      if (sizeLower.includes("50ml")) return 6.99;
      if (sizeLower.includes("100ml")) return 10.99;
      return 6.99;
    }) || [6.99];
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [product.sizes, currentPrice]);

  // Generate offers for each size
  const offers = useMemo(() => {
    if (!product.sizes || product.sizes.length === 0) {
      return [{
        "@type": "Offer",
        "price": priceRange.min,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": productUrl,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        "itemCondition": "https://schema.org/NewCondition",
      }];
    }

    return product.sizes.map(size => {
      const sizeLower = size.toLowerCase();
      let price = 6.99;
      if (sizeLower.includes("100ml")) {
        price = 10.99;
      }
      
      return {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": productUrl,
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "itemCondition": "https://schema.org/NewCondition",
        "name": `${product.name} - ${size}`,
      };
    });
  }, [product.sizes, product.name, productUrl, priceRange]);

  // Build additional properties
  const additionalProperty = useMemo(() => {
    const properties: Array<{ "@type": string; name: string; value: string | string[] }> = [];
    
    if (product.sizes && product.sizes.length > 0) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Available Sizes",
        "value": product.sizes.join(", "),
      });
    }
    
    if (product.topNotes && product.topNotes.length > 0) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Top Notes",
        "value": product.topNotes,
      });
    }
    
    if (product.middleNotes && product.middleNotes.length > 0) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Middle Notes",
        "value": product.middleNotes,
      });
    }
    
    if (product.baseNotes && product.baseNotes.length > 0) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Base Notes",
        "value": product.baseNotes,
      });
    }
    
    properties.push({
      "@type": "PropertyValue",
      "name": "Category",
      "value": product.category,
    });
    
    return properties;
  }, [product]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} - ${product.category} fragrance from Nectar Perfumes. Discover luxury fragrances that tell stories, evoke emotions, and leave an unforgettable impression.`,
    "image": [imageUrl], // Array format for multiple images support
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Nectar",
    },
    "category": product.category,
    "offers": offers.length === 1 ? offers[0] : {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": priceRange.min.toString(),
      "highPrice": priceRange.max.toString(),
      "offerCount": offers.length.toString(),
      "offers": offers,
      "availability": "https://schema.org/InStock",
    },
    "url": productUrl,
    "productID": product.id,
    ...(additionalProperty.length > 0 && {
      "additionalProperty": additionalProperty,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default ProductStructuredData;

