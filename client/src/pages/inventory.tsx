import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Edit,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";

const stockUpdateSchema = (t: any) =>
  z.object({
    productId: z.number(),
    quantity: z
      .number()
      .min(1, t("inventory.quantityMinError") || "Quantity must be at least 1"),
    type: z.enum(["add", "subtract", "set"]),
    notes: z.string().optional(),
    trackInventory: z.boolean().optional(),
    // Fields for new product creation
    name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
    sku: z.string().min(1, "SKU là bắt buộc"),
    price: z.string().optional(),
    categoryId: z.number().optional(),
    productType: z.number().optional(),
    taxRate: z.string().optional(),
  });

type StockUpdateForm = z.infer<typeof stockUpdateSchema>;

interface InventoryPageProps {
  onLogout: () => void;
}

export default function InventoryPage({ onLogout }: InventoryPageProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Get search parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
  });

  const stockUpdateForm = useForm<StockUpdateForm>({
    resolver: zodResolver(stockUpdateSchema(t)),
    defaultValues: {
      quantity: 1,
      type: "add",
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (data: StockUpdateForm) => {
      console.log("Updating stock:", data);
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/inventory/update-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update stock");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      setShowStockDialog(false);
      stockUpdateForm.reset();
      toast({
        title: t("inventory.updateSuccess") || "Cập nhật thành công",
        description:
          t("inventory.updateSuccessDescription") ||
          "Thông tin sản phẩm đã được cập nhật",
      });
    },
    onError: (error) => {
      console.error("Update stock error:", error);
      toast({
        title: t("inventory.updateFailed") || "Cập nhật thất bại",
        description:
          t("inventory.updateFailedDescription") ||
          "Không thể cập nhật sản phẩm. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const updateProductTrackInventoryMutation = useMutation({
    mutationFn: async ({
      id,
      trackInventory,
    }: {
      id: number;
      trackInventory: boolean;
    }) => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/${id}/track-inventory`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackInventory }),
      });
      if (!response.ok) {
        throw new Error("Failed to update track inventory");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      toast({
        title: "Thành công",
        description: "Trạng thái theo dõi tồn kho đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái theo dõi tồn kho",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending product data:", data);
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create product");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      setShowStockDialog(false);
      stockUpdateForm.reset();
      toast({
        title: t("inventory.createSuccess") || "Tạo mới thành công",
        description:
          t("inventory.createSuccessDescription") ||
          "Sản phẩm mới đã được thêm vào kho hàng",
      });
    },
    onError: (error: any) => {
      console.error("Create product error:", error);

      // Check if it's a duplicate SKU error
      if (
        error?.response?.status === 409 &&
        error?.response?.data?.code === "DUPLICATE_SKU"
      ) {
        toast({
          title: t("inventory.duplicateSku") || "Đã tồn tại sản phẩm trong kho",
          description:
            t("inventory.duplicateSkuDescription") ||
            "SKU này đã được sử dụng cho sản phẩm khác",
          variant: "destructive",
        });
      } else {
        toast({
          title: t("inventory.createFailed") || "Tạo mới thất bại",
          description:
            t("inventory.createFailedDescription") ||
            "Không thể tạo sản phẩm mới. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      toast({
        title: "",
        description: t("inventory.deleteSuccess") || "Xóa sản phẩm thành công",
      });
    },
    onError: (error) => {
      console.error("Delete product error:", error);

      let errorMessage =
        t("inventory.deleteFailedDescription") ||
        "Không thể xóa sản phẩm. Vui lòng thử lại.";

      if (
        error instanceof Error &&
        error.message.includes("Cannot delete product")
      ) {
        if (error.message.includes("transactions")) {
          errorMessage =
            "Không thể xóa sản phẩm vì đã được sử dụng trong các giao dịch bán hàng.";
        } else if (error.message.includes("orders")) {
          errorMessage =
            "Không thể xóa sản phẩm vì đã được sử dụng trong các đơn hàng.";
        }
      }

      toast({
        title: t("inventory.deleteFailed") || "Xóa thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/cleanup/inactive", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cleanup inactive products");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      toast({
        title: "Dọn dẹp thành công",
        description: `Đã xóa ${data.deletedCount} sản phẩm vô hiệu khỏi cơ sở dữ liệu`,
      });
    },
    onError: (error) => {
      console.error("Cleanup error:", error);
      toast({
        title: "Dọn dẹp thất bại",
        description: "Không thể xóa các sản phẩm vô hiệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId.toString() === selectedCategory;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock <= 10 && product.stock > 0) ||
      (stockFilter === "out" && product.stock === 0) ||
      (stockFilter === "in" && product.stock > 10);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(
    (p) => p.stock <= 10 && p.stock > 0,
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce(
    (sum, p) => sum + parseFloat(p.price) * p.stock,
    0,
  );

  const handleStockUpdate = (product: Product) => {
    setSelectedProduct(product);
    if (product.id === 0) {
      // Reset form for new product
      stockUpdateForm.reset({
        productId: 0,
        quantity: 0,
        type: "set",
        name: "",
        sku: "",
        price: "0",
        categoryId: categories[0]?.id || 1,
        productType: 1,
        trackInventory: true,
        taxRate: "8.00",
      });
    } else {
      // Load existing product data for editing
      stockUpdateForm.reset({
        productId: product.id,
        quantity: 1,
        type: "add",
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        productType: product.productType || 1,
        trackInventory: product.trackInventory !== false,
      });
    }
    setShowStockDialog(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (
      window.confirm(
        `${t("common.confimremote").replace("productname", product.name)}`,
      )
    ) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleCleanupInactiveProducts = () => {
    if (window.confirm(`${t("common.remotemanagerproduct")}`)) {
      cleanupMutation.mutate();
    }
  };

  const onStockUpdate = (data: StockUpdateForm) => {
    if (selectedProduct?.id === 0) {
      // Creating new product
      const newProductData = {
        name: data.name || "",
        sku: data.sku || "",
        price: data.price || "0",
        stock: data.quantity || 0,
        categoryId: data.categoryId || 1,
        productType: data.productType || 1,
        taxRate: data.taxRate || "8.00",
        imageUrl: null,
        isActive: true,
        trackInventory: data.trackInventory !== false,
      };
      console.log("Creating product with data:", newProductData);
      createProductMutation.mutate(newProductData);
    } else {
      // Updating existing product stock - include trackInventory
      const updateData = {
        productId: selectedProduct.id,
        quantity: data.quantity,
        type: data.type,
        notes: data.notes,
        trackInventory: data.trackInventory,
      };
      console.log("Updating stock with data:", updateData);
      updateStockMutation.mutate(updateData);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: t("inventory.outOfStock"), color: "bg-red-500" };
    if (stock <= 10)
      return { label: t("inventory.lowStock"), color: "bg-yellow-500" };
    return { label: t("inventory.inStock"), color: "bg-green-500" };
  };

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      <POSHeader />
      <RightSidebar />
      <div className="main-content pt-16 px-6">
        <div className="max-w-7xl mx-auto py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("inventory.title")}
              </h1>
              <p className="text-gray-600 mt-2">{t("inventory.description")}</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {t("inventory.totalProducts")}
                </CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {products.length}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {t("inventory.lowStock")}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {lowStockCount}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {t("inventory.outOfStock")}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {outOfStockCount}
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {t("inventory.totalValue")}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalValue.toLocaleString()} ₫
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8 border-green-200">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t("inventory.searchProducts")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("common.category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.category")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("inventory.stockStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("inventory.allStock")}
                    </SelectItem>
                    <SelectItem value="in">{t("inventory.inStock")}</SelectItem>
                    <SelectItem value="low">
                      {t("inventory.lowStock")}
                    </SelectItem>
                    <SelectItem value="out">
                      {t("inventory.outOfStock")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-left">
                {t("inventory.stockStatus")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create a placeholder product for adding new items
                    const newProduct: Product = {
                      id: 0,
                      name: "",
                      sku: "",
                      categoryId: 1,
                      price: "0",
                      stock: 0,
                      imageUrl: null,
                      isActive: true,
                    };
                    handleStockUpdate(newProduct);
                  }}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("inventory.addNewItem")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t("inventory.loading")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-green-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-700 w-auto min-w-[120px]">
                          <div className="leading-tight break-words">
                            {t("inventory.productName")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 w-auto min-w-[80px]">
                          <div className="leading-tight break-words">SKU</div>
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 w-auto min-w-[100px]">
                          <div className="leading-tight break-words">
                            {t("tables.productType")}
                          </div>
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700 w-auto min-w-[90px]">
                          <div className="leading-tight break-words">
                            {t("common.category")}
                          </div>
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-700 w-auto min-w-[80px]">
                          <div className="leading-tight break-words">
                            {t("inventory.currentStock")}
                          </div>
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-700 w-auto min-w-[80px]">
                          <div className="leading-tight break-words">
                            {t("common.status")}
                          </div>
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-700 w-auto min-w-[100px]">
                          <div className="leading-tight break-words">
                            {t("inventory.trackInventory")}
                          </div>
                        </th>
                        <th className="text-right py-3 px-2 font-medium text-gray-700 w-auto min-w-[80px]">
                          <div className="leading-tight break-words">
                            {t("inventory.unitPrice")}
                          </div>
                        </th>
                        <th className="text-right py-3 px-2 font-medium text-gray-700 w-auto min-w-[100px]">
                          <div className="leading-tight break-words">
                            {t("inventory.stockValue")}
                          </div>
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-700 w-auto min-w-[100px]">
                          <div className="leading-tight break-words">
                            {t("inventory.management")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => {
                        const category = categories.find(
                          (c) => c.id === product.categoryId,
                        );
                        const status = getStockStatus(product.stock);
                        const stockValue =
                          parseFloat(product.price) * product.stock;

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-gray-100 hover:bg-green-50/50"
                          >
                            <td className="py-4 px-2">
                              <div className="font-medium text-gray-900 break-words text-[13px]">
                                {product.name}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-gray-600">
                              <div className="break-words">{product.sku}</div>
                            </td>
                            <td className="py-4 px-2">
                              <Badge
                                variant="outline"
                                className="text-blue-700 border-blue-300 text-xs"
                              >
                                {product.productType === 1
                                  ? t("tables.goodsType")
                                  : product.productType === 2
                                    ? t("tables.materialType")
                                    : product.productType === 3
                                      ? t("tables.finishedProductType")
                                      : t("tables.goodsType")}
                              </Badge>
                            </td>
                            <td className="py-4 px-2">
                              <Badge
                                className="text-green-700 text-xs bg-transparent"
                              >
                                {category?.name || t("inventory.uncategorized")}
                              </Badge>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <span className="text-lg font-semibold">
                                {product.stock}
                              </span>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <Badge
                                className={`${status.color} text-white text-xs`}
                              >
                                {status.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <Checkbox
                                checked={product.trackInventory !== false}
                                disabled={true}
                              />
                            </td>
                            <td className="py-4 px-2 text-right text-gray-900">
                              <div className="break-words">
                                {parseFloat(product.price).toLocaleString()} ₫
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right font-medium text-gray-900">
                              <div className="break-words">
                                {stockValue.toLocaleString()} ₫
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStockUpdate(product)}
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  {t("inventory.edit")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product)}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  {t("inventory.delete")}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {t("inventory.noProducts")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Stock Update Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.id === 0
                ? t("inventory.addNewStock")
                : t("inventory.stockUpdate")}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <Form {...stockUpdateForm}>
              <form
                onSubmit={stockUpdateForm.handleSubmit(onStockUpdate)}
                className="space-y-4"
              >
                {selectedProduct?.id !== 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("inventory.currentStockLabel")}:{" "}
                      {selectedProduct.stock}
                      {t("common.items")}
                    </p>
                  </div>
                )}

                {selectedProduct?.id === 0 && (
                  <>
                    <FormField
                      control={stockUpdateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("inventory.productNameLabel")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                "inventory.productNamePlaceholder",
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockUpdateForm.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("inventory.skuLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("inventory.skuPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockUpdateForm.control}
                      name="productType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tables.productType")}</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString() || "1"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("tables.selectProductType")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">
                                {t("tables.goodsType")}
                              </SelectItem>
                              <SelectItem value="2">
                                {t("tables.materialType")}
                              </SelectItem>
                              <SelectItem value="3">
                                {t("tables.finishedProductType")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockUpdateForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("inventory.priceLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("inventory.pricePlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockUpdateForm.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("common.comboValues.taxPercentage")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="8.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={stockUpdateForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("inventory.categoryLabel")}</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    "inventory.categoryPlaceholder",
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {selectedProduct?.id !== 0 && (
                  <FormField
                    control={stockUpdateForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("inventory.updateType")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("inventory.selectUpdateType")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="add">
                              {t("inventory.addStock")}
                            </SelectItem>
                            <SelectItem value="subtract">
                              {t("inventory.subtractStock")}
                            </SelectItem>
                            <SelectItem value="set">
                              {t("inventory.setStock")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={stockUpdateForm.control}
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value !== false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t("inventory.trackInventory")}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={stockUpdateForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedProduct?.id === 0
                          ? t("inventory.initialStockQuantity")
                          : t("inventory.stockQuantity")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder={
                            selectedProduct?.id === 0
                              ? t("inventory.initialStockPlaceholder")
                              : t("inventory.quantityInput")
                          }
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProduct?.id !== 0 && (
                  <FormField
                    control={stockUpdateForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("inventory.editReason")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("inventory.changeReason")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStockDialog(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      updateStockMutation.isPending ||
                      createProductMutation.isPending
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateStockMutation.isPending ||
                    createProductMutation.isPending ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        {t("inventory.processing")}
                      </>
                    ) : selectedProduct?.id === 0 ? (
                      t("inventory.save")
                    ) : (
                      t("inventory.stockUpdate")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
