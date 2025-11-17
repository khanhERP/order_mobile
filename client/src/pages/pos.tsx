import React, { useState, useEffect } from "react";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { CategorySidebar } from "@/components/pos/category-sidebar";
import { ProductGrid } from "@/components/pos/product-grid";
import { ShoppingCart } from "@/components/pos/shopping-cart";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { ProductManagerModal } from "@/components/pos/product-manager-modal";
import { usePOS } from "@/hooks/use-pos";
import { useQueryClient } from "@tanstack/react-query";

interface POSPageProps {
  onLogout?: () => void;
}

export default function POS({ onLogout }: POSPageProps) {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showProductManagerModal, setShowProductManagerModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastCartItems, setLastCartItems] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const {
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
    isProcessingCheckout,
    processCheckout,
    orderDiscounts // Assuming orderDiscounts is available from usePOS hook
  } = usePOS();

  // Add WebSocket listener for refresh signals
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('📡 POS: WebSocket connected for refresh signals');
          // Register as POS client
          ws?.send(JSON.stringify({
            type: 'register_pos_client',
            timestamp: new Date().toISOString()
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📩 POS: Received WebSocket message:', data);

            if (data.type === 'popup_close' || 
                data.type === 'payment_success' || 
                data.type === 'force_refresh' ||
                data.type === 'einvoice_published' ||
                data.type === 'einvoice_saved_for_later') {
              console.log('🔄 POS: Refreshing data due to WebSocket signal:', data.type);

              // Clear cache and force refresh
              queryClient.clear();
              queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/products"] });
              queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/categories"] });
              queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/store-settings"] });

              // Dispatch custom events for components
              window.dispatchEvent(new CustomEvent('forceDataRefresh', {
                detail: {
                  source: 'pos_websocket',
                  reason: data.type,
                  timestamp: new Date().toISOString()
                }
              }));
            }
          } catch (error) {
            console.error('❌ POS: Error processing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('📡 POS: WebSocket disconnected, attempting reconnect...');
          setTimeout(connectWebSocket, 2000);
        };

        ws.onerror = (error) => {
          console.error('❌ POS: WebSocket error:', error);
        };
      } catch (error) {
        console.error('❌ POS: Failed to connect WebSocket:', error);
        setTimeout(connectWebSocket, 2000);
      }
    };

    // Add custom event listeners for e-invoice events
    const handleEInvoiceEvents = (event: CustomEvent) => {
      console.log('📧 POS: E-invoice event received:', event.type, event.detail);

      // Force data refresh for any e-invoice related events
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/store-settings"] });

      // Dispatch refresh event for components
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: {
          source: 'pos_einvoice_event',
          reason: event.type,
          timestamp: new Date().toISOString()
        }
      }));
    };

    // Listen for e-invoice related events
    window.addEventListener('einvoicePublished', handleEInvoiceEvents);
    window.addEventListener('einvoiceSavedForLater', handleEInvoiceEvents);
    window.addEventListener('forceDataRefresh', handleEInvoiceEvents);

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      // Clean up event listeners
      window.removeEventListener('einvoicePublished', handleEInvoiceEvents);
      window.removeEventListener('einvoiceSavedForLater', handleEInvoiceEvents);
      window.removeEventListener('forceDataRefresh', handleEInvoiceEvents);
    };
  }, [queryClient]);

  // Expose clear active order function globally for WebSocket refresh
  useEffect(() => {
    (window as any).clearActiveOrder = () => {
      console.log('🔄 POS: Clearing active order via global function');
      clearCart();
      // Switch to first order if multiple orders exist
      if (orders.length > 1) {
        switchOrder(orders[0].id);
      }
    };

    return () => {
      delete (window as any).clearActiveOrder;
    };
  }, [clearCart, orders, switchOrder]);

  const handleCheckout = async (paymentData: any) => {
    console.log("=== POS PAGE CHECKOUT DEBUG ===");
    console.log("Cart before checkout:", cart);
    console.log("Cart length:", cart.length);

    // Prepare cart items with proper data types and validation
    const cartItemsBeforeCheckout = cart.map(item => {
      // Ensure price is a number
      let itemPrice = item.price;
      if (typeof itemPrice === 'string') {
        itemPrice = parseFloat(itemPrice);
      }
      if (isNaN(itemPrice) || itemPrice <= 0) {
        itemPrice = 0;
      }

      // Ensure quantity is a positive integer
      let itemQuantity = item.quantity;
      if (typeof itemQuantity === 'string') {
        itemQuantity = parseInt(itemQuantity);
      }
      if (isNaN(itemQuantity) || itemQuantity <= 0) {
        itemQuantity = 1;
      }

      // Ensure taxRate is a number
      let itemTaxRate = item.taxRate;
      if (typeof itemTaxRate === 'string') {
        itemTaxRate = parseFloat(itemTaxRate);
      }
      if (isNaN(itemTaxRate)) {
        itemTaxRate = 10; // Default 10%
      }

      return {
        id: item.id,
        name: item.name || `Product ${item.id}`,
        price: itemPrice,
        quantity: itemQuantity,
        sku: item.sku || `ITEM${String(item.id).padStart(3, '0')}`,
        taxRate: itemTaxRate
      };
    });

    console.log("✅ Processed cart items:", cartItemsBeforeCheckout);

    // Validate processed items
    const invalidItems = cartItemsBeforeCheckout.filter(item => 
      !item.id || !item.name || item.price <= 0 || item.quantity <= 0
    );

    if (invalidItems.length > 0) {
      console.error("❌ Invalid items found after processing:", invalidItems);
      alert("Có sản phẩm không hợp lệ trong giỏ hàng. Vui lòng kiểm tra lại.");
      return;
    }

    // Set cart items before checkout to ensure they're available for receipt modal
    setLastCartItems([...cartItemsBeforeCheckout]); // Use spread to ensure new array reference

    console.log("✅ Cart items validation passed, processing checkout...");

    try {
      const receipt = await processCheckout(paymentData);
      if (receipt) {
        console.log("✅ Receipt processed successfully");
        console.log("✅ Opening receipt modal with cartItems:", cartItemsBeforeCheckout.length, "items");
        setShowReceiptModal(true);
        // Clear cart and close modal after successful checkout and receipt display
        clearCart(); // Clear the cart after checkout
        // The requirement to "tự đóng màn hóa đơn lại" is handled by the onClose prop, 
        // but we also need to ensure the cart is cleared *after* checkout and receipt is shown.
        // The `clearCart()` call here handles clearing the cart after successful checkout.
      } else {
        console.error("❌ Failed to process checkout - no receipt returned");
        alert("Lỗi thanh toán. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("❌ Checkout process failed:", error);
      alert("Lỗi thanh toán. Vui lòng thử lại.");
    }
  };

  try {
    return (
      <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <POSHeader onLogout={onLogout} />

      {/* Right Sidebar */}
      <RightSidebar />

      <div className="main-content flex h-screen pt-16">
        {/* Category Sidebar */}
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenProductManager={() => setShowProductManagerModal(true)}
          onAddToCart={(product) => addToCart(product)}
        />

        {/* Product Grid */}
        <ProductGrid
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onAddToCart={(product) => addToCart(product)}
        />

        {/* Shopping Cart */}
        <ShoppingCart
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
          isProcessing={isProcessingCheckout}
          orders={orders}
          activeOrderId={activeOrderId}
          onCreateNewOrder={createNewOrder}
          onSwitchOrder={switchOrder}
          onRemoveOrder={removeOrder}
        />
      </div>

      {/* Modals */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          console.log("🔴 POS: Closing receipt modal and clearing cart");
          setShowReceiptModal(false);

          // Force clear cart immediately
          console.log("🔄 POS: Force clearing cart when receipt modal closes");
          clearCart();

          // Also dispatch clear cart event for other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('clearCart', {
              detail: { 
                source: 'pos_receipt_close',
                timestamp: new Date().toISOString()
              }
            }));
          }

          // Clear cart when receipt modal closes
          setTimeout(() => {
            clearCart();

            // Send popup close signal via WebSocket to trigger other components to refresh
            try {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;
              const ws = new WebSocket(wsUrl);

              ws.onopen = () => {
                ws.send(JSON.stringify({
                  type: "popup_close",
                  success: true,
                  action: 'receipt_modal_closed',
                  timestamp: new Date().toISOString()
                }));
                ws.close();
              };
            } catch (error) {
              console.error("Failed to send popup close signal:", error);
            }
          }, 100);
        }}
        receipt={lastReceipt}
        cartItems={lastCartItems}
      />

      <ProductManagerModal
        isOpen={showProductManagerModal}
        onClose={() => setShowProductManagerModal(false)}
      />
      </div>
    );
  } catch (error) {
    console.error("❌ POS Page Error:", error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-4">Vui lòng tải lại trang</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}