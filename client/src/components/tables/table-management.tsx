import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Users, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import type { Table as TableType } from "@shared/schema";
import { z } from "zod";

// We'll create the schema inside the component to access translations
const createTableFormSchema = (t: any) =>
  z.object({
    tableNumber: z.string().min(1, t("tables.tableNumberRequired")),
    capacity: z.number().min(1, t("tables.capacityMinimum")),
    status: z.enum(["available", "occupied", "reserved", "maintenance"]),
    floor: z.string().min(1, "층 정보는 필수입니다"),
    zone: z.string().min(1, "구역 정보는 필수입니다"),
    qrCode: z.string().optional(),
  });

type TableFormData = {
  tableNumber: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  floor: string;
  zone: string;
  qrCode?: string;
};

export function TableManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderForPayment, setOrderForPayment] = useState<any | null>(null);
  const [orderForEInvoice, setOrderForEInvoice] = useState<any>(null);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [pointsPaymentOpen, setPointsPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [mixedPaymentOpen, setMixedPaymentOpen] = useState(false);
  const [mixedPaymentData, setMixedPaymentData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<any>(null);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/tables"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const tableFormSchema = createTableFormSchema(t);

  const form = useForm<TableFormData>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      tableNumber: "",
      capacity: 1,
      status: "available",
      floor: "1층",
      zone: "A구역",
      qrCode: "",
    },
  });

  const createTableMutation = useMutation({
    mutationFn: (data: TableFormData) =>
      apiRequest("POST", "https://order-mobile-be.onrender.com/api/tables", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables"] });
      toast({
        title: t("common.success"),
        description: t("tables.tableCreateSuccess"),
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TableFormData }) =>
      apiRequest("PUT", `https://order-mobile-be.onrender.com/api/tables/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables"] });
      toast({
        title: t("common.success"),
        description: t("tables.tableUpdateSuccess"),
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("tables.tableUpdateError"),
        variant: "destructive",
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `https://order-mobile-be.onrender.com/api/tables/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/tables"] });
      toast({
        title: t("common.success"),
        description: t("tables.tableDeleteSuccess"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("tables.tableDeleteError"),
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (table?: TableType) => {
    if (table) {
      setEditingTable(table);
      form.reset({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status as
          | "available"
          | "occupied"
          | "reserved"
          | "maintenance",
        floor: table.floor || "1층",
        zone: (table as any).zone || "A구역",
        qrCode: table.qrCode || "",
      });
    } else {
      setEditingTable(null);
      form.reset({
        tableNumber: "",
        capacity: 1,
        status: "available",
        floor: "1층",
        zone: "A구역",
        qrCode: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTable(null);
    form.reset();
  };

  const onSubmit = (data: TableFormData) => {
    if (editingTable) {
      updateTableMutation.mutate({ id: editingTable.id, data });
    } else {
      createTableMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(t("tables.confirmDelete"))) {
      deleteTableMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t("tables.available"), variant: "default" as const },
      occupied: {
        label: t("tables.occupied"),
        variant: "destructive" as const,
      },
      reserved: { label: t("tables.reserved"), variant: "secondary" as const },
      maintenance: {
        label: t("tables.outOfService"),
        variant: "outline" as const,
      },
    };

    return (
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.available
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t("tables.tableSettings")}
          </h2>
          <p className="text-gray-600">{t("tables.tableSettingsDesc")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          {t("tables.addTable")}
        </Button>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("tables.tableList")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tables.tableNumberLabel")}</TableHead>
                <TableHead>{t("tables.floorLabel")}</TableHead>
                <TableHead>{t("tables.zoneLabel")}</TableHead>
                <TableHead>{t("tables.capacityLabel")}</TableHead>
                <TableHead>{t("tables.statusLabel")}</TableHead>
                <TableHead>{t("tables.qrCodeLabel")}</TableHead>
                <TableHead>{t("tables.createdDate")}</TableHead>
                <TableHead>{t("tables.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables && (tables as TableType[]).length > 0 ? (
                (tables as TableType[]).map((table: TableType) => {
                  const statusConfig = getStatusBadge(table.status);
                  return (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">
                        {table.tableNumber}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-blue-600">
                          {table.floor || "1층"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-green-600">
                          {(table as any).zone || "A구역"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {table.capacity} {t("orders.people")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {table.qrCode ? (
                          <div className="flex items-center gap-1">
                            <QrCode className="w-4 h-4" />
                            <span className="text-xs">
                              {table.qrCode.substring(0, 10)}...
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {t("tables.none")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(table.createdAt).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(table)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(table.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    {t("tables.noTables")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? t("tables.editTable") : t("tables.addTable")}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? t("tables.editTableDesc")
                : t("tables.addTableDesc")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.tableNumberLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("tables.tableNumberPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.capacityLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.floorLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("tables.floorPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.zoneLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("tables.zonePlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.statusLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("tables.statusPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">
                          {t("tables.available")}
                        </SelectItem>
                        <SelectItem value="occupied">
                          {t("tables.occupied")}
                        </SelectItem>
                        <SelectItem value="reserved">
                          {t("tables.reserved")}
                        </SelectItem>
                        <SelectItem value="maintenance">
                          {t("tables.outOfService")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qrCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tables.qrCodeLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("tables.qrCodePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTableMutation.isPending ||
                    updateTableMutation.isPending
                  }
                >
                  {createTableMutation.isPending ||
                  updateTableMutation.isPending
                    ? t("common.loading")
                    : editingTable
                      ? t("common.edit")
                      : t("common.add")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}