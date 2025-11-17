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
import { Users, TrendingUp, Search } from "lucide-react";
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

export function EmployeeReport() {
  const { t } = useTranslation();

  // Filters
  const [concernType, setConcernType] = useState("sales");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productType, setProductType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [salesChannel, setSalesChannel] = useState("all");

  const { data: employees } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: transactions } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transactions", startDate, endDate],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const { data: products } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: categories } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Employee sales data query
  const { data: employeeSalesData } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employee-sales", startDate, endDate, selectedEmployee],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ₫`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getFilteredTransactions = () => {
    if (!transactions || !Array.isArray(transactions)) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter((transaction: any) => {
      const transactionDate = new Date(
        transaction.createdAt || transaction.created_at,
      );
      const dateMatch = transactionDate >= start && transactionDate <= end;

      const employeeMatch =
        selectedEmployee === "all" ||
        transaction.cashierName === selectedEmployee ||
        transaction.employeeId?.toString() === selectedEmployee ||
        transaction.cashierName?.includes(selectedEmployee);

      return dateMatch && employeeMatch;
    });
  };

  // Sales Report Data
  const getSalesReportData = () => {
    const filteredTransactions = getFilteredTransactions();
    const employeeSales: {
      [employeeName: string]: {
        revenue: number;
        returnValue: number;
        netRevenue: number;
      };
    } = {};

    filteredTransactions.forEach((transaction: any) => {
      const employeeName = transaction.cashierName || "Unknown";

      if (!employeeSales[employeeName]) {
        employeeSales[employeeName] = {
          revenue: 0,
          returnValue: 0,
          netRevenue: 0,
        };
      }

      const amount = Number(transaction.total);
      employeeSales[employeeName].revenue += amount;
      employeeSales[employeeName].netRevenue += amount;
    });

    return Object.entries(employeeSales).map(([employee, data]) => ({
      employee,
      ...data,
    }));
  };

  // Profit Report Data
  const getProfitReportData = () => {
    const filteredTransactions = getFilteredTransactions();
    const employeeProfit: {
      [employeeName: string]: {
        totalAmount: number;
        discount: number;
        revenue: number;
        returnValue: number;
        netRevenue: number;
        totalCost: number;
        grossProfit: number;
      };
    } = {};

    filteredTransactions.forEach((transaction: any) => {
      const employeeName = transaction.cashierName || "Unknown";

      if (!employeeProfit[employeeName]) {
        employeeProfit[employeeName] = {
          totalAmount: 0,
          discount: 0,
          revenue: 0,
          returnValue: 0,
          netRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
        };
      }

      const amount = Number(transaction.total);
      const estimatedCost = amount * 0.6; // Estimated 60% cost ratio

      employeeProfit[employeeName].totalAmount += amount;
      employeeProfit[employeeName].revenue += amount;
      employeeProfit[employeeName].netRevenue += amount;
      employeeProfit[employeeName].totalCost += estimatedCost;
      employeeProfit[employeeName].grossProfit += amount - estimatedCost;
    });

    return Object.entries(employeeProfit).map(([employee, data]) => ({
      employee,
      ...data,
    }));
  };

  // Product Sales by Employee Data
  const getProductSalesData = () => {
    const filteredTransactions = getFilteredTransactions();
    const employeeProductSales: {
      [employeeName: string]: {
        quantitySold: number;
        revenue: number;
        returnQuantity: number;
        returnValue: number;
        netRevenue: number;
      };
    } = {};

    filteredTransactions.forEach((transaction: any) => {
      const employeeName = transaction.cashierName || "Unknown";

      if (!employeeProductSales[employeeName]) {
        employeeProductSales[employeeName] = {
          quantitySold: 0,
          revenue: 0,
          returnQuantity: 0,
          returnValue: 0,
          netRevenue: 0,
        };
      }

      const amount = Number(transaction.total);
      employeeProductSales[employeeName].quantitySold += 1; // Estimate 1 item per transaction
      employeeProductSales[employeeName].revenue += amount;
      employeeProductSales[employeeName].netRevenue += amount;
    });

    return Object.entries(employeeProductSales).map(([employee, data]) => ({
      employee,
      ...data,
    }));
  };

  const getChartData = () => {
    if (concernType === "sales") {
      return getSalesReportData().map((item) => ({
        name: item.employee,
        revenue: item.revenue,
        netRevenue: item.netRevenue,
      }));
    } else if (concernType === "profit") {
      return getProfitReportData().map((item) => ({
        name: item.employee,
        revenue: item.revenue,
        grossProfit: item.grossProfit,
      }));
    } else {
      return getProductSalesData().map((item) => ({
        name: item.employee,
        quantitySold: item.quantitySold,
        revenue: item.revenue,
      }));
    }
  };

  const getReportTitle = () => {
    switch (concernType) {
      case "sales":
        return t("reports.employeeSalesReport");
      case "profit":
        return t("reports.employeeProfitReport");
      case "productSales":
        return t("reports.employeeProductSalesReport");
      default:
        return t("reports.employeeSalesReport");
    }
  };

  const renderSalesReport = () => {
    const data = getSalesReportData();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.employeeSalesReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.fromDate")}: {formatDate(startDate)} -{" "}
            {t("reports.toDate")}: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.seller")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.returnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.netRevenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.employee}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.returnValue)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(item.netRevenue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 italic"
                  >
                    {t("reports.noReportData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderProfitReport = () => {
    const data = getProfitReportData();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.employeeReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.fromDate")}: {formatDate(startDate)} -{" "}
            {t("reports.toDate")}: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.employee")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.totalAmount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.discount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.returnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.netRevenue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.totalCost")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.grossProfit")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.employee}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(item.discount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.returnValue)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(item.netRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                    <TableCell className="text-right text-purple-600">
                      {formatCurrency(item.grossProfit)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-gray-500 italic"
                  >
                    {t("reports.noReportData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderProductSalesReport = () => {
    const data = getProductSalesData();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.employeeProductSalesReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.fromDate")}: {formatDate(startDate)} -{" "}
            {t("reports.toDate")}: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.seller")}</TableHead>
                <TableHead className="text-center">
                  {t("reports.quantitySold")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="text-center">
                  {t("reports.returnQuantity")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.returnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.netRevenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.employee}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantitySold}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.returnQuantity}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.returnValue)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(item.netRevenue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 italic"
                  >
                    {t("reports.noReportData")}
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
    revenue: {
      label: t("reports.revenue"),
      color: "#10b981",
    },
    netRevenue: {
      label: t("reports.netRevenue"),
      color: "#3b82f6",
    },
    grossProfit: {
      label: t("reports.grossProfit"),
      color: "#8b5cf6",
    },
    quantitySold: {
      label: t("reports.quantitySold"),
      color: "#f59e0b",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.employeeReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.employeeAnalysis")}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Concern Type */}
            <div>
              <Label>{t("reports.concernType")}</Label>
              <Select value={concernType} onValueChange={setConcernType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t("reports.sales")}</SelectItem>
                  <SelectItem value="profit">{t("reports.profit")}</SelectItem>
                  <SelectItem value="productSales">
                    {t("reports.employeeProductSales")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Filter (for sales) */}
            {concernType === "sales" && (
              <div>
                <Label>{t("reports.seller")}</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.seller")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {employees &&
                      Array.isArray(employees) &&
                      employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.name}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sales Channel */}
            <div>
              <Label>{t("reports.salesChannel")}</Label>
              <Select value={salesChannel} onValueChange={setSalesChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="direct">{t("reports.direct")}</SelectItem>
                  <SelectItem value="other">{t("reports.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional filters for profit and product sales */}
          {(concernType === "profit" || concernType === "productSales") && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Product Search */}
              <div>
                <Label>{t("reports.productFilter")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t("reports.productFilterPlaceholder")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Product Type */}
              <div>
                <Label>{t("reports.productType")}</Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="combo">{t("reports.combo")}</SelectItem>
                    <SelectItem value="product">
                      {t("reports.product")}
                    </SelectItem>
                    <SelectItem value="service">
                      {t("reports.service")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label>{t("reports.productGroup")}</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.productGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {categories &&
                      Array.isArray(categories) &&
                      categories.map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee */}
              <div>
                <Label>{t("reports.seller")}</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.seller")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {employees &&
                      Array.isArray(employees) &&
                      employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.name}>
                          {employee.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>{t("reports.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("reports.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white/90 text-sm font-normal">
                {t("reports.chartView")}
              </div>
              <div className="text-white font-semibold">{getReportTitle()}</div>
            </div>
          </CardTitle>
          <CardDescription className="text-blue-100 mt-2">
            {t("reports.visualRepresentation")} - {t("reports.fromDate")}:{" "}
            {formatDate(startDate)} {t("reports.toDate")}: {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
          <div className="h-[450px] w-full bg-white/90 rounded-xl border-0 shadow-lg p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 rounded-xl"></div>

            <div className="relative z-10 h-full">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getChartData()}
                    margin={{ top: 30, right: 40, left: 30, bottom: 90 }}
                    barCategoryGap="25%"
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="netRevenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="profitGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="quantityGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f59e0b"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f59e0b"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke="#e2e8f0"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                      angle={-35}
                      textAnchor="end"
                      height={85}
                      interval={0}
                      tickMargin={12}
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
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />

                    {concernType === "sales" && (
                      <>
                        <Bar
                          dataKey="revenue"
                          fill="url(#revenueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                        <Bar
                          dataKey="netRevenue"
                          fill="url(#netRevenueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                      </>
                    )}

                    {concernType === "profit" && (
                      <>
                        <Bar
                          dataKey="revenue"
                          fill="url(#revenueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                        <Bar
                          dataKey="grossProfit"
                          fill="url(#profitGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                      </>
                    )}

                    {concernType === "productSales" && (
                      <>
                        <Bar
                          dataKey="quantitySold"
                          fill="url(#quantityGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="url(#revenueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <div className="space-y-6">
        {concernType === "sales" && renderSalesReport()}
        {concernType === "profit" && renderProfitReport()}
        {concernType === "productSales" && renderProductSalesReport()}
      </div>
    </div>
  );
}