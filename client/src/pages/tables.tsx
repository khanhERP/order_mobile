import { useState, useEffect } from "react";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { TableGrid } from "@/components/tables/table-grid";
import { OrderManagement } from "@/components/orders/order-management";
import { TableManagement } from "@/components/tables/table-management";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Settings, ClipboardList, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

interface TablesPageProps {
  onLogout: () => void;
}

export default function TablesPage({ onLogout }: TablesPageProps) {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [defaultTab, setDefaultTab] = useState<string>("details");
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Add WebSocket listener for data refresh
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("📡 Tables: WebSocket connected for refresh signals");
          // Register as table management client
          ws?.send(
            JSON.stringify({
              type: "register_table_management",
              timestamp: new Date().toISOString(),
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📩 Tables: Received WebSocket message:", data);

            if (
              data.type === "popup_close" ||
              data.type === "payment_success" ||
              data.type === "force_refresh" ||
              data.type === "einvoice_published" ||
              data.type === "einvoice_saved_for_later"
            ) {
              console.log(
                "🔄 Tables: Refreshing data due to WebSocket signal:",
                data.type,
              );

              // Clear cache and force refresh
              queryClient.clear();
              queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
              queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });

              // Dispatch custom events for TableGrid component
              window.dispatchEvent(
                new CustomEvent("refreshTableData", {
                  detail: {
                    source: "tables_websocket",
                    reason: data.type,
                    timestamp: new Date().toISOString(),
                  },
                }),
              );
            }
          } catch (error) {
            console.error(
              "❌ Tables: Error processing WebSocket message:",
              error,
            );
          }
        };

        ws.onclose = () => {
          console.log(
            "📡 Tables: WebSocket disconnected, attempting reconnect...",
          );
          setTimeout(connectWebSocket, 2000);
        };

        ws.onerror = (error) => {
          console.error("❌ Tables: WebSocket error:", error);
        };
      } catch (error) {
        console.error("❌ Tables: Failed to connect WebSocket:", error);
        setTimeout(connectWebSocket, 2000);
      }
    };

    // Add custom event listeners for e-invoice events
    const handleEInvoiceEvents = (event: CustomEvent) => {
      console.log(
        "📧 Tables: E-invoice event received:",
        event.type,
        event.detail,
      );

      // Force data refresh for any e-invoice related events
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"] });

      // Dispatch refresh event for TableGrid
      window.dispatchEvent(
        new CustomEvent("refreshTableData", {
          detail: {
            source: "tables_einvoice_event",
            reason: event.type,
            timestamp: new Date().toISOString(),
          },
        }),
      );
    };

    // Listen for e-invoice related events
    window.addEventListener("einvoicePublished", handleEInvoiceEvents as EventListener);
    window.addEventListener("einvoiceSavedForLater", handleEInvoiceEvents as EventListener);
    window.addEventListener("forceDataRefresh", handleEInvoiceEvents as EventListener);

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      // Clean up event listeners
      window.removeEventListener("einvoicePublished", handleEInvoiceEvents as EventListener);
      window.removeEventListener("einvoiceSavedForLater", handleEInvoiceEvents as EventListener);
      window.removeEventListener("forceDataRefresh", handleEInvoiceEvents as EventListener);
    };
  }, [queryClient]);

  // Get tableId, tab, and floor from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('tableId');
    const tab = params.get('tab');
    const floor = params.get('floor');

    if (tableId) {
      setSelectedTableId(parseInt(tableId));
    }

    if (tab) {
      setDefaultTab(tab); // "details" or "products"
    }

    if (floor) {
      setSelectedFloor(decodeURIComponent(floor));
    }
  }, []);


  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <POSHeader />

      {/* Right Sidebar */}
      <RightSidebar />

      <div className="main-content pt-16 px-6">
        <div className="mx-auto py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("tables.title")}
              </h1>
              <p className="mt-2 text-gray-600">{t("tables.description")}</p>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                {t("tables.tableStatus")}
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {t("tables.orderManagement")}
              </TabsTrigger>
              <TabsTrigger
                value="management"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {t("tables.tableSettings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tables">
              <TableGrid
                selectedTableId={selectedTableId}
                onTableSelect={setSelectedTableId}
                defaultTab={defaultTab}
                selectedFloor={selectedFloor}
              />
            </TabsContent>

            <TabsContent value="orders">
              <OrderManagement />
            </TabsContent>

            <TabsContent value="management">
              <TableManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}