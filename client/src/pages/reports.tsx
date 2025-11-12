import { useState, useEffect } from "react";
import { ReportsHeader } from "@/components/reports/reports-header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { SalesReport } from "@/components/reports/sales-report";
import { SalesChartReport } from "@/components/reports/sales-chart-report";
import { MenuReport } from "@/components/reports/menu-report";
import { TableReport } from "@/components/reports/table-report";
import { DashboardOverview } from "@/components/reports/dashboard-overview";
import { OrderReport } from "@/components/reports/order-report";
import { InventoryReport } from "@/components/reports/inventory-report";
import { CustomerReport } from "@/components/reports/customer-report";
import { ReportsMenu } from "@/components/reports/reports-menu";
import { DailySalesReport } from "@/components/reports/daily-sales-report";
import { OtherMenu } from "@/components/reports/other-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Utensils,
  Package,
  Users,
  Calendar,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { EmployeeReport } from "@/components/reports/employee-report";
import { SalesChannelReport } from "@/components/reports/sales-channel-report";
import { FinancialReport } from "@/components/reports/financial-report";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";

interface ReportsPageProps {
  onLogout: () => void;
}

export default function ReportsPage({ onLogout }: ReportsPageProps) {
  const { t } = useTranslation();
  const search = useSearch();
  const [activeTab, setActiveTab] = useState("overview");
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showMenuReports, setShowMenuReports] = useState(false);
  const [showOtherMenu, setShowOtherMenu] = useState(false);

  const [showDailySalesReport, setShowDailySalesReport] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    if (tab === "menu") {
      setShowMenuReports(true);
      setShowReportsMenu(false);
      setShowDailySalesReport(false);
      setShowOtherMenu(false);
    } else if (tab === "other") {
      setShowOtherMenu(true);
      setShowReportsMenu(false);
      setShowDailySalesReport(false);
      setShowMenuReports(false);
    } else if (
      tab &&
      ["overview", "sales", "table", "saleschart"].includes(tab)
    ) {
      setActiveTab(tab);
      setShowReportsMenu(false); // Hide reports menu when navigating to specific tab
      setShowDailySalesReport(false); // Hide daily sales report when navigating to specific tab
      setShowMenuReports(false); // Hide menu reports when navigating to other tabs
      setShowOtherMenu(false); // Hide other menu when navigating to other tabs
    }
  }, [search]);

  // Listen for popstate events to handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");

      if (tab === "menu") {
        setShowMenuReports(true);
        setShowReportsMenu(false);
        setShowDailySalesReport(false);
        setShowOtherMenu(false);
      } else if (tab === "other") {
        setShowOtherMenu(true);
        setShowReportsMenu(false);
        setShowDailySalesReport(false);
        setShowMenuReports(false);
      } else if (
        tab &&
        ["overview", "sales", "table", "saleschart"].includes(tab)
      ) {
        setActiveTab(tab);
        setShowReportsMenu(false);
        setShowDailySalesReport(false);
        setShowMenuReports(false);
        setShowOtherMenu(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  // Show daily sales report if requested
  if (showDailySalesReport) {
    return <DailySalesReport onBack={() => setShowDailySalesReport(false)} />;
  }

  // Show reports menu if requested
  if (showReportsMenu) {
    return (
      <ReportsMenu
        onBack={() => setShowReportsMenu(false)}
        onReportsClick={() => setShowReportsMenu(true)}
        onDailySalesClick={() => setShowDailySalesReport(true)}
      />
    );
  }

  if (showMenuReports) {
    return (
      <MenuReport
        onBack={() => {
          setShowMenuReports(false);
          setShowReportsMenu(true);
        }}
      />
    );
  }

  if (showOtherMenu) {
    return (
      <OtherMenu
        onBack={() => {
          setShowOtherMenu(false);
          setActiveTab("overview");
        }}
        onLogout={() => {
          // Clear any local state first
          setShowOtherMenu(false);
          setShowReportsMenu(false);
          setShowMenuReports(false);
          setShowDailySalesReport(false);
          // Then call the main logout function
          onLogout();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <ReportsHeader
        onLogout={onLogout}
        title={
          activeTab === "sales"
            ? "BÁO CÁO BÁN HÀNG"
            : activeTab === "table"
              ? "BÁO CÁO BÀN"
              : activeTab === "saleschart"
                ? "BIỂU ĐỒ BÁN HÀNG"
                : "DASHBOARD"
        }
      />

      {/* Right Sidebar - Completely hidden */}
      {/* <div className="hidden md:block">
        <RightSidebar />
      </div> */}

      <div className="main-content pt-16 px-4 pb-20 md:pb-6">
        <div className="w-full max-w-none">
          {/* Mobile Report Menu */}
          <div className="md:hidden space-y-4 mb-6"></div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsContent value="overview" className="space-y-4">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <SalesReport />
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <TableReport />
            </TabsContent>

            <TabsContent value="saleschart" className="space-y-4">
              <SalesChartReport />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onReportsClick={() => setShowReportsMenu(true)} />
    </div>
  );
}
