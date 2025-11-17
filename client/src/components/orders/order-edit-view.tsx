
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Users,
  Clock,
  Save,
  Search,
  X,
} from "lucide-react";
import type { Table, Product, Order, OrderItem } from "@shared/schema";

interface OrderEditViewProps {
  orderId: number;
  onBack: () => void;
}

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  sku: string;
}

export function OrderEditView({ orderId, onBack }: OrderEditViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingItems, setExistingItems] = useState<any[]>([]);

  // Fetch order data
  const { data: order } = useQuery<Order>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
  });

  // Fetch order items
  const { data: orderItems, refetch: refetchOrderItems } = useQuery<OrderItem[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items", orderId],
    queryFn: async () => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order items");
      return response.json();
    },
  });

  // Fetch products
  const { data: products } = useQuery<Product[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"],
    queryFn: async () => {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.filter((p: Product) => p.productType !== 2 && p.isActive !== false);
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
  });

  // Fetch table info
  const { data: table } = useQuery<Table>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables", order?.tableId],
    enabled: !!order?.tableId,
    queryFn: async () => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables/${order?.tableId}`);
      if (!response.ok) throw new Error("Failed to fetch table");
      return response.json();
    },
  });

  // Set existing items when order items are loaded
  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setExistingItems(orderItems.map(item => ({
        ...item,
        quantity: parseInt(item.quantity?.toString() || "0")
      })));
    }
  }, [orderItems]);

  // Filter products
  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    const existingCartItem = cart.find(item => item.productId === product.id);
    
    if (existingCartItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        sku: product.sku,
      }]);
    }

    toast({
      title: "Đã thêm vào giỏ",
      description: `${product.name} đã được thêm vào đơn hàng`,
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Update existing item quantity
  const updateExistingQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setExistingItems(existingItems.filter(item => item.id !== itemId));
    } else {
      setExistingItems(existingItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      // Add new items
      for (const item of cart) {
        await apiRequest("POST", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items", {
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }

      // Update existing items
      for (const item of existingItems) {
        if (item.quantity === 0) {
          await apiRequest("DELETE", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${item.id}`);
        } else {
          await apiRequest("PATCH", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${item.id}`, {
            quantity: item.quantity,
          });
        }
      }

      // Recalculate order totals
      await apiRequest("POST", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/recalculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items", orderId] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      
      toast({
        title: "Thành công",
        description: "Đơn hàng đã được cập nhật",
      });
      
      setCart([]);
      refetchOrderItems();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật đơn hàng",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const calculateTotal = () => {
    const existingTotal = existingItems.reduce((sum, item) => {
      return sum + parseFloat(item.unitPrice || "0") * item.quantity;
    }, 0);
    
    const newTotal = cart.reduce((sum, item) => {
      return sum + parseFloat(item.unitPrice || "0") * item.quantity;
    }, 0);
    
    return existingTotal + newTotal;
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Chỉnh sửa đơn hàng</h1>
            <p className="text-sm opacity-90">
              Bàn {table?.tableNumber} - {order.orderNumber}
            </p>
          </div>
          <Badge className="bg-orange-500 text-white shadow-md px-3 py-1 font-semibold">
            Đang chỉnh sửa
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-10 bg-white border-0 shadow-sm h-11 rounded-xl text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 pb-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2 pb-3">
              <Button
                variant={selectedCategory === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full whitespace-nowrap font-medium ${
                  selectedCategory === "all" 
                    ? "bg-white text-blue-600" 
                    : "text-white hover:bg-white/20"
                }`}
              >
                Tất cả
              </Button>
              {categories?.map((category: any) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full whitespace-nowrap font-medium ${
                    selectedCategory === category.id 
                      ? "bg-white text-blue-600" 
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Current Order Items */}
      <div className="p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Món trong đơn ({existingItems.length})
        </h2>
        {existingItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có món nào</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {existingItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.productName}</h3>
                      <p className="text-sm text-gray-500">
                        {Math.floor(parseFloat(item.unitPrice)).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateExistingQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateExistingQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateExistingQuantity(item.id, 0)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Items in Cart */}
        {cart.length > 0 && (
          <>
            <Separator className="my-4" />
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
              <Plus className="w-5 h-5" />
              Món mới thêm ({cart.length})
            </h2>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <Card key={item.productId} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-green-700">{item.productName}</h3>
                        <p className="text-sm text-gray-500">
                          {Math.floor(parseFloat(item.unitPrice)).toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateCartQuantity(item.productId, 0)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Grid */}
      <div className="px-4">
        <h2 className="font-semibold mb-3">Thêm món</h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAddToCart(product)}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600">
                    {Math.floor(parseFloat(product.price)).toLocaleString("vi-VN")} ₫
                  </span>
                  {product.stock <= 5 && product.trackInventory !== false && (
                    <Badge variant="destructive" className="text-xs">
                      Còn {product.stock}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="mb-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Tổng cộng:</span>
            <span className="text-blue-600">
              {Math.floor(calculateTotal()).toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
        <Button 
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
          onClick={() => saveOrderMutation.mutate()}
          disabled={saveOrderMutation.isPending || (cart.length === 0 && existingItems.length === orderItems?.length)}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveOrderMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
