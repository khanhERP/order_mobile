
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Package, Users, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import logoPath from "./EDPOS.png";

export function OrderReport() {
  const { t } = useTranslation();

  // Filters
  const [concernType, setConcernType] = useState("transaction");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [orderStatus, setOrderStatus] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // Query orders by date range
  const { data: orders = [] } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/orders/date-range", startDate, endDate],
    queryFn: async () => {
      try {
        const response = await fetch(`https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/orders/date-range/${startDate}/${endDate}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    },
  });

  // Query transactions by date range
  const { data: transactions = [] } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/transactions", startDate, endDate],
    queryFn: async () => {
      try {
        const response = await fetch(`https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/transactions/${startDate}/${endDate}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/products"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/categories"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/employees"],
  });

  const getFilteredData = () => {
    if (!orders || !Array.isArray(orders)) return [];

    const filteredOrders = orders.filter((order: any) => {
      const statusMatch =
        orderStatus === "all" ||
        (orderStatus === "draft" && order.status === "pending") ||
        (orderStatus === "confirmed" && order.status === "confirmed") ||
        (orderStatus === "delivering" && order.status === "preparing") ||
        (orderStatus === "completed" && order.status === "paid");

      const customerMatch =
        !customerSearch ||
        (order.customerName &&
          order.customerName
            .toLowerCase()
            .includes(customerSearch.toLowerCase())) ||
        (order.customerPhone &&
          order.customerPhone.includes(customerSearch));

      return statusMatch && customerMatch;
    });

    return filteredOrders;
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Nháp", variant: "secondary" as const },
      confirmed: { label: "Đã xác nhận", variant: "default" as const },
      preparing: { label: "Đang giao", variant: "outline" as const },
      served: { label: "Đã phục vụ", variant: "default" as const },
      paid: { label: "Hoàn thành", variant: "default" as const },
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  const getProductData = () => {
    const filteredOrders = getFilteredData();
    const productStats: {
      [productId: string]: {
        product: any;
        quantity: number;
        value: number;
      };
    } = {};

    if (!products || !Array.isArray(products)) return [];

    // Initialize with 0 values for all products
    products.forEach((product: any) => {
      productStats[product.id.toString()] = {
        product,
        quantity: 0,
        value: 0,
      };
    });

    return Object.values(productStats);
  };

  const getChartData = () => {
    const filteredOrders = getFilteredData();

    if (concernType === "transaction") {
      // Daily order count chart
      const dailyData: { [date: string]: { orders: number; value: number } } = {};

      filteredOrders.forEach((order: any) => {
        const date = new Date(order.orderedAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { orders: 0, value: 0 };
        }
        dailyData[date].orders += 1;
        dailyData[date].value += Number(order.total || 0);
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        name: formatDate(date),
        orders: data.orders,
        value: data.value,
      }));
    } else {
      // Product quantity chart - return empty data for now since we don't have order items
      return [];
    }
  };

  const renderTransactionTable = () => {
    const filteredOrders = getFilteredData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Báo cáo đơn hàng theo giao dịch
          </CardTitle>
          <CardDescription>
            Từ ngày: {formatDate(startDate)} - Đến ngày: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Mã đơn hàng</TableHead>
                <TableHead className="text-center">Thời gian đặt</TableHead>
                <TableHead className="text-center">Khách hàng</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead className="text-center">Giá trị đơn hàng</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.slice(0, 20).map((order: any) => {
                  const statusConfig = getStatusBadge(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="text-center font-medium">
                        {order.orderNumber || `ORD-${order.id}`}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(order.orderedAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.customerName || "Khách lẻ"}
                      </TableCell>
                      <TableCell className="text-center">
                        {order.customerCount || 1}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(Number(order.total || 0))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 italic">
                    {t("tables.noReportData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderProductTable = () => {
    const productData = getProductData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Báo cáo đơn hàng theo sản phẩm
          </CardTitle>
          <CardDescription>
            Từ ngày: {formatDate(startDate)} - Đến ngày: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Mã sản phẩm</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead className="text-center">Tổng tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.length > 0 ? (
                productData.slice(0, 20).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center font-medium">
                      {item.product.sku || item.product.id}
                    </TableCell>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.value)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 italic">
                    {t("tables.noReportData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const chartConfig = {
    orders: {
      label: "Đơn hàng",
      color: "#10b981",
    },
    value: {
      label: "Tổng tiền",
      color: "#3b82f6",
    },
    quantity: {
      label: "Số lượng",
      color: "#f59e0b",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Báo cáo đơn hàng
          </CardTitle>
          <CardDescription>
            Phân tích chi tiết các đơn hàng
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Concern Type */}
            <div>
              <Label>Loại báo cáo</Label>
              <Select value={concernType} onValueChange={setConcernType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transaction">Theo giao dịch</SelectItem>
                  <SelectItem value="product">Theo sản phẩm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Status */}
            <div>
              <Label>Trạng thái</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="delivering">Đang giao</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Group */}
            <div>
              <Label>Nhóm sản phẩm</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Nhóm sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories &&
                    Array.isArray(categories) &&
                    categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            <div>
              <Label>Nhân viên</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {employees &&
                    Array.isArray(employees) &&
                    employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tìm kiếm khách hàng</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Tìm kiếm sản phẩm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên sản phẩm..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white/90 text-sm font-normal">
                {t("tables.chartView")}
              </div>
              <div className="text-white font-semibold">
                {concernType === "transaction" ? "Theo giao dịch" : "Theo sản phẩm"}
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-blue-100 mt-2">
            {t("tables.visualRepresentation")} - Từ {formatDate(startDate)} đến {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
          <div className="h-[450px] w-full bg-white/90 rounded-xl border-0 shadow-lg p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 rounded-xl"></div>
            <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Data
            </div>

            <div className="relative z-10 h-full">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getChartData()}
                    margin={{ top: 30, right: 40, left: 30, bottom: 90 }}
                    barCategoryGap="25%"
                  >
                    <defs>
                      <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke="#e2e8f0"
                      opacity={0.4}
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                      angle={-35}
                      textAnchor="end"
                      height={85}
                      interval={0}
                      tickMargin={12}
                      axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                      tickLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) {
                          return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                          return `${(value / 1000).toFixed(0)}K`;
                        }
                        return value.toString();
                      }}
                      width={70}
                      axisLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                      tickLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelStyle={{
                        color: "#1e293b",
                        fontWeight: 600,
                        fontSize: 13,
                        marginBottom: 4
                      }}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.98)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.15), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
                        padding: "12px 16px",
                        backdropFilter: "blur(8px)"
                      }}
                      cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                    />
                    {concernType === "transaction" ? (
                      <>
                        <Bar
                          dataKey="orders"
                          fill="url(#orderGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                          stroke="#059669"
                          strokeWidth={1}
                        />
                        <Bar
                          dataKey="value"
                          fill="url(#valueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                          stroke="#2563eb"
                          strokeWidth={1}
                        />
                      </>
                    ) : (
                      <Bar
                        dataKey="quantity"
                        fill="url(#quantityGradient)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={50}
                        stroke="#d97706"
                        strokeWidth={1}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Enhanced Chart Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            {concernType === "transaction" ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-4 h-4 rounded bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-sm"></div>
                  <span className="text-sm font-medium text-green-800">
                    Đơn hàng
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-4 h-4 rounded bg-gradient-to-b from-blue-400 to-blue-600 shadow-sm"></div>
                  <span className="text-sm font-medium text-blue-800">
                    Tổng tiền
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-4 h-4 rounded bg-gradient-to-b from-amber-400 to-amber-600 shadow-sm"></div>
                <span className="text-sm font-medium text-amber-800">
                  Số lượng
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <div className="space-y-6">
        {concernType === "transaction" ? renderTransactionTable() : renderProductTable()}
      </div>
    </div>
  );
}
