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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialogPortal } from "@radix-ui/react-alert-dialog";

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
    {
      productId: number;
      quantity: number;
      product: Product;
      discount?: number;
      discountType?: "percent" | "amount" | "vnd";
    }[]
  >([]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState<
    "percent" | "amount" | "vnd"
  >("vnd");
  const [isCartExpanded, setIsCartExpanded] = useState(true);
  const [discountSource, setDiscountSource] = useState<"item" | "order" | null>(
    null,
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteItemNote, setDeleteItemNote] = useState("");
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [itemToDeleteWithNote, setItemToDeleteWithNote] = useState<any>(null);
  const [deleteNote, setDeleteNote] = useState("");
  const [showDecreaseNoteDialog, setShowDecreaseNoteDialog] = useState(false);
  const [itemToDecreaseWithNote, setItemToDecreaseWithNote] = useState<any>(null);
  const [decreaseNote, setDecreaseNote] = useState("");
  const [decreaseQuantity, setDecreaseQuantity] = useState(1);

  // Debug dialog state
  useEffect(() => {
    console.log("🔍 Delete dialog state changed:", {
      showDeleteConfirmDialog,
      hasItem: !!itemToDeleteWithNote,
      itemName: itemToDeleteWithNote?.productName,
      deleteNote
    });

    if (showDeleteConfirmDialog) {
      console.log("✅ Dialog should be visible now!");
    }
  }, [showDeleteConfirmDialog, itemToDeleteWithNote, deleteNote]);

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
        orderDiscount,
        orderDiscountType,
      });

      const sumOfDiscount = tempCart.reduce((sum, item) => {
        return sum + (item.discount || 0);
      }, 0);

      if (!activeOrder) {
        // Calculate order discount in VND
        let orderDiscountVnd = 0;
        if (orderDiscountType === "percent") {
          orderDiscountVnd = Math.round(
            (tempCartSubtotalBeforeDiscount * orderDiscount) / 100,
          );
        } else {
          orderDiscountVnd = orderDiscount > 0 ? orderDiscount : sumOfDiscount;
        }

        // Create new order with all items
        const orderData = {
          orderNumber: `ORD-${Date.now()}`,
          tableId,
          customerCount: 1,
          status: "pending",
          paymentStatus: "pending",
          salesChannel: "table",
          subtotal: tempCartSubtotal.toFixed(2),
          tax: tempCartTax.toFixed(2),
          discount: orderDiscountVnd.toFixed(2),
          total: tempCartTotal.toFixed(2),
        };

        const items = tempCart.map((item) => {
          // Calculate item discount in VND
          let itemDiscountVnd = 0;
          if (item.discount && item.discount > 0) {
            if (item.discountType === "percent") {
              const itemSubtotal =
                parseFloat(item.product.price) * item.quantity;
              itemDiscountVnd = Math.round(
                (itemSubtotal * item.discount) / 100,
              );
            } else {
              itemDiscountVnd = item.discount;
            }
          }

          const itemSubtotal = parseFloat(item.product.price) * item.quantity;
          const itemTotal = Math.max(0, itemSubtotal - itemDiscountVnd);

          return {
            productId: item.productId,
            quantity: item.quantity.toString(),
            unitPrice: item.product.price,
            discount: itemDiscountVnd.toFixed(2),
            total: itemTotal.toFixed(2),
            tax: (itemSubtotal * (item.product.taxRate || 0)).toFixed(2),
          };
        });

        console.log("📝 Creating new order", { orderData, items });
        return apiRequest("POST", "https://order-mobile-be.onrender.com/api/orders", { order: orderData, items });
      } else {
        console.log("➕ Adding items to existing order", activeOrder.id);

        // Use the new endpoint to add items to existing order
        const items = tempCart.map((item) => {
          // Calculate item discount in VND
          let itemDiscountVnd = 0;
          if (item.discount && item.discount > 0) {
            if (item.discountType === "percent") {
              const itemSubtotal =
                parseFloat(item.product.price) * item.quantity;
              itemDiscountVnd = Math.round(
                (itemSubtotal * item.discount) / 100,
              );
            } else {
              itemDiscountVnd = item.discount;
            }
          }

          const itemSubtotal = parseFloat(item.product.price) * item.quantity;
          const itemTotal = Math.max(0, itemSubtotal - itemDiscountVnd);

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
            discount: itemDiscountVnd.toFixed(2),
            total: itemTotal.toFixed(2),
            tax: (itemSubtotal * (item.product.taxRate || 0)).toFixed(2),
          };
        });

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

        // Calculate total discount from new items
        const totalNewItemsDiscount = items.reduce((sum, item) => {
          return sum + parseFloat(item.discount);
        }, 0);

        // Get current order discount
        const currentOrderDiscount = parseFloat(activeOrder.discount || "0");

        console.log("💰 Discount check:", {
          currentOrderDiscount,
          totalNewItemsDiscount,
          shouldRecalculate: Math.abs(currentOrderDiscount - totalNewItemsDiscount) > 0.01
        });

        // Only recalculate if order discount differs from sum of item discounts
        // This prevents redistributing discounts that are already correctly set
        if (Math.abs(currentOrderDiscount - totalNewItemsDiscount) > 0.01) {
          await apiRequest(
            "POST",
            `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
            {},
          );
          console.log("✅ Order totals recalculated");
        } else {
          console.log("⏭️ Skipping recalculation - discount already matches item discounts");
          // Still need to update order totals without redistributing discounts
          await apiRequest(
            "POST",
            `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
            {},
          );
          console.log("✅ Order totals updated");
        }

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
      setOrderDiscount(0);
      setOrderDiscountType("vnd");
      setDiscountSource(null);
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

  // Calculate subtotal (before tax and discount)
  const { data: storeSettings } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
  });
  const priceIncludesTax = storeSettings?.priceIncludesTax ?? true;

  // Calculate subtotal (before tax and discount)
  const tempCartSubtotalBeforeDiscount = tempCart.reduce((sum, item) => {
    const basePrice = parseFloat(item.product.price);
    const quantity = item.quantity;
    const taxRate = item.product.taxRate
      ? parseFloat(item.product.taxRate) / 100
      : 0;

    if (priceIncludesTax && taxRate > 0) {
      const itemSubtotal = Math.round((basePrice / (1 + taxRate)) * quantity);
      return sum + itemSubtotal;
    } else {
      const itemSubtotal = basePrice * quantity;
      return sum + itemSubtotal;
    }
  }, 0);

  // Calculate total discounts - use EITHER item discounts OR order discount, not both
  let totalDiscount = 0;

  // Calculate sum of all item discounts
  const tempCartItemDiscounts = tempCart.reduce((sum, item) => {
    const basePrice = parseFloat(item.product.price);
    const quantity = item.quantity;
    const itemDiscount = item.discount || 0;

    if (item.discountType === "percent") {
      return sum + Math.round((basePrice * quantity * itemDiscount) / 100);
    } else {
      return sum + itemDiscount;
    }
  }, 0);

  // Calculate order-level discount
  let tempCartOrderDiscount = 0;
  if (orderDiscountType === "percent") {
    tempCartOrderDiscount = Math.round(
      (tempCartSubtotalBeforeDiscount * orderDiscount) / 100,
    );
  } else {
    tempCartOrderDiscount = orderDiscount;
  }

  // Determine which discount to use based on source
  if (discountSource === "order" && orderDiscount > 0) {
    // User manually entered order discount - use it
    totalDiscount = tempCartOrderDiscount;
  } else if (discountSource === "item" || tempCartItemDiscounts > 0) {
    // User manually entered item discounts - use sum of item discounts
    totalDiscount = tempCartItemDiscounts;
  } else if (orderDiscount > 0) {
    // Fallback to order discount
    totalDiscount = tempCartOrderDiscount;
  }

  // Calculate subtotal after discounts
  const tempCartSubtotal = Math.max(
    0,
    tempCartSubtotalBeforeDiscount - totalDiscount,
  );

  // Calculate tax after discounts
  const tempCartTax = tempCart.reduce((sum, item) => {
    const basePrice = parseFloat(item.product.price);
    const quantity = item.quantity;
    const taxRate = item.product.taxRate
      ? parseFloat(item.product.taxRate) / 100
      : 0;
    const itemDiscount = item.discount || 0;

    if (taxRate > 0) {
      let itemTotal = basePrice * quantity;

      // Apply item discount
      if (item.discountType === "percent") {
        itemTotal -= Math.round((itemTotal * itemDiscount) / 100);
      } else {
        itemTotal -= itemDiscount;
      }

      if (priceIncludesTax) {
        const giaGomThue = itemTotal;
        const tamTinh = Math.round(giaGomThue / (1 + taxRate));
        const itemTax = giaGomThue - tamTinh;
        return sum + itemTax;
      } else {
        const itemTax = Math.round(itemTotal * taxRate);
        return sum + itemTax;
      }
    }
    return sum;
  }, 0);

  const tempCartTotal = Math.round(tempCartSubtotal + tempCartTax);

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
              {activeOrder.discount && parseFloat(activeOrder.discount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t("common.discount")}:</span>
                  <span className="font-medium text-red-600">
                    -
                    {Math.floor(
                      parseFloat(activeOrder.discount),
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>
              )}
              {activeOrder.tax && parseFloat(activeOrder.tax) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t("common.tax")}:</span>
                  <span className="font-medium">
                    {Math.floor(parseFloat(activeOrder.tax)).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    ₫
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t("tables.total")}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {(() => {
                    return Math.floor(
                      parseFloat(activeOrder.total),
                    ).toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Show dialog to input note for decrease
                              console.log("➖ Decrease button clicked for item:", item);
                              setItemToDecreaseWithNote(item);
                              setShowDecreaseNoteDialog(true);
                              setDecreaseNote("");
                              setDecreaseQuantity(1);
                            }}
                            className="h-8 px-3"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="font-medium text-base px-3 min-w-[50px] text-center pointer-events-none select-none">
                            {parseFloat(item.quantity)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("➕ Increase button clicked for item:", item);

                              const newQuantity = parseFloat(item.quantity) + 1;
                              const unitPrice = parseFloat(item.unitPrice);
                              const newTotal = (
                                unitPrice * newQuantity
                              ).toFixed(2);

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
                                  {},
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
                            className="h-8 px-3"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Delete button on separate row for better accessibility */}
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("🗑️ Delete button onClick triggered for item:", item);
                            console.log("🗑️ Setting itemToDeleteWithNote:", item);
                            console.log("🗑️ Setting showDeleteConfirmDialog to true");
                            setItemToDeleteWithNote(item);
                            setDeleteNote("");
                            setShowDeleteConfirmDialog(true);
                            console.log("🗑️ Dialog state should now be open");
                          }}
                          className="inline-flex items-center justify-center gap-2 h-8 px-3 text-sm font-medium rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors touch-manipulation active:bg-red-100"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa món
                        </button>
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
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 transition-all duration-300 ${isCartExpanded ? "p-4" : "p-0"}`}
        >
          {!isCartExpanded ? (
            /* Collapsed state - Icon only */
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setIsCartExpanded(true)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {tempCart.length}
                  </span>
                </div>
                <span className="font-semibold text-sm">
                  {t("tables.cart")} ({tempCart.length} {t("tables.items")})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">
                  {Math.floor(tempCartTotal).toLocaleString("vi-VN")} ₫
                </span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Expanded state - Full cart */
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">
                    {t("tables.cart")} ({tempCart.length} {t("tables.items")})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCartExpanded(false)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCancelDialog(true);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t("tables.clearCart")}
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {tempCart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-gray-50 p-2 rounded space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.floor(
                              parseFloat(item.product.price),
                            ).toLocaleString("vi-VN")}{" "}
                            ₫ x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateTempCartQuantity(item.productId, -1)
                            }
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
                            onClick={() =>
                              updateTempCartQuantity(item.productId, 1)
                            }
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

                      {/* Item Discount */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600">
                          {t("common.itemDiscount")}:
                        </span>
                        <Input
                          type="text"
                          value={
                            item.discount && item.discount > 0
                              ? Math.floor(item.discount).toLocaleString(
                                  "vi-VN",
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const value = Math.max(
                              0,
                              parseFloat(
                                e.target.value.replace(/[^\d]/g, ""),
                              ) || 0,
                            );
                            const basePrice = parseFloat(item.product.price);
                            const quantity = item.quantity;
                            const itemTotal = basePrice * quantity;

                            let finalValue = value;

                            // Validate discount doesn't exceed item total
                            if (item.discountType === "percent") {
                              // Limit percentage to 100%
                              finalValue = Math.min(100, value);
                            } else {
                              // Limit VND discount to item total
                              if (value > itemTotal) {
                                finalValue = 0;
                                toast({
                                  title: "Lỗi giảm giá",
                                  description:
                                    "Giảm giá không được vượt quá giá sản phẩm",
                                  variant: "destructive",
                                });
                              }
                            }

                            // Update only this item's discount
                            const updatedCart = tempCart.map((cartItem) =>
                              cartItem.productId === item.productId
                                ? {
                                    ...cartItem,
                                    discount: finalValue,
                                    discountType: item.discountType || "vnd",
                                  }
                                : cartItem,
                            );
                            setTempCart(updatedCart);

                            // Mark discount source as item-level only if there's a value
                            if (finalValue > 0) {
                              setDiscountSource("item");
                            } else if (
                              updatedCart.every(
                                (c) => !c.discount || c.discount === 0,
                              )
                            ) {
                              // Only clear source if all items have no discount
                              setDiscountSource(null);
                            }
                          }}
                          placeholder="0"
                          className="flex-1 h-8 text-right"
                        />
                        <div className="flex gap-1">
                          <Button
                            variant={
                              item.discountType === "vnd"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              const updatedCart = tempCart.map((cartItem) =>
                                cartItem.productId === item.productId
                                  ? {
                                      ...cartItem,
                                      discountType: "vnd" as
                                        | "percent"
                                        | "amount"
                                        | "vnd",
                                      discount: 0,
                                    }
                                  : cartItem,
                              );
                              setTempCart(updatedCart);
                            }}
                            className="h-8 w-10 p-0 text-xs"
                          >
                            ₫
                          </Button>
                          <Button
                            variant={
                              item.discountType === "percent"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => {
                              const updatedCart = tempCart.map((cartItem) =>
                                cartItem.productId === item.productId
                                  ? {
                                      ...cartItem,
                                      discountType: "percent" as
                                        | "percent"
                                        | "amount"
                                        | "vnd",
                                      discount: 0,
                                    }
                                  : cartItem,
                              );
                              setTempCart(updatedCart);
                            }}
                            className="h-8 w-10 p-0 text-xs"
                          >
                            %
                          </Button>
                        </div>
                      </div>

                      {/* Display allocated order discount only if discount source is order-level and item has no manual discount */}
                      {discountSource === "order" &&
                        orderDiscount > 0 &&
                        orderDiscountType === "vnd" &&
                        (!item.discount || item.discount === 0) && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center justify-between">
                            <span>{t("common.allocatedOrderDiscount")}:</span>
                            <span className="font-medium">
                              -
                              {(() => {
                                const basePrice = parseFloat(
                                  item.product.price,
                                );
                                const quantity = item.quantity;
                                const itemTotal = basePrice * quantity;

                                // Calculate allocated order discount for this item
                                let allocatedDiscount = 0;
                                const totalBeforeDiscount = tempCart.reduce(
                                  (sum, i) => {
                                    return (
                                      sum +
                                      parseFloat(i.product.price) * i.quantity
                                    );
                                  },
                                  0,
                                );

                                if (totalBeforeDiscount > 0) {
                                  allocatedDiscount = Math.round(
                                    (orderDiscount * itemTotal) /
                                      totalBeforeDiscount,
                                  );
                                }

                                return Math.floor(
                                  allocatedDiscount,
                                ).toLocaleString("vi-VN");
                              })()}{" "}
                              ₫
                            </span>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Discount */}
              <div className="mb-3 pb-3 border-b">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    {t("common.orderDiscount")}:
                  </span>
                  <Input
                    type="text"
                    value={
                      orderDiscount > 0
                        ? Math.floor(orderDiscount).toLocaleString("vi-VN")
                        : ""
                    }
                    onChange={(e) => {
                      const value = Math.max(
                        0,
                        parseFloat(e.target.value.replace(/[^\d]/g, "")) || 0,
                      );
                      setOrderDiscount(value);

                      // Mark discount source as order-level
                      if (value > 0) {
                        setDiscountSource("order");

                        // Redistribute order discount to items proportionally if in VND
                        if (orderDiscountType === "vnd") {
                          const totalBeforeDiscount = tempCart.reduce(
                            (sum, item) => {
                              return (
                                sum +
                                parseFloat(item.product.price) * item.quantity
                              );
                            },
                            0,
                          );

                          let allocatedDiscountSum = 0;
                          const updatedCart = tempCart.map((item, index) => {
                            const isLastItem = index === tempCart.length - 1;
                            const itemTotal =
                              parseFloat(item.product.price) * item.quantity;

                            let itemDiscount = 0;
                            if (isLastItem) {
                              // Last item gets remaining discount
                              itemDiscount = Math.max(
                                0,
                                value - allocatedDiscountSum,
                              );
                            } else {
                              // Proportional allocation
                              itemDiscount =
                                totalBeforeDiscount > 0
                                  ? Math.round(
                                      (value * itemTotal) / totalBeforeDiscount,
                                    )
                                  : 0;
                              allocatedDiscountSum += itemDiscount;
                            }

                            return {
                              ...item,
                              discount: itemDiscount,
                              discountType: "vnd" as
                                | "percent"
                                | "amount"
                                | "vnd",
                            };
                          });

                          setTempCart(updatedCart);
                        }
                      } else {
                        // Clear discount source and all item discounts when order discount is cleared
                        setDiscountSource(null);
                        setTempCart(
                          tempCart.map((item) => ({
                            ...item,
                            discount: 0,
                            discountType: "vnd",
                          })),
                        );
                      }
                    }}
                    placeholder="0"
                    className="flex-1 h-9 text-right"
                  />
                  <Select
                    value={orderDiscountType}
                    onValueChange={(value: "percent" | "amount" | "vnd") => {
                      setOrderDiscountType(value);
                      // If switching to percent, recalculate item discounts based on percentage
                      if (value === "percent") {
                        const updatedCart = tempCart.map((item) => {
                          const basePrice = parseFloat(item.product.price);
                          const quantity = item.quantity;
                          const currentItemDiscountVnd = item.discount || 0; // Assuming item.discount is VND

                          // Calculate the percentage equivalent of the current VND discount
                          const itemTotal = basePrice * quantity;
                          const discountPercentage =
                            itemTotal > 0
                              ? (currentItemDiscountVnd / itemTotal) * 100
                              : 0;

                          return {
                            ...item,
                            discount: discountPercentage,
                            discountType: "percent",
                          };
                        });
                        setTempCart(updatedCart);
                        // Also reset order discount to 0 or recalculate based on new type if needed
                        setOrderDiscount(0); // Reset order discount when changing type to percent
                      } else if (value === "vnd") {
                        // If switching to VND, ensure item discounts are treated as VND
                        const updatedCart = tempCart.map((item) => {
                          // If discount was percent, convert it to VND based on current price
                          if (
                            item.discountType === "percent" &&
                            item.discount !== undefined
                          ) {
                            const basePrice = parseFloat(item.product.price);
                            const quantity = item.quantity;
                            const discountVnd = Math.round(
                              (basePrice * quantity * item.discount) / 100,
                            );
                            return {
                              ...item,
                              discount: discountVnd,
                              discountType: "vnd",
                            };
                          }
                          return { ...item, discountType: "vnd" };
                        });
                        setTempCart(updatedCart);
                        // Recalculate order discount based on the sum of VND item discounts
                        const totalItemDiscountVnd = updatedCart.reduce(
                          (sum, cartItem) => sum + (cartItem.discount || 0),
                          0,
                        );
                        setOrderDiscount(totalItemDiscountVnd);
                      }
                    }}
                  >
                    <SelectTrigger className="w-16 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vnd">₫</SelectItem>
                      <SelectItem value="percent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between">
                  <span>{t("common.subtotal")}:</span>
                  <span>
                    {Math.floor(tempCartSubtotalBeforeDiscount).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    ₫
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>{t("common.discount")}:</span>
                    <span>
                      -{Math.floor(totalDiscount).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("common.tax")}:</span>
                  <span>
                    {Math.floor(tempCartTax).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>{t("tables.total")}:</span>
                  <span className="text-blue-600">
                    {Math.floor(tempCartTotal).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
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
            </>
          )}
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
                      <div>
                        <span className="font-bold text-blue-600 text-base">
                          {Math.floor(parseFloat(product.price)).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          ₫
                        </span>
                        {tempCartItem &&
                          tempCartItem.discount &&
                          tempCartItem.discount > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {t("common.itemDiscount")}: -
                              {tempCartItem.discountType === "percent"
                                ? `${tempCartItem.discount.toFixed(2)}%`
                                : `${Math.floor(tempCartItem.discount).toLocaleString("vi-VN")} ₫`}
                            </div>
                          )}
                      </div>
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateTempCartQuantity(product.id, -1);
                          }}
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateTempCartQuantity(product.id, 1);
                          }}
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFromTempCart(product.id);
                          }}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToTempCart(product);
                        }}
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

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng nhập lý do hủy đơn hàng
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Nhập lý do hủy đơn..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelReason("");
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!cancelReason.trim()) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng nhập lý do hủy đơn",
                    variant: "destructive",
                  });
                  return;
                }

                // Clear cart and reset
                setTempCart([]);
                setOrderDiscount(0);
                setOrderDiscountType("vnd");
                setDiscountSource(null);
                setShowCancelDialog(false);
                setCancelReason("");

                toast({
                  title: "Đã hủy",
                  description: `Lý do: ${cancelReason}`,
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Dialog */}
      <AlertDialog
        open={showDeleteItemDialog}
        onOpenChange={setShowDeleteItemDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa món</AlertDialogTitle>
            <AlertDialogDescription>
              Món này đã được gửi vào bếp. Vui lòng nhập ghi chú để xác nhận
              xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="mb-3">
              <p className="text-sm font-medium">
                Món: {itemToDelete?.productName}
              </p>
              <p className="text-sm text-gray-500">
                Số lượng: {itemToDelete?.quantity}
              </p>
            </div>
            <Textarea
              placeholder="Nhập lý do xóa món (bắt buộc)..."
              value={deleteItemNote}
              onChange={(e) => setDeleteItemNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteItemNote("");
                setItemToDelete(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteItemNote.trim()) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng nhập ghi chú xóa món",
                    variant: "destructive",
                  });
                  return;
                }

                if (!itemToDelete) return;

                try {
                  await apiRequest(
                    "DELETE",
                    `https://order-mobile-be.onrender.com/api/order-items/${itemToDelete.id}`,
                  );
                  await refetchOrderItems();

                  // Recalculate order totals if there's an active order
                  if (activeOrder) {
                    await apiRequest(
                      "POST",
                      `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                      {},
                    );
                  }

                  // Invalidate orders cache
                  await queryClient.invalidateQueries({
                    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                  });

                  setShowDeleteItemDialog(false);
                  setDeleteItemNote("");
                  setItemToDelete(null);

                  toast({
                    title: "Đã xóa",
                    description: `Đã xóa "${itemToDelete.productName}" - Ghi chú: ${deleteItemNote}`,
                  });
                } catch (error) {
                  toast({
                    title: "Lỗi",
                    description: "Không thể xóa món",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog with Notes */}
      <AlertDialog
        open={showDeleteConfirmDialog}
        onOpenChange={(open) => {
          console.log("🔧 AlertDialog onOpenChange called with:", open);
          setShowDeleteConfirmDialog(open);
          if (!open) {
            setDeleteNote("");
            setItemToDeleteWithNote(null);
          }
        }}
      >
        <AlertDialogPortal>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa món</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng nhập ghi chú để xác nhận xóa món khỏi đơn hàng
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="mb-3">
                <p className="text-sm font-medium">
                  Món: {itemToDeleteWithNote?.productName}
                </p>
                <p className="text-sm text-gray-500">
                  Số lượng: {itemToDeleteWithNote?.quantity}
                </p>
                {itemToDeleteWithNote?.status && (
                  <p className="text-sm text-orange-600 mt-1">
                    Trạng thái:{" "}
                    {itemToDeleteWithNote.status === "pending"
                      ? "Chờ chế biến"
                      : itemToDeleteWithNote.status === "progress"
                        ? "Đang chế biến"
                        : itemToDeleteWithNote.status === "completed"
                          ? "Hoàn thành"
                          : itemToDeleteWithNote.status}
                  </p>
                )}
              </div>
              <Textarea
                placeholder="Nhập ghi chú (không bắt buộc)..."
                value={deleteNote}
                onChange={(e) => setDeleteNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteNote("");
                  setItemToDeleteWithNote(null);
                }}
              >
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!itemToDeleteWithNote) return;

                  try {
                    // Update item with notes before deleting if there's a note
                    if (deleteNote.trim()) {
                      console.log(`📝 Updating order item ${itemToDeleteWithNote.id} with note:`, deleteNote.trim());
                      await apiRequest(
                        "PATCH",
                        `https://order-mobile-be.onrender.com/api/order-items/${itemToDeleteWithNote.id}`,
                        {
                          notes: deleteNote.trim(),
                        },
                      );

                      // Wait a bit to ensure the update is processed
                      await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    // Delete the item
                    console.log(`🗑️ Deleting order item ${itemToDeleteWithNote.id}`);
                    await apiRequest(
                      "DELETE",
                      `https://order-mobile-be.onrender.com/api/order-items/${itemToDeleteWithNote.id}`,
                    );
                    await refetchOrderItems();

                    // Recalculate order totals if there's an active order
                    if (activeOrder) {
                      await apiRequest(
                        "POST",
                        `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                        {},
                      );
                    }

                    // Invalidate orders cache
                    await queryClient.invalidateQueries({
                      queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                    });

                    setShowDeleteConfirmDialog(false);
                    setDeleteNote("");
                    setItemToDeleteWithNote(null);

                    toast({
                      title: "Đã xóa",
                      description: deleteNote.trim()
                        ? `Đã xóa "${itemToDeleteWithNote.productName}" - Ghi chú: ${deleteNote}`
                        : `Đã xóa "${itemToDeleteWithNote.productName}"`,
                    });
                  } catch (error) {
                    console.error("❌ Error deleting item with note:", error);
                    toast({
                      title: "Lỗi",
                      description: "Không thể xóa món",
                      variant: "destructive",
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Xác nhận xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      {/* Decrease Quantity with Note Dialog */}
      <AlertDialog
        open={showDecreaseNoteDialog}
        onOpenChange={setShowDecreaseNoteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Giảm số lượng món</AlertDialogTitle>
            <AlertDialogDescription>
              Nhập ghi chú để tách sản phẩm có ghi chú
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="mb-3">
              <p className="text-sm font-medium">
                Món: {itemToDecreaseWithNote?.productName}
              </p>
              <p className="text-sm text-gray-500">
                Số lượng hiện tại: {itemToDecreaseWithNote?.quantity}
              </p>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Số lượng muốn tách:
              </label>
              <Input
                type="number"
                min="1"
                max={itemToDecreaseWithNote ? parseFloat(itemToDecreaseWithNote.quantity) : 1}
                value={decreaseQuantity}
                onChange={(e) => setDecreaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full"
              />
            </div>
            <Textarea
              placeholder="Nhập ghi chú (bắt buộc)..."
              value={decreaseNote}
              onChange={(e) => setDecreaseNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDecreaseNote("");
                setItemToDecreaseWithNote(null);
                setDecreaseQuantity(1);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!itemToDecreaseWithNote) return;

                if (!decreaseNote.trim()) {
                  toast({
                    title: "Lỗi",
                    description: "Vui lòng nhập ghi chú",
                    variant: "destructive",
                  });
                  return;
                }

                const currentQuantity = parseFloat(itemToDecreaseWithNote.quantity);
                const quantityToDecrease = Math.min(decreaseQuantity, currentQuantity);

                if (quantityToDecrease <= 0 || quantityToDecrease > currentQuantity) {
                  toast({
                    title: "Lỗi",
                    description: "Số lượng không hợp lệ",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  const unitPrice = parseFloat(itemToDecreaseWithNote.unitPrice);
                  const newQuantity = currentQuantity - quantityToDecrease;

                  // Update current item quantity
                  if (newQuantity > 0) {
                    const newTotal = (unitPrice * newQuantity).toFixed(2);
                    await apiRequest(
                      "PUT",
                      `https://order-mobile-be.onrender.com/api/order-items/${itemToDecreaseWithNote.id}`,
                      {
                        quantity: newQuantity,
                        total: newTotal,
                      },
                    );
                  } else {
                    // Delete item if quantity becomes 0
                    await apiRequest(
                      "DELETE",
                      `https://order-mobile-be.onrender.com/api/order-items/${itemToDecreaseWithNote.id}`,
                    );
                  }

                  // Create new item with note
                  const newItemTotal = (unitPrice * quantityToDecrease).toFixed(2);
                  await apiRequest("POST", `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/items`, {
                    items: [
                      {
                        productId: itemToDecreaseWithNote.productId,
                        quantity: quantityToDecrease,
                        unitPrice: itemToDecreaseWithNote.unitPrice,
                        discount: "0.00",
                        total: newItemTotal,
                        notes: decreaseNote.trim(),
                      },
                    ],
                  });

                  await refetchOrderItems();

                  // Recalculate order totals
                  await apiRequest(
                    "POST",
                    `https://order-mobile-be.onrender.com/api/orders/${activeOrder.id}/recalculate`,
                    {},
                  );

                  // Invalidate orders cache
                  await queryClient.invalidateQueries({
                    queryKey: ["https://order-mobile-be.onrender.com/api/orders"],
                  });

                  setShowDecreaseNoteDialog(false);
                  setDecreaseNote("");
                  setItemToDecreaseWithNote(null);
                  setDecreaseQuantity(1);

                  toast({
                    title: "Thành công",
                    description: `Đã tách ${quantityToDecrease} "${itemToDecreaseWithNote.productName}" với ghi chú: ${decreaseNote}`,
                  });
                } catch (error) {
                  toast({
                    title: "Lỗi",
                    description: "Không thể giảm số lượng",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}