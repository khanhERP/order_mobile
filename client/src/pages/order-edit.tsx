
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { OrderEditView } from "@/components/orders/order-edit-view";

export default function OrderEditPage() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    // Extract orderId from URL path (e.g., /orders/edit/123)
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    
    if (id && !isNaN(parseInt(id))) {
      setOrderId(parseInt(id));
    }
  }, []);

  const handleBack = () => {
    setLocation("/reports?tab=overview");
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return <OrderEditView orderId={orderId} onBack={handleBack} />;
}
