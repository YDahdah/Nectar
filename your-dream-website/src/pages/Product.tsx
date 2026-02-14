import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ProductDetail from "@/components/ProductDetail";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import Footer from "@/components/Footer";
import MetaTags from "@/components/MetaTags";
import { getProductById } from "@/api/products";

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const product = id ? getProductById(id) : null;

  useEffect(() => {
    setIsLoading(true);
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [id]);

  const metaTags = useMemo(() => {
    if (!product) {
      return {
        title: "Product Not Found - Nectar",
        description: "The product you're looking for could not be found.",
      };
    }
    return {
      title: `${product.name} - Nectar Luxury Fragrances`,
      description: `Shop ${product.name} - ${product.category} fragrance. Premium perfume available in multiple sizes.`,
      image: product.image,
    };
  }, [product]);

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title={metaTags.title}
        description={metaTags.description}
        image={metaTags.image}
        type="product"
      />
      <Header />
      {isLoading ? (
        <ProductDetailSkeleton />
      ) : !product ? (
        <main id="main-content" className="container mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center pt-16 sm:pt-20" role="main">
          <h1 className="font-serif text-3xl mb-4">Product not found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/shop" className="text-accent underline hover:text-accent/80">
            Browse all products
          </Link>
          {" or "}
          <Link to="/" className="text-accent underline hover:text-accent/80">
            return to home
          </Link>
        </main>
      ) : (
        <ProductDetail product={product} />
      )}
      <Footer />
    </div>
  );
};

export default Product;
