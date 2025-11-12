import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Utensils,
  Users,
  Clock,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  Package,
  ShoppingCart,
  FileText,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

// Menu items will be translated using the hook inside the component

export function RightSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [location] = useLocation();
  const { t } = useTranslation();

  // Query store settings to get business type
  const { data: storeSettings } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "https://order-mobile-be.onrender.com/api/store-settings");
      return response.json();
    },
  });

  const baseMenuItems: MenuItem[] = [
    {
      icon: Utensils,
      label: t("nav.tablesSales"),
      href: "/tables",
    },
    {
      icon: ShoppingCart,
      label: t("nav.directSales"),
      href: "/pos",
    },
    {
      icon: FileText,
      label: t("nav.salesOrders"),
      href: "/sales-orders",
    },
    {
      icon: Building2,
      label: t("nav.suppliers"),
      href: "/suppliers",
    },
    {
      icon: ClipboardCheck,
      label: t("nav.purchases"),
      href: "/purchases",
    },
    {
      icon: Package,
      label: t("nav.inventory"),
      href: "/inventory",
    },
    {
      icon: Users,
      label: t("nav.employees"),
      href: "/employees",
    },
    {
      icon: Clock,
      label: t("nav.attendance"),
      href: "/attendance",
    },
    {
      icon: BarChart3,
      label: t("nav.reports"),
      href: "/reports",
    },
    {
      icon: Settings,
      label: t("settings.title"),
      href: "/settings",
    },
  ];

  // Filter menu items based on business type
  const menuItems = baseMenuItems.filter((item) => {
    // Hide tables (Bán theo bàn) for retail business type
    if (item.href === "/tables" && storeSettings?.businessType === "retail") {
      return false;
    }
    return true;
  });

  // Update CSS custom property for responsive margin
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isExpanded ? "256px" : "64px",
    );
  }, [isExpanded]);

  return (
    <div
      className={cn(
        "fixed left-0 top-16 bottom-0 bg-white border-r border-green-200 shadow-lg transition-all duration-300 z-40",
        isExpanded ? "w-64" : "w-16",
      )}
    >
      {/* Toggle Button */}
      <div className="p-4 border-b border-green-200 bg-green-50 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center mt-1"
          onClick={() => {
            if (isExpanded) {
              setIsNavCollapsed(true);
              setIsExpanded(false);
            } else {
              setIsExpanded(true);
              setIsNavCollapsed(false); // Auto show text when expanding
            }
          }}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>{t("common.collapse")}</span>
            </>
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Menu Items */}
      <nav className="py-4 group">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          const showText = isExpanded && !isNavCollapsed;

          return (
            <div
              key={item.href}
              className={cn("relative", isNavCollapsed && "group-hover:w-64")}
            >
              <Link href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-[calc(100%-16px)] justify-start mb-2 mx-2 h-12 rounded-lg font-semibold text-gray-700 transition-all duration-300 relative border border-transparent overflow-hidden",
                    "bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-green-100 hover:border-green-200 hover:text-green-700 hover:shadow-xl",
                    "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
                    showText ? "px-4" : "px-3",
                    isActive &&
                      "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-300 shadow-lg font-bold",
                    isNavCollapsed && !showText && "hover:w-64 group",
                  )}
                  data-testid={`link${item.href.replace("/", "-")}`}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 flex-shrink-0",
                      showText && "mr-4",
                      isActive && "text-green-700",
                    )}
                  />
                  {showText && (
                    <span className="font-semibold text-base">
                      {item.label}
                    </span>
                  )}
                  {isNavCollapsed && !showText && (
                    <span className="ml-3 font-semibold text-base opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                      {item.label}
                    </span>
                  )}

                  {showText && item.badge && (
                    <span className="ml-auto bg-red-600 text-white text-xs font-bold rounded-full px-3 py-1 shadow-md">
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      {isExpanded && !isNavCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-200 bg-green-50">
          <div className="text-sm text-gray-500 text-center">
            <div className="font-medium">EDPOS System</div>
            <div className="text-xs opacity-75">v1.0.0</div>
          </div>
        </div>
      )}
    </div>
  );
}
