import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  Order,
  OrderItem,
  Customer,
  Employee,
  Table as TableType,
} from "@shared/schema";
import logoPath from "@assets/EDPOS_1753091767028.png";

interface SalesOrdersPageProps {
  onLogout: () => void;
}

export default function SalesOrdersPage({ onLogout }: SalesOrdersPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const search = useSearch();

  // Get date range from URL parameters
  const urlParams = new URLSearchParams(search);
  const urlStartDate = urlParams.get("startDate");
  const urlEndDate = urlParams.get("endDate");

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [salesChannelFilter, setSalesChannelFilter] = useState("all");
  const [dateRange, setDateRange] = useState(
    urlStartDate && urlEndDate ? "custom" : "today",
  );
  const [startDate, setStartDate] = useState<string>(
    urlStartDate || new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    urlEndDate || new Date().toISOString().split("T")[0],
  );

  // State for selected order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("tables");

  // Fetch orders
  const {
    data: orders = [],
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/orders/date-range", startDate, endDate],
    queryFn: async () => {
      try {
        console.log(`Dashboard - Date Range Query:`, {
          startDate: dateRange.start,
          endDate: dateRange.end,
          apiUrl: `https://order-mobile-be.onrender.com/api/orders/date-range/${startDate}/${endDate}`,
        });

        const response = await fetch(
          `https://order-mobile-be.onrender.com/api/orders/date-range/${startDate}/${endDate}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        console.log(`Dashboard - Orders received from API:`, {
          count: data?.length || 0,
          sampleOrder: data?.[0]
            ? {
                id: data[0].id,
                orderNumber: data[0].orderNumber,
                orderedAt: data[0].orderedAt,
                createdAt: data[0].createdAt,
                status: data[0].status,
              }
            : null,
        });

        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
    enabled: Boolean(startDate && endDate),
    staleTime: 30000, // Cache for 30 seconds to reduce re-fetching
  });

  // Fetch order items
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/order-items");
      if (!response.ok) {
        throw new Error("Failed to fetch order items");
      }
      return response.json() as Promise<OrderItem[]>;
    },
  });

  // Fetch tables for table names
  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/tables");
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }
      return response.json() as Promise<TableType[]>;
    },
  });

  // Fetch products for tax rate information
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  // Fetch store settings to check business type
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const response = await fetch("https://order-mobile-be.onrender.com/api/store-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch store settings");
      }
      return response.json();
    },
  });

  // Set active tab based on business type when store settings load
  useEffect(() => {
    if (storeSettings?.businessType === "laundry") {
      setActiveTab("takeaway");
    }
  }, [storeSettings]);

  // Helper functions - defined at the top to avoid hoisting issues
  const getPaymentMethodName = (method: string) => {
    const names = {
      cash: t("common.cash"),
      creditCard: t("common.creditCard"),
      debitCard: t("common.debitCard"),
      momo: t("common.momo"),
      zalopay: t("common.zalopay"),
      vnpay: t("common.vnpay"),
      qrCode: t("common.qrCode"),
      shopeepay: t("common.shopeepay"),
      grabpay: t("common.grabpay"),
    };
    return names[method as keyof typeof names] || method;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "preparing":
      case "served":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return t("orders.status.completed");
      case "pending":
        return t("orders.status.pending");
      case "preparing":
        return t("orders.status.preparing");
      case "served":
        return t("common.serving");
      case "cancelled":
        return t("orders.status.cancelled");
      default:
        return status;
    }
  };

  const getOrderItems = (orderId: number) => {
    return orderItems.filter((item) => item.orderId === orderId);
  };

  const getTableName = (tableId: number | null) => {
    if (!tableId) return t("reports.takeaway");
    const table = tables.find((t) => t.id === tableId);
    return table ? table.tableNumber : `${t("orders.table")} ${tableId}`;
  };

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerName &&
            order.customerName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sales channel filter
    if (salesChannelFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.salesChannel === salesChannelFilter,
      );
    }

    let dateCompare =
      storeSettings?.storeCode?.startsWith("CH-") && statusFilter !== "pending"
        ? "updatedAt"
        : "orderedAt";
    // Apply date range filter
    if (dateRange === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order[dateCompare])
          .toISOString()
          .split("T")[0];

        const orderDateUpdated = new Date(order.updatedAt)
          .toISOString()
          .split("T")[0];

        const orderDateCreated = new Date(order.orderedAt)
          .toISOString()
          .split("T")[0];

        if (statusFilter == "all") {
          return (
            (orderDateUpdated === today &&
              order.status.include(["paid", "completed", "cancelled"])) ||
            (orderDateCreated === today && order.status == "pending")
          );
        }
        return orderDate === today;
      });
    } else if (dateRange === "custom" && startDate && endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order[dateCompare])
          .toISOString()
          .split("T")[0];

        const orderDateUpdated = new Date(order.updatedAt)
          .toISOString()
          .split("T")[0];

        const orderDateCreated = new Date(order.orderedAt)
          .toISOString()
          .split("T")[0];

        if (statusFilter == "all") {
          return (
            (orderDateUpdated >= startDate &&
              orderDateUpdated <= endDate &&
              order.status.include(["paid", "completed", "cancelled"])) ||
            (orderDateCreated >= startDate &&
              orderDateCreated <= endDate &&
              order.status == "pending")
          );
        }

        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Sort by most recent first
    return filtered.sort(
      (a, b) =>
        new Date(b[dateCompare]).getTime() - new Date(a[dateCompare]).getTime(),
    );
  }, [
    orders,
    searchTerm,
    statusFilter,
    salesChannelFilter,
    dateRange,
    startDate,
    endDate,
    storeSettings,
  ]);

  // Handle order selection
  const handleOrderSelect = async (order: Order) => {
    console.log("📋 Order Details:", {
      orderNumber: order.orderNumber,
      priceIncludeTax: order.priceIncludeTax,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      discount: order.discount,
    });
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  // Handle order status update
  const updateOrderStatus = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setShowOrderDialog(false);
    },
  });

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-green-50 grocery-bg">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">{t("common.loading")}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Mobile Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-green-700"
            onClick={() => setLocation("/reports")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t("orders.orderList")}</h1>
        </div>
        <div className="flex items-center">
          <img
            src={logoPath}
            alt="EDPOS Logo"
            className="h-8 md:h-12 object-contain"
            onError={(e) => {
              console.error("Failed to load logo image");
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs for Tables and Takeaway */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full ${storeSettings?.businessType === "laundry" ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {storeSettings?.businessType !== "laundry" && (
              <TabsTrigger value="tables">{t("reports.dineIn")}</TabsTrigger>
            )}
            <TabsTrigger value="takeaway">
              {storeSettings?.businessType === "laundry"
                ? t("reports.details")
                : t("reports.takeaway")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="space-y-4">
            {/* Status Filter */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-2 block">
                  {t("orders.orderStatus")}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("orders.orderStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="pending">
                      {t("orders.status.pending")}
                    </SelectItem>
                    <SelectItem value="paid">
                      {t("orders.status.paid")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("orders.status.completed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("orders.status.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Table Orders List */}
            <div className="space-y-3">
              {filteredOrders
                .filter(
                  (order) => order.salesChannel === "table" || order.tableId,
                )
                .map((order) => {
                  const items = getOrderItems(order.id);
                  const itemCount = items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  );

                  return (
                    <Card
                      key={order.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOrderSelect(order)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs text-gray-500">
                                {t("orders.orderCode")}
                              </span>
                              <p className="font-semibold text-sm text-gray-900">
                                {order.orderNumber}
                              </p>
                            </div>
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                              className="text-xs"
                            >
                              {getStatusText(order.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500 block mb-1">
                                {t("orders.table")}
                              </span>
                              <p className="font-medium">
                                {getTableName(order.tableId)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">
                                {t("orders.customer")}
                              </span>
                              <p className="font-medium">
                                {order.customerCount || 1}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500 block">
                                {t("orders.totalAmount")}
                              </span>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(
                                  Math.round(Number(order.total)),
                                )}{" "}
                                ₫
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {filteredOrders.filter(
                (order) => order.salesChannel === "table" || order.tableId,
              ).length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("orders.noActiveOrders")}</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {t("orders.orderCount")}:{" "}
                    {
                      filteredOrders.filter(
                        (order) =>
                          order.salesChannel === "table" || order.tableId,
                      ).length
                    }
                  </span>
                  <span className="text-sm font-semibold">
                    {t("orders.totalAmount")}:{" "}
                    {formatCurrency(
                      filteredOrders
                        .filter(
                          (order) =>
                            order.salesChannel === "table" || order.tableId,
                        )
                        .reduce((sum, order) => sum + Number(order.total), 0),
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="takeaway" className="space-y-4">
            {/* Status Filter */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-medium mb-2 block">
                  {t("orders.orderStatus")}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("orders.orderStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="pending">
                      {t("orders.status.pending")}
                    </SelectItem>
                    <SelectItem value="paid">
                      {t("orders.status.paid")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("orders.status.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Takeaway Orders List */}
            <div className="space-y-3">
              {filteredOrders
                .filter(
                  (order) => order.salesChannel === "pos" || !order.tableId,
                )
                .map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOrderSelect(order)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-gray-500">
                              {t("orders.orderCode")}
                            </span>
                            <p className="font-semibold text-sm text-gray-900">
                              {order.orderNumber}
                            </p>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(order.status)}
                            className="text-xs"
                          >
                            {getStatusText(order.status)}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          {storeSettings?.businessType !== "laundry" && (
                            <div>
                              <span className="text-xs text-gray-500">
                                {t("reports.takeaway")}
                              </span>
                            </div>
                          )}
                          <div
                            className={`text-right ${storeSettings?.businessType === "laundry" ? "w-full" : ""}`}
                          >
                            <span className="text-xs text-gray-500 block">
                              {t("orders.totalAmount")}
                            </span>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(Math.round(Number(order.total)))}{" "}
                              ₫
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {filteredOrders.filter(
                (order) => order.salesChannel === "pos" || !order.tableId,
              ).length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t("orders.noActiveOrders")}</p>
                </div>
              )}
            </div>

            {/* Summary */}
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {t("orders.orderCount")}:{" "}
                    {
                      filteredOrders.filter(
                        (order) =>
                          order.salesChannel === "pos" || !order.tableId,
                      ).length
                    }
                  </span>
                  <span className="text-sm font-semibold">
                    {t("orders.totalAmount")}:{" "}
                    {formatCurrency(
                      filteredOrders
                        .filter(
                          (order) =>
                            order.salesChannel === "pos" || !order.tableId,
                        )
                        .reduce((sum, order) => sum + Number(order.total), 0),
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("orders.orderDetails")}</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">{t("orders.table")}</Label>
                  <p className="font-medium">
                    {getTableName(selectedOrder.tableId)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">
                    {t("orders.orderStatus")}
                  </Label>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                    {getStatusText(selectedOrder.status)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-gray-500">
                  {t("orders.orderItems")}
                </Label>
                <div className="mt-2 space-y-2">
                  {getOrderItems(selectedOrder.id).map((item) => {
                    // Simple calculation: unitPrice * quantity
                    const unitPrice = Number(item.unitPrice || 0);
                    const quantity = Number(item.quantity || 0);
                    const displayTotal = unitPrice * quantity;

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <span>{formatCurrency(Math.round(displayTotal))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("orders.subtotal")}:</span>
                  <span>
                    {formatCurrency(
                      Math.round(
                        Number(selectedOrder.subtotal || 0) +
                          Number(selectedOrder.tax || 0) +
                          Number(selectedOrder.discount || 0),
                      ),
                    )}
                  </span>
                </div>

                {selectedOrder.tax && Number(selectedOrder.tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("orders.tax")}:</span>
                    <span>
                      {formatCurrency(Math.round(Number(selectedOrder.tax)))}
                    </span>
                  </div>
                )}

                {selectedOrder.discount &&
                  Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("orders.discount")}:
                      </span>
                      <span className="text-red-600">
                        -
                        {formatCurrency(
                          Math.round(Number(selectedOrder.discount)),
                        )}
                      </span>
                    </div>
                  )}

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>{t("orders.totalAmount")}:</span>
                  <span>
                    {formatCurrency(Math.round(Number(selectedOrder.total)))}
                  </span>
                </div>
              </div>

              {selectedOrder.status === "preparing" && (
                <Button
                  className="w-full"
                  onClick={() =>
                    updateOrderStatus.mutate({
                      orderId: selectedOrder.id,
                      status: "served",
                    })
                  }
                  disabled={updateOrderStatus.isPending}
                >
                  {t("orders.served")}
                </Button>
              )}

              {selectedOrder.status === "served" && (
                <Button
                  className="w-full"
                  onClick={() =>
                    updateOrderStatus.mutate({
                      orderId: selectedOrder.id,
                      status: "paid",
                    })
                  }
                  disabled={updateOrderStatus.isPending}
                >
                  {t("orders.payment")}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
