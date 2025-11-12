import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid3X3, List, ArrowUpDown, Package, Coffee, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@shared/schema";
// Import placeholders as data URLs since SVG imports are causing issues
const placeholderFood = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI5MCIgcj0iMzAiIGZpbGw9IiMxMGI5ODEiIG9wYWNpdHk9IjAuMiIvPgogIDxyZWN0IHg9IjcwIiB5PSI3MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzEwYjk4MSIgb3BhY2l0eT0iMC4zIi8+CiAgPGNpcmNsZSBjeD0iODUiIGN5PSI4NSIgcj0iNSIgZmlsbD0iIzEwYjk4MSIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9Ijg1IiByPSI1IiBmaWxsPSIjMTBiOTgxIi8+CiAgPGNpcmNsZSBjeD0iMTE1IiBjeT0iODUiIHI9IjUiIGZpbGw9IiMxMGI5ODEiLz4KICA8cmVjdCB4PSI4MCIgeT0iMTIwIiB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iIzEwYjk4MSIgb3BhY2l0eT0iMC40Ii8+CiAgPHRleHQgeD0iMTAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+7J2M7Iud7IqI7KK4PC90ZXh0Pgo8L3N2Zz4=";
const placeholderBeverage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8cmVjdCB4PSI4MCIgeT0iNTAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI4MCIgcng9IjUiIGZpbGw9IiMzYjgyZjYiIG9wYWNpdHk9IjAuMiIvPgogIDxyZWN0IHg9IjgyIiB5PSI1NSIgd2lkdGg9IjM2IiBoZWlnaHQ9IjUwIiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjQiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIHk9IjQwIiByPSI4IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjMiLz4KICA8cmVjdCB4PSI5NiIgeT0iMzAiIHdpZHRoPSI4IiBoZWlnaHQ9IjE1IiBmaWxsPSIjM2I4MmY2IiBvcGFjaXR5PSIwLjUiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjE2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIj7smYzro4zsnbTrr7w8L3RleHQ+Cjwvc3ZnPg==";
const placeholderSnack = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz4KICA8cmVjdCB4PSI2MCIgeT0iNzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI1MCIgcng9IjEwIiBmaWxsPSIjZjU5ZTBiIi9vcGFjaXR5PSIwLjIiLz4KICA8cmVjdCB4PSI2NSIgeT0iNzUiIHdpZHRoPSI3MCIgaGVpZ2h0PSIxNSIgcng9IjMiIGZpbGw9IiNmNTllMGIiIG9wYWNpdHk9IjAuNCIvPgogIDxyZWN0IHg9IjY1IiB5PSI5NSIgd2lkdGg9IjcwIiBoZWlnaHQ9IjE1IiByeD0iMyIgZmlsbD0iI2Y1OWUwYiIgb3BhY2l0eT0iMC4zIi8+CiAgPGNpcmNsZSBjeD0iN1giIGN5PSI4MyIgcj0iMyIgZmlsbD0iI2Y1OWUwYiIvPgogIDxjaXJjbGUgY3g9IjkwIiBjeT0iODMiIHI9IjMiIGZpbGw9IiNmNTllMGIiLz4KICA8Y2lyY2xlIGN4PSIxMDUiIGN5PSI4MyIgcj0iMyIgZmlsbD0iI2Y1OWUwYiIvPgogIDxjaXJjbGUgY3g9IjEyMCIgY3k9IjgzIiByPSIzIiBmaWxsPSIjZjU5ZTBiIi8+CiAgPHRleHQgeD0iMTAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+7Iqk64WN7J207Ja47KeAPC90ZXh0Pgo8L3N2Zz4=";

interface ProductGridProps {
  selectedCategory: number | "all";
  searchQuery: string;
  onAddToCart: (productId: number) => void;
}

// Define CartItem type if it's not defined elsewhere
interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  total: string;
  imageUrl?: string;
  stock: number;
  taxRate?: string;
  afterTaxPrice?: string;
}

export function ProductGrid({ selectedCategory, searchQuery, onAddToCart }: ProductGridProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch store settings to check price inclusion of tax
  const { data: storeSettings } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/store-settings");
      if (!response.ok) throw new Error('Failed to fetch store settings');
      return response.json();
    },
    staleTime: Infinity, // Assuming store settings don't change frequently
  });

  const priceIncludesTax = storeSettings?.priceIncludesTax ?? false;

  // Assume setCart and other necessary hooks/context are available if this were a real component
  // For demonstration, we'll just use the onAddToCart prop
  const setCart = (items: CartItem[]) => {
    console.log("Set cart called with:", items);
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/products", { category: selectedCategory, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`https://order-mobile-be.onrender.com/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const allProducts = await response.json();

      console.log("Raw products from API:", allProducts);
      console.log("Total products received:", allProducts.length);
      console.log("Selected category:", selectedCategory);

      // Filter out raw materials (productType = 2) and inactive products
      let filteredProducts = allProducts.filter((product: any) => {
        const isNotRawMaterial = product.productType !== 2;
        const isActive = product.isActive !== false;
        return isNotRawMaterial && isActive;
      });

      // Apply category filter if not "all"
      if (selectedCategory !== "all") {
        filteredProducts = filteredProducts.filter((product: any) => {
          const categoryMatch = product.categoryId === selectedCategory;
          console.log(`Product ${product.name}: categoryId=${product.categoryId}, selectedCategory=${selectedCategory}, match=${categoryMatch}`);
          return categoryMatch;
        });
      }

      // Apply search filter if exists
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter((product: any) => {
          return product.name.toLowerCase().includes(searchLower) ||
                 product.sku.toLowerCase().includes(searchLower);
        });
      }

      console.log("Filtered products for POS:", filteredProducts);
      console.log("Products after filtering:", filteredProducts.length);

      return filteredProducts;
    },
  });

  const handleAddToCart = (product: Product) => {
    if (product.trackInventory !== false && product.stock <= 0) {
      toast({
        title: t('pos.outOfStock'),
        description: `${product.name} ${t('pos.currentlyOutOfStock')}`,
        variant: "destructive",
      });
      return;
    }

    console.log("Adding product to cart:", product.name);
    console.log("Product afterTaxPrice from database:", product.afterTaxPrice);
    console.log("Product afterTaxPrice type:", typeof product.afterTaxPrice);
    console.log("Product afterTaxPrice is null?", product.afterTaxPrice === null);
    console.log("Product afterTaxPrice is empty string?", product.afterTaxPrice === "");

    // Pass productId to onAddToCart as expected by the interface
    // Toast notification will be handled by the usePOS hook only
    onAddToCart(product.id);
  };

  // Function to calculate the display price based on store settings
  // This function is no longer used for direct price display but kept for potential future use or other logic.
  const getDisplayPrice = (product: Product): number => {
    const basePrice = parseFloat(product.price);
    if (priceIncludesTax) {
      // product.taxRate is a percentage like "8.00" for 8%
      const taxRate = parseFloat(product.taxRate || "0");
      return basePrice * (1 + taxRate / 100);
    }
    return basePrice;
  };

  // Mock updateCart function to demonstrate the change
  const updateCart = (productId: number, quantity: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId 
        ? { 
            ...item, 
            quantity, 
            total: (parseFloat(item.price) * quantity).toFixed(2),
            afterTaxPrice: item.afterTaxPrice // Preserve afterTaxPrice
          }
        : item
    ));
  };

  const getPlaceholderImage = (categoryId: number, productName: string) => {
    // Determine the best placeholder based on category and product name
    const name = productName.toLowerCase();

    if (categoryId === 1 || name.includes('coffee') || name.includes('tea') || name.includes('juice') || name.includes('drink') || name.includes('beverage')) {
      return placeholderBeverage;
    } else if (categoryId === 2 || name.includes('chip') || name.includes('snack') || name.includes('cookie')) {
      return placeholderSnack;
    } else {
      return placeholderFood;
    }
  };

  const getPlaceholderIcon = (categoryId: number, productName: string) => {
    const name = productName.toLowerCase();

    if (categoryId === 1 || name.includes('coffee') || name.includes('tea') || name.includes('juice') || name.includes('drink') || name.includes('beverage')) {
      return Coffee;
    } else if (categoryId === 2 || name.includes('chip') || name.includes('snack') || name.includes('cookie')) {
      return Cookie;
    } else {
      return Package;
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: t('pos.outOfStock'), color: "text-red-500" };
    if (stock <= 5) return { text: `${stock} ${t('pos.inStock')}`, color: "text-red-500" };
    if (stock <= 10) return { text: `${stock} ${t('pos.inStock')}`, color: "text-orange-500" };
    return { text: `${stock} ${t('pos.inStock')}`, color: "text-green-600" };
  };

  const getPopularBadge = (productName: string) => {
    // Mock logic for popular products
    const popularProducts = ["Premium Coffee", "Fresh Orange Juice"];
    return popularProducts.includes(productName);
  };

  const getLowStockBadge = (stock: number) => {
    return stock <= 5 && stock > 0;
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col">
        <div className="bg-white p-4 border-b pos-border">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-material animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded-t-lg"></div>
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const getCategoryName = () => {
    if (selectedCategory === "all") return t('pos.allProducts');
    // This would ideally come from the categories query
    const categoryNames: Record<number, string> = {
      1: "Beverages",
      2: "Snacks", 
      3: "Electronics",
      4: "Household",
      5: "Personal Care"
    };
    return categoryNames[selectedCategory as number] || "Products";
  };

  const handleSort = () => {
    if (sortBy === 'name') {
      setSortBy('price');
    } else if (sortBy === 'price') {
      setSortBy('stock');
    } else {
      setSortBy('name');
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  const getSortedProducts = () => {
    const sorted = [...products].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'price':
          // Use parseFloat on the 'price' column directly for sorting
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  return (
    <main className="flex-1 flex flex-col">
      <div className="bg-white p-4 border-b pos-border flex items-center justify-between pt-[22px] pb-[22px] mt-2">
        <div>
          <h2 className="font-medium pos-text-primary text-[14px]">{getCategoryName()}</h2>
          <p className="text-sm pos-text-secondary">{products.length} {t('pos.productsAvailable')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant={viewMode === 'grid' ? "default" : "outline"} 
            size="sm" 
            className="flex items-center"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <Grid3X3 className="mr-2" size={16} /> : <List className="mr-2" size={16} />}
            {viewMode === 'grid' ? t('pos.gridView') : t('pos.listView')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={handleSort}
          >
            <ArrowUpDown className="mr-2" size={16} />
            {sortBy === 'name' ? t('pos.sortByName') : 
             sortBy === 'price' ? t('pos.sortByPrice') : 
             t('pos.sortByStock')} ({sortOrder === 'asc' ? '↑' : '↓'})
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid3X3 size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium pos-text-secondary mb-2">{t('pos.noProductsFound')}</h3>
            <p className="pos-text-tertiary">
              {searchQuery ? "Thử điều chỉnh từ khóa tìm kiếm" : t('pos.noProductsInCategory')}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 
            "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : 
            "flex flex-col space-y-2"
          }>
            {getSortedProducts().map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const isPopular = getPopularBadge(product.name);
              const isLowStock = getLowStockBadge(product.stock);

              return (
                <div
                  key={product.id}
                  className={viewMode === 'grid' ? 
                    "bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer relative border border-gray-100" :
                    "bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative border border-gray-100 flex items-center p-4"
                  }
                  onClick={() => handleAddToCart(product)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {!product.imageUrl ? (
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                          <img 
                            src={getPlaceholderImage(product.categoryId, product.name)} 
                            alt={`${product.name} placeholder`}
                            className="w-20 h-20 opacity-60"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 hidden flex-col items-center justify-center">
                          <img 
                            src={getPlaceholderImage(product.categoryId, product.name)} 
                            alt={`${product.name} placeholder`}
                            className="w-20 h-20 opacity-60"
                          />
                        </div>
                      )}

                      <div className="p-3">
                        <h3 className="font-medium pos-text-primary mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-sm pos-text-secondary mb-2">SKU: {product.sku}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">{Math.round(parseFloat(product.price)).toLocaleString("vi-VN")} ₫</span>
                          {product.trackInventory !== false && (
                            <span className={`text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <img 
                              src={getPlaceholderImage(product.categoryId, product.name)} 
                              alt={`${product.name} placeholder`}
                              className="w-8 h-8 opacity-60"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium pos-text-primary mb-1">{product.name}</h3>
                        <p className="text-sm pos-text-secondary mb-1">SKU: {product.sku}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">{Math.round(parseFloat(product.price)).toLocaleString("vi-VN")} ₫</span>
                          {product.trackInventory !== false && (
                            <span className={`text-xs font-medium ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Badges */}
                  {isPopular && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      {t('pos.popular')}
                    </div>
                  )}
                  {isLowStock && product.trackInventory !== false && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {t('pos.lowStock')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}