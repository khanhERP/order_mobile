import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ScanBarcode,
  Users,
  Home,
  Clock,
  Utensils,
  BarChart3,
  ChevronDown,
  Package,
  Settings as SettingsIcon,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import logoPath from "@assets/EDPOS_1753091767028.png";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  type StoreSettings,
  type Employee,
  type AttendanceRecord,
} from "@shared/schema";
import { PieChart } from "lucide-react";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText as ReportsIcon,
  ShoppingCart as CartIcon,
  FileText,
  ShoppingCart,
  Package2,
  UserCheck,
  Truck,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProductManagerModal } from "./product-manager-modal";
import { PrinterConfigModal } from "./printer-config-modal";
import { InvoiceManagementModal } from "./invoice-management-modal";

interface POSHeaderProps {
  onLogout?: () => void;
}

export function POSHeader({ onLogout }: POSHeaderProps) {
  const { t } = useTranslation();
  const [posMenuOpen, setPosMenuOpen] = useState(false);
  const [reportsSubmenuOpen, setReportsSubmenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location] = useLocation();
  const [submenuTimer, setSubmenuTimer] = useState<NodeJS.Timeout | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showProductManager, setShowProductManager] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);

  // Fetch store settings
  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
  });

  // Fetch employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/employees"],
  });

  // Fetch today's attendance records
  const todayDate = new Date().toISOString().split("T")[0];
  const { data: todayAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/attendance", todayDate],
    queryFn: async () => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/attendance?date=${todayDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch attendance records");
      }
      return response.json();
    },
  });

  // Find current working cashier
  const getCurrentCashier = () => {
    if (!employees || !todayAttendance) return null;

    // Get cashiers who are currently clocked in (have clock in but no clock out)
    const workingCashiers = todayAttendance
      .filter((record) => record.clockIn && !record.clockOut)
      .map((record) => {
        const employee = employees.find((emp) => emp.id === record.employeeId);
        return employee && employee.role === "cashier" ? employee : null;
      })
      .filter(Boolean);

    return workingCashiers.length > 0 ? workingCashiers[0] : null;
  };

  const currentCashier = getCurrentCashier();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle submenu timing
  const handleReportsMouseEnter = () => {
    if (submenuTimer) {
      clearTimeout(submenuTimer);
      setSubmenuTimer(null);
    }
    setReportsSubmenuOpen(true);
    setActiveDropdown("reports");
  };

  const handleReportsMouseLeave = () => {
    // Don't set timer here, let the container handle it
  };

  const handleSubmenuMouseEnter = () => {
    if (submenuTimer) {
      clearTimeout(submenuTimer);
      setSubmenuTimer(null);
    }
  };

  const handleSubmenuMouseLeave = () => {
    // Don't set timer here, let the container handle it
  };

  const handleReportsContainerMouseLeave = () => {
    const timer = setTimeout(() => {
      setReportsSubmenuOpen(false);
      setActiveDropdown(null);
    }, 300);
    setSubmenuTimer(timer);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".pos-dropdown")) {
        setPosMenuOpen(false);
        setReportsSubmenuOpen(false);
        setActiveDropdown(null);
      }
    };

    if (posMenuOpen || reportsSubmenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [posMenuOpen, reportsSubmenuOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (submenuTimer) {
        clearTimeout(submenuTimer);
      }
    };
  }, [submenuTimer]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleLogout = () => {
    // Xóa trạng thái đăng nhập khỏi sessionStorage
    sessionStorage.removeItem("pinAuthenticated");
    // Gọi callback onLogout nếu có
    if (onLogout) {
      onLogout();
    }
    // Reload trang để quay về màn hình đăng nhập
    window.location.reload();
  };

  // Determine if the current path should show the simplified mobile navigation
  const isMobileView = window.innerWidth < 768; // Assuming mobile view is < 768px
  const showSimplifiedNav = isMobileView && location === "/reports";

  return (
    <header className="bg-green-500 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <img
              src={logoPath}
              alt="EDPOS Logo"
              className="h-12 cursor-pointer"
              onClick={() => (window.location.href = "/reports")}
            />
          </div>
          <div className="flex flex-col">
            <div className="opacity-90 font-semibold text-[20px]">
              {storeSettings?.storeName || "EDPOS 레스토랑"}
            </div>
            <div className="text-sm opacity-75 text-right font-extrabold text-[#ffffff]">
              {t("pos.posLocation")}: {storeSettings?.defaultFloor || "1"}{t("pos.floor")}-{storeSettings?.defaultZone || "A"}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm opacity-90">{t("pos.cashierName")}</div>
            <div className="font-medium">
              {currentCashier ? currentCashier.name : t("pos.beforeWork")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{t("common.time")}</div>
            <div className="font-medium">{formatTime(currentTime)}</div>
          </div>
          <LanguageSwitcher />

          {/* Navigation Menu */}
          {!showSimplifiedNav && (
            <nav className="flex items-center space-x-4">
              <div className="relative pos-dropdown">
                <button
                  className={`flex items-center px-4 py-2 rounded-full transition-all duration-200 ${
                    [
                      "/",
                      "/pos",
                      "/tables",
                      "/inventory",
                      "/reports",
                      "/employees",
                      "/attendance",
                      "/suppliers",
                      "/purchases",
                      "/settings",
                    ].includes(location)
                      ? "bg-white bg-opacity-20"
                      : "hover:bg-white hover:bg-opacity-10"
                  }`}
                  onClick={() => setPosMenuOpen(!posMenuOpen)}
                >
                  <ScanBarcode className="w-4 h-4 mr-2" />
                  {t("nav.pos")}
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform ${posMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {posMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-48 z-50">
                    {/* 테이블 추가/관리 - 맨 위에 위치 */}
                    {storeSettings?.businessType === "restaurant" && (
                      <>
                        <Link href="/tables">
                          <button
                            className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                              location === "/tables"
                                ? "bg-green-50 text-green-600"
                                : "text-gray-700"
                            }`}
                            onClick={() => setPosMenuOpen(false)}
                            data-testid="button-nav-tables"
                          >
                            <Utensils className="w-4 h-4 mr-3" />
                            {t("nav.tablesSales")}
                          </button>
                        </Link>
                        <div className="border-t border-gray-200 my-2"></div>
                      </>
                    )}

                    <Link href="/pos">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/pos"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <Home className="w-4 h-4 mr-3" />
                        {t("nav.directSales")}
                      </button>
                    </Link>



                    <Link href="/sales-orders">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/sales-orders"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-3" />
                        {t("orders.orderList")}
                      </button>
                    </Link>


                    <div className="border-t border-gray-200 my-2"></div>
                    <Link href="/suppliers">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/suppliers"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <Building2 className="w-4 h-4 mr-3" />
                        {t("nav.suppliers")}
                      </button>
                    </Link>



                    <Link href="/purchases">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/purchases"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                        data-testid="button-nav-purchases"
                      >
                        <ClipboardCheck className="w-4 h-4 mr-3" />
                        {t("nav.purchases")}
                      </button>
                    </Link>

                    <Link href="/inventory">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/inventory"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <Package className="w-4 h-4 mr-3" />
                        {t("nav.inventory")}
                      </button>
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>
                    <Link href="/employees">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/employees"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <Users className="w-4 h-4 mr-3" />
                        {t("nav.employees")}
                      </button>
                    </Link>

                    <Link href="/attendance">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/attendance"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <Clock className="w-4 h-4 mr-3" />
                        {t("nav.attendance")}
                      </button>
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>

                    <div
                      className="relative"
                      onMouseLeave={handleReportsContainerMouseLeave}
                    >
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/reports"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setReportsSubmenuOpen(!reportsSubmenuOpen);
                          setActiveDropdown(
                            reportsSubmenuOpen ? null : "reports",
                          );
                        }}
                        onMouseEnter={handleReportsMouseEnter}
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        {t("nav.reports")}
                        <ChevronDown
                          className={`w-4 h-4 ml-auto transition-transform ${reportsSubmenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {reportsSubmenuOpen && (
                        <div className="absolute top-0 right-full mr-0.5 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-48 z-50 max-w-xs sm:max-w-none">
                          <Link href="/reports?tab=overview">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                                activeDropdown === "reports" &&
                                window.location.search === "?tab=overview"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setPosMenuOpen(false);
                                setReportsSubmenuOpen(false);
                              }}
                            >
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="truncate">
                                {t("reports.dashboard")}
                              </span>
                            </button>
                          </Link>
                          <Link href="/reports?tab=sales">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                                activeDropdown === "reports" &&
                                window.location.search === "?tab=sales"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setPosMenuOpen(false);
                                setReportsSubmenuOpen(false);
                              }}
                            >
                              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="truncate">
                                {t("reports.salesAnalysis")}
                              </span>
                            </button>
                          </Link>
                          <Link href="/reports?tab=menu">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                                activeDropdown === "reports" &&
                                window.location.search === "?tab=menu"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setPosMenuOpen(false);
                                setReportsSubmenuOpen(false);
                              }}
                            >
                              <PieChart className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="truncate">
                                {t("reports.menuAnalysis")}
                              </span>
                            </button>
                          </Link>
                          <Link href="/reports?tab=table">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                                activeDropdown === "reports" &&
                                window.location.search === "?tab=table"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setPosMenuOpen(false);
                                setReportsSubmenuOpen(false);
                              }}
                            >
                              <Utensils className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="truncate">
                                {t("reports.tableAnalysis")}
                              </span>
                            </button>
                          </Link>
                          <Link href="/reports?tab=saleschart">
                            <button
                              className={`w-full flex items-center px-2 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                                activeDropdown === "reports" &&
                                window.location.search === "?tab=saleschart"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setActiveDropdown(null);
                                setPosMenuOpen(false);
                                setReportsSubmenuOpen(false);
                              }}
                            >
                              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                              <span className="truncate">
                                {t("reports.salesReport")}
                              </span>
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <Link href="/settings">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left hover:bg-green-50 transition-colors ${
                          location === "/settings"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => setPosMenuOpen(false)}
                      >
                        <SettingsIcon className="w-4 h-4 mr-3" />
                        {t("settings.title")}
                      </button>
                    </Link>

                    <div className="border-t border-gray-200 my-2"></div>

                    <a
                      href="#"
                      className="w-full flex items-center px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-600 text-gray-700 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setPosMenuOpen(false);

                        // Detect if multiple screens are available
                        if (screen.availWidth > window.screen.width || window.screen.availLeft !== 0) {
                          // Multiple screens detected - place on secondary screen
                          const secondaryScreenLeft = screen.availLeft !== 0 ? 0 : screen.width;
                          const width = Math.min(1024, screen.availWidth);
                          const height = Math.min(768, screen.availHeight);

                          const customerWindow = window.open(
                            '/customer-display',
                            'customerDisplay',
                            `width=${width},height=${height},left=${secondaryScreenLeft},top=0,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                          );

                          // Try to maximize on secondary screen after opening
                          if (customerWindow) {
                            setTimeout(() => {
                              try {
                                customerWindow.moveTo(secondaryScreenLeft, 0);
                                customerWindow.resizeTo(screen.availWidth, screen.availHeight);
                              } catch (error) {
                                console.log('Cannot auto-resize customer display window due to browser security restrictions');
                              }
                            }, 500);
                          }
                        } else {
                          // Single screen - open in center with standard size
                          const width = 1024;
                          const height = 768;
                          const left = (screen.width - width) / 2;
                          const top = (screen.height - height) / 2;

                          window.open(
                            '/customer-display',
                            'customerDisplay',
                            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                          );
                        }
                      }}
                    >
                      <Users className="w-4 h-4 mr-3" />
                      {t("nav.customerDisplay")}
                    </a>

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      className="w-full flex items-center px-4 py-2 text-left hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors"
                      onClick={() => {
                        setPosMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Simplified mobile navigation for reports */}
          {showSimplifiedNav && (
            <nav className="flex items-center space-x-4">
              <div className="relative pos-dropdown">
                <button
                  className="flex items-center px-4 py-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                  onClick={() => setPosMenuOpen(!posMenuOpen)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {t("nav.reports")}
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform ${posMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {posMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-48 z-50">
                    <Link href="/reports?tab=overview">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left transition-colors ${
                          window.location.search === "?tab=overview"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        }`}
                        onClick={() => {
                          setPosMenuOpen(false);
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-3" />
                        {t("reports.dashboard")}
                      </button>
                    </Link>
                    <Link href="/reports?tab=sales">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left transition-colors ${
                          window.location.search === "?tab=sales"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        }`}
                        onClick={() => {
                          setPosMenuOpen(false);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        {t("reports.salesAnalysis")}
                      </button>
                    </Link>
                    <Link href="/reports?tab=menu">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left transition-colors ${
                          window.location.search === "?tab=menu"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        }`}
                        onClick={() => {
                          setPosMenuOpen(false);
                        }}
                      >
                        <PieChart className="w-4 h-4 mr-3" />
                        {t("reports.menuAnalysis")}
                      </button>
                    </Link>
                    <Link href="/reports?tab=table">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left transition-colors ${
                          window.location.search === "?tab=table"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        }`}
                        onClick={() => {
                          setPosMenuOpen(false);
                        }}
                      >
                        <Utensils className="w-4 h-4 mr-3" />
                        {t("reports.tableAnalysis")}
                      </button>
                    </Link>
                    <Link href="/reports?tab=saleschart">
                      <button
                        className={`w-full flex items-center px-4 py-2 text-left transition-colors ${
                          window.location.search === "?tab=saleschart"
                            ? "bg-green-50 text-green-600"
                            : "text-gray-700 hover:bg-green-50 hover:text-green-600"
                        }`}
                        onClick={() => {
                          setPosMenuOpen(false);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        {t("reports.salesReport")}
                      </button>
                    </Link>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      className="w-full flex items-center px-4 py-2 text-left hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors"
                      onClick={() => {
                        setPosMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>
      </div>
      {showProductManager && (
        <ProductManagerModal
          isOpen={showProductManager}
          onClose={() => setShowProductManager(false)}
        />
      )}
      {showInvoiceManagement && (
        <InvoiceManagementModal
          isOpen={showInvoiceManagement}
          onClose={() => setShowInvoiceManagement(false)}
        />
      )}
      {showPrinterConfig && (
        <PrinterConfigModal
          isOpen={showPrinterConfig}
          onClose={() => setShowPrinterConfig(false)}
        />
      )}
    </header>
  );
}