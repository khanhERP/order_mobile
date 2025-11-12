import { X, Printer, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Receipt } from "@shared/schema";
import logoPath from "@assets/EDPOS_1753091767028.png";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { EInvoiceModal } from "./einvoice-modal";
import { PaymentMethodModal } from "./payment-method-modal";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt?: Receipt | null;
  cartItems?: any[];
  total?: number;
  isPreview?: boolean;
  onConfirm?: () => void;
  autoClose?: boolean;
  isTitle?: boolean;
}

export function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  cartItems = [],
  total = 0,
  isPreview = false,
  onConfirm,
  autoClose = false,
  isTitle = true,
}: ReceiptModalProps) {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NEVER CONDITIONAL
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [title, setTitle] = useState<string>("");
  const { t } = useTranslation();

  useEffect(() => {
    const nameTitle =
      isTitle == true
        ? `${t("common.paymentInvoice")}`
        : `${t("common.provisionalVoucher")}`;
    setTitle(nameTitle);
  }, [isTitle]);
  // Query store settings
  const { data: storeSettings } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "https://order-mobile-be.onrender.com/api/store-settings");
      return response.json();
    },
    enabled: isOpen, // Only fetch when modal is open
  });

  // Log receipt modal state for debugging - ALWAYS CALL THIS HOOK
  useEffect(() => {
    if (isOpen) {
      console.log("=== RECEIPT MODAL RENDERED ===");
      console.log(
        "Receipt Modal Mode:",
        isPreview ? "PREVIEW (Step 1)" : "FINAL RECEIPT (Step 5)",
      );
      console.log("Receipt Modal isOpen:", isOpen);
      console.log("Receipt Modal isPreview:", isPreview);
      console.log("Receipt Modal cartItems received:", cartItems);
      console.log("Receipt Modal cartItems length:", cartItems?.length || 0);
      console.log("Receipt Modal total:", total);
      console.log("Receipt Modal receipt:", receipt);
      console.log("🔍 ReceiptModal Props Debug:", {
        isOpen,
        isPreview,
        receipt,
        cartItems: cartItems?.length || 0,
        onConfirm: !!onConfirm,
        hasReceiptData: !!(receipt && typeof receipt === "object"),
        hasValidData:
          !!(receipt && typeof receipt === "object") ||
          (isPreview &&
            cartItems &&
            Array.isArray(cartItems) &&
            cartItems.length > 0 &&
            total > 0),
      });

      // Force show modal when receipt data exists
      if (receipt && typeof receipt === "object") {
        console.log(
          "✅ Receipt Modal: Valid receipt data found - modal will display",
        );
      }
    }
  }, [isOpen, receipt, isPreview, cartItems, total, onConfirm]);

  // Early return after hooks
  if (!isOpen) {
    console.log("❌ Receipt Modal: Modal is closed");
    return null;
  }

  // Handle missing data cases
  const hasReceiptData = receipt && typeof receipt === "object";
  const hasCartData =
    cartItems && Array.isArray(cartItems) && cartItems.length > 0;
  const hasValidData =
    hasReceiptData || (isPreview && hasCartData && total > 0);

  if (!hasValidData) {
    console.log("❌ Receipt Modal: No valid data for display", {
      hasReceiptData,
      hasCartData,
      isPreview,
      total,
    });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin hóa đơn</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>
              {isPreview
                ? "Không có sản phẩm trong giỏ hàng để xem trước hóa đơn"
                : "Không có dữ liệu hóa đơn để hiển thị"}
            </p>
            <Button onClick={onClose} className="mt-4">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handlePrint = async () => {
    console.log(
      "🖨️ Receipt Modal: Print button clicked - processing for multi-platform printing",
    );

    const printContent = document.getElementById("receipt-content");
    if (!printContent) {
      alert("Không tìm thấy nội dung hóa đơn để in.");
      return;
    }

    try {
      // Enhanced device detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile =
        isIOS || isAndroid || /mobile|tablet|phone/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent);
      const isPOSTerminal =
        window.innerWidth <= 1024 && window.innerHeight <= 768;

      console.log("🔍 Enhanced device detection:", {
        isIOS,
        isAndroid,
        isMobile,
        isSafari,
        isChrome,
        isPOSTerminal,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: userAgent.substring(0, 100),
      });

      // Step 1: Check for active printer configurations
      let activePrinterConfigs = [];
      try {
        console.log("🖨️ Fetching active printer configurations...");
        const printerResponse = await fetch("https://order-mobile-be.onrender.com/api/printer-configs");
        if (printerResponse.ok) {
          const allConfigs = await printerResponse.json();
          activePrinterConfigs = allConfigs.filter(
            (config) =>
              config.isActive && (config.isEmployee || config.isKitchen),
          );
          console.log(
            "✅ Found active printer configs:",
            activePrinterConfigs.length,
          );
        }
      } catch (configError) {
        console.log(
          "⚠️ Could not fetch printer configs, using fallback methods",
        );
      }

      // Step 2: Create receipt data structure for printing
      const receiptData = {
        content: printContent.innerHTML,
        type: "receipt",
        timestamp: new Date().toISOString(),
        orderId: receipt?.id,
        transactionId: receipt?.transactionId,
        deviceInfo: {
          userAgent: userAgent.substring(0, 100),
          platform: isIOS ? "iOS" : isAndroid ? "Android" : "Desktop",
          browser: isSafari ? "Safari" : isChrome ? "Chrome" : "Other",
          isMobile: isMobile,
        },
      };

      // Step 3: Try configured printers first (POS API with active configs)
      if (activePrinterConfigs.length > 0) {
        console.log("🖨️ Trying configured POS printers for all platforms...");

        try {
          const printResponse = await fetch("https://order-mobile-be.onrender.com/api/pos/print-receipt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...receiptData,
              printerConfigs: activePrinterConfigs,
              preferredConfig:
                activePrinterConfigs.find((c) => c.isEmployee) ||
                activePrinterConfigs[0],
            }),
          });

          if (printResponse.ok) {
            const result = await printResponse.json();
            console.log(
              "✅ Receipt sent to configured printer successfully:",
              result,
            );

            // Show success message based on device type
            const successMessage = isMobile
              ? "✅ Hóa đơn đã được gửi đến máy in thành công!\nKiểm tra máy in POS của bạn."
              : "✅ Hóa đơn đã được gửi đến máy in POS thành công!";

            alert(successMessage);
            onClose();

            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("printCompleted", {
                  detail: { closeAllModals: true, refreshData: true },
                }),
              );
            }
            return;
          } else {
            console.log(
              "⚠️ Configured printer API returned error, trying platform-specific fallbacks",
            );
          }
        } catch (apiError) {
          console.log(
            "⚠️ Configured printer API failed, using platform-specific fallbacks:",
            apiError.message,
          );
        }
      }

      // Step 4: Platform-specific fallback methods
      if (isMobile) {
        await handleMobilePrinting(
          printContent,
          isIOS,
          isAndroid,
          isSafari,
          isChrome,
        );
      } else {
        await handleDesktopPrinting(printContent);
      }
    } catch (error) {
      console.error("❌ Print error:", error);
      alert(`Có lỗi xảy ra khi in: ${error.message}\nVui lòng thử lại.`);
      // Final fallback to desktop method
      if (printContent) {
        handleDesktopPrint(printContent);
      }
    }
  };

  // Enhanced mobile printing handler
  const handleMobilePrinting = async (
    printContent: HTMLElement,
    isIOS: boolean,
    isAndroid: boolean,
    isSafari: boolean,
    isChrome: boolean,
  ) => {
    console.log(
      "📱 Using enhanced mobile printing for",
      isIOS ? "iOS" : isAndroid ? "Android" : "Mobile",
    );

    // Show user options for mobile printing with platform-specific messaging
    const platformMessage = isIOS
      ? "Máy in POS không khả dụng.\n\nChọn OK để tải file hóa đơn (Safari có thể mở trực tiếp).\nChọn Cancel để thử in trực tiếp từ trình duyệt."
      : isAndroid
        ? "Máy in POS không khả dụng.\n\nChọn OK để tải/chia sẻ file hóa đơn.\nChọn Cancel để thử in trực tiếp từ Chrome."
        : "Máy in POS không khả dụng.\n\nChọn OK để tải file hóa đơn.\nChọn Cancel để thử in trực tiếp.";

    const userChoice = confirm(platformMessage);

    if (userChoice) {
      // User chose to download/share file
      console.log("📱 User chose to download/share receipt file");
      await downloadReceiptFile(printContent, isIOS, isAndroid);
    } else {
      // User chose to try browser print dialog
      console.log("📱 User chose to try browser print dialog");
      await openBrowserPrintDialog(
        printContent,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
      );
    }
  };

  // Enhanced desktop printing handler
  const handleDesktopPrinting = async (printContent: HTMLElement) => {
    console.log("🖥️ Using enhanced desktop printing method");

    // Try direct browser print first
    try {
      const printWindow = window.open(
        "",
        "_blank",
        "width=800,height=600,scrollbars=yes,resizable=yes",
      );
      if (printWindow) {
        const printHTML = generatePrintHTML(printContent, false);
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            try {
              printWindow.print();
              printWindow.close();

              setTimeout(() => {
                console.log("🖨️ Desktop print completed, closing modal");
                onClose();

                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("printCompleted", {
                      detail: { closeAllModals: true, refreshData: true },
                    }),
                  );
                }
              }, 1000);
            } catch (printError) {
              console.log("⚠️ Direct print failed, offering download option");
              printWindow.close();
              // Fallback to download
              downloadReceiptFile(printContent, false, false);
            }
          }, 500);
        };

        // Handle print window errors
        printWindow.onerror = () => {
          console.log("⚠️ Print window error, offering download option");
          printWindow.close();
          downloadReceiptFile(printContent, false, false);
        };
      } else {
        // Popup blocked, offer download
        alert("Popup bị chặn. Sẽ tải file hóa đơn để bạn có thể in.");
        downloadReceiptFile(printContent, false, false);
      }
    } catch (error) {
      console.error("Desktop printing error:", error);
      downloadReceiptFile(printContent, false, false);
    }
  };

  // Generate optimized print HTML
  const generatePrintHTML = (printContent: HTMLElement, isMobile: boolean) => {
    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isAndroid = /android/.test(navigator.userAgent.toLowerCase());

    // Get clean HTML content and ensure consistent formatting
    let cleanContent = printContent.innerHTML;

    // Ensure all numbers are properly formatted for printing
    cleanContent = cleanContent.replace(
      /(\d{1,3}(?:\.\d{3})*) ₫/g,
      (match, number) => {
        return `${number} ₫`;
      },
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hóa đơn - ${receipt?.transactionId || "HĐ"}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 14px;
            line-height: 1.3;
            margin: ${isMobile ? "10px" : "15px"};
            padding: 0;
            background: white;
            color: black;
            width: ${isMobile ? "350px" : "280px"};
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .text-blue-600 { color: #2563eb; }
          .text-green-800 { color: #166534; }
          .text-red-600 { color: #dc2626; }
          .text-gray-600 { color: #4b5563; }
          .border-t { border-top: 1px solid #000; margin: 8px 0; padding-top: 8px; }
          .border-b { border-bottom: 1px solid #000; margin: 8px 0; padding-bottom: 8px; }
          .border-gray-300 { border-color: #d1d5db; }
          .flex { display: flex; justify-content: space-between; align-items: center; }
          .flex-1 { flex: 1; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .space-y-1 > * + * { margin-top: 2px; }
          .space-y-2 > * + * { margin-top: 4px; }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 4px; }
          .mb-3 { margin-bottom: 6px; }
          .mb-4 { margin-bottom: 8px; }
          .py-1 { padding: 2px 0; }
          .py-2 { padding: 4px 0; }
          .py-3 { padding: 6px 0; }
          .pt-3 { padding-top: 6px; }
          img { max-width: 80px; height: auto; display: block; margin: 0 auto; }
          .receipt-container { max-width: 100%; margin: 0 auto; }
          ${
            isMobile
              ? `
          .print-instructions {
            margin-top: 20px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
          }`
              : ""
          }
          @media print {
            body { 
              margin: 0; 
              padding: 10px;
              font-size: 14px;
              font-weight: bold;
              width: 280px;
            }
            .receipt-container { max-width: 100%; }
            .print-instructions { display: none; }
            .text-blue-600 { color: #000 !important; }
            .text-green-800 { color: #000 !important; }
            .text-red-600 { color: #000 !important; }
            .text-gray-600 { color: #666 !important; }
          }
          /* iOS Safari specific optimizations */
          @supports (-webkit-touch-callout: none) {
            body { -webkit-print-color-adjust: exact; }
          }
          /* Android Chrome specific optimizations */
          @media (max-device-width: 480px) {
            .receipt-container { max-width: 100%; padding: 0 5px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${cleanContent}
          ${
            isMobile
              ? `
          <div class="print-instructions">
            <div class="font-bold text-center">Hướng dẫn in:</div>
            <div>• Nhấn nút Menu hoặc Share trên trình duyệt</div>
            <div>• Chọn "Print" hoặc "In"</div>
            <div>• Hoặc chia sẻ với ứng dụng in khác</div>
            ${isIOS ? "<div>• Trên iOS: Chọn Share → Print</div>" : ""}
            ${isAndroid ? "<div>• Trên Android: Menu → Print hoặc Share</div>" : ""}
          </div>`
              : ""
          }
        </div>
        <script>
          // Auto-open print dialog after short delay (more reliable timing)
          setTimeout(() => {
            try {
              window.print();
            } catch (e) {
              console.log("Auto-print failed, user needs to print manually");
            }
          }, ${isMobile ? "1500" : "800"});
        </script>
      </body>
      </html>
    `;
  };

  // Enhanced download receipt file function - generates PDF
  const downloadReceiptFile = async (
    printContent: HTMLElement,
    isIOS: boolean,
    isAndroid: boolean,
  ) => {
    try {
      console.log("📄 Generating PDF for receipt download");

      // Create a new window for PDF generation
      const printWindow = window.open("", "_blank", "width=400,height=600");
      if (!printWindow) {
        throw new Error("Popup blocked - cannot generate PDF");
      }

      const cleanReceiptHTML = generatePrintHTML(printContent, true);
      printWindow.document.write(cleanReceiptHTML);
      printWindow.document.close();

      // Wait for content to load then trigger print to PDF
      await new Promise((resolve) => {
        printWindow.onload = () => {
          setTimeout(() => {
            try {
              // Trigger print dialog which allows saving as PDF
              printWindow.print();

              // Instructions for saving as PDF
              const pdfInstructions = isIOS
                ? "✅ Hộp thoại in đã mở!\n\nĐể lưu thành PDF:\n1. Trong hộp thoại in, chọn destination\n2. Chọn 'Save as PDF' hoặc 'Lưu thành PDF'\n3. Nhấn Save để tải file PDF"
                : isAndroid
                  ? "✅ Hộp thoại in đã mở!\n\nĐể lưu thành PDF:\n1. Trong hộp thoại in, chọn máy in\n2. Chọn 'Save as PDF' hoặc 'Lưu thành PDF'\n3. Nhấn Print để tải file PDF"
                  : "✅ Hộp thoại in đã mở!\n\nĐể lưu thành PDF:\n1. Trong hộp thoại in, chọn destination/máy in\n2. Chọn 'Save as PDF' hoặc 'Microsoft Print to PDF'\n3. Nhấn Save/Print để tải file PDF";

              alert(pdfInstructions);

              // Auto close after delay
              setTimeout(() => {
                if (!printWindow.closed) {
                  printWindow.close();
                }
                onClose();
              }, 3000);

              resolve(true);
            } catch (printError) {
              console.error("PDF generation error:", printError);
              printWindow.close();
              throw printError;
            }
          }, 1000);
        };
      });
    } catch (error) {
      console.error("❌ PDF generation failed:", error);

      // Fallback to HTML download if PDF generation fails
      console.log("🔄 Falling back to HTML download");
      const cleanReceiptHTML = generatePrintHTML(printContent, true);
      const blob = new Blob([cleanReceiptHTML], {
        type: "text/html;charset=utf-8",
      });
      const fileName = `hoa-don-${receipt?.transactionId || Date.now()}.html`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        const fallbackInstructions =
          "⚠️ Không thể tạo PDF, đã tải file HTML thay thế.\n\nĐể chuyển thành PDF:\n1. Mở file HTML vừa tải\n2. Nhấn Ctrl+P (hoặc Cmd+P trên Mac)\n3. Chọn 'Save as PDF' trong hộp thoại in\n4. Nhấn Save để lưu file PDF";
        alert(fallbackInstructions);
        onClose();
      }, 500);
    }
  };

  // Enhanced browser print dialog function
  const openBrowserPrintDialog = async (
    printContent: HTMLElement,
    isIOS: boolean,
    isAndroid: boolean,
    isSafari: boolean,
    isChrome: boolean,
  ) => {
    const windowFeatures = isAndroid
      ? "width=400,height=600,scrollbars=yes,resizable=yes"
      : isIOS
        ? "width=375,height=667,scrollbars=yes,resizable=yes"
        : "width=400,height=600,scrollbars=yes";

    const printWindow = window.open("", "_blank", windowFeatures);

    if (printWindow) {
      const printHTML = generatePrintHTML(printContent, true);
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Platform-specific print handling
      const printDelay = isIOS ? 2000 : isAndroid ? 1500 : 1000;

      setTimeout(() => {
        try {
          printWindow.print();

          // Auto close handling
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
            onClose();
          }, printDelay);
        } catch (e) {
          const browserTip = isSafari
            ? "Vui lòng sử dụng menu Safari → Share → Print"
            : isChrome
              ? "Vui lòng sử dụng menu Chrome (⋮) → Print"
              : "Vui lòng sử dụng menu trình duyệt để in";

          alert(browserTip);
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
            onClose();
          }, 500);
        }
      }, printDelay);
    } else {
      alert(
        "Không thể mở cửa sổ in. Popup có thể bị chặn.\nSẽ tải file để bạn có thể in.",
      );
      downloadReceiptFile(printContent, isIOS, isAndroid);
    }
  };

  const handleDesktopPrint = (printContent: HTMLElement) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body {
                font-family: tahoma;
                font-size: 14px;
                font-weight: bold;
                margin: 0;
                padding: 15px;
                background: white;
                color: black;
                width: 280px;
              }
              .receipt-container {
                width: 100%;
                margin: 0 auto;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .text-blue-600 { color: #2563eb; }
              .text-green-800 { color: #166534; }
              .text-red-600 { color: #dc2626; }
              .text-gray-600 { color: #4b5563; }
              .border-t { border-top: 1px solid #000; margin: 8px 0; padding-top: 8px; }
              .border-b { border-bottom: 1px solid #000; margin: 8px 0; padding-bottom: 8px; }
              .border-gray-300 { border-color: #d1d5db; }
              .flex { display: flex; justify-content: space-between; align-items: center; }
              .flex-1 { flex: 1; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .space-y-1 > * + * { margin-top: 2px; }
              .space-y-2 > * + * { margin-top: 4px; }
              .mb-1 { margin-bottom: 2px; }
              .mb-2 { margin-bottom: 4px; }
              .mb-3 { margin-bottom: 6px; }
              .mb-4 { margin-bottom: 8px; }
              .py-1 { padding: 2px 0; }
              .py-2 { padding: 4px 0; }
              .py-3 { padding: 6px 0; }
              .pt-3 { padding-top: 6px; }
              img { max-width: 80px; height: auto; display: block; margin: 0 auto; }
              @media print {
                body { 
                  margin: 0; 
                  padding: 10px;
                  font-size: 14px;
                  font-weight: bold;
                  width: 280px;
                }
                .receipt-container { width: 100%; }
                .text-blue-600 { color: #000 !important; }
                .text-green-800 { color: #000 !important; }
                .text-red-600 { color: #000 !important; }
                .text-gray-600 { color: #666 !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for images to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();

          // Auto close after print and refresh data
          setTimeout(() => {
            console.log(
              "🖨️ Receipt Modal: Auto-closing after print and refreshing data",
            );

            onClose();

            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("printCompleted", {
                  detail: { closeAllModals: true, refreshData: true },
                }),
              );
              window.dispatchEvent(
                new CustomEvent("refreshOrders", {
                  detail: { immediate: true },
                }),
              );
              window.dispatchEvent(
                new CustomEvent("refreshTables", {
                  detail: { immediate: true },
                }),
              );
            }
          }, 1000);
        }, 500);
      };

      // Close modal immediately after opening print window
      setTimeout(() => {
        console.log("🖨️ Closing receipt modal immediately after print");
        onClose();
      }, 50);
    }
  };

  const handleEmail = () => {
    // Mock email functionality
    alert("Email functionality would be implemented here");
  };

  const handleConfirmAndSelectPayment = () => {
    console.log(
      "📄 Receipt Modal: Confirming receipt and proceeding to payment method selection",
    );
    console.log("🎯 Receipt data being passed:", {
      receipt,
      cartItems,
      total,
      subtotal: receipt?.subtotal,
      tax: receipt?.tax,
      exactTotal: receipt?.exactTotal,
      exactSubtotal: receipt?.exactSubtotal,
      exactTax: receipt?.exactTax,
    });

    // Show payment method modal directly
    setShowPaymentMethodModal(true);
  };

  // Placeholder for handlePaymentMethodSelect, assuming it's defined elsewhere or in a parent component
  const handlePaymentMethodSelect = (method: string) => {
    console.log("Selected payment method:", method);
    // Logic to handle payment method selection, potentially opening e-invoice modal
  };

  // If receipt is null but isPreview is true, we still render the modal structure but without receipt data
  // This case is handled by the check below, which will render a message if receipt is null.
  // We only return null if !isOpen
  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    console.log(
      "🔴 Receipt Modal: handleClose called - closing all popups and refreshing data without notification",
    );

    // Send refresh signal without notification
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `https://order-mobile-be.onrender.com/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "receipt_closed",
            action: "refresh_all_data",
            clearCart: true,
            showNotification: false, // No notification when just closing
            timestamp: new Date().toISOString(),
          }),
        );
        ws.close();
      };
    } catch (error) {
      console.error("Failed to send refresh signal:", error);
    }

    // Clear all popup states
    if (typeof window !== "undefined") {
      (window as any).previewReceipt = null;
      (window as any).orderForPayment = null;

      // Send event to close all popups without notification
      window.dispatchEvent(
        new CustomEvent("closeAllPopups", {
          detail: {
            source: "receipt_modal_closed",
            showSuccessNotification: false, // No notification
            timestamp: new Date().toISOString(),
          },
        }),
      );

      // Clear cart
      window.dispatchEvent(
        new CustomEvent("clearCart", {
          detail: {
            source: "receipt_modal_closed",
            timestamp: new Date().toISOString(),
          },
        }),
      );
    }

    // Close the modal
    onClose();
  };

  // Use stored values directly from receipt data
  const calculateSubtotal = () => {
    return Math.floor(parseFloat(receipt?.subtotal || "0"));
  };

  const calculateTax = () => {
    return Math.floor(parseFloat(receipt?.tax || "0"));
  };

  const calculateTotal = () => {
    return Math.floor(parseFloat(receipt?.total || "0"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isPreview ? t("pos.receiptPreview") : t("pos.receipt")}
          </DialogTitle>
        </DialogHeader>

        {hasReceiptData ? (
          <div
            id="receipt-content"
            className="receipt-print bg-white"
            style={{ padding: "16px", fontSize: "16px", fontWeight: "bold" }}
          >
            <div className="text-center mb-4">
              <p className="text-xs font-semibold mb-1">
                {storeSettings?.storeName ||
                  "Easy Digital Point Of Sale Service"}
              </p>
              <p className="text-xs mb-0.5">{t("pos.mainStoreLocation")}</p>
              <p className="text-xs mb-0.5">
                {storeSettings?.address || "123 Commerce St, City, State 12345"}
              </p>
              <p className="text-xs mb-2">
                {t("pos.phone")} {storeSettings?.phone || "(555) 123-4567"}
              </p>
              <div className="flex items-center justify-center">
                <img src={logoPath} alt="EDPOS Logo" className="h-6" />
              </div>
              <p className="text-lg mb-2 invoice_title">{title}</p>
            </div>

            <div className="border-t border-b border-gray-300 py-3 mb-3">
              <div className="flex justify-between text-sm">
                <span>{t("pos.transactionNumber")}</span>
                <span>{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("pos.date")}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("pos.cashier")}</span>
                <span>{receipt.cashierName}</span>
              </div>
              {receipt?.customerName && (
                <div className="flex justify-between text-sm">
                  <span>{t("einvoice.customer")}:</span>
                  <span>{receipt.customerName}</span>
                </div>
              )}
              {receipt?.customerTaxCode && (
                <div className="flex justify-between text-sm">
                  <span>{t("einvoice.taxCode")}</span>
                  <span>{receipt.customerTaxCode}</span>
                </div>
              )}
              {receipt.paymentMethod === "einvoice" && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>{t("einvoice.invoicestatus")}:</span>
                  <span>
                    {receipt.invoiceNumber
                      ? `${t("einvoice.released")}`
                      : `${t("einvoice.notReleased")}`}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-3">
              {(receipt.items || []).map((item, index) => {
                // Use exact values from database
                const unitPrice = parseFloat(
                  item.unitPrice || item.price || "0",
                );
                const quantity = item.quantity || 1;
                // Get item-level discount from order_items.discount
                const itemDiscount = parseFloat(item.discount || "0");
                // Use total from database directly (already includes discount)
                const itemTotal = parseFloat(item.total || "0");
                // Calculate subtotal before discount for this item
                const itemSubtotal = unitPrice * quantity;

                console.log(`Receipt Item:`, receipt);

                console.log(`Receipt Item ${index}:`, {
                  name: item.productName || item.name,
                  unitPrice,
                  quantity,
                  itemDiscount,
                  itemTotal,
                  itemSubtotal,
                  hasDiscount: itemDiscount > 0,
                });

                return (
                  <div key={item.id || Math.random()}>
                    <div className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.productName || item.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-600">
                          SKU:{" "}
                          {item.productSku ||
                            `FOOD${String(item.productId || item.id || "0").padStart(5, "0")}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {quantity} x {unitPrice.toLocaleString("vi-VN")} ₫
                        </div>
                        {/* Always show discount line if there's any discount */}
                        {itemDiscount > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            Giảm giá: -
                            {Math.floor(itemDiscount).toLocaleString("vi-VN")} ₫
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div>
                          <div className="text-xs text-black-500">
                            {Math.floor(itemSubtotal).toLocaleString("vi-VN")} ₫
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-300 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t("reports.subtotal")}:</span>
                <span>
                  {(() => {
                    // Calculate subtotal as sum of unit price * quantity for all items (before discount)
                    const itemsSubtotal = parseFloat(receipt.subtotal || "0");
                    return itemsSubtotal.toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("reports.tax")}:</span>
                <span>
                  {(() => {
                    // Always use tax directly from database
                    const taxValue = parseFloat(receipt.tax || "0");
                    return Math.floor(taxValue).toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
              {(() => {
                // Only show discount if there are item-level discounts or order-level discount
                // Calculate total discount: sum of item discounts + order discount
                const totalItemDiscount = (receipt.items || []).reduce(
                  (sum, item) => {
                    return sum + parseFloat(item.discount || "0");
                  },
                  0,
                );
                const orderDiscount = parseFloat(receipt.discount || "0");
                // Discount is already distributed to items, so only show order-level discount if it exists separately
                const totalDiscount =
                  totalItemDiscount > 0 ? totalItemDiscount : orderDiscount;
                return totalDiscount > 0;
              })() && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>{t("reports.discount")}</span>
                  <span className="font-medium">
                    -
                    {(() => {
                      // Show total discount (items + order level)
                      const totalItemDiscount = (receipt.items || []).reduce(
                        (sum, item) => {
                          return sum + parseFloat(item.discount || "0");
                        },
                        0,
                      );
                      const orderDiscount = parseFloat(receipt.discount || "0");
                      // Only add order discount if it's not already distributed to items
                      const totalDiscount =
                        totalItemDiscount > 0
                          ? totalItemDiscount
                          : orderDiscount;
                      return Math.floor(totalDiscount).toLocaleString("vi-VN");
                    })()}{" "}
                    ₫
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>{t("reports.totalMoney")}:</span>
                <span>
                  {(() => {
                    // Always use total directly from database
                    const totalValue = parseFloat(receipt.total || "0");
                    return Math.floor(totalValue).toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
            </div>
          </div>
        ) : isPreview && hasCartData && total > 0 ? (
          // Generate preview receipt from cartItems when in preview mode
          <div
            id="receipt-content"
            className="receipt-print bg-white"
            style={{ padding: "16px", fontSize: "16px", fontWeight: "bold" }}
          >
            <div className="text-center mb-4">
              <p className="text-xs font-semibold mb-1">
                {storeSettings?.storeName ||
                  "Easy Digital Point Of Sale Service"}
              </p>
              <p className="text-xs mb-0.5">{t("pos.mainStoreLocation")}</p>
              <p className="text-xs mb-0.5">
                {storeSettings?.address || "123 Commerce St, City, State 12345"}
              </p>
              <p className="text-xs mb-2">
                {t("pos.phone")} {storeSettings?.phone || "(555) 123-4567"}
              </p>
              <div className="flex items-center justify-center">
                <img src={logoPath} alt="EDPOS Logo" className="h-6" />
              </div>
              <p className="text-lg mb-2 invoice_title">{title}</p>
            </div>

            <div className="border-t border-b border-gray-300 py-3 mb-3">
              <div className="flex justify-between text-sm">
                <span>{t("pos.transactionNumber")}</span>
                <span>PREVIEW-{Date.now()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("pos.date")}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("pos.cashier")}</span>
                <span>Nhân viên</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {cartItems.map((item, index) => {
                const unitPrice =
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price;
                const quantity = item.quantity;
                const itemDiscount = parseFloat(item.discount || "0");
                const itemSubtotal = unitPrice * quantity;
                const itemTotal = itemSubtotal - itemDiscount;

                console.log(`Preview Item ${index}:`, {
                  name: item.name,
                  unitPrice,
                  quantity,
                  itemDiscount,
                  itemTotal,
                  itemSubtotal,
                  hasDiscount: itemDiscount > 0,
                });

                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-600">
                          SKU:{" "}
                          {item.sku ||
                            `FOOD${String(item.id).padStart(5, "0")}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {quantity} x {unitPrice.toLocaleString("vi-VN")} ₫
                        </div>
                        {/* Always show discount line if there's any discount */}
                        {itemDiscount > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            Giảm giá: -
                            {Math.floor(itemDiscount).toLocaleString("vi-VN")} ₫
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div>
                          <div className="text-xs text-black-500">
                            {Math.floor(itemSubtotal).toLocaleString("vi-VN")} ₫
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-300 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{t("reports.subtotal")}:</span>
                <span>
                  {(() => {
                    // Calculate subtotal as sum of unit price * quantity for all items (before discount)
                    const itemsSubtotal = parseFloat(receipt.subtotal || "0");
                    return itemsSubtotal.toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("reports.tax")}:</span>
                <span>
                  {(() => {
                    // Use exactTax first, then fallback to tax from database
                    const taxValue =
                      receipt?.exactTax ?? parseFloat(receipt?.tax || "0");
                    return Math.floor(taxValue).toLocaleString("vi-VN");
                  })()}{" "}
                  ₫
                </span>
              </div>
              {(() => {
                // Calculate total discount from cart items only (no double counting)
                const totalItemDiscount = cartItems.reduce((sum, item) => {
                  return sum + parseFloat(item.discount || "0");
                }, 0);
                // Don't add order discount if item discounts exist (to avoid double counting)
                const orderDiscount = Number(
                  receipt?.discount || total?.discount || 0,
                );
                const totalDiscount =
                  totalItemDiscount > 0 ? totalItemDiscount : orderDiscount;
                return totalDiscount > 0;
              })() && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>{t("reports.discount")}</span>
                  <span className="font-medium">
                    -
                    {(() => {
                      const totalItemDiscount = cartItems.reduce(
                        (sum, item) => {
                          return sum + parseFloat(item.discount || "0");
                        },
                        0,
                      );
                      const orderDiscount = Number(
                        receipt?.discount || total?.discount || 0,
                      );
                      // Show either item discounts or order discount, not both
                      const totalDiscount =
                        totalItemDiscount > 0
                          ? totalItemDiscount
                          : orderDiscount;
                      return Math.floor(totalDiscount).toLocaleString("vi-VN");
                    })()}{" "}
                    ₫
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>{t("reports.totalMoney")}:</span>
                <span>
                  {Number(
                    receipt?.total || total?.total || total || 0,
                  ).toLocaleString("vi-VN")}{" "}
                  ₫
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Fallback content - should not reach here due to validation above
          <div className="p-4 text-center">
            <p>Đang tải dữ liệu hóa đơn...</p>
            <Button onClick={onClose} className="mt-4">
              {t("reports.close")}
            </Button>
          </div>
        )}

        <div className="flex justify-center p-2 border-t">
          {isPreview ? (
            <div className="flex space-x-3 w-full">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
              >
                {t("pos.cancel")}
              </Button>
              <Button
                onClick={handleConfirmAndSelectPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
              >
                {t("pos.confirmAndSelectPayment")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => {
                  handlePrint(); // First print
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                <Printer className="mr-2" size={16} />
                {t("pos.printReceipt")}
              </Button>
              <Button onClick={handleClose} variant="outline" className="ml-2">
                {t("common.close")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <PaymentMethodModal
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          onSelectMethod={handlePaymentMethodSelect}
          total={
            receipt?.exactTotal ||
            parseFloat(receipt?.total || "0") ||
            total ||
            0
          }
          cartItems={receipt?.items || cartItems}
          orderForPayment={
            typeof window !== "undefined" && (window as any).orderForPayment
              ? (window as any).orderForPayment
              : {
                  id: receipt?.id || `temp-${Date.now()}`,
                  orderNumber:
                    receipt?.orderNumber ||
                    receipt?.transactionId ||
                    `ORD-${Date.now()}`,
                  tableId: receipt?.tableId || null,
                  customerName: receipt?.customerName || "Khách hàng lẻ",
                  status: "pending",
                  paymentStatus: "pending",
                  items: receipt?.items || cartItems || [],
                  subtotal:
                    receipt?.exactSubtotal ||
                    parseFloat(receipt?.subtotal || "0"),
                  tax: receipt?.exactTax || parseFloat(receipt?.tax || "0"),
                  discount:
                    receipt?.exactDiscount ||
                    parseFloat(receipt?.discount || "0"),
                  total:
                    receipt?.exactTotal || parseFloat(receipt?.total || "0"),
                  exactSubtotal:
                    receipt?.exactSubtotal ||
                    parseFloat(receipt?.subtotal || "0"),
                  exactTax:
                    receipt?.exactTax || parseFloat(receipt?.tax || "0"),
                  exactDiscount:
                    receipt?.exactDiscount ||
                    parseFloat(receipt?.discount || "0"),
                  exactTotal:
                    receipt?.exactTotal || parseFloat(receipt?.total || "0"),
                  orderedAt: new Date().toISOString(),
                }
          }
          receipt={receipt}
          onReceiptReady={(receiptData) => {
            console.log("📋 Receipt ready from payment method:", receiptData);
          }}
        />
      )}

      {/* E-Invoice Modal */}
      {showEInvoiceModal && (
        <EInvoiceModal
          isOpen={showEInvoiceModal}
          onClose={() => setShowEInvoiceModal(false)}
          onConfirm={(eInvoiceData) => {
            console.log("📧 E-Invoice confirmed:", eInvoiceData);
            setShowEInvoiceModal(false);

            // Sau khi e-invoice xử lý xong (phát hành ngay hoặc phát hành sau),
            // hiển thị lại receipt modal để in hóa đơn
            console.log("📄 Showing receipt modal after e-invoice processing");
          }}
          total={
            typeof receipt?.total === "string"
              ? parseFloat(receipt.total)
              : receipt?.total || 0
          }
          selectedPaymentMethod={receipt?.paymentMethod || "cash"}
          cartItems={(() => {
            console.log("🔄 Receipt Modal - Preparing cartItems for EInvoice:");
            console.log("- cartItems prop:", cartItems);
            console.log("- cartItems length:", cartItems?.length || 0);
            console.log("- receipt items:", receipt?.items);

            // Always prefer cartItems prop since it has the most accurate data
            if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
              console.log(
                "✅ Using cartItems prop for e-invoice (most accurate data)",
              );
              // Ensure all cartItems have proper structure
              const processedCartItems = cartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price:
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price,
                quantity:
                  typeof item.quantity === "string"
                    ? parseInt(item.quantity)
                    : item.quantity,
                sku: item.sku || `FOOD${String(item.id).padStart(5, "0")}`,
                taxRate: item.taxRate || 0,
              }));
              console.log(
                "🔧 Processed cartItems for e-invoice:",
                processedCartItems,
              );
              return processedCartItems;
            } else if (
              receipt?.items &&
              Array.isArray(receipt.items) &&
              receipt.items.length > 0
            ) {
              console.log("⚠️ Fallback to receipt items for e-invoice");
              return receipt.items.map((item) => ({
                id: item.productId || item.id,
                name: item.productName,
                price:
                  typeof item.price === "string"
                    ? parseFloat(item.price)
                    : item.price,
                quantity:
                  typeof item.quantity === "string"
                    ? parseInt(item.quantity)
                    : item.quantity,
                sku:
                  item.productId?.toString() ||
                  `FOOD${String(item.id).padStart(5, "0")}`,
                taxRate: 0,
              }));
            } else {
              console.error("❌ No valid cart items found for e-invoice");
              return [];
            }
          })()}
        />
      )}
    </Dialog>
  );
}
