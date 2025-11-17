
import { useState } from "react";
import { X, Eye, Calendar, User, FileText, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Invoice {
  id: number;
  invoiceNumber: string;
  tradeNumber: string;
  templateNumber?: string;
  symbol?: string;
  customerName: string;
  customerTaxCode?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: string;
  invoiceDate: string;
  status: string;
  einvoiceStatus: number;
  notes?: string;
  createdAt: string;
}

interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  total: string;
  taxRate: string;
}

interface InvoiceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceManagementModal({
  isOpen,
  onClose,
}: InvoiceManagementModalProps) {
  const { t } = useTranslation();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  // Fetch invoices list
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoices");
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch invoice items for selected invoice
  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-items", selectedInvoice?.id],
    queryFn: async () => {
      if (!selectedInvoice?.id) return [];
      const response = await apiRequest("GET", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-items/${selectedInvoice.id}`);
      return response.json();
    },
    enabled: !!selectedInvoice?.id,
  });

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetail(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Nháp", variant: "secondary" as const },
      published: { label: "Đã phát hành", variant: "default" as const },
      cancelled: { label: "Đã hủy", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEInvoiceStatusBadge = (status: number) => {
    const statusConfig = {
      0: { label: "Chưa phát hành", variant: "secondary" as const },
      1: { label: "Đã phát hành", variant: "default" as const },
      2: { label: "Tạo nháp", variant: "outline" as const },
      3: { label: "Đã duyệt", variant: "default" as const },
      4: { label: "Đã bị thay thế", variant: "destructive" as const },
      5: { label: "Thay thế tạm", variant: "secondary" as const },
      6: { label: "Thay thế", variant: "default" as const },
      7: { label: "Đã bị điều chỉnh", variant: "destructive" as const },
      8: { label: "Điều chỉnh tạm", variant: "secondary" as const },
      9: { label: "Điều chỉnh", variant: "default" as const },
      10: { label: "Đã hủy", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: `Trạng thái ${status}`,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodName = (paymentMethod: string) => {
    // Convert string to number for comparison
    const methodType = parseInt(paymentMethod);
    
    switch (methodType) {
      case 1:
        return t('common.cash'); // "Tiền mặt"
      case 2:
        return 'Chuyển khoản'; // Bank transfer
      case 3:
        return 'TM/CK'; // Cash/Bank transfer combination
      case 4:
        return 'Đối trừ công nợ'; // Debt offset
      default:
        return paymentMethod; // Return original value if not numeric
    }
  };

  return (
    <>
      {/* Main Invoice List Modal */}
      <Dialog open={isOpen && !showInvoiceDetail} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quản lý hóa đơn
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-500">Đang tải danh sách hóa đơn...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chưa có hóa đơn nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Số giao dịch</th>
                      <th className="text-left p-3 font-medium">Số hóa đơn</th>
                      <th className="text-left p-3 font-medium">Khách hàng</th>
                      <th className="text-left p-3 font-medium">Tổng tiền</th>
                      <th className="text-left p-3 font-medium">Thanh toán</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                      <th className="text-left p-3 font-medium">Ngày tạo</th>
                      <th className="text-center p-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-mono text-sm">{invoice.tradeNumber}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-sm">{invoice.invoiceNumber || "Chưa có"}</div>
                          {invoice.templateNumber && (
                            <div className="text-sm text-gray-500">Mẫu: {invoice.templateNumber}</div>
                          )}
                          {invoice.symbol && (
                            <div className="text-sm text-gray-500">Kí hiệu: {invoice.symbol}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{invoice.customerName}</div>
                          {invoice.customerTaxCode && (
                            <div className="text-sm text-gray-500">MST: {invoice.customerTaxCode}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{formatCurrency(invoice.total)}</div>
                          <div className="text-sm text-gray-500">
                            Thuế: {formatCurrency(invoice.tax)}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{getPaymentMethodName(invoice.paymentMethod)}</Badge>
                        </td>
                        <td className="p-3">
                          {getEInvoiceStatusBadge(invoice.einvoiceStatus)}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{formatDate(invoice.createdAt)}</div>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(invoice)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={showInvoiceDetail} onOpenChange={() => setShowInvoiceDetail(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Chi tiết hóa đơn: {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Thông tin hóa đơn
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số hóa đơn</label>
                      <p className="font-mono">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                      <p>{formatDate(selectedInvoice.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Khách hàng</label>
                      <p className="font-medium">{selectedInvoice.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                      <p>{selectedInvoice.customerTaxCode || "Không có"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                      <p>{selectedInvoice.customerPhone || "Không có"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p>{selectedInvoice.customerEmail || "Không có"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                      <p>{selectedInvoice.customerAddress || "Không có"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                      <div>{getStatusBadge(selectedInvoice.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trạng thái HĐĐT</label>
                      <div>{getEInvoiceStatusBadge(selectedInvoice.einvoiceStatus)}</div>
                    </div>
                  </div>
                  {selectedInvoice.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Chi tiết sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoiceItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Không có sản phẩm nào</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Tên sản phẩm</th>
                            <th className="text-center p-2">Số lượng</th>
                            <th className="text-right p-2">Đơn giá</th>
                            <th className="text-center p-2">Thuế suất</th>
                            <th className="text-right p-2">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-2">{item.productName}</td>
                              <td className="p-2 text-center">{item.quantity}</td>
                              <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="p-2 text-center">{item.taxRate}%</td>
                              <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Tổng kết thanh toán</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thuế:</span>
                      <span>{formatCurrency(selectedInvoice.tax)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Phương thức thanh toán:</span>
                      <Badge variant="outline">{getPaymentMethodName(selectedInvoice.paymentMethod)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceDetail(false)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
