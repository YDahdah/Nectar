import { useState, useMemo, useRef, useEffect } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { getProductList, getPriceBySize } from "@/api/products";
import { useShop } from "@/contexts/ShopContext";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedGender } = useShop();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Focus trap for accessibility
  useFocusTrap(dialogRef, {
    enabled: open,
    returnFocus: true,
  });

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const { products: allProducts } = getProductList({ gender: selectedGender });

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const query = debouncedSearchQuery.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
    );
  }, [debouncedSearchQuery, allProducts]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || filteredProducts.length === 0) return [];
    const excludedIds = new Set(filteredProducts.map((p) => p.id));
    return allProducts.filter((p) => !excludedIds.has(p.id)).slice(0, 5);
  }, [searchQuery, filteredProducts, allProducts]);

  const handleSelectProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div ref={dialogRef}>
        <CommandInput
          placeholder="Search products..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          aria-label="Search for products"
        />
      <CommandList>
        <CommandEmpty>No products found.</CommandEmpty>
        {filteredProducts.length > 0 && (
          <CommandGroup heading="Products">
            {filteredProducts.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.category}`}
                onSelect={() => handleSelectProduct(product.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 bg-background rounded-sm overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {product.category} • ${getPriceBySize("50ml")}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {/* Suggestions based on selected section */}
        {suggestions.length > 0 && searchQuery.trim() && (
          <CommandGroup heading={`Suggestions from ${selectedGender === "all" ? "All Collections" : selectedGender === "women" ? "Women's Section" : selectedGender === "men" ? "Men's Section" : "Unisex Section"}`}>
            {suggestions.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.category}`}
                onSelect={() => handleSelectProduct(product.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-12 h-12 bg-background rounded-sm overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {product.category} • ${getPriceBySize("50ml")}
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </div>
    </CommandDialog>
  );
};

export default SearchDialog;

