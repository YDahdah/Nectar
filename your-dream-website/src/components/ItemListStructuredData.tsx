import { useMemo } from "react";
import { useLocation } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

interface ItemListStructuredDataProps {
  products: Product[];
  listName?: string;
}

const ItemListStructuredData = ({ products, listName = "Products" }: ItemListStructuredDataProps) => {
  const location = useLocation();
  
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://nectar-perfumes.com';
  
  const listUrl = `${baseUrl}${location.pathname}`;

  const structuredData = useMemo(() => {
    const getImageUrl = (imagePath: string): string => {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      if (imagePath.startsWith('/')) {
        return `${baseUrl}${imagePath}`;
      }
      // For imported assets in Vite, construct a reasonable URL
      const filename = imagePath.split('/').pop() || imagePath;
      return imagePath.includes('/assets/') ? imagePath : `${baseUrl}/${filename}`;
    };
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": listName,
      "description": `Browse our collection of ${listName.toLowerCase()}`,
      "url": listUrl,
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "image": getImageUrl(product.image),
          "url": `${baseUrl}/product/${product.id}`,
          "sku": product.id,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
          },
        },
      })),
    };
  }, [products, listName, listUrl, baseUrl]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
    />
  );
};

export default ItemListStructuredData;

