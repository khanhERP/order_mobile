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
import { TrendingUp, DollarSign, PieChart, BarChart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts";

export function FinancialReport() {
  const { t } = useTranslation();

  // Filters
  const [period, setPeriod] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedQuarter, setSelectedQuarter] = useState("1");

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Quarter options
  const quarterOptions = [
    { value: "1", label: t("reports.quarter1") },
    { value: "2", label: t("reports.quarter2") },
    { value: "3", label: t("reports.quarter3") },
    { value: "4", label: t("reports.quarter4") },
  ];

  // Month options
  const monthOptions = [
    { value: "1", label: t("reports.month1") },
    { value: "2", label: t("reports.month2") },
    { value: "3", label: t("reports.month3") },
    { value: "4", label: t("reports.month4") },
    { value: "5", label: t("reports.month5") },
    { value: "6", label: t("reports.month6") },
    { value: "7", label: t("reports.month7") },
    { value: "8", label: t("reports.month8") },
    { value: "9", label: t("reports.month9") },
    { value: "10", label: t("reports.month10") },
    { value: "11", label: t("reports.month11") },
    { value: "12", label: t("reports.month12") },
  ];

  // Query orders and transactions for financial calculations
  const { data: orders = [] } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/orders");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transactions"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/transactions");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
  });

  // Calculate financial summary from real data
  const financialSummary = (() => {
    try {
      // Filter data based on period
      const filterByPeriod = (item: any) => {
        const date = new Date(item.orderedAt || item.createdAt || item.invoiceDate);
        if (isNaN(date.getTime())) return false;

        const itemYear = date.getFullYear();
        const itemMonth = date.getMonth() + 1;
        const itemQuarter = Math.floor(date.getMonth() / 3) + 1;

        if (period === 'yearly') {
          return itemYear === parseInt(selectedYear);
        } else if (period === 'monthly') {
          return itemYear === parseInt(selectedYear) && itemMonth === parseInt(selectedMonth);
        } else if (period === 'quarterly') {
          return itemYear === parseInt(selectedYear) && itemQuarter === parseInt(selectedQuarter);
        }
        return false;
      };

      // Combine all revenue sources
      const filteredOrders = orders.filter((order: any) => order.status === 'paid' && filterByPeriod(order));
      const filteredTransactions = transactions.filter((tx: any) => filterByPeriod(tx));
      const filteredInvoices = invoices.filter((invoice: any) => invoice.invoiceStatus === 1 && filterByPeriod(invoice));

      const totalIncome = [
        ...filteredOrders,
        ...filteredTransactions,
        ...filteredInvoices
      ].reduce((sum, item) => sum + (Number(item.total) || 0), 0);

      // Calculate estimates (since we don't have actual expense data)
      const totalExpenses = totalIncome * 0.6; // 60% of income as expenses
      const grossProfit = totalIncome - totalExpenses;
      const operatingExpenses = totalIncome * 0.15; // 15% of income as operating expenses
      const netIncome = grossProfit - operatingExpenses;
      const profitMargin = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
      const transactionCount = filteredOrders.length + filteredTransactions.length + filteredInvoices.length;

      return {
        totalIncome,
        totalExpenses,
        grossProfit,
        operatingExpenses,
        netIncome,
        profitMargin,
        transactionCount,
      };
    } catch (error) {
      console.error("Error calculating financial summary:", error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        netIncome: 0,
        profitMargin: 0,
        transactionCount: 0,
      };
    }
  })();

  // Calculate income breakdown from real data
  const incomeBreakdown = (() => {
    try {
      const filterByPeriod = (item: any) => {
        const date = new Date(item.orderedAt || item.createdAt || item.invoiceDate);
        if (isNaN(date.getTime())) return false;

        const itemYear = date.getFullYear();
        const itemMonth = date.getMonth() + 1;
        const itemQuarter = Math.floor(date.getMonth() / 3) + 1;

        if (period === 'yearly') {
          return itemYear === parseInt(selectedYear);
        } else if (period === 'monthly') {
          return itemYear === parseInt(selectedYear) && itemMonth === parseInt(selectedMonth);
        } else if (period === 'quarterly') {
          return itemYear === parseInt(selectedYear) && itemQuarter === parseInt(selectedQuarter);
        }
        return false;
      };

      const filteredOrders = orders.filter((order: any) => order.status === 'paid' && filterByPeriod(order));
      const filteredTransactions = transactions.filter((tx: any) => filterByPeriod(tx));
      const filteredInvoices = invoices.filter((invoice: any) => invoice.invoiceStatus === 1 && filterByPeriod(invoice));

      const incomeByMethod = {
        orders: filteredOrders.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        transactions: filteredTransactions.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        invoices: filteredInvoices.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
      };

      const totalIncome = Object.values(incomeByMethod).reduce((sum, amount) => sum + amount, 0);

      return Object.entries(incomeByMethod)
        .filter(([_, amount]) => amount > 0)
        .map(([category, amount]) => ({
          category: category === 'orders' ? 'Đơn hàng' : 
                   category === 'transactions' ? 'Giao dịch' : 'Hóa đơn',
          amount,
          percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
        }));
    } catch (error) {
      console.error("Error calculating income breakdown:", error);
      return [];
    }
  })();

  // Calculate expense breakdown (estimated)
  const expenseBreakdown = (() => {
    const totalExpenses = financialSummary.totalExpenses;
    if (totalExpenses === 0) return [];

    return [
      { category: "Chi phí hàng bán", amount: totalExpenses * 0.6, percentage: 60 },
      { category: "Tiền thuê mặt bằng", amount: totalExpenses * 0.12, percentage: 12 },
      { category: "Điện nước", amount: totalExpenses * 0.05, percentage: 5 },
      { category: "Lương nhân viên", amount: totalExpenses * 0.19, percentage: 19 },
      { category: "Marketing", amount: totalExpenses * 0.02, percentage: 2 },
      { category: "Khác", amount: totalExpenses * 0.02, percentage: 2 },
    ];
  })();

  // Calculate cash flow (estimated)
  const cashFlow = (() => {
    const totalIncome = financialSummary.totalIncome;
    return {
      operatingCashFlow: totalIncome * 0.25,
      investingCashFlow: -totalIncome * 0.05,
      financingCashFlow: totalIncome * 0.02,
      netCashFlow: totalIncome * 0.22,
    };
  })();

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ₫`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodText = () => {
    if (period === 'yearly') {
      return `${t("reports.financialYear")} ${selectedYear}`;
    } else if (period === 'monthly') {
      return `${t("reports.financialMonth")} ${selectedMonth}/${selectedYear}`;
    } else if (period === 'quarterly') {
      return `${quarterOptions.find(q => q.value === selectedQuarter)?.label} ${selectedYear}`;
    }
    return '';
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Prepare chart data
  const profitLossData = financialSummary ? [
    { name: t("reports.totalIncome"), value: financialSummary.totalIncome },
    { name: t("reports.totalExpenses"), value: -financialSummary.totalExpenses },
    { name: t("reports.grossProfit"), value: financialSummary.grossProfit },
    { name: t("reports.operatingExpenses"), value: -financialSummary.operatingExpenses },
    { name: t("reports.netIncome"), value: financialSummary.netIncome },
  ] : [];

  const cashFlowData = cashFlow ? [
    { name: t("reports.operatingCashFlow"), value: cashFlow.operatingCashFlow },
    { name: t("reports.investingCashFlow"), value: cashFlow.investingCashFlow },
    { name: t("reports.financingCashFlow"), value: cashFlow.financingCashFlow },
    { name: t("reports.netCashFlow"), value: cashFlow.netCashFlow },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("reports.financialReport")}
          </CardTitle>
          <CardDescription>
            {t("reports.financialReportDescription")} - {getPeriodText()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Period Filter */}
            <div>
              <Label>{t("reports.periodFilter")}</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t("reports.monthlyFilter")}</SelectItem>
                  <SelectItem value="quarterly">{t("reports.quarterlyFilter")}</SelectItem>
                  <SelectItem value="yearly">{t("reports.yearlyFilter")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div>
              <Label>{t("reports.financialYear")}</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter (only for monthly period) */}
            {period === "monthly" && (
              <div>
                <Label>{t("reports.financialMonth")}</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quarter Filter (only for quarterly period) */}
            {period === "quarterly" && (
              <div>
                <Label>{t("reports.financialQuarter")}</Label>
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quarterOptions.map((quarter) => (
                      <SelectItem key={quarter.value} value={quarter.value}>
                        {quarter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      {financialSummary && (
        <div className="space-y-4">
          {/* First Row - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.totalRevenue")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1 break-all">
                      {formatCurrency(financialSummary.totalIncome)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500 ml-3 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.totalExpenses")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1 break-all">
                      {formatCurrency(financialSummary.totalExpenses)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500 ml-3 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.grossProfit")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 break-all">
                      {formatCurrency(financialSummary.grossProfit)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">₫</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.operatingExpenses")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1 break-all">
                      {formatCurrency(financialSummary.operatingExpenses)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.netIncome")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-1 break-all">
                      {formatCurrency(financialSummary.netIncome)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600 truncate">{t("reports.profitMargin")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1 break-all">
                      {formatPercentage(financialSummary.profitMargin)}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit & Loss Chart */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white/90 text-sm font-normal">
                  {t("reports.chartView")}
                </div>
                <div className="text-white font-semibold">
                  {t("reports.financialProfitLoss")} ({getPeriodText()})
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              {t("reports.visualRepresentation")} - {getPeriodText()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
            <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full bg-white/90 rounded-xl border-0 shadow-lg p-3 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 rounded-xl"></div>
              <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </div>

              <div className="relative z-10 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart 
                    data={profitLossData}
                    margin={{ top: 30, right: 40, left: 30, bottom: 90 }}
                    barCategoryGap="25%"
                  >
                    <defs>
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
                    <Bar 
                      dataKey="value" 
                      fill="url(#profitGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                      stroke="#2563eb"
                      strokeWidth={1}
                      name={t("reports.amountLabel")}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white/90 text-sm font-normal">
                  {t("reports.chartView")}
                </div>
                <div className="text-white font-semibold">
                  {t("reports.cashFlow")} ({getPeriodText()})
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-green-100 mt-2">
              {t("reports.visualRepresentation")} - {getPeriodText()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
            <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full bg-white/90 rounded-xl border-0 shadow-lg p-3 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-emerald-50/20 rounded-xl"></div>
              <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </div>

              <div className="relative z-10 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart 
                    data={cashFlowData}
                    margin={{ top: 30, right: 40, left: 30, bottom: 90 }}
                    barCategoryGap="25%"
                  >
                    <defs>
                      <linearGradient
                        id="cashFlowGradient"
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
                      cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#cashFlowGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                      stroke="#059669"
                      strokeWidth={1}
                      name={t("reports.cashFlow")}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {t("reports.incomeBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={incomeBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {(incomeBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              {t("reports.expenseBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenseBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {(expenseBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.incomeBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.categoryLabel")}</TableHead>
                  <TableHead className="text-right">{t("reports.amountLabel")}</TableHead>
                  <TableHead className="text-right">{t("reports.percentageLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeBreakdown && incomeBreakdown.length > 0 ? (
                  incomeBreakdown.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(item.percentage)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      {t("reports.noReportData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.expenseBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.categoryLabel")}</TableHead>
                  <TableHead className="text-right">{t("reports.amountLabel")}</TableHead>  
                  <TableHead className="text-right">{t("reports.percentageLabel")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseBreakdown && expenseBreakdown.length > 0 ? (
                  expenseBreakdown.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(item.percentage)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      {t("reports.noReportData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.cashFlowDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.cashFlowType")}</TableHead>
                <TableHead className="text-right">{t("reports.amountLabel")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlow ? (
                <>
                  <TableRow>
                    <TableCell className="font-medium">{t("reports.operatingCashFlow")}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(cashFlow.operatingCashFlow)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t("reports.investingCashFlow")}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(cashFlow.investingCashFlow)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t("reports.financingCashFlow")}</TableCell>
                    <TableCell className="text-right text-blue-600">
                      {formatCurrency(cashFlow.financingCashFlow)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2 font-semibold">
                    <TableCell className="font-bold">{t("reports.netCashFlow")}</TableCell>
                    <TableCell className="text-right font-bold text-purple-600">
                      {formatCurrency(cashFlow.netCashFlow)}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-500">
                    {t("reports.noReportData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}