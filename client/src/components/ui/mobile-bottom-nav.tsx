
import React from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, FileText, Home, PieChart, MoreHorizontal } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface MobileBottomNavProps {
  onReportsClick?: () => void;
}

export function MobileBottomNav({ onReportsClick }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    {
      href: "/reports?tab=overview",
      icon: Home,
      label: t("nav.tables"),
      key: "tables",
      isActive: location === "/reports" && window.location.search === "?tab=overview"
    },
    {
      href: "/reports?tab=other",
      icon: MoreHorizontal,
      label: t("nav.other"),
      key: "other",
      isActive: location === "/reports" && window.location.search === "?tab=other"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg safe-area-bottom">
      <div className="flex h-16 max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.onClick) {
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className={`flex-1 w-full h-full flex flex-col items-center justify-center py-2 px-2 transition-colors ${
                  item.isActive
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600"
                }`}
              >
                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight text-center w-full">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link key={item.key} href={item.href} className="flex-1">
              <button
                className={`w-full h-full flex flex-col items-center justify-center py-2 px-2 transition-colors ${
                  item.isActive
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600"
                }`}
              >
                <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight text-center w-full">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
