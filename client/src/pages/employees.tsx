import { useState } from "react";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { Button } from "@/components/ui/button";
import { UserPlus, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

interface EmployeesPageProps {
  onLogout: () => void;
}

export default function EmployeesPage({ onLogout }: EmployeesPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <POSHeader />

      {/* Right Sidebar */}
      <RightSidebar />

      <div className="main-content pt-16 px-6">
        <div className="mx-auto py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("employees.title")}
              </h1>
              <p className="mt-2 text-gray-600">{t("employees.description")}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/sales-orders">
                <Button variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('nav.pos')}
                </Button>
              </Link>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t("employees.addEmployee")}
              </Button>
            </div>
          </div>

          {/* Employee List */}
          <EmployeeList />

          {/* Add Employee Modal */}
          <EmployeeFormModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}
