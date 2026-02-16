import { useMemo } from "react";
import { getProductList, getBrandFromName } from "@/api/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

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
    // Count products per brand
    const brandCounts = new Map<string, number>();
    list.forEach((product) => {
      const brand = getBrandFromName(product.name);
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    });
    // Filter out brands with 1 or fewer products
    return Array.from(brandCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([brand]) => brand)
      .sort();
  }, [selectedGender]);

  const hasActiveFilters = selectedGender !== "all" || selectedBrand;

  const getGenderLabel = (gender: GenderFilter) => {
    return menuItems.find((item) => item.id === gender)?.label || "All fragrances";
  };

  return (
    <div className="w-full">
      {/* Filter Container */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
              <Filter className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Filter Products</h3>
              <p className="text-xs text-muted-foreground">Refine your search</p>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onGenderChange("all");
                onBrandChange(null);
              }}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Collection Filter */}
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Collection
            </label>
            <Select
              value={selectedGender}
              onValueChange={(value) => onGenderChange(value as GenderFilter)}
            >
              <SelectTrigger className="h-11 w-full border-border bg-background text-sm transition-all hover:border-accent/50 focus:border-accent">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Brand
            </label>
            <Select
              value={selectedBrand ?? "all"}
              onValueChange={(value) => onBrandChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-11 w-full border-border bg-background text-sm transition-all hover:border-accent/50 focus:border-accent">
                <SelectValue placeholder="Select brand" />
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
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
            {selectedGender !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs font-medium"
              >
                {getGenderLabel(selectedGender)}
                <button
                  type="button"
                  onClick={() => onGenderChange("all")}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                  aria-label={`Remove ${getGenderLabel(selectedGender)} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedBrand && (
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs font-medium"
              >
                {selectedBrand}
                <button
                  type="button"
                  onClick={() => onBrandChange(null)}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                  aria-label={`Remove ${selectedBrand} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopSidebar;
