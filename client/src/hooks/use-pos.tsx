import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { CartItem, Receipt } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "@/lib/i18n";

interface Order {
  id: string;
  cart: CartItem[];
}

export function usePOS() {
  const [orders, setOrders] = useState<Order[]>([{ id: uuidv4(), cart: [] }]);
  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0].id);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const cart = orders.find(order => order.id === activeOrderId)?.cart || [];

  const checkoutMutation = useMutation({
    mutationFn: async ({ paymentData }: { paymentData: any }) => {
      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.total), 0);

      // Calculate tax from products with afterTaxPrice
      let tax = 0;
      cart.forEach(item => {
        if (item.afterTaxPrice) {
          const afterTaxPrice = parseFloat(item.afterTaxPrice);
          const price = parseFloat(item.price);
          const taxPerUnit = afterTaxPrice - price;
          tax += taxPerUnit * item.quantity;
        }
      });

      const total = subtotal + tax;

      const orderData = {
        orderNumber,
        tableId: null, // POS orders don't have tables
        employeeId: null,
        status: paymentData.paymentMethod === 'einvoice' ? 'served' : 'paid', // E-invoice orders start as served
        customerName: "Khách hàng",
        customerCount: 1,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: paymentData.discount ? parseFloat(paymentData.discount.toString()).toFixed(2) : '0.00',
        total: total.toFixed(2),
        paymentMethod: paymentData.paymentMethod === 'einvoice' ? paymentData.originalPaymentMethod || 'cash' : paymentData.paymentMethod,
        paymentStatus: paymentData.paymentMethod === 'einvoice' ? 'pending' : 'paid',
        salesChannel: 'pos', // Mark as POS order - ALWAYS pos for POS transactions
        einvoiceStatus: paymentData.einvoiceStatus || 0,
        templateNumber: paymentData.templateNumber || null,
        symbol: paymentData.symbol || null,
        invoiceNumber: paymentData.invoiceNumber || null,
        notes: t("common.comboValues.posPaymentNote")
          .replace("{amount}", paymentData.amountReceived || total.toString())
          .replace("{change}", paymentData.change || "0"),
        paidAt: paymentData.paymentMethod !== 'einvoice' ? new Date() : null,
      };

      const items = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.total,
        notes: null,
      }));

      const response = await fetch("https://order-mobile-be.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderData, items }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process order");
      }

      return response.json();
    },
    onSuccess: (order) => {
      // Convert order to receipt format for compatibility
      const receipt = {
        id: order.id,
        transactionId: order.orderNumber,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        cashierName: "POS System",
        notes: order.notes,
        createdAt: order.orderedAt,
        items: cart.map((item, index) => ({
          id: index + 1,
          transactionId: order.id,
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
      };

      setLastReceipt(receipt);
      updateActiveOrderCart([]);
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/orders"] });

      // Dispatch events for real-time updates
      if (typeof window !== 'undefined') {
        const events = [
          new CustomEvent('newOrderCreated', {
            detail: { orderId: order.id, salesChannel: 'pos' }
          }),
          new CustomEvent('refreshOrders', {
            detail: { immediate: true }
          })
        ];
        events.forEach(event => window.dispatchEvent(event));
      }

      toast({
        title: "Đơn hàng hoàn tất",
        description: `Đơn hàng ${order.orderNumber} đã được xử lý thành công`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Đơn hàng thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateActiveOrderCart = (newCart: CartItem[]) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === activeOrderId ? { ...order, cart: newCart } : order
      )
    );
  };


  const createNewOrder = () => {
    const newOrderId = uuidv4();
    setOrders([...orders, { id: newOrderId, cart: [] }]);
    setActiveOrderId(newOrderId);
  };

  const switchOrder = (orderId: string) => {
    setActiveOrderId(orderId);
  };

  const removeOrder = (orderId: string) => {
    if (orders.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "Must have at least one order.",
        variant: "destructive",
      });
      return;
    }

    const filteredOrders = orders.filter(order => order.id !== orderId);
    setOrders(filteredOrders);

    // If removing active order, switch to first remaining order
    if (orderId === activeOrderId) {
      setActiveOrderId(filteredOrders[0].id);
    }
  };

  const addToCart = async (productId: number) => {
    if (typeof productId !== 'number') {
      console.error('Invalid productId:', productId);
      return;
    }

    console.log("usePOS: Adding product to cart:", productId);

    try {
      // Fetch product details
      const response = await fetch(`https://order-mobile-be.onrender.com/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const product = await response.json();
      console.log("Fetched product for cart:", product);

      // Check inventory
      if (product.trackInventory !== false && product.stock <= 0) {
        console.warn(`Product ${product.name} is out of stock`);
        toast({
          title: "Hết hàng",
          description: `${product.name} hiện đang hết hàng`,
          variant: "destructive",
        });
        return;
      }

      // Find current cart for active order
      const currentCart = activeOrderId && orders.find(o => o.id === activeOrderId)?.cart || cart;
      const existingItem = currentCart.find(item => item.id === productId);

      if (existingItem) {
        // Update quantity
        updateQuantity(productId, existingItem.quantity + 1);
        toast({
          title: "Đã cập nhật",
          description: `Đã tăng số lượng ${product.name}`,
        });
      } else {
        // Add new item
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price.toString(),
          quantity: 1,
          total: product.price.toString(),
          stock: product.stock,
          taxRate: product.taxRate?.toString() || "0",
          afterTaxPrice: product.afterTaxPrice
        };

        console.log("Creating cart item:", cartItem);

        if (activeOrderId) {
          // Add to specific order
          setOrders(prev => prev.map(order =>
            order.id === activeOrderId
              ? { ...order, cart: [...order.cart, cartItem] }
              : order
          ));
        } else {
          // Add to main cart
          // This part might be problematic if `cart` is not a state variable that can be set.
          // Assuming `cart` is derived from `orders` state, direct modification of `cart` is incorrect.
          // The correct way is to update the `orders` state for the active order.
          // If there's no active order, this logic needs clarification or a default behavior.
          // For now, we assume activeOrderId is always set when this function is called correctly.
          console.error("Attempted to add to cart without an active order.");
          toast({
            title: "Lỗi",
            description: "Không có đơn hàng nào đang hoạt động",
            variant: "destructive",
          });
          return;
        }

        // Show success toast once
        toast({
          description: `${product.name}${t("pos.hasBeenAddedToOrder")}`,
        });
      }
    } catch (error) {
      console.error('Failed to add product to cart:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm sản phẩm vào giỏ hàng",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = (productId: number) => {
    const currentCart = orders.find(order => order.id === activeOrderId)?.cart || [];
    const newCart = currentCart.filter(item => item.id !== productId);
    updateActiveOrderCart(newCart);
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const currentCart = orders.find(order => order.id === activeOrderId)?.cart || [];
    const newCart = currentCart.map(item =>
      item.id === productId
        ? {
            ...item,
            quantity: newQuantity,
            total: (parseFloat(item.price) * newQuantity).toFixed(2)
          }
        : item
    );
    updateActiveOrderCart(newCart);
  };

  const clearCart = () => {
    console.log("🗑️ POS: Clearing cart");
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === activeOrderId) {
          return { ...order, cart: [] };
        }
        return order;
      });

      console.log("🗑️ POS: Cart cleared for active order:", activeOrderId);
      return updatedOrders;
    });
  };

  // Expose clearCart globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearActiveOrder = clearCart;
      (window as any).posGlobalClearCart = clearCart;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).clearActiveOrder;
        delete (window as any).posGlobalClearCart;
      }
    };
  }, [clearCart]);

  const processCheckout = async (paymentData: any): Promise<Receipt | null> => {
    if (cart.length === 0) {
      toast({
        title: "Giỏ hàng trống",
        description: "Không thể thanh toán với giỏ hàng trống",
        variant: "destructive",
      });
      return null;
    }

    try {
      const result = await checkoutMutation.mutateAsync({ paymentData });
      // Convert order to receipt format
      const receipt = {
        id: result.id,
        transactionId: result.orderNumber,
        subtotal: result.subtotal,
        tax: result.tax,
        total: result.total,
        paymentMethod: result.paymentMethod,
        cashierName: "POS System",
        notes: result.notes,
        createdAt: result.orderedAt,
        items: cart.map((item, index) => ({
          id: index + 1,
          transactionId: result.id,
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
      };
      return receipt;
    } catch (error) {
      // The error toast is already handled in checkoutMutation's onError
      return null;
    }
  };

  return {
    cart,
    orders,
    activeOrderId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    createNewOrder,
    switchOrder,
    removeOrder,
    lastReceipt,
    isProcessingCheckout: checkoutMutation.isPending,
    processCheckout
  };
}