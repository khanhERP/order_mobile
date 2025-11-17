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

export function CustomerReport() {
  const { t } = useTranslation();

  // Filters
  const [concernType, setConcernType] = useState("sales");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductType, setSelectedProductType] = useState("all");
  const [debtFrom, setDebtFrom] = useState("");
  const [debtTo, setDebtTo] = useState("");

  const { data: orders } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"],
  });

  const { data: products } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"],
  });

  const { data: categories } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
  });

  const { data: customers } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"],
  });

  const { data: customerDebts } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customer-debts"],
    enabled: concernType === "debt",
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

  const getFilteredData = () => {
    if (!orders || !Array.isArray(orders)) return [];

    const filteredOrders = orders.filter((order: any) => {
      const orderDate = new Date(order.orderedAt || order.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const dateMatch = orderDate >= start && orderDate <= end;

      const customerMatch =
        !customerSearch ||
        (order.customerName &&
          order.customerName
            .toLowerCase()
            .includes(customerSearch.toLowerCase())) ||
        (order.customerPhone && order.customerPhone.includes(customerSearch)) ||
        (order.customerId &&
          order.customerId.toString().includes(customerSearch));

      return dateMatch && customerMatch && order.status === "paid";
    });

    return filteredOrders;
  };

  const getCustomerSalesData = () => {
    const filteredOrders = getFilteredData();
    const customerStats: {
      [customerId: string]: {
        customer: any;
        revenue: number;
        returnValue: number;
        netRevenue: number;
        orderCount: number;
      };
    } = {};

    filteredOrders.forEach((order: any) => {
      const customerId = order.customerId || "guest";
      const customerName = order.customerName || "Khách lẻ";

      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          customer: {
            id: customerId,
            name: customerName,
            phone: order.customerPhone || "",
          },
          revenue: 0,
          returnValue: 0,
          netRevenue: 0,
          orderCount: 0,
        };
      }

      const orderTotal = Number(order.total);
      customerStats[customerId].revenue += orderTotal;
      customerStats[customerId].netRevenue += orderTotal; // Assuming no returns for now
      customerStats[customerId].orderCount += 1;
    });

    return Object.values(customerStats);
  };

  const getCustomerProfitData = () => {
    const filteredOrders = getFilteredData();
    const customerStats: {
      [customerId: string]: {
        customer: any;
        totalProductValue: number;
        invoiceDiscount: number;
        revenue: number;
        returnValue: number;
        netRevenue: number;
        totalCost: number;
        grossProfit: number;
      };
    } = {};

    filteredOrders.forEach((order: any) => {
      const customerId = order.customerId || "guest";
      const customerName = order.customerName || "Khách lẻ";

      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          customer: {
            id: customerId,
            name: customerName,
            phone: order.customerPhone || "",
          },
          totalProductValue: 0,
          invoiceDiscount: 0,
          revenue: 0,
          returnValue: 0,
          netRevenue: 0,
          totalCost: 0,
          grossProfit: 0,
        };
      }

      const orderTotal = Number(order.total);
      customerStats[customerId].totalProductValue += orderTotal;
      customerStats[customerId].revenue += orderTotal;
      customerStats[customerId].netRevenue += orderTotal;
      customerStats[customerId].totalCost += orderTotal * 0.6; // Assuming 60% cost
      customerStats[customerId].grossProfit += orderTotal * 0.4; // Assuming 40% profit
    });

    return Object.values(customerStats);
  };

  const getCustomerDebtData = () => {
    if (!customerDebts || !Array.isArray(customerDebts)) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return customerDebts
      .filter((debt: any) => {
        // Date filter
        const debtDate = new Date(debt.createdAt || debt.created_at);
        const dateMatch = debtDate >= start && debtDate <= end;

        // Customer search filter
        const customerMatch =
          !customerSearch ||
          (debt.customer?.id &&
            debt.customer.id
              .toLowerCase()
              .includes(customerSearch.toLowerCase())) ||
          (debt.customer?.name &&
            debt.customer.name
              .toLowerCase()
              .includes(customerSearch.toLowerCase())) ||
          (debt.customer?.phone && 
            debt.customer.phone.includes(customerSearch)) ||
          (debt.customerId &&
            debt.customerId.toString().includes(customerSearch));

        // Debt amount filter
        const debtAmountMatch = (() => {
          if (!debtFrom && !debtTo) return true;
          const from = debtFrom ? Number(debtFrom) : 0;
          const to = debtTo ? Number(debtTo) : Infinity;
          const closingDebt = Number(debt.closingDebt || 0);
          return closingDebt >= from && closingDebt <= to;
        })();

        return dateMatch && customerMatch && debtAmountMatch;
      })
      .map((debt: any) => ({
        customer: {
          id: debt.customer?.id || debt.customerId || debt.customerCode || "N/A",
          name: debt.customer?.name || debt.customerName || "Khách lẻ",
          phone: debt.customer?.phone || debt.customerPhone || "",
        },
        openingDebt: Number(debt.openingDebt || 0),
        debitAmount: Number(debt.debitAmount || 0),
        creditAmount: Number(debt.creditAmount || 0),
        closingDebt: Number(debt.closingDebt || 0),
      }));
  };

  const getCustomerProductSalesData = () => {
    const filteredOrders = getFilteredData();
    const customerProductStats: {
      [key: string]: {
        customer: any;
        purchaseQuantity: number;
        revenue: number;
        returnQuantity: number;
        returnValue: number;
        netRevenue: number;
      };
    } = {};

    filteredOrders.forEach((order: any) => {
      const customerId = order.customerId || "guest";
      const customerName = order.customerName || "Khách lẻ";
      const key = `${customerId}`;

      if (!customerProductStats[key]) {
        customerProductStats[key] = {
          customer: {
            id: customerId,
            name: customerName,
            phone: order.customerPhone || "",
          },
          purchaseQuantity: 0,
          revenue: 0,
          returnQuantity: 0,
          returnValue: 0,
          netRevenue: 0,
        };
      }

      const orderTotal = Number(order.total);
      customerProductStats[key].purchaseQuantity += order.customerCount || 1;
      customerProductStats[key].revenue += orderTotal;
      customerProductStats[key].netRevenue += orderTotal;
    });

    return Object.values(customerProductStats);
  };

  const getChartData = () => {
    switch (concernType) {
      case "sales":
        return getCustomerSalesData()
          .slice(0, 10)
          .map((item) => ({
            name: item.customer.name,
            revenue: item.revenue,
            netRevenue: item.netRevenue,
          }));
      case "profit":
        return getCustomerProfitData()
          .slice(0, 10)
          .map((item) => ({
            name: item.customer.name,
            profit: item.grossProfit,
            revenue: item.revenue,
          }));
      case "debt":
        return getCustomerDebtData()
          .slice(0, 10)
          .map((item) => ({
            name: item.customer.name,
            debt: item.closingDebt,
          }));
      case "productSales":
        return getCustomerProductSalesData()
          .slice(0, 10)
          .map((item) => ({
            name: item.customer.name,
            quantity: item.purchaseQuantity,
            revenue: item.revenue,
          }));
      default:
        return [];
    }
  };

  const renderSalesReport = () => {
    const data = getCustomerSalesData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.customerSalesReport")}
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
                <TableHead>{t("reports.customerId")}</TableHead>
                <TableHead>{t("reports.customerName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.customerRevenue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerReturnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerNetRevenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.slice(0, 20).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.customer.id}
                    </TableCell>
                    <TableCell>{item.customer.name}</TableCell>
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
                    colSpan={5}
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
    const data = getCustomerProfitData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.customerProfitReport")}
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
                <TableHead>{t("reports.customerName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.totalProductValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.invoiceDiscount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerReturnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerNetRevenue")}
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
                data.slice(0, 20).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.customer.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalProductValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.invoiceDiscount)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    <TableCell className="text-right text-green-600">
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

  const renderDebtReport = () => {
    const data = getCustomerDebtData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.customerDebtReport")}
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
                <TableHead>{t("reports.customerId")}</TableHead>
                <TableHead>{t("reports.customerName")}</TableHead>
                <TableHead className="text-right">
                  {t("reports.openingDebt")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.debitAmount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.creditAmount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.closingDebt")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.customer.id}
                    </TableCell>
                    <TableCell>{item.customer.name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.openingDebt)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.debitAmount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.creditAmount)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(item.closingDebt)}
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

  const renderProductSalesReport = () => {
    const data = getCustomerProductSalesData();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("reports.customerProductSalesReport")}
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
                <TableHead>{t("reports.customerId")}</TableHead>
                <TableHead>{t("reports.customerName")}</TableHead>
                <TableHead className="text-center">
                  {t("reports.customerPurchaseQuantity")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.revenue")}
                </TableHead>
                <TableHead className="text-center">
                  {t("reports.customerReturnQuantity")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerReturnValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("reports.customerNetRevenue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.slice(0, 20).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.customer.id}
                    </TableCell>
                    <TableCell>{item.customer.name}</TableCell>
                    <TableCell className="text-center">
                      {item.purchaseQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.returnQuantity}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(item.returnValue)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(item.netRevenue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
    profit: {
      label: t("reports.profit"),
      color: "#3b82f6",
    },
    debt: {
      label: t("reports.customerDebt"),
      color: "#f59e0b",
    },
    quantity: {
      label: t("reports.quantity"),
      color: "#8b5cf6",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('reports.customerReport')}
          </CardTitle>
          <CardDescription>
            {t('reports.customerMetrics')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Concern Type */}
            <div>
              <Label>{t("reports.customerConcernType")}</Label>
              <Select value={concernType} onValueChange={setConcernType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">
                    {t("reports.customerSales")}
                  </SelectItem>
                  <SelectItem value="profit">
                    {t("reports.customerProfit")}
                  </SelectItem>
                  <SelectItem value="debt">
                    {t("reports.customerDebt")}
                  </SelectItem>
                  <SelectItem value="productSales">
                    {t("reports.customerProductSales")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product Type - only show for productSales */}
            {concernType === "productSales" && (
              <div>
                <Label>{t("reports.productType")}</Label>
                <Select
                  value={selectedProductType}
                  onValueChange={setSelectedProductType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("reports.productType")} />
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
            )}

            {/* Product Group - only show for productSales */}
            {concernType === "productSales" && (
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
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Debt Range - only show for debt */}
          {concernType === "debt" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t("reports.debtRangeFrom")}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={debtFrom}
                  onChange={(e) => setDebtFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>{t("reports.debtRangeTo")}</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={debtTo}
                  onChange={(e) => setDebtTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("reports.customerFilter")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t("reports.customerFilterPlaceholder")}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {concernType === "productSales" && (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart Display - Only show for sales and profit */}
      {(concernType === "sales" || concernType === "profit") && (
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
                <div className="text-white font-semibold">
                  {concernType === "sales"
                    ? t("reports.customerSales")
                    : t("reports.customerProfit")}
                </div>
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
              <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                          id="profitGradient"
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
                          marginBottom: 4,
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          boxShadow:
                            "0 10px 25px -5px rgb(0 0 0 / 0.15), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
                          padding: "12px 16px",
                          backdropFilter: "blur(8px)",
                        }}
                        cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
                      />
                      {concernType === "sales" && (
                        <>
                          <Bar
                            dataKey="revenue"
                            fill="url(#revenueGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="#059669"
                            strokeWidth={1}
                          />
                          <Bar
                            dataKey="netRevenue"
                            fill="url(#profitGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="#2563eb"
                            strokeWidth={1}
                          />
                        </>
                      )}
                      {concernType === "profit" && (
                        <>
                          <Bar
                            dataKey="profit"
                            fill="url(#profitGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="#2563eb"
                            strokeWidth={1}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="url(#revenueGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="#059669"
                            strokeWidth={1}
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
      )}

      {/* Data Tables */}
      <div className="space-y-6">
        {concernType === "sales" && renderSalesReport()}
        {concernType === "profit" && renderProfitReport()}
        {concernType === "debt" && renderDebtReport()}
        {concernType === "productSales" && renderProductSalesReport()}
      </div>
    </div>
  );
}