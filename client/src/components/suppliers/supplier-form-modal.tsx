import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import type { Supplier, InsertSupplier } from "@shared/schema";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export function SupplierFormModal({ isOpen, onClose, supplier }: SupplierFormModalProps) {
  const [formData, setFormData] = useState<Partial<InsertSupplier>>({
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxId: "",
    bankAccount: "",
    paymentTerms: "30일",
    status: "active",
    notes: "",
  });

  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const isEdit = !!supplier;

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        code: supplier.code,
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        taxId: supplier.taxId || "",
        bankAccount: supplier.bankAccount || "",
        paymentTerms: supplier.paymentTerms || "30일",
        status: supplier.status as "active" | "inactive",
        notes: supplier.notes || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        taxId: "",
        bankAccount: "",
        paymentTerms: "30일",
        status: "active",
        notes: "",
      });
    }
  }, [supplier, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest('POST', 'https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/suppliers', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/suppliers'] });
      toast({
        title: t("common.successTitle"),
        description: t("suppliers.createSuccess"),
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.errorTitle"),
        description: t("suppliers.createFailed"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertSupplier>) => {
      const response = await apiRequest('PUT', `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/suppliers/${supplier!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/suppliers'] });
      toast({
        title: t("common.successTitle"),
        description: t("suppliers.updateSuccess"),
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.errorTitle"),
        description: t("suppliers.updateFailed"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast({
        title: t('suppliers.validationError'),
        description: t('suppliers.requiredFields'),
        variant: "destructive",
      });
      return;
    }

    if (supplier) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData as InsertSupplier);
    }
  };

  const handleInputChange = (field: keyof InsertSupplier, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
          </DialogTitle>
          <DialogDescription>
            {supplier ? t('suppliers.editDescription') : t('suppliers.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('suppliers.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('suppliers.namePlaceholder')}
                required
              />
            </div>
            <div>
              <Label htmlFor="code">{t('suppliers.code')} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder={t('suppliers.codePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPerson">{t('suppliers.contactPerson')}</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson || ""}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder={t('suppliers.contactPersonPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('suppliers.phone')}</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('suppliers.phonePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">{t('suppliers.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('suppliers.emailPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="taxId">{t('suppliers.taxId')}</Label>
              <Input
                id="taxId"
                value={formData.taxId || ""}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder={t('suppliers.taxIdPlaceholder')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t('suppliers.address')}</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('suppliers.addressPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccount">{t('suppliers.bankAccount')}</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount || ""}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                placeholder={t('suppliers.bankAccountPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">{t('suppliers.paymentTerms')}</Label>
              <Select value={formData.paymentTerms || "30일"} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="현금">{t('suppliers.cash')}</SelectItem>
                  <SelectItem value="15일">15일</SelectItem>
                  <SelectItem value="30일">30일</SelectItem>
                  <SelectItem value="60일">60일</SelectItem>
                  <SelectItem value="90일">90일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">{t('suppliers.status')}</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('suppliers.active')}</SelectItem>
                <SelectItem value="inactive">{t('suppliers.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">{t('suppliers.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('suppliers.notesPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {supplier ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}