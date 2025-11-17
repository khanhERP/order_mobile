import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  insertEmployeeSchema,
  type Employee,
  type InsertEmployee,
} from "@shared/schema";
import { useTranslation } from "@/lib/i18n";
import { z } from "zod";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  employee?: Employee;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  mode,
  employee,
}: EmployeeFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Create translated validation schema
  const translatedEmployeeSchema = z.object({
    employeeId: z.string().min(1, t("employees.employeeIdRequired")),
    name: z.string().min(1, t("employees.nameRequired")),
    email: z.string().email(t("employees.emailInvalid")).optional().or(z.literal("")),
    phone: z.string().nullable(),
    role: z.enum(["admin", "manager", "cashier", "kitchen", "server"]),
    isActive: z.boolean(),
    hireDate: z.date(),
  });

  // Generate employee ID for new employees
  const generateEmployeeId = async () => {
    try {
      const response = await apiRequest("GET", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees/next-id");
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error("Error generating employee ID:", error);
      // Fallback to EMP-001 if API fails
      return "EMP-001";
    }
  };

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(translatedEmployeeSchema),
    defaultValues: {
      employeeId: "",
      name: "",
      email: "",
      phone: null,
      role: "cashier",
      isActive: true,
      hireDate: new Date(),
    },
  });

  // Set employee ID for new employees or populate form for edit
  React.useEffect(() => {
    if (mode === "create" && !employee?.employeeId) {
      generateEmployeeId().then((nextId) => {
        form.reset({
          employeeId: nextId,
          name: "",
          email: "",
          phone: null,
          role: "cashier",
          isActive: true,
          hireDate: new Date(),
        });
      });
    } else if (mode === "edit" && employee) {
      form.reset({
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email || "",
        phone: employee.phone || null,
        role: employee.role,
        isActive: employee.isActive ?? true,
        hireDate: employee.hireDate ? new Date(employee.hireDate) : new Date(),
      });
    }
  }, [mode, employee, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest("POST", "https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"] });
      toast({
        title: t("common.successTitle"),
        description: t("employees.addEmployeeSuccess"),
      });
      onClose();
      generateEmployeeId().then((nextId) => {
        form.reset({
          employeeId: nextId,
          name: "",
          email: "",
          phone: null,
          role: "cashier",
          isActive: true,
          hireDate: new Date(),
        });
      });
    },
    onError: (error: any) => {
      let errorMessage = t("employees.addEmployeeError");
      // Checking for the error in the expected format
      if (error instanceof Error && error.message) {
        const errorData = JSON.parse(
          error.message.slice(error.message.indexOf("{")),
        ); // Extract JSON part of the message
        if (errorData.code === "DUPLICATE_EMAIL") {
          errorMessage = t("employees.emailAlreadyExists");
          // Set error on the email field
          form.setError("email", {
            type: "manual",
            message: t("employees.emailAlreadyInSystem"),
          });
        }
      }
      toast({
        title: t("common.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest(
        "PUT",
        `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees/${employee?.id}`,
        data,
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees"] });
      toast({
        title: t("common.successTitle"),
        description: t("employees.updateEmployeeSuccess"),
      });
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = t("employees.updateEmployeeError");

      // Parse error similar to createMutation
      if (error && typeof error === 'object' && error.code === "DUPLICATE_EMAIL") {
        errorMessage = t("employees.emailAlreadyExists");
        form.setError("email", {
          type: "manual",
          message: t("employees.emailAlreadyInSystem"),
        });
      }

      toast({
        title: t("common.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("employees.addEmployee")
              : t("employees.editEmployee")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("employees.employeeFormDesc")
              : t("employees.employeeFormDesc")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.employeeId")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EMP001"
                      {...field}
                      readOnly={true}
                      className="bg-gray-100"
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
                  <FormLabel>
                    {t("employees.name")}{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("employees.namePlaceholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("employees.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="hong@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="010-1234-5678"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employees.role")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("employees.selectRole")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cashier">
                        {t("employees.roles.cashier")}
                      </SelectItem>
                      <SelectItem value="manager">
                        {t("employees.roles.manager")}
                      </SelectItem>
                      <SelectItem value="admin">
                        {t("employees.roles.admin")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? t("employees.saving")
                  : mode === "create"
                    ? t("employees.add")
                    : t("employees.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}