import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import SkipLink from "@/components/SkipLink";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SkipLink />
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 pt-20" role="main">
        <div className="text-center max-w-md">
          <h1 className="mb-2 text-5xl sm:text-6xl font-serif font-normal text-[#363636]">404</h1>
          <p className="mb-6 text-lg text-gray-600">This page doesn’t exist or has been moved.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-[#D4A84B] hover:bg-[#D4A84B]/90 text-white">
              <Link to="/shop">Browse Shop</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300">
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
