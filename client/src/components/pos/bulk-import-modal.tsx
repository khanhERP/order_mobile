import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  X,
  Upload,
  Download,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import * as XLSX from "xlsx";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductRow {
  name: string;
  sku: string;
  price: string;
  stock: number;
  categoryId: number;
  imageUrl?: string;
  taxRate?: string;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<ProductRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorResults, setErrorResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const bulkCreateMutation = useMutation({
    mutationFn: async (products: ProductRow[]) => {
      const response = await fetch("https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to bulk create products");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("=== BULK IMPORT SUCCESS RESPONSE ===");
      console.log("Full response data:", JSON.stringify(data, null, 2));
      console.log("Success count:", data.success);
      console.log("Error count:", data.errors);
      console.log("Results array:", data.results);

      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/products"] });

      if (data.errors > 0) {
        console.log("=== ERRORS FOUND ===");
        const errorItems = data.results?.filter((r) => !r.success) || [];
        setErrorResults(errorItems);

        errorItems.forEach((item, index) => {
          console.log(`Error ${index + 1}:`, item.error);
          console.log(`Data:`, item.data);
        });

        // Check if there are SKU duplicate errors
        const skuErrors = errorItems.filter(
          (item) => item.error && item.error.includes("already exists"),
        );

        let errorDescription =
          data.message ||
          `${data.success} sản phẩm thành công, ${data.errors} sản phẩm lỗi`;

        if (skuErrors.length > 0) {
          errorDescription += `\nCó ${skuErrors.length} sản phẩm bị trùng mã SKU`;
        }

        // Automatically download error report
        setTimeout(() => {
          downloadErrorReport(errorItems);
        }, 500);

        toast({
          title: "Hoàn thành với lỗi",
          description:
            errorDescription + "\nFile báo cáo lỗi đã được tải xuống tự động",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Thành công",
          description:
            data.message || `Đã nhập ${data.success} sản phẩm thành công`,
        });
      }
      handleClose();
    },
    onError: (error) => {
      console.log("=== BULK IMPORT ERROR ===");
      console.log("Error object:", error);
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);

      toast({
        title: "Lỗi",
        description: error.message || "Không thể nhập sản phẩm hàng loạt",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row and process data
        const rows = jsonData.slice(1) as any[][];
        const validProducts: ProductRow[] = [];
        const newErrors: string[] = [];

        rows.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because we skipped header and arrays are 0-indexed

          if (
            !row[0] ||
            !row[1] ||
            !row[2] ||
            row[3] === undefined ||
            row[4] === undefined ||
            !row[5]
          ) {
            newErrors.push(`Dòng ${rowNumber}: ${t('pos.missingRequiredInfo')}`);
            return;
          }

          const product: ProductRow = {
            name: row[0]?.toString().trim(),
            sku: row[1]?.toString().trim(),
            price: row[2]?.toString().trim(),
            taxRate: row[3]?.toString().trim() || "8.00",
            stock: parseInt(row[4]?.toString()) || 0,
            categoryId: parseInt(row[5]?.toString()) || 0,
            imageUrl: row[6]?.toString().trim() || "",
          };

          // Validate data
          if (!product.name) {
            newErrors.push(
              `Dòng ${rowNumber}: ${t('pos.productNameRequired')}`,
            );
          }
          if (!product.sku) {
            newErrors.push(`Dòng ${rowNumber}: ${t('pos.skuRequired')}`);
          }
          if (isNaN(parseFloat(product.price))) {
            newErrors.push(`Dòng ${rowNumber}: ${t('pos.invalidPrice')}`);
          }
          if (product.categoryId <= 0) {
            newErrors.push(`Dòng ${rowNumber}: ${t('pos.invalidCategoryId')}`);
          }
          if (product.taxRate && (isNaN(parseFloat(product.taxRate)) || parseFloat(product.taxRate) < 0 || parseFloat(product.taxRate) > 100)) {
            newErrors.push(`Dòng ${rowNumber}: ${t('pos.invalidTaxRate')}`);
          }

          // Check for duplicate SKU within the imported data
          const skuExists = validProducts.some((p) => p.sku === product.sku);
          if (skuExists) {
            newErrors.push(
              `Dòng ${rowNumber}: SKU "${product.sku}" ${t('pos.duplicateSku')}`,
            );
          }

          if (
            newErrors.length === 0 ||
            newErrors.filter((e) => e.includes(`Dòng ${rowNumber}`)).length ===
              0
          ) {
            validProducts.push(product);
          }
        });

        setPreview(validProducts);
        setErrors(newErrors);
      } catch (error) {
        setErrors([
          t('pos.cannotReadFile'),
        ]);
      }
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      bulkCreateMutation.mutate(preview);
    }
  };

  const handleClose = () => {
    setPreview([]);
    setErrors([]);
    setErrorResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      [
        "Tên sản phẩm",
        "SKU", 
        "Giá",
        "% Thuế",
        "Số lượng",
        "Category ID",
        "Hình ảnh (URL)",
      ],
      ["Cà phê đen", "COFFEE-001", "25000", "8.00", "100", "1", ""],
      ["Bánh mì", "FOOD-001", "15000", "8.00", "50", "2", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "product_import_template.xlsx");
  };

  const downloadErrorReport = (errorResults: any[]) => {
    const errorData = [
      [
        "Tên sản phẩm",
        "SKU",
        "Giá",
        "% Thuế",
        "Số lượng",
        "Category ID",
        "Hình ảnh (URL)",
        "Lỗi chi tiết",
      ],
    ];

    errorResults.forEach((result) => {
      if (!result.success && result.data) {
        errorData.push([
          result.data.name || "",
          result.data.sku || "",
          result.data.price || "",
          result.data.taxRate || "",
          result.data.stock || "",
          result.data.categoryId || "",
          result.data.imageUrl || "",
          result.error || "Lỗi không xác định",
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(errorData);

    // Auto-fit column widths
    const colWidths = [
      { wch: 20 }, // Tên sản phẩm
      { wch: 15 }, // SKU
      { wch: 10 }, // Giá
      { wch: 10 }, // % Thuế
      { wch: 10 }, // Số lượng
      { wch: 12 }, // Category ID
      { wch: 30 }, // Hình ảnh URL
      { wch: 40 }, // Lỗi chi tiết
    ];
    ws["!cols"] = colWidths;

    // Style header row
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "DC2626" } },
        alignment: { horizontal: "center" },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lỗi Import");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    XLSX.writeFile(wb, `product_import_errors_${timestamp}.xlsx`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {t('pos.bulkImportTitle')}
            {/* <Button variant="ghost" size="sm" onClick={handleClose}>
              <X size={20} />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t('pos.bulkImportInstructions')}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>{t('pos.downloadTemplate')}</li>
              <li>{t('pos.fillProductInfo')}</li>
              <li>{t('pos.uploadAndPreview')}</li>
              <li>{t('pos.clickImportToComplete')}</li>
            </ol>
          </div>

          {/* Download template and upload */}
          <div className="flex space-x-4">
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2" size={16} />
              {t('pos.downloadTemplateButton')}
            </Button>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="mr-2" size={16} />
                {isProcessing ? t('pos.processing') : t('pos.selectExcelFile')}
              </Button>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="mr-2 text-red-500" size={16} />
                <h3 className="font-medium text-red-700">
                  {t('pos.dataErrors')}
                </h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Report Info */}
          {errorResults.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center mb-2">
                <AlertCircle className="mr-2 text-red-500" size={16} />
                <h3 className="font-medium text-red-700">
                  {t('common.count')} {errorResults.length}{t('pos.productsWithErrors')}
                </h3>
              </div>
              <p className="text-sm text-red-600">
                {t('pos.errorReportDownloaded')}
              </p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="font-medium mb-4">
                {t('pos.dataPreview')} ({preview.length}{t('pos.productsCount')}):
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-2 px-3">{t('pos.productName')}</th>
                      <th className="text-left py-2 px-3">{t('pos.sku')}</th>
                      <th className="text-left py-2 px-3">{t('pos.price')}</th>
                      <th className="text-left py-2 px-3">% {t('pos.taxRate')}</th>
                      <th className="text-left py-2 px-3">{t('pos.quantity')}</th>
                      <th className="text-left py-2 px-3">Category ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {preview.slice(0, 10).map((product, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2 px-3">{product.name}</td>
                        <td className="py-2 px-3">{product.sku}</td>
                        <td className="py-2 px-3">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(parseFloat(product.price))}
                        </td>
                        <td className="py-2 px-3">{product.taxRate || "8.00"}%</td>
                        <td className="py-2 px-3">{product.stock}</td>
                        <td className="py-2 px-3">{product.categoryId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="p-2 text-center text-gray-500 text-sm">
                    ... và {preview.length - 10} sản phẩm khác
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {preview.length > 0 && errors.length === 0 && (
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                {t('pos.cancel')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={bulkCreateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
              >
                {bulkCreateMutation.isPending
                  ? t('pos.importing')
                  : `${t('pos.importProducts')} ${preview.length}${t('pos.productsCount')}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
