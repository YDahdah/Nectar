import { useMemo } from "react";
import { getProductList, getBrandFromName } from "@/api/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export type GenderFilter = "men" | "women" | "mix" | "all";

interface ShopSidebarProps {
  selectedGender: GenderFilter;
  onGenderChange: (gender: GenderFilter) => void;
  selectedBrand: string | null;
  onBrandChange: (brand: string | null) => void;
}

const ShopSidebar = ({
  selectedGender,
  onGenderChange,
  selectedBrand,
  onBrandChange,
}: ShopSidebarProps) => {
  const menuItems: { id: GenderFilter; label: string }[] = [
    { id: "all", label: "All fragrances" },
    { id: "women", label: "Women" },
    { id: "men", label: "Men" },
    { id: "mix", label: "Unisex" },
  ];

  const availableBrands = useMemo(() => {
    const { products: list } = getProductList({ gender: selectedGender });
    const brands = new Set<string>();
    list.forEach((product) => {
      brands.add(getBrandFromName(product.name));
    });
    return Array.from(brands).sort();
  }, [selectedGender]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <Select
          value={selectedGender}
          onValueChange={(value) => onGenderChange(value as GenderFilter)}
        >
          <SelectTrigger className="w-[180px] border-border bg-background text-sm">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            {menuItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedBrand ?? "all"}
          onValueChange={(value) => onBrandChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px] border-border bg-background text-sm">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {availableBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedGender !== "all" || selectedBrand) && (
          <button
            type="button"
            onClick={() => {
              onGenderChange("all");
              onBrandChange(null);
            }}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopSidebar;
