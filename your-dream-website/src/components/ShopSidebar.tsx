import { useMemo } from "react";
import { getAllBrands, getBrandFromName } from "@/data/products";
import { products } from "@/data/products";

export type GenderFilter = "men" | "women" | "mix" | "all";

interface ShopSidebarProps {
  selectedGender: GenderFilter;
  onGenderChange: (gender: GenderFilter) => void;
  selectedBrand: string | null;
  onBrandChange: (brand: string | null) => void;
}

const ShopSidebar = ({ selectedGender, onGenderChange, selectedBrand, onBrandChange }: ShopSidebarProps) => {
  const menuItems = [
    { id: "all" as const, label: "All" },
    { id: "women" as const, label: "Women" },
    { id: "men" as const, label: "Men" },
    { id: "mix" as const, label: "Unisex" },
  ];

  // Get available brands based on selected gender
  const availableBrands = useMemo(() => {
    const filteredProducts = selectedGender === "all" 
      ? products 
      : products.filter((p) => p.gender === selectedGender);
    
    const brands = new Set<string>();
    filteredProducts.forEach((product) => {
      const brand = getBrandFromName(product.name);
      brands.add(brand);
    });
    return Array.from(brands).sort();
  }, [selectedGender]);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Mobile: horizontal scrollable strip for gender */}
      <nav className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-none py-2 border-b border-gray-200 mb-6">
        <ul className="flex gap-2 min-w-max pb-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onGenderChange(item.id)}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-normal rounded-full transition-colors duration-200 ${
                  selectedGender === item.id
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: Brand filter */}
      <div className="lg:hidden px-4 sm:px-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter by Brand</h3>
        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
          <button
            onClick={() => onBrandChange(null)}
            className={`px-3 py-1.5 text-xs font-normal rounded-full transition-colors duration-200 ${
              selectedBrand === null
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Brands
          </button>
          {availableBrands.map((brand) => (
            <button
              key={brand}
              onClick={() => onBrandChange(brand)}
              className={`px-3 py-1.5 text-xs font-normal rounded-full transition-colors duration-200 whitespace-nowrap ${
                selectedBrand === brand
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:block bg-white border-r border-gray-200 sticky top-20 h-[calc(100vh-5rem)] py-6 overflow-y-auto">
        {/* Gender Filter */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 mb-3">Collections</h3>
          <ul className="space-y-0">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onGenderChange(item.id)}
                  className={`w-full text-left px-6 py-3 text-sm font-normal transition-colors duration-200 ${
                    selectedGender === item.id
                      ? "bg-gray-100 text-foreground"
                      : "text-gray-700 hover:bg-gray-50 hover:text-foreground"
                  }`}
                >
                  {item.id === "all" ? "All Collections" : item.id === "women" ? "Women's Section" : item.id === "men" ? "Men's Section" : "Unisex Section"}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Brand Filter */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 mb-3">Brands</h3>
          <div className="px-6 mb-3">
            <button
              onClick={() => onBrandChange(null)}
              className={`w-full text-left px-3 py-2 text-sm font-normal rounded transition-colors duration-200 ${
                selectedBrand === null
                  ? "bg-gray-100 text-foreground font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-foreground"
              }`}
            >
              All Brands
            </button>
          </div>
          <ul className="space-y-0 max-h-[400px] overflow-y-auto">
            {availableBrands.map((brand) => (
              <li key={brand}>
                <button
                  onClick={() => onBrandChange(brand)}
                  className={`w-full text-left px-6 py-2 text-sm font-normal transition-colors duration-200 ${
                    selectedBrand === brand
                      ? "bg-gray-100 text-foreground font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-foreground"
                  }`}
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default ShopSidebar;

