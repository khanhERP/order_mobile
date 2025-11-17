import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  CreditCard,
  QrCode,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { PaymentMethodModal } from "@/components/pos/payment-method-modal";
import { EInvoiceModal } from "@/components/pos/einvoice-modal";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import QRCodeLib from "qrcode";
import type { Order, Table, Product, OrderItem } from "@shared/schema";

// Separate component to handle store settings query and avoid conditional hooks
function OrderSummaryDisplay({ selectedOrder }: { selectedOrder: Order }) {
  const { t } = useTranslation();
  const subtotal = Math.floor(Number(selectedOrder.subtotal || 0));
  const tax = Math.floor(Number(selectedOrder.tax || 0));
  const discount = Math.floor(Number(selectedOrder.discount || 0));
  const total = Math.floor(Number(selectedOrder.total || 0));

  return (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{t("reports.subtotal")}:</span>
        <span className="font-medium">
          {subtotal.toLocaleString("vi-VN")} ₫
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{t("reports.tax")}:</span>
        <span className="font-medium">{tax.toLocaleString("vi-VN")} ₫</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("common.discount")}:</span>
          <span className="font-medium text-red-600">
            -{discount.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between">
        <span className="text-lg font-bold text-gray-900">
          {t("reports.totalMoney")}:
        </span>
        <span className="text-lg font-bold text-blue-600">
          {total.toLocaleString("vi-VN")} ₫
        </span>
      </div>
    </>
  );
}

export function OrderManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [pointsPaymentOpen, setPointsPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mixedPaymentOpen, setMixedPaymentOpen] = useState(false);
  const [mixedPaymentData, setMixedPaymentData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);
  const [shouldOpenReceiptPreview, setShouldOpenReceiptPreview] =
    useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(12);
  const { toast } = useToast();
  const [calculatedTotals, setCalculatedTotals] = useState<Map<number, number>>(
    new Map(),
  );

  // Listen for print completion event
  useEffect(() => {
    const handlePrintCompleted = (event: CustomEvent) => {
      console.log(
        "📋 Order Management: Print completed, closing all modals and refreshing",
      );

      // Close all order-related modals
      setSelectedOrder(null);
      setOrderDetailsOpen(false);
      setPaymentMethodsOpen(false);
      setShowPaymentMethodModal(false);
      setShowEInvoiceModal(false);
      setShowReceiptModal(false);
      setShowReceiptPreview(false);
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setSelectedReceipt(null);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
    };

    window.addEventListener(
      "printCompleted",
      handlePrintCompleted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "printCompleted",
        handlePrintCompleted as EventListener,
      );
    };
  }, [queryClient]);

  // Effect to handle opening the receipt preview modal
  useEffect(() => {
    if (previewReceipt && orderForPayment && !showReceiptPreview) {
      console.log("🚀 Receipt preview modal opening automatically with data:", {
        previewReceiptId: previewReceipt.id,
        orderForPaymentId: orderForPayment.id,
        showReceiptPreview,
      });
      setShowReceiptPreview(true);
    }
  }, [previewReceipt, orderForPayment, showReceiptPreview]);

  // Effect to handle receipt modal close events and prevent reopening
  useEffect(() => {
    const handleReceiptModalClosed = (event: CustomEvent) => {
      console.log(
        "🔒 Order Management: Receipt modal closed event received, clearing all states",
        event.detail,
      );

      // Always clear all modal states when receipt modal is closed
      setShowReceiptPreview(false);
      setShowReceiptModal(false);
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setSelectedReceipt(null);
      setOrderDetailsOpen(false);
      setSelectedOrder(null);
      setShowPaymentMethodModal(false);
      setShowEInvoiceModal(false);

      // Clear any global preview data
      if (typeof window !== "undefined") {
        (window as any).previewReceipt = null;
        (window as any).orderForPayment = null;
      }

      console.log("✅ Order Management: All receipt modal states cleared");
    };

    window.addEventListener(
      "receiptModalClosed",
      handleReceiptModalClosed as EventListener,
    );

    return () => {
      window.removeEventListener(
        "receiptModalClosed",
        handleReceiptModalClosed as EventListener,
      );
    };
  }, []);

  // Prevent automatic receipt modal reopening after payment completion
  useEffect(() => {
    if (showReceiptModal && selectedReceipt && !orderForPayment) {
      console.log(
        "🔒 Order Management: Preventing receipt modal from reopening after payment completion",
      );
      setShowReceiptModal(false);
      setSelectedReceipt(null);
    }
  }, [showReceiptModal, selectedReceipt, orderForPayment]);

  // Query orders by date range - filter only table orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders", "table"],
    refetchInterval: 2000, // Faster polling - every 2 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchIntervalInBackground: true, // Continue refetching in background
    staleTime: 0, // Always consider data fresh to force immediate updates
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders?salesChannel=table",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch table orders");
      }
      const data = await response.json();
      console.log(`🔍 DEBUG: Table orders query completed:`, {
        ordersCount: data?.length || 0,
        timestamp: new Date().toISOString(),
        tableOrders:
          data?.filter((o: any) => o.salesChannel === "table").length || 0,
        firstFewOrders: data?.slice(0, 3)?.map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          salesChannel: o.salesChannel,
          tableId: o.tableId,
          storedTotal: o.total,
          calculatedTotal: o.total,
        })),
      });
      // Filter to ensure only table orders are returned
      return Array.isArray(data)
        ? data.filter((order: any) => order.salesChannel === "table")
        : [];
    },
    onError: (error) => {
      console.error(`❌ DEBUG: Table orders query onError:`, error);
    },
  });

  const { data: tables } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"],
  });

  const { data: products } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"],
  });

  const { data: customers } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"],
    enabled: pointsPaymentOpen,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings");
      return response.json();
    },
  });

  const { data: orderItems, isLoading: orderItemsLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items", selectedOrder?.id],
    enabled: !!selectedOrder?.id && orderDetailsOpen,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 20 * 60 * 1000, // Keep in cache for 20 minutes
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      try {
        const response = await apiRequest(
          "GET",
          `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${selectedOrder.id}`,
        );
        if (!response.ok) {
          console.error(
            `API error fetching order items: ${response.status} ${response.statusText}`,
          );
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiRequest("PUT", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      toast({
        title: t("common.success"),
        description: t("orders.orderStatusUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("orders.orderStatusUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const completePaymentMutation = useMutation({
    mutationFn: async ({
      orderId,
      paymentMethod,
    }: {
      orderId: number;
      paymentMethod: string;
    }) => {
      console.log(
        "🎯 completePaymentMutation called - using centralized payment completion",
      );
      console.log(
        "📋 Order Management: Starting payment completion for order:",
        orderId,
      );
      return await completeOrderPayment(orderId, { paymentMethod });
    },
    onSuccess: async (result, variables) => {
      console.log(
        "🎯 Order Management completePaymentMutation.onSuccess called",
      );

      // Close ALL modals immediately and permanently FIRST
      setOrderDetailsOpen(false);
      setPaymentMethodsOpen(false);
      setShowPaymentMethodModal(false);
      setShowEInvoiceModal(false);
      setShowReceiptPreview(false);
      setPreviewReceipt(null);
      setSelectedOrder(null);
      setOrderForPayment(null);
      setShowReceiptModal(false);
      setSelectedReceipt(null);

      // Force immediate refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
      ]);

      // Don't show toast immediately to avoid conflicts with receipt modal
      setTimeout(() => {
        toast({
          title: "Thanh toán thành công",
          description: "Đơn hàng đã được thanh toán thành công",
        });
      }, 1000);

      // Dispatch UI refresh events
      if (typeof window !== "undefined") {
        // Dispatch event to close all receipt modals globally
        window.dispatchEvent(
          new CustomEvent("receiptModalClosed", {
            detail: { clearAllStates: true, preventReopening: true },
          }),
        );

        const events = [
          new CustomEvent("orderStatusUpdated", {
            detail: {
              orderId: variables.orderId,
              status: "paid",
              timestamp: new Date().toISOString(),
            },
          }),
          new CustomEvent("paymentCompleted", {
            detail: {
              orderId: variables.orderId,
              paymentMethod: variables.paymentMethod,
              timestamp: new Date().toISOString(),
            },
          }),
        ];

        events.forEach((event) => {
          window.dispatchEvent(event);
        });
      }

      console.log(
        "✅ Order Management: Payment completed, all modals permanently closed",
      );
    },
    onError: (error) => {
      console.log(
        "❌ Order Management completePaymentMutation.onError called:",
        error,
      );
      toast({
        title: "Lỗi",
        description: "Không thể hoàn tất thanh toán",
        variant: "destructive",
      });

      // Clear states on error too
      setOrderForPayment(null);
      setShowReceiptPreview(false);
      setPreviewReceipt(null);
      setShowPaymentMethodModal(false);
    },
  });

  const pointsPaymentMutation = useMutation({
    mutationFn: async ({
      customerId,
      points,
      orderId,
      paymentMethod,
      remainingAmount,
    }: {
      customerId: number;
      points: number;
      orderId: number;
      paymentMethod?: string;
      remainingAmount?: number;
    }) => {
      // First redeem points
      await apiRequest("POST", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers/redeem-points", {
        customerId,
        points,
      });

      // Then mark order as paid
      await apiRequest("PUT", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`, {
        status: "paid",
        paymentMethod: paymentMethod || "points",
        customerId,
        remainingAmount: remainingAmount || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"] });
      setOrderDetailsOpen(false);
      setPointsPaymentOpen(false);
      setSelectedCustomer(null);
      setPointsAmount("");
      setSearchTerm("");
      toast({
        title: t("common.success"),
        description: t("orders.pointsPaymentTitle"),
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể hoàn tất thanh toán bằng điểm",
        variant: "destructive",
      });
    },
  });

  const mixedPaymentMutation = useMutation({
    mutationFn: async ({
      customerId,
      points,
      orderId,
      paymentMethod,
    }: {
      customerId: number;
      points: number;
      orderId: number;
      paymentMethod: string;
    }) => {
      // First redeem all available points
      await apiRequest("POST", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers/redeem-points", {
        customerId,
        points,
      });

      // Then mark order as paid with mixed payment
      await apiRequest("PUT", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`, {
        status: "paid",
        paymentMethod: `points + ${paymentMethod}`,
        customerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"] });
      setOrderDetailsOpen(false);
      setMixedPaymentOpen(false);
      setMixedPaymentData(null);
      setSelectedCustomer(null);
      setPointsAmount("");
      setSearchTerm("");
      toast({
        title: "Thanh toán thành công",
        description:
          "Đơn hàng đã được thanh toán bằng điểm + tiền mặt/chuyển khoản",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể hoàn tất thanh toán hỗn hợp",
        variant: "destructive",
      });
    },
  });

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: t("orders.status.pending"),
        variant: "secondary" as const,
        color: "bg-yellow-500",
      },
      confirmed: {
        label: t("orders.status.confirmed"),
        variant: "default" as const,
        color: "bg-blue-500",
      },
      preparing: {
        label: t("orders.status.preparing"),
        variant: "destructive" as const,
        color: "bg-orange-500",
      },
      ready: {
        label: t("orders.status.ready"),
        variant: "outline" as const,
        color: "bg-green-500",
      },
      served: {
        label: t("orders.status.served"),
        variant: "outline" as const,
        color: "bg-green-600",
      },
      paid: {
        label: t("orders.status.paid"),
        variant: "outline" as const,
        color: "bg-gray-500",
      },
      cancelled: {
        label: t("orders.status.cancelled"),
        variant: "destructive" as const,
        color: "bg-red-500",
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
  };

  const getTableInfo = (tableId: number) => {
    if (!tables) return null;
    return (tables as Table[]).find((table: Table) => table.id === tableId);
  };

  const getProductInfo = (productId: number) => {
    if (!products) return null;
    return (products as Product[]).find(
      (product: Product) => product.id === productId,
    );
  };

  // CENTRALIZED payment completion function - all payment flows go through here
  const completeOrderPayment = async (orderId: number, paymentData: any) => {
    console.log(
      "🎯 CENTRALIZED Payment Completion - Order ID:",
      orderId,
      "Payment Data:",
      paymentData,
    );

    try {
      // Step 1: Update order status to 'paid' - THIS IS THE CRITICAL STEP
      console.log(
        "📋 Step 1: Updating order status to PAID for order:",
        orderId,
      );

      console.log("🔍 API Call Details:", {
        url: `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      const statusResponse = await apiRequest(
        "PUT",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`,
        { status: "paid" },
      );

      console.log(
        "🔍 API Response Status:",
        statusResponse.status,
        statusResponse.statusText,
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("❌ API Response Error:", errorText);
        throw new Error(`Failed to update order status: ${errorText}`);
      }

      const updatedOrder = await statusResponse.json();
      console.log("✅ Step 1 COMPLETED: Order status updated to PAID:", {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        tableId: updatedOrder.tableId,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt,
        updated: updatedOrder.updated,
        previousStatus: updatedOrder.previousStatus,
      });

      // Step 2: Update additional payment details
      console.log("📋 Step 2: Updating payment details for order:", orderId);

      const paymentDetailsResponse = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: paymentData.paymentMethod || "cash",
          einvoiceStatus: paymentData.einvoiceStatus || 0,
          paidAt: new Date().toISOString(),
          invoiceNumber: paymentData.invoiceNumber || null,
          symbol: paymentData.symbol || null,
          templateNumber: paymentData.templateNumber || null,
        }),
      });

      if (!paymentDetailsResponse.ok) {
        console.warn(
          "⚠️ Step 2 FAILED: Could not update payment details, but order is already PAID",
        );
      } else {
        console.log("✅ Step 2 COMPLETED: Payment details updated");
      }

      // Step 3: Refresh UI and trigger events
      console.log("📋 Step 3: Refreshing UI and triggering events");

      // Force immediate refresh with multiple attempts (5 times)
      for (let i = 0; i < 5; i++) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        ]);

        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 200)); // Wait 200ms between attempts
        }
      }

      // Force additional refreshes with different intervals
      const intervals = [300, 600, 1000, 1500, 2000];
      intervals.forEach((delay, index) => {
        setTimeout(async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
            queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
          ]);
          console.log(
            `🔄 Delayed refresh ${index + 1} completed after ${delay}ms`,
          );
        }, delay);
      });

      // Dispatch events for real-time updates
      if (typeof window !== "undefined") {
        const events = [
          new CustomEvent("orderStatusUpdated", {
            detail: {
              orderId,
              status: "paid",
              previousStatus: updatedOrder.previousStatus || "served",
              tableId: updatedOrder.tableId,
              timestamp: new Date().toISOString(),
            },
          }),
          new CustomEvent("refreshOrders", {
            detail: { immediate: true, orderId, newStatus: "paid" },
          }),
          new CustomEvent("refreshTables", {
            detail: { immediate: true, tableId: updatedOrder.tableId },
          }),
          new CustomEvent("paymentCompleted", {
            detail: { orderId, tableId: updatedOrder.tableId },
          }),
          new CustomEvent("tableStatusUpdate", {
            detail: { tableId: updatedOrder.tableId, checkForRelease: true },
          }),
          new CustomEvent("forceRefresh", {
            detail: { reason: "payment_completed", orderId },
          }),
        ];

        events.forEach((event) => {
          console.log("📡 Dispatching event:", event.type, event.detail);
          window.dispatchEvent(event);
        });
      }

      console.log("✅ Step 3 COMPLETED: UI refreshed and events dispatched");
      console.log(
        "🎉 PAYMENT COMPLETION SUCCESS - Order",
        orderId,
        "is now PAID",
      );

      return { success: true, order: updatedOrder };
    } catch (error) {
      console.error(
        "❌ PAYMENT COMPLETION FAILED for order",
        orderId,
        ":",
        error,
      );
      throw error;
    }
  };

  // Handle E-invoice confirmation and complete payment
  const handleEInvoiceConfirm = async (invoiceData: any) => {
    console.log(
      "🎯 Order Management handleEInvoiceConfirm called with data:",
      invoiceData,
    );

    if (!orderForPayment) {
      console.error("❌ No order for payment found");
      toast({
        title: "Lỗi",
        description: "Không tìm thấy đơn hàng để thanh toán",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use centralized payment completion function
      await completeOrderPayment(orderForPayment.id, {
        paymentMethod: invoiceData.originalPaymentMethod || "einvoice",
        einvoiceStatus: invoiceData.publishLater ? 0 : 1,
        invoiceNumber: invoiceData.invoiceNumber,
        symbol: invoiceData.symbol,
        templateNumber: invoiceData.templateNumber,
      });

      toast({
        title: "Thành công",
        description: invoiceData.publishLater
          ? "Đơn hàng đã được thanh toán và lưu để phát hành hóa đơn sau"
          : "Đơn hàng đã được thanh toán và hóa đơn điện tử đã được phát hành",
      });

      // Close all modals immediately and permanently
      setShowEInvoiceModal(false);
      setShowPaymentMethodModal(false);
      setShowReceiptPreview(false);
      setPreviewReceipt(null);
      setOrderDetailsOpen(false);
      setSelectedOrder(null);
      setOrderForPayment(null);
      setShowReceiptModal(false);
      setSelectedReceipt(null);

      // DO NOT show receipt modal automatically after E-Invoice
      // User can access receipt through other means if needed
      console.log("✅ Order Management: Payment completed, all modals closed");
    } catch (error) {
      console.error("❌ Error during payment completion:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hoàn tất thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      });

      // Reset states
      setOrderForPayment(null);
      setShowEInvoiceModal(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== "number" || isNaN(amount)) {
      return "0 ₫";
    }
    // Always round to integer and format without decimals
    return `${Math.floor(amount).toLocaleString("vi-VN")} ₫`;
  };

  // Memoize expensive calculations - using EXACT same logic as Table Grid
  const orderDetailsCalculation = React.useMemo(() => {
    if (
      !selectedOrder ||
      !orderItems ||
      !Array.isArray(orderItems) ||
      orderItems.length === 0
    ) {
      return { subtotal: 0, tax: 0, total: 0 };
    }

    let subtotal = 0;
    let taxAmount = 0;

    console.log(
      `🧮 Order Details: Calculating totals for ${orderItems.length} items using table-grid logic`,
    );

    orderItems.forEach((item: any) => {
      const unitPrice = Number(item.unitPrice || 0);
      const quantity = Number(item.quantity || 0);
      const product = Array.isArray(products)
        ? products.find((p: any) => p.id === item.productId)
        : null;

      if (unitPrice <= 0 || quantity <= 0) {
        console.warn(
          `⚠️ Order Details: Invalid item data: unitPrice=${unitPrice}, quantity=${quantity}`,
        );
        return;
      }

      console.log(`📊 Order Details: Processing item ${item.id}:`, {
        productId: item.productId,
        productName: item.productName,
        unitPrice,
        quantity,
        productFound: !!product,
      });

      // Calculate subtotal (base price * quantity)
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;

      // Calculate tax using afterTaxPrice if available (EXACT same logic as table-grid)
      let taxPerUnit = 0;
      let itemTax = 0;

      if (
        product?.afterTaxPrice &&
        product.afterTaxPrice !== null &&
        product.afterTaxPrice !== ""
      ) {
        const afterTaxPrice = parseFloat(product.afterTaxPrice);
        if (!isNaN(afterTaxPrice) && afterTaxPrice > 0) {
          taxPerUnit = Math.max(0, afterTaxPrice - unitPrice);
          itemTax = taxPerUnit * quantity;
          taxAmount += itemTax;

          console.log(
            `💸 Order Details: Tax calculated for ${item.productName}:`,
            {
              afterTaxPrice,
              unitPrice,
              taxPerUnit,
              quantity,
              itemTax,
            },
          );
        }
      }
    });

    const finalTotal = Math.floor(subtotal + taxAmount);

    console.log(`💰 Order Details: Final calculation (table-grid logic):`, {
      subtotal: subtotal,
      tax: taxAmount,
      total: finalTotal,
      itemsProcessed: orderItems.length,
    });

    return {
      subtotal: subtotal,
      tax: taxAmount,
      total: finalTotal,
    };
  }, [selectedOrder, orderItems, products]);

  // Function to get order total - display directly from order table
  const getOrderTotal = React.useCallback(
    (order: Order, storeSettings?: any) => {
      return Math.floor(Number(order.total || 0));
    },
    [],
  );

  const formatTime = (dateString: string | Date | undefined | null) => {
    // Handle undefined, null, or empty string cases
    if (!dateString) {
      return "Không có thời gian";
    }

    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Thời gian không hợp lệ";
      }

      const currentLanguage = localStorage.getItem("language") || "ko";

      const localeMap = {
        ko: "ko-KR",
        en: "en-US",
        vi: "vi-VN",
      };

      // For Vietnamese, use dd/mm/yyyy format
      if (currentLanguage === "vi") {
        return (
          date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      }

      return date.toLocaleString(
        localeMap[currentLanguage as keyof typeof localeMap] || "ko-KR",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        },
      );
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Lỗi định dạng thời gian";
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      console.log(
        `🔄 Order Management: Updating order ${orderId} status to ${newStatus}`,
      );
      console.log(`🔍 DEBUG: Frontend status update details:`, {
        orderId: orderId,
        orderIdType: typeof orderId,
        orderIdValid: !isNaN(orderId) && orderId > 0,
        newStatus: newStatus,
        statusType: typeof newStatus,
        statusValid: newStatus && newStatus.trim().length > 0,
        timestamp: new Date().toISOString(),
      });

      console.log(`🔍 DEBUG: Current orders state before update:`, {
        ordersCount: orders?.length || 0,
        currentOrderInState: orders?.find((o: any) => o.id === orderId),
        timestamp: new Date().toISOString(),
      });

      console.log(
        `🚀 STARTING API CALL: updateOrderStatus for order ${orderId} to status ${newStatus}`,
      );
      console.log(
        `🔍 DEBUG: About to call API endpoint: PUT /api/orders/${orderId}/status`,
      );
      console.log(`🔍 DEBUG: Request payload:`, { status: newStatus });
      console.log(`🔍 DEBUG: Making API request to update order status...`);

      const startTime = Date.now();
      const response = await apiRequest(
        "PUT",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders/${orderId}/status`,
        { status: newStatus },
      );
      const endTime = Date.now();

      console.log(
        `⏱️ API CALL COMPLETED in ${endTime - startTime}ms for order ${orderId}`,
      );

      console.log(`🔍 DEBUG: API Response details:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        console.log(
          `✅ Order Management: Status updated successfully:`,
          updatedOrder,
        );
        console.log(`🔍 DEBUG: Updated order details:`, {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          previousStatus: updatedOrder.previousStatus,
          newStatus: updatedOrder.status,
          tableId: updatedOrder.tableId,
          paidAt: updatedOrder.paidAt,
          updateTimestamp: updatedOrder.updateTimestamp,
        });

        // CRITICAL: Force immediate query refresh and UI update
        console.log(`🔄 FORCING immediate UI refresh after status update...`);

        // Invalidate and refetch queries immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        ]);

        console.log(`✅ Queries refreshed after status update`);

        // Force component re-render by checking if state was actually updated
        setTimeout(() => {
          console.log(`🔍 POST-UPDATE: Checking if orders state was updated:`, {
            ordersCount: orders?.length || 0,
            updatedOrderInState: orders?.find((o: any) => o.id === orderId),
            expectedStatus: newStatus,
            timestamp: new Date().toISOString(),
          });
        }, 1000);

        toast({
          title: "Thành công",
          description: `Trạng thái đơn hàng đã được cập nhật thành ${newStatus}`,
        });
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Order Management: Failed to update status:`,
          errorText,
        );
        console.log(`🔍 DEBUG: API Error details:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          orderId: orderId,
          requestedStatus: newStatus,
        });

        toast({
          title: "Lỗi",
          description: "Không thể cập nhật trạng thái đơn hàng: " + errorText,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Order Management: Error updating order status:", error);
      console.log(`🔍 DEBUG: Exception details:`, {
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        orderId: orderId,
        requestedStatus: newStatus,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
        variant: "destructive",
      });
    }
  };

  const handlePaymentClick = async (order: Order) => {
    console.log(
      "🎯 Payment button clicked for order:",
      order.id,
      order.orderNumber,
    );

    // Basic validation
    if (!order || !order.id) {
      console.error("❌ Invalid order data:", order);
      toast({
        title: "Lỗi",
        description: "Dữ liệu đơn hàng không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch order items
      const orderItemsResponse = await apiRequest(
        "GET",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${order.id}`,
      );

      if (!orderItemsResponse.ok) {
        throw new Error(
          `Không thể tải dữ liệu món ăn: ${orderItemsResponse.status}`,
        );
      }

      const orderItemsData = await orderItemsResponse.json();

      if (!Array.isArray(orderItemsData) || orderItemsData.length === 0) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy món ăn trong đơn hàng này",
          variant: "destructive",
        });
        return;
      }

      // Create cart items format for payment modal
      const cartItems = orderItemsData.map((item: any) => {
        const unitPrice = Number(item.unitPrice || 0);
        const quantity = Number(item.quantity || 0);
        const product = Array.isArray(products)
          ? products.find((p: any) => p.id === item.productId)
          : null;

        return {
          id: item.productId,
          productId: item.productId,
          name: item.productName || product?.name || "Unknown Product",
          price: unitPrice,
          quantity: quantity,
          sku: item.productSku || product?.sku || `SP${item.productId}`,
          taxRate: product?.taxRate ? parseFloat(product.taxRate) : 0,
          afterTaxPrice: product?.afterTaxPrice || null,
          unitPrice: unitPrice,
          total: unitPrice * quantity,
          discount: item.discount,
        };
      });

      // Create order for payment with exact database values
      const orderForPayment = {
        id: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        customerName: order.customerName || "Khách hàng",
        customerCount: order.customerCount || 1,
        status: order.status,
        salesChannel: order.salesChannel || "table",
        // Use exact values from database
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        exactSubtotal: Math.floor(Number(order.subtotal || 0)),
        exactTax: Math.floor(Number(order.tax || 0)),
        exactDiscount: Math.floor(Number(order.discount || 0)),
        exactTotal: Math.floor(Number(order.total || 0)),
        // Order items for payment processing
        items: cartItems,
        orderItems: orderItemsData.map((item: any) => ({
          ...item,
          unitPrice: item.unitPrice,
          productName: item.productName,
        })),
        // Additional metadata
        orderedAt: order.orderedAt,
        servedAt: order.servedAt,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt,
        einvoiceStatus: order.einvoiceStatus || 0,
        invoiceNumber: order.invoiceNumber,
        symbol: order.symbol,
        templateNumber: order.templateNumber,
        tableNumber: order.tableId ? `T${order.tableId}` : "N/A",
      };

      // Create receipt data format
      const receiptData = {
        id: order.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        customerName: order.customerName || "Khách hàng",
        customerCount: order.customerCount || 1,
        items: cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          unitPrice: item.unitPrice.toString(),
          total: item.total.toString(),
          sku: item.sku,
          discount: item.discount || "0",
          taxRate: item.taxRate.toString(),
          afterTaxPrice: item.afterTaxPrice,
        })),
        orderItems: cartItems,
        subtotal: order.subtotal || "0",
        tax: order.tax || "0",
        discount: order.discount || "0",
        total: order.total || "0",
        exactSubtotal: Math.floor(Number(order.subtotal || 0)),
        exactTax: Math.floor(Number(order.tax || 0)),
        exactDiscount: Math.floor(Number(order.discount || 0)),
        exactTotal: Math.floor(Number(order.total || 0)),
        paymentMethod: "preview",
        createdAt: new Date().toISOString(),
        status: order.status,
        orderedAt: order.orderedAt,
        servedAt: order.servedAt,
        einvoiceStatus: order.einvoiceStatus || 0,
        invoiceNumber: order.invoiceNumber,
        symbol: order.symbol,
        templateNumber: order.templateNumber,
      };

      console.log("💰 Payment data prepared:", {
        orderId: order.id,
        total: order.total,
        itemsCount: cartItems.length,
        orderForPayment: orderForPayment,
        receiptData: receiptData,
      });

      // Store data globally for modals
      if (typeof window !== "undefined") {
        (window as any).previewReceipt = receiptData;
        (window as any).orderForPayment = orderForPayment;
      }

      // Open payment modal with correct props
      setSelectedOrder(order);
      setOrderForPayment(orderForPayment);
      setPreviewReceipt(receiptData);
      setShowPaymentMethodModal(true);
    } catch (error) {
      console.error("❌ Error preparing payment data:", error);
      toast({
        title: "Lỗi chuẩn bị thanh toán",
        description:
          error instanceof Error
            ? error.message
            : "Không thể chuẩn bị dữ liệu thanh toán",
        variant: "destructive",
      });
    }
  };

  const handlePaymentMethodSelect = async (method: string, data?: any) => {
    console.log("🎯 Order Management payment method selected:", method, data);

    if (method === "paymentCompleted" && data?.success) {
      console.log("✅ Order Management: Payment completed successfully", data);

      try {
        // Force immediate refresh
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
          queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        ]);

        // Close all modals immediately and prevent any reopening
        setShowPaymentMethodModal(false);
        setOrderForPayment(null);
        setOrderDetailsOpen(false);
        setSelectedOrder(null);
        setShowReceiptPreview(false);
        setPreviewReceipt(null);
        setShowReceiptModal(false);
        setSelectedReceipt(null);

        toast({
          title: "Thành công",
          description: "Đơn hàng đã được thanh toán thành công",
        });
      } catch (error) {
        console.error("❌ Error refreshing data after payment:", error);
      }

      return;
    }

    if (method === "paymentError" && data) {
      console.error("❌ Order Management: Payment failed", data);

      toast({
        title: "Lỗi",
        description: data.error || "Không thể hoàn tất thanh toán",
        variant: "destructive",
      });

      setShowPaymentMethodModal(false);
      return;
    }

    // For direct payment methods (cash, card, etc.) - handle immediately
    if (!orderForPayment?.id) {
      console.error("❌ No order for payment found");
      toast({
        title: "Lỗi",
        description: "Không tìm thấy đơn hàng để thanh toán",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(
        "💳 Order Management: Processing direct payment for order:",
        orderForPayment.id,
      );

      // Use centralized payment completion
      await completePaymentMutation.mutate({
        orderId: orderForPayment.id,
        paymentMethod: typeof method === "string" ? method : method.nameKey,
      });

      // Force immediate UI refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
      ]);

      // Close all modals immediately - no receipt display for direct payments
      setShowPaymentMethodModal(false);
      setOrderForPayment(null);
      setOrderDetailsOpen(false);
      setSelectedOrder(null);
      setShowReceiptPreview(false);
      setPreviewReceipt(null);

      toast({
        title: "Thành công",
        description: "Đơn hàng đã được thanh toán thành công",
      });
    } catch (error) {
      console.error("❌ Payment failed:", error);
      toast({
        title: "Lỗi",
        description: "Không thể hoàn tất thanh toán. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const getPaymentMethods = () => {
    // Get payment methods from localStorage (saved from settings)
    const savedPaymentMethods = localStorage.getItem("paymentMethods");

    // Default payment methods if none saved
    const defaultPaymentMethods = [
      { id: 1, nameKey: "cash", type: "cash", enabled: true, icon: "💵" },
      { id: 2, nameKey: "creditCard", type: "card", enabled: true, icon: "💳" },
      { id: 3, nameKey: "debitCard", type: "debit", enabled: true, icon: "💳" },
      { id: 4, nameKey: "momo", type: "digital", enabled: true, icon: "📱" },
      { id: 5, nameKey: "zalopay", type: "digital", enabled: true, icon: "📱" },
      { id: 6, nameKey: "vnpay", type: "digital", enabled: true, icon: "💳" },
      { id: 7, nameKey: "qrCode", type: "qr", enabled: true, icon: "📱" },
      {
        id: 8,
        nameKey: "shopeepay",
        type: "digital",
        enabled: false,
        icon: "🛒",
      },
      {
        id: 9,
        nameKey: "grabpay",
        type: "digital",
        enabled: false,
        icon: "🚗",
      },
    ];

    const paymentMethods = savedPaymentMethods
      ? JSON.parse(savedPaymentMethods)
      : defaultPaymentMethods;

    // Filter to only return enabled payment methods
    return paymentMethods.filter((method) => method.enabled);
  };

  const handlePayment = async (paymentMethodKey: string) => {
    if (!selectedOrder) return;

    const method = getPaymentMethods().find(
      (m) => m.nameKey === paymentMethodKey,
    );
    if (!method) return;

    // If cash payment, proceed directly
    if (paymentMethodKey === "cash") {
      completePaymentMutation.mutate({
        orderId: selectedOrder.id,
        paymentMethod: paymentMethodKey,
      });
      return;
    }

    // For QR Code payment, use CreateQRPos API
    if (paymentMethodKey === "qrCode") {
      try {
        setQrLoading(true);
        const { createQRPosAsync, CreateQRPosRequest } = await import(
          "@/lib/api"
        );

        const transactionUuid = `TXN-${Date.now()}`;
        const depositAmt = Number(selectedOrder.total);

        const qrRequest: CreateQRPosRequest = {
          transactionUuid,
          depositAmt: depositAmt,
          posUniqueId: "ER002",
          accntNo: "0900993023",
          posfranchiseeName: "DOOKI-HANOI",
          posCompanyName: "HYOJUNG",
          posBillNo: `BILL-${Date.now()}`,
        };

        const bankCode = "79616001";
        const clientID = "91a3a3668724e631e1baf4f8526524f3";

        console.log("Calling CreateQRPos API with:", {
          qrRequest,
          bankCode,
          clientID,
        });

        const qrResponse = await createQRPosAsync(
          qrRequest,
          bankCode,
          clientID,
        );

        console.log("CreateQRPos API response:", qrResponse);

        // Generate QR code from the received QR data
        if (qrResponse.qrData) {
          // Use qrData directly for QR code generation
          let qrContent = qrResponse.qrData;
          try {
            // Try to decode if it's base64 encoded
            qrContent = atob(qrResponse.qrData);
          } catch (e) {
            // If decode fails, use the raw qrData
            console.log("Using raw qrData as it is not base64 encoded");
          }

          const qrUrl = await QRCodeLib.toDataURL(qrContent, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(qrUrl);
          setSelectedPaymentMethod({ key: paymentMethodKey, method });
          setShowQRPayment(true);
          setPaymentMethodsOpen(false);
        } else {
          console.error("No QR data received from API");
          // Fallback to mock QR code
          const fallbackData = `Payment via QR\nAmount: ${selectedOrder.total.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₫\nOrder: ${selectedOrder.orderNumber}\nTime: ${new Date().toLocaleString("vi-VN")}`;
          const qrUrl = await QRCodeLib.toDataURL(fallbackData, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(qrUrl);
          setSelectedPaymentMethod({ key: paymentMethodKey, method });
          setShowQRPayment(true);
          setPaymentMethodsOpen(false);
        }
      } catch (error) {
        console.error("Error calling CreateQRPos API:", error);
        // Fallback to mock QR code on error
        try {
          const fallbackData = `Payment via QR\nAmount: ${selectedOrder.total.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₫\nOrder: ${selectedOrder.orderNumber}\nTime: ${new Date().toLocaleString("vi-VN")}`;
          const qrUrl = await QRCodeLib.toDataURL(fallbackData, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeUrl(qrUrl);
          setSelectedPaymentMethod({ key: paymentMethodKey, method });
          setShowQRPayment(true);
          setPaymentMethodsOpen(false);
        } catch (fallbackError) {
          console.error("Error generating fallback QR code:", fallbackError);
          toast({
            title: "Lỗi",
            description: "Không thể tạo mã QR",
            variant: "destructive",
          });
        }
      } finally {
        setQrLoading(false);
      }
      return;
    }
  };

  const handleQRPaymentConfirm = () => {
    if (selectedOrder && selectedPaymentMethod) {
      // Check if this is a mixed payment (points + transfer/qr)
      if (mixedPaymentData) {
        // Use mixed payment mutation to handle both points deduction and payment
        mixedPaymentMutation.mutate({
          customerId: mixedPaymentData.customerId,
          points: mixedPaymentData.pointsToUse,
          orderId: mixedPaymentData.orderId,
          paymentMethod:
            selectedPaymentMethod.key === "transfer"
              ? "transfer"
              : selectedPaymentMethod.key,
        });
      } else {
        // Regular payment without points
        completePaymentMutation.mutate({
          orderId: selectedOrder.id,
          paymentMethod: selectedPaymentMethod.key,
        });
      }
      setShowQRPayment(false);
      setQrCodeUrl("");
      setSelectedPaymentMethod(null);
    }
  };

  const handleQRPaymentClose = () => {
    setShowQRPayment(false);
    setQrCodeUrl("");
    setSelectedPaymentMethod(null);
    setPaymentMethodsOpen(true);
  };

  const handlePointsPayment = () => {
    if (!selectedCustomer || !selectedOrder) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khách hàng",
        variant: "destructive",
      });
      return;
    }

    const currentPoints = selectedCustomer.points || 0;

    // Use exact database total without recalculation
    const finalTotal =
      selectedOrder.exactTotal || Math.floor(Number(selectedOrder.total || 0));
    const pointsValue = currentPoints * 1000; // 1 điểm = 1000đ

    console.log("💰 Points Payment Handler: Using exact database values:", {
      orderId: selectedOrder.id,
      exactTotal: selectedOrder.exactTotal,
      databaseTotal: selectedOrder.total,
      finalTotal: finalTotal,
      currentPoints: currentPoints,
      pointsValue: pointsValue,
      canPayFully: pointsValue >= finalTotal,
    });

    if (pointsValue >= finalTotal) {
      // Đủ điểm để thanh toán toàn bộ
      const pointsNeeded = Math.ceil(finalTotal / 1000);
      pointsPaymentMutation.mutate({
        customerId: selectedCustomer.id,
        points: pointsNeeded,
        orderId: selectedOrder.id,
        paymentMethod: "points",
        remainingAmount: 0,
      });
    } else {
      // Không đủ điểm, cần thanh toán hỗn hợp
      const remainingAmount = finalTotal - pointsValue;
      setMixedPaymentData({
        customerId: selectedCustomer.id,
        pointsToUse: currentPoints,
        remainingAmount: remainingAmount,
        orderId: selectedOrder.id,
      });
      setPointsPaymentOpen(false);
      setMixedPaymentOpen(true);
    }
  };

  const filteredCustomers =
    customers?.filter((customer) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.customerId?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Safe order processing with error handling and pagination - MOVE ALL HOOKS BEFORE CONDITIONAL RETURNS
  const allOrders = React.useMemo(() => {
    try {
      if (!orders || !Array.isArray(orders)) {
        console.warn("Order Management: Invalid orders data:", orders);
        return [];
      }

      return (orders as Order[])
        .filter((order) => order && order.id && order.orderedAt) // Filter out invalid orders
        .sort((a: Order, b: Order) => {
          try {
            // Sort by orderedAt descending (newest first)
            return (
              new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
            );
          } catch (error) {
            console.error("Error sorting orders:", error);
            return 0;
          }
        });
    } catch (error) {
      console.error("Error processing orders:", error);
      return [];
    }
  }, [orders]);

  // Pagination calculations
  const totalOrders = allOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = allOrders.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Preload totals for next/previous pages for better UX (optional background loading)
  useEffect(() => {
    if (allOrders && allOrders.length > 0 && products && products.length > 0) {
      // Calculate range for preloading (current page + 1 page before and after)
      const preloadStartIndex = Math.max(0, (currentPage - 2) * ordersPerPage);
      const preloadEndIndex = Math.min(
        allOrders.length,
        (currentPage + 1) * ordersPerPage,
      );
      const preloadOrders = allOrders.slice(preloadStartIndex, preloadEndIndex);

      console.log(
        `🔄 Preloading totals for ${preloadOrders.length} orders around current page ${currentPage}`,
      );

      // Batch preload in background with low priority
      const preloadBatch = preloadOrders.filter(
        (order) =>
          !calculatedTotals.has(order.id) &&
          order.status !== "cancelled" &&
          !currentOrders.some((currentOrder) => currentOrder.id === order.id), // Don't duplicate current page
      );

      if (preloadBatch.length > 0) {
        // Use setTimeout to make this low priority
        setTimeout(() => {
          preloadBatch.forEach((order) => {
            // Note: We are no longer calling calculateOrderTotal here,
            // as the API now provides the calculated total.
            // This section can be removed or adapted if pre-calculating from API response is needed.
          });
        }, 500); // 500ms delay to not interfere with current page loading
      }
    }
  }, [
    allOrders,
    products,
    currentPage,
    ordersPerPage,
    currentOrders,
    calculatedTotals,
  ]);

  // Function to refresh data with error handling
  const refreshData = React.useCallback(async () => {
    console.log("🔄 Order Management: Refreshing data...");
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
        queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
      ]);
      console.log("✅ Order Management: Data refreshed successfully");
    } catch (error) {
      console.error("❌ Order Management: Error refreshing data:", error);
      // Try again after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      }, 1000);
    }
  }, [queryClient]);

  // Cleanup calculated totals for orders no longer in the dataset
  useEffect(() => {
    if (allOrders && allOrders.length > 0 && calculatedTotals.size > 0) {
      const currentOrderIds = new Set(allOrders.map((order) => order.id));
      const calculatedOrderIds = Array.from(calculatedTotals.keys());

      // Remove calculated totals for orders that no longer exist
      const toRemove = calculatedOrderIds.filter(
        (id) => !currentOrderIds.has(id),
      );

      if (toRemove.length > 0) {
        console.log(
          `🧹 Cleaning up calculated totals for ${toRemove.length} removed orders`,
        );
        setCalculatedTotals((prev) => {
          const newMap = new Map(prev);
          toRemove.forEach((id) => newMap.delete(id));
          return newMap;
        });
      }

      // Also limit memory usage - keep only last 100 calculated totals
      if (calculatedTotals.size > 100) {
        console.log(
          `🧹 Memory cleanup: Removing old calculated totals (current: ${calculatedTotals.size})`,
        );
        const entries = Array.from(calculatedTotals.entries());
        const toKeep = entries.slice(-50); // Keep last 50 entries
        setCalculatedTotals(new Map(toKeep));
      }
    }
  }, [allOrders, calculatedTotals]);

  // Refresh data when tab becomes active or component mounts
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(refreshData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [refreshData]);

  // Trigger total calculations when current page orders data changes
  useEffect(() => {
    if (
      currentOrders &&
      currentOrders.length > 0 &&
      products &&
      products.length > 0
    ) {
      console.log(
        `🧮 Current page orders changed, triggering total calculations for ${currentOrders.length} displayed orders (page ${currentPage})`,
      );

      // Calculate totals for orders that don't have API calculated totals
      currentOrders.forEach(async (order) => {
        const apiCalculatedTotal = (order as any).calculatedTotal;

        // Skip if we already have a valid API calculated total or cached total
        if (
          (apiCalculatedTotal && Number(apiCalculatedTotal) > 0) ||
          calculatedTotals.has(order.id)
        ) {
          return;
        }

        // IMPORTANT: Skip calculation for cancelled and paid orders completely
        // These orders must use stored totals only to maintain consistency
        if (order.status === "cancelled" || order.status === "paid") {
          console.log(
            `⏭️ SKIPPING calculation for ${order.status} order ${order.orderNumber} - stored total is final`,
          );
          return;
        }

        console.log(
          `🧮 Calculating total for order ${order.orderNumber} (ID: ${order.id})`,
        );

        try {
          // Fetch order items for calculation
          const response = await apiRequest(
            "GET",
            `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items/${order.id}`,
          );
          if (!response.ok) {
            console.warn(
              `❌ Failed to fetch order items for order ${order.id}`,
            );
            return;
          }

          const orderItemsData = await response.json();
          if (!Array.isArray(orderItemsData) || orderItemsData.length === 0) {
            console.log(
              `⚪ No items found for order ${order.id}, using stored total`,
            );
            return;
          }

          // Calculate total using same logic as Order Details
          let subtotal = 0;
          let taxAmount = 0;

          orderItemsData.forEach((item: any) => {
            const unitPrice = Number(item.unitPrice || 0);
            const quantity = Number(item.quantity || 0);
            const product = products.find((p: any) => p.id === item.productId);

            // Calculate subtotal
            subtotal += unitPrice * quantity;

            // Calculate tax using same logic as order details
            if (
              product?.afterTaxPrice &&
              product.afterTaxPrice !== null &&
              product.afterTaxPrice !== ""
            ) {
              const afterTaxPrice = parseFloat(product.afterTaxPrice);
              const taxPerUnit = Math.max(0, afterTaxPrice - unitPrice);
              taxAmount += taxPerUnit * quantity;
            }
          });

          const calculatedTotal = Math.floor(subtotal + taxAmount);

          console.log(`💰 Calculated total for order ${order.orderNumber}:`, {
            subtotal,
            taxAmount,
            calculatedTotal,
            itemsCount: orderItemsData.length,
          });

          // Cache the calculated total
          setCalculatedTotals(
            (prev) => new Map(prev.set(order.id, calculatedTotal)),
          );
        } catch (error) {
          console.error(
            `❌ Error calculating total for order ${order.id}:`,
            error,
          );
        }
      });
    }
  }, [currentOrders, products, currentPage, calculatedTotals]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isConnected = false;
    let shouldReconnect = true;

    const connectWebSocket = () => {
      if (!shouldReconnect) return;

      try {
        const wsProtocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/ws`;

        console.log(
          "🔗 Order Management: Attempting WebSocket connection to:",
          wsUrl,
        );
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("🔗 Order Management: WebSocket connected successfully");
          isConnected = true;

          // Clear any pending reconnect timer
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }

          // Send registration message
          try {
            ws?.send(
              JSON.stringify({
                type: "register_order_management",
                timestamp: new Date().toISOString(),
              }),
            );
          } catch (error) {
            console.error("❌ Error sending registration message:", error);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(
              "📨 Order Management: WebSocket message received:",
              data,
            );

            if (
              data.type === "order_created" ||
              data.type === "order_updated" ||
              data.type === "table_status_changed" ||
              data.type === "orderStatusUpdated" ||
              data.type === "paymentCompleted"
            ) {
              console.log(
                "🔄 Order Management: Refreshing orders due to WebSocket update",
              );
              refreshData();
            }
          } catch (error) {
            console.error("❌ Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("🔗 Order Management: WebSocket disconnected", {
            code: event.code,
            reason: event.reason,
          });
          isConnected = false;

          // Only attempt reconnect if not manually closed and component is still mounted
          if (shouldReconnect && event.code !== 1000) {
            console.log(
              "🔄 Order Management: Scheduling reconnect in 3 seconds...",
            );
            reconnectTimer = setTimeout(() => {
              if (shouldReconnect) {
                console.log("🔄 Order Management: Attempting to reconnect...");
                connectWebSocket();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ Order Management: WebSocket error:", error);
          isConnected = false;

          // Close the connection to trigger onclose event
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        };
      } catch (error) {
        console.error("❌ Error creating WebSocket connection:", error);

        // Retry connection after delay if component is still mounted
        if (shouldReconnect) {
          reconnectTimer = setTimeout(() => {
            if (shouldReconnect) {
              connectWebSocket();
            }
          }, 5000);
        }
      }
    };

    // Start initial connection
    connectWebSocket();

    // Cleanup function
    return () => {
      console.log("🔗 Order Management: Cleaning up WebSocket connection");
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (ws) {
        if (isConnected) {
          ws.close(1000, "Component unmounting");
        } else {
          ws.close();
        }
        ws = null;
      }
    };
  }, [refreshData]);

  // Listen for payment completion events from payment modal
  useEffect(() => {
    const handleOrderStatusUpdate = (event: CustomEvent) => {
      console.log(
        "🔄 Order Management: Received order status update event:",
        event.detail,
      );
      // Force immediate refresh when order status is updated
      setTimeout(() => {
        refreshData();
      }, 100);
    };

    const handlePaymentCompleted = (event: CustomEvent) => {
      console.log(
        "💳 Order Management: Received payment completed event:",
        event.detail,
      );
      // Force immediate refresh when payment is completed
      setTimeout(() => {
        refreshData();
      }, 100);
    };

    const handleRefreshOrders = (event: CustomEvent) => {
      console.log(
        "🔄 Order Management: Received refresh orders event:",
        event.detail,
      );
      if (event.detail?.immediate) {
        refreshData();
      }
    };

    const handleNewOrderFromTable = (event: CustomEvent) => {
      console.log(
        "🆕 Order Management: New order created from table:",
        event.detail,
      );
      // Immediate refresh for new orders
      refreshData();
    };

    const handleReceiptModalClosed = (event: CustomEvent) => {
      console.log(
        "🔴 Order Management: Receipt modal closed event received:",
        event.detail,
      );

      if (event.detail?.clearAllStates) {
        console.log(
          "🧹 Order Management: Clearing all modal states to prevent reopening",
        );

        // Clear ALL modal states immediately
        setShowReceiptPreview(false);
        setPreviewReceipt(null);
        setOrderForPayment(null);
        setShowPaymentMethodModal(false);
        setShowEInvoiceModal(false);
        setShowReceiptModal(false);
        setSelectedReceipt(null);
        setOrderDetailsOpen(false);
        setSelectedOrder(null);
        setPaymentMethodsOpen(false);
        setShowQRPayment(false);
        setPointsPaymentOpen(false);
        setMixedPaymentOpen(false);

        // Clear any stored data
        if (typeof window !== "undefined") {
          (window as any).previewReceipt = null;
          (window as any).orderForPayment = null;
        }

        // Force data refresh
        refreshData();
      }
    };

    const handlePrintCompleted = (event: CustomEvent) => {
      console.log(
        "🖨️ Order Management: Print completed event received - closing all modals like POS",
      );

      // Close all modals immediately like POS
      setShowReceiptPreview(false);
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setShowPaymentMethodModal(false);
      setShowEInvoiceModal(false);
      setShowReceiptModal(false);
      setSelectedReceipt(null);
      setOrderDetailsOpen(false);
      setSelectedOrder(null);

      // Clear any stored data
      if (typeof window !== "undefined") {
        (window as any).previewReceipt = null;
        (window as any).orderForPayment = null;
      }

      // Force data refresh
      refreshData();
    };

    // Add event listeners
    window.addEventListener(
      "orderStatusUpdated",
      handleOrderStatusUpdate as EventListener,
    );
    window.addEventListener(
      "paymentCompleted",
      handlePaymentCompleted as EventListener,
    );
    window.addEventListener(
      "refreshOrders",
      handleRefreshOrders as EventListener,
    );
    window.addEventListener(
      "newOrderCreated",
      handleNewOrderFromTable as EventListener,
    );
    window.addEventListener(
      "receiptModalClosed",
      handleReceiptModalClosed as EventListener,
    );
    window.addEventListener(
      "printCompleted",
      handlePrintCompleted as EventListener,
    );

    // Cleanup event listeners
    return () => {
      window.removeEventListener(
        "orderStatusUpdated",
        handleOrderStatusUpdate as EventListener,
      );
      window.removeEventListener(
        "paymentCompleted",
        handlePaymentCompleted as EventListener,
      );
      window.removeEventListener(
        "refreshOrders",
        handleRefreshOrders as EventListener,
      );
      window.removeEventListener(
        "newOrderCreated",
        handleNewOrderFromTable as EventListener,
      );
      window.removeEventListener(
        "receiptModalClosed",
        handleReceiptModalClosed as EventListener,
      );
      window.removeEventListener(
        "printCompleted",
        handlePrintCompleted as EventListener,
      );
    };
  }, [refreshData]);

  // CONDITIONAL RENDER AFTER ALL HOOKS - Show loading state only if really needed
  if (ordersLoading && (!orders || orders.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("orders.orderManagement")}
            </h2>
            <p className="text-gray-600">{t("orders.realTimeOrderStatus")}</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            0 {t("orders.ordersInProgress")}
          </Badge>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <span className="ml-2">
            {t("common.loading")} {t("orders.title")}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("orders.orderManagement")} - {t("orders.tableOrder")}
          </h2>
          <p className="text-gray-600">{t("orders.realTimeOrderStatus")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {totalOrders} {t("orders.ordersInProgress")}
          </Badge>
          {totalPages > 1 && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              {t("common.page")} {currentPage}/{totalPages}
            </Badge>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      {totalOrders === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("orders.noActiveOrders")}
            </h3>
            <p className="text-gray-600">
              {t("orders.newOrdersWillAppearHere")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentOrders.map((order: Order) => {
              const statusConfig = getOrderStatusBadge(order.status);
              const tableInfo = getTableInfo(order.tableId);

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-medium">
                          {order.orderNumber}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {tableInfo?.tableNumber || t("orders.noTableInfo")}
                        </p>
                      </div>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Order Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          {order.customerCount || 1} {t("orders.people")}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(order.orderedAt)}
                        </div>
                      </div>

                      {/* Order Summary - Match table-grid format */}
                      <div className="space-y-1 border-t pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số đơn hàng:</span>
                          <span className="font-medium">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Tạm tính:</span>
                          <span className="font-medium">
                            {Math.floor(
                              Number(order.subtotal || 0),
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                          </span>
                        </div>

                        {order.discount && Number(order.discount) > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Giảm giá:</span>
                            <span>
                              -
                              {Math.floor(
                                Number(order.discount),
                              ).toLocaleString("vi-VN")}{" "}
                              ₫
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between border-t pt-1">
                          <span className="text-gray-900 font-semibold">
                            Tổng tiền:
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.floor(
                              Number(order.total || 0),
                            ).toLocaleString("vi-VN")}{" "}
                            ₫
                          </span>
                        </div>
                      </div>

                      {/* Customer Info */}
                      {order.customerName && (
                        <div className="text-sm">
                          <span className="text-gray-600">
                            {t("orders.customer")}:{" "}
                          </span>
                          <span className="font-medium">
                            {order.customerName}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {t("orders.viewDetails")}
                        </Button>

                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "confirmed")
                            }
                            className="flex-1"
                          >
                            {t("orders.confirm")}
                          </Button>
                        )}

                        {order.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "preparing")
                            }
                            className="flex-1"
                          >
                            {t("orders.startCooking")}
                          </Button>
                        )}

                        {order.status === "preparing" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "ready")
                            }
                            className="flex-1"
                          >
                            {t("orders.ready")}
                          </Button>
                        )}

                        {order.status === "ready" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "served")
                            }
                            className="flex-1"
                          >
                            {t("orders.served")}
                          </Button>
                        )}

                        {order.status === "served" && (
                          <Button
                            size="sm"
                            onClick={() => handlePaymentClick(order)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            {t("orders.payment")}
                          </Button>
                        )}

                        {(order.status === "paid" ||
                          order.status === "cancelled") && (
                          <Badge
                            variant="outline"
                            className="flex-1 justify-center"
                          >
                            {order.status === "paid"
                              ? t("orders.status.completed")
                              : t("orders.status.cancelled")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                {t("common.showing")} {startIndex + 1}-
                {Math.min(endIndex, totalOrders)} {t("common.of")} {totalOrders}{" "}
                {t("orders.title")}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t("common.previous")}
                </Button>

                <div className="flex items-center gap-1">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          currentPage === pageNumber ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  {t("common.next")}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t("orders.orderDetails")}</DialogTitle>
            <DialogDescription>
              {selectedOrder &&
                `${t("orders.orderNumber")}: ${selectedOrder.orderNumber}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">{t("orders.orderInfo")}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t("orders.orderNumber")}:</span>
                      <span className="font-medium">
                        {selectedOrder?.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("orders.table")}:</span>
                      <span className="font-medium">
                        {getTableInfo(selectedOrder?.tableId)?.tableNumber ||
                          t("orders.unknownTable")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("orders.customer")}:</span>
                      <span className="font-medium">
                        {selectedOrder?.customerName ||
                          t("orders.noCustomerName")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("orders.customerCount")}:</span>
                      <span className="font-medium">
                        {selectedOrder?.customerCount || 1} {t("orders.people")}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">
                    {t("orders.statusAndTime")}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span>{t("orders.orderStatus")}:</span>
                      <Badge
                        variant={
                          getOrderStatusBadge(selectedOrder?.status || "")
                            .variant
                        }
                      >
                        {getOrderStatusBadge(selectedOrder?.status || "").label}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{t("common.einvoiceStatusLabel")}</span>
                      <Badge
                        variant={
                          selectedOrder?.einvoiceStatus === 1
                            ? "default"
                            : selectedOrder?.einvoiceStatus === 2
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {(() => {
                          console.log(
                            "🔍 Order Management: E-invoice status for order",
                            selectedOrder?.id,
                            ":",
                            {
                              einvoiceStatus: selectedOrder?.einvoiceStatus,
                              type: typeof selectedOrder?.einvoiceStatus,
                            },
                          );

                          if (selectedOrder?.einvoiceStatus === 1)
                            return t("common.einvoiceStatus.published");
                          if (selectedOrder?.einvoiceStatus === 2)
                            return t("common.einvoiceStatus.error");
                          return t("common.einvoiceStatus.notPublished");
                        })()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("orders.orderTime")}:</span>
                      <span className="font-medium">
                        {formatTime(selectedOrder?.orderedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">{t("orders.orderItems")}</h4>
                <div className="space-y-2">
                  {orderItemsLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      {t("common.loading")}...
                    </div>
                  ) : orderItems && orderItems.length > 0 ? (
                    orderItems.map((item: any, index: number) => {
                      const product = getProductInfo(item.productId);
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 bg-white border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.productName ||
                                  product?.name ||
                                  "Unknown Product"}
                              </span>
                              <span className="text-xs text-gray-500">
                                x{item.quantity}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formatCurrency(Number(item.unitPrice || 0))}/
                              {t("common.perUnit")}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-blue-600 italic mt-1">
                                {t("common.notes")}: {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {Math.floor(
                                Number(item.unitPrice || 0) *
                                  Number(item.quantity || 0),
                              ).toLocaleString()}{" "}
                              ₫
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.quantity} x{" "}
                              {Math.floor(
                                Number(item.unitPrice),
                              ).toLocaleString()}{" "}
                              ₫
                            </div>
                            {item.discount && Number(item.discount) > 0 && (
                              <div className="text-xs text-red-600">
                                {t("reports.discount")}: -
                                {Math.floor(
                                  Number(item.discount),
                                ).toLocaleString()}{" "}
                                ₫
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {t("orders.noActiveOrders")}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">
                    {Math.floor(
                      Number(selectedOrder?.subtotal || 0),
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("reports.tax")}:</span>
                  <span className="font-medium">
                    {Math.floor(Number(selectedOrder?.tax || 0)).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    ₫
                  </span>
                </div>
                {selectedOrder?.discount &&
                  Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t("common.discount")}:
                      </span>
                      <span className="font-medium text-red-600">
                        -
                        {Math.floor(
                          Number(selectedOrder.discount),
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </div>
                  )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    Tổng tiền:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.floor(
                      Number(selectedOrder?.total || 0),
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>
              </div>

              {/* Status Update Actions */}
              {selectedOrder?.status !== "paid" &&
                selectedOrder?.status !== "cancelled" && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        console.log(
                          "🎯 Order Management: Payment button clicked - using exact database values",
                        );

                        if (
                          !selectedOrder ||
                          !orderItems ||
                          !Array.isArray(orderItems) ||
                          orderItems.length === 0
                        ) {
                          console.error("❌ Missing order data:", {
                            selectedOrder: !!selectedOrder,
                            orderItems: orderItems?.length || 0,
                            orderItemsArray: Array.isArray(orderItems),
                          });
                          toast({
                            title: "Lỗi",
                            description:
                              "Không thể tải dữ liệu đơn hàng. Vui lòng thử lại.",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Use EXACT database values without recalculation to match display
                        const exactSubtotal = Math.floor(
                          Number(selectedOrder.subtotal || 0),
                        );
                        const exactTax = Math.floor(
                          Number(selectedOrder.tax || 0),
                        );
                        const exactDiscount = Math.floor(
                          Number(selectedOrder.discount || 0),
                        );
                        const exactTotal = Math.floor(
                          Number(selectedOrder.total || 0),
                        );

                        console.log(
                          "💰 Order Management: Using EXACT database values (no recalculation):",
                          {
                            exactSubtotal,
                            exactTax,
                            exactDiscount,
                            exactTotal,
                            originalValues: {
                              subtotal: selectedOrder.subtotal,
                              tax: selectedOrder.tax,
                              discount: selectedOrder.discount,
                              total: selectedOrder.total,
                            },
                          },
                        );

                        const processedItems = orderItems.map((item: any) => {
                          const unitPrice = Number(item.unitPrice || 0);
                          const quantity = Number(item.quantity || 0);
                          const product = Array.isArray(products)
                            ? products.find((p: any) => p.id === item.productId)
                            : null;

                          return {
                            id: item.id,
                            productId: item.productId,
                            productName:
                              item.productName ||
                              product?.name ||
                              "Unknown Product",
                            quantity: quantity,
                            unitPrice: unitPrice,
                            price: unitPrice,
                            discount: item.discount || "0",
                            total: unitPrice * quantity,
                            sku:
                              item.sku || product?.sku || `SP${item.productId}`,
                            taxRate: product?.taxRate
                              ? parseFloat(product.taxRate)
                              : 0,
                            afterTaxPrice: product?.afterTaxPrice || null,
                          };
                        });

                        // Create receipt preview data using EXACT database values
                        const receiptPreview = {
                          id: selectedOrder.id,
                          orderId: selectedOrder.id,
                          orderNumber: selectedOrder.orderNumber,
                          tableId: selectedOrder.tableId,
                          customerCount: selectedOrder.customerCount,
                          customerName: selectedOrder.customerName,
                          items: processedItems.map((item) => ({
                            id: item.id,
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity.toString(),
                            price: item.price.toString(),
                            total: (item.price * item.quantity).toString(),
                            sku: item.sku,
                            discount: item.discount || "0",
                            taxRate: item.taxRate.toString(),
                            afterTaxPrice: item.afterTaxPrice,
                          })),
                          orderItems: processedItems.map((item) => {
                            // Get discount from order item database
                            const itemDiscount = parseFloat(
                              item.discount || "0",
                            );

                            return {
                              ...item,
                              discount:
                                itemDiscount > 0
                                  ? itemDiscount.toString()
                                  : "0",
                              total:
                                item.total ||
                                (item.unitPrice * item.quantity).toString(),
                            };
                          }),
                          subtotal: exactSubtotal.toString(),
                          tax: exactTax.toString(),
                          discount: exactDiscount.toString(),
                          total: exactTotal.toString(),
                          exactSubtotal: exactSubtotal,
                          exactTax: exactTax,
                          exactDiscount: exactDiscount,
                          exactTotal: exactTotal,
                          paymentMethod: "preview",
                          amountReceived: exactTotal.toString(),
                          change: "0.00",
                          cashierName: "Order Management",
                          createdAt: new Date().toISOString(),
                          transactionId: `TXN-PREVIEW-${Date.now()}`,
                          // Table info
                          tableName: selectedOrder.tableId
                            ? `Bàn T${selectedOrder.tableId}`
                            : "Bàn không xác định",
                          storeLocation: "Cửa hàng chính",
                          storeAddress: "서울시 강남구 테헤란로 123",
                          storePhone: "02-1234-5678",
                        };

                        // Create order data for payment flow using EXACT database values
                        const paymentOrderData = {
                          ...selectedOrder,
                          id: selectedOrder.id,
                          orderItems: processedItems.map((item) => {
                            console.log(
                              "💰 Order Management: Processing item for payment:",
                              item,
                            );

                            const itemDiscount = parseFloat(
                              item.discount || "0",
                            );

                            return {
                              ...item,
                              discount:
                                itemDiscount > 0
                                  ? itemDiscount.toString()
                                  : "0",
                              total:
                                item.total ||
                                (item.unitPrice * item.quantity).toString(),
                            };
                          }),
                          processedItems: processedItems.map((item) => {
                            // Get discount from order item database
                            const itemDiscount = parseFloat(
                              item.discount || "0",
                            );

                            return {
                              ...item,
                              discount:
                                itemDiscount > 0
                                  ? itemDiscount.toString()
                                  : "0",
                              total:
                                item.total ||
                                (item.unitPrice * item.quantity).toString(),
                            };
                          }),
                          // Use EXACT database values
                          subtotal: exactSubtotal.toString(),
                          tax: exactTax.toString(),
                          discount: exactDiscount.toString(),
                          total: exactTotal.toString(),
                          exactSubtotal: exactSubtotal,
                          exactTax: exactTax,
                          exactDiscount: exactDiscount,
                          exactTotal: exactTotal,
                          tableNumber: selectedOrder.tableId
                            ? `T${selectedOrder.tableId}`
                            : "N/A",
                        };

                        console.log(
                          "✅ Order Management: Payment data prepared using EXACT database values:",
                          {
                            receiptTotal: receiptPreview.total,
                            receiptExactTotal: receiptPreview.exactTotal,
                            receiptDiscount: receiptPreview.discount,
                            receiptExactDiscount: receiptPreview.exactDiscount,
                            orderTotal: paymentOrderData.total,
                            orderExactTotal: paymentOrderData.exactTotal,
                            orderId: paymentOrderData.id,
                            matchesDisplay: {
                              subtotal:
                                exactSubtotal ===
                                Math.floor(Number(selectedOrder.subtotal || 0)),
                              tax:
                                exactTax ===
                                Math.floor(Number(selectedOrder.tax || 0)),
                              discount:
                                exactDiscount ===
                                Math.floor(Number(selectedOrder.discount || 0)),
                              total:
                                exactTotal ===
                                Math.floor(Number(selectedOrder.total || 0)),
                            },
                          },
                        );

                        // Store data globally for modal access
                        if (typeof window !== "undefined") {
                          (window as any).previewReceipt = receiptPreview;
                          (window as any).orderForPayment = paymentOrderData;
                        }

                        // Close order details modal and show receipt preview
                        setOrderDetailsOpen(false);
                        setSelectedOrder(selectedOrder);
                        setOrderForPayment(paymentOrderData);
                        setPreviewReceipt(receiptPreview);
                        setShowReceiptPreview(true);

                        console.log(
                          "🚀 Order Management: Showing receipt preview modal with exact database values",
                        );
                      }}
                      disabled={completePaymentMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t("orders.payment")}
                    </Button>
                    <Button
                      onClick={() => {
                        console.log(
                          "🎯 Points Payment Button Clicked - preparing data",
                        );

                        // Use exact database values without recalculation
                        const pointsOrderData = {
                          ...selectedOrder,
                          // Keep original database values
                          exactSubtotal: Math.floor(
                            Number(selectedOrder.subtotal || 0),
                          ),
                          exactTax: Math.floor(Number(selectedOrder.tax || 0)),
                          exactDiscount: Math.floor(
                            Number(selectedOrder.discount || 0),
                          ),
                          exactTotal: Math.floor(
                            Number(selectedOrder.total || 0),
                          ),
                        };

                        console.log(
                          "💰 Points Payment: Using exact database values:",
                          {
                            orderId: pointsOrderData.id,
                            exactSubtotal: pointsOrderData.exactSubtotal,
                            exactTax: pointsOrderData.exactTax,
                            exactDiscount: pointsOrderData.exactDiscount,
                            exactTotal: pointsOrderData.exactTotal,
                            originalValues: {
                              subtotal: selectedOrder.subtotal,
                              tax: selectedOrder.tax,
                              discount: selectedOrder.discount,
                              total: selectedOrder.total,
                            },
                          },
                        );

                        // Store the exact order data for points payment
                        setSelectedOrder(pointsOrderData);
                        setPointsPaymentOpen(true);
                      }}
                      disabled={completePaymentMutation.isPending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t("orders.pointsPaymentTitle")}
                    </Button>
                  </div>
                )}

              {/* Final Status Display */}
              {selectedOrder?.status === "paid" ||
              selectedOrder?.status === "cancelled" ? (
                <div className="flex justify-center pt-4">
                  {selectedOrder?.status === "paid" ? (
                    <Badge
                      variant="outline"
                      className="px-4 py-2 bg-green-100 text-green-800 border-green-300"
                    >
                      ✅ {t("orders.status.completed")}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="px-4 py-2">
                      ❌ {t("orders.status.cancelled")}
                    </Badge>
                  )}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Methods Dialog */}
      <Dialog open={paymentMethodsOpen} onOpenChange={setPaymentMethodsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("orders.selectPaymentMethod")}</DialogTitle>
            <DialogDescription>
              {t("orders.selectPaymentMethodDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            {getPaymentMethods().map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => handlePayment(method.nameKey)}
                disabled={
                  completePaymentMutation.isPending ||
                  (qrLoading && method.nameKey === "qrCode")
                }
              >
                <span className="text-2xl mr-3">{method.icon}</span>
                <div className="text-left">
                  <p className="font-medium">
                    {qrLoading && method.nameKey === "qrCode"
                      ? t("common.generatingQr")
                      : t(`orders.paymentMethods.${method.nameKey}`)}
                  </p>
                </div>
                {qrLoading && method.nameKey === "qrCode" && (
                  <div className="ml-auto">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                )}
              </Button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setPaymentMethodsOpen(false)}
            >
              {t("orders.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Payment Dialog */}
      <Dialog open={showQRPayment} onOpenChange={setShowQRPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-center justify-center">
              <QrCode className="w-5 h-5" />
              Thanh toán {selectedPaymentMethod?.method?.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQRPaymentClose}
              className="absolute right-0 top-0 h-6 w-6 p-0"
            >
              ✕
            </Button>
            <DialogDescription className="text-center">
              Quét mã QR để hoàn tất thanh toán
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            {/* Order Summary */}
            {selectedOrder && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  {t("orders.orderNumber")}: {selectedOrder.orderNumber}
                </p>
                <p className="text-sm text-gray-600">Số tiền cần thanh toán:</p>
                <p className="text-3xl font-bold text-green-600">
                  {mixedPaymentData
                    ? formatCurrency(mixedPaymentData.remainingAmount)
                    : formatCurrency(Number(selectedOrder.total))}
                </p>
                {mixedPaymentData && (
                  <p className="text-sm text-blue-600">
                    Đã sử dụng {mixedPaymentData.pointsToUse.toLocaleString()}P
                    ( -
                    {(mixedPaymentData.pointsToUse * 1000).toLocaleString(
                      "vi-VN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                    ₫)
                  </p>
                )}
              </div>
            )}

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for Payment"
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 text-center">
              Sử dụng ứng dụng {selectedPaymentMethod?.method?.name} để quét mã
              QR và thực hiện thanh toán
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleQRPaymentClose}
                className="flex-1"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleQRPaymentConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
              >
                Xác nhận thanh toán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Points Payment Dialog */}
      <Dialog open={pointsPaymentOpen} onOpenChange={setPointsPaymentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              {t("orders.pointsPaymentTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("orders.pointsPaymentDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Customer Selection */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Thông tin đơn hàng
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số đơn hàng:</span>
                      <span className="font-medium">
                        {selectedOrder.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Math.floor(
                          Number(selectedOrder.total || 0),
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </div>
                  </div>

                  {/* Customer Search */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Tìm kiếm khách hàng
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className="pl-10"
                        placeholder="Tìm theo tên, số điện thoại hoặc mã khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Customer List */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Danh sách khách hàng
                    </Label>
                    <ScrollArea className="h-64 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 border ${
                                selectedCustomer?.id === customer.id
                                  ? "bg-blue-50 border-blue-200 shadow-sm"
                                  : "border-gray-200"
                              }`}
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <div className="font-medium text-gray-900">
                                {customer.name}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                📞 {customer.phone} | 🆔 {customer.customerId}
                              </div>
                              <div
                                className={`text-sm mt-1 ${
                                  (customer.points || 0) > 0
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              >
                                💎 Điểm có sẵn:{" "}
                                {(customer.points || 0).toLocaleString()}P{" "}
                                {((customer.points || 0) * 1000).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                ₫)
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Không tìm thấy khách hàng</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                {/* Right Column - Payment Summary */}
                <div className="space-y-4">
                  {selectedCustomer ? (
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Thông tin thanh toán
                      </h4>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-600">Khách hàng:</span>
                          <span className="font-medium text-gray-900">
                            {selectedCustomer.name}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-600">Điểm có sẵn:</span>
                          <span className="font-medium text-green-600">
                            {(selectedCustomer.points || 0).toLocaleString()}P
                            (≈{" "}
                            {(
                              (selectedCustomer.points || 0) * 1000
                            ).toLocaleString("vi-VN")}{" "}
                            ₫)
                          </span>
                        </div>

                        {(() => {
                          const customerPoints = selectedCustomer.points || 0;
                          const orderTotal = Math.floor(
                            Number(selectedOrder.total || 0),
                          );
                          const pointsValue = customerPoints * 1000;

                          if (pointsValue >= orderTotal) {
                            const pointsNeeded = Math.ceil(orderTotal / 1000);
                            return (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                                  <span className="text-green-700">
                                    Điểm sử dụng:
                                  </span>
                                  <span className="font-medium text-green-700">
                                    {pointsNeeded.toLocaleString()}P{" "}
                                    {(pointsNeeded * 1000).toLocaleString(
                                      "vi-VN",
                                    )}{" "}
                                    ₫)
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                                  <span className="text-gray-600">
                                    Điểm còn lại:
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {(
                                      customerPoints - pointsNeeded
                                    ).toLocaleString()}
                                    P
                                  </span>
                                </div>
                                <div className="text-center p-4 bg-green-100 rounded-lg border border-green-200">
                                  <div className="text-green-700 font-medium flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Đủ điểm để thanh toán toàn bộ đơn hàng
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            const remainingAmount = orderTotal - pointsValue;
                            return (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border border-orange-200">
                                  <span className="text-orange-700">
                                    Điểm sử dụng:
                                  </span>
                                  <span className="font-medium text-orange-700">
                                    {customerPoints.toLocaleString()}P (={" "}
                                    {pointsValue.toLocaleString("vi-VN")} ₫)
                                  </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border border-red-200">
                                  <span className="text-red-700">
                                    Cần thanh toán thêm:
                                  </span>
                                  <span className="font-bold text-red-700">
                                    {remainingAmount.toLocaleString("vi-VN")} ₫
                                  </span>
                                </div>
                                <div className="text-center p-4 bg-yellow-100 rounded-lg border border-yellow-200">
                                  <div className="text-yellow-700 font-medium flex items-center justify-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Không đủ điểm, cần thanh toán hỗn hợp
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">
                        Chọn khách hàng để thanh toán
                      </h4>
                      <p className="text-gray-500">
                        Vui lòng chọn một khách hàng từ danh sách bên trái
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPointsPaymentOpen(false);
                    setSelectedCustomer(null);
                    setSearchTerm("");
                  }}
                  className="px-6"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handlePointsPayment}
                  disabled={
                    !selectedCustomer || pointsPaymentMutation.isPending
                  }
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {pointsPaymentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Đang xử lý...
                    </div>
                  ) : selectedCustomer &&
                    (selectedCustomer.points || 0) * 1000 >=
                      Math.floor(Number(selectedOrder.total || 0)) ? (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Thanh toán bằng điểm
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Thanh toán hỗn hợp
                    </div>
                  )}
                </Button>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal - Step 1: "Xem trước hóa đơn" */}
      <ReceiptModal
        isOpen={showReceiptPreview}
        onClose={() => {
          console.log("🔴 Order Management: Closing receipt preview modal");
          setShowReceiptPreview(false);
          setPreviewReceipt(null);
          setOrderForPayment(null);
          setShowPaymentMethodModal(false);
        }}
        onConfirm={() => {
          console.log(
            "📄 Order Management: Receipt preview confirmed, starting payment flow",
          );

          if (!previewReceipt || !orderForPayment) {
            console.error("❌ Missing preview data for payment flow");
            toast({
              title: "Lỗi",
              description: "Không thể tiếp tục thanh toán. Vui lòng thử lại.",
              variant: "destructive",
            });
            return;
          }

          console.log("💳 Opening payment method modal with order:", {
            orderId: orderForPayment.id,
            exactTotal: orderForPayment.exactTotal,
            hasItems: orderForPayment.orderItems?.length || 0,
          });

          // Close preview and show payment method modal
          setShowReceiptPreview(false);
          setShowPaymentMethodModal(true);
        }}
        isPreview={true}
        receipt={previewReceipt}
        cartItems={
          previewReceipt?.orderItems?.map((item: any) => ({
            id: item.productId || item.id,
            name: item.productName || item.name,
            price: parseFloat(item.price || item.unitPrice || "0"),
            quantity: parseInt(item.quantity || "1"),
            sku: item.sku || `SP${item.productId}`,
            taxRate: (() => {
              const product = Array.isArray(products)
                ? products.find((p: any) => p.id === item.productId)
                : null;
              return product?.taxRate ? parseFloat(product.taxRate) : 10;
            })(),
            discount: item.discount || "0",
          })) || []
        }
        total={
          previewReceipt
            ? parseFloat(
                previewReceipt.exactTotal || previewReceipt.total || "0",
              )
            : 0
        }
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          console.log("🔴 Payment Method Modal closed");
          setShowPaymentMethodModal(false);
          setOrderForPayment(null);
          setPreviewReceipt(null);
        }}
        onSelectMethod={(method, data) => {
          console.log(
            "🎯 Order Management payment method selected:",
            method,
            data,
          );
          console.log("🔍 Current orderForPayment state:", {
            orderForPayment: !!orderForPayment,
            orderForPaymentId: orderForPayment?.id,
            calculatedTotal: orderForPayment?.calculatedTotal,
            itemsCount: orderForPayment?.processedItems?.length || 0,
          });

          setShowPaymentMethodModal(false);

          // Handle different payment completion scenarios
          if (method === "paymentCompleted" && data?.success) {
            console.log("✅ Payment completed successfully from payment modal");

            // Close all modals
            setOrderForPayment(null);
            setOrderDetailsOpen(null);
            setSelectedOrder(null);
            setPreviewReceipt(null);

            // Only show receipt if explicitly provided and not already shown
            if (data.receipt && data.shouldShowReceipt !== false) {
              console.log("📄 Showing receipt from payment completion");
              setSelectedReceipt(data.receipt);
              setShowReceiptModal(true);
            }

            // Force UI refresh
            queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });
            queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });

            toast({
              title: "Thành công",
              description: "Đơn hàng đã được thanh toán thành công",
            });

            return;
          }

          if (method === "paymentError" && data?.error) {
            console.error("❌ Payment failed from payment modal:", data.error);

            toast({
              title: "Lỗi thanh toán",
              description: data.error || "Không thể hoàn tất thanh toán",
              variant: "destructive",
            });

            return;
          }

          // For E-Invoice flows that already handled receipt display, don't show again
          if (method === "einvoice" && data?.receiptAlreadyShown) {
            console.log(
              "📄 E-Invoice already handled receipt, skipping duplicate",
            );
            setOrderForPayment(null);
            setPreviewReceipt(null);
            return;
          }

          // If payment method returns receipt data (like from "phát hành sau"), handle it
          if (data && data.receipt && !data.receiptAlreadyShown) {
            console.log(
              "📄 Order Management: Payment method returned receipt data, showing receipt",
            );
            setSelectedReceipt(data.receipt);
            setShowReceiptModal(true);
            setOrderForPayment(null);
            setPreviewReceipt(null);
          } else {
            // For other payment methods, proceed with payment completion
            console.log("💳 Processing payment for order:", {
              orderId: orderForPayment?.id,
              paymentMethod: method.nameKey || method,
              calculatedTotal: orderForPayment?.calculatedTotal,
            });

            if (orderForPayment?.id && orderForPayment?.calculatedTotal > 0) {
              completePaymentMutation.mutate({
                orderId: orderForPayment.id,
                paymentMethod: method.nameKey || method,
              });
            } else {
              console.error("❌ Invalid order data for payment:", {
                orderId: orderForPayment?.id,
                calculatedTotal: orderForPayment?.calculatedTotal,
              });
              toast({
                title: "Lỗi",
                description: "Dữ liệu đơn hàng không hợp lệ để thanh toán",
                variant: "destructive",
              });
            }
          }
        }}
        total={orderForPayment?.total ? Math.round(orderForPayment.total) : 0}
        onShowEInvoice={() => setShowEInvoiceModal(true)}
        cartItems={
          orderForPayment?.processedItems?.map((item: any) => ({
            id: item.productId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            sku: item.sku,
            taxRate: item.taxRate,
            afterTaxPrice: item.afterTaxPrice,
            discount: item.discount,
          })) || []
        }
        orderForPayment={orderForPayment}
        products={products}
        receipt={previewReceipt}
      />

      {/* E-Invoice Modal */}
      {showEInvoiceModal && orderForPayment && (
        <EInvoiceModal
          isOpen={showEInvoiceModal}
          onClose={() => {
            setShowEInvoiceModal(false);
            setOrderForPayment(null);
          }}
          onConfirm={handleEInvoiceConfirm}
          total={orderForPayment?.total ? Math.round(orderForPayment.total) : 0}
          cartItems={
            orderForPayment?.processedItems?.map((item: any) => ({
              id: item.productId,
              name: item.productName,
              price: item.price,
              quantity: item.quantity,
              sku: item.sku,
              taxRate: item.taxRate,
              afterTaxPrice: item.afterTaxPrice,
            })) || []
          }
          source="order-management"
          orderId={orderForPayment.id}
        />
      )}

      {/* Receipt Modal - Final receipt after payment */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={async () => {
          console.log(
            "🔴 Order Management: Closing final receipt modal safely",
          );

          try {
            // Step 1: Close modal immediately
            setShowReceiptModal(false);
            setSelectedReceipt(null);

            // Step 2: Force data refresh before clearing states
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
              queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
              queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] }),
              queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] }),
            ]);

            // Step 3: Clear modal states gradually to prevent white screen
            setTimeout(() => {
              setOrderForPayment(null);
              setShowPaymentMethodModal(false);
              setShowEInvoiceModal(false);
            }, 50);

            setTimeout(() => {
              setShowReceiptPreview(false);
              setPreviewReceipt(null);
              setOrderDetailsOpen(false);
            }, 100);

            setTimeout(() => {
              setSelectedOrder(null);
              setPaymentMethodsOpen(false);
              setShowQRPayment(false);
              setPointsPaymentOpen(false);
              setMixedPaymentOpen(false);
            }, 150);

            // Step 4: Send global refresh signal
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("orderManagementRefresh", {
                  detail: {
                    source: "receipt_modal_close",
                    timestamp: new Date().toISOString(),
                  },
                }),
              );
            }

            console.log(
              "✅ Order Management: Receipt modal closed safely with gradual state clearing",
            );
          } catch (error) {
            console.error("❌ Error during receipt modal close:", error);
            // Fallback: just clear states without refresh
            setOrderForPayment(null);
            setShowPaymentMethodModal(false);
            setShowEInvoiceModal(false);
            setShowReceiptPreview(false);
            setPreviewReceipt(null);
            setOrderDetailsOpen(false);
            setSelectedOrder(null);
            setPaymentMethodsOpen(false);
            setShowQRPayment(false);
            setPointsPaymentOpen(false);
            setMixedPaymentOpen(false);
          }
        }}
        receipt={selectedReceipt}
        cartItems={
          selectedReceipt?.items?.map((item: any) => ({
            id: item.productId || item.id,
            name: item.productName || item.name,
            price: parseFloat(item.price || item.unitPrice || "0"),
            quantity: item.quantity,
            sku: item.sku || `SP${item.productId}`,
            taxRate: (() => {
              const product = Array.isArray(products)
                ? products.find((p: any) => p.id === item.productId)
                : null;
              return product?.taxRate ? parseFloat(product.taxRate) : 10;
            })(),
            discount: item.discount || "0",
          })) || []
        }
        autoClose={true}
      />
    </div>
  );
}
