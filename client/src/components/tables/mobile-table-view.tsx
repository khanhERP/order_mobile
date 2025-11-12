import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Receipt,
  Search,
  X,
  CreditCard,
  Printer,
} from "lucide-react";
import type { Table, Product, Order, OrderItem } from "@shared/schema";

interface MobileTableViewProps {
  tableId: number;
  floor: string;
  onBack: () => void;
}

export function MobileTableView({
  tableId,
  floor,
  onBack,
}: MobileTableViewProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all",
  );
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<
    "products" | "order" | "pending-orders"
  >("products");
  const [tempCart, setTempCart] = useState<
    { productId: number; quantity: number; product: Product }[]
  >([]);

  // Fetch table data
  const { data: table } = useQuery<Table>({
    queryKey: ["https://order-mobile-be.onrender.com/api/tables", tableId],
    queryFn: async () => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/tables/${tableId}`);
      if (!response.ok) throw new Error("Failed to fetch table");
      return response.json();
    },
  });

  // Fetch all orders
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
    queryFn: async () => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/orders?${tableId}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.filter(
        (p: Product) => p.productType !== 2 && p.isActive !== false,
      );
    },
  });

  // Get active order for this table
  const activeOrder = orders?.find(
    (o: Order) =>
      o.tableId === tableId && o.status !== "paid" && o.status !== "cancelled",
  );

  // Fetch order items if there's an active order
  const { data: orderItems, refetch: refetchOrderItems } = useQuery<
    OrderItem[]
  >({
    queryKey: ["https://order-mobile-be.onrender.com/api/order-items", activeOrder?.id],
    enabled: !!activeOrder?.id,
    queryFn: async () => {
      if (!activeOrder?.id) return [];
      console.log("📦 Fetching order items for order:", activeOrder.id);
      const response = await fetch(`https://order-mobile-be.onrender.com/api/order-items/${activeOrder.id}`);
      if (!response.ok) {
        console.error("❌ Failed to fetch order items:", response.status);
        throw new Error("Failed to fetch order items");
      }
      const data = await response.json();
      console.log("✅ Order items fetched:", data);
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch products for the product list
  const { data: products } = useQuery<Product[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/products"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      return data.filter(
        (p: Product) => p.productType !== 2 && p.isActive !== false,
      );
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/categories"],
  });

  // Determine if table is occupied - prioritize table.status but also check active order
  const isOccupied = table?.status === "occupied" || !!activeOrder;

  // Log table and order status for debugging
  useEffect(() => {
    console.log("📊 Table Status Debug:", {
      tableId,
      tableNumber: table?.tableNumber,
      tableStatus: table?.status,
      hasActiveOrder: !!activeOrder,
      activeOrderId: activeOrder?.id,
      activeOrderStatus: activeOrder?.status,
      isOccupied,
      allOrders: orders?.filter((o) => o.tableId === tableId),
    });
  }, [
    table?.status,
    table?.tableNumber,
    activeOrder,
    isOccupied,
    tableId,
    orders,
  ]);

  // Refetch order items when active order changes
  useEffect(() => {
    if (activeOrder?.id) {
      console.log("🔄 Active order changed:", {
        orderId: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        status: activeOrder.status,
        tableId: activeOrder.tableId,
        isOccupied,
      });
      refetchOrderItems();
    } else {
      console.log("⚠️ No active order found for table");
    }
  }, [activeOrder?.id, isOccupied, refetchOrderItems]);

  // Log order items when they change
  useEffect(() => {
    console.log("📦 Order items updated:", {
      count: orderItems?.length || 0,
      items: orderItems,
      activeOrderId: activeOrder?.id,
    });
  }, [orderItems, activeOrder?.id]);

  // Filter products by search and category
  const filteredProducts =
    products?.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  // Add item to temporary cart
  const addToTempCart = (product: Product) => {
    setTempCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prev, { productId: product.id, quantity: 1, product }];
    });
  };

  // Update quantity in temp cart
  const updateTempCartQuantity = (productId: number, delta: number) => {
    setTempCart((prev) => {
      const updated = prev
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
      return updated;
    });
  };

  // Remove from temp cart
  const removeFromTempCart = (productId: number) => {
    setTempCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Confirm order mutation - create order with all items
  const confirmOrderMutation = useMutation({
    mutationFn: async () => {
      if (tempCart.length === 0) {
        throw new Error("Giỏ hàng trống");
      }

      console.log("🛒 Confirm order mutation started", {
        tempCartLength: tempCart.length,
        hasActiveOrder: !!activeOrder,
        activeOrderId: activeOrder?.id,
      });

      if (!activeOrder) {
        // Calculate totals
        const subtotal = tempCart.reduce((sum, item) => {
          return sum + parseFloat(item.product.price) * item.quantity;
        }, 0);

        const tax = tempCart.reduce((sum, item) => {
          if (item.product.afterTaxPrice) {
            const afterTaxPrice = parseFloat(item.product.afterTaxPrice);
            const price = parseFloat(item.product.price);
            const taxPerUnit = afterTaxPrice - price;
            return sum + taxPerUnit * item.quantity;
          }
          return sum;
        }, 0);

        const total = subtotal + tax;

        // Create new order with all items
        const orderData = {
          orderNumber: `ORD-${Date.now()}`,
          tableId,
          customerCount: 1,
          status: "pending",
          paymentStatus: "pending",
          salesChannel: "table",
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
        };

        const items = tempCart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitPrice: item.product.price,
          total: (parseFloat(item.product.price) * item.quantity).toFixed(2),
        }));

        console.log("📝 Creating new order", { orderData, items });
        return apiRequest("POST", "https://order-mobile-be.onrender.com/api/orders", { order: orderData, items });
      } else {
        console.log("➕ Adding items to existing order", activeOrder.id);

        // Use the new endpoint to add items to existing order
        const items = tempCart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product.price,
          total: (parseFloat(item.product.price) * item.quantity).toFixed(2),
        }));

        console.log("📦 Items to add:", items);

        // Add items using the dedicated endpoint
        const response = await apiRequest(
          "POST",
          `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/items`,
          {
            items,
          },
        );

        const result = await response.json();
        console.log("✅ Items added successfully:", result);

        return result;
      }
    },
    onSuccess: async () => {
      console.log("✅ Order created/updated successfully, refreshing data");

      // Clear all caches first
      queryClient.removeQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/orders"] });
      queryClient.removeQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/order-items"] });
      queryClient.removeQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables"] });

      // Force immediate refresh
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/orders"] }),
        queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables", tableId] }),
        queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables"] }),
      ]);

      // Refetch order items if there's an active order
      if (activeOrder?.id) {
        await queryClient.refetchQueries({
          queryKey: ["https://order-mobile-be.onrender.com/api/order-items", activeOrder.id],
        });
      }

      setTempCart([]);
      setViewMode("order");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
    },
  });

  // Calculate order total
  const orderTotal =
    orderItems?.reduce((sum, item) => {
      return sum + parseFloat(item.total);
    }, 0) || 0;

  // Calculate temp cart total
  const tempCartTotal = tempCart.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  // Fetch all unpaid orders for this table
  const { data: pendingOrders } = useQuery<Order[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/orders", "table", tableId],
    queryFn: async () => {
      const allOrders = await queryClient.fetchQuery({
        queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
      });
      const filtered = (allOrders as Order[]).filter(
        (o: Order) =>
          o.tableId === tableId && !["paid", "cancelled"].includes(o.status),
      );
      console.log("🔍 Unpaid orders for table", tableId, ":", filtered);
      return filtered;
    },
    enabled: isOccupied,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Render pending orders list view (when in pending-orders mode)
  if (
    viewMode === "pending-orders" &&
    isOccupied &&
    pendingOrders &&
    pendingOrders.length > 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-10 shadow-lg">
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
              <h1 className="text-xl font-bold tracking-tight">
                {t("tables.table")} {table?.tableNumber}
              </h1>
              <p className="text-sm opacity-90">{floor}</p>
            </div>
            <Badge className="bg-yellow-500 text-white shadow-md px-3 py-1 font-semibold">
              {t("tables.pendingStatus")}
            </Badge>
          </div>
        </div>

        {/* Pending Orders List */}
        <div className="p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t("tables.unpaidOrders")} ({pendingOrders.length})
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={async () => {
                  // Set this order as the active one by invalidating and switching view
                  await queryClient.invalidateQueries({
                    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                  });
                  setViewMode("order");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">
                        {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.orderedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      {t("tables.pendingStatus")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{order.customerCount || 1} người</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.floor(
                        parseFloat(order.total || "0"),
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add New Order Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
            onClick={() => setViewMode("products")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm đơn hàng mới
          </Button>
        </div>
      </div>
    );
  }

  // Render order details view (when table is occupied and viewing order)
  if (viewMode === "order" && activeOrder) {
    console.log("📋 Rendering order view:", {
      orderId: activeOrder.id,
      orderNumber: activeOrder.orderNumber,
      itemsCount: orderItems?.length,
      items: orderItems,
    });
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white sticky top-0 z-10 shadow-lg">
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
              <h1 className="text-xl font-bold tracking-tight">
                {t("tables.table")} {table?.tableNumber}
              </h1>
              <p className="text-sm opacity-90">{floor}</p>
            </div>
            <Badge className="bg-red-500 text-white shadow-md px-3 py-1 font-semibold">
              {t("tables.inUse")}
            </Badge>
          </div>
        </div>

        {/* Order Info Card */}
        <div className="p-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {t("tables.orderInfo")}
                </CardTitle>
                <Badge variant="outline">{activeOrder.orderNumber}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{t("tables.numberOfGuests")}</span>
                </div>
                <span className="font-medium">
                  {activeOrder.customerCount || 1} {t("tables.people")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{t("tables.time")}</span>
                </div>
                <span className="font-medium">
                  {new Date(activeOrder.orderedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("tables.total")}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {Math.floor(orderTotal).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items List */}
        <div className="px-4 pb-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t("tables.itemList")} ({orderItems?.length || 0})
          </h2>
          {!orderItems || orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t("tables.noItemsInOrder")}</p>
            </div>
          ) : (
            <div className="space-y-2 pb-48">
              {orderItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{item.productName}</h3>
                          {/* Status Badge */}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              !item.status || item.status === ""
                                ? "bg-gray-100 text-gray-700 border-gray-300"
                                : item.status === "pending"
                                  ? "bg-orange-100 text-orange-700 border-orange-300"
                                  : item.status === "progress"
                                    ? "bg-blue-100 text-blue-700 border-blue-300"
                                    : item.status === "completed"
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            {!item.status || item.status === ""
                              ? t("tables.notSentToKitchen")
                              : item.status === "pending"
                                ? t("tables.waitingForPreparation")
                                : item.status === "progress"
                                  ? t("tables.processing")
                                  : item.status === "completed"
                                    ? t("tables.completed")
                                    : item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {Math.floor(
                            parseFloat(item.unitPrice),
                          ).toLocaleString("vi-VN")}{" "}
                          ₫ x {parseFloat(item.quantity)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {Math.floor(parseFloat(item.total)).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          ₫
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls and actions */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const newQuantity = parseFloat(item.quantity) - 1;
                              if (newQuantity <= 0) {
                                // Check if this is the last item in the order
                                if (orderItems && orderItems.length <= 1) {
                                  toast({
                                    title: t("tables.cannotDelete"),
                                    description: t(
                                      "tables.cannotDeleteLastItem",
                                    ),
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                // Delete item if quantity would be 0
                                try {
                                  await apiRequest(
                                    "DELETE",
                                    `https://order-mobile-be.onrender.com/api/order-items/${item.id}`,
                                  );
                                  await refetchOrderItems();
                                  
                                  // Recalculate order totals
                                  await apiRequest(
                                    "POST",
                                    `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                                    {}
                                  );
                                  
                                  // Invalidate orders cache
                                  await queryClient.invalidateQueries({
                                    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                                  });
                                } catch (error) {
                                  toast({
                                    title: t("common.error"),
                                    description: t("tables.deleteItemError"),
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                // Update quantity
                                const unitPrice = parseFloat(item.unitPrice);
                                const newTotal = (unitPrice * newQuantity).toFixed(2);
                                
                                try {
                                  await apiRequest(
                                    "PUT",
                                    `https://order-mobile-be.onrender.com/api/order-items/${item.id}`,
                                    {
                                      quantity: newQuantity,
                                      total: newTotal,
                                    },
                                  );
                                  await refetchOrderItems();
                                  
                                  // Recalculate order totals
                                  await apiRequest(
                                    "POST",
                                    `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                                    {}
                                  );
                                  
                                  // Invalidate orders cache
                                  await queryClient.invalidateQueries({
                                    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                                  });
                                } catch (error) {
                                  toast({
                                    title: t("common.error"),
                                    description: t(
                                      "tables.updateQuantityError",
                                    ),
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            className="h-8 px-2"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-medium text-base px-3 min-w-[40px] text-center">
                            {parseFloat(item.quantity)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const newQuantity = parseFloat(item.quantity) + 1;
                              const unitPrice = parseFloat(item.unitPrice);
                              const newTotal = (unitPrice * newQuantity).toFixed(2);
                              
                              try {
                                await apiRequest(
                                  "PUT",
                                  `https://order-mobile-be.onrender.com/api/order-items/${item.id}`,
                                  {
                                    quantity: newQuantity,
                                    total: newTotal,
                                  },
                                );
                                await refetchOrderItems();
                                
                                // Recalculate order totals
                                await apiRequest(
                                  "POST",
                                  `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                                  {}
                                );
                                
                                // Invalidate orders cache to refresh totals
                                await queryClient.invalidateQueries({
                                  queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                                });
                              } catch (error) {
                                toast({
                                  title: "Lỗi",
                                  description: "Không thể cập nhật số lượng",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="h-8 px-2"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            // Check if this is the last item in the order
                            if (orderItems && orderItems.length <= 1) {
                              toast({
                                title: "Không thể xóa",
                                description:
                                  "Không thể xóa món cuối cùng trong đơn hàng. Vui lòng hủy đơn hàng nếu muốn xóa tất cả.",
                                variant: "destructive",
                              });
                              return;
                            }

                            try {
                              await apiRequest(
                                "DELETE",
                                `https://order-mobile-be.onrender.com/api/order-items/${item.id}`,
                              );
                              await refetchOrderItems();
                            } catch (error) {
                              toast({
                                title: "Lỗi",
                                description: "Không thể xóa món",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Send to Kitchen button - only show if status is pending */}
                      {!item.status && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await apiRequest(
                                "PATCH",
                                `https://order-mobile-be.onrender.com/api/order-items/${item.id}`,
                                {
                                  status: "progress",
                                },
                              );

                              // Invalidate and refetch order items
                              await queryClient.invalidateQueries({
                                queryKey: ["https://order-mobile-be.onrender.com/api/order-items", activeOrder.id],
                              });
                              await refetchOrderItems();
                            } catch (error) {
                              console.error(
                                "Error sending item to kitchen:",
                                error,
                              );
                              toast({
                                title: t("common.error"),
                                description: t("tables.sendToKitchenError"),
                                variant: "destructive",
                              });
                            }
                          }}
                          className="w-full h-8 bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:text-orange-800"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t("tables.sendToKitchen")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2 shadow-lg z-10">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
            onClick={() => setViewMode("products")}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("tables.addItems")}
          </Button>

          {/* Only show "Send all to Kitchen" button if there are items with pending status */}
          {orderItems && orderItems.some((item) => !item.status) && (
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
              onClick={async () => {
                try {
                  // Update all pending items to progress status
                  if (!orderItems || orderItems.length === 0) {
                    toast({
                      title: "Không có món",
                      description: "Chưa có món nào trong đơn hàng",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Update each item that has pending status to "progress"
                  const updatePromises = orderItems
                    .filter((item) => !item.status)
                    .map((item) =>
                      apiRequest("PATCH", `https://order-mobile-be.onrender.com/api/order-items/${item.id}`, {
                        status: "pending",
                      }),
                    );

                  if (updatePromises.length === 0) {
                    return;
                  }

                  await Promise.all(updatePromises);

                  // Invalidate and refetch order items
                  await queryClient.invalidateQueries({
                    queryKey: ["https://order-mobile-be.onrender.com/api/order-items", activeOrder.id],
                  });
                  await refetchOrderItems();
                } catch (error) {
                  console.error("Error sending to kitchen:", error);
                  toast({
                    title: "Lỗi",
                    description: "Không thể gửi món vào bếp",
                    variant: "destructive",
                  });
                }
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Gửi bếp
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render product list view (when table is empty OR when adding items to existing order)
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white sticky top-0 z-10 shadow-lg">
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
            <h1 className="text-xl font-bold tracking-tight">
              {t("tables.table")} {table?.tableNumber}
            </h1>
            <p className="text-sm opacity-90">
              {floor} •{" "}
              {isOccupied
                ? t("tables.addingItems")
                : t("tables.selectMenuToOrder")}
            </p>
          </div>
          <Badge
            className={`text-xs font-semibold shadow-md px-3 py-1 ${
              !isOccupied
                ? "bg-green-100 text-green-700 border border-green-300"
                : activeOrder
                  ? activeOrder.status === "pending"
                    ? "bg-orange-500 text-white"
                    : activeOrder.status === "preparing"
                      ? "bg-yellow-500 text-white"
                      : activeOrder.status === "ready"
                        ? "bg-green-500 text-white"
                        : activeOrder.status === "served"
                          ? "bg-blue-500 text-white"
                          : "bg-red-500 text-white"
                  : "bg-red-500 text-white"
            }`}
          >
            {!isOccupied
              ? t("tables.available")
              : activeOrder
                ? activeOrder.status === "pending"
                  ? t("tables.pendingStatus")
                  : activeOrder.status === "preparing"
                    ? t("tables.preparing")
                    : activeOrder.status === "ready"
                      ? t("tables.ready")
                      : activeOrder.status === "served"
                        ? t("tables.served")
                        : t("tables.paid")
                : t("tables.inUse")}
          </Badge>
        </div>

        {/* Order View Button (if table is occupied) */}
        {isOccupied && (
          <div className="px-4 pb-3">
            <Button
              onClick={() => {
                console.log("🔍 View order button clicked:", {
                  pendingOrdersCount: pendingOrders?.length,
                  activeOrder,
                  orderItemsCount: orderItems?.length,
                });
                // If there are multiple pending orders, show list view
                if (pendingOrders && pendingOrders.length > 1) {
                  setViewMode("pending-orders");
                } else if (activeOrder) {
                  // Otherwise show the active order
                  setViewMode("order");
                } else {
                  toast({
                    title: t("tables.noOrderFound"),
                    description: t("tables.tableHasNoOrders"),
                    variant: "destructive",
                  });
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              size="lg"
            >
              <Receipt className="w-5 h-5 mr-2" />
              {pendingOrders && pendingOrders.length > 1
                ? `${t("tables.viewUnpaidOrders")} (${pendingOrders.length})`
                : activeOrder
                  ? `${t("tables.viewOrder")} (${orderItems?.length || 0}${t("tables.items")})`
                  : t("tables.tableHasNoOrders")}
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5" />
            <Input
              type="text"
              placeholder={t("tables.searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-10 bg-white border-0 shadow-sm h-11 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                className={`rounded-full whitespace-nowrap font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-white text-green-600 hover:bg-white/90 shadow-sm"
                    : "text-white hover:bg-white/20"
                }`}
              >
                {t("tables.all")}
              </Button>
              {categories?.map((category: any) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full whitespace-nowrap font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-white text-green-600 hover:bg-white/90 shadow-sm"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2 bg-white/20" />
          </ScrollArea>
        </div>
      </div>

      {/* Temporary Cart Preview */}
      {tempCart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 p-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">
                {t("tables.cart")} ({tempCart.length} {t("tables.items")})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTempCart([])}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t("tables.clearCart")}
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {tempCart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.floor(
                        parseFloat(item.product.price),
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTempCartQuantity(item.productId, -1)}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTempCartQuantity(item.productId, 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromTempCart(item.productId)}
                      className="h-7 w-7 p-0 text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">{t("tables.total")}:</span>
            <span className="text-lg font-bold text-blue-600">
              {Math.floor(tempCartTotal).toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
            onClick={() => {
              confirmOrderMutation.mutate();
            }}
            disabled={confirmOrderMutation.isPending}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {confirmOrderMutation.isPending
              ? t("tables.processing")
              : isOccupied
                ? t("tables.addItemsToOrder")
                : t("tables.createOrder")}
          </Button>
        </div>
      )}

      {/* Product Grid */}
      <div className={`p-4 ${tempCart.length > 0 ? "pb-96" : ""}`}>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t("tables.noProductsFound")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const tempCartItem = tempCart.find(
                (item) => item.productId === product.id,
              );
              const itemQuantity = tempCartItem?.quantity || 0;

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-all"
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
                    <h3 className="font-medium text-sm line-clamp-2 mb-1 min-h-[40px]">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      SKU: {product.sku}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-blue-600 text-base">
                        {Math.floor(parseFloat(product.price)).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        ₫
                      </span>
                      {product.stock <= 5 &&
                        product.trackInventory !== false && (
                          <Badge variant="destructive" className="text-xs">
                            {t("tables.lowStock")} {product.stock}
                          </Badge>
                        )}
                    </div>

                    {/* Quantity controls */}
                    {itemQuantity > 0 ? (
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTempCartQuantity(product.id, -1)}
                          className="h-8 px-2"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium text-base px-3">
                          {itemQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTempCartQuantity(product.id, 1)}
                          className="h-8 px-2"
                          disabled={
                            product.trackInventory !== false &&
                            itemQuantity >= product.stock
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTempCart(product.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToTempCart(product)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                        size="sm"
                        disabled={
                          product.trackInventory !== false && product.stock <= 0
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("tables.addButton")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
