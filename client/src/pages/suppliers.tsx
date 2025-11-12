
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Edit, Trash2, Phone, Mail, MapPin, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import type { Supplier } from "@shared/schema";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";

interface SuppliersPageProps {
  onLogout: () => void;
}

export default function SuppliersPage({ onLogout }: SuppliersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['https://order-mobile-be.onrender.com/api/suppliers', { status: selectedStatus, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiRequest('GET', `https://order-mobile-be.onrender.com/api/suppliers?${params}`);
      return response.json();
    },
  });

  // Fetch purchase order statistics for suppliers
  const { data: supplierStats } = useQuery({
    queryKey: ['https://order-mobile-be.onrender.com/api/purchase-orders/supplier-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', 'https://order-mobile-be.onrender.com/api/purchase-orders/supplier-stats');
      return response.json();
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `https://order-mobile-be.onrender.com/api/suppliers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://order-mobile-be.onrender.com/api/suppliers'] });
      toast({
        title: t('suppliers.deleteSuccess'),
        description: t('suppliers.deleteSuccessDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('suppliers.deleteFailed'),
        description: t('suppliers.deleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('suppliers.confirmDelete'))) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  const [, navigate] = useLocation();

  const handleCreatePurchaseOrder = (supplier: Supplier) => {
    // Navigate to purchase order creation with pre-selected supplier
    navigate(`/purchases?action=create&supplierId=${supplier.id}`);
  };

  const getSupplierMetrics = (supplierId: number) => {
    if (!supplierStats) return { totalOrders: 0, onTimeDelivery: 0, averageRating: 0 };
    return supplierStats[supplierId] || { totalOrders: 0, onTimeDelivery: 0, averageRating: 0 };
  };

  const filteredSuppliers = suppliers || [];

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      <POSHeader />
      <RightSidebar />
      
      <div className="main-content pt-16 px-6">
        <div className="max-w-7xl mx-auto py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('suppliers.title')}</h1>
              <p className="mt-2 text-gray-600">{t('suppliers.description')}</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('suppliers.addSupplier')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('suppliers.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
              >
                {t('common.all')}
              </Button>
              <Button
                variant={selectedStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("active")}
              >
                {t('suppliers.active')}
              </Button>
              <Button
                variant={selectedStatus === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("inactive")}
              >
                {t('suppliers.inactive')}
              </Button>
            </div>
          </div>

          {/* Suppliers Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('suppliers.noSuppliers')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSuppliers.map((supplier: Supplier) => (
                <Card key={supplier.id} className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{supplier.name}</CardTitle>
                        <CardDescription>{supplier.code}</CardDescription>
                      </div>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status === 'active' ? t('suppliers.active') : t('suppliers.inactive')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 flex flex-col flex-1">
                    <div className="space-y-2">
                      {supplier.contactPerson && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="w-4 h-4 mr-2" />
                          {supplier.contactPerson}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {supplier.address}
                        </div>
                      )}
                      {supplier.paymentTerms && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{t('suppliers.paymentTerms')}:</span> {supplier.paymentTerms}
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Metrics */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {getSupplierMetrics(supplier.id).totalOrders}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('purchases.totalOrders')}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {getSupplierMetrics(supplier.id).onTimeDelivery}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('purchases.onTime')}
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-yellow-600">
                            {getSupplierMetrics(supplier.id).averageRating.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('purchases.rating')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-auto pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleCreatePurchaseOrder(supplier)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-create-po-${supplier.id}`}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        {t('purchases.createOrder')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(supplier)}
                        data-testid={`button-edit-supplier-${supplier.id}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-supplier-${supplier.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={showForm}
        onClose={handleFormClose}
        supplier={editingSupplier}
      />
    </div>
  );
}
