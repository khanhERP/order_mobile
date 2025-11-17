import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  type StoreSettings,
  type InsertStoreSettings,
  type Customer,
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Package,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  Home,
  MapPin,
  Phone,
  Mail,
  Save,
  Plus,
  Trash2,
  Edit,
  Search,
  Clock,
  UserCheck,
  Tag,
  ShoppingCart,
  Printer,
  Receipt,
  Upload,
  Link,
  FileImage,
  X,
} from "lucide-react";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { CustomerPointsModal } from "@/components/customers/customer-points-modal";
import { MembershipModal } from "@/components/membership/membership-modal";
import { PointsManagementModal } from "@/components/customers/points-management-modal";
import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { PrinterConfigModal } from "@/components/pos/printer-config-modal";

// E-invoice software providers mapping
const EINVOICE_PROVIDERS = [
  { name: "EasyInvoice", value: "1" },
  { name: "VnInvoice", value: "2" },
  { name: "FptInvoice", value: "3" },
  { name: "MifiInvoice", value: "4" },
  { name: "EHoaDon", value: "5" },
  { name: "BkavInvoice", value: "6" },
  { name: "MInvoice", value: "7" },
  { name: "WinInvoice", value: "9" },
];

interface SettingsPageProps {
  onLogout: () => void;
}

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const { t, currentLanguage } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("store");

  // Printer configuration state
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);

  // Customer management state
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showPointsManagementModal, setShowPointsManagementModal] =
    useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Employee management state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // E-invoice management state
  const [showEInvoiceForm, setShowEInvoiceForm] = useState(false);
  const [editingEInvoice, setEditingEInvoice] = useState<any>(null);
  const [showEInvoiceDeleteDialog, setShowEInvoiceDeleteDialog] =
    useState(false);
  const [eInvoiceToDelete, setEInvoiceToDelete] = useState<any>(null);
  const [eInvoiceForm, setEInvoiceForm] = useState({
    taxCode: "",
    loginId: "",
    password: "",
    softwareName: "",
    loginUrl: "",
    signMethod: "server",
    cqtCode: "level1",
    notes: "",
    isActive: true,
  });
  const [eInvoiceFormErrors, setEInvoiceFormErrors] = useState({
    taxCode: "",
    loginId: "",
    password: "",
    softwareName: "",
    loginUrl: "",
  });

  // Product management state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [showCustomerDeleteDialog, setShowCustomerDeleteDialog] =
    useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [showProductDeleteDialog, setShowProductDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [showEmployeeDeleteDialog, setShowEmployeeDeleteDialog] =
    useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));

        // Handle specific error cases
        if (
          errorData.message &&
          errorData.message.includes("attendance records")
        ) {
          toast({
            title: t("settings.cannotDeleteEmployee"),
            description: t("settings.cannotDeleteEmployeeAttendance"),
            variant: "destructive",
          });
        } else if (errorData.message && errorData.message.includes("orders")) {
          toast({
            title: t("settings.cannotDeleteEmployee"),
            description: t("settings.cannotDeleteEmployeeOrders"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("common.error"),
            description:
              errorData.message || t("settings.employeeDeleteErrorDesc"),
            variant: "destructive",
          });
        }

        setShowEmployeeDeleteDialog(false);
        setEmployeeToDelete(null);
        return;
      }

      await queryClient.refetchQueries({
        queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"],
      });

      toast({
        title: t("settings.employeeDeleteSuccessTitle"),
        description: t("settings.employeeDeleteSuccessDesc"),
      });

      setShowEmployeeDeleteDialog(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Employee delete error:", error);
      toast({
        title: t("settings.genericErrorTitle"),
        description: t("settings.employeeDeleteErrorDesc"),
        variant: "destructive",
      });
    }
  };
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "fas fa-utensils",
  });
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: 0,
    categoryId: "",
    imageUrl: "",
    floor: "1층",
    zone: "전체구역",
    imageInputMethod: "url" as "url" | "file",
    selectedImageFile: null as File | null,
  });

  // Fetch store settings
  const { data: storeData, isLoading } = useQuery<StoreSettings>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings"],
  });

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery<
    Customer[]
  >({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"],
  });

  // Fetch employees
  const { data: employeesRawData, isLoading: employeesLoading } = useQuery<
    any[]
  >({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"],
  });

  // Sort employees by ID descending (newest first)
  const employeesData = employeesRawData?.sort((a, b) => b.id - a.id);

  // Filter employees based on search term
  const filteredEmployees = employeesData
    ? employeesData.filter(
        (employee: any) =>
          employee.name
            .toLowerCase()
            .includes(employeeSearchTerm.toLowerCase()) ||
          employee.employeeId
            .toLowerCase()
            .includes(employeeSearchTerm.toLowerCase()) ||
          (employee.phone && employee.phone.includes(employeeSearchTerm)),
      )
    : [];

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<
    any[]
  >({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"],
  });

  // Fetch products (include inactive products in settings)
  const { data: productsData, isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products", { includeInactive: true }],
    queryFn: async () => {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products?includeInactive=true");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: "EDPOS 레스토랑",
    storeCode: "STORE001",
    address: "서울시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    email: "contact@edpos.com",
    taxId: "123-45-67890",
    businessType: "restaurant",
    pinCode: "",
    openTime: "09:00",
    closeTime: "22:00",
    priceIncludesTax: false,
    defaultFloor: "1", // Added for floor management
    floorPrefix: "층", // Added for floor management
    zonePrefix: "구역", // Added for zone management
    defaultZone: "A", // Added for zone management
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (storeData) {
      setStoreSettings({
        storeName: storeData.storeName || "EDPOS 레스토랑",
        storeCode: storeData.storeCode || "STORE001",
        address: storeData.address || "",
        phone: storeData.phone || "",
        email: storeData.email || "",
        taxId: storeData.taxId || "",
        businessType: storeData.businessType || "restaurant",
        pinCode: storeData.pinCode || "",
        openTime: storeData.openTime || "09:00",
        closeTime: storeData.closeTime || "22:00",
        priceIncludesTax: storeData.priceIncludesTax || false,
        defaultFloor: storeData.defaultFloor || "1",
        floorPrefix: storeData.floorPrefix || "층",
        zonePrefix: storeData.zonePrefix || "구역",
        defaultZone: storeData.defaultZone || "A",
      });
    }
  }, [storeData]);

  // Load payment methods from localStorage on mount
  useEffect(() => {
    const savedPaymentMethods = localStorage.getItem("paymentMethods");
    if (savedPaymentMethods) {
      try {
        const parsed = JSON.parse(savedPaymentMethods);
        setPaymentMethods(parsed);
      } catch (error) {
        console.error("Error parsing saved payment methods:", error);
      }
    }
  }, []);

  // Mutation to update store settings
  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<InsertStoreSettings>) => {
      const response = await apiRequest("PUT", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/store-settings"] });
      toast({
        title: t("common.success"),
        description: t("settings.storeUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.updateError"),
        variant: "destructive",
      });
    },
  });

  // Payment methods state - Vietnamese market localized
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      nameKey: "cash",
      type: "cash",
      enabled: true,
      icon: "💵",
    },
    {
      id: 2,
      nameKey: "creditCard",
      type: "card",
      enabled: false,
      icon: "💳",
    },
    {
      id: 3,
      nameKey: "debitCard",
      type: "debit",
      enabled: false,
      icon: "💳",
    },
    {
      id: 4,
      nameKey: "momo",
      type: "digital",
      enabled: false,
      icon: "📱",
    },
    {
      id: 5,
      nameKey: "zalopay",
      type: "digital",
      enabled: false,
      icon: "📱",
    },
    {
      id: 6,
      nameKey: "vnpay",
      type: "digital",
      enabled: false,
      icon: "💳",
    },
    {
      id: 7,
      nameKey: "qrCode",
      type: "qr",
      enabled: true,
      icon: "📱",
    },
    {
      id: 8,
      nameKey: "shopeepay",
      type: "digital",
      enabled: false,
      icon: "🛒",
    },
    {
      id: 9,
      nameKey: "grabpay",
      type: "digital",
      enabled: false,
      icon: "🚗",
    },
  ]);

  // Payment method editing state
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    icon: "",
  });

  const handleStoreSettingChange = (field: string, value: string | boolean) => {
    setStoreSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveStoreSettings = () => {
    updateStoreSettingsMutation.mutate(storeSettings);
    // Save payment methods to localStorage so other components can access them
    localStorage.setItem("paymentMethods", JSON.stringify(paymentMethods));
  };

  const togglePaymentMethod = (id: number) => {
    const updatedMethods = paymentMethods.map((method) =>
      method.id === id ? { ...method, enabled: !method.enabled } : method,
    );
    setPaymentMethods(updatedMethods);
    // Save to localStorage immediately when toggled
    localStorage.setItem("paymentMethods", JSON.stringify(updatedMethods));
  };

  const addPaymentMethod = () => {
    const newMethod = {
      id: paymentMethods.length + 1,
      nameKey: "newPayment",
      type: "custom",
      enabled: false,
      icon: "💳",
    };
    const updatedMethods = [...paymentMethods, newMethod];
    setPaymentMethods(updatedMethods);
    // Save to localStorage immediately when added
    localStorage.setItem("paymentMethods", JSON.stringify(updatedMethods));
  };

  const removePaymentMethod = (id: number) => {
    const updatedMethods = paymentMethods.filter((method) => method.id !== id);
    setPaymentMethods(updatedMethods);
    // Save to localStorage immediately when removed
    localStorage.setItem("paymentMethods", JSON.stringify(updatedMethods));
  };

  // Payment method management functions
  const handleEditPaymentMethod = (method: any) => {
    setPaymentMethodForm({
      icon: method.icon,
    });
    setEditingPaymentMethod(method);
    setShowPaymentMethodForm(true);
  };

  const handleUpdatePaymentMethod = () => {
    if (!editingPaymentMethod) return;

    const updatedMethods = paymentMethods.map((method) =>
      method.id === editingPaymentMethod.id
        ? {
            ...method,
            icon: paymentMethodForm.icon,
          }
        : method,
    );

    setPaymentMethods(updatedMethods);
    localStorage.setItem("paymentMethods", JSON.stringify(updatedMethods));

    setShowPaymentMethodForm(false);
    setEditingPaymentMethod(null);
    setPaymentMethodForm({ icon: "" });

    toast({
      title: t("settings.paymentUpdateSuccessTitle"),
      description: t("settings.paymentUpdateSuccessDesc"),
    });
  };

  const resetPaymentMethodForm = () => {
    setPaymentMethodForm({ name: "", icon: "" });
    setEditingPaymentMethod(null);
  };

  // Customer management functions
  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (customerId: number, customerName: string) => {
    setCustomerToDelete({ id: customerId, name: customerName });
    setShowCustomerDeleteDialog(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers"] });

      toast({
        title: t("common.success"),
        description: t("settings.customerDeleteSuccess"),
      });

      setShowCustomerDeleteDialog(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Customer delete error:", error);
      toast({
        title: t("common.error"),
        description: t("settings.customerDeleteError"),
        variant: "destructive",
      });
    }
  };

  const handleManagePoints = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPointsModal(true);
  };

  const handleCloseCustomerForm = () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  // Filter customers based on search term
  const filteredCustomers = customersData
    ? customersData.filter(
        (customer: Customer) =>
          customer.name
            .toLowerCase()
            .includes(customerSearchTerm.toLowerCase()) ||
          customer.customerId
            .toLowerCase()
            .includes(customerSearchTerm.toLowerCase()) ||
          (customer.phone && customer.phone.includes(customerSearchTerm)),
      )
    : [];

  // Product management functions
  const resetCategoryForm = () => {
    setCategoryForm({ name: "", icon: "fas fa-utensils" });
    setEditingCategory(null);
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      sku: "",
      price: "",
      stock: 0,
      categoryId: "",
      imageUrl: "",
      floor: "1층",
      zone: "전체구역",
      imageInputMethod: "url",
      selectedImageFile: null,
    });
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: t("common.error"),
        description: t("settings.categoryNameRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Refetch data immediately
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"] });
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });

      toast({
        title: t("common.success"),
        description: t("settings.categoryCreateSuccess"),
      });
      setShowCategoryForm(false);
      resetCategoryForm();
    } catch (error) {
      console.error("Category creation error:", error);
      toast({
        title: t("common.error"),
        description: t("settings.categoryCreateError"),
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: t("common.error"),
        description: t("settings.categoryNameRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!editingCategory) {
      toast({
        title: t("common.error"),
        description: t("settings.categoryNotFound"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Close dialog and reset form
      setShowCategoryForm(false);
      resetCategoryForm();

      // Refetch data immediately
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"] });
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });

      toast({
        title: t("common.success"),
        description: t("settings.categoryUpdateSuccess"),
      });
    } catch (error) {
      console.error("Category update error:", error);
      toast({
        title: t("common.error"),
        description: t("settings.categoryUpdateError"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    // Check if category has products
    const categoryProducts = productsData?.filter(
      (product: any) => product.categoryId === categoryId,
    );

    if (categoryProducts && categoryProducts.length > 0) {
      toast({
        title: t("common.error"),
        description: t("settings.categoryDeleteWithProducts", {
          count: categoryProducts.length,
        }),
        variant: "destructive",
      });
      return;
    }

    // Find category to show in dialog
    const category = categoriesData?.find((c: any) => c.id === categoryId);
    setCategoryToDelete(category);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      // Refetch data immediately
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/categories"] });
      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });

      toast({
        title: t("common.success"),
        description: t("settings.categoryDeleteSuccess"),
      });

      setShowDeleteDialog(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Category delete error:", error);

      let errorMessage = t("settings.categoryDeleteError");
      if (error instanceof Error) {
        if (error.message.includes("products")) {
          errorMessage = t("settings.categoryDeleteErrorWithProducts");
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Helper function to convert file to Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateProduct = async () => {
    try {
      let finalProductData = {
        ...productForm,
        categoryId: parseInt(productForm.categoryId),
        price: productForm.price.toString(),
        stock: Number(productForm.stock),
        floor: productForm.floor, // Add floor
        zone: productForm.zone,   // Add zone
      };

      // Handle file upload if file method is selected
      if (productForm.imageInputMethod === "file" && productForm.selectedImageFile) {
        try {
          const base64Image = await convertFileToBase64(productForm.selectedImageFile);
          finalProductData.imageUrl = base64Image;
        } catch (error) {
          console.error("파일 변환 오류:", error);
          toast({
            title: "오류",
            description: "이미지 파일 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          return;
        }
      } else if (productForm.imageInputMethod === "url") {
        // Ensure imageUrl is set if URL method is selected
        finalProductData.imageUrl = productForm.imageUrl;
      }


      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalProductData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to create product");
      }

      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      setShowProductForm(false);
      resetProductForm();
      toast({
        title: t("common.success"),
        description: t("settings.productCreatedSuccess"),
      });
    } catch (error) {
      console.error("Product creation error:", error);
      toast({
        title: t("common.error"),
        description: (error as Error).message || t("settings.productCreatedError"),
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      let finalProductData = {
        ...productForm,
        categoryId: parseInt(productForm.categoryId),
        price: productForm.price.toString(),
        stock: Number(productForm.stock),
        floor: productForm.floor, // Add floor
        zone: productForm.zone,   // Add zone
      };

      // Handle file upload if file method is selected
      if (productForm.imageInputMethod === "file" && productForm.selectedImageFile) {
        try {
          const base64Image = await convertFileToBase64(productForm.selectedImageFile);
          finalProductData.imageUrl = base64Image;
        } catch (error) {
          console.error("파일 변환 오류:", error);
          toast({
            title: "오류",
            description: "이미지 파일 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          return;
        }
      } else if (productForm.imageInputMethod === "url") {
        // Ensure imageUrl is set if URL method is selected
        finalProductData.imageUrl = productForm.imageUrl;
      }


      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalProductData),
      });

      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to update product");
      }

      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      toast({
        title: t("common.success"),
        description: t("settings.productUpdatedSuccess"),
      });
    } catch (error) {
      console.error("Product update error:", error);
      toast({
        title: t("common.error"),
        description: (error as Error).message || t("settings.productUpdatedError"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (
    productId: number,
    productName: string,
  ) => {
    setProductToDelete({ id: productId, name: productName });
    setShowProductDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await apiRequest("DELETE", `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/${productToDelete.id}`);

      await queryClient.refetchQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });

      toast({
        title: t("common.success"),
        description: t("settings.productDeleteSuccess"),
      });

      setShowProductDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Product delete error:", error);
      toast({
        title: t("settings.genericErrorTitle"),
        description: t("settings.productDeleteError"),
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: any) => {
    setCategoryForm({
      name: category.name || "",
      icon: category.icon || "fas fa-utensils",
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock,
      categoryId: product.categoryId.toString(),
      imageUrl: product.imageUrl || "",
      floor: product.floor || "1층",
      zone: product.zone || "A구역",
      imageInputMethod: (product.imageUrl && product.imageUrl.trim() !== "") ? "url" : "url",
      selectedImageFile: null,
    });
    setShowProductForm(true);
  };

  // Filter products based on category and search term
  const filteredProducts = productsData
    ? productsData.filter((product: any) => {
        const matchesCategory =
          selectedCategoryFilter === "all" ||
          product.categoryId.toString() === selectedCategoryFilter;
        const matchesSearch =
          product.name
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : [];

  // Fetch E-invoice connections
  const { data: eInvoiceConnections = [], isLoading: eInvoiceLoading } =
    useQuery<any[]>({
      queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections"],
    });

  // E-invoice mutations
  const createEInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections"],
      });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceConnectionCreateSuccess"),
      });
      setShowEInvoiceForm(false);
      resetEInvoiceForm();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceConnectionCreateError"),
        variant: "destructive",
      });
    },
  });

  const updateEInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        "PUT",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections"],
      });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceConnectionUpdateSuccess"),
      });
      setShowEInvoiceForm(false);
      resetEInvoiceForm();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceConnectionUpdateError"),
        variant: "destructive",
      });
    },
  });

  const deleteEInvoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections/${id}`,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/einvoice-connections"],
      });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceConnectionDeleteSuccess"),
      });
      setShowEInvoiceDeleteDialog(false);
      setEInvoiceToDelete(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceConnectionDeleteError"),
        variant: "destructive",
      });
    },
  });

  // E-invoice management functions
  const resetEInvoiceForm = () => {
    setEInvoiceForm({
      taxCode: "",
      loginId: "",
      password: "",
      softwareName: "",
      loginUrl: "",
      signMethod: "server",
      cqtCode: "level1",
      notes: "",
      isActive: true,
    });
    setEInvoiceFormErrors({
      taxCode: "",
      loginId: "",
      password: "",
      softwareName: "",
      loginUrl: "",
    });
    setEditingEInvoice(null);
  };

  const validateEInvoiceForm = () => {
    const errors = {
      taxCode: "",
      loginId: "",
      password: "",
      softwareName: "",
      loginUrl: "",
    };

    if (!eInvoiceForm.taxCode.trim()) {
      errors.taxCode = t("settings.taxCodeRequired");
    }

    if (!eInvoiceForm.loginId.trim()) {
      errors.loginId = t("settings.loginIdRequired");
    }

    if (!eInvoiceForm.password.trim()) {
      errors.password = t("settings.passwordRequired");
    }

    if (!eInvoiceForm.softwareName.trim()) {
      errors.softwareName = t("settings.softwareNameRequired");
    }

    if (!eInvoiceForm.loginUrl.trim()) {
      errors.loginUrl = t("settings.loginUrlRequired");
    }

    setEInvoiceFormErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleCreateEInvoice = () => {
    if (!validateEInvoiceForm()) {
      toast({
        title: t("common.error"),
        description: t("common.comboValues.pleaseEnterRequired"),
        variant: "destructive",
      });
      return;
    }

    createEInvoiceMutation.mutate(eInvoiceForm);
  };

  const handleUpdateEInvoice = () => {
    if (!validateEInvoiceForm()) {
      toast({
        title: t("common.error"),
        description: t("common.comboValues.pleaseEnterRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!editingEInvoice) return;

    updateEInvoiceMutation.mutate({
      id: editingEInvoice.id,
      data: eInvoiceForm,
    });
  };

  const handleEditEInvoice = (eInvoice: any) => {
    console.log("Editing E-invoice:", eInvoice);
    setEInvoiceForm({
      taxCode: eInvoice.taxCode || "",
      loginId: eInvoice.loginId || "",
      password: eInvoice.password || "",
      softwareName: eInvoice.softwareName || "",
      loginUrl: eInvoice.loginUrl || "",
      signMethod: eInvoice.signMethod || "server",
      cqtCode: eInvoice.cqtCode || "level1",
      notes: eInvoice.notes === "-" ? "" : eInvoice.notes || "",
      isActive: eInvoice.isActive !== undefined ? eInvoice.isActive : true,
    });
    setEInvoiceFormErrors({
      taxCode: "",
      loginId: "",
      password: "",
      softwareName: "",
      loginUrl: "",
    });
    setEditingEInvoice(eInvoice);
    setShowEInvoiceForm(true);
  };

  const handleDeleteEInvoice = (id: number, softwareName: string) => {
    setEInvoiceToDelete({ id, softwareName });
    setShowEInvoiceDeleteDialog(true);
  };

  const confirmDeleteEInvoice = () => {
    if (!eInvoiceToDelete) return;
    deleteEInvoiceMutation.mutate(eInvoiceToDelete.id);
  };

  const toggleEInvoiceDefault = (id: number) => {
    const connection = eInvoiceConnections.find((conn) => conn.id === id);
    if (!connection) return;

    updateEInvoiceMutation.mutate({
      id,
      data: { ...connection, isDefault: !connection.isDefault },
    });
  };
  // Invoice template management state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showTemplateDeleteDialog, setShowTemplateDeleteDialog] =
    useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    templateNumber: "",
    templateCode: "", // Added templateCode field
    symbol: "",
    useCK: true,
    notes: "",
    isDefault: false,
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      templateNumber: "",
      templateCode: "", // Reset templateCode field
      symbol: "",
      useCK: true,
      notes: "",
      isDefault: false,
    });
    setEditingTemplate(null);
  };

  // Fetch invoice templates
  const { data: invoiceTemplates = [], isLoading: templatesLoading } = useQuery<
    any[]
  >({
    queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates"],
  });

  // Invoice template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates"] });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceTemplateCreateSuccess"),
      });
      setShowTemplateForm(false);
      resetTemplateForm();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceTemplateCreateError"),
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        "PUT",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates"] });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceTemplateUpdateSuccess"),
      });
      setShowTemplateForm(false);
      resetTemplateForm();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceTemplateUpdateError"),
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates/${id}`,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/invoice-templates"] });
      toast({
        title: t("common.success"),
        description: t("settings.einvoiceTemplateDeleteSuccess"),
      });
      setShowTemplateDeleteDialog(false);
      setTemplateToDelete(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.einvoiceTemplateDeleteError"),
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (
      !templateForm.name.trim() ||
      !templateForm.templateNumber.trim() ||
      !templateForm.symbol.trim()
    ) {
      toast({
        title: t("common.error"),
        description: t("settings.requiredFieldsError"),
        variant: "destructive",
      });
      return;
    }

    // If this template is set as default, we need to handle that
    const templateData = {
      ...templateForm,
      name: templateForm.name.trim(),
      templateNumber: templateForm.templateNumber.trim(),
      templateCode: templateForm.templateCode.trim(), // Include templateCode
      symbol: templateForm.symbol.trim(),
      notes: templateForm.notes.trim() || null,
    };

    createTemplateMutation.mutate(templateData);
  };

  const handleUpdateTemplate = () => {
    if (
      !templateForm.name.trim() ||
      !templateForm.templateNumber.trim() ||
      !templateForm.symbol.trim()
    ) {
      toast({
        title: t("common.error"),
        description: t("settings.requiredFieldsError"),
        variant: "destructive",
      });
      return;
    }

    if (!editingTemplate) return;

    const templateData = {
      ...templateForm,
      name: templateForm.name.trim(),
      templateNumber: templateForm.templateNumber.trim(),
      templateCode: templateForm.templateCode.trim(), // Include templateCode
      symbol: templateForm.symbol.trim(),
      notes: templateForm.notes.trim() || null,
    };

    updateTemplateMutation.mutate({
      id: editingTemplate.id,
      data: templateData,
    });
  };

  const handleEditTemplate = (template: any) => {
    setTemplateForm({
      name: template.name || "",
      templateNumber: template.templateNumber || "",
      templateCode: template.templateCode || "", // Set templateCode from template
      symbol: template.symbol || "",
      useCK: template.useCK !== undefined ? template.useCK : true,
      notes: template.notes || "",
      isDefault: template.isDefault !== undefined ? template.isDefault : false,
    });
    setEditingTemplate(template);
    setShowTemplateForm(true);
  };

  const handleDeleteTemplate = (id: number, name: string) => {
    setTemplateToDelete({ id, name });
    setShowTemplateDeleteDialog(true);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    deleteTemplateMutation.mutate(templateToDelete.id);
  };

  const refetchProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });
  };


  return (
    <div className="min-h-screen bg-gray-50 pt-20 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
                           radial-gradient(circle at 75% 25%, #059669 0%, transparent 50%),
                           radial-gradient(circle at 25% 75%, #065f46 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #059669 0%, transparent 50%)`,
            backgroundSize: "100px 100px",
          }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-green-600" />
                {t("settings.title")}
              </h1>
              <p className="text-gray-600">{t("settings.description")}</p>
            </div>
            <Button
              onClick={() => (window.location.href = "/tables")}
              variant="outline"
              className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
            >
              <Home className="w-4 h-4 mr-2" />
              {t("settings.backToPos")}
            </Button>
          </div>
        </div>

        <div className="w-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <div className="w-full overflow-hidden">
              <TabsList className="w-full flex flex-wrap items-center justify-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 min-h-[70px]">
                <TabsTrigger
                  value="store"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium text-center flex-shrink-0"
                >
                  <Store className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">
                    {t("settings.storeInfo")}
                  </span>
                  <span className="lg:hidden">{t("settings.storeInfo")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="customers"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium text-center flex-shrink-0"
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">
                    {t("customers.title")}
                  </span>
                  <span className="lg:hidden">{t("customers.title")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium text-center flex-shrink-0"
                >
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">
                    {t("settings.categories")}
                  </span>
                  <span className="lg:hidden">{t("settings.categories")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="employees"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium text-center flex-shrink-0"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">
                    {t("settings.employees")}
                  </span>
                  <span className="lg:hidden">{t("settings.employees")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium text-center flex-shrink-0"
                >
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden lg:inline">
                    {t("settings.paymentMethods")}
                  </span>
                  <span className="lg:hidden">
                    {t("settings.paymentMethods")}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Store Information Tab */}
            <TabsContent value="store">
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="flex justify-start md:justify-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-2 py-4">
                  <TabsTrigger
                    value="basic"
                    className="flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <Store className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden md:inline">
                      {t("settings.basicInfo")}
                    </span>
                    <span className="md:hidden">
                      {t("settings.basicInfoShort")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="einvoice"
                    className="flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden md:inline">
                      {t("settings.einvoiceSetup")}
                    </span>
                    <span className="md:hidden">
                      {t("settings.einvoiceShort")}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="operations"
                    className="flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-lg font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden md:inline">
                      {t("settings.operations")}
                    </span>
                    <span className="md:hidden">
                      {t("settings.operationsShort")}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-green-600" />
                          {t("settings.basicInfo")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.basicInfoDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="storeName">
                            {t("settings.storeName")}
                          </Label>
                          <Input
                            id="storeName"
                            value={storeSettings.storeName}
                            onChange={(e) =>
                              handleStoreSettingChange(
                                "storeName",
                                e.target.value,
                              )
                            }
                            placeholder={t("settings.storeNamePlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="storeCode">
                            {t("settings.storeCode")}
                          </Label>
                          <Input
                            id="storeCode"
                            value={storeSettings.storeCode}
                            onChange={(e) =>
                              handleStoreSettingChange(
                                "storeCode",
                                e.target.value,
                              )
                            }
                            placeholder={t("settings.storeCodePlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taxId">{t("settings.taxId")}</Label>
                          <Input
                            id="taxId"
                            value={storeSettings.taxId}
                            onChange={(e) =>
                              handleStoreSettingChange("taxId", e.target.value)
                            }
                            placeholder={t("settings.taxIdPlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessType">
                            {t("settings.businessType")}
                          </Label>
                          <Select
                            value={storeSettings.businessType}
                            onValueChange={(value) =>
                              handleStoreSettingChange("businessType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  "settings.businessTypePlaceholder",
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="retail">
                                {t("settings.posRetail")}
                              </SelectItem>
                              <SelectItem value="restaurant">
                                {t("settings.posRestaurant")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pinCode">
                            {t("settings.pinCodeLabel")}
                          </Label>
                          <Input
                            id="pinCode"
                            type="password"
                            value={storeSettings.pinCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
                              handleStoreSettingChange("pinCode", value);
                            }}
                            placeholder={t("settings.pinCodePlaceholder")}
                            maxLength={6}
                            pattern="[0-9]*"
                          />
                          {storeSettings.pinCode &&
                            storeSettings.pinCode.length < 4 && (
                              <p className="text-sm text-orange-500">
                                {t("settings.pinCodeMinLength")}
                              </p>
                            )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="priceIncludesTax"
                              checked={storeSettings.priceIncludesTax || false}
                              onCheckedChange={(checked) =>
                                setStoreSettings((prev) => ({
                                  ...prev,
                                  priceIncludesTax: Boolean(checked),
                                }))
                              }
                            />
                            <Label
                              htmlFor="priceIncludesTax"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("settings.priceIncludesTax")}
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500">
                            {t("settings.priceIncludesTaxDesc")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-600" />
                          {t("settings.contactInfo")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.contactInfoDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">
                            {t("settings.address")}
                          </Label>
                          <Textarea
                            id="address"
                            value={storeSettings.address}
                            onChange={(e) =>
                              handleStoreSettingChange(
                                "address",
                                e.target.value,
                              )
                            }
                            placeholder={t("settings.addressPlaceholder")}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t("settings.phone")}</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={storeSettings.phone}
                            onChange={(e) =>
                              handleStoreSettingChange("phone", e.target.value)
                            }
                            placeholder={t("settings.phonePlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t("settings.email")}</Label>
                          <Input
                            id="email"
                            type="email"
                            value={storeSettings.email}
                            onChange={(e) =>
                              handleStoreSettingChange("email", e.target.value)
                            }
                            placeholder={t("settings.emailPlaceholder")}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={saveStoreSettings}
                      disabled={updateStoreSettingsMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateStoreSettingsMutation.isPending
                        ? t("common.loading")
                        : t("common.save")}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="einvoice">
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-green-600" />
                        {t("settings.einvoiceSetup")}
                      </CardTitle>
                      <CardDescription>
                        {t("settings.einvoiceDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Sub tabs for E-invoice */}
                        <Tabs defaultValue="connections" className="w-full">
                          <TabsList className="grid grid-cols-2 h-10 items-center justify-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1">
                            <TabsTrigger
                              value="connections"
                              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-md font-medium"
                            >
                              <span className="hidden md:inline">
                                {t("settings.connectionManagement")}
                              </span>
                              <span className="md:hidden">
                                {t("settings.connections")}
                              </span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="settings"
                              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-green-100 transition-all duration-200 rounded-md font-medium"
                            >
                              <span className="hidden md:inline">
                                {t("settings.templateManagement")}
                              </span>
                              <span className="md:hidden">
                                {t("settings.templates")}
                              </span>
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="connections" className="mt-6">
                            <div className="flex justify-between items-center mb-6">
                              <div>
                                <h3 className="text-lg font-medium">
                                  {t("settings.connectionsList")}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {t("settings.connectionsDesc")}
                                </p>
                              </div>
                              <Button
                                onClick={() => {
                                  resetEInvoiceForm();
                                  setShowEInvoiceForm(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                {t("settings.addConnection")}
                              </Button>
                            </div>

                            {/* E-invoice connections table */}
                            <div className="w-full overflow-x-auto border rounded-md bg-white">
                              <table className="w-full min-w-[1200px] table-fixed">
                                <thead>
                                  <tr className="bg-gray-50 border-b">
                                    <th className="w-[60px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.symbolLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.taxIdLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.loginIdLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[80px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.passwordLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.softwareLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[180px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.loginUrlLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.signMethodLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.cqtCodeLabel")}
                                      </div>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("common.notes")}
                                      </div>
                                    </th>
                                    <th className="w-[80px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("settings.defaultConnection")}
                                      </div>
                                    </th>
                                    <th className="w-[100px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                      <div className="leading-tight">
                                        {t("common.actions")}
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {eInvoiceConnections.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={11}
                                        className="p-8 text-center text-sm text-gray-500"
                                      >
                                        <div className="flex flex-col items-center gap-2">
                                          <SettingsIcon className="w-8 h-8 text-gray-400" />
                                          <p>
                                            {t("settings.noConnectionsYet")}
                                          </p>
                                          <p className="text-xs">
                                            {t("settings.clickToAddConnection")}
                                          </p>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    eInvoiceConnections.map((connection) => (
                                      <tr
                                        key={connection.id}
                                        className="hover:bg-gray-50"
                                      >
                                        <td className="px-3 py-3 text-center">
                                          <div className="text-sm">
                                            {connection.symbol}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm font-mono truncate"
                                            title={connection.taxCode}
                                          >
                                            {connection.taxCode}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm truncate"
                                            title={connection.loginId}
                                          >
                                            {connection.loginId}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div className="text-sm font-mono">
                                            *********
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {connection.softwareName}
                                          </Badge>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm text-blue-600 hover:underline cursor-pointer truncate"
                                            title={connection.loginUrl}
                                          >
                                            {connection.loginUrl}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm truncate"
                                            title={connection.signMethod}
                                          >
                                            {connection.signMethod}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm truncate"
                                            title={connection.cqtCode}
                                          >
                                            {connection.cqtCode}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3">
                                          <div
                                            className="text-sm truncate"
                                            title={connection.notes || "-"}
                                          >
                                            {connection.notes || "-"}
                                          </div>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                          <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={connection.isDefault}
                                            readOnly
                                          />
                                        </td>
                                        <td className="px-3 py-3">
                                          <div className="flex items-center justify-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                console.log(
                                                  "Edit button clicked for connection:",
                                                  connection,
                                                );
                                                handleEditEInvoice(connection);
                                              }}
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-500 hover:text-red-700"
                                              onClick={() =>
                                                handleDeleteEInvoice(
                                                  connection.id,
                                                  connection.softwareName,
                                                )
                                              }
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </TabsContent>

                          <TabsContent value="settings" className="mt-6">
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-medium">
                                    {t("settings.templateManagement")}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {t("settings.templatesDesc")}
                                  </p>
                                </div>
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    resetTemplateForm();
                                    setShowTemplateForm(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  {t("settings.addTemplate")}
                                </Button>
                              </div>

                              {/* Invoice templates table */}
                              <div className="w-full overflow-x-auto border rounded-md bg-white">
                                <table className="w-full min-w-[1000px] table-fixed">
                                  <thead>
                                    <tr className="bg-gray-50 border-b">
                                      <th className="w-[60px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateIndex")}
                                        </div>
                                      </th>
                                      <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateName")}
                                        </div>
                                      </th>
                                      <th className="w-[130px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateNumber")}
                                        </div>
                                      </th>
                                      <th className="w-[160px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateCode")}
                                        </div>
                                      </th>
                                      <th className="w-[100px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateSymbol")}
                                        </div>
                                      </th>
                                      <th className="w-[120px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateUsage")}
                                        </div>
                                      </th>
                                      <th className="w-[120px] px-3 py-3 text-left font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("common.notes")}
                                        </div>
                                      </th>
                                      <th className="w-[80px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("settings.templateDefault")}
                                        </div>
                                      </th>
                                      <th className="w-[110px] px-3 py-3 text-center font-medium text-sm text-gray-600">
                                        <div className="leading-tight">
                                          {t("common.actions")}
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {templatesLoading ? (
                                      <tr>
                                        <td
                                          colSpan={9}
                                          className="p-8 text-center text-sm text-gray-500"
                                        >
                                          {t("common.comboValues.loadingData")}
                                        </td>
                                      </tr>
                                    ) : invoiceTemplates.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={9}
                                          className="p-8 text-center text-sm text-gray-500"
                                        >
                                          <div className="flex flex-col items-center gap-2">
                                            <SettingsIcon className="w-8 h-8 text-gray-400" />
                                            <p>
                                              {t(
                                                "common.comboValues.noTemplatesFound",
                                              )}
                                            </p>
                                            <p className="text-xs">
                                              {t(
                                                "common.comboValues.clickAddTemplateToStart",
                                              )}
                                            </p>
                                          </div>
                                        </td>
                                      </tr>
                                    ) : (
                                      invoiceTemplates.map(
                                        (template, index) => (
                                          <tr
                                            key={template.id}
                                            className="hover:bg-gray-50"
                                          >
                                            <td className="px-3 py-3 text-center">
                                              <div className="text-sm">
                                                {index + 1}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div
                                                className="text-sm font-medium truncate"
                                                title={template.name}
                                              >
                                                {template.name}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div
                                                className="text-sm truncate"
                                                title={template.templateNumber}
                                              >
                                                {template.templateNumber}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div
                                                className="text-sm truncate"
                                                title={template.templateCode}
                                              >
                                                {template.templateCode || "-"}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div
                                                className="text-sm truncate"
                                                title={template.symbol}
                                              >
                                                {template.symbol}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                              <Badge
                                                variant="default"
                                                className={`text-xs ${template.useCK ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                                              >
                                                {template.useCK
                                                  ? t(
                                                      "settings.usageStatusActive",
                                                    )
                                                  : t(
                                                      "settings.usageStatusInactive",
                                                    )}
                                              </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                              <div
                                                className="text-sm truncate"
                                                title={template.notes || "-"}
                                              >
                                                {template.notes || "-"}
                                              </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                              <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={template.isDefault}
                                                readOnly
                                              />
                                            </td>
                                            <td className="px-3 py-3">
                                              <div className="flex items-center justify-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleEditTemplate(template)
                                                  }
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-red-500 hover:text-red-700"
                                                  onClick={() =>
                                                    handleDeleteTemplate(
                                                      template.id,
                                                      template.name,
                                                    )
                                                  }
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </td>
                                          </tr>
                                        ),
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="operations">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          {t("settings.operationHours")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.operationHoursDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="openTime">
                              {t("settings.openTime")}
                            </Label>
                            <Input
                              id="openTime"
                              type="time"
                              value={storeSettings.openTime}
                              onChange={(e) =>
                                handleStoreSettingChange(
                                  "openTime",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="closeTime">
                              {t("settings.closeTime")}
                            </Label>
                            <Input
                              id="closeTime"
                              type="time"
                              value={storeSettings.closeTime}
                              onChange={(e) =>
                                handleStoreSettingChange(
                                  "closeTime",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Home className="w-5 h-5 text-green-600" />
                          {t("settings.floorZoneManagement")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.floorZoneDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="defaultFloor">
                            {t("settings.defaultFloor")}
                          </Label>
                          <Select
                            value={storeSettings.defaultFloor || "1"}
                            onValueChange={(value) =>
                              handleStoreSettingChange("defaultFloor", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("settings.selectDefaultFloor")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">{t("settings.floor")} 1</SelectItem>
                              <SelectItem value="2">{t("settings.floor")} 2</SelectItem>
                              <SelectItem value="3">{t("settings.floor")} 3</SelectItem>
                              <SelectItem value="4">{t("settings.floor")} 4</SelectItem>
                              <SelectItem value="5">{t("settings.floor")} 5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="defaultZone">
                            {t("settings.defaultZone")}
                          </Label>
                          <Select
                            value={storeSettings.defaultZone || "A"}
                            onValueChange={(value) =>
                              handleStoreSettingChange("defaultZone", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t("settings.selectDefaultZone")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">{t("settings.zoneA")}</SelectItem>
                              <SelectItem value="B">{t("settings.zoneB")}</SelectItem>
                              <SelectItem value="C">{t("settings.zoneC")}</SelectItem>
                              <SelectItem value="D">{t("settings.zoneD")}</SelectItem>
                              <SelectItem value="E">{t("settings.zoneE")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Save button for Floor/Zone settings */}
                        <div className="flex justify-end mt-6">
                          <Button
                            onClick={saveStoreSettings}
                            disabled={updateStoreSettingsMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateStoreSettingsMutation.isPending
                              ? t("common.loading")
                              : t("common.save")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Printer className="w-5 h-5 text-green-600" />
                          {t("settings.printerManagementDesc")}
                        </CardTitle>
                        <CardDescription>
                          {t("settings.printerSetupDesc")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          onClick={() => setShowPrinterConfig(true)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          {t("settings.configurePrinter")}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <div className="space-y-6">
                {/* Customer Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("customers.totalCustomers")}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {customersData ? customersData.length : 0}
                          </p>
                        </div>
                        <UserCheck className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("customers.activeCustomers")}
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {customersData
                              ? customersData.filter(
                                  (c) => c.status === "active",
                                ).length
                              : 0}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("customers.pointsIssued")}
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {customersData
                              ? customersData
                                  .reduce(
                                    (total, c) => total + (c.points || 0),
                                    0,
                                  )
                                  .toLocaleString()
                              : 0}
                          </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("customers.averageSpent")}
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {customersData && customersData.length > 0
                              ? Math.round(
                                  customersData.reduce(
                                    (total, c) =>
                                      total + parseFloat(c.totalSpent || "0"),
                                    0,
                                  ) / customersData.length,
                                ).toLocaleString()
                              : "0"}{" "}
                            ₫
                          </p>
                        </div>
                        <CreditCard className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Customer Management */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      {t("customers.customerManagement")}
                    </CardTitle>
                    <CardDescription>
                      {t("customers.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={t("customers.searchPlaceholder")}
                          className="w-64"
                          value={customerSearchTerm}
                          onChange={(e) =>
                            setCustomerSearchTerm(e.target.value)
                          }
                        />
                        <Button variant="outline" size="sm">
                          <Search className="w-4 h-4 mr-2" />
                          {t("common.search")}
                        </Button>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowCustomerForm(true)}
                      >
                        <Plus classNameName="w-4 h-4 mr-2" />
                        {t("customers.addCustomer")}
                      </Button>
                    </div>

                    {customersLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {t("customers.loadingCustomerData")}
                        </p>
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {t("customers.noRegisteredCustomers")}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <div className="grid grid-cols-8 gap-4 p-4 font-medium text-sm text-gray-600 bg-gray-50 border-b">
                          <div>{t("customers.customerId")}</div>
                          <div>{t("customers.name")}</div>
                          <div>{t("customers.phone")}</div>
                          <div>{t("customers.visitCount")}</div>
                          <div>{t("customers.totalSpent")}</div>
                          <div>{t("customers.points")}</div>
                          <div>{t("customers.membershipLevel")}</div>
                          <div className="text-center">
                            {t("common.actions")}
                          </div>
                        </div>

                        <div className="divide-y">
                          {filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="grid grid-cols-8 gap-4 p-4 items-center"
                            >
                              <div className="font-mono text-sm">
                                {customer.customerId}
                              </div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">
                                {customer.phone || "-"}
                              </div>
                              <div className="text-center">
                                {customer.visitCount || 0}
                              </div>
                              <div className="text-sm font-medium">
                                {parseFloat(
                                  customer.totalSpent || "0",
                                ).toLocaleString()}{" "}
                                ₫
                              </div>
                              <div className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={() => handleManagePoints(customer)}
                                >
                                  {customer.points || 0}P
                                </Button>
                              </div>
                              <div>
                                <Badge
                                  variant="default"
                                  className={`${
                                    customer.membershipLevel === "VIP"
                                      ? "bg-purple-500"
                                      : customer.membershipLevel === "GOLD"
                                        ? "bg-yellow-500"
                                        : customer.membershipLevel === "SILVER"
                                          ? "bg-gray-300 text-black"
                                          : "bg-gray-400"
                                  } text-white`}
                                >
                                  {customer.membershipLevel === "VIP"
                                    ? t("customers.vip")
                                    : customer.membershipLevel === "GOLD"
                                      ? t("customers.gold")
                                      : customer.membershipLevel === "SILVER"
                                        ? t("customers.silver")
                                        : customer.membershipLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCustomer(customer)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={() => handleManagePoints(customer)}
                                >
                                  <CreditCard className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() =>
                                    handleDeleteCustomer(
                                      customer.id,
                                      customer.name,
                                    )
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        {t("customers.total")}{" "}
                        {customersData ? customersData.length : 0}{" "}
                        {t("customers.totalCustomersRegistered")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMembershipModal(true)}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          {t("customers.membershipManagement")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPointsManagementModal(true)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {t("customers.pointsManagement")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Categories Tab - Product Management */}
            <TabsContent value="categories">
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("settings.totalCategories")}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {categoriesData ? categoriesData.length : 0}
                          </p>
                        </div>
                        <Tag className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("settings.totalProducts")}
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {productsData ? productsData.length : 0}
                          </p>
                        </div>
                        <ShoppingCart className="w-8h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {t("settings.totalStockQuantity")}
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {productsData
                              ? productsData.reduce(
                                  (total: number, product: any) =>
                                    total + (product.stock || 0),
                                  0,
                                )
                              : 0}
                          </p>
                        </div>
                        <Package className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Management */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      {t("settings.categoryTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("settings.categoryManagementDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={t(
                            "settings.searchCategoriesPlaceholder",
                          )}
                          className="w-64"
                        />
                        <Button variant="outline" size="sm">
                          <Search className="w-4 h-4 mr-2" />
                          {t("common.search")}
                        </Button>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          resetCategoryForm();
                          setShowCategoryForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("settings.addCategory")}
                      </Button>
                    </div>

                    {categoriesLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t("common.loading")}</p>
                      </div>
                    ) : !categoriesData || categoriesData.length === 0 ? (
                      <div className="text-center py-8">
                        <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {t("settings.noCategories")}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoriesData.map((category: any) => (
                          <Card
                            key={category.id}
                            className="border-2 hover:border-green-300 transition-colors"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {category.icon && (
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                      <span className="text-xl">
                                        {category.icon === "fas fa-utensils"
                                          ? "🍽️"
                                          : category.icon === "fas fa-coffee"
                                            ? "☕"
                                            : category.icon === "fas fa-cookie"
                                              ? "🍪"
                                              : category.icon ===
                                                  "fas fa-ice-cream"
                                                ? "🍨"
                                                : category.icon ===
                                                    "fas fa-beer"
                                                  ? "🍺"
                                                  : category.icon ===
                                                      "fas fa-apple-alt"
                                                    ? "🍎"
                                                    : "🍽️"}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-semibold">
                                      {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {productsData
                                        ? productsData.filter(
                                            (p: any) =>
                                              p.categoryId === category.id,
                                          ).length
                                        : 0}{" "}
                                      {t("settings.productsCount")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() =>
                                      handleDeleteCategory(category.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                {/* Confirm Delete Category Dialog */}
                                <AlertDialog
                                  open={
                                    showDeleteDialog &&
                                    categoryToDelete?.id === category.id
                                  }
                                  onOpenChange={(isOpen) => {
                                    if (!isOpen) {
                                      setShowDeleteDialog(false);
                                      setCategoryToDelete(null);
                                    }
                                  }}
                                >
                                  <AlertDialogContent className="sm:max-w-[425px]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                        <Trash2 className="w-5 h-5" />
                                        {t("common.comboValues.confirmDeleteCategoryTitle")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-left">
                                        <div className="space-y-3">
                                          <p>
                                            {t("common.comboValues.confirmDeleteCategoryDesc", {
                                              name: categoryToDelete?.name,
                                            })}
                                          </p>
                                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                                              <p className="text-sm text-red-700">
                                                {t("common.comboValues.deleteCategoryWarning")}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="text-sm text-gray-600">
                                            {t("common.comboValues.deleteCategoryDetails")}
                                          </p>
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2">
                                      <AlertDialogCancel
                                        onClick={() => {
                                          setShowDeleteDialog(false);
                                          setCategoryToDelete(null);
                                        }}
                                        className="hover:bg-gray-100"
                                      >
                                        {t("common.comboValues.cancelAction")}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteCategory}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {t("common.comboValues.deleteCategoryAction")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Product Management */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                      {t("settings.productTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("settings.productManagementDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={t("settings.productNamePlaceholder")}
                          className="w-64"
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                        />
                        <Select
                          value={selectedCategoryFilter}
                          onValueChange={setSelectedCategoryFilter}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue
                              placeholder={t("settings.selectCategory")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t("settings.allCategories")}
                            </SelectItem>
                            {categoriesData?.map((category: any) => (
                              <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Search className="w-4 h-4 mr-2" />
                          {t("common.search")}
                        </Button>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          resetProductForm();
                          setShowProductForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("settings.addProduct")}
                      </Button>
                    </div>

                    {productsLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t("common.loading")}</p>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {t("settings.noProducts")}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto border rounded-md">
                        <table className="w-full min-w-[1100px] table-fixed">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="w-[200px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.productName")}
                                </div>
                              </th>
                              <th className="w-[120px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.productSku")}
                                </div>
                              </th>
                              <th className="w-[120px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.productCategory")}
                                </div>
                              </th>
                              <th className="w-[120px] px-4 py-3 text-right font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.productPrice")}
                                </div>
                              </th>
                              <th className="w-[80px] px-4 py-3 text-center font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.productStock")}
                                </div>
                              </th>
                              <th className="w-[120px] px-4 py-3 text-center font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("settings.stockStatus")}
                                </div>
                              </th>
                              <th className="w-[140px] px-4 py-3 text-center font-medium text-sm text-gray-600">
                                <div className="leading-tight">
                                  {t("settings.usageStatus")}
                                </div>
                              </th>
                              <th className="w-[120px] px-4 py-3 text-center font-medium text-sm text-gray-600">
                                <div className="leading-tight break-words">
                                  {t("common.actions")}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredProducts.map((product: any) => {
                              const category = categoriesData?.find(
                                (c: any) => c.id === product.categoryId,
                              );
                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3">
                                    <div
                                      className="font-medium max-w-[200px] truncate"
                                      title={product.name}
                                    >
                                      {product.name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div
                                      className="font-mono text-sm truncate"
                                      title={product.sku}
                                    >
                                      {product.sku}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      variant="outline"
                                      className="text-xs max-w-full break-words whitespace-normal leading-tight"
                                    >
                                      <span
                                        className="block max-w-[100px] truncate"
                                        title={category?.name || "N/A"}
                                      >
                                        {category?.name || "N/A"}
                                      </span>
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="font-medium text-sm">
                                      {parseFloat(
                                        product.price || "0",
                                      ).toLocaleString()}{" "}
                                      ₫
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="text-sm">
                                      {product.stock || 0}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge
                                      variant={
                                        product.stock > 0
                                          ? "default"
                                          : "destructive"
                                      }
                                      className={`text-xs ${
                                        product.stock > 0
                                          ? "bg-green-100 text-green-800"
                                          : ""
                                      }`}
                                    >
                                      {product.stock > 0
                                        ? t("common.inStock")
                                        : t("common.outOfStock")}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge
                                      variant={
                                        product.isActive === true ||
                                        product.isActive === 1
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={`text-xs ${
                                        product.isActive === true ||
                                        product.isActive === 1
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {product.isActive === true ||
                                      product.isActive === 1
                                        ? t("settings.yes")
                                        : t("common.no")}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditProduct(product)
                                        }
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() =>
                                          handleDeleteProduct(
                                            product.id,
                                            product.name,
                                          )
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        {t("settings.total")} {filteredProducts.length}{" "}
                        {t("settings.productsShowing")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Employees Tab */}
            <TabsContent value="employees">
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      {t("settings.employeeManagement")}
                    </CardTitle>
                    <CardDescription>
                      {t("settings.employeeManagementDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder={t("employees.searchPlaceholder")}
                          className="w-64"
                          value={employeeSearchTerm}
                          onChange={(e) =>
                            setEmployeeSearchTerm(e.target.value)
                          }
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              // Trigger search when Enter is pressed
                              setEmployeeSearchTerm(e.currentTarget.value);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Force re-render of filtered results
                            setEmployeeSearchTerm(employeeSearchTerm);
                          }}
                        >
                          <Search className="w-4 h-4 mr-2" />
                          {t("common.search")}
                        </Button>
                      </div>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowEmployeeForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("employees.addEmployee")}
                      </Button>
                    </div>

                    {employeesLoading ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          {t("settings.loadingEmployeeData")}
                        </p>
                      </div>
                    ) : !filteredEmployees || filteredEmployees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                          {employeeSearchTerm
                            ? t("employees.noEmployeesFound")
                            : t("employees.noEmployeesRegistered")}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {employeeSearchTerm
                            ? t("employees.noEmployeesFoundDesc")
                            : t("employees.noEmployeesRegisteredDesc")}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto border rounded-md">
                        <table className="w-full min-w-[900px] table-fixed">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="w-[140px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                {t("employees.employeeId")}
                              </th>
                              <th className="w-[180px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                {t("employees.name")}
                              </th>
                              <th className="w-[140px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                {t("employees.role")}
                              </th>
                              <th className="w-[150px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                {t("employees.phone")}
                              </th>
                              <th className="w-[120px] px-4 py-3 text-left font-medium text-sm text-gray-600">
                                {t("employees.status")}
                              </th>
                              <th className="w-[130px] px-4 py-3 text-center font-medium text-sm text-gray-600">
                                {t("common.actions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredEmployees.map((employee: any) => (
                              <tr
                                key={employee.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-4 py-3">
                                  <div
                                    className="font-mono text-sm truncate"
                                    title={employee.employeeId}
                                  >
                                    {employee.employeeId}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div
                                    className="text-sm truncate"
                                    title={employee.name}
                                  >
                                    {employee.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      employee.role === "admin"
                                        ? "destructive"
                                        : employee.role === "manager"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {employee.role === "admin"
                                      ? t("employees.roles.admin")
                                      : employee.role === "manager"
                                        ? t("employees.roles.manager")
                                        : employee.role === "cashier"
                                          ? t("employees.roles.cashier")
                                          : employee.role}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div
                                    className="text-sm text-gray-600 truncate"
                                    title={employee.phone || "-"}
                                  >
                                    {employee.phone || "-"}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={
                                      employee.isActive
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={`text-xs ${
                                      employee.isActive
                                        ? "bg-green-100 text-green-800"
                                        : ""
                                    }`}
                                  >
                                    {employee.isActive
                                      ? t("employees.active")
                                      : t("employees.inactive")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingEmployee(employee);
                                        setShowEmployeeForm(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        setEmployeeToDelete(employee);
                                        setShowEmployeeDeleteDialog(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        {t("employees.totalEmployees")}:{" "}
                        {employeesData ? employeesData.length : 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="payments">
              <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    {t("settings.paymentMethods")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.paymentMethodsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        {t("settings.availablePayments")}
                      </h3>
                      <Button
                        onClick={addPaymentMethod}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("settings.addPayment")}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            method.enabled
                              ? "border-green-200 bg-green-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{method.icon}</span>
                              <span className="font-medium">
                                {t(`settings.payments.${method.nameKey}`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={method.enabled}
                                onCheckedChange={() =>
                                  togglePaymentMethod(method.id)
                                }
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditPaymentMethod(method)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePaymentMethod(method.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Badge
                            variant={method.enabled ? "default" : "secondary"}
                          >
                            {method.enabled
                              ? t("settings.enabled")
                              : t("settings.disabled")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={showCustomerForm}
        onClose={handleCloseCustomerForm}
        customer={editingCustomer}
      />

      {/* Customer Points Modal */}
      {selectedCustomer && (
        <CustomerPointsModal
          open={showPointsModal}
          onOpenChange={setShowPointsModal}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
        />
      )}

      {/* Membership Management Modal */}
      <MembershipModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
      />

      {/* Points Management Modal */}
      <PointsManagementModal
        isOpen={showPointsManagementModal}
        onClose={() => setShowPointsManagementModal(false)}
      />

      {/* Employee Form Modal */}
      <EmployeeFormModal
        isOpen={showEmployeeForm}
        onClose={() => {
          setShowEmployeeForm(false);
          setEditingEmployee(null);
        }}
        mode={editingEmployee ? "edit" : "create"}
        employee={editingEmployee}
      />

      {/* Category Form Modal */}
      <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? t("settings.editCategory")
                : t("settings.addCategory")}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? t("settings.updateCategoryInfo")
                : t("settings.categoryManagementDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryName" className="text-right">
                {t("settings.categoryName")}
              </Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3"
                placeholder={t("settings.categoryNamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryIcon" className="text-right">
                {t("settings.categoryIcon")}
              </Label>
              <Select
                value={categoryForm.icon}
                onValueChange={(value) =>
                  setCategoryForm((prev) => ({ ...prev, icon: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fas fa-utensils">
                    🍽️ {t("settings.categoryIcons.mainDish")}
                  </SelectItem>
                  <SelectItem value="fas fa-coffee">
                    ☕ {t("settings.categoryIcons.beverage")}
                  </SelectItem>
                  <SelectItem value="fas fa-cookie">
                    🍪 {t("settings.categoryIcons.snack")}
                  </SelectItem>
                  <SelectItem value="fas fa-ice-cream">
                    🍨 {t("settings.categoryIcons.dessert")}
                  </SelectItem>
                  <SelectItem value="fas fa-beer">
                    🍺 {t("settings.categoryIcons.alcoholic")}
                  </SelectItem>
                  <SelectItem value="fas fa-apple-alt">
                    🍎 {t("settings.categoryIcons.fruit")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryForm(false);
                resetCategoryForm();
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={
                editingCategory ? handleUpdateCategory : handleCreateCategory
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {editingCategory ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Form Modal */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? t("settings.editProductTitle")
                : t("settings.addProductTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? t("settings.editProductDesc")
                : t("settings.addProductDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productName" className="text-right">
                {t("settings.productName")}
              </Label>
              <Input
                id="productName"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3"
                placeholder={t("settings.productNamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productSku" className="text-right">
                SKU
              </Label>
              <Input
                id="productSku"
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm({ ...productForm, sku: e.target.value })
                }
                className="col-span-3"
                placeholder={t("settings.productSkuPlaceholder")}
                disabled={!!editingProduct}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackInventory" className="text-right">
                {t("settings.trackInventory")}
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="trackInventory"
                  checked={productForm.trackInventory !== false}
                  onCheckedChange={(checked) =>
                    setProductForm({
                      ...productForm,
                      trackInventory: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="trackInventory" className="text-sm">
                  {t("settings.enableInventoryTracking")}
                </Label>
              </div>
            </div>

            {/* Price, Stock, Category, Floor, Zone, Image Upload */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productPrice" className="text-right">
                {t("settings.productPrice")}
              </Label>
              <Input
                id="productPrice"
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="col-span-3"
                placeholder={t("settings.productPricePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productStock" className="text-right">
                {t("settings.productStock")}
              </Label>
              <Input
                id="productStock"
                type="number"
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    stock: parseInt(e.target.value) || 0,
                  }))
                }
                className="col-span-3"
                placeholder={t("settings.productStockPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productCategory" className="text-right">
                {t("settings.productCategory")}
              </Label>
              <Select
                value={productForm.categoryId?.toString() || ""}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("settings.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.map((category: any) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 층과 구역 선택 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productFloor" className="text-right">
                {t("tables.floorLabel")}
              </Label>
              <Select
                value={productForm.floor || "1층"}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, floor: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("tables.floorPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1층">1층</SelectItem>
                  <SelectItem value="2층">2층</SelectItem>
                  <SelectItem value="3층">3층</SelectItem>
                  <SelectItem value="4층">4층</SelectItem>
                  <SelectItem value="5층">5층</SelectItem>
                  <SelectItem value="6층">6층</SelectItem>
                  <SelectItem value="7층">7층</SelectItem>
                  <SelectItem value="8층">8층</SelectItem>
                  <SelectItem value="9층">9층</SelectItem>
                  <SelectItem value="10층">10층</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productZone" className="text-right">
                {t("tables.zoneLabel")}
              </Label>
              <Select
                value={productForm.zone || "전체구역"}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, zone: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("tables.zonePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체구역">
                                {currentLanguage === "ko" ? "전체구역" : 
                                 currentLanguage === "en" ? "All Zones" :
                                 "Tất cả khu vực"}
                              </SelectItem>
                  <SelectItem value="A구역">A구역</SelectItem>
                  <SelectItem value="B구역">B구역</SelectItem>
                  <SelectItem value="C구역">C구역</SelectItem>
                  <SelectItem value="D구역">D구역</SelectItem>
                  <SelectItem value="E구역">E구역</SelectItem>
                  <SelectItem value="F구역">F구역</SelectItem>
                  <SelectItem value="VIP구역">VIP구역</SelectItem>
                  <SelectItem value="테라스구역">테라스구역</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 이미지 입력 방식 선택 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("tables.imageUrlOptional")}
              </Label>
              <div className="col-span-3 space-y-3">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={productForm.imageInputMethod === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProductForm(prev => ({ ...prev, imageInputMethod: "url", selectedImageFile: null }))}
                    className="flex items-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    URL 입력
                  </Button>
                  <Button
                    type="button"
                    variant={productForm.imageInputMethod === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProductForm(prev => ({ ...prev, imageInputMethod: "file", imageUrl: "" }))}
                    className="flex items-center gap-2"
                  >
                    <FileImage className="w-4 h-4" />
                    파일 업로드
                  </Button>
                </div>

                {productForm.imageInputMethod === "url" ? (
                  <Input
                    placeholder={t("tables.imageUrl")}
                    value={productForm.imageUrl || ""}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {productForm.selectedImageFile ? (
                            <>
                              <FileImage className="w-8 h-8 mb-2 text-green-500" />
                              <p className="text-sm text-gray-700 font-medium">
                                {productForm.selectedImageFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(productForm.selectedImageFile.size / 1024).toFixed(1)} KB
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">이미지 파일을 선택하거나</span>
                              </p>
                              <p className="text-xs text-gray-500">드래그엤드롭으로 업로드</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast({
                                  title: "오류",
                                  description: "이미지 크기는 5MB를 초과할 수 없습니다.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setProductForm(prev => ({ ...prev, selectedImageFile: file, imageUrl: "" }));
                            }
                          }}
                        />
                      </label>
                    </div>
                    {productForm.selectedImageFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProductForm(prev => ({ ...prev, selectedImageFile: null }))}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        파일 제거
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductForm(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={
                editingProduct ? handleUpdateProduct : handleCreateProduct
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {editingProduct ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("common.comboValues.confirmDeleteCategoryTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("common.comboValues.confirmDeleteCategoryDesc", {
                    name: categoryToDelete?.name,
                  })}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      {t("common.comboValues.deleteCategoryWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("common.comboValues.deleteCategoryDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setCategoryToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("common.comboValues.cancelAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("common.comboValues.deleteCategoryAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer Delete Confirmation Dialog */}
      <AlertDialog
        open={showCustomerDeleteDialog}
        onOpenChange={setShowCustomerDeleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("common.comboValues.confirmDeleteCustomerTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("common.comboValues.confirmDeleteCustomerDesc", {
                    name: customerToDelete?.name,
                  })}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      {t("common.comboValues.deleteCustomerWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("common.comboValues.deleteCustomerDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowCustomerDeleteDialog(false);
                setCustomerToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("common.comboValues.cancelAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("common.comboValues.deleteCustomerAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Delete Confirmation Dialog */}
      <AlertDialog
        open={showProductDeleteDialog}
        onOpenChange={setShowProductDeleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("settings.confirmDeleteProductTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("settings.confirmDeleteProductDesc")}{" "}
                  <span className="font-semibold text-gray-900">
                    "{productToDelete?.name}"
                  </span>
                  ?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      <strong>{t("common.warning")}:</strong>{" "}
                      {t("settings.deleteProductWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("settings.deleteProductDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowProductDeleteDialog(false);
                setProductToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.deleteProductAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Delete Confirmation Dialog */}
      <AlertDialog
        open={showEmployeeDeleteDialog}
        onOpenChange={setShowEmployeeDeleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("employees.confirmDeleteEmployeeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("employees.confirmDeleteEmployeeDesc", {
                    name: employeeToDelete?.name || "",
                  })}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      {t("employees.deleteEmployeeWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("employees.deleteEmployeeDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowEmployeeDeleteDialog(false);
                setEmployeeToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("employees.cancelAction")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEmployee}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("employees.deleteEmployeeAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* E-invoice Form Modal */}
      <AlertDialog
        open={showEInvoiceDeleteDialog}
        onOpenChange={setShowEInvoiceDeleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("settings.confirmDeleteConnectionTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("settings.confirmDeleteConnectionDesc").replace("{{name}}", eInvoiceToDelete?.softwareName || "")}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      <strong>{t("common.warning")}:</strong>{" "}
                      {t("settings.deleteConnectionWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("settings.deleteConnectionDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowEInvoiceDeleteDialog(false);
                setEInvoiceToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEInvoice}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.deleteConnectionAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* E-invoice Form Modal */}
      <Dialog open={showEInvoiceForm} onOpenChange={setShowEInvoiceForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEInvoice
                ? t("settings.editConnectionTitle")
                : t("settings.addConnectionTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingEInvoice
                ? t("settings.editConnectionDesc")
                : t("settings.addConnectionDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxCode" className="text-right">
                {t("settings.taxIdRequired")} *
              </Label>
              <Input
                id="taxCode"
                value={eInvoiceForm.taxCode}
                onChange={(e) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    taxCode: e.target.value,
                  }))
                }
                className={`col-span-3 ${
                  eInvoiceFormErrors.taxCode ? "border-red-500" : ""
                }`}
                placeholder={t("settings.taxIdPlaceholder")}
              />
              {eInvoiceFormErrors.taxCode && (
                <div className="col-span-4 text-sm text-red-500">
                  {eInvoiceFormErrors.taxCode}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loginId" className="text-right">
                {t("settings.loginIdLabel")} *
              </Label>
              <Input
                id="loginId"
                value={eInvoiceForm.loginId}
                onChange={(e) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    loginId: e.target.value,
                  }))
                }
                className={`col-span-3 ${
                  eInvoiceFormErrors.loginId ? "border-red-500" : ""
                }`}
                placeholder={t("settings.loginIdLabel")}
              />
              {eInvoiceFormErrors.loginId && (
                <div className="col-span-4 text-sm text-red-500">
                  {eInvoiceFormErrors.loginId}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                {t("settings.passwordLabel")} *
              </Label>
              <Input
                id="password"
                type="password"
                value={eInvoiceForm.password}
                onChange={(e) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className={`col-span-3 ${
                  eInvoiceFormErrors.password ? "border-red-500" : ""
                }`}
                placeholder={t("settings.passwordLabel")}
              />
              {eInvoiceFormErrors.password && (
                <div className="col-span-4 text-sm text-red-500">
                  {eInvoiceFormErrors.password}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="softwareName" className="text-right">
                {t("settings.softwareLabel")} *
              </Label>
              <Select
                value={eInvoiceForm.softwareName}
                onValueChange={(value) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    softwareName: value,
                  }))
                }
              >
                <SelectTrigger
                  className={`col-span-3 ${
                    eInvoiceFormErrors.softwareName ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue
                    placeholder={t("settings.selectSoftwarePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {EINVOICE_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.name}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eInvoiceFormErrors.softwareName && (
                <div className="col-span-4 text-sm text-red-500">
                  {eInvoiceFormErrors.softwareName}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loginUrl" className="text-right">
                {t("settings.loginUrlLabel")} *
              </Label>
              <Input
                id="loginUrl"
                value={eInvoiceForm.loginUrl}
                onChange={(e) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    loginUrl: e.target.value,
                  }))
                }
                className={`col-span-3 ${
                  eInvoiceFormErrors.loginUrl ? "border-red-500" : ""
                }`}
                placeholder="https://example.com/login"
              />
              {eInvoiceFormErrors.loginUrl && (
                <div className="col-span-4 text-sm text-red-500">
                  {eInvoiceFormErrors.loginUrl}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="signMethod" className="text-right">
                {t("settings.signMethodLabel")}
              </Label>
              <Select
                value={eInvoiceForm.signMethod}
                onValueChange={(value) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    signMethod: value,
                  }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ký server">
                    {t("settings.signMethodServer")}
                  </SelectItem>
                  <SelectItem value="USB Token">
                    {t("settings.signMethodUsbToken")}
                  </SelectItem>
                  <SelectItem value="HSM">
                    {t("settings.signMethodHsm")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cqtCode" className="text-right">
                {t("settings.cqtCodeLabel")}
              </Label>
              <Select
                value={eInvoiceForm.cqtCode}
                onValueChange={(value) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    cqtCode: value,
                  }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cấp nhật">
                    {t("settings.cqtCodeLevel1")}
                  </SelectItem>
                  <SelectItem value="Cấp hai">
                    {t("settings.cqtCodeLevel2")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                {t("settings.notesLabel")}
              </Label>
              <Textarea
                id="notes"
                value={eInvoiceForm.notes}
                onChange={(e) =>
                  setEInvoiceForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder={t("settings.notesPlaceholder")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">
                {t("settings.defaultConnection")}
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={eInvoiceForm.isActive}
                  onCheckedChange={(checked) =>
                    setEInvoiceForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }
                />
                <Label htmlFor="isDefault" className="text-sm">
                  {t("settings.setAsDefaultConnection")}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEInvoiceForm(false);
                resetEInvoiceForm();
              }}
            >
              {t("settings.cancel")}
            </Button>
            <Button
              onClick={
                editingEInvoice ? handleUpdateEInvoice : handleCreateEInvoice
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {editingEInvoice
                ? t("common.update")
                : t("settings.addConnection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Invoice Template Form Modal */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? t("settings.editTemplateTitle")
                : t("settings.addTemplateTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? t("settings.editTemplateDesc")
                : t("settings.addTemplateDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateName" className="text-right">
                {t("settings.templateNameLabel")}
              </Label>
              <Input
                id="templateName"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3"
                placeholder={t("settings.templateNamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateNumber" className="text-right">
                {t("settings.templateNumberLabel")}
              </Label>
              <Input
                id="templateNumber"
                value={templateForm.templateNumber}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateNumber: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder={t("settings.templateNumberPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="templateCode" className="text-right">
                {t("settings.templateCodeLabel")}
              </Label>
              <Input
                id="templateCode"
                value={templateForm.templateCode}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    templateCode: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder={t("settings.templateCodePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                {t("settings.templateSymbolLabel")}
              </Label>
              <Input
                id="symbol"
                value={templateForm.symbol}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    symbol: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder={t("settings.symbolPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="useCK" className="text-right">
                {t("settings.templateUsage")}
              </Label>
              <Switch
                id="useCK"
                checked={templateForm.useCK}
                onCheckedChange={(checked) =>
                  setTemplateForm((prev) => ({ ...prev, useCK: checked }))
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                {t("common.notes")}
              </Label>
              <Textarea
                id="notes"
                value={templateForm.notes}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="col-span-3"
                rows={3}
                placeholder={t("settings.notesPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDefault" className="text-right">
                {t("settings.templateDefault")}
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={templateForm.isDefault}
                  onCheckedChange={(checked) =>
                    setTemplateForm((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="isDefault" className="text-sm">
                  {t("settings.templateSetDefault")}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplateForm(false);
                resetTemplateForm();
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={
                editingTemplate ? handleUpdateTemplate : handleCreateTemplate
              }
              disabled={
                createTemplateMutation.isPending ||
                updateTemplateMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {createTemplateMutation.isPending ||
              updateTemplateMutation.isPending
                ? editingTemplate
                  ? t("common.updating")
                  : t("common.creating")
                : editingTemplate
                  ? t("common.update")
                  : t("settings.addTemplate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Delete Confirmation Dialog */}
      <AlertDialog
        open={showTemplateDeleteDialog}
        onOpenChange={setShowTemplateDeleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("settings.confirmDeleteTemplateTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  {t("settings.confirmDeleteTemplateDesc", {
                    name: templateToDelete?.name,
                  })}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-red-700">
                      <strong>{t("common.warning")}:</strong>{" "}
                      {t("settings.deleteTemplateWarning")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t("settings.deleteTemplateDetails")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowTemplateDeleteDialog(false);
                setTemplateToDelete(null);
              }}
              className="hover:bg-gray-100"
            >
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("settings.deleteTemplateAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Method Form Modal */}
      <Dialog
        open={showPaymentMethodForm}
        onOpenChange={setShowPaymentMethodForm}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod
                ? t("common.edit") + " " + t("settings.paymentMethods")
                : t("settings.addPayment")}
            </DialogTitle>
            <DialogDescription>
              {editingPaymentMethod
                ? t("common.update") + " " + t("settings.paymentMethods")
                : t("settings.addPayment")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingPaymentMethod && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{t("common.name")}</Label>
                <span className="col-span-3 text-sm text-gray-600">
                  {t(`settings.payments.${editingPaymentMethod.nameKey}`)}
                </span>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentMethodIcon" className="text-right">
                {t("common.icon")}
              </Label>
              <Input
                id="paymentMethodIcon"
                value={paymentMethodForm.icon}
                onChange={(e) =>
                  setPaymentMethodForm((prev) => ({
                    ...prev,
                    icon: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="💳"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentMethodForm(false);
                resetPaymentMethodForm();
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpdatePaymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              {t("common.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printer Configuration Modal */}
      {showPrinterConfig && (
        <PrinterConfigModal
          isOpen={showPrinterConfig}
          onClose={() => setShowPrinterConfig(false)}
        />
      )}
    </div>
  );
}