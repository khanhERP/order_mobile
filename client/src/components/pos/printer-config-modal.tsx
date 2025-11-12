import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Printer,
  Plus,
  Trash2,
  TestTube,
  Wifi,
  Usb,
  Bluetooth,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrinterConfig {
  id: number;
  name: string;
  printerType: string;
  connectionType: string;
  ipAddress?: string;
  port?: number | null;
  macAddress?: string;
  isEmployee: boolean;
  isKitchen: boolean;
  isActive: boolean;
}

export function PrinterConfigModal({
  isOpen,
  onClose,
}: PrinterConfigModalProps) {
  const { t } = useTranslation();
  const [selectedConfig, setSelectedConfig] = useState<PrinterConfig | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    name: "",
    printerType: "thermal",
    connectionType: "usb",
    ipAddress: "",
    port: null,
    macAddress: "",
    isEmployee: false,
    isKitchen: false,
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch printer configurations
  const { data: printerConfigs = [], isLoading } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "https://order-mobile-be.onrender.com/api/printer-configs");
      return response.json();
    },
    enabled: isOpen,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch fresh data
  });

  // Create printer config mutation
  const createConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      const response = await apiRequest(
        "POST",
        "https://order-mobile-be.onrender.com/api/printer-configs",
        configData,
      );
      return response.json();
    },
    onSuccess: () => {
      // Force refetch data
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      toast({ title: "Thành công", description: "Đã thêm cấu hình máy in" });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thêm cấu hình máy in",
        variant: "destructive",
      });
    },
  });

  // Update printer config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(
        "PUT",
        `https://order-mobile-be.onrender.com/api/printer-configs/${id}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      // Force refetch data
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật cấu hình máy in",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cấu hình máy in",
        variant: "destructive",
      });
    },
  });

  // Delete printer config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `https://order-mobile-be.onrender.com/api/printer-configs/${id}`);
    },
    onSuccess: () => {
      // Force refetch data
      queryClient.invalidateQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      queryClient.refetchQueries({ queryKey: ["https://order-mobile-be.onrender.com/api/printer-configs"] });
      toast({ title: "Thành công", description: "Đã xóa cấu hình máy in" });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa cấu hình máy in",
        variant: "destructive",
      });
    },
  });

  // Test printer connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `https://order-mobile-be.onrender.com/api/printer-configs/${id}/test`,
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Kết nối thành công" : "Kết nối thất bại",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể kiểm tra kết nối",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      printerType: "thermal",
      connectionType: "usb",
      ipAddress: "",
      port: null,
      macAddress: "",
      isEmployee: false,
      isKitchen: false,
      isActive: true,
    });
    setSelectedConfig(null);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that only one printer can be active for each type
    if (formData.isActive && (formData.isEmployee || formData.isKitchen)) {
      const activeEmployeePrinter = printerConfigs.find(
        (p) =>
          p.isEmployee &&
          p.isActive &&
          (!selectedConfig || p.id !== selectedConfig.id),
      );
      const activeKitchenPrinter = printerConfigs.find(
        (p) =>
          p.isKitchen &&
          p.isActive &&
          (!selectedConfig || p.id !== selectedConfig.id),
      );

      if (formData.isEmployee && activeEmployeePrinter) {
        toast({
          title: "Lỗi",
          description: `Đã có máy in nhân viên đang hoạt động: ${activeEmployeePrinter.name}. Vui lòng tắt máy in đó trước.`,
          variant: "destructive",
        });
        return;
      }

      if (formData.isKitchen && activeKitchenPrinter) {
        toast({
          title: "Lỗi",
          description: `Đã có máy in bếp đang hoạt động: ${activeKitchenPrinter.name}. Vui lòng tắt máy in đó trước.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (selectedConfig) {
      updateConfigMutation.mutate({ id: selectedConfig.id, data: formData });
    } else {
      createConfigMutation.mutate(formData);
    }
  };

  const handleEdit = (config: PrinterConfig) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      printerType: config.printerType,
      connectionType: config.connectionType,
      ipAddress: config.ipAddress || "",
      port: config.port || null,
      macAddress: config.macAddress || "",
      isEmployee: config.isEmployee,
      isKitchen: config.isKitchen,
      isActive: config.isActive,
    });
    setIsEditing(true);
  };

  const handleToggleStatus = (config: PrinterConfig, newStatus: boolean) => {
    // If turning on this printer, check if we need to turn off others
    if (newStatus && (config.isEmployee || config.isKitchen)) {
      const conflictingPrinter = printerConfigs.find(
        (p) =>
          p.id !== config.id &&
          p.isActive &&
          ((config.isEmployee && p.isEmployee) ||
            (config.isKitchen && p.isKitchen)),
      );

      if (conflictingPrinter) {
        const printerType = config.isEmployee ? "nhân viên" : "bếp";
        toast({
          title: "Thông báo",
          description: `Sẽ tự động tắt máy in ${printerType} khác: ${conflictingPrinter.name}`,
        });

        // Turn off the conflicting printer first
        const conflictingUpdateData = {
          name: conflictingPrinter.name,
          printerType: conflictingPrinter.printerType,
          connectionType: conflictingPrinter.connectionType,
          ipAddress: conflictingPrinter.ipAddress,
          port: conflictingPrinter.port,
          macAddress: conflictingPrinter.macAddress,
          paperWidth: conflictingPrinter.paperWidth,
          printSpeed: conflictingPrinter.printSpeed,
          isEmployee: conflictingPrinter.isEmployee,
          isKitchen: conflictingPrinter.isKitchen,
          isActive: false,
        };

        updateConfigMutation.mutate({
          id: conflictingPrinter.id,
          data: conflictingUpdateData,
        });
      }
    }

    // Update the current printer status - only send necessary fields
    const updateData = {
      name: config.name,
      printerType: config.printerType,
      connectionType: config.connectionType,
      ipAddress: config.ipAddress,
      port: config.port,
      macAddress: config.macAddress,
      paperWidth: config.paperWidth,
      printSpeed: config.printSpeed,
      isEmployee: config.isEmployee,
      isKitchen: config.isKitchen,
      isActive: newStatus,
    };

    updateConfigMutation.mutate({
      id: config.id,
      data: updateData,
    });
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case "network":
        return <Wifi className="h-4 w-4" />;
      case "bluetooth":
        return <Bluetooth className="h-4 w-4" />;
      default:
        return <Usb className="h-4 w-4" />;
    }
  };

  // Calculate pagination
  const totalItems = printerConfigs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedConfigs = printerConfigs.slice(startIndex, endIndex);

  // Reset page when configs change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalItems, totalPages, currentPage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {t("pos.printerConfiguration")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Printer Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {isEditing ? t("pos.editPrinter") : t("pos.addNewPrinter")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("pos.printerName")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="VD: Máy in quầy 1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="printerType">{t("pos.printerType")}</Label>
                  <Select
                    value={formData.printerType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, printerType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal">
                        {t("pos.thermal")}
                      </SelectItem>
                      <SelectItem value="inkjet">{t("pos.inkjet")}</SelectItem>
                      <SelectItem value="laser">{t("pos.laser")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="connectionType">
                    {t("pos.connectionType")}
                  </Label>
                  <Select
                    value={formData.connectionType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, connectionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usb">USB</SelectItem>
                      <SelectItem value="network">
                        {t("pos.network")}
                      </SelectItem>
                      <SelectItem value="bluetooth">
                        {t("pos.bluetooth")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.connectionType === "network" && (
                  <>
                    <div>
                      <Label htmlFor="ipAddress">{t("pos.ipAddress")}</Label>
                      <Input
                        id="ipAddress"
                        value={formData.ipAddress}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ipAddress: e.target.value,
                          })
                        }
                        placeholder="192.168.1.100"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">{t("pos.port")}</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            port: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {formData.connectionType === "bluetooth" && (
                  <div>
                    <Label htmlFor="macAddress">{t("pos.macAddress")}</Label>
                    <Input
                      id="macAddress"
                      value={formData.macAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, macAddress: e.target.value })
                      }
                      placeholder="00:11:22:33:44:55"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEmployee"
                    checked={formData.isEmployee}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isEmployee: checked })
                    }
                  />
                  <Label htmlFor="isEmployee">{t("pos.employeePrinter")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isKitchen"
                    checked={formData.isKitchen}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isKitchen: checked })
                    }
                  />
                  <Label htmlFor="isKitchen">{t("pos.kitchenPrinter")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">{t("pos.inUse")}</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={
                      createConfigMutation.isPending ||
                      updateConfigMutation.isPending
                    }
                    className="flex-1"
                  >
                    {isEditing ? t("pos.update") : t("pos.addNew")}
                  </Button>
                  {isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {t("pos.cancel")}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Printer List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("pos.printerList")}</span>
                {totalItems > 0 && (
                  <span className="text-sm text-gray-500">
                    ({totalItems} {t("pos.printers")})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">{t("pos.loading")}</div>
              ) : printerConfigs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Printer className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("pos.noPrinterConfigs")}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedConfigs.map((config: PrinterConfig) => (
                      <div
                        key={config.id}
                        className={`border rounded-lg p-3 ${!config.isActive ? "opacity-60 bg-gray-50" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getConnectionIcon(config.connectionType)}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {config.name}
                                {!config.isActive && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {t("pos.off")}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {config.printerType} - {config.connectionType}
                                {config.connectionType === "network" &&
                                  config.ipAddress && (
                                    <span>
                                      {" "}
                                      ({config.ipAddress}:
                                      {config.port || "auto"})
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {config.isEmployee && config.isActive && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {t("pos.employee")}
                              </span>
                            )}
                            {config.isKitchen && config.isActive && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {t("pos.kitchen")}
                              </span>
                            )}
                            {config.isActive && (
                              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                {t("pos.using")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                testConnectionMutation.mutate(config.id)
                              }
                              disabled={testConnectionMutation.isPending}
                            >
                              <TestTube className="h-3 w-3 mr-1" />
                              {t("pos.test")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(config)}
                            >
                              {t("pos.edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteConfigMutation.mutate(config.id)
                              }
                              disabled={deleteConfigMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <Switch
                            checked={config.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(config, checked)
                            }
                            disabled={updateConfigMutation.isPending}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        {t("common.showing")} {startIndex + 1}-
                        {Math.min(endIndex, totalItems)} {t("common.of")}{" "}
                        {totalItems} {t("pos.printers")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t("common.previous")}
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <Button
                              key={i + 1}
                              variant={
                                currentPage === i + 1 ? "default" : "outline"
                              }
                              size="sm"
                              className="min-w-[40px]"
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          {t("common.next")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("pos.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
