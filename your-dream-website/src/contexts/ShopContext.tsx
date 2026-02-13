import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { GenderFilter } from "@/components/ShopSidebar";

interface ShopContextType {
  selectedGender: GenderFilter;
  setSelectedGender: (gender: GenderFilter) => void;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("all");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const handleSetSelectedGender = useCallback((gender: GenderFilter) => {
    setSelectedGender(gender);
  }, []);

  const handleSetSelectedBrand = useCallback((brand: string | null) => {
    setSelectedBrand(brand);
  }, []);

  const value = useMemo(
    () => ({ 
      selectedGender, 
      setSelectedGender: handleSetSelectedGender,
      selectedBrand,
      setSelectedBrand: handleSetSelectedBrand
    }),
    [selectedGender, handleSetSelectedGender, selectedBrand, handleSetSelectedBrand]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};

