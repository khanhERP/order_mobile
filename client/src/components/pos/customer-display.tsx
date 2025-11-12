import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import logoPath from "@assets/EDPOS_1753091767028.png";
import type { CartItem } from "@shared/schema";

interface CustomerDisplayProps {
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
  storeInfo?: {
    name: string;
    address?: string;
  };
  qrPayment?: {
    qrCodeUrl: string;
    amount: number;
    paymentMethod: string;
    transactionUuid: string;
  } | null;
}

export function CustomerDisplay({
  cart,
  subtotal,
  tax,
  total,
  discount,
  storeInfo,
  qrPayment,
}: CustomerDisplayProps) {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cartItems, setCartItems] = useState<CartItem[]>(cart);
  const [currentSubtotal, setCurrentSubtotal] = useState(subtotal);
  const [currentTax, setCurrentTax] = useState(tax);
  const [currentTotal, setCurrentTotal] = useState(total);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");

  // Calculate correct subtotal from cart items (pre-tax price * quantity)
  const calculateCorrectSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      // Use the base price (before tax) for subtotal calculation
      const basePrice = parseFloat(item.price || "0");
      const quantity = item.quantity || 0;
      return sum + basePrice * quantity;
    }, 0);
  };

  // Calculate correct tax from cart items - EXACT same logic as shopping-cart
  const calculateCorrectTax = () => {
    return cartItems.reduce((sum, item) => {
      if (item.taxRate && parseFloat(item.taxRate) > 0) {
        const basePrice = parseFloat(item.price);
        const quantity = item.quantity;
        const subtotal = basePrice * quantity;

        // Calculate discount for this item - SAME logic as shopping-cart
        const orderDiscount = discount || 0;
        let itemDiscountAmount = 0;

        if (orderDiscount > 0) {
          const currentIndex = cartItems.findIndex(
            (cartItem) => cartItem.id === item.id,
          );
          const isLastItem = currentIndex === cartItems.length - 1;

          if (isLastItem) {
            // Last item: total discount - sum of all previous discounts
            let previousDiscounts = 0;
            const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
              return sum + parseFloat(itm.price) * itm.quantity;
            }, 0);

            for (let i = 0; i < cartItems.length - 1; i++) {
              const prevItemSubtotal =
                parseFloat(cartItems[i].price) * cartItems[i].quantity;
              const prevItemDiscount =
                totalBeforeDiscount > 0
                  ? Math.floor(
                      (orderDiscount * prevItemSubtotal) / totalBeforeDiscount,
                    )
                  : 0;
              previousDiscounts += prevItemDiscount;
            }

            itemDiscountAmount = orderDiscount - previousDiscounts;
          } else {
            // Regular calculation for non-last items
            const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
              return sum + parseFloat(itm.price) * itm.quantity;
            }, 0);
            itemDiscountAmount =
              totalBeforeDiscount > 0
                ? Math.floor((orderDiscount * subtotal) / totalBeforeDiscount)
                : 0;
          }
        }

        // Tax = (price * quantity - discount) * taxRate - SAME as shopping-cart
        const taxableAmount = Math.max(0, subtotal - itemDiscountAmount);
        const taxRate = parseFloat(item.taxRate) / 100;
        const calculatedTax = Math.floor(taxableAmount * taxRate);

        return sum + calculatedTax;
      }
      return sum;
    }, 0);
  };

  // Get the correct pre-tax subtotal and tax
  const correctSubtotal = calculateCorrectSubtotal();
  const correctTax = calculateCorrectTax();

  // Calculate final total with discount
  const finalTotal = Math.max(0, correctSubtotal + correctTax - (discount || 0));

  console.log("Customer Display: Calculation breakdown", {
    correctSubtotal,
    correctTax,
    discount: discount || 0,
    beforeDiscount: correctSubtotal + correctTax,
    finalTotal
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // CRITICAL: Force immediate state update with validation
    console.log("Customer Display Component: Props changed", {
      cartLength: cart.length,
      subtotal: subtotal,
      tax: tax,
      total: total,
    });

    // Always update local state when props change
    setCartItems([...cart]); // Force new array reference
    setCurrentSubtotal(subtotal);
    setCurrentTax(tax);
    setCurrentTotal(total);

    // If cart is empty, ensure all totals are reset
    if (cart.length === 0) {
      console.log(
        "Customer Display Component: Cart is empty, resetting all totals",
      );
      setCurrentSubtotal(0);
      setCurrentTax(0);
      setCurrentTotal(0);
    }
  }, [cart, subtotal, tax, total]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to format currency, ensuring it handles potential NaN or undefined values
  const formatCurrency = (
    amount: number | string | undefined | null,
  ): string => {
    const num = parseFloat(amount as string);
    if (isNaN(num)) {
      return "0 ₫"; // Default to '0 ₫' if parsing fails
    }
    return num.toLocaleString("vi-VN") + " ₫";
  };

  // WebSocket logic is now handled by the parent page component

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-green-500 p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <img src={logoPath} alt="Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {storeInfo?.name || "IDMC Store"}
              </h1>
              <p className="text-sm text-gray-600">
                {storeInfo?.address || "Chào mừng quý khách"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-800">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="max-w-6xl mx-auto flex-1 flex flex-col">
          {/* Cart Items or QR Payment */}
          {qrPayment ? (
            // QR Payment Display
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Thanh toán QR Code
                  </h2>
                  <p className="text-gray-600">
                    Quét mã QR để thanh toán
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
                  <img
                    src={qrPayment.qrCodeUrl}
                    alt="QR Payment Code"
                    className="w-full h-auto max-w-xs mx-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                {/* Payment Info */}
                <div className="text-center space-y-2">
                  <div className="text-sm text-gray-600">
                    Phương thức: {qrPayment.paymentMethod}
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {Math.floor(qrPayment.amount).toLocaleString("vi-VN")} ₫
                  </div>
                  <div className="text-sm text-gray-500">
                    Mã giao dịch: {qrPayment.transactionUuid}
                  </div>
                </div>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            // Empty Cart
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl text-gray-300 mb-6">🛒</div>
                <h2 className="text-3xl font-semibold text-gray-600 mb-4">
                  Giỏ hàng trống
                </h2>
                <p className="text-xl text-gray-500">
                  Đang chờ thêm sản phẩm...
                </p>
              </div>
            </div>
          ) : (
            // Cart Items Display - Similar to Shopping Cart
            <div className="flex-1 overflow-hidden flex">
              {/* Left side - Cart Items List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-white border-b border-gray-200 p-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="mr-3">🛒</span>
                    Đơn hàng của bạn
                    <span className="ml-3 text-lg font-normal text-gray-600">
                      ({cartItems.length} món)
                    </span>
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div key={`${item.id}-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">
                              {item.name || item.productName || `Sản phẩm ${item.id}`}
                            </h4>

                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                {Math.round(parseFloat(item.price || "0")).toLocaleString("vi-VN")} ₫ × {item.quantity || 1}
                              </p>

                              {item.taxRate && parseFloat(item.taxRate) > 0 && (
                                <p className="text-sm text-orange-600">
                                  Thuế ({item.taxRate}%): {(() => {
                                    const basePrice = parseFloat(item.price || "0");
                                    const quantity = item.quantity || 1;
                                    const subtotal = basePrice * quantity;

                                    // Calculate discount for this item - SAME logic as shopping-cart
                                    const orderDiscount = discount || 0;
                                    let itemDiscountAmount = 0;

                                    if (orderDiscount > 0) {
                                      const currentIndex = cartItems.findIndex(
                                        (cartItem) => cartItem.id === item.id,
                                      );
                                      const isLastItem = currentIndex === cartItems.length - 1;

                                      if (isLastItem) {
                                        // Last item: total discount - sum of all previous discounts
                                        let previousDiscounts = 0;
                                        const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
                                          return sum + parseFloat(itm.price) * itm.quantity;
                                        }, 0);

                                        for (let i = 0; i < cartItems.length - 1; i++) {
                                          const prevItemSubtotal =
                                            parseFloat(cartItems[i].price) * cartItems[i].quantity;
                                          const prevItemDiscount =
                                            totalBeforeDiscount > 0
                                              ? Math.floor(
                                                  (orderDiscount * prevItemSubtotal) / totalBeforeDiscount,
                                                )
                                              : 0;
                                          previousDiscounts += prevItemDiscount;
                                        }

                                        itemDiscountAmount = orderDiscount - previousDiscounts;
                                      } else {
                                        // Regular calculation for non-last items
                                        const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
                                          return sum + parseFloat(itm.price) * itm.quantity;
                                        }, 0);
                                        itemDiscountAmount =
                                          totalBeforeDiscount > 0
                                            ? Math.floor((orderDiscount * subtotal) / totalBeforeDiscount)
                                            : 0;
                                      }
                                    }

                                    // Tax = (price * quantity - discount) * taxRate
                                    const taxableAmount = Math.max(0, subtotal - itemDiscountAmount);
                                    const taxRate = parseFloat(item.taxRate) / 100;
                                    const calculatedTax = Math.floor(taxableAmount * taxRate);
                                    return calculatedTax.toLocaleString("vi-VN");
                                  })()} ₫
                                </p>
                              )}

                              {/* Show item discount if applicable - SAME logic as shopping-cart */}
                              {discount && discount > 0 && (
                                <p className="text-sm text-red-600">
                                  Giảm giá: -{(() => {
                                    const basePrice = parseFloat(item.price || "0");
                                    const quantity = item.quantity || 1;
                                    const subtotal = basePrice * quantity;

                                    // Calculate discount for this item - SAME logic as shopping-cart
                                    const orderDiscount = discount || 0;
                                    let itemDiscountAmount = 0;

                                    if (orderDiscount > 0) {
                                      const currentIndex = cartItems.findIndex(
                                        (cartItem) => cartItem.id === item.id,
                                      );
                                      const isLastItem = currentIndex === cartItems.length - 1;

                                      if (isLastItem) {
                                        // Last item: total discount - sum of all previous discounts
                                        let previousDiscounts = 0;
                                        const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
                                          return sum + parseFloat(itm.price) * itm.quantity;
                                        }, 0);

                                        for (let i = 0; i < cartItems.length - 1; i++) {
                                          const prevItemSubtotal =
                                            parseFloat(cartItems[i].price) * cartItems[i].quantity;
                                          const prevItemDiscount =
                                            totalBeforeDiscount > 0
                                              ? Math.floor(
                                                  (orderDiscount * prevItemSubtotal) / totalBeforeDiscount,
                                                )
                                              : 0;
                                          previousDiscounts += prevItemDiscount;
                                        }

                                        itemDiscountAmount = orderDiscount - previousDiscounts;
                                      } else {
                                        // Regular calculation for non-last items
                                        const totalBeforeDiscount = cartItems.reduce((sum, itm) => {
                                          return sum + parseFloat(itm.price) * itm.quantity;
                                        }, 0);
                                        itemDiscountAmount =
                                          totalBeforeDiscount > 0
                                            ? Math.floor((orderDiscount * subtotal) / totalBeforeDiscount)
                                            : 0;
                                      }
                                    }

                                    return Math.floor(itemDiscountAmount).toLocaleString("vi-VN");
                                  })()} ₫
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                              <div className="flex flex-col items-end space-y-1">
                                <span className="text-sm text-gray-500">SL: {item.quantity || 1}</span>
                                <div className="text-xl font-bold text-blue-600">
                                  {parseFloat(item.total || "0").toLocaleString("vi-VN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} ₫
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side - Order Summary */}
              <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                <div className="bg-blue-50 border-b border-gray-200 p-4">
                  <h3 className="text-xl font-bold text-blue-800 text-center">
                    Tổng kết đơn hàng
                  </h3>
                </div>

                <div className="flex-1 p-4 space-y-4">
                  {/* Order Number */}
                  {orderNumber && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-sm text-gray-600 mb-1">Số đơn hàng</div>
                      <div className="font-bold text-gray-800">{orderNumber}</div>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-semibold">
                        {calculateCorrectSubtotal().toLocaleString("vi-VN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ₫
                      </span>
                    </div>

                    <div className="flex justify-between text-lg">
                      <span className="text-gray-600">Thuế:</span>
                      <span className="font-semibold text-orange-600">
                        {calculateCorrectTax().toLocaleString("vi-VN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ₫
                      </span>
                    </div>

                    {discount && discount > 0 && (
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-600">Giảm giá:</span>
                        <span className="font-semibold text-red-600">
                          -{discount.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-2xl font-bold">
                        <span className="text-gray-800">Tổng cộng:</span>
                        <span className="text-green-600">
                          {Math.max(0, calculateCorrectSubtotal() + calculateCorrectTax() - (discount || 0)).toLocaleString("vi-VN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Item Statistics */}
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-green-700 mb-1">
                      Tổng số món
                    </div>
                    <div className="text-3xl font-bold text-green-800">
                      {cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      {cartItems.length} loại sản phẩm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            Cảm ơn bạn đã mua sắm tại {storeInfo?.name || "IDMC Store"}
          </p>
          {/* Hidden refresh button - double click to refresh */}
          <button
            onClick={() => window.location.reload()}
            onDoubleClick={() => window.location.reload()}
            className="invisible hover:visible absolute bottom-2 right-2 text-xs text-gray-300 hover:text-gray-600 bg-transparent border-none cursor-pointer"
            title="Double click to refresh display"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
}