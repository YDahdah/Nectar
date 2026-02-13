import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import ReviewSummary from "@/components/ReviewSummary";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import OrganizationStructuredData from "@/components/OrganizationStructuredData";
import MetaTags from "@/components/MetaTags";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <MetaTags
        title="Nectar - Luxury Fragrances | Premium Perfumes"
        description="Discover luxury fragrances that tell stories, evoke emotions, and leave an unforgettable impression. Shop premium perfumes for men and women."
        image="/favicon.png"
      />
      <SkipLink />
      <OrganizationStructuredData />
      <main id="main-content" role="main">
        <Hero />
        <FeaturedProducts />
        <ReviewSummary />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
