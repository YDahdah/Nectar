import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "nectar-cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useLocalStorage<CartItem[]>(CART_STORAGE_KEY, []);

  const addToCart = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (i) => i.id === item.id && i.size === item.size
      );

      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (item.quantity || 1),
        };
        return updatedItems;
      } else {
        // New item, add to cart
        return [...prevItems, { ...item, quantity: item.quantity || 1 }];
      }
    });
  }, [setItems]);

  const removeFromCart = useCallback((id: string, size: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.id === id && item.size === size))
    );
  }, [setItems]);

  const updateQuantity = useCallback((id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) =>
        prevItems.filter((item) => !(item.id === id && item.size === size))
      );
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity } : item
      )
    );
  }, [setItems]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  // Memoize totals to prevent unnecessary recalculations
  const totalItems = useMemo(() => getTotalItems(), [getTotalItems]);
  const totalPrice = useMemo(() => getTotalPrice(), [getTotalPrice]);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      totalItems,
      totalPrice,
    }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice, totalItems, totalPrice]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

