
import { useState, useEffect } from "react";
import { CustomerDisplay } from "@/components/pos/customer-display";
import type { CartItem } from "@shared/schema";

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [qrPayment, setQrPayment] = useState<{
    qrCodeUrl: string;
    amount: number;
    paymentMethod: string;
    transactionUuid: string;
  } | null>(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string>('');

  console.log("Customer Display: Component rendered with cart:", cart.length, "items, storeInfo:", !!storeInfo, "qrPayment:", !!qrPayment);

  // Auto-clear QR payment after 5 minutes if not manually cleared
  useEffect(() => {
    if (qrPayment) {
      console.log("Customer Display: QR payment shown, setting 5-minute auto-clear timer");
      const timeoutId = setTimeout(() => {
        console.log("Customer Display: Auto-clearing QR payment after timeout");
        setQrPayment(null);
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        console.log("Customer Display: Clearing QR payment timeout");
        clearTimeout(timeoutId);
      };
    }
  }, [qrPayment]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.total), 0);
  const tax = cart.reduce((sum, item) => {
    if (item.taxRate && parseFloat(item.taxRate) > 0) {
      return sum + (parseFloat(item.price) * parseFloat(item.taxRate) / 100 * item.quantity);
    }
    return sum;
  }, 0);
  const total = subtotal + tax;

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Customer Display: Fetching initial data...");

        // Fetch store info
        const storeResponse = await fetch('https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/store-settings');
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          console.log("Customer Display: Store info loaded:", storeData);
          setStoreInfo(storeData);
        } else {
          console.error("Customer Display: Failed to fetch store settings:", storeResponse.status);
        }

        // Try to fetch current cart state if available
        const cartResponse = await fetch('https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/current-cart');
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          console.log("Customer Display: Initial cart loaded:", cartData);
          if (cartData.cart && Array.isArray(cartData.cart)) {
            setCart(cartData.cart);
            console.log("Customer Display: Cart state updated with", cartData.cart.length, "items");
          }
          if (cartData.storeInfo) {
            setStoreInfo(cartData.storeInfo);
            console.log("Customer Display: Store info updated from cart API");
          }
        } else {
          console.error("Customer Display: Failed to fetch current cart:", cartResponse.status);
        }
      } catch (error) {
        console.error("Customer Display: Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // WebSocket connection to receive real-time updates
  useEffect(() => {
    console.log("Customer Display: Initializing WebSocket connection");
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let isConnected = false;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("Customer Display: WebSocket connected");
          isConnected = true;
          
          // Send identification as customer display
          try {
            ws.send(JSON.stringify({ 
              type: 'customer_display_connected',
              timestamp: new Date().toISOString()
            }));
            console.log("Customer Display: Identification message sent");
            
            // Also register as customer display client for better routing
            setTimeout(() => {
              try {
                ws.send(JSON.stringify({
                  type: 'register_customer_display',
                  clientType: 'customer_display',
                  timestamp: new Date().toISOString()
                }));
                console.log("Customer Display: Registration message sent");
              } catch (regError) {
                console.error("Customer Display: Failed to send registration:", regError);
              }
            }, 100);
            
          } catch (error) {
            console.error("Customer Display: Failed to send identification:", error);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Skip duplicate messages based on timestamp and type
            const messageId = `${data.type}-${data.timestamp}`;
            if (data.timestamp && lastMessageTimestamp === messageId) {
              console.log("Customer Display: ⏭️ Skipping duplicate message:", data.type);
              return;
            }
            
            if (data.timestamp) {
              setLastMessageTimestamp(messageId);
            }
            
            console.log("Customer Display: Received WebSocket message:", {
              type: data.type,
              hasCart: !!data.cart,
              cartItems: data.cart?.length || 0,
              subtotal: data.subtotal,
              total: data.total,
              timestamp: data.timestamp,
              updateType: data.updateType,
              deletedItemId: data.deletedItemId
            });

            switch (data.type) {
              case 'cart_update':
                console.log("Customer Display: Processing cart update:", {
                  items: data.cart?.length || 0,
                  isItemDeletion: data.isItemDeletion,
                  deletedItem: data.deletedItemId ? `${data.deletedItemId} (${data.deletedItemName})` : 'none',
                  discount: data.discount || 0,
                  timestamp: data.timestamp
                });

                // Get the new cart from message
                const newCart = Array.isArray(data.cart) ? [...data.cart] : [];
                
                // Update discount if provided
                if (data.discount !== undefined) {
                  setDiscount(parseFloat(data.discount.toString()) || 0);
                }
                
                // SIMPLIFIED: Direct cart update without complex validation cycles
                setCart(prevCart => {
                  // Prevent unnecessary updates if cart is already the same
                  if (prevCart.length === newCart.length && 
                      JSON.stringify(prevCart) === JSON.stringify(newCart)) {
                    console.log("Customer Display: ⏭️ Skipping duplicate cart update");
                    return prevCart;
                  }
                  
                  console.log("Customer Display: 🔄 Cart update:", {
                    from: prevCart.length,
                    to: newCart.length,
                    isItemDeletion: data.isItemDeletion,
                    deletedItemId: data.deletedItemId,
                    discount: data.discount || 0
                  });
                  
                  // If this is an item deletion, ensure the deleted item is not in the new cart
                  if (data.isItemDeletion && data.deletedItemId) {
                    const cleanCart = newCart.filter(item => 
                      item.id !== data.deletedItemId && 
                      item.id !== data.deletedItemId.toString()
                    );
                    
                    console.log(`Customer Display: 🗑️ Item ${data.deletedItemId} removed, final cart: ${cleanCart.length} items`);
                    return cleanCart;
                  }
                  
                  // For non-deletion updates, just use the new cart as-is
                  return newCart;
                });

                // Clear QR payment for empty cart ONLY if no QR payment is active
                if (newCart.length === 0 && !qrPayment) {
                  console.log("Customer Display: 🧹 Clearing QR payment due to empty cart");
                  setQrPayment(null);
                  setDiscount(0); // Reset discount when cart is cleared
                }
                break;
              case 'store_info':
                console.log("Customer Display: Updating store info:", data.storeInfo);
                setStoreInfo(data.storeInfo);
                break;
              case 'qr_payment':
                console.log("🎯 Customer Display: Received QR payment message:", {
                  hasQrCodeUrl: !!data.qrCodeUrl,
                  amount: data.amount,
                  paymentMethod: data.paymentMethod,
                  transactionUuid: data.transactionUuid,
                  qrCodeUrlLength: data.qrCodeUrl?.length || 0,
                  fullData: data
                });
                
                // More flexible QR payment data validation
                if (data.qrCodeUrl && data.qrCodeUrl.length > 0) {
                  console.log("✅ Customer Display: Valid QR payment data, setting state immediately");
                  
                  const qrPaymentData = {
                    qrCodeUrl: data.qrCodeUrl,
                    amount: Number(data.amount) || 0,
                    paymentMethod: data.paymentMethod || "QR Code",
                    transactionUuid: data.transactionUuid || `QR-${Date.now()}`
                  };
                  
                  console.log("📱 Customer Display: Setting QR payment state:", qrPaymentData);
                  
                  // Force immediate state update for QR payment
                  setQrPayment(qrPaymentData);
                  
                  // Clear cart AFTER setting QR payment to prevent clearing QR state
                  setTimeout(() => {
                    setCart([]);
                    console.log("🧹 Customer Display: Cart cleared after QR payment set");
                  }, 100);
                  
                  console.log("🎉 Customer Display: QR payment state set successfully, QR should display now");
                } else {
                  console.error("❌ Customer Display: Invalid QR payment data received:", {
                    hasQrCodeUrl: !!data.qrCodeUrl,
                    qrCodeUrlLength: data.qrCodeUrl?.length || 0,
                    hasAmount: !!data.amount,
                    amount: data.amount,
                    receivedData: data
                  });
                }
                break;
              case 'payment_success':
                console.log("Customer Display: Payment completed, clearing QR");
                setQrPayment(null);
                setCart([]);
                break;
              case 'qr_payment_cancelled':
                console.log("Customer Display: QR payment cancelled, clearing QR and restoring cart");
                setQrPayment(prevQr => {
                  if (prevQr) {
                    console.log("Customer Display: Clearing QR payment state");
                    return null;
                  } else {
                    console.log("Customer Display: ⏭️ QR payment already cleared, ignoring cancellation");
                  }
                  return prevQr;
                });
                break;
              case 'refresh_customer_display':
                console.log("Customer Display: Refresh requested, reloading page in 500ms");
                // Add a small delay to ensure all cleanup is done
                setTimeout(() => {
                  console.log("Customer Display: Executing page reload now");
                  window.location.reload();
                }, 500);
                break;
              case 'qr_payment_confirmation':
                console.log("🔔 Customer Display: Received QR payment confirmation:", data);
                // This is a verification message to ensure QR payment was received
                if (data.originalMessage && !qrPayment) {
                  console.log("🔄 Customer Display: Re-applying QR payment from confirmation message");
                  const confirmationQrData = {
                    qrCodeUrl: data.originalMessage.qrCodeUrl,
                    amount: Number(data.originalMessage.amount),
                    paymentMethod: data.originalMessage.paymentMethod || "QR Code",
                    transactionUuid: data.originalMessage.transactionUuid
                  };
                  setQrPayment(confirmationQrData);
                }
                break;
              case 'restore_cart_display':
                console.log("Customer Display: Restoring cart display, clearing QR payment");
                // Force clear QR payment to show cart again
                setQrPayment(null);
                console.log("Customer Display: QR payment force cleared to restore cart view");
                break;
              default:
                console.log("Customer Display: Unknown message type:", data.type);
            }
          } catch (error) {
            console.error("Customer Display: Error parsing message:", error);
          }
        };

        ws.onclose = (event) => {
          console.log("Customer Display: WebSocket closed:", event.code, event.reason);
          isConnected = false;
          // Only reconnect if not manually closed
          if (event.code !== 1000) {
            reconnectTimer = setTimeout(() => {
              console.log("Customer Display: Attempting to reconnect...");
              connectWebSocket();
            }, 1000); // Reduced reconnect delay
          }
        };

        ws.onerror = (error) => {
          console.error("Customer Display: WebSocket error:", error);
          isConnected = false;
        };
      } catch (error) {
        console.error("Customer Display: Failed to create WebSocket:", error);
        // Retry after 1 second
        reconnectTimer = setTimeout(connectWebSocket, 1000);
      }
    };

    connectWebSocket();

    return () => {
      console.log("Customer Display: Cleaning up WebSocket connection");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        try {
          if (isConnected) {
            ws.close(1000, 'Component unmounting');
          }
        } catch (error) {
          console.error("Customer Display: Error closing WebSocket:", error);
        }
      }
    };
  }, []);

  return (
    <CustomerDisplay
      cart={cart}
      subtotal={subtotal}
      tax={tax}
      total={total}
      discount={discount}
      storeInfo={storeInfo}
      qrPayment={qrPayment}
    />
  );
}
