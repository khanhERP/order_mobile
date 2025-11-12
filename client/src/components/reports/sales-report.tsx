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
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function SalesReport() {
  const { t } = useTranslation();

  const [dateRange, setDateRange] = useState("today");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Query orders by date range
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/orders/date-range", startDate, endDate],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://order-mobile-be.onrender.com/api/orders/date-range/${startDate}/${endDate}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Query order items by date range
  const {
    data: orderItems = [],
    isLoading: orderItemsLoading,
    refetch: refetchOrderItems,
  } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/order-items/date-range", startDate, endDate],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://order-mobile-be.onrender.com/api/order-items/${startDate}/${endDate}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const getSalesData = () => {
    // Default return structure for empty data
    const defaultData = {
      dailySales: [],
      paymentMethods: [],
      hourlySales: {},
      totalRevenue: 0,
      subtotalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
    };

    try {
      // Combine all data sources - only paid/completed items
      // Filter orders to include only those with status 'paid' or equivalent
      const paidOrders = orders.filter((order: any) => order.status === "paid");

      // Group order items by order ID to avoid duplicates and ensure correct association
      const orderItemsMap = new Map<string, any[]>();
      orderItems.forEach((item: any) => {
        if (!orderItemsMap.has(item.orderId)) {
          orderItemsMap.set(item.orderId, []);
        }
        orderItemsMap.get(item.orderId)!.push(item);
      });

      // Create a unique set of order items to avoid duplicates
      const uniqueOrderItems = Array.from(orderItemsMap.values()).flat();

      const combinedData = [
        ...paidOrders,
        ...uniqueOrderItems.filter((item: any) => {
          // Check if the order item belongs to a paid order
          const correspondingOrder = paidOrders.find(
            (order: any) => order.id === item.orderId,
          );
          return !!correspondingOrder;
        }),
      ];

      // Remove any potential duplicate orders from the combined list
      const uniqueCombinedData = Array.from(
        new Map(
          combinedData.map((item) => [item.id || item.orderId, item]),
        ).values(),
      );

      if (uniqueCombinedData.length === 0) {
        return defaultData;
      }

      // Daily sales breakdown - process orders directly for accurate customer count
      const dailySales: {
        [date: string]: {
          revenue: number;
          orders: number;
          customers: number;
          discount: number;
        };
      } = {};

      // Process paid orders for daily sales
      paidOrders.forEach((order: any) => {
        try {
          const orderDate = new Date(order.orderedAt || order.createdAt);
          if (isNaN(orderDate.getTime())) return;

          const dateStr = orderDate.toISOString().split("T")[0];

          if (!dailySales[dateStr]) {
            dailySales[dateStr] = {
              revenue: 0,
              orders: 0,
              customers: 0,
              discount: 0,
            };
          }

          const orderSubtotal = Number(order.subtotal || 0);
          const orderTax = Number(order.tax || 0);
          const orderDiscount = Number(order.discount || 0);

          dailySales[dateStr].revenue += orderSubtotal + orderTax;
          dailySales[dateStr].orders += 1;
          dailySales[dateStr].customers += Number(order.customerCount || 1); // Use actual customerCount from order
          dailySales[dateStr].discount += orderDiscount;
        } catch (error) {
          console.warn("Error processing order for daily sales:", error);
        }
      });

      // Payment method breakdown
      const paymentMethods: {
        [method: string]: { count: number; revenue: number };
      } = {};

      uniqueCombinedData.forEach((item: any) => {
        try {
          // Payment method is likely on the order itself
          let method = item.paymentMethod || "cash";
          if (typeof method === "number") {
            method = method.toString();
          }

          if (!paymentMethods[method]) {
            paymentMethods[method] = { count: 0, revenue: 0 };
          }

          // For order items, we associate the payment method of the parent order
          const correspondingOrder = paidOrders.find(
            (order: any) => order.id === item.orderId,
          );
          const orderPaymentMethod =
            correspondingOrder?.paymentMethod || method;

          if (!paymentMethods[orderPaymentMethod]) {
            paymentMethods[orderPaymentMethod] = { count: 0, revenue: 0 };
          }

          paymentMethods[orderPaymentMethod].count += 1;

          const itemPrice = Number(item.price || item.total || 0);
          const itemQuantity = Number(item.quantity || 1);
          const revenue = itemPrice * itemQuantity;

          // Get discount from database, default to 0 if no data
          const discountAmount =
            item.discount !== undefined && item.discount !== null
              ? Number(item.discount)
              : 0;

          paymentMethods[orderPaymentMethod].revenue += revenue;
        } catch (error) {
          console.warn("Error processing item for payment methods:", error);
        }
      });

      // Hourly breakdown
      const hourlySales: { [hour: number]: number } = {};
      uniqueCombinedData.forEach((item: any) => {
        try {
          const itemDate = new Date(item.orderedAt || item.createdAt);
          if (isNaN(itemDate.getTime())) return;

          const hour = itemDate.getHours();
          const itemPrice = Number(item.price || item.total || 0);
          const itemQuantity = Number(item.quantity || 1);
          const revenue = itemPrice * itemQuantity;

          // Get discount from database, default to 0 if no data
          const discountAmount =
            item.discount !== undefined && item.discount !== null
              ? Number(item.discount)
              : 0;

          if (!isNaN(revenue) && revenue > 0) {
            hourlySales[hour] = (hourlySales[hour] || 0) + revenue;
          }
        } catch (error) {
          console.warn("Error processing item for hourly sales:", error);
        }
      });

      // Calculate totals based on unique combined data
      const totalRevenue = uniqueCombinedData.reduce(
        (sum: number, order: any) => {
          // Revenue = Subtotal (đã trừ giảm giá) + Tax
          const subtotal = Number(order.subtotal || 0); // Thành tiền sau khi trừ giảm giá
          const tax = Number(order.tax || 0); // Thuế
          const revenue = subtotal + tax; // Doanh thu thực tế

          return sum + revenue;
        },
        0,
      );

      // Calculate subtotal revenue (excluding tax)
      const subtotalRevenue = paidOrders.reduce((total: number, order: any) => {
        const subtotal = Number(order.subtotal || 0);
        const tax = Number(order.tax || 0);
        const discount = Number(order.discount || 0);
        const revenue = subtotal - discount; // Same formula as dashboard
        return total + revenue;
      }, 0);

      // Total orders should be based on unique orders, not items
      const totalOrders = paidOrders.length;

      // Calculate total customers by summing customer_count from paid orders (same as dashboard)
      const totalCustomers = paidOrders.reduce((total: number, order: any) => {
        const customerCount = Number(order.customerCount || 1); // Default to 1 if not specified
        console.log(
          `Sales Report - Processing order ${order.orderNumber}: customerCount=${customerCount}, running total=${total + customerCount}`,
        );
        return total + customerCount;
      }, 0);

      console.log(`Sales Report - Final customer count calculation:`, {
        totalPaidOrders: paidOrders.length,
        totalCustomers: totalCustomers,
        paidOrdersSample: paidOrders.slice(0, 2).map((o) => ({
          orderNumber: o.orderNumber,
          customerCount: o.customerCount,
        })),
      });

      console.log(`Sales Report - Returning final data:`, {
        totalCustomers,
        totalOrders,
        totalRevenue,
        verification: `${totalCustomers} customers from ${totalOrders} orders`,
      });
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const paymentMethodsArray = Object.entries(paymentMethods).map(
        ([method, data]) => ({
          method,
          ...data,
        }),
      );

      return {
        dailySales: Object.entries(dailySales)
          .map(([date, data]) => ({
            date,
            ...data,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        paymentMethods: paymentMethodsArray,
        hourlySales,
        totalRevenue,
        subtotalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
      };
    } catch (error) {
      console.error("Error processing sales data:", error);
      return defaultData;
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const d = date.getDate().toString().padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    switch (range) {
      case "today":
        const todayStr = formatDate(today);
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;

      case "week":
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - 1);
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - 7);
        setStartDate(formatDate(lastWeekStart));
        setEndDate(formatDate(lastWeekEnd));
        break;

      case "month":
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        const lastMonthStart = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          1,
        );
        const lastMonthEnd = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0,
        );
        setStartDate(formatDate(lastMonthStart));
        setEndDate(formatDate(lastMonthEnd));
        break;

      case "thisWeek":
        const currentDayOfWeek = today.getDay();
        const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const thisWeekMonday = new Date(today);
        thisWeekMonday.setDate(today.getDate() - daysToMonday);
        const thisWeekSunday = new Date(thisWeekMonday);
        thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);
        setStartDate(formatDate(thisWeekMonday));
        setEndDate(formatDate(thisWeekSunday));
        break;

      case "thisMonth":
        const thisMonthStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        const thisMonthEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );
        setStartDate(formatDate(thisMonthStart));
        setEndDate(formatDate(thisMonthEnd));
        break;

      case "custom":
        break;

      default:
        const defaultDate = formatDate(today);
        setStartDate(defaultDate);
        setEndDate(defaultDate);
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ₫`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return dateStr;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: t("common.cash"),
      card: t("common.creditCard"),
      creditCard: t("common.creditCard"),
      credit_card: t("common.creditCard"),
      debitCard: t("common.debitCard"),
      debit_card: t("common.debitCard"),
      transfer: t("common.transfer"),
      einvoice: t("reports.einvoice"),
      momo: t("common.momo"),
      zalopay: t("common.zalopay"),
      vnpay: t("common.vnpay"),
      qrCode: t("common.qrCode"),
      shopeepay: t("common.shopeepay"),
      grabpay: t("common.grabpay"),
      mobile: "Mobile",
      1: t("common.cash"),
      2: t("common.creditCard"),
      3: t("common.transfer"),
      4: t("common.momo"),
      5: t("common.zalopay"),
      6: t("common.vnpay"),
      7: t("common.qrCode"),
    };
    return (
      labels[method as keyof typeof labels] ||
      `${t("common.paymentMethod")} ${method}`
    );
  };

  const handleRefresh = () => {
    refetchOrders();
    refetchOrderItems();
  };

  const salesData = getSalesData();
  const hasError = !!ordersError;
  const isLoading = ordersLoading || orderItemsLoading;

  const peakHour =
    salesData && Object.keys(salesData.hourlySales).length > 0
      ? Object.entries(salesData.hourlySales).reduce(
          (peak, [hour, revenue]) =>
            revenue > (salesData.hourlySales[parseInt(peak)] || 0)
              ? hour
              : peak,
          "12",
        )
      : "12";

  // Loading state component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-20 bg-gray-200 rounded animate-pulse"
        ></div>
      ))}
    </div>
  );

  // Error state component
  const ErrorState = () => (
    <Card className="border-red-200">
      <CardContent className="p-6">
        <div className="text-center text-red-600">
          <p className="mb-4">{t("common.errorLoadingData")}</p>
          <p className="text-sm text-gray-600 mb-4">
            {ordersError?.message || "Không thể tải dữ liệu đơn hàng"}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("reports.refresh")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-green-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t("reports.salesAnalysis")}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {t("reports.analyzeRevenue")}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={dateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t("reports.toDay")}</SelectItem>
                    <SelectItem value="thisWeek">
                      {t("reports.thisWeek")}
                    </SelectItem>
                    <SelectItem value="week">
                      {t("reports.lastWeek")}
                    </SelectItem>
                    <SelectItem value="thisMonth">
                      {t("reports.thisMonth")}
                    </SelectItem>
                    <SelectItem value="month">
                      {t("reports.lastMonth")}
                    </SelectItem>
                    <SelectItem value="custom">
                      {t("reports.custom")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="startDate"
                      className="text-sm whitespace-nowrap"
                    >
                      {t("reports.startDate")}:
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="endDate"
                      className="text-sm whitespace-nowrap"
                    >
                      {t("reports.endDate")}:
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {t("reports.refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : hasError ? (
        <ErrorState />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <Card className="border-green-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.totalRevenue")}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesData?.totalRevenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.salesReportTotalRevenue")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(salesData?.subtotalRevenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("reports.totalQuantitySold")}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {salesData?.totalOrders || 0}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("reports.averageOrderValue")}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(salesData?.averageOrderValue || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("reports.totalCustomers")}
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {salesData?.totalCustomers || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("reports.peakHour")}: {peakHour}
                    {t("reports.hour")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("reports.dailySales")}
                </CardTitle>
                <CardDescription>{t("reports.analyzeRevenue")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.date")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalRevenue")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalOrders")}
                        </TableHead>
                        <TableHead className="sticky top-0 bg-white">
                          {t("reports.totalCustomers")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData?.dailySales &&
                      salesData.dailySales.length > 0 ? (
                        salesData.dailySales.map((day) => (
                          <TableRow key={day.date} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {formatDate(day.date)}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(day.revenue)}
                            </TableCell>
                            <TableCell>{day.orders}</TableCell>
                            <TableCell>{day.customers}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-gray-500 py-8"
                          >
                            {t("reports.noSalesData")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t("reports.paymentMethods")}
                </CardTitle>
                <CardDescription>
                  {t("reports.analyzeRevenue")}
                  {salesData?.paymentMethods &&
                    salesData.paymentMethods.length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({salesData.paymentMethods.length}{" "}
                        {t("reports.paymentMethods").toLowerCase()} •{" "}
                        {salesData.totalOrders}{" "}
                        {t("reports.orders").toLowerCase()})
                      </span>
                    )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {salesData?.paymentMethods &&
                  salesData.paymentMethods.length > 0 ? (
                    salesData.paymentMethods.map((payment) => {
                      const percentage =
                        (salesData?.totalRevenue || 0) > 0
                          ? (Number(payment.revenue) /
                              Number(salesData?.totalRevenue || 1)) *
                            100
                          : 0;

                      return (
                        <div
                          key={payment.method}
                          className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge
                                  variant="outline"
                                  className="font-semibold text-blue-700 border-blue-300 bg-blue-50"
                                >
                                  {getPaymentMethodLabel(payment.method)}
                                </Badge>
                                <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded">
                                  {t("reports.code")}: {payment.method}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                  <div className="text-gray-600">
                                    {t("reports.orderCount")}:
                                  </div>
                                  <div className="font-semibold text-blue-600 text-lg">
                                    {payment.count} {t("reports.orders")}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-gray-600">
                                    {t("reports.total")}:
                                  </div>
                                  <div className="font-bold text-green-600 text-lg">
                                    {formatCurrency(payment.revenue)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {t("reports.percentage")}:
                                </span>
                                <span className="text-sm font-semibold text-purple-600">
                                  {isFinite(percentage)
                                    ? percentage.toFixed(1)
                                    : "0.0"}
                                  %
                                </span>
                                <span className="text-xs text-gray-500">
                                  {t("reports.totalRevenue")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>{t("reports.percentage")}</span>
                              <span>
                                {isFinite(percentage)
                                  ? percentage.toFixed(1)
                                  : "0.0"}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${Math.min(percentage, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 mb-2">
                          {t("reports.noPaymentData")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("reports.noPaymentDataDescription")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
