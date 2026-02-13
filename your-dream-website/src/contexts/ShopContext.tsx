import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { GenderFilter } from "@/components/ShopSidebar";

interface ShopContextType {
  selectedGender: GenderFilter;
  setSelectedGender: (gender: GenderFilter) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("all");

  const handleSetSelectedGender = useCallback((gender: GenderFilter) => {
    setSelectedGender(gender);
  }, []);

  const value = useMemo(
    () => ({ selectedGender, setSelectedGender: handleSetSelectedGender }),
    [selectedGender, handleSetSelectedGender]
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

