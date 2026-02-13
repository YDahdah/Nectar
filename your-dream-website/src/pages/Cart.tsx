import { useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ChevronDown, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkipLink from "@/components/SkipLink";
import LiveRegion from "@/components/LiveRegion";
import MetaTags from "@/components/MetaTags";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/lib/config";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();
  const [announcement, setAnnouncement] = useState("");
  const [orderNotesOpen, setOrderNotesOpen] = useState(false);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <MetaTags
          title="Shopping Cart - Nectar"
          description="Your shopping cart is empty. Browse our luxury fragrances collection."
        />
        <SkipLink />
        <Header />
        <main id="main-content" className="pt-16 sm:pt-20 pb-24" role="main">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md mx-auto"
            >
              <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h1 className="font-serif text-3xl md:text-4xl font-medium mb-4">Your cart is empty</h1>
              <p className="text-muted-foreground mb-8">
                Start shopping to add items to your cart.
              </p>
              <Link to="/shop">
                <Button variant="primary" size="lg">
                  Continue Shopping
                </Button>
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-white">
      <MetaTags
        title={`Shopping Cart (${totalItems} ${totalItems === 1 ? 'item' : 'items'}) - Nectar`}
        description={`Your shopping cart contains ${totalItems} ${totalItems === 1 ? 'item' : 'items'}. Review your order and proceed to checkout.`}
      />
      <SkipLink />
      <Header />
      <LiveRegion message={announcement} />
      <main id="main-content" className="pt-16 sm:pt-20 pb-24" role="main" aria-label="Shopping cart">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:text-gray-600 transition-colors touch-manipulation shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-normal text-gray-800 truncate">Your cart</h1>
            </div>
            <button
              onClick={() => navigate("/shop")}
              className="p-2 hover:text-gray-600 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {items.map((item, index) => (
              <motion.div
                key={`${item.id}-${item.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-3 sm:gap-4"
              >
                {/* Product Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-sm overflow-hidden flex-shrink-0 border border-gray-100">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-contain p-1.5 sm:p-2"
                    fetchpriority="low"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-normal text-gray-800 mb-0.5 sm:mb-1 truncate">{item.name}</h3>
                    <p className="text-sm sm:text-base font-normal text-gray-800 mb-0.5 sm:mb-1">${item.price} USD</p>
                    <p className="text-xs sm:text-sm text-gray-600">Style: {item.size}</p>
                  </div>

                  {/* Quantity Selector and Remove */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3" role="group" aria-label={`Quantity controls for ${item.name}`}>
                      <button
                        onClick={() => {
                          updateQuantity(item.id, item.size, item.quantity - 1);
                          setAnnouncement(`Quantity decreased to ${item.quantity - 1} for ${item.name}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            updateQuantity(item.id, item.size, item.quantity - 1);
                            setAnnouncement(`Quantity decreased to ${item.quantity - 1} for ${item.name}`);
                          }
                        }}
                        className="p-1 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
                        aria-label={`Decrease quantity of ${item.name}`}
                        aria-controls={`cart-quantity-${item.id}-${item.size}`}
                        type="button"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span 
                        id={`cart-quantity-${item.id}-${item.size}`}
                        className="w-8 text-center font-normal text-sm"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          updateQuantity(item.id, item.size, item.quantity + 1);
                          setAnnouncement(`Quantity increased to ${item.quantity + 1} for ${item.name}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            updateQuantity(item.id, item.size, item.quantity + 1);
                            setAnnouncement(`Quantity increased to ${item.quantity + 1} for ${item.name}`);
                          }
                        }}
                        className="p-1 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
                        aria-label={`Increase quantity of ${item.name}`}
                        aria-controls={`cart-quantity-${item.id}-${item.size}`}
                        type="button"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        removeFromCart(item.id, item.size);
                        setAnnouncement(`${item.name} removed from cart`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          removeFromCart(item.id, item.size);
                          setAnnouncement(`${item.name} removed from cart`);
                        }
                      }}
                      className="p-2 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:rounded-sm"
                      aria-label={`Remove ${item.name} from cart`}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Order Notes */}
          <div className="mb-6">
            <button
              onClick={() => setOrderNotesOpen(!orderNotesOpen)}
              className="w-full flex items-center justify-between text-sm text-gray-700 py-2"
            >
              <span>Add order notes</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${orderNotesOpen ? 'rotate-180' : ''}`} />
            </button>
            {orderNotesOpen && (
              <textarea
                className="w-full mt-2 p-3 border border-gray-300 rounded-sm text-sm"
                placeholder="Add any special instructions for your order..."
                rows={3}
              />
            )}
          </div>

          {/* Summary Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Subtotal</span>
              <span className="text-sm font-normal text-gray-800">${getTotalPrice().toFixed(2)} USD</span>
            </div>
            
            <p className="text-xs text-gray-500">
              Taxes and shipping calculated at checkout
            </p>

            <div className="pt-4">
              <Button 
                variant="default" 
                className="w-full bg-black text-white hover:bg-gray-900 rounded-md h-12"
                asChild
              >
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;

