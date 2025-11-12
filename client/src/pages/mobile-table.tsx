
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MobileTableView } from "@/components/tables/mobile-table-view";

export default function MobileTablePage() {
  const [, setLocation] = useLocation();
  const [tableId, setTableId] = useState<number | null>(null);
  const [floor, setFloor] = useState<string>("");

  useEffect(() => {
    // Extract tableId from URL path (e.g., /tables/mobile/123)
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    
    if (id && !isNaN(parseInt(id))) {
      setTableId(parseInt(id));
    }

    // Extract floor from query params
    const params = new URLSearchParams(window.location.search);
    const floorParam = params.get("floor");
    if (floorParam) {
      setFloor(decodeURIComponent(floorParam));
    }
  }, []);

  const handleBack = () => {
    setLocation("/reports?tab=overview");
  };

  if (!tableId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return <MobileTableView tableId={tableId} floor={floor} onBack={handleBack} />;
}
