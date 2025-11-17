import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import logoPath from "@assets/EDPOS_1753091767028.png";
import { useQuery } from "@tanstack/react-query";
import type { StoreSettings } from "@shared/schema";

interface ReportsHeaderProps {
  onLogout?: () => void;
  title?: string;
}

export function ReportsHeader({
  onLogout,
  title = "DASHBOARD",
}: ReportsHeaderProps) {
  const { t } = useTranslation();

  // Fetch store settings
  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings"],
    queryFn: async () => {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings");
      if (!response.ok) {
        throw new Error("Failed to fetch store settings");
      }
      return response.json();
    },
  });

  const handleLogout = () => {
    // Clear authentication state from sessionStorage
    sessionStorage.removeItem("pinAuthenticated");
    // Call callback onLogout if provided
    if (onLogout) {
      onLogout();
    }
    // Reload page to return to login screen
    window.location.reload();
  };

  // Get current date
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <header className="fixed top-0 left-0 right-0 bg-green-500 text-white shadow-lg z-40 h-16">
      <div className="max-w-full mx-auto px-4 h-full flex items-center justify-between gap-2">
        {/* Left side - Store name only */}
        <div className="flex items-center flex-1 min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate whitespace-nowrap">
            {storeSettings?.storeName || ""}
          </h1>
        </div>

        {/* Right side - Logo */}
        <div className="flex items-center flex-shrink-0">
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
    </header>
  );
}