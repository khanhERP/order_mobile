import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Utensils, Clock, Users, TrendingUp } from "lucide-react";
import type {
  Order,
  Table as TableType,
  Invoice,
  Transaction,
} from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

export function TableReport() {
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Fetch data using EXACT same pattern as other reports
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Table Report - Orders loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Table Report - Error fetching orders:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Table Report - Invoices loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Table Report - Error fetching invoices:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transactions"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transactions");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Table Report - Transactions loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Table Report - Error fetching transactions:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/tables");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Table Report - Tables loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Table Report - Error fetching tables:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch order items and transaction items for detailed analysis
  const { data: orderItems = [], isLoading: orderItemsLoading } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/order-items");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Table Report - Order items loaded:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Table Report - Error fetching order items:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const { data: transactionItems = [], isLoading: transactionItemsLoading } =
    useQuery({
      queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transaction-items"],
      queryFn: async () => {
        try {
          const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transaction-items");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log(
            "Table Report - Transaction items loaded:",
            data?.length || 0,
          );
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error(
            "Table Report - Error fetching transaction items:",
            error,
          );
          return [];
        }
      },
      retry: 3,
      retryDelay: 1000,
    });

  const getTableData = () => {
    if (!orders || !tables) return null;

    // Only use orders data - simplified approach
    const validOrders = Array.isArray(orders) ? orders : [];
    const validTables = Array.isArray(tables) ? tables : [];

    // Filter completed/paid orders within date range
    const completedOrders = validOrders.filter((order: any) => {
      try {
        if (!order || !order.orderedAt) return false;

        const orderDate = new Date(order.orderedAt);
        if (isNaN(orderDate.getTime())) return false;

        // Normalize dates for comparison
        const orderDateOnly = new Date(orderDate);
        orderDateOnly.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const dateMatch = orderDateOnly >= start && orderDateOnly <= end;

        // Only include paid/completed orders
        const isCompleted =
          order.status === "paid" || order.status === "completed";

        return dateMatch && isCompleted;
      } catch (error) {
        console.error("Table Report - Error filtering order:", order, error);
        return false;
      }
    });

    console.log("🍽️ Table Report Debug (Items Counting Focus):", {
      dateRange,
      startDate,
      endDate,
      totalOrders: validOrders.length,
      completedOrders: completedOrders.length,
      totalTables: validTables.length,
      orderItemsCount: orderItems?.length || 0,
      orderItemsIsArray: Array.isArray(orderItems),
      orderItemsAvailable: !!orderItems,
      sampleOrderItems: orderItems?.slice(0, 5) || [],
      allOrderItemsByOrder: completedOrders.map((order) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        itemsCount:
          orderItems?.filter((item: any) => item.orderId === order.id)
            ?.length || 0,
        actualItems:
          orderItems
            ?.filter((item: any) => item.orderId === order.id)
            ?.map((item) => ({
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              orderId: item.orderId,
            })) || [],
      })),
      totalItemsInSystem: orderItems?.length || 0,
      uniqueOrderIds: [
        ...new Set(orderItems?.map((item: any) => item.orderId) || []),
      ],
      completedOrderIds: completedOrders.map((o) => o.id),
    });

    // Initialize table stats map
    const tableStatsMap = new Map();

    // Add all tables to the map (including those with no orders)
    validTables.forEach((table: any) => {
      tableStatsMap.set(table.id, {
        tableId: table.id,
        tableName: table.tableNumber || table.name || `Bàn ${table.id}`,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageOrderValue: 0,
        utilizationRate: 0,
        peakHours: {} as { [hour: number]: number },
        itemsSold: 0,
        table: table,
      });
    });

    // Process completed orders
    completedOrders.forEach((order: any) => {
      const tableId = order.tableId;

      // Only process orders with valid tableId
      if (tableId && tableStatsMap.has(tableId)) {
        const stats = tableStatsMap.get(tableId);

        stats.totalRevenue += parseFloat(order.total || 0);
        stats.totalOrders += 1;
        stats.totalCustomers += order.customerCount || 1;

        // Track peak hours
        const hour = new Date(order.orderedAt).getHours();
        stats.peakHours[hour] = (stats.peakHours[hour] || 0) + 1;

        // Count order items for this order - simple logic with detailed debugging
        if (orderItems && Array.isArray(orderItems)) {
          console.log(`🔍 DEBUG Table ${tableId} - Order ${order.id}:`, {
            orderIdType: typeof order.id,
            orderIdValue: order.id,
            orderItemsTotal: orderItems.length,
            sampleOrderItems: orderItems.slice(0, 3).map((item) => ({
              id: item.id,
              orderId: item.orderId,
              orderIdType: typeof item.orderId,
              productName: item.productName,
              quantity: item.quantity,
            })),
            orderItemsWithMatchingOrderId: orderItems.filter((item: any) => {
              console.log(
                `  🔎 Comparing order.id=${order.id} (${typeof order.id}) with item.orderId=${item.orderId} (${typeof item.orderId})`,
              );
              return item.orderId === order.id;
            }).length,
          });

          // Find all order items that belong to this order
          const itemsForThisOrder = orderItems.filter(
            (item: any) => item.orderId === order.id,
          );

          // Sum up all quantities for this order
          let totalQuantityForOrder = 0;
          itemsForThisOrder.forEach((item: any) => {
            const quantity = Number(item.quantity || 0);
            totalQuantityForOrder += quantity;
            console.log(
              `  📦 Item ${item.id}: ${item.productName} x${quantity} (orderId: ${item.orderId})`,
            );
          });

          // Add to table stats
          stats.itemsSold += totalQuantityForOrder;

          console.log(
            `✅ Table ${tableId} - Order ${order.id}: Found ${itemsForThisOrder.length} items, total quantity: ${totalQuantityForOrder}, running total: ${stats.itemsSold}`,
          );
        } else {
          console.error(
            `❌ Table ${tableId} - Order ${order.id}: orderItems is not available`,
            {
              orderItemsType: typeof orderItems,
              orderItemsIsArray: Array.isArray(orderItems),
              orderItemsLength: orderItems?.length,
            },
          );
        }
      }
    });

    // Calculate derived metrics
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1,
    );

    tableStatsMap.forEach((stats) => {
      if (stats.totalOrders > 0) {
        stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
      }
      stats.utilizationRate = (stats.totalOrders / daysDiff) * 100;
    });

    // Convert to array and sort by revenue (desc), then by table ID for zero revenue tables
    const tableStats = Array.from(tableStatsMap.values()).sort((a, b) => {
      if (b.totalRevenue !== a.totalRevenue) {
        return b.totalRevenue - a.totalRevenue;
      }
      // If revenue is equal (including 0), sort by table ID
      return a.tableId - b.tableId;
    });

    // Final debug summary
    const totalItemsCalculated = tableStats.reduce(
      (sum, s) => sum + s.itemsSold,
      0,
    );
    console.log("🎯 Table Report Summary:", {
      completedOrdersCount: completedOrders.length,
      orderItemsCount: orderItems?.length || 0,
      totalItemsSold: totalItemsCalculated,
      tablesWithItems: tableStats.filter((s) => s.itemsSold > 0).length,
      tableResults: tableStats.map((s) => ({
        tableId: s.tableId,
        tableName: s.tableName,
        totalOrders: s.totalOrders,
        itemsSold: s.itemsSold,
        revenue: s.totalRevenue,
      })),
      allTableStats: tableStats.map((s) => ({
        tableId: s.tableId,
        tableName: s.tableName,
        totalOrders: s.totalOrders,
        itemsSold: s.itemsSold,
        revenue: s.totalRevenue,
      })),
    });

    // Calculate totals
    const totalRevenue = completedOrders.reduce((sum: number, order: any) => {
      // Revenue = Subtotal (đã trừ giảm giá) + Tax
      const subtotal = Number(order.subtotal || 0); // Thành tiền sau khi trừ giảm giá
      const tax = Number(order.tax || 0); // Thuế
      const revenue = subtotal + tax; // Doanh thu thực tế
      return sum + revenue;
    }, 0);
    const totalOrders = completedOrders.length;
    const totalCustomers = completedOrders.reduce(
      (sum: number, order: any) => sum + (order.customerCount || 1),
      0,
    );
    const averageUtilization =
      tableStats.length > 0
        ? tableStats.reduce((sum, stats) => sum + stats.totalOrders, 0) /
          tableStats.length
        : 0;

    // Sort tables by different metrics
    const topRevenueTables = [...tableStats].sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );
    const topTurnoverTables = [...tableStats].sort(
      (a, b) => b.utilizationRate - a.utilizationRate,
    );
    const topUtilizationTables = [...tableStats].sort(
      (a, b) => b.totalOrders - a.totalOrders,
    );

    return {
      tableStats,
      topRevenueTables,
      topTurnoverTables,
      topUtilizationTables,
      totalRevenue,
      totalOrders,
      totalCustomers,
      averageUtilization,
    };
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();

    switch (range) {
      case "today":
        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(today.toISOString().split("T")[0]);
        break;
      case "week":
        const currentDayOfWeek = today.getDay();
        const daysToLastMonday =
          currentDayOfWeek === 0 ? 13 : currentDayOfWeek + 6;
        const lastWeekMonday = new Date(
          today.getTime() - daysToLastMonday * 24 * 60 * 60 * 1000,
        );
        const lastWeekSunday = new Date(
          lastWeekMonday.getTime() + 6 * 24 * 60 * 60 * 1000,
        );

        setStartDate(lastWeekMonday.toISOString().split("T")[0]);
        setEndDate(lastWeekSunday.toISOString().split("T")[0]);
        break;
      case "month":
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const lastMonthYear = month === 0 ? year - 1 : year;
        const lastMonth = month === 0 ? 11 : month - 1;

        const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
        const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);

        const startDateStr = `${lastMonthStart.getFullYear()}-${(lastMonthStart.getMonth() + 1).toString().padStart(2, "0")}-${lastMonthStart.getDate().toString().padStart(2, "0")}`;
        const endDateStr = `${lastMonthEnd.getFullYear()}-${(lastMonthEnd.getMonth() + 1).toString().padStart(2, "0")}-${lastMonthEnd.getDate().toString().padStart(2, "0")}`;

        setStartDate(startDateStr);
        setEndDate(endDateStr);
        break;
      case "custom":
        const customCurrentDate = new Date().toISOString().split("T")[0];
        setStartDate(customCurrentDate);
        setEndDate(customCurrentDate);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ₫`;
  };

  const getTableStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t("tables.available"), variant: "default" as const },
      occupied: {
        label: t("tables.occupied"),
        variant: "destructive" as const,
      },
      reserved: { label: t("tables.reserved"), variant: "secondary" as const },
      maintenance: {
        label: t("tables.outOfService"),
        variant: "outline" as const,
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.available
    );
  };

  const getPeakHour = (peakHours: { [hour: number]: number }) => {
    const hours = Object.keys(peakHours);
    if (hours.length === 0) return null;

    const peak = hours.reduce((max, hour) =>
      peakHours[parseInt(hour)] > peakHours[parseInt(max)] ? hour : max,
    );
    return parseInt(peak);
  };

  const tableData = getTableData();

  const isLoading =
    ordersLoading ||
    invoicesLoading ||
    transactionsLoading ||
    tablesLoading ||
    orderItemsLoading ||
    transactionItemsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="ml-3 text-gray-500">
          {t("reports.loading") || "Đang tải dữ liệu..."}
        </div>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Không có dữ liệu để hiển thị</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {t("reports.tableAnalysis")}
              </CardTitle>
              <CardDescription>
                {t("reports.analyzeTableRevenueTrend")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t("reports.toDay")}</SelectItem>
                  <SelectItem value="week">{t("reports.lastWeek")}</SelectItem>
                  <SelectItem value="month">
                    {t("reports.lastMonth")}
                  </SelectItem>
                  <SelectItem value="custom">{t("reports.custom")}</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === "custom" && (
                <>
                  <div className="flex items-center gap-2">
                    <Label>{t("reports.startDate")}:</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>{t("reports.endDate")}:</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.averageUtilization")}
                </p>
                <p className="text-2xl font-bold">
                  {tableData.averageUtilization.toFixed(1)} {t("reports.times")}
                </p>
                <p className="text-xs text-gray-500">
                  {t("reports.averageOrdersPerTable")}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalOrders")}
                </p>
                <p className="text-2xl font-bold">{tableData.totalOrders}</p>
                <p className="text-xs text-gray-500">
                  {t("reports.allTables")}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalCustomers")}
                </p>
                <p className="text-2xl font-bold">{tableData.totalCustomers}</p>
                <p className="text-xs text-gray-500">
                  {t("reports.cumulativeVisitors")}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("reports.totalRevenue")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(tableData.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {t("reports.totalByTable")}
                </p>
              </div>
              <Utensils className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            {t("reports.tableAnalysis")}
          </CardTitle>
          <CardDescription>
            {t("reports.tableAnalysisDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tables.tableNumber") || "Bàn"}</TableHead>
                <TableHead>
                  {t("reports.currentStatus") || "Trạng thái hiện tại"}
                </TableHead>
                <TableHead>{t("reports.orders") || "Đơn hàng"}</TableHead>
                <TableHead>
                  {t("reports.totalRevenue") || "Tổng doanh thu"}
                </TableHead>
                <TableHead>
                  {t("reports.customerCount") || "Số khách hàng"}
                </TableHead>
                <TableHead>
                  {t("reports.averageOrderValue") || "Giá trị đơn hàng TB"}
                </TableHead>
                <TableHead>
                  {t("reports.turnoverRate") || "Tỷ lệ luân chuyển"}
                </TableHead>
                <TableHead>{t("reports.peakTime") || "Giờ cao điểm"}</TableHead>
                <TableHead>{t("reports.items") || "Số món bán"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.tableStats.map((stats) => {
                const statusConfig = getTableStatusBadge(stats.table.status);
                const peakHour = getPeakHour(stats.peakHours);

                return (
                  <TableRow key={stats.tableId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            stats.totalRevenue > 0
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        {stats.tableName}
                        {stats.totalRevenue === 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({t("reports.noRevenue") || "Chưa có doanh thu"})
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          ({stats.table.capacity}{" "}
                          {t("customers.people") || "người"})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stats.totalOrders} {t("orders.orderCount") || "đơn"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(stats.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      {stats.totalCustomers} {t("customers.people") || "người"}
                    </TableCell>
                    <TableCell>
                      {stats.totalOrders > 0
                        ? formatCurrency(stats.averageOrderValue)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stats.utilizationRate > 100 ? "default" : "outline"
                        }
                      >
                        {stats.utilizationRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {peakHour !== null
                        ? `${peakHour} ${t("reports.hour") || "giờ"}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {stats.itemsSold} {t("reports.items") || "món"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Revenue Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              {t("reports.topRevenueTables")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tableData.topRevenueTables
                .slice(0, 5)
                .map((stats: any, index: number) => (
                  <div
                    key={stats.tableId}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={index < 3 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{stats.tableName}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Turnover Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              {t("reports.topTurnoverTables")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tableData.topTurnoverTables
                .slice(0, 5)
                .map((stats: any, index: number) => (
                  <div
                    key={stats.tableId}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={index < 3 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{stats.tableName}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {stats.utilizationRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Utilization Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              {t("reports.topUtilizationTables")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tableData.topUtilizationTables
                .slice(0, 5)
                .map((stats: any, index: number) => (
                  <div
                    key={stats.tableId}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={index < 3 ? "default" : "outline"}
                        className="text-xs"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{stats.tableName}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {stats.totalOrders} {t("common.count")}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
