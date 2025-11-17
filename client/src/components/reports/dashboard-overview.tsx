import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useLocation } from "wouter";
import type { StoreSettings } from "@shared/schema";

interface OrderData {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  subtotal: string;
  paymentMethod: string;
  orderedAt: string;
  customerId?: number;
  tableId?: number;
  customerCount?: number;
  priceIncludeTax?: boolean;
  tax?: string;
  discount?: string;
}

interface OrderItemData {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  total: string;
  status?: string; // Added status to OrderItemData
}

export function DashboardOverview() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [activeTabStatus, setActiveTabStatus] = useState<"available" | "occupied">("occupied");

  // Fetch store settings
  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/store-settings"],
  });

  // Fetch tables with auto-refresh
  const { data: tablesData, refetch: refetchTables } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/tables"],
    refetchInterval: 3000, // Auto refresh every 3 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Fetch orders with auto-refresh
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/orders"],
    refetchInterval: 3000, // Auto refresh every 3 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // WebSocket listener for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/ws`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("📡 Dashboard: WebSocket connected for table status updates");
          ws?.send(
            JSON.stringify({
              type: "register_dashboard",
              timestamp: new Date().toISOString(),
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📩 Dashboard: Received WebSocket message:", data.type);

            // Refresh data on various events
            if (
              data.type === "payment_success" ||
              data.type === "order_status_update" ||
              data.type === "table_status_update" ||
              data.type === "force_refresh" ||
              data.type === "einvoice_published" ||
              data.type === "payment_completed" ||
              data.type === "popup_close" ||
              data.force_refresh === true
            ) {
              console.log("🔄 Dashboard: Refreshing table and order data...");
              
              // Clear cache and refetch
              queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/tables"] });
              queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/orders"] });
              
              // Force immediate refetch
              Promise.all([refetchTables(), refetchOrders()]).then(() => {
                console.log("✅ Dashboard: Data refreshed successfully");
              });
            }
          } catch (error) {
            console.error("❌ Dashboard: Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("❌ Dashboard: WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("📡 Dashboard: WebSocket disconnected, reconnecting...");
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error("❌ Dashboard: Error connecting WebSocket:", error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [queryClient, refetchTables, refetchOrders]);



  // Group tables by floor
  const tablesByFloor = useMemo(() => {
    if (!tablesData || !Array.isArray(tablesData)) return {};

    return tablesData.reduce((acc: any, table: any) => {
      const floor = table.floor || "1층";
      if (!acc[floor]) {
        acc[floor] = [];
      }

      // Find active order for this table
      const activeOrder = ordersData?.find((order: any) =>
        order.tableId === table.id &&
        !["paid", "cancelled"].includes(order.status)
      );

      acc[floor].push({
        ...table,
        activeOrder,
        orderId: activeOrder?.id,
      });

      return acc;
    }, {});
  }, [tablesData, ordersData]);

  // Get sorted floors
  const sortedFloors = useMemo(() => {
    const floors = Object.keys(tablesByFloor).sort((a, b) => {
      const floorNumA = parseInt(a.replace("층", "")) || 0;
      const floorNumB = parseInt(b.replace("층", "")) || 0;
      return floorNumA - floorNumB;
    });
    return ["all", ...floors];
  }, [tablesByFloor]);

  // Filter tables based on selected floor and status
  const filteredTables = useMemo(() => {
    let tables: any[] = [];

    if (selectedFloor === "all") {
      tables = Object.values(tablesByFloor).flat();
    } else {
      tables = tablesByFloor[selectedFloor] || [];
    }

    // Filter by status
    return tables.filter(table => {
      if (activeTabStatus === "occupied") {
        // Show tables with occupied status
        return table.status === "occupied";
      } else {
        // Show tables with available status
        return table.status === "available";
      }
    });
  }, [tablesByFloor, selectedFloor, activeTabStatus]);



  const handleTableClick = (table: any) => {
    // Always navigate to table details page
    setLocation(`/tables/mobile/${table.id}?floor=${encodeURIComponent(table.floor)}`);
  };



  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <Tabs value={activeTabStatus} onValueChange={(v) => setActiveTabStatus(v as "available" | "occupied")}>
          <TabsList className="w-full grid grid-cols-2 h-12">
            <TabsTrigger value="available" className="text-base">
              {t("tables.available")}
            </TabsTrigger>
            <TabsTrigger value="occupied" className="text-base">
              {t("tables.occupied")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Floor selector */}
      <div className="bg-white p-4 border-b">
        <div className="flex gap-2 overflow-x-auto">
          {sortedFloors.map((floor) => (
            <Button
              key={floor}
              variant={selectedFloor === floor ? "default" : "outline"}
              onClick={() => setSelectedFloor(floor)}
              className="whitespace-nowrap"
            >
              {floor === "all" ? t("tables.allFloors") : floor}
            </Button>
          ))}
        </div>
      </div>

      {/* Tables grid */}
      <div className="p-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {filteredTables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
                table.activeOrder
                  ? "bg-gradient-to-br from-blue-200 to-blue-300 border-blue-500 shadow-lg"
                  : "bg-gradient-to-br from-green-100 to-green-200 border-green-400 shadow-md"
              }`}
              onClick={() => handleTableClick(table)}
            >
              <CardContent className="p-4">
                <div className="space-y-2 text-center">
                  {/* Table name */}
                  <div className="font-bold text-xl text-gray-800">{table.tableNumber}</div>

                  {/* Status badge - always show */}
                  <div>
                    <Badge
                      className={`text-xs font-semibold shadow-md px-3 py-1 ${
                        table.status === "available"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : table.activeOrder
                          ? table.activeOrder.status === "pending"
                            ? "bg-orange-500 text-white"
                            : table.activeOrder.status === "preparing"
                            ? "bg-yellow-500 text-white"
                            : table.activeOrder.status === "ready"
                            ? "bg-green-500 text-white"
                            : table.activeOrder.status === "served"
                            ? "bg-blue-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {table.status === "available"
                        ? t("tables.available")
                        : table.activeOrder
                        ? table.activeOrder.status === "pending"
                          ? t("orders.status.pending")
                          : table.activeOrder.status === "preparing"
                          ? t("orders.status.preparing")
                          : table.activeOrder.status === "ready"
                          ? t("orders.status.ready")
                          : table.activeOrder.status === "served"
                          ? t("orders.status.served")
                          : t("tables.occupied")
                        : t("tables.occupied")}
                    </Badge>
                  </div>

                  {/* Customer count */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                      <Users className="w-4 h-4" />
                      <span>{table.activeOrder?.customerCount || table.capacity} {t("orders.people")}</span>
                    </div>
                  </div>

                  {/* Order info for occupied tables */}
                  {table.activeOrder && (
                    <div className="space-y-1.5 pt-2 border-t border-blue-300">
                      <div className="text-xs text-gray-600 font-medium">
                        {table.activeOrder.orderNumber}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                {activeTabStatus === "occupied"
                  ? t("tables.noOccupiedTables")
                  : t("tables.noAvailableTables")}
              </div>
            </div>
        )}
      </div>


    </div>
  );
}