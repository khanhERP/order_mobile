
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Tag, DollarSign, Warehouse, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    sku: string;
    price: string | number;
    stock: number;
    categoryId: number;
    categoryName?: string;
    imageUrl?: string;
    isActive: boolean;
    productType: number;
    trackInventory: boolean;
    taxRate: string | number;
    priceIncludesTax: boolean;
    afterTaxPrice: string | number;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) {
  const { t } = useTranslation();

  if (!product) return null;

  const formatCurrency = (amount: string | number) => {
    if (!amount && amount !== 0) return "0 ₫";
    const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  const getProductTypeName = (type: number) => {
    const types: Record<number, string> = {
      1: t("reports.product") || "Sản phẩm",
      2: t("reports.combo") || "Combo", 
      3: t("reports.service") || "Dịch vụ",
    };
    return types[type] || types[1];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {t("reports.productDetails") || "Chi tiết sản phẩm"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image and Basic Info */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border flex items-center justify-center shadow-sm ${product.imageUrl ? 'hidden' : ''}`}>
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{product.sku}</Badge>
                <Badge 
                  variant={product.isActive ? "default" : "destructive"}
                >
                  {product.isActive ? (t("common.active") || "Đang bán") : (t("common.inactive") || "Ngừng bán")}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t("common.type") || "Loại"}: {getProductTypeName(product.productType)}
              </p>
            </div>
          </div>

              {/* Product Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 border-b pb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                {t("reports.priceInfo") || "Thông tin giá"}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("common.originalPrice") || "Giá gốc"}:</span>
                  <span className="font-medium">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("common.taxRate") || "Thuế suất"}:</span>
                  <span className="font-medium">{product.taxRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 bg-green-50 px-2 rounded">
                  <span className="text-gray-600">{t("common.afterTaxPrice") || "Giá đã có thuế"}:</span>
                  <span className="font-semibold text-green-700">
                    {formatCurrency(product.afterTaxPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("common.includesTax") || "Bao gồm thuế"}:</span>
                  <Badge variant={product.priceIncludesTax ? "default" : "secondary"}>
                    {product.priceIncludesTax ? (t("common.yes") || "Có") : (t("common.no") || "Không")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Inventory Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 border-b pb-2">
                <Warehouse className="w-4 h-4 text-blue-600" />
                {t("inventory.inventoryInfo") || "Thông tin kho"}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("common.stock") || "Tồn kho"}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.stock}</span>
                    <Badge 
                      variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {product.stock > 10 
                        ? (t("inventory.inStock") || "Đủ hàng") 
                        : product.stock > 0 
                          ? (t("inventory.lowStock") || "Sắp hết") 
                          : (t("inventory.outOfStock") || "Hết hàng")
                      }
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("inventory.trackInventory") || "Theo dõi kho"}:</span>
                  <Badge variant={product.trackInventory ? "default" : "secondary"}>
                    {product.trackInventory ? (t("common.yes") || "Có") : (t("common.no") || "Không")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">{t("common.category") || "Nhóm hàng"}:</span>
                  <span className="font-medium">
                    {product.categoryName || (t("inventory.uncategorized") || "Chưa phân loại")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t("reports.additionalInfo") || "Thông tin khác"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("common.productId") || "ID sản phẩm"}:</span>
                <span className="font-medium">#{product.id}</span>
              </div>
              {product.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("common.createdAt") || "Ngày tạo"}:</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("common.close") || "Đóng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
