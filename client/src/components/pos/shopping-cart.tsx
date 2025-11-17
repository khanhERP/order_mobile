import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart as CartIcon,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { PaymentMethodModal } from "./payment-method-modal";
import { ReceiptModal } from "./receipt-modal";
import { EInvoiceModal } from "./einvoice-modal";
import type { CartItem } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onCheckout: (paymentData: any) => void;
  isProcessing: boolean;
  orders?: Array<{ id: string; name: string; cart: CartItem[] }>;
  activeOrderId?: string;
  onCreateNewOrder?: () => void;
  onSwitchOrder?: (orderId: string) => void;
  onRemoveOrder?: (orderId: string) => void;
}

export function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isProcessing,
  orders = [],
  activeOrderId,
  onCreateNewOrder,
  onSwitchOrder,
  onRemoveOrder,
}: ShoppingCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("bankTransfer");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>(""); // This state is still used for the input value itself
  const [discount, setDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [currentOrderForPayment, setCurrentOrderForPayment] =
    useState<any>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedCardMethod, setSelectedCardMethod] = useState<string>("");
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);
  const { t } = useTranslation();

  // State for Receipt Modal and E-Invoice Modal integration
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false); // Added state for PaymentMethodModal
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Flag to prevent duplicate processing

  // New state variables for order management flow
  const [lastCartItems, setLastCartItems] = useState<CartItem[]>([]);
  const [orderForPayment, setOrderForPayment] = useState(null);

  // State to manage the visibility of the print dialog
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // State for cart collapse/expand
  const [isCartCollapsed, setIsCartCollapsed] = useState(false);

  // Fetch store settings to check price_include_tax setting
  const { data: storeSettings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const response = await fetch("https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/store-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch store settings");
      }
      return response.json();
    },
  });

  // Get priceIncludesTax setting from store settings
  const priceIncludesTax = storeSettings?.priceIncludesTax === true;

  // State to manage discounts for each order
  const [orderDiscounts, setOrderDiscounts] = useState<{
    [orderId: string]: string;
  }>({});

  // Calculate discount for the current active order
  const currentOrderDiscount = activeOrderId
    ? orderDiscounts[activeOrderId] || "0"
    : "0";

  const subtotal = cart.reduce((sum, item) => {
    const unitPrice = parseFloat(item.price);
    const quantity = item.quantity;
    const taxRate = parseFloat(item.taxRate || "0") / 100;
    const orderDiscount = parseFloat(currentOrderDiscount || "0");

    // Calculate discount for this item
    let itemDiscountAmount = 0;
    if (orderDiscount > 0) {
      const totalBeforeDiscount = cart.reduce((total, cartItem) => {
        return total + parseFloat(cartItem.price) * cartItem.quantity;
      }, 0);

      const currentIndex = cart.findIndex(
        (cartItem) => cartItem.id === item.id,
      );
      const isLastItem = currentIndex === cart.length - 1;

      if (isLastItem) {
        // Last item: total discount - sum of all previous discounts
        let previousDiscounts = 0;
        for (let i = 0; i < cart.length - 1; i++) {
          const prevItem = cart[i];
          const prevItemTotal = parseFloat(prevItem.price) * prevItem.quantity;
          const prevItemDiscount =
            totalBeforeDiscount > 0
              ? Math.round(
                  (orderDiscount * prevItemTotal) / totalBeforeDiscount,
                )
              : 0;
          previousDiscounts += prevItemDiscount;
        }
        itemDiscountAmount = orderDiscount - previousDiscounts;
      } else {
        // Regular calculation for non-last items
        const itemTotal = unitPrice * quantity;
        itemDiscountAmount =
          totalBeforeDiscount > 0
            ? Math.round((orderDiscount * itemTotal) / totalBeforeDiscount)
            : 0;
      }
    }

    if (priceIncludesTax && taxRate > 0) {
      // When price includes tax:
      // giá bao gồm thuế = (price - (discount/quantity)) * quantity
      const discountPerUnit = itemDiscountAmount / quantity;
      const adjustedPrice = Math.max(0, unitPrice - discountPerUnit);
      const giaGomThue = adjustedPrice * quantity;
      // subtotal = giá bao gồm thuế / (1 + (taxRate / 100)) (làm tròn)
      const itemSubtotal = Math.round(giaGomThue / (1 + taxRate));
      return sum + itemSubtotal;
    } else {
      // When price doesn't include tax:
      // subtotal = (price - (discount/quantity)) * quantity
      const discountPerUnit = itemDiscountAmount / quantity;
      const adjustedPrice = Math.max(0, unitPrice - discountPerUnit);
      const itemSubtotal = adjustedPrice * quantity;
      return sum + itemSubtotal;
    }
  }, 0);

  const tax = cart.reduce((sum, item, index) => {
    if (item.taxRate && parseFloat(item.taxRate) > 0) {
      const originalPrice = parseFloat(item.price);
      const quantity = item.quantity;
      const taxRate = parseFloat(item.taxRate) / 100;
      const orderDiscount = parseFloat(currentOrderDiscount || "0");

      // Calculate discount for this item
      let itemDiscountAmount = 0;
      if (orderDiscount > 0) {
        const totalBeforeDiscount = cart.reduce((total, cartItem) => {
          return total + parseFloat(cartItem.price) * cartItem.quantity;
        }, 0);

        const currentIndex = cart.findIndex(
          (cartItem) => cartItem.id === item.id,
        );
        const isLastItem = currentIndex === cart.length - 1;

        if (isLastItem) {
          // Last item: total discount - sum of all previous discounts
          let previousDiscounts = 0;
          for (let i = 0; i < cart.length - 1; i++) {
            const prevItem = cart[i];
            const prevItemTotal =
              parseFloat(prevItem.price) * prevItem.quantity;
            const prevItemDiscount =
              totalBeforeDiscount > 0
                ? Math.round(
                    (orderDiscount * prevItemTotal) / totalBeforeDiscount,
                  )
                : 0;
            previousDiscounts += prevItemDiscount;
          }
          itemDiscountAmount = orderDiscount - previousDiscounts;
        } else {
          // Regular calculation for non-last items
          const itemTotal = originalPrice * quantity;
          itemDiscountAmount =
            totalBeforeDiscount > 0
              ? Math.round((orderDiscount * itemTotal) / totalBeforeDiscount)
              : 0;
        }
      }

      let itemTax = 0;

      if (priceIncludesTax) {
        // When price includes tax:
        // giá bao gồm thuế = (price - (discount/quantity)) * quantity
        const discountPerUnit = itemDiscountAmount / quantity;
        const adjustedPrice = Math.max(0, originalPrice - discountPerUnit);
        const giaGomThue = adjustedPrice * quantity;
        // subtotal = giá bao gồm thuế / (1 + (taxRate / 100)) (làm tròn)
        const tamTinh = Math.round(giaGomThue / (1 + taxRate));
        // tax = giá bao gồm thuế - subtotal
        itemTax = giaGomThue - tamTinh;
      } else {
        // When price doesn't include tax:
        // subtotal = (price - (discount/quantity)) * quantity
        const discountPerUnit = itemDiscountAmount / quantity;
        const adjustedPrice = Math.max(0, originalPrice - discountPerUnit);
        const tamTinh = adjustedPrice * quantity;
        // tax = subtotal * (taxRate / 100) (làm tròn)
        itemTax = Math.round(tamTinh * taxRate);
      }

      return sum + Math.max(0, itemTax);
    }
    return sum;
  }, 0);
  const discountValue = parseFloat(discountAmount || "0");
  const total = Math.round(subtotal + tax);
  const finalTotal = Math.max(0, total - discountValue);
  const change =
    paymentMethod === "cash"
      ? Math.max(0, parseFloat(amountReceived || "0") - finalTotal)
      : 0;

  // Helper functions for receipt generation (used in handlePaymentMethodSelect)
  const calculateSubtotal = () =>
    cart.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const calculateTax = () =>
    cart.reduce((sum, item, index) => {
      if (item.taxRate && parseFloat(item.taxRate) > 0) {
        const unitPrice = parseFloat(item.price);
        const quantity = item.quantity;
        const taxRate = parseFloat(item.taxRate) / 100;

        let basePrice;
        if (priceIncludesTax) {
          // When price includes tax: base price = unit price / (1 + tax rate)
          basePrice = unitPrice / (1 + taxRate);
        } else {
          // When price doesn't include tax: use unit price as base
          basePrice = unitPrice;
        }

        const subtotal = basePrice * quantity;

        // Calculate discount for this item
        const orderDiscount = parseFloat(discountAmount || "0");
        let itemDiscountAmount = 0;

        if (orderDiscount > 0) {
          const currentIndex = cart.findIndex(
            (cartItem) => cartItem.id === item.id,
          );
          const isLastItem = currentIndex === cart.length - 1;

          if (isLastItem) {
            // Last item: total discount - sum of all previous discounts
            let previousDiscounts = 0;
            const totalBeforeDiscount = cart.reduce((sum, itm) => {
              const itmUnitPrice = parseFloat(itm.price);
              const itmTaxRate = parseFloat(itm.taxRate || "0") / 100;
              let itmBasePrice;

              if (priceIncludesTax && itmTaxRate > 0) {
                itmBasePrice = itmUnitPrice / (1 + itmTaxRate);
              } else {
                itmBasePrice = itmUnitPrice;
              }

              return sum + itmBasePrice * itm.quantity;
            }, 0);

            for (let i = 0; i < cart.length - 1; i++) {
              const prevItem = cart[i];
              const prevUnitPrice = parseFloat(prevItem.price);
              const prevTaxRate = parseFloat(prevItem.taxRate || "0") / 100;
              let prevBasePrice;

              if (priceIncludesTax && prevTaxRate > 0) {
                prevBasePrice = prevUnitPrice / (1 + prevTaxRate);
              } else {
                prevBasePrice = prevUnitPrice;
              }

              const prevItemSubtotal = prevBasePrice * prevItem.quantity;
              const prevItemDiscount =
                totalBeforeDiscount > 0
                  ? Math.round(
                      (orderDiscount * prevItemSubtotal) / totalBeforeDiscount,
                    )
                  : 0;
              previousDiscounts += prevItemDiscount;
            }

            itemDiscountAmount = orderDiscount - previousDiscounts;
          } else {
            // Regular calculation for non-last items
            const totalBeforeDiscount = cart.reduce((sum, itm) => {
              const itmUnitPrice = parseFloat(itm.price);
              const itmTaxRate = parseFloat(itm.taxRate || "0") / 100;
              let itmBasePrice;

              if (priceIncludesTax && itmTaxRate > 0) {
                itmBasePrice = itmUnitPrice / (1 + itmTaxRate);
              } else {
                itmBasePrice = itmUnitPrice;
              }

              return sum + itmBasePrice * itm.quantity;
            }, 0);

            itemDiscountAmount =
              totalBeforeDiscount > 0
                ? Math.round((orderDiscount * subtotal) / totalBeforeDiscount)
                : 0;
          }
        }

        // Apply discount and calculate final tax
        const taxableAmount = Math.max(0, subtotal - itemDiscountAmount);

        if (priceIncludesTax) {
          // When price includes tax: tax = unit price - base price
          return sum + Math.round(unitPrice * quantity - taxableAmount);
        } else {
          // When price doesn't include tax, use standard calculation
          return sum + Math.round(taxableAmount * taxRate);
        }
      }
      return sum;
    }, 0);
  const calculateDiscount = () => parseFloat(discountAmount || "0");
  const calculateTotal = () =>
    Math.max(
      0,
      Math.round(calculateSubtotal() + calculateTax()) - calculateDiscount(),
    );

  // Fetch products to calculate tax correctly based on afterTaxPrice
  const { data: products } = useQuery<any[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
  });

  // Function to calculate display price based on store settings
  const getDisplayPrice = (item: any): number => {
    const basePrice = parseFloat(item.price);

    // if (priceIncludesTax) {
    //   // If store setting says to include tax, calculate price with tax
    //   const taxRate = parseFloat(item.taxRate || "0");
    //   return basePrice * (1 + taxRate / 100);
    // }

    // If store setting says not to include tax, show base price
    return basePrice;
  };

  // Single WebSocket connection for both refresh signals and cart broadcasting
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    console.log("📡 Shopping Cart: Initializing single WebSocket connection");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;

    let reconnectTimer: NodeJS.Timeout | null = null;
    let shouldReconnect = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log(
          "📡 Shopping Cart: Max reconnection attempts reached, giving up",
        );
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        // Make wsRef available globally for external access if needed (e.g., in discount onChange)
        if (typeof window !== "undefined") {
          (window as any).wsRef = wsRef.current;
        }

        ws.onopen = () => {
          console.log("📡 Shopping Cart: WebSocket connected");
          reconnectAttempts = 0;

          // Register as shopping cart client
          ws.send(
            JSON.stringify({
              type: "register_shopping_cart",
              timestamp: new Date().toISOString(),
            }),
          );

          // Send initial cart state if cart has items
          if (cart.length > 0) {
            console.log("📡 Shopping Cart: Sending initial cart state");
            broadcastCartUpdate();
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📩 Shopping Cart: Received WebSocket message:", data);

            if (
              data.type === "payment_success" ||
              data.type === "popup_close" ||
              data.type === "force_refresh" ||
              data.type === "einvoice_published"
            ) {
              console.log(
                "🔄 Shopping Cart: Refreshing data due to WebSocket signal",
              );

              if (
                (data.type === "popup_close" && data.success) ||
                data.type === "payment_success" ||
                data.type === "einvoice_published" ||
                data.type === "force_refresh"
              ) {
                console.log("🧹 Shopping Cart: Clearing cart due to signal");
                onClearCart();

                // Clear any active orders
                if (
                  typeof window !== "undefined" &&
                  (window as any).clearActiveOrder
                ) {
                  (window as any).clearActiveOrder();
                }
              }
            }
          } catch (error) {
            console.error(
              "❌ Shopping Cart: Error processing WebSocket message:",
              error,
            );
          }
        };

        ws.onclose = () => {
          console.log("📡 Shopping Cart: WebSocket disconnected");
          wsRef.current = null;
          if (typeof window !== "undefined") {
            (window as any).wsRef = null;
          }
          if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(2000 * reconnectAttempts, 10000);
            reconnectTimer = setTimeout(connectWebSocket, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ Shopping Cart: WebSocket error:", error);
          wsRef.current = null;
          if (typeof window !== "undefined") {
            (window as any).wsRef = null;
          }
        };
      } catch (error) {
        console.error("❌ Shopping Cart: Failed to connect WebSocket:", error);
        if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(2000 * reconnectAttempts, 10000);
          reconnectTimer = setTimeout(connectWebSocket, delay);
        }
      }
    };

    connectWebSocket();

    return () => {
      console.log("🔗 Shopping Cart: Cleaning up WebSocket connection");
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
      if (typeof window !== "undefined") {
        (window as any).wsRef = null;
      }
    };
  }, []);

  // Function to broadcast cart updates to customer display
  const broadcastCartUpdate = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Ensure cart items have proper names before broadcasting
      const validatedCart = cart.map((item) => ({
        ...item,
        name:
          item.name ||
          item.productName ||
          item.product?.name ||
          `Sản phẩm ${item.id}`,
        productName:
          item.name ||
          item.productName ||
          item.product?.name ||
          `Sản phẩm ${item.id}`,
        price: item.price || "0",
        quantity: item.quantity || 1,
        total: item.total || "0",
      }));

      // Get current discount for active order
      const currentDiscount = activeOrderId
        ? parseFloat(orderDiscounts[activeOrderId] || "0")
        : parseFloat(discountAmount || "0");

      const cartUpdateMessage = {
        type: "cart_update",
        cart: validatedCart,
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount: currentDiscount, // Add discount to broadcast message
        orderNumber: activeOrderId || `ORD-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      console.log("📡 Shopping Cart: Broadcasting cart update:", {
        cartItems: validatedCart.length,
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount: currentDiscount,
      });

      try {
        wsRef.current.send(JSON.stringify(cartUpdateMessage));
      } catch (error) {
        console.error(
          "📡 Shopping Cart: Error broadcasting cart update:",
          error,
        );
      }
    }
  }, [
    cart,
    subtotal,
    tax,
    total,
    activeOrderId,
    orderDiscounts,
    discountAmount,
  ]);

  // Broadcast cart updates when cart changes
  useEffect(() => {
    const timer = setTimeout(() => {
      broadcastCartUpdate();
    }, 100);

    return () => clearTimeout(timer);
  }, [cart, subtotal, tax, total, broadcastCartUpdate]);

  const getPaymentMethods = () => {
    // Only return cash and bank transfer payment methods
    const paymentMethods = [
      {
        id: 1,
        name: "Tiền mặt",
        nameKey: "cash",
        type: "cash",
        enabled: true,
        icon: "💵",
      },
      {
        id: 2,
        name: "Chuyển khoản",
        nameKey: "bankTransfer",
        type: "transfer",
        enabled: true,
        icon: "🏦",
      },
    ];

    return paymentMethods;
  };

  // Handler for when receipt preview is confirmed - move to payment method selection
  const handleReceiptPreviewConfirm = () => {
    console.log(
      "🎯 POS: Receipt preview confirmed, showing payment method modal",
    );

    // Update receipt preview with correct tax calculation before proceeding
    if (previewReceipt && orderForPayment) {
      const updatedReceipt = {
        ...previewReceipt,
        tax: tax.toString(),
        exactTax: tax,
        total: total.toString(),
        exactTotal: total,
      };

      const updatedOrder = {
        ...orderForPayment,
        tax: tax,
        exactTax: tax,
        total: total,
        exactTotal: total,
      };

      setPreviewReceipt(updatedReceipt);
      setOrderForPayment(updatedOrder);

      console.log("🔧 Updated receipt and order with correct tax:", {
        tax: tax,
        total: total,
        updatedReceipt: updatedReceipt,
        updatedOrder: updatedOrder,
      });
    }

    setShowReceiptPreview(false);
    setShowPaymentModal(true);
  };

  // Handler for when receipt preview is cancelled
  const handleReceiptPreviewCancel = () => {
    console.log("❌ POS: Receipt preview cancelled");
    setShowReceiptPreview(false);
    setPreviewReceipt(null);
    setOrderForPayment(null);
  };

  // Handler for payment method selection
  const handlePaymentMethodSelect = async (method: string, data?: any) => {
    console.log("🎯 POS: Payment method selected:", method, data);

    if (method === "paymentCompleted" && data?.success) {
      console.log("✅ POS: Payment completed successfully", data);

      // Close payment modal
      setShowPaymentModal(false);

      // CRITICAL: Clear cart immediately after successful payment
      console.log("🧹 POS: Clearing cart after successful payment");
      onClearCart();

      // Clear any active orders
      if (typeof window !== "undefined" && (window as any).clearActiveOrder) {
        (window as any).clearActiveOrder();
      }

      // Reset states
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setLastCartItems([]);

      // Show final receipt if needed
      if (data.shouldShowReceipt !== false) {
        console.log("📋 POS: Showing final receipt modal");
        setSelectedReceipt(data.receipt || null);
        setShowReceiptModal(true);
      }

      // Send WebSocket signal for refresh
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "payment_success",
              success: true,
              source: "shopping-cart",
              timestamp: new Date().toISOString(),
            }),
          );
          setTimeout(() => ws.close(), 100);
        };
      } catch (error) {
        console.warn("⚠️ WebSocket signal failed (non-critical):", error);
      }

      console.log("🎉 POS: Payment flow completed successfully");
    } else if (method === "paymentError") {
      console.error("❌ POS: Payment failed", data);

      // Close payment modal but keep cart
      setShowPaymentModal(false);

      // Reset states
      setPreviewReceipt(null);
      setOrderForPayment(null);
    } else {
      // For other method selections, close payment modal
      setShowPaymentModal(false);
    }
  };

  const handleCheckout = async () => {
    console.log("=== POS CHECKOUT STARTED ===");
    console.log("Cart before checkout:", cart);
    console.log("Cart length:", cart.length);
    console.log("Current totals:", { subtotal, tax, total });

    if (cart.length === 0) {
      alert("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.");
      return;
    }

    // Use the EXACT same calculation logic as the cart display
    const calculatedSubtotal = subtotal; // Use the already calculated subtotal from cart display
    const calculatedTax = tax; // Use the already calculated tax from cart display
    const baseTotal = Math.round(calculatedSubtotal + calculatedTax);
    const finalDiscount = parseFloat(currentOrderDiscount || "0");
    const finalTotal = Math.max(0, baseTotal);

    console.log("🔍 CHECKOUT CALCULATION DEBUG - Using exact cart logic:");
    console.log("Calculated subtotal:", calculatedSubtotal);
    console.log("Calculated tax (with discount consideration):", calculatedTax);
    console.log("Base total (subtotal + tax):", baseTotal);
    console.log("Discount amount:", finalDiscount);
    console.log("Final total (after discount):", finalTotal);

    if (calculatedSubtotal === 0 || finalTotal < 0) {
      console.error(
        "❌ CRITICAL ERROR: Invalid totals calculated, cannot proceed with checkout",
      );
      alert("Lỗi: Tổng tiền không hợp lệ. Vui lòng kiểm tra lại giỏ hàng.");
      return;
    }

    // Step 1: Use current cart items with proper structure for E-invoice
    const cartItemsForEInvoice = cart.map((item) => {
      const unitPrice = parseFloat(item.price);
      const quantity = item.quantity;
      const taxRate = parseFloat(item.taxRate || "0") / 100;
      const orderDiscount = parseFloat(currentOrderDiscount || "0");

      // Calculate discount for this item
      let itemDiscountAmount = 0;
      let discountPerUnit = 0;

      if (orderDiscount > 0) {
        const totalBeforeDiscount = cart.reduce((total, cartItem) => {
          return total + parseFloat(cartItem.price) * cartItem.quantity;
        }, 0);

        const currentIndex = cart.findIndex(
          (cartItem) => cartItem.id === item.id,
        );
        const isLastItem = currentIndex === cart.length - 1;

        if (isLastItem) {
          let previousDiscounts = 0;
          for (let i = 0; i < cart.length - 1; i++) {
            const prevItem = cart[i];
            const prevItemTotal =
              parseFloat(prevItem.price) * prevItem.quantity;
            const prevItemDiscount =
              totalBeforeDiscount > 0
                ? Math.round(
                    (orderDiscount * prevItemTotal) / totalBeforeDiscount,
                  )
                : 0;
            previousDiscounts += prevItemDiscount;
          }
          itemDiscountAmount = Math.max(0, orderDiscount - previousDiscounts);
        } else {
          const itemTotal = unitPrice * quantity;
          itemDiscountAmount =
            totalBeforeDiscount > 0
              ? Math.round((orderDiscount * itemTotal) / totalBeforeDiscount)
              : 0;
        }
        discountPerUnit = quantity > 0 ? itemDiscountAmount / quantity : 0;
      }

      let totalAfterDiscount;
      let originalTotal;

      if (priceIncludesTax) {
        originalTotal = unitPrice * quantity;
        const adjustedPrice = Math.max(0, unitPrice - discountPerUnit);
        const giaGomThue = adjustedPrice * quantity;
        totalAfterDiscount = Math.round(giaGomThue / (1 + taxRate));
      } else {
        originalTotal = unitPrice * quantity;
        const adjustedPrice = Math.max(0, unitPrice - discountPerUnit);
        totalAfterDiscount = adjustedPrice * quantity;
      }

      return {
        id: item.id,
        name: item.name,
        price: unitPrice,
        quantity: item.quantity,
        sku: item.sku || `FOOD${String(item.id).padStart(5, "0")}`,
        taxRate: item.taxRate || "0",
        afterTaxPrice: item.afterTaxPrice,
        discount: itemDiscountAmount.toString(), // Placeholder, actual discount applied per item for E-invoice needs careful calculation
        discountAmount: itemDiscountAmount.toString(), // This is the calculated discount for this item
        discountPerUnit: discountPerUnit.toString(),
        originalPrice: item.originalPrice || unitPrice.toString(),
        totalAfterDiscount: totalAfterDiscount.toString(),
        originalTotal: originalTotal.toString(),
      };
    });

    console.log("✅ Cart items prepared for E-invoice:", cartItemsForEInvoice);
    console.log(
      "✅ Cart items count for E-invoice:",
      cartItemsForEInvoice.length,
    );

    // Validate cart items have valid prices
    const hasValidItems = cartItemsForEInvoice.every(
      (item) => item.price >= 0 && item.quantity > 0,
    ); // Allow price 0, but quantity must be > 0
    if (!hasValidItems) {
      console.error(
        "❌ CRITICAL ERROR: Some cart items have invalid price or quantity",
      );
      alert(
        "Lỗi: Có sản phẩm trong giỏ hàng có giá hoặc số lượng không hợp lệ.",
      );
      return;
    }

    // Step 2: Create receipt preview data with EXACT calculated totals
    const receiptPreview = {
      id: `temp-${Date.now()}`,
      orderNumber: `POS-${Date.now()}`,
      customerName: "Khách hàng lẻ",
      tableId: null,
      items: cartItemsForEInvoice.map((item) => ({
        id: item.id,
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        total: item.totalAfterDiscount.toString(),
        productSku: item.sku,
        price: item.price.toString(),
        sku: item.sku,
        taxRate: item.taxRate,
        afterTaxPrice: item.afterTaxPrice,
        discount: item.discount,
        discountAmount: item.discountAmount,
        discountPerUnit: item.discountPerUnit.toString(),
        originalPrice: item.originalPrice,
        // Add original total before discount for reference
        originalTotal: (item.price * item.quantity).toString(),
      })),
      subtotal: Math.floor(calculatedSubtotal).toString(),
      tax: calculatedTax.toString(),
      discount: finalDiscount.toString(),
      total: finalTotal.toString(),
      exactSubtotal: Math.floor(calculatedSubtotal),
      exactTax: calculatedTax,
      exactDiscount: finalDiscount,
      exactTotal: finalTotal,
      status: "pending",
      paymentStatus: "pending",
      orderedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    // Broadcast updated cart with discount to customer display before showing receipt preview
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const validatedCartForBroadcast = cartItemsForEInvoice.map((item) => ({
        ...item,
        name: item.name,
        productName: item.name,
        price: item.price.toString(),
        quantity: item.quantity,
        total: item.totalAfterDiscount.toString(), // Use total after discount for broadcast
      }));

      wsRef.current.send(
        JSON.stringify({
          type: "cart_update",
          cart: validatedCartForBroadcast,
          subtotal: Math.floor(calculatedSubtotal),
          tax: Math.floor(calculatedTax),
          total: Math.floor(finalTotal), // Final total after discount
          discount: finalDiscount, // Include discount in broadcast message
          orderNumber: `POS-${Date.now()}`,
          timestamp: new Date().toISOString(),
          updateType: "checkout_preview",
        }),
      );

      console.log(
        "📡 Shopping Cart: Checkout preview broadcasted with discount:",
        {
          discount: finalDiscount,
          cartItems: validatedCartForBroadcast.length,
          finalTotal: finalTotal,
        },
      );
    }

    console.log("📋 POS: Receipt preview data prepared:", receiptPreview);
    console.log(
      "📋 POS: Receipt preview items count:",
      receiptPreview.items.length,
    );
    console.log("📋 POS: Receipt preview total verification:", {
      exactTotal: receiptPreview.exactTotal,
      stringTotal: receiptPreview.total,
      calculatedTotal: finalTotal,
    });

    // Step 3: Prepare order data for payment with EXACT calculated totals
    const orderForPaymentData = {
      id: `temp-${Date.now()}`,
      orderNumber: `POS-${Date.now()}`,
      tableId: null,
      customerName: "Khách hàng lẻ",
      status: "pending",
      paymentStatus: "pending",
      items: cartItemsForEInvoice.map((item) => ({
        id: item.id,
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        total: item.totalAfterDiscount.toString(),
        productSku: item.sku,
        price: item.price.toString(),
        sku: item.sku,
        taxRate: item.taxRate,
        afterTaxPrice: item.afterTaxPrice,
        discount: item.discount,
        discountAmount: item.discountAmount,
        discountPerUnit: item.discountPerUnit.toString(),
        originalPrice: item.originalPrice,
        // Add original total before discount for reference
        originalTotal: (item.price * item.quantity).toString(),
      })),
      subtotal: Math.floor(calculatedSubtotal),
      tax: calculatedTax,
      discount: finalDiscount.toString(),
      total: finalTotal,
      exactSubtotal: Math.floor(calculatedSubtotal),
      exactTax: calculatedTax,
      exactDiscount: finalDiscount,
      exactTotal: finalTotal,
      orderedAt: new Date().toISOString(),
    };

    console.log("📦 POS: Order for payment prepared:", orderForPaymentData);
    console.log(
      "📦 POS: Order for payment items count:",
      orderForPaymentData.items.length,
    );
    console.log("📦 POS: Order for payment total verification:", {
      exactTotal: orderForPaymentData.exactTotal,
      total: orderForPaymentData.total,
      calculatedTotal: finalTotal,
    });

    // Step 4: Set all data and show receipt preview modal
    setLastCartItems([...cartItemsForEInvoice]);
    setOrderForPayment(orderForPaymentData);
    setPreviewReceipt(receiptPreview);
    setShowReceiptPreview(true);

    console.log("🚀 POS: Showing receipt preview modal with VALIDATED data");
    console.log("📦 POS: orderForPayment FINAL verification:", {
      id: orderForPaymentData.id,
      total: orderForPaymentData.total,
      exactTotal: orderForPaymentData.exactTotal,
      itemsCount: orderForPaymentData.items.length,
      hasValidItems: orderForPaymentData.items.length > 0,
      items: orderForPaymentData.items,
      subtotal: orderForPaymentData.subtotal,
      tax: orderForPaymentData.tax,
    });
    console.log("📄 POS: previewReceipt FINAL verification:", {
      id: receiptPreview.id,
      total: receiptPreview.total,
      exactTotal: receiptPreview.exactTotal,
      itemsCount: receiptPreview.items.length,
      hasValidItems: receiptPreview.items.length > 0,
      items: receiptPreview.items,
      subtotal: receiptPreview.subtotal,
      tax: receiptPreview.tax,
    });
  };

  // Handler for E-invoice completion
  const handleEInvoiceComplete = async (invoiceData: any) => {
    console.log("📧 POS: E-Invoice completed with data:", invoiceData);
    setShowEInvoiceModal(false);

    // Use the financial data from E-invoice processing (which includes all calculations)
    const receiptData = {
      transactionId: invoiceData.transactionId || `TXN-${Date.now()}`,
      invoiceNumber: invoiceData.invoiceNumber,
      createdAt: new Date().toISOString(),
      cashierName: "Nhân viên",
      customerName: invoiceData.customerName || "Khách hàng lẻ",
      customerTaxCode: invoiceData.taxCode,
      paymentMethod: "einvoice",
      originalPaymentMethod:
        invoiceData.paymentMethod || selectedPaymentMethod || "cash",
      amountReceived: Math.floor(invoiceData.total || 0).toString(),
      change: "0", // E-invoice doesn't have change
      items: lastCartItems.map((item: any) => ({
        // Use lastCartItems for consistency
        id: item.id,
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price.toString(),
        total: (parseFloat(item.price) * item.quantity).toString(),
        sku: item.sku || `ITEM${String(item.id).padStart(3, "0")}`,
        taxRate: item.taxRate || 0,
      })),
      subtotal: Math.floor(invoiceData.subtotal || 0).toString(),
      tax: Math.floor(invoiceData.tax || 0).toString(),
      total: Math.floor(invoiceData.total || 0).toString(),
      discount: Math.floor(invoiceData.discount || 0).toString(),
      einvoiceStatus: invoiceData.einvoiceStatus || 0,
    };

    console.log(
      "📄 POS: Showing receipt modal after E-invoice with complete financial data",
    );
    console.log("💰 Receipt data with all details:", receiptData);

    // Clear preview states
    setPreviewReceipt(null);
    setOrderForPayment(null);
    setShowReceiptPreview(false);

    // Show final receipt for printing
    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const canCheckout = cart.length > 0;

  // Helper to clear cart and related states
  const clearCart = useCallback(() => {
    console.log("🧹 Shopping Cart: Clearing cart and states");
    onClearCart();
    setLastCartItems([]);
    setOrderForPayment(null);
    setPreviewReceipt(null);
    setShowReceiptPreview(false);
    setShowPaymentModal(false);
    setShowEInvoiceModal(false);
    setShowReceiptModal(false);
    setSelectedReceipt(null);

    // Clear any active orders
    if (typeof window !== "undefined" && (window as any).clearActiveOrder) {
      (window as any).clearActiveOrder();
    }

    // Broadcast empty cart
    broadcastCartUpdate();
  }, [onClearCart, broadcastCartUpdate]);

  // Cleanup when component unmounts and handle global events
  useEffect(() => {
    // Handle global popup close events
    const handleCloseAllPopups = (event: CustomEvent) => {
      console.log(
        "🔄 Shopping Cart: Received closeAllPopups event:",
        event.detail,
      );

      // Close all modals
      setShowReceiptPreview(false);
      setShowReceiptModal(false);
      setShowPaymentModal(false);
      setShowEInvoiceModal(false);
      setShowPrintDialog(false); // Ensure print dialog is also closed

      // Clear states
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setSelectedReceipt(null);
      setLastCartItems([]);

      // Clear cart after print completion
      if (
        event.detail.source === "print_dialog" ||
        event.detail.action === "print_completed"
      ) {
        console.log("🧹 Shopping Cart: Clearing cart after print completion");
        clearCart();
      }

      // Show success notification if requested
      if (event.detail.showSuccessNotification) {
        toast({
          title: `${t("common.success")}`,
          description: event.detail.message || "Thao tác hoàn tất",
        });
      }
    };

    // Handle cart clear events
    const handleClearCart = (event: CustomEvent) => {
      console.log("🗑️ Shopping Cart: Received clearCart event:", event.detail);
      clearCart(); // Use the memoized clearCart function
    };

    // Handle print completion events
    const handlePrintCompleted = (event: CustomEvent) => {
      console.log(
        "🖨️ Shopping Cart: Received print completed event:",
        event.detail,
      );

      // Close all modals and clear states
      setShowReceiptPreview(false);
      setShowReceiptModal(false);
      setShowPaymentModal(false);
      setShowEInvoiceModal(false);
      setShowPrintDialog(false);

      // Clear all states
      setPreviewReceipt(null);
      setOrderForPayment(null);
      setSelectedReceipt(null);
      setLastCartItems([]);

      // Clear cart
      clearCart();

      // Send WebSocket signal for refresh
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "force_refresh",
            source: "shopping_cart_print_completed",
            success: true,
            timestamp: new Date().toISOString(),
          }),
        );
      }

      toast({
        title: `${t("common.success")}`,
        description: `${t("common.invoiceprintingcompleted")}`,
      });
    };

    // Add event listeners
    if (typeof window !== "undefined") {
      window.addEventListener(
        "closeAllPopups",
        handleCloseAllPopups as EventListener,
      );
      window.addEventListener("clearCart", handleClearCart as EventListener);
      window.addEventListener(
        "printCompleted",
        handlePrintCompleted as EventListener,
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).eInvoiceCartItems;
        window.removeEventListener(
          "closeAllPopups",
          handleCloseAllPopups as EventListener,
        );
        window.removeEventListener(
          "clearCart",
          handleClearCart as EventListener,
        );
        window.removeEventListener(
          "printCompleted",
          handlePrintCompleted as EventListener,
        );
      }
    };
  }, [clearCart, toast, wsRef]); // Depend on clearCart, toast, and wsRef

  return (
    <aside className="w-96 bg-white shadow-material border-l pos-border flex flex-col">
      <div className="p-4 border-b pos-border mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl pos-text-primary font-semibold">
            {t("pos.purchaseHistory")}
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Button
                onClick={() => setIsCartCollapsed(!isCartCollapsed)}
                size="sm"
                variant="ghost"
                className="text-xs px-2 py-1"
                title={isCartCollapsed ? "Mở rộng" : "Thu gọn"}
              >
                {isCartCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            )}
            {onCreateNewOrder && (
              <Button
                onClick={onCreateNewOrder}
                size="sm"
                variant="outline"
                className="text-xs px-2 py-1"
              >
                + {t("pos.newOrder")}
              </Button>
            )}
          </div>
        </div>

        {/* Order Tabs */}
        {orders.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 max-h-20 overflow-y-auto">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`flex items-center px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                  activeOrderId === order.id
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => onSwitchOrder?.(order.id)}
              >
                <span className="truncate max-w-16">{order.name}</span>
                <span className="ml-1 text-xs">({order.cart.length})</span>
                {orders.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveOrder?.(order.id);
                    }}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm pos-text-secondary">
          <span>
            {cart.length} {t("common.items")}
          </span>
          {cart.length > 0 && (
            <button
              onClick={() => {
                console.log("🧹 Shopping Cart: Clear cart button clicked");
                clearCart(); // Use the memoized clearCart function
              }}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              {t("pos.clearCart")}
            </button>
          )}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 transition-all duration-300 ${isCartCollapsed ? 'max-h-0 p-0 opacity-0' : 'opacity-100'}`}>
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <CartIcon className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium pos-text-secondary mb-2">
              {t("pos.emptyCart")}
            </h3>
            <p className="pos-text-tertiary">{t("pos.addProductsToStart")}</p>
          </div>
        ) : (
          !isCartCollapsed && cart.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-medium pos-text-primary text-sm truncate">
                    {item.name}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-xs pos-text-secondary">
                      {Math.round(getDisplayPrice(item)).toLocaleString(
                        "vi-VN",
                      )}{" "}
                      ₫ {t("pos.each")}
                    </p>
                    {item.taxRate && parseFloat(item.taxRate) > 0 && (
                      <p className="text-xs text-orange-600">
                        Thuế ({item.taxRate}%):{" "}
                        {(() => {
                          const unitPrice = parseFloat(item.price);
                          const quantity = item.quantity;
                          const taxRate = parseFloat(item.taxRate) / 100;
                          const orderDiscount = parseFloat(
                            currentOrderDiscount || "0",
                          );

                          // Calculate discount for this item
                          let itemDiscountAmount = 0;
                          if (orderDiscount > 0) {
                            const totalBeforeDiscount = cart.reduce(
                              (total, cartItem) => {
                                return (
                                  total +
                                  parseFloat(cartItem.price) * cartItem.quantity
                                );
                              },
                              0,
                            );

                            const currentIndex = cart.findIndex(
                              (cartItem) => cartItem.id === item.id,
                            );
                            const isLastItem = currentIndex === cart.length - 1;

                            if (isLastItem) {
                              // Last item: total discount - sum of all previous discounts
                              let previousDiscounts = 0;
                              for (let i = 0; i < cart.length - 1; i++) {
                                const prevItem = cart[i];
                                const prevItemTotal =
                                  parseFloat(prevItem.price) *
                                  prevItem.quantity;
                                const prevItemDiscount =
                                  totalBeforeDiscount > 0
                                    ? Math.round(
                                        (orderDiscount * prevItemTotal) /
                                          totalBeforeDiscount,
                                      )
                                    : 0;
                                previousDiscounts += prevItemDiscount;
                              }
                              itemDiscountAmount =
                                orderDiscount - previousDiscounts;
                            } else {
                              // Regular calculation for non-last items
                              const itemTotal = unitPrice * quantity;
                              itemDiscountAmount =
                                totalBeforeDiscount > 0
                                  ? Math.round(
                                      (orderDiscount * itemTotal) /
                                        totalBeforeDiscount,
                                    )
                                  : 0;
                            }
                          }

                          if (priceIncludesTax) {
                            // When price includes tax:
                            // giá bao gồm thuế = (price - (discount/quantity)) * quantity
                            const discountPerUnit =
                              itemDiscountAmount / quantity;
                            const adjustedPrice = Math.max(
                              0,
                              unitPrice - discountPerUnit,
                            );
                            const giaGomThue = adjustedPrice * quantity;
                            // subtotal = giá bao gồm thuế / (1 + (taxRate / 100)) (làm tròn)
                            const tamTinh = Math.round(
                              giaGomThue / (1 + taxRate),
                            );
                            // tax = giá bao gồm thuế - subtotal
                            return giaGomThue - tamTinh;
                          } else {
                            // When price doesn't include tax:
                            // subtotal = (price - (discount/quantity)) * quantity
                            const discountPerUnit =
                              itemDiscountAmount / quantity;
                            const adjustedPrice = Math.max(
                              0,
                              unitPrice - discountPerUnit,
                            );
                            const tamTinh = adjustedPrice * quantity;
                            // tax = subtotal * (taxRate / 100) (làm tròn)
                            return Math.round(tamTinh * taxRate);
                          }
                        })().toLocaleString("vi-VN")}{" "}
                        ₫
                      </p>
                    )}

                    {/* Individual item discount display */}
                    {(() => {
                      // Calculate discount for this item using SAME logic as tax calculation
                      const orderDiscount = parseFloat(
                        currentOrderDiscount || "0",
                      );
                      if (orderDiscount > 0) {
                        const originalPrice = parseFloat(item.price);
                        const quantity = item.quantity;
                        const taxRate = parseFloat(item.taxRate || "0") / 100;

                        let itemDiscountAmount = 0;

                        if (priceIncludesTax) {
                          // For price includes tax: use total price for discount calculation
                          let giaGomThue = originalPrice * quantity;

                          const currentIndex = cart.findIndex(
                            (cartItem) => cartItem.id === item.id,
                          );
                          const isLastItem = currentIndex === cart.length - 1;

                          if (isLastItem) {
                            // Last item: total discount - sum of all previous discounts
                            let previousDiscounts = 0;
                            const totalBeforeDiscount = cart.reduce(
                              (sum, itm) => {
                                return (
                                  sum + parseFloat(itm.price) * itm.quantity
                                );
                              },
                              0,
                            );

                            for (let i = 0; i < cart.length - 1; i++) {
                              const prevItem = cart[i];
                              const prevItemTotal =
                                parseFloat(prevItem.price) * prevItem.quantity;
                              const prevItemDiscount =
                                totalBeforeDiscount > 0
                                  ? Math.round(
                                      (orderDiscount * prevItemTotal) /
                                        totalBeforeDiscount,
                                    )
                                  : 0;
                              previousDiscounts += prevItemDiscount;
                            }
                            itemDiscountAmount =
                              orderDiscount - previousDiscounts;
                          } else {
                            // Regular calculation for non-last items
                            const totalBeforeDiscount = cart.reduce(
                              (sum, itm) => {
                                return (
                                  sum + parseFloat(itm.price) * itm.quantity
                                );
                              },
                              0,
                            );
                            itemDiscountAmount =
                              totalBeforeDiscount > 0
                                ? Math.round(
                                    (orderDiscount * giaGomThue) /
                                      totalBeforeDiscount,
                                  )
                                : 0;
                          }
                        } else {
                          // For price doesn't include tax: use subtotal for discount calculation
                          let tamTinh = originalPrice * quantity;

                          const currentIndex = cart.findIndex(
                            (cartItem) => cartItem.id === item.id,
                          );
                          const isLastItem = currentIndex === cart.length - 1;

                          if (isLastItem) {
                            // Last item: total discount - sum of all previous discounts
                            let previousDiscounts = 0;
                            const totalBeforeDiscount = cart.reduce(
                              (sum, itm) => {
                                return (
                                  sum + parseFloat(itm.price) * itm.quantity
                                );
                              },
                              0,
                            );

                            for (let i = 0; i < cart.length - 1; i++) {
                              const prevItem = cart[i];
                              const prevItemTotal =
                                parseFloat(prevItem.price) * prevItem.quantity;
                              const prevItemDiscount =
                                totalBeforeDiscount > 0
                                  ? Math.round(
                                      (orderDiscount * prevItemTotal) /
                                        totalBeforeDiscount,
                                    )
                                  : 0;
                              previousDiscounts += prevItemDiscount;
                            }
                            itemDiscountAmount =
                              orderDiscount - previousDiscounts;
                          } else {
                            // Regular calculation for non-last items
                            const totalBeforeDiscount = cart.reduce(
                              (sum, itm) => {
                                return (
                                  sum + parseFloat(itm.price) * itm.quantity
                                );
                              },
                              0,
                            );
                            itemDiscountAmount =
                              totalBeforeDiscount > 0
                                ? Math.round(
                                    (orderDiscount * tamTinh) /
                                      totalBeforeDiscount,
                                  )
                                : 0;
                          }
                        }

                        return itemDiscountAmount > 0 ? (
                          <p className="text-xs text-red-600">
                            {t("common.discount")}: -
                            {Math.floor(itemDiscountAmount).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            ₫
                          </p>
                        ) : null;
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onUpdateQuantity(parseInt(item.id), item.quantity - 1)
                      }
                      className="w-6 h-6 p-0"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={10} />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        if (newQuantity >= 1 && newQuantity <= item.stock) {
                          onUpdateQuantity(parseInt(item.id), newQuantity);
                        }
                      }}
                      className="w-12 h-6 text-center text-xs p-1 border rounded"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onUpdateQuantity(parseInt(item.id), item.quantity + 1)
                      }
                      className="w-6 h-6 p-0"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={10} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log(
                          `🗑️ Shopping Cart: Remove item ${item.id} (${item.name})`,
                        );
                        onRemoveItem(parseInt(item.id));
                      }}
                      className="w-6 h-6 p-0 text-red-500 hover:text-red-700 border-red-300 hover:border-red-500"
                    >
                      <Trash2 size={10} />
                    </Button>
                  </div>
                  <div className="font-bold pos-text-primary text-sm">
                    {parseFloat(item.total).toLocaleString("vi-VN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₫
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="border-t pos-border p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="pos-text-secondary">
                {t("tables.subtotal")}:
              </span>
              <span className="font-medium">
                {Math.round(subtotal).toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="pos-text-secondary">{t("pos.tax")}:</span>
              <span className="font-medium">
                {Math.round(tax).toLocaleString("vi-VN")} ₫
              </span>
            </div>

            {/* Discount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium pos-text-primary">
                {t("common.discount")} (₫)
              </Label>
              <Input
                type="text"
                value={
                  currentOrderDiscount && parseFloat(currentOrderDiscount) > 0
                    ? parseFloat(currentOrderDiscount).toLocaleString("vi-VN")
                    : ""
                }
                onChange={(e) => {
                  const value = Math.max(
                    0,
                    parseFloat(e.target.value.replace(/[^\d]/g, "")) || 0,
                  );
                  setDiscountAmount(value.toString()); // Update local state for input display
                  if (activeOrderId) {
                    setOrderDiscounts((prev) => ({
                      ...prev,
                      [activeOrderId]: value.toString(),
                    }));
                  } else {
                    // If no active order, update discount amount directly
                    setDiscountAmount(value.toString());
                  }

                  // Send discount update via WebSocket with proper cart items
                  if (
                    wsRef.current &&
                    wsRef.current.readyState === WebSocket.OPEN
                  ) {
                    // Ensure cart items have proper structure
                    const validatedCart = cart.map((item) => ({
                      ...item,
                      name:
                        item.name ||
                        item.productName ||
                        item.product?.name ||
                        `Sản phẩm ${item.id}`,
                      productName:
                        item.name ||
                        item.productName ||
                        item.product?.name ||
                        `Sản phẩm ${item.id}`,
                      price: item.price || "0",
                      quantity: item.quantity || 1,
                      total: item.total || "0",
                    }));

                    wsRef.current.send(
                      JSON.stringify({
                        type: "cart_update",
                        cart: validatedCart, // Send validated cart items
                        subtotal: Math.floor(subtotal),
                        tax: Math.floor(tax),
                        total: Math.floor(total), // Total before discount
                        discount: value, // The new discount value
                        orderNumber: activeOrderId || `ORD-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        updateType: "discount_update", // Indicate this is a discount update
                      }),
                    );

                    console.log(
                      "📡 Shopping Cart: Discount update broadcasted:",
                      {
                        discount: value,
                        cartItems: validatedCart.length,
                        total: Math.floor(total),
                      },
                    );
                  }
                }}
                placeholder="0"
                className="text-right"
              />
            </div>

            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-lg font-bold pos-text-primary">
                  {t("tables.total")}:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {(() => {
                    const baseTotal = Math.round(subtotal + tax);
                    const finalTotal = baseTotal;

                    console.log("🔍 Total Calculation Debug:", {
                      subtotal: subtotal,
                      tax: tax,
                      baseTotal: baseTotal,
                      finalTotal: finalTotal,
                      calculation: `${subtotal} + ${tax} = ${finalTotal}`,
                    });

                    return finalTotal.toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
            </div>
          </div>

          {/* Cash Payment */}
          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium pos-text-primary">
                {t("tables.amountReceived")}
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
              />
              <div className="flex justify-between text-sm">
                <span className="pos-text-secondary">
                  {t("tables.change")}:
                </span>
                <span className="font-bold text-green-600">
                  {change.toLocaleString("vi-VN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ₫
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-lg"
          >
            {isProcessing ? t("tables.placing") : t("pos.checkout")}
          </Button>
        </div>
      )}

      {/* Receipt Preview Modal - Shows first like order management */}
      {showReceiptPreview && previewReceipt && (
        <ReceiptModal
          isOpen={showReceiptPreview}
          onClose={handleReceiptPreviewCancel}
          receipt={{
            ...previewReceipt,
            orderForPayment: orderForPayment,
            cartItems: lastCartItems,
          }}
          cartItems={lastCartItems}
          total={previewReceipt?.exactTotal || 0}
          isPreview={true}
          onConfirm={handleReceiptPreviewConfirm}
        />
      )}

      {/* Payment Method Modal - Shows after receipt preview confirmation */}
      {showPaymentModal && orderForPayment && previewReceipt && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            console.log("🔄 Closing Payment Method Modal");
            setShowPaymentModal(false);
            setPreviewReceipt(null);
            setOrderForPayment(null);
          }}
          onSelectMethod={handlePaymentMethodSelect}
          total={(() => {
            console.log(
              "🔍 Shopping Cart: Payment Modal Total Debug (VALIDATED):",
              {
                showPaymentModal: showPaymentModal,
                orderForPayment: orderForPayment,
                previewReceipt: previewReceipt,
                orderExactTotal: orderForPayment?.exactTotal,
                orderTotal: orderForPayment?.total,
                previewTotal: previewReceipt?.exactTotal,
                fallbackTotal: total,
                cartItemsCount: cart.length,
                hasValidOrderData: !!(orderForPayment && previewReceipt),
              },
            );

            // If we have valid order data, use it, otherwise use current cart calculation
            if (orderForPayment && previewReceipt) {
              const finalTotal =
                orderForPayment?.exactTotal ||
                orderForPayment?.total ||
                previewReceipt?.exactTotal ||
                previewReceipt?.total ||
                0;

              console.log(
                "💰 Shopping Cart: Using order/receipt total:",
                finalTotal,
              );
              return finalTotal;
            } else {
              // Fallback: Calculate from current cart
              const cartTotal = cart.reduce((sum, item) => {
                const itemTotal = parseFloat(item.total);
                return sum + itemTotal;
              }, 0);

              const cartTax = cart.reduce((sum, item) => {
                if (item.taxRate && parseFloat(item.taxRate) > 0) {
                  const basePrice = parseFloat(item.price);
                  if (
                    item.afterTaxPrice &&
                    item.afterTaxPrice !== null &&
                    item.afterTaxPrice !== ""
                  ) {
                    const afterTaxPrice = parseFloat(item.afterTaxPrice);
                    const taxPerItem = afterTaxPrice - basePrice;
                    return sum + Math.round(taxPerItem * item.quantity);
                  }
                }
                return sum;
              }, 0);

              const finalTotal = Math.round(cartTotal + cartTax);
              console.log(
                "💰 Shopping Cart: Using calculated cart total:",
                finalTotal,
              );
              return finalTotal;
            }
          })()}
          orderForPayment={orderForPayment}
          products={products}
          receipt={previewReceipt}
          cartItems={(() => {
            console.log(
              "📦 Shopping Cart: Cart Items Debug for Payment Modal (VALIDATED):",
              {
                orderForPaymentItems: orderForPayment?.items?.length || 0,
                previewReceiptItems: previewReceipt?.items?.length || 0,
                currentCartItems: cart?.length || 0,
                lastCartItems: lastCartItems?.length || 0,
                hasValidOrderData: !!(orderForPayment && previewReceipt),
              },
            );

            // If we have stored cart items from checkout process, use them first
            if (lastCartItems && lastCartItems.length > 0) {
              console.log(
                "📦 Shopping Cart: Using lastCartItems (most accurate):",
                lastCartItems,
              );
              return lastCartItems;
            }

            // If we have valid order data, use it
            if (orderForPayment?.items && orderForPayment.items.length > 0) {
              const mappedItems = orderForPayment.items.map((item) => ({
                id: item.id || item.productId,
                name: item.name || item.productName,
                price:
                  typeof (item.price || item.unitPrice) === "string"
                    ? parseFloat(item.price || item.unitPrice)
                    : item.price || item.unitPrice,
                quantity: item.quantity,
                sku:
                  item.sku ||
                  `FOOD${String(item.id || item.productId).padStart(5, "0")}`,
                taxRate: item.taxRate || 0,
                afterTaxPrice: item.afterTaxPrice,
              }));
              console.log(
                "📦 Shopping Cart: Using orderForPayment items:",
                mappedItems,
              );
              return mappedItems;
            }

            // Fallback to current cart
            if (cart && cart.length > 0) {
              const mappedItems = cart.map((item) => ({
                id: item.id,
                name: item.name,
                price:
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price,
                quantity: item.quantity,
                sku: item.sku || `FOOD${String(item.id).padStart(5, "0")}`,
                taxRate:
                  typeof item.taxRate === "string"
                    ? parseFloat(item.taxRate || "0")
                    : item.taxRate || 0,
                afterTaxPrice: item.afterTaxPrice,
              }));
              console.log(
                "📦 Shopping Cart: Using current cart as fallback:",
                mappedItems,
              );
              return mappedItems;
            }

            console.error(
              "❌ CRITICAL ERROR: No valid items found for Payment Modal",
            );
            return [];
          })()}
        />
      )}

      {/* Final Receipt Modal - Shows after successful payment */}
      {(showReceiptModal || selectedReceipt) && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            console.log(
              "🔄 Shopping Cart: Receipt modal closing, clearing cart and sending comprehensive refresh signal",
            );

            // Close modal and clear states
            setShowReceiptModal(false);
            setSelectedReceipt(null);
            setLastCartItems([]);
            setOrderForPayment(null);
            setPreviewReceipt(null);
            setIsProcessingPayment(false);

            // Clear cart immediately
            clearCart(); // Use the memoized clearCart function

            // Send comprehensive refresh signals
            try {
              if (
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
              ) {
                // Send multiple signals to ensure all components refresh
                wsRef.current.send(
                  JSON.stringify({
                    type: "popup_close",
                    success: true,
                    source: "shopping-cart-receipt",
                    timestamp: new Date().toISOString(),
                  }),
                );

                wsRef.current.send(
                  JSON.stringify({
                    type: "force_refresh",
                    source: "shopping-cart-receipt-close",
                    success: true,
                    timestamp: new Date().toISOString(),
                  }),
                );

                wsRef.current.send(
                  JSON.stringify({
                    type: "payment_success",
                    source: "shopping-cart-receipt-complete",
                    success: true,
                    timestamp: new Date().toISOString(),
                  }),
                );
              } else {
                // Fallback WebSocket connection if main one is not available
                const protocol =
                  window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;
                const fallbackWs = new WebSocket(wsUrl);

                fallbackWs.onopen = () => {
                  fallbackWs.send(
                    JSON.stringify({
                      type: "popup_close",
                      success: true,
                      source: "shopping-cart-receipt-fallback",
                      timestamp: new Date().toISOString(),
                    }),
                  );

                  fallbackWs.send(
                    JSON.stringify({
                      type: "force_refresh",
                      source: "shopping-cart-receipt-fallback",
                      success: true,
                      timestamp: new Date().toISOString(),
                    }),
                  );

                  setTimeout(() => fallbackWs.close(), 100);
                };
              }
            } catch (error) {
              console.error(
                "❌ Shopping Cart: Failed to send refresh signal:",
                error,
              );
            }

            // Dispatch custom events for components that might not use WebSocket
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("closeAllPopups", {
                  detail: {
                    source: "shopping_cart_receipt_close",
                    success: true,
                    action: "receipt_modal_closed",
                    showSuccessNotification: true,
                    message: "Thanh toán hoàn tất. Dữ liệu đã được cập nhật.",
                    timestamp: new Date().toISOString(),
                  },
                }),
              );

              window.dispatchEvent(
                new CustomEvent("refreshAllData", {
                  detail: {
                    source: "shopping_cart_receipt_close",
                    timestamp: new Date().toISOString(),
                  },
                }),
              );
            }

            console.log(
              "✅ Shopping Cart: Receipt modal closed with comprehensive refresh signals sent",
            );
          }}
          receipt={selectedReceipt}
          cartItems={
            selectedReceipt?.items ||
            lastCartItems.map((item) => ({
              id: item.id,
              name: item.name,
              price: parseFloat(item.price),
              quantity: item.quantity,
              sku: `ITEM${String(item.id).padStart(3, "0")}`,
              taxRate: parseFloat(item.taxRate || "0"),
            })) ||
            cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: parseFloat(item.price),
              quantity: item.quantity,
              sku: `ITEM${String(item.id).padStart(3, "0")}`,
              taxRate: parseFloat(item.taxRate || "0"),
            }))
          }
        />
      )}

      {/* E-Invoice Modal for invoice processing */}
      {showEInvoiceModal && (
        <EInvoiceModal
          isOpen={showEInvoiceModal}
          onClose={() => {
            console.log("🔴 POS: Closing E-invoice modal");
            setShowEInvoiceModal(false);
            setIsProcessingPayment(false);
          }}
          onConfirm={handleEInvoiceComplete}
          total={(() => {
            // Use the most accurate total available
            const totalToUse =
              orderForPayment?.exactTotal ||
              orderForPayment?.total ||
              previewReceipt?.exactTotal ||
              previewReceipt?.total ||
              total;

            console.log("🔍 POS E-Invoice Modal - Total calculation debug:", {
              orderForPaymentExactTotal: orderForPayment?.exactTotal,
              orderForPaymentTotal: orderForPayment?.total,
              previewReceiptExactTotal: previewReceipt?.exactTotal,
              previewReceiptTotal: previewReceipt?.total,
              fallbackTotal: total,
              finalTotalToUse: totalToUse,
            });

            return Math.floor(totalToUse || 0);
          })()}
          selectedPaymentMethod={selectedPaymentMethod}
          cartItems={(() => {
            // Use the most accurate cart items available
            const itemsToUse =
              lastCartItems.length > 0
                ? lastCartItems
                : orderForPayment?.items?.length > 0
                  ? orderForPayment.items.map((item) => ({
                      id: item.id || item.productId,
                      name: item.name || item.productName,
                      price:
                        typeof (item.price || item.unitPrice) === "string"
                          ? parseFloat(item.price || item.unitPrice)
                          : item.price || item.unitPrice,
                      quantity: item.quantity,
                      sku:
                        item.sku ||
                        `FOOD${String(item.id || item.productId).padStart(5, "0")}`,
                      taxRate:
                        typeof item.taxRate === "string"
                          ? parseFloat(item.taxRate || "0")
                          : item.taxRate || 0,
                      afterTaxPrice: item.afterTaxPrice,
                    }))
                  : cart.map((item) => ({
                      id: item.id,
                      name: item.name,
                      price:
                        typeof item.price === "string"
                          ? parseFloat(item.price)
                          : item.price,
                      quantity: item.quantity,
                      sku:
                        item.sku || `FOOD${String(item.id).padStart(5, "0")}`,
                      taxRate:
                        typeof item.taxRate === "string"
                          ? parseFloat(item.taxRate || "0")
                          : item.taxRate || 0,
                      afterTaxPrice: item.afterTaxPrice,
                    }));

            console.log(
              "🔍 POS E-Invoice Modal - Cart items calculation debug:",
              {
                lastCartItemsLength: lastCartItems.length,
                orderForPaymentItemsLength: orderForPayment?.items?.length || 0,
                currentCartLength: cart.length,
                finalItemsToUseLength: itemsToUse.length,
                finalItemsToUse: itemsToUse,
              },
            );

            return itemsToUse;
          })()}
          source="pos"
        />
      )}
    </aside>
  );
}
