import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClipboardCheck, Plus, Search, Filter, BarChart3, Calendar, User, DollarSign, Eye, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PurchaseOrder, Supplier } from "@shared/schema";

interface PurchasesPageProps {
  onLogout: () => void;
}

export default function PurchasesPage({ onLogout }: PurchasesPageProps) {
  const { t, currentLanguage } = useTranslation();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // State for selected purchase orders
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  
  // State for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch purchase receipts with filters
  const { data: purchaseOrders = [], isLoading: isOrdersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/purchase-receipts", { startDate, endDate, productFilter, searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (productFilter) {
        params.append('search', productFilter);
      }
      
      const url = `https://order-mobile-be.onrender.com/api/purchase-receipts${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Fetching purchase receipts with filters:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase receipts');
      }
      
      const data = await response.json();
      console.log('📦 Purchase receipts fetched:', data.length || 0);
      return data;
    },
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Fetch suppliers for filtering
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["https://order-mobile-be.onrender.com/api/suppliers"],
  });

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter orders from current month
    const thisMonthOrders = purchaseOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const pending = purchaseOrders.filter(order => order.status === 'pending').length;
    const completed = purchaseOrders.filter(order => order.status === 'received').length;
    const totalValue = purchaseOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);

    return {
      totalOrders: thisMonthOrders.length, // Now correctly shows this month's orders
      pendingOrders: pending,
      completedOrders: completed,
      totalValue: totalValue
    };
  }, [purchaseOrders]);

  // Use server-filtered orders directly
  const filteredOrders = purchaseOrders;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      partially_received: 'bg-purple-100 text-purple-800 border-purple-300',
      received: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const formatCurrency = (amount: string) => {
    // Get locale from current language setting
    const locale = {
      ko: 'ko-KR',
      en: 'en-US',
      vi: 'vi-VN'
    }[currentLanguage] || 'en-US';

    // Use appropriate currency based on locale
    const currency = {
      ko: 'KRW',
      en: 'USD',
      vi: 'VND'
    }[currentLanguage] || 'USD';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount || '0'));
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || t('purchases.unknownSupplier');
  };

  // Handle individual order selection
  const handleSelectOrder = (orderId: number, checked: boolean) => {
    setSelectedOrders(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(orderId);
      } else {
        newSelected.delete(orderId);
      }
      return newSelected;
    });
  };

  // Handle select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOrderIds = new Set(filteredOrders.map(order => order.id));
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Check if all orders are selected
  const isAllSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < filteredOrders.length;

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      return apiRequest("POST", "https://order-mobile-be.onrender.com/api/purchase-receipts/bulk-delete", {
        orderIds
      });
    },
    onSuccess: (data) => {
      console.log("✅ Bulk delete successful:", data);
      
      toast({
        title: t("purchases.deleteSuccess"),
        description: `${data.deletedCount} ${t("purchases.deleteSuccess")}`,
        variant: "default",
      });

      // Clear selected orders
      setSelectedOrders(new Set());
      
      // Refetch purchase receipts
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/purchase-receipts"] });
      
      // Close dialog
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      console.error("❌ Bulk delete failed:", error);
      
      toast({
        title: t("purchases.deleteFailed"),
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Close dialog
      setShowDeleteDialog(false);
    },
  });

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedOrders.size === 0) return;
    
    const orderIds = Array.from(selectedOrders);
    console.log("🗑️ Starting bulk delete for orders:", orderIds);
    
    bulkDeleteMutation.mutate(orderIds);
  };

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <POSHeader />

      {/* Right Sidebar */}
      <RightSidebar />

      <div className="container mx-auto pt-16 px-6 max-w-7xl">
        <div className="max-w-full mx-auto py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t("purchases.purchaseReceiptsList")}</h1>
            </div>
            <p className="text-gray-600">{t("purchases.dashboard")}</p>
          </div>



        {/* Action Buttons - Removed, moved below filters */}

        {/* Action Bar with Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-end justify-center">
                {/* From Date */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-bold">{t("purchases.fromDateLabel")}</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                    data-testid="input-start-date"
                  />
                </div>

                {/* To Date */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-bold">{t("purchases.toDateLabel")}</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                    data-testid="input-end-date"
                  />
                </div>

                {/* Product Filter */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-bold">{t("purchases.productLabel")}</label>
                  <Input
                    placeholder={t("purchases.searchProducts")}
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full"
                    data-testid="input-search-products"
                  />
                </div>

                {/* Search */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-bold">{t("purchases.generalSearchLabel")}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t("purchases.searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                      data-testid="input-search-purchase-orders"
                    />
                  </div>
                </div>
              </div>

              </div>
          </CardContent>
        </Card>

        {/* Action Buttons - Outside of filter card */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={selectedOrders.size === 0 || bulkDeleteMutation.isPending}
            className="font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-delete-selected"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            {t("purchases.deleteSelected")} ({selectedOrders.size})
          </Button>
          
          <Button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => navigate('/purchases/create')}
            data-testid="button-create-purchase-order"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("purchases.createNewPurchaseOrder")}
          </Button>
        </div>

        {/* Purchase Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("purchases.purchaseReceipts")}</CardTitle>
            <CardDescription>
              {filteredOrders.length > 0
                ? `${filteredOrders.length} ${t("purchases.ordersFound")}`
                : t("purchases.overview")
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500">{t("purchases.loadingOrders")}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {purchaseOrders.length === 0 ? t("purchases.noOrders") : t("purchases.noOrdersFound")}
                </h3>
                <p className="text-gray-500 mb-6">
                  {purchaseOrders.length === 0
                    ? t("purchases.createFirstOrder")
                    : t("purchases.tryDifferentFilters")
                  }
                </p>
                {purchaseOrders.length === 0 && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => navigate('/purchases/create')}
                    data-testid="button-create-first-order"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t("purchases.createNewPurchaseOrder")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold w-12">
                        <Checkbox
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isIndeterminate;
                          }}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-bold">{t("purchases.receiptNumber")}</TableHead>
                      <TableHead className="font-bold">{t("purchases.purchaseDate")}</TableHead>
                      <TableHead className="font-bold">{t("purchases.supplier")}</TableHead>
                      <TableHead className="font-bold">{t("purchases.subtotalAmount")}</TableHead>
                      <TableHead className="font-bold">{t("purchases.discountAmount")}</TableHead>
                      <TableHead className="font-bold">{t("purchases.totalAmount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        data-testid={`row-purchase-order-${order.id}`}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          // Don't navigate if clicking on checkbox
                          if ((e.target as HTMLElement).type === 'checkbox') return;
                          console.log('Clicked row for order:', order.id);
                          navigate(`/purchases/view/${order.id}`);
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) => 
                              handleSelectOrder(order.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {order.receiptNumber || order.poNumber || order.receipt_number || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {(() => {
                              // Try multiple possible date fields for purchase receipts
                              const date = order.purchaseDate || order.actualDeliveryDate || order.createdAt || order.created_at;
                              if (date) {
                                try {
                                  return new Date(date).toLocaleDateString({
                                    ko: 'ko-KR',
                                    en: 'en-US',
                                    vi: 'vi-VN'
                                  }[currentLanguage] || 'en-US');
                                } catch (error) {
                                  console.error('Date parsing error:', error);
                                  return '-';
                                }
                              }
                              return '-';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            {getSupplierName(order.supplierId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            {formatCurrency(order.subtotal || order.total || '0')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-red-600">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            {formatCurrency(order.discount || '0')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            {formatCurrency(order.total || '0')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("purchases.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.areYouSure")} {selectedOrders.size} {t("purchases.confirmDeleteMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteDialog(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}