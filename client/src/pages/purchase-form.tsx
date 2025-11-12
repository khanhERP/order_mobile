import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Calendar,
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  Package,
  Calculator,
  Save,
  Send,
  X,
  Upload,
  FileText,
  Image,
  Download,
  ClipboardCheck,
  Edit,
  CheckCircle,
} from "lucide-react";
import {
  insertPurchaseReceiptSchema,
  insertPurchaseReceiptItemSchema,
  insertProductSchema,
} from "@shared/schema";
import { format } from "date-fns";

// Import types we need
type PurchaseOrderItem = {
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  total: number;
};

// Form validation schema using shared schema
const purchaseFormSchema = insertPurchaseReceiptSchema.extend({
  items: z
    .array(
      insertPurchaseReceiptItemSchema.extend({
        productName: z.string(),
        sku: z.string().optional(),
        receivedQuantity: z.number().default(0),
      }),
    )
    .min(1, "At least one item is required"),
  purchaseType: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

// Product selection interface
interface ProductSelectionItem {
  id: number;
  name: string;
  sku?: string;
  stock: number;
  unitPrice: number;
}

interface PurchaseFormPageProps {
  id?: string;
  viewOnly?: boolean;
  onLogout: () => void;
}

export default function PurchaseFormPage({
  id,
  viewOnly = false,
  onLogout,
}: PurchaseFormPageProps) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      productId: number;
      productName: string;
      sku?: string;
      quantity: number;
      receivedQuantity: number;
      unitPrice: number;
      total: number;
    }>
  >([]);
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id?: number;
      fileName: string;
      originalFileName: string;
      fileType: string;
      fileSize: number;
      filePath?: string;
      file?: File;
      description?: string;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // State to control submit button

  const isEditMode = Boolean(id) && !viewOnly;

  // Form setup
  const form = useForm<z.infer<typeof insertPurchaseReceiptSchema>>({
    resolver: zodResolver(insertPurchaseReceiptSchema),
    defaultValues: {
      receiptNumber: `PN${Date.now()}`,
      supplierId: 0,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      actualDeliveryDate: "",
      notes: "",
      subtotal: "0.00",
      tax: "0.00",
      total: "0.00",
    },
    mode: "onChange", // Enable real-time validation
  });

  // New product form
  const newProductForm = useForm({
    resolver: zodResolver(
      insertProductSchema.extend({
        categoryId: z.number(),
        productType: z.number().default(1),
        price: z.string(),
        stock: z.number().default(0),
        trackInventory: z.boolean().default(true),
        taxRate: z.string().default("8.00"),
      }),
    ),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: 1,
      productType: 1,
      price: "0",
      stock: 0,
      trackInventory: true,
      isActive: true,
      taxRate: "8.00",
    },
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/suppliers"],
    select: (data: any) => data || [],
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/employees"],
    select: (data: any[]) =>
      (data || []).map((emp: any) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
      })),
  });

  // Fetch categories for new product form
  const { data: categories = [] } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/categories"],
    select: (data: any) => data || [],
  });

  // Fetch products for selection
  const { data: allProducts = [] } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/products"],
    select: (data: any[]) =>
      (data || []).map((product: any) => ({
        ...product,
        unitPrice: Number(product.price) || 0,
      })),
  });

  // Filter products based on search
  const products = useMemo(() => {
    return allProducts.filter(
      (product: any) =>
        productSearch === "" ||
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [allProducts, productSearch]);

  // Fetch existing purchase order for edit mode
  const { data: existingOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: [`https://order-mobile-be.onrender.com/api/purchase-orders/${id}`],
    enabled: Boolean(id),
    select: (data: any) => {
      console.log("📊 Purchase order API response:", data);
      return data;
    },
  });

  // Fetch existing documents for edit mode
  const { data: existingDocuments } = useQuery({
    queryKey: [`https://order-mobile-be.onrender.com/api/purchase-orders/${id}/documents`],
    enabled: Boolean(id),
    select: (data: any) => data || [],
  });

  // Fetch next PO number for new orders
  const {
    data: nextPONumber,
    error: nextPOError,
    isLoading: isLoadingPONumber,
  } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/purchase-orders/next-po-number"],
    enabled: !isEditMode,
    queryFn: async () => {
      try {
        console.log("🔍 Fetching next PO number...");
        const response = await apiRequest(
          "GET",
          "https://order-mobile-be.onrender.com/api/purchase-orders/next-po-number",
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("📊 PO Number API Response:", data);
        return data?.nextPONumber || "PO001";
      } catch (error) {
        console.error("❌ PO Number API Error:", error);
        // Generate client-side fallback with proper format
        const fallbackPO = "PO001";
        console.log("🔄 Using client-side fallback PO:", fallbackPO);
        return fallbackPO;
      }
    },
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Log PO number fetch status
  useEffect(() => {
    console.log("🔍 PO Number Query Status:", {
      isEditMode,
      nextPONumber,
      nextPOError: nextPOError?.message,
      isLoadingPONumber,
      enabled: !isEditMode,
    });

    if (nextPOError) {
      console.error("❌ Next PO number fetch error:", nextPOError);
      // Generate fallback PO number with proper format
      const fallbackPO = "PO001";
      console.log("🔄 Using fallback PO number:", fallbackPO);
      form.setValue("poNumber", fallbackPO);
    }

    if (nextPONumber) {
      console.log("✅ Successfully fetched next PO number:", nextPONumber);
    }
  }, [nextPONumber, nextPOError, isLoadingPONumber, isEditMode, form]);

  // Set default PO number if available and not in edit mode and field is empty
  useEffect(() => {
    if (!isEditMode && nextPONumber) {
      const currentValue = form.getValues("poNumber");
      // Only set if field is completely empty (not just whitespace)
      if (!currentValue || currentValue.trim() === "") {
        console.log("🔢 Setting auto-generated PO number:", nextPONumber);
        form.setValue("poNumber", nextPONumber);
        form.trigger("poNumber"); // Trigger validation to update UI
      }
    }
  }, [nextPONumber, isEditMode, form]);

  // Initialize empty PO number for create mode and add default empty row
  useEffect(() => {
    if (!isEditMode && !nextPONumber && !isLoadingPONumber && !nextPOError) {
      console.log("🆕 Initializing empty PO number for new order");
      // Don't clear if already has a value (like fallback)
      if (!form.getValues("poNumber")) {
        form.setValue("poNumber", "");
      }
    }

    // Add default empty row for new purchase orders
    if (!isEditMode && selectedItems.length === 0) {
      console.log("🆕 Adding default empty row for new purchase order");
      const defaultEmptyRow = {
        productId: 0,
        productName: "",
        sku: "",
        quantity: 1,
        receivedQuantity: 0,
        unitPrice: 0,
        total: 0,
      };
      setSelectedItems([defaultEmptyRow]);
    }
  }, [
    isEditMode,
    nextPONumber,
    isLoadingPONumber,
    nextPOError,
    form,
    selectedItems.length,
  ]);

  // Load existing order data
  useEffect(() => {
    if (existingOrder && typeof existingOrder === "object") {
      const order = existingOrder as any;
      console.log("📋 Loading existing order data:", order);

      form.setValue("supplierId", order.supplierId);
      form.setValue("receiptNumber", order.receiptNumber); // Corrected field name
      form.setValue("purchaseDate", order.purchaseDate || "");
      form.setValue("notes", order.notes || "");
      form.setValue("purchaseType", order.purchaseType || "");
      form.setValue("employeeId", order.employeeId);

      // Set financial totals
      form.setValue("subtotal", order.subtotal || "0.00");
      form.setValue("tax", order.tax || "0.00");
      form.setValue("total", order.total || "0.00");

      // Load existing items - fix the items loading logic
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        console.log("📦 Loading order items:", order.items);
        setSelectedItems(
          order.items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName || "Unknown Product",
            sku: item.sku || "",
            quantity: item.quantity || 0,
            receivedQuantity: item.receivedQuantity || 0,
            unitPrice: parseFloat(item.unitPrice || "0"),
            total:
              parseFloat(item.total || "0") ||
              parseFloat(item.unitPrice || "0") * (item.quantity || 0),
          })),
        );
      } else {
        console.log("⚠️ No items found in order or items is not an array, adding default row");
        // Add a default empty row for editing
        const defaultEmptyRow = {
          productId: 0,
          productName: "",
          sku: "",
          quantity: 1,
          receivedQuantity: 0,
          unitPrice: 0,
          total: 0,
        };
        setSelectedItems([defaultEmptyRow]);
      }
    }
  }, [existingOrder, form]);

  // Load existing documents
  useEffect(() => {
    if (existingDocuments && Array.isArray(existingDocuments)) {
      setAttachedFiles(
        existingDocuments.map((doc: any) => ({
          id: doc.id,
          fileName: doc.fileName,
          originalFileName: doc.originalFileName,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          filePath: doc.filePath,
          description: doc.description,
        })),
      );
    }
  }, [existingDocuments]);

  // Update form items when selectedItems changes - convert to schema format
  useEffect(() => {
    const schemaItems = selectedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || "",
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity,
      unitPrice: item.unitPrice.toFixed(2),
      total: item.total.toFixed(2),
    }));
    form.setValue("items", schemaItems);
  }, [selectedItems, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Starting mutation with data:", data);

      // Validate data
      if (!data.items || data.items.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một sản phẩm hợp lệ");
      }

      if (!data.supplierId || data.supplierId === 0) {
        throw new Error("Vui lòng chọn nhà cung cấp");
      }

      console.log("API payload:", data);

      const response = isEditMode
        ? await apiRequest("PUT", `https://order-mobile-be.onrender.com/api/purchase-receipts/${id}`, data)
        : await apiRequest("POST", "https://order-mobile-be.onrender.com/api/purchase-receipts", data);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API response:", result);
      return result;
    },
    onSuccess: (response) => {
      console.log("✅ Mutation success:", response);

      // Reset submitting state
      setIsSubmitting(false);

      toast({
        title: "Thành công",
        description: isEditMode
          ? "Phiếu nhập hàng đã được cập nhật thành công"
          : "Phiếu nhập hàng đã được tạo thành công",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/suppliers"] });

      // Navigate back to purchases list
      setTimeout(() => {
        navigate("/purchases");
      }, 1000);
    },
    onError: (error: any) => {
      console.error("❌ Mutation error:", error);

      // Reset submitting state
      setIsSubmitting(false);

      let errorMessage = "Có lỗi xảy ra khi lưu phiếu nhập hàng";

      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always reset submitting state as final fallback
      setIsSubmitting(false);
    },
  });

  // Create new product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "https://order-mobile-be.onrender.com/api/products", data);
      return response.json();
    },
    onSuccess: (newProduct) => {
      toast({
        title: t("common.success"),
        description:
          t("inventory.productCreated") || "Product created successfully",
      });

      // Update products query cache
      queryClient.setQueryData(["https://order-mobile-be.onrender.com/api/products"], (old: any[]) => {
        return [
          ...(old || []),
          { ...newProduct, unitPrice: Number(newProduct.price) || 0 },
        ];
      });

      // Invalidate queries for cache consistency
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/products"] });

      // Add new product to selected items automatically
      addProduct({
        id: newProduct.id,
        name: newProduct.name,
        sku: newProduct.sku,
        stock: newProduct.stock,
        unitPrice: Number(newProduct.price) || 0,
      });

      // Close dialog and reset form
      setIsNewProductDialogOpen(false);
      newProductForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.unexpectedError"),
        variant: "destructive",
      });
    },
  });

  // Handle new product creation
  const handleCreateNewProduct = (data: any) => {
    const payload = {
      name: data.name,
      sku: data.sku || "",
      categoryId: data.categoryId,
      productType: data.productType,
      price: data.price,
      stock: data.stock,
      trackInventory: data.trackInventory,
      isActive: true,
      taxRate: data.taxRate,
    };

    createProductMutation.mutate(payload);
  };

  // Add product to order
  const addProduct = (product: ProductSelectionItem) => {
    const existingIndex = selectedItems.findIndex(
      (item) => item.productId === product.id,
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      updatedItems[existingIndex].total =
        updatedItems[existingIndex].quantity *
        updatedItems[existingIndex].unitPrice;
      setSelectedItems(updatedItems);
    } else {
      // Find first empty row (productId = 0) to replace
      const emptyRowIndex = selectedItems.findIndex(
        (item) => item.productId === 0,
      );

      const newItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        receivedQuantity: 0,
        unitPrice: product.unitPrice || 0,
        total: product.unitPrice || 0,
      };

      if (emptyRowIndex >= 0) {
        // Replace empty row with new product
        const updatedItems = [...selectedItems];
        updatedItems[emptyRowIndex] = newItem;
        setSelectedItems(updatedItems);
      } else {
        // No empty row found, add new item
        setSelectedItems([...selectedItems, newItem]);
      }
    }
    setIsProductDialogOpen(false);
  };

  // Update item quantity, price, or receivedQuantity
  const updateItem = (
    index: number,
    field: keyof (typeof selectedItems)[0],
    value: number | string,
  ) => {
    const updatedItems = [...selectedItems];
    if (field === "productName") {
      updatedItems[index][field] = value as string;
    } else {
      updatedItems[index][field] = value as number;
    }

    // Recalculate total if quantity or unitPrice changes
    if (field === "quantity" || field === "unitPrice") {
      const item = updatedItems[index];
      item.total = item.quantity * item.unitPrice;
    }
    setSelectedItems(updatedItems);
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    fieldType: string,
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();

      // Define field order for navigation
      const fieldOrder = [
        "product",
        "quantity",
        "unitPrice",
        "subtotal",
        "discountPercent",
        "discountAmount",
        "total",
      ];
      const currentFieldIndex = fieldOrder.indexOf(fieldType);

      if (
        fieldType === "total" ||
        currentFieldIndex === fieldOrder.length - 1
      ) {
        // At the last field (total), add new row and focus on product field of new row
        addNewEmptyRow();
        setTimeout(() => {
          const newRowProductInput = document.querySelector(
            `[data-testid="input-product-${index + 1}"]`,
          ) as HTMLInputElement;
          if (newRowProductInput) {
            newRowProductInput.focus();
          }
        }, 100);
      } else {
        // Move to next field in same row
        const nextFieldType = fieldOrder[currentFieldIndex + 1];
        setTimeout(() => {
          const nextInput = document.querySelector(
            `[data-testid="input-${nextFieldType}-${index}"]`,
          ) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
          }
        }, 100);
      }
    }
  };

  // Add new empty row
  const addNewEmptyRow = () => {
    const newEmptyRow = {
      productId: 0,
      productName: "",
      sku: "",
      quantity: 1,
      receivedQuantity: 0,
      unitPrice: 0,
      total: 0,
    };
    setSelectedItems([...selectedItems, newEmptyRow]);
    console.log("➕ Added new empty row, total items:", selectedItems.length + 1);
  };

  // Check if form has valid data for submission
  const hasValidData = () => {
    const formData = form.getValues();
    const hasSupplier = formData.supplierId && formData.supplierId > 0;
    const hasValidItems = selectedItems.some(item =>
      (item.productId > 0 || (item.productName && item.productName.trim() !== "")) &&
      item.quantity > 0 &&
      item.unitPrice >= 0
    );

    console.log("🔍 Form validation check:", {
      hasSupplier,
      hasValidItems,
      supplierValue: formData.supplierId,
      itemsCount: selectedItems.length,
      validItemsCount: selectedItems.filter(item =>
        (item.productId > 0 || (item.productName && item.productName.trim() !== "")) &&
        item.quantity > 0 &&
        item.unitPrice >= 0
      ).length
    });

    return hasSupplier && hasValidItems;
  };

  // Remove item
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0; // No tax applied
  const tax = 0;
  const total = subtotal;

  // File handling functions
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: t("purchases.fileSizeExceeded"),
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t("common.error"),
          description: t("purchases.unsupportedFileType"),
          variant: "destructive",
        });
        return;
      }

      const newFile = {
        fileName: `${Date.now()}_${file.name}`,
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file: file,
        description: "",
      };

      setAttachedFiles((prev) => [...prev, newFile]);
    });
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileDescription = (index: number, description: string) => {
    setAttachedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, description } : file)),
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (fileType === "application/pdf") return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Form submission
  const onSubmit = async (values: z.infer<typeof insertPurchaseReceiptSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("🔍 Form submission values:", values);

      if (selectedItems.length === 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng thêm ít nhất một sản phẩm",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Filter out items that have actual product data
      const validItems = selectedItems.filter(item => {
        // Allow items that have productId OR have productName filled
        const hasProduct = item.productId > 0 || (item.productName && item.productName.trim() !== "");
        const hasValidQuantity = item.quantity > 0;
        const hasValidPrice = item.unitPrice >= 0;

        return hasProduct && hasValidQuantity && hasValidPrice;
      });

      console.log("📋 Item validation result:", {
        totalItems: selectedItems.length,
        validItems: validItems.length,
        details: selectedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isValid: (item.productId > 0 || (item.productName && item.productName.trim() !== "")) &&
                   item.quantity > 0 && item.unitPrice >= 0
        }))
      });

      if (validItems.length === 0) {
        console.log("❌ Validation failed: No valid items");
        toast({
          title: "Lỗi",
          description: "Vui lòng thêm ít nhất một sản phẩm với số lượng và giá hợp lệ",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Auto-generate PO Number if empty
      let finalPONumber = values.receiptNumber?.trim();

      // If receiptNumber is not available, try to use nextPONumber (fetched from query)
      if (!finalPONumber && nextPONumber) {
        finalPONumber = nextPONumber;
        console.log("🔢 Using auto-generated PO number:", finalPONumber);
      }

      // Validate PO Number
      if (!finalPONumber) {
        console.log("❌ Validation failed: No PO number or receipt number");
        toast({
          title: "Lỗi",
          description: "Không thể tạo số phiếu. Vui lòng nhập số phiếu thủ công.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Calculate totals
      const subtotalAmount = validItems.reduce((sum, item) => sum + item.total, 0);

      // Prepare the final data object
      const mutationData = {
        receiptNumber: finalPONumber,
        supplierId: Number(values.supplierId),
        employeeId: values.employeeId ? Number(values.employeeId) : null,
        purchaseDate: values.purchaseDate || null,
        notes: values.notes?.trim() || null,
        subtotal: subtotalAmount.toFixed(2),
        tax: "0.00",
        total: subtotalAmount.toFixed(2),
        items: validItems.map((item) => ({
          productId: item.productId || 0,
          productName: item.productName || "Sản phẩm chưa rõ",
          sku: item.sku || "",
          quantity: item.quantity,
          receivedQuantity: item.receivedQuantity || 0,
          unitPrice: item.unitPrice.toFixed(2),
          total: item.total.toFixed(2),
        })),
      };

      console.log("🚀 Final submission data:", mutationData);

      // Use the existing saveMutation
      await saveMutation.mutateAsync(mutationData);

    } catch (error: any) {
      console.error("❌ Error in form submission:", error);
      setIsSubmitting(false);

      let errorMessage = "Có lỗi xảy ra khi lưu phiếu nhập hàng";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle save as draft (placeholder, as no specific draft logic is implemented yet)
  const handleSaveAsDraft = () => {
    console.log("Saving as draft...");
    // Implement draft saving logic here if needed
  };

  // Custom number formatter for KRW
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  // Show loading screen when fetching existing order
  if (Boolean(id) && isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin phiếu nhập...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/purchases")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {viewOnly
                  ? t("purchases.viewPurchaseOrder")
                  : id
                    ? t("purchases.editPurchaseOrder")
                    : t("purchases.createPurchaseOrder")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {viewOnly
                  ? t("purchases.viewOrderDescription")
                  : id
                    ? t("purchases.editOrderDescription")
                    : t("purchases.createOrderDescription")}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Main Form */}
              <div className="space-y-6">
                {/* Order Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      {t("purchases.orderDetails")}
                    </CardTitle>
                    <CardDescription>
                      {t("purchases.orderDetailsDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Supplier Selection */}
                      <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("purchases.supplier")}</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(parseInt(value))
                              }
                              value={field.value?.toString() || ""}
                              disabled={viewOnly}
                              data-testid="select-supplier"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("purchases.selectSupplier")}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers.map((supplier: any) => (
                                  <SelectItem
                                    key={supplier.id}
                                    value={supplier.id.toString()}
                                  >
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* PO Number */}
                      <FormField
                        control={form.control}
                        name="receiptNumber" // Changed from poNumber to receiptNumber
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số phiếu nhập *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  placeholder={
                                    !isEditMode && isLoadingPONumber
                                      ? "Đang tạo số PO tự động..."
                                      : "Nhập số phiếu hoặc để trống để tự động sinh"
                                  }
                                  disabled={viewOnly}
                                  data-testid="input-receipt-number" // Updated data-testid
                                />
                                {!isEditMode && isLoadingPONumber && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                            {!isEditMode && nextPOError && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Tự động tạo số PO thất bại. Vui lòng nhập thủ
                                công.
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Purchase Date */}
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("purchases.purchaseDate")}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                disabled={viewOnly}
                                data-testid="input-purchase-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Purchase Type */}
                      <FormField
                        control={form.control}
                        name="purchaseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("purchases.purchaseType")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                              disabled={viewOnly}
                              data-testid="select-purchase-type"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "purchases.selectPurchaseType",
                                    )}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="raw_materials">
                                  {t("purchases.rawMaterials")}
                                </SelectItem>
                                <SelectItem value="expenses">
                                  {t("purchases.expenses")}
                                </SelectItem>
                                <SelectItem value="others">
                                  {t("purchases.others")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Employee Assignment */}
                      <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("purchases.assignedTo")}</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(value ? parseInt(value) : null)
                              }
                              value={field.value?.toString() || ""}
                              disabled={viewOnly}
                              data-testid="select-employee"
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("purchases.selectEmployee")}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {employees.map((employee: any) => (
                                  <SelectItem
                                    key={employee.id}
                                    value={employee.id.toString()}
                                  >
                                    {employee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* File Attachments - Balanced with other fields */}
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Đính kèm tệp
                        </FormLabel>
                        <FormControl>
                          <div
                            className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50 h-[42px] flex items-center justify-center"
                            onClick={() =>
                              document.getElementById("file-upload")?.click()
                            }
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add(
                                "border-blue-400",
                                "bg-blue-50",
                              );
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove(
                                "border-blue-400",
                                "bg-blue-50",
                              );
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove(
                                "border-blue-400",
                                "bg-blue-50",
                              );
                              handleFileUpload(e.dataTransfer.files);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Kéo thả hoặc nhấp để tải tệp
                              </span>
                            </div>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e.target.files)}
                            />
                          </div>
                        </FormControl>

                        {/* Files List - Compact and organized */}
                        {attachedFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Tệp đã tải ({attachedFiles.length})
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {attachedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {getFileIcon(file.fileType)}
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="text-xs font-medium text-gray-900 truncate"
                                        title={file.originalFileName}
                                      >
                                        {file.originalFileName}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatFileSize(file.fileSize)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isUploading && (
                          <div className="flex items-center justify-center py-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-xs text-gray-600">
                              Đang tải...
                            </span>
                          </div>
                        )}
                      </FormItem>
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("purchases.notes")}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder={t("purchases.notesPlaceholder")}
                              rows={3}
                              disabled={viewOnly}
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Items Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          {t("purchases.items")} ({selectedItems.length})
                        </CardTitle>
                        <CardDescription>
                          {t("purchases.itemsDescription")}
                        </CardDescription>
                      </div>
                      <Dialog
                        open={isProductDialogOpen}
                        onOpenChange={setIsProductDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <div style={{ display: "none" }}>
                            <Button size="sm" data-testid="button-add-item">
                              <Plus className="h-4 w-4 mr-2" />
                              {t("purchases.addItem")}
                            </Button>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <DialogTitle>
                                  {t("purchases.selectProducts")}
                                </DialogTitle>
                                <DialogDescription>
                                  {t("purchases.selectProductsDescription")}
                                </DialogDescription>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsNewProductDialogOpen(true)}
                                className="flex items-center gap-2"
                                data-testid="button-add-new-product"
                              >
                                <Plus className="h-4 w-4" />
                                {t("inventory.addProduct")}
                              </Button>
                            </div>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                placeholder={t("purchases.searchProducts")}
                                value={productSearch}
                                onChange={(e) =>
                                  setProductSearch(e.target.value)
                                }
                                className="pl-10"
                                data-testid="input-product-search"
                              />
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                              <div className="grid gap-2">
                                {products.map((product: any) => (
                                  <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                    onClick={() => addProduct(product)}
                                    data-testid={`product-${product.id}`}
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {product.name}
                                      </p>
                                      {product.sku && (
                                        <p className="text-sm text-gray-500">
                                          SKU: {product.sku}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">
                                        {formatCurrency(product.unitPrice || 0)}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {t("inventory.stock")}:{" "}
                                        {product.stock || 0}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12 text-center p-2 font-bold">
                                No
                              </TableHead>
                              <TableHead className="min-w-[180px] max-w-[250px] p-2 font-bold">
                                {t("purchases.product")}
                              </TableHead>
                              <TableHead className="w-20 text-center p-2 font-bold">
                                {t("purchases.unit")}
                              </TableHead>
                              <TableHead className="w-24 text-center p-2 font-bold">
                                {t("purchases.quantity")}
                              </TableHead>
                              <TableHead className="w-28 text-center p-2 font-bold">
                                {t("purchases.unitPrice")}
                              </TableHead>
                              <TableHead className="w-28 text-center p-2 font-bold">
                                {t("purchases.subtotalAmount")}
                              </TableHead>
                              <TableHead className="w-20 text-center p-2 font-bold">
                                {t("purchases.discountPercent")}
                              </TableHead>
                              <TableHead className="w-28 text-center p-2 font-bold">
                                {t("purchases.discountAmount")}
                              </TableHead>
                              <TableHead className="w-32 text-center p-2 font-bold">
                                {t("purchases.totalAmount")}
                              </TableHead>
                              {!viewOnly && (
                                <TableHead className="w-20 text-center p-2 font-bold">
                                  {t("purchases.actions")}
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedItems.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={viewOnly ? 9 : 10}
                                  className="text-center py-12 text-gray-500 dark:text-gray-400"
                                >
                                  <div className="flex flex-col items-center">
                                    <Package className="h-12 w-12 mb-3 opacity-50" />
                                    <p className="text-lg font-medium mb-1">
                                      {t("purchases.noItemsSelected")}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {t("purchases.clickAddItemToStart")}
                                    </p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              selectedItems.map((item, index) => {
                                const subtotal = item.quantity * item.unitPrice;
                                const discountPercent =
                                  (item as any).discountPercent || 0;
                                const discountAmount =
                                  subtotal * (discountPercent / 100);
                                const finalTotal = subtotal - discountAmount;

                                return (
                                  <TableRow
                                    key={index}
                                    data-testid={`item-row-${index}`}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                  >
                                    {/* 1. No - Số thứ tự */}
                                    <TableCell className="text-center font-semibold text-gray-600 p-2">
                                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                        {index + 1}
                                      </div>
                                    </TableCell>

                                    {/* 2. Mặt hàng */}
                                    <TableCell className="p-2">
                                      <div className="flex flex-col">
                                        {item.productName ? (
                                          <>
                                            <p className="font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                              {item.productName}
                                            </p>
                                            {item.sku && (
                                              <p className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block w-fit">
                                                SKU: {item.sku}
                                              </p>
                                            )}
                                          </>
                                        ) : (
                                          <Input
                                            placeholder="Tìm kiếm sản phẩm..."
                                            className="w-full text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            disabled={viewOnly}
                                            data-testid={`input-product-${index}`}
                                            onKeyDown={(e) =>
                                              handleKeyDown(e, index, "product")
                                            }
                                            onClick={() => {
                                              if (!viewOnly) {
                                                setIsProductDialogOpen(true);
                                              }
                                            }}
                                            readOnly
                                          />
                                        )}
                                      </div>
                                    </TableCell>

                                    {/* 3. Đơn vị tính */}
                                    <TableCell className="text-center p-2">
                                      <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                                        Cái
                                      </span>
                                    </TableCell>

                                    {/* 4. Số lượng */}
                                    <TableCell className="p-2">
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateItem(
                                            index,
                                            "quantity",
                                            parseInt(e.target.value) || 0,
                                          )
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "quantity")
                                        }
                                        min="1"
                                        className="w-20 text-center text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        data-testid={`input-quantity-${index}`}
                                      />
                                    </TableCell>

                                    {/* 5. Đơn giá */}
                                    <TableCell className="p-2">
                                      <Input
                                        type="text"
                                        value={item.unitPrice.toLocaleString(
                                          "ko-KR",
                                        )}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          updateItem(
                                            index,
                                            "unitPrice",
                                            parseFloat(value) || 0,
                                          );
                                        }}
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "unitPrice")
                                        }
                                        className="w-24 text-right text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-1 focus:ring-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        data-testid={`input-unitPrice-${index}`}
                                      />
                                    </TableCell>

                                    {/* 6. Thành tiền */}
                                    <TableCell className="p-2">
                                      <Input
                                        type="text"
                                        value={subtotal.toLocaleString("ko-KR")}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          const newSubtotal =
                                            parseFloat(value) || 0;
                                          const newUnitPrice =
                                            item.quantity > 0
                                              ? newSubtotal / item.quantity
                                              : 0;
                                          updateItem(
                                            index,
                                            "unitPrice",
                                            newUnitPrice,
                                          );
                                        }}
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "subtotal")
                                        }
                                        className="w-24 text-right font-medium text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-1 focus:ring-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        data-testid={`input-subtotal-${index}`}
                                      />
                                    </TableCell>

                                    {/* 7. % Chiết khấu */}
                                    <TableCell className="p-2">
                                      <Input
                                        type="number"
                                        value={discountPercent}
                                        onChange={(e) => {
                                          const updatedItems = [
                                            ...selectedItems,
                                          ];
                                          (
                                            updatedItems[index] as any
                                          ).discountPercent =
                                            parseFloat(e.target.value) || 0;
                                          setSelectedItems(updatedItems);
                                        }}
                                        onKeyDown={(e) =>
                                          handleKeyDown(
                                            e,
                                            index,
                                            "discountPercent",
                                          )
                                        }
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="w-16 text-center text-sm h-8 border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        data-testid={`input-discountPercent-${index}`}
                                      />
                                    </TableCell>

                                    {/* 8. Chiết khấu */}
                                    <TableCell className="p-2">
                                      <Input
                                        type="text"
                                        value={discountAmount.toLocaleString(
                                          "ko-KR",
                                        )}
                                        onChange={(e) => {
                                          const value = e.target.value.replace(
                                            /[^0-9]/g,
                                            "",
                                          );
                                          const newDiscountAmount =
                                            parseFloat(value) || 0;
                                          const updatedItems = [
                                            ...selectedItems,
                                          ];

                                          // Calculate discount percentage based on manual discount amount input
                                          const newDiscountPercent =
                                            subtotal > 0
                                              ? (newDiscountAmount / subtotal) *
                                                100
                                              : 0;

                                          (
                                            updatedItems[index] as any
                                          ).discountPercent =
                                            newDiscountPercent;
                                          setSelectedItems(updatedItems);
                                        }}
                                        onKeyDown={(e) =>
                                          handleKeyDown(
                                            e,
                                            index,
                                            "discountAmount",
                                          )
                                        }
                                        className="w-24 text-right font-medium text-sm h-8 border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        data-testid={`input-discountAmount-${index}`}
                                      />
                                    </TableCell>

                                    {/* 9. Tổng tiền */}
                                    <TableCell className="text-right font-bold text-green-600 text-sm p-2">
                                      <Input
                                        type="text"
                                        value={finalTotal.toLocaleString(
                                          "ko-KR",
                                        )}
                                        onChange={(e) => {
                                          // This is just for display, actual calculation is done automatically
                                        }}
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "total")
                                        }
                                        className="w-28 text-right font-bold text-green-600 bg-green-50 border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                        disabled={viewOnly}
                                        readOnly
                                        data-testid={`input-total-${index}`}
                                      />
                                    </TableCell>

                                    {/* Actions */}
                                    {!viewOnly && (
                                      <TableCell className="text-center p-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeItem(index)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0 rounded-full"
                                          data-testid={`button-remove-item-${index}`}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })
                            )}

                            {/* Summary Row */}
                            {selectedItems.length > 0 && (
                              <TableRow className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 font-semibold">
                                {/* No */}
                                <TableCell className="text-center p-2">
                                  <div className="flex items-center justify-center w-8 h-8 bg-blue-200 text-blue-800 rounded-full text-xs font-bold">
                                    Σ
                                  </div>
                                </TableCell>

                                {/* Tổng cộng */}
                                <TableCell className="p-2 font-bold text-blue-800">
                                  TỔNG CỘNG
                                </TableCell>

                                {/* Đơn vị tính */}
                                <TableCell className="text-center p-2">
                                  <span className="text-sm text-blue-600">-</span>
                                </TableCell>

                                {/* Tổng số lượng */}
                                <TableCell className="p-2">
                                  <div className="w-20 text-center font-bold text-blue-800 bg-blue-100 border border-blue-300 rounded px-2 py-1">
                                    {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                                  </div>
                                </TableCell>

                                {/* Đơn giá - không hiển thị */}
                                <TableCell className="p-2">
                                  <span className="text-sm text-blue-600">-</span>
                                </TableCell>

                                {/* Tổng thành tiền */}
                                <TableCell className="p-2">
                                  <div className="w-24 text-right font-bold text-blue-800 bg-blue-100 border border-blue-300 rounded px-2 py-1">
                                    {selectedItems.reduce((sum, item) => {
                                      const subtotal = item.quantity * item.unitPrice;
                                      return sum + subtotal;
                                    }, 0).toLocaleString("ko-KR")}
                                  </div>
                                </TableCell>

                                {/* % Chiết khấu - không hiển thị */}
                                <TableCell className="p-2">
                                  <span className="text-sm text-blue-600">-</span>
                                </TableCell>

                                {/* Tổng chiết khấu */}
                                <TableCell className="p-2">
                                  <div className="w-24 text-right font-bold text-red-800 bg-red-100 border border-red-300 rounded px-2 py-1">
                                    {selectedItems.reduce((sum, item) => {
                                      const subtotal = item.quantity * item.unitPrice;
                                      const discountPercent = (item as any).discountPercent || 0;
                                      const discountAmount = subtotal * (discountPercent / 100);
                                      return sum + discountAmount;
                                    }, 0).toLocaleString("ko-KR")}
                                  </div>
                                </TableCell>

                                {/* Tổng tiền cuối cùng */}
                                <TableCell className="p-2">
                                  <div className="w-28 text-right font-bold text-green-800 bg-green-100 border border-green-300 rounded px-2 py-1">
                                    {selectedItems.reduce((sum, item) => {
                                      const subtotal = item.quantity * item.unitPrice;
                                      const discountPercent = (item as any).discountPercent || 0;
                                      const discountAmount = subtotal * (discountPercent / 100);
                                      const finalTotal = subtotal - discountAmount;
                                      return sum + finalTotal;
                                    }, 0).toLocaleString("ko-KR")}
                                  </div>
                                </TableCell>

                                {/* Actions - empty for summary row */}
                                {!viewOnly && (
                                  <TableCell className="text-center p-2">
                                    <span className="text-sm text-blue-600">-</span>
                                  </TableCell>
                                )}
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Actions - Moved below items table */}
                <div className="flex gap-4 justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/purchases")}
                    data-testid="button-cancel"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("common.cancel")}
                  </Button>

                  <Button
                    type="submit"
                    disabled={saveMutation.isPending || isSubmitting || !hasValidData()}
                    className={`${(saveMutation.isPending || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    data-testid="button-submit"
                  >
                    {saveMutation.isPending || isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditMode
                          ? "Cập nhật phiếu nhập"
                          : "Lưu phiếu nhập"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>

        {/* New Product Dialog */}
        <Dialog
          open={isNewProductDialogOpen}
          onOpenChange={setIsNewProductDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("inventory.addProduct")}</DialogTitle>
              <DialogDescription>
                {t("inventory.addProductDescription") ||
                  "Create a new product for your inventory"}
              </DialogDescription>
            </DialogHeader>
            <Form {...newProductForm}>
              <form
                onSubmit={newProductForm.handleSubmit(handleCreateNewProduct)}
                className="space-y-4"
              >
                <FormField
                  control={newProductForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("inventory.productNamePlaceholder") ||
                            "Enter product name"
                          }
                          {...field}
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newProductForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.sku")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            t("inventory.skuPlaceholder") ||
                            "Enter SKU (optional)"
                          }
                          {...field}
                          data-testid="input-product-sku"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newProductForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.category")}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue
                              placeholder={
                                t("inventory.selectCategory") ||
                                "Select category"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: any) => (
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

                <FormField
                  control={newProductForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.unitPrice")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-product-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newProductForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory.currentStock")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          data-testid="input-product-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newProductForm.control}
                  name="trackInventory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>{t("inventory.trackInventory")}</FormLabel>
                        <FormDescription>
                          {t("inventory.trackInventoryDescription") ||
                            "Track stock levels for this product"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-track-inventory"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewProductDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-new-product"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-product"
                  >
                    {createProductMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t("common.creating")}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t("common.create")}
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}