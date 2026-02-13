import { useState, useEffect, useRef, memo } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { prefetchShop, prefetchCart } from "@/prefetch";
import SearchDialog from "./SearchDialog";
import Logo from "./Logo";

const Header = memo(() => {
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        searchButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      role="banner"
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <nav 
          className="flex items-center justify-between h-16 sm:h-20"
          role="navigation"
          aria-label="Main navigation"
        >
          <Logo />

          {/* Shop link - visible on all screen sizes */}
          <div className="flex items-center gap-6 sm:gap-8" role="menubar">
            <Link
              to="/shop"
              onMouseEnter={prefetchShop}
              className="text-sm font-medium tracking-wide uppercase hover:text-accent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm px-2 py-1"
              role="menuitem"
            >
              Shop
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-6" role="toolbar" aria-label="Header actions">
            <button
              ref={searchButtonRef}
              onClick={() => setSearchOpen(true)}
              className="p-2 hover:text-accent transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
              aria-label="Search products"
              aria-expanded={searchOpen}
              aria-haspopup="dialog"
              type="button"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Search (Press Ctrl+K or Cmd+K)</span>
            </button>
            <Link
              to="/cart"
              onMouseEnter={prefetchCart}
              className="p-2 hover:text-accent transition-colors duration-300 relative focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
              aria-label={`Shopping cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              {totalItems > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-medium rounded-full flex items-center justify-center"
                  aria-hidden="true"
                >
                  {totalItems}
                </span>
              )}
              <span className="sr-only">{totalItems} items in cart</span>
            </Link>
          </div>
        </nav>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </motion.header>
  );
});

Header.displayName = "Header";

export default Header;
