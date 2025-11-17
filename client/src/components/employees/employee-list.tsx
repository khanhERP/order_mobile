import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, User, Mail, Phone, Calendar } from "lucide-react";
import { EmployeeFormModal } from "./employee-form-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import type { Employee } from "@shared/schema";

export function EmployeeList() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: employeesData, isLoading } = useQuery<Employee[]>({
    queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees'],
  });

  // Sort employees by ID descending (newest first)
  const employees = employeesData?.sort((a, b) => b.id - a.id);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees'] });
      toast({
        title: t('common.success'),
        description: t('employees.deleteSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('employees.deleteError'),
        variant: "destructive",
      });
    },
  });

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(t('employees.confirmDelete').replace('{{name}}', employee.name))) {
      deleteMutation.mutate(employee.id);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { variant: "destructive" as const },
      manager: { variant: "default" as const },
      cashier: { variant: "secondary" as const },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { variant: "outline" as const };
    const label = t(`employees.roles.${role}` as any) || role;
    return <Badge variant={config.variant}>{label}</Badge>;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('employees.employeeList')}
          </CardTitle>
          <CardDescription>
            {t('employees.currentEmployeeCount').replace('{{count}}', String(employees?.length || 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!employees || employees.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('employees.noEmployeesFound')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('employees.addEmployeeHint')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">{t('employees.employeeId')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('employees.name')}</TableHead>
                    <TableHead className="min-w-[200px]">{t('employees.email')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('employees.phone')}</TableHead>
                    <TableHead className="min-w-[160px]">{t('employees.role')}</TableHead>
                    <TableHead className="min-w-[130px]">{t('employees.hireDate')}</TableHead>
                    <TableHead className="min-w-[140px]">{t('employees.status')}</TableHead>
                    <TableHead className="min-w-[150px]">{t('employees.employeeManagement')}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {employees.map((employee: Employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {employee.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {employee.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {employee.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(employee.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(employee.hireDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? t('employees.active') : t('employees.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(employee)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Modal */}
      {selectedEmployee && (
        <EmployeeFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          mode="edit"
          employee={selectedEmployee}
        />
      )}
    </>
  );
}