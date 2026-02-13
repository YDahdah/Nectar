export type GenderFilter = "men" | "women" | "mix" | "all";

interface ShopSidebarProps {
  selectedGender: GenderFilter;
  onGenderChange: (gender: GenderFilter) => void;
}

const ShopSidebar = ({ selectedGender, onGenderChange }: ShopSidebarProps) => {
  const menuItems = [
    { id: "all" as const, label: "All" },
    { id: "women" as const, label: "Women" },
    { id: "men" as const, label: "Men" },
    { id: "mix" as const, label: "Unisex" },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Mobile: horizontal scrollable strip */}
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
      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:block bg-white border-r border-gray-200 sticky top-20 h-[calc(100vh-5rem)] py-6">
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
      </nav>
    </aside>
  );
};

export default ShopSidebar;

