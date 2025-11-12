import React from "react";
import { Link } from "wouter";
import { BarChart3, PieChart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import logoPath from "@assets/EDPOS_1753091767028.png";
import { MoreHorizontal } from "lucide-react";

interface ReportsMenuProps {
  onBack: () => void;
  onReportsClick?: () => void;
  onDailySalesClick?: () => void;
}

export function ReportsMenu({
  onBack,
  onReportsClick,
  onDailySalesClick,
}: ReportsMenuProps) {
  const { t } = useTranslation();

  const reportItems = [
    {
      href: "#",
      icon: BarChart3,
      label: t("reports.dailySales"),
      description: t("reports.dailySalesChart"),
      onClick: onDailySalesClick,
    },
    {
      href: "/reports?tab=menu",
      icon: PieChart,
      label: t("reports.menuAnalysis"),
      description: t("reports.menuAnalysisDescription"),
      onClick: () => {
        const url = new URL(window.location);
        url.searchParams.set("tab", "menu");
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
    },
  ];

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-green-700"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t("reports.title")}</h1>
        </div>
        <div className="flex items-center">
          <img
            src={logoPath}
            alt="EDPOS Logo"
            className="h-8 md:h-12 object-contain"
            onError={(e) => {
              console.error("Failed to load logo image");
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Report List */}
      <div className="p-4 space-y-3 flex-grow">
        {reportItems.map((item, index) => {
          const Icon = item.icon;

          if (item.onClick) {
            return (
              <Card
                key={index}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={item.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Link key={index} href={item.href}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {/* Mobile Bottom Navigation - Always shown */}
      <div className="sticky bottom-0 w-full bg-white p-2 border-t">
        {/* Placeholder for MobileBottomNav component, assuming it exists elsewhere */}
        {/* Replace with actual MobileBottomNav component if available */}
        <div className="flex justify-around items-center">
          <div
            className="flex flex-col items-center text-gray-500 hover:text-blue-600 cursor-pointer"
            onClick={onBack}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs">{t("reports.dashboard")}</span>
          </div>
          <Link href="/reports">
            <div className="flex flex-col items-center text-blue-600 font-medium">
              <PieChart className="w-6 h-6" />
              <span className="text-xs">{t("reports.title")}</span>
            </div>
          </Link>
          <div
            className="flex flex-col items-center text-gray-500 hover:text-blue-600 cursor-pointer"
            onClick={() => {
              if (window.location.pathname === "/reports") {
                const url = new URL(window.location);
                url.searchParams.set("tab", "other");
                window.history.pushState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
              } else {
                window.location.href = "/reports?tab=other";
              }
            }}
          >
            {(() => {
              const Icon = MoreHorizontal;
              return <Icon className="w-5 h-5 mb-1 flex-shrink-0" />;
            })()}
            <span className="text-xs">{t("nav.other")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
