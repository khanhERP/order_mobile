
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import type { Customer, InsertCustomer } from "@shared/schema";
import { z } from "zod";

const customerFormSchema = z.object({
  customerId: z.string().optional(),
  name: z.string().min(1, "이름은 필수입니다"),
  phone: z.string().optional(),
  email: z.string().optional().refine((email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
    message: "올바른 이메일 형식이 아닙니다"
  }),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  membershipLevel: z.enum(["Silver", "Gold", "VIP"]).optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerFormModal({ isOpen, onClose, customer }: CustomerFormModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Generate customer ID for new customers
  const generateCustomerId = async () => {
    try {
      const response = await apiRequest("GET", "https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers/next-id");
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error("Error generating customer ID:", error);
      // Fallback to CUST001 if API fails
      return "CUST001";
    }
  };

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: customer?.customerId || "",
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      dateOfBirth: customer?.dateOfBirth || "",
      membershipLevel: customer?.membershipLevel || "Silver",
      notes: customer?.notes || "",
      status: customer?.status || "active",
    },
  });

  // Reset form when customer changes and auto-generate ID for new customers
  useEffect(() => {
    if (customer) {
      form.reset({
        customerId: customer.customerId,
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        dateOfBirth: customer.dateOfBirth || "",
        membershipLevel: customer.membershipLevel || "Silver",
        notes: customer.notes || "",
        status: customer.status || "active",
      });
    } else {
      // Auto-generate customer ID for new customers
      generateCustomerId().then((nextId) => {
        form.reset({
          customerId: nextId,
          name: "",
          phone: "",
          email: "",
          address: "",
          dateOfBirth: "",
          membershipLevel: "Silver",
          notes: "",
          status: "active",
        });
      });
    }
  }, [customer, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await apiRequest("POST", "https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers"] });
      toast({
        title: t('common.success'),
        description: customer ? "고객 정보가 업데이트되었습니다." : "새 고객이 추가되었습니다.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "고객 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await apiRequest("PUT", `https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers/${customer!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers"] });
      toast({
        title: t('common.success'),
        description: "고객 정보가 업데이트되었습니다.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "고객 정보 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    // Clean up empty strings to null/undefined for optional fields
    const cleanData = {
      ...data,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      notes: data.notes || undefined,
      customerId: data.customerId || undefined,
    };

    if (customer) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? t('customers.editCustomer') : t('customers.addCustomer')}</DialogTitle>
          <DialogDescription>
            {customer ? t('customers.customerFormDesc') : t('customers.customerFormDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.customerId')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={customer ? t('customers.customerId') : t('common.autoGenerated')} 
                        disabled={true}
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.name')} *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('customers.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('customers.phonePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.email')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder={t('customers.emailPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customers.address')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('customers.addressPlaceholder')} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.birthday')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="membershipLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('customers.membershipLevel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.select')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Silver">{t('customers.silver')}</SelectItem>
                        <SelectItem value="Gold">{t('customers.gold')}</SelectItem>
                        <SelectItem value="VIP">{t('customers.vip')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('customers.status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t('common.active')}</SelectItem>
                      <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.notes')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder={t('common.notesPlaceholder')} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {customer ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
