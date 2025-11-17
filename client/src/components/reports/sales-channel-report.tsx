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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Search, Calendar, Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function SalesChannelReport() {
  const { t } = useTranslation();

  // Filters
  const [concernType, setConcernType] = useState("sales");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedSalesChannel, setSelectedSalesChannel] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productType, setProductType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: employees } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
    staleTime: 5 * 60 * 1000,
  });

  // Sales channel sales data query
  const { data: salesChannelSalesData, isLoading: salesLoading } = useQuery({
    queryKey: [
      "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-sales",
      startDate,
      endDate,
      selectedSeller,
      selectedSalesChannel,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedSeller !== "all" && { sellerId: selectedSeller }),
        ...(selectedSalesChannel !== "all" && {
          salesChannel: selectedSalesChannel,
        }),
      });
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-sales?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sales channel sales data");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Sales channel profit data query
  const { data: salesChannelProfitData, isLoading: profitLoading } = useQuery({
    queryKey: [
      "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-profit",
      startDate,
      endDate,
      selectedSeller,
      selectedSalesChannel,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedSeller !== "all" && { sellerId: selectedSeller }),
        ...(selectedSalesChannel !== "all" && {
          salesChannel: selectedSalesChannel,
        }),
      });
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-profit?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sales channel profit data");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Sales channel products data query
  const { data: salesChannelProductsData, isLoading: productsLoading } =
    useQuery({
      queryKey: [
        "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-products",
        startDate,
        endDate,
        selectedSeller,
        selectedSalesChannel,
        productSearch,
        productType,
        selectedCategory,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate,
          endDate,
          ...(selectedSeller !== "all" && { sellerId: selectedSeller }),
          ...(selectedSalesChannel !== "all" && {
            salesChannel: selectedSalesChannel,
          }),
          ...(productSearch && { search: productSearch }),
          ...(productType !== "all" && { productType }),
          ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
        });
        const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/sales-channel-products?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch sales channel products data");
        }
        return response.json();
      },
      staleTime: 2 * 60 * 1000,
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

  const getReportTitle = () => {
    const concernTypes = {
      sales: t("reports.salesBySalesChannel"),
      profit: t("reports.profitBySalesChannel"),
      products: t("reports.productsBySalesChannel"),
    };
    return (
      concernTypes[concernType as keyof typeof concernTypes] ||
      t("reports.channelSalesReport")
    );
  };

  const getChartData = () => {
    if (concernType === "sales") {
      if (
        !salesChannelSalesData ||
        !Array.isArray(salesChannelSalesData) ||
        salesChannelSalesData.length === 0
      ) {
        return [];
      }
      return salesChannelSalesData.map((item: any) => ({
        name: item.salesChannelName || "N/A",
        revenue: item.revenue || 0,
        returnValue: item.returnValue || 0,
        netRevenue: item.netRevenue || 0,
      }));
    } else if (concernType === "profit") {
      if (
        !salesChannelProfitData ||
        !Array.isArray(salesChannelProfitData) ||
        salesChannelProfitData.length === 0
      ) {
        return [];
      }
      return salesChannelProfitData.map((item: any) => ({
        name: item.salesChannelName || "N/A",
        grossProfit: item.grossProfit || 0,
        netProfit: item.netProfit || 0,
        platformFee: item.platformFee || 0,
      }));
    }
    return [];
  };

  const renderSalesTable = () => {
    if (salesLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">{t("reports.loading")}</div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">
                {t("reports.salesChannelFilter")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelRevenue")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelReturnValue")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelNetRevenue")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesChannelSalesData &&
            Array.isArray(salesChannelSalesData) &&
            salesChannelSalesData.length > 0 ? (
              salesChannelSalesData.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {item.salesChannelName || "N/A"}
                      </div>
                      {item.sellerName && (
                        <div className="text-sm text-gray-500">
                          {item.sellerName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.revenue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.returnValue || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.netRevenue || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  {t("reports.noReportData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderProfitTable = () => {
    if (profitLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">{t("reports.loading")}</div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">
                {t("reports.salesChannelFilter")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelTotalAmount")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelDiscount")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelRevenue")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelReturnValue")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelNetRevenue")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelTotalCost")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelGrossProfit")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelFee")}
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t("reports.salesChannelNetProfit")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesChannelProfitData &&
            Array.isArray(salesChannelProfitData) &&
            salesChannelProfitData.length > 0 ? (
              salesChannelProfitData.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {item.salesChannelName || "N/A"}
                      </div>
                      {item.sellerName && (
                        <div className="text-sm text-gray-500">
                          {item.sellerName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalAmount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.discount || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.revenue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.returnValue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.netRevenue || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalCost || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.grossProfit || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.platformFee || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">
                    {formatCurrency(item.netProfit || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-gray-500"
                >
                  {t("reports.noReportData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderProductsTable = () => {
    if (productsLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">{t("reports.loading")}</div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">
                {t("reports.salesChannelFilter")}
              </TableHead>
              <TableHead className="min-w-[100px]">
                {t("reports.productCode")}
              </TableHead>
              <TableHead className="min-w-[150px]">
                {t("reports.productName")}
              </TableHead>
              <TableHead className="text-center min-w-[80px]">
                {t("reports.salesChannelQuantitySold")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelRevenue")}
              </TableHead>
              <TableHead className="text-center min-w-[80px]">
                {t("reports.salesChannelQuantityReturned")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelReturnValue")}
              </TableHead>
              <TableHead className="text-right min-w-[120px]">
                {t("reports.salesChannelNetRevenue")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesChannelProductsData &&
            Array.isArray(salesChannelProductsData) &&
            salesChannelProductsData.length > 0 ? (
              salesChannelProductsData.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">
                        {item.salesChannelName || "N/A"}
                      </div>
                      {item.sellerName && (
                        <div className="text-sm text-gray-500">
                          {item.sellerName}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.productCode || "N/A"}</Badge>
                  </TableCell>
                  <TableCell>{item.productName || "N/A"}</TableCell>
                  <TableCell className="text-center">
                    {item.quantitySold || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.revenue || 0)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantityReturned || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.returnValue || 0)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.netRevenue || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  {t("reports.noReportData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("reports.channelSalesReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.salesChannelReportDescription")}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {/* Concern Type */}
            <div>
              <Label>{t("reports.salesChannelConcernType")}</Label>
              <Select value={concernType} onValueChange={setConcernType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">
                    {t("reports.salesChannelSales")}
                  </SelectItem>
                  <SelectItem value="profit">
                    {t("reports.salesChannelProfit")}
                  </SelectItem>
                  <SelectItem value="products">
                    {t("reports.salesChannelProducts")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div>
              <Label>{t("reports.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <Label>{t("reports.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Seller Filter */}
            <div>
              <Label>{t("reports.sellerFilter")}</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {employees?.map((employee: any) => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id.toString()}
                    >
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Channel Filter */}
            <div>
              <Label>{t("reports.salesChannelFilter")}</Label>
              <Select
                value={selectedSalesChannel}
                onValueChange={setSelectedSalesChannel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="direct">
                    {t("reports.directSales")}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("reports.otherSales")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional filters for products concern type */}
            {concernType === "products" && (
              <>
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
                      <SelectItem value="combo">
                        {t("reports.combo")}
                      </SelectItem>
                      <SelectItem value="product">
                        {t("reports.product")}
                      </SelectItem>
                      <SelectItem value="service">
                        {t("reports.service")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Label>{t("common.category")}</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      {categories?.map((category: any) => (
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
              </>
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
                    ? t("reports.salesChannelSales")
                    : t("reports.salesChannelProfit")}
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              {t("reports.visualRepresentation")} - {t("reports.fromDate")}:{" "}
              {formatDate(startDate)} {t("reports.toDate")}:{" "}
              {formatDate(endDate)}
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
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
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
                          name={t("reports.salesChannelRevenue")}
                        />
                        <Bar
                          dataKey="netRevenue"
                          fill="url(#profitGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                          stroke="#2563eb"
                          strokeWidth={1}
                          name={t("reports.salesChannelNetRevenue")}
                        />
                      </>
                    )}
                    {concernType === "profit" && (
                      <>
                        <Bar
                          dataKey="grossProfit"
                          fill="url(#profitGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                          stroke="#2563eb"
                          strokeWidth={1}
                          name={t("reports.salesChannelGrossProfit")}
                        />
                        <Bar
                          dataKey="netProfit"
                          fill="url(#revenueGradient)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={45}
                          stroke="#059669"
                          strokeWidth={1}
                          name={t("reports.salesChannelNetProfit")}
                        />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {getReportTitle()}
          </CardTitle>
          <CardDescription>
            {t("reports.dataFrom")} {formatDate(startDate)} {t("reports.to")}{" "}
            {formatDate(endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {concernType === "sales" && renderSalesTable()}
          {concernType === "profit" && renderProfitTable()}
          {concernType === "products" && renderProductsTable()}
        </CardContent>
      </Card>
    </div>
  );
}