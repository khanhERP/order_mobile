import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { CreditCard, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

const pointUpdateSchema = z.object({
  points: z.number().min(1, 'Points must be at least 1'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['earned', 'redeemed', 'adjusted']),
});

type PointUpdateForm = z.infer<typeof pointUpdateSchema>;

interface CustomerPointsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
}

interface PointTransaction {
  id: number;
  customerId: number;
  type: 'earned' | 'redeemed' | 'adjusted' | 'expired';
  points: number;
  description: string;
  orderId?: number;
  employeeId?: number;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

export function CustomerPointsModal({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerPointsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'update' | 'history'>('overview');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<PointUpdateForm>({
    resolver: zodResolver(pointUpdateSchema),
    defaultValues: {
      points: 0,
      description: '',
      type: 'earned',
    },
  });

  // Fetch customer points
  const { data: pointsData, isLoading: pointsLoading } = useQuery({
    queryKey: ['customer-points', customerId],
    queryFn: async () => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/customers/${customerId}/points`);
      if (!response.ok) throw new Error('Failed to fetch customer points');
      return response.json();
    },
    enabled: open && !!customerId,
  });

  // Fetch point history
  const { data: pointHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['customer-point-history', customerId],
    queryFn: async () => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/customers/${customerId}/point-history`);
      if (!response.ok) throw new Error('Failed to fetch point history');
      return response.json();
    },
    enabled: open && !!customerId,
  });

  // Update points mutation
  const updatePointsMutation = useMutation({
    mutationFn: async (data: PointUpdateForm) => {
      const response = await fetch(`https://order-mobile-be.onrender.com/api/customers/${customerId}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update points');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer-points', customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-point-history', customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['https://order-mobile-be.onrender.com/api/customers'],
      });
      toast({
        title: t("common.success"),
        description: t("customers.pointsUpdated"),
      });
      form.reset();
      setActiveTab('overview');
    },
    onError: (error: any) => {
      toast({
        title: t("customers.pointsUpdateFailed"),
        description: error.message || t("customers.pointsUpdateError"),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PointUpdateForm) => {
    updatePointsMutation.mutate(data);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'redeemed':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjusted':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600';
      case 'redeemed':
        return 'text-red-600';
      case 'adjusted':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earned':
        return t("customers.earned");
      case 'redeemed':
        return t("customers.redeemed");
      case 'adjusted':
        return t("customers.adjusted");
      case 'expired':
        return t("customers.expired");
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {customerName} - {t("customers.pointManagement")}
          </DialogTitle>
          <DialogDescription>
            {t("customers.pointManagementDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t("customers.pointOverview")}
          </button>
          <button
            onClick={() => setActiveTab('update')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'update'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t("customers.updatePoints")}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t("customers.pointHistory")}
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("customers.currentPoints")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pointsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-green-600">
                      {(pointsData?.points || 0).toLocaleString()} P
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions Preview */}
              {pointHistory && pointHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("customers.recentPointHistory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pointHistory.slice(0, 5).map((transaction: PointTransaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()} P
                            </div>
                            <div className="text-sm text-gray-500">
                              {t("customers.balance")}: {transaction.newBalance.toLocaleString()} P
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pointHistory.length > 5 && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('history')}
                        >
                          {t("customers.viewAllHistory")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'update' && (
            <Card>
              <CardHeader>
                <CardTitle>{t("customers.updatePoints")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("customers.transactionType")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("customers.selectTransactionType")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="earned">{t("customers.earned")}</SelectItem>
                              <SelectItem value="redeemed">{t("customers.redeemed")}</SelectItem>
                              <SelectItem value="adjusted">{t("customers.adjusted")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("customers.points")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t("customers.enterPoints")}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("customers.reason")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("customers.enterReason")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={updatePointsMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updatePointsMutation.isPending ? t("common.processing") : t("customers.processPoints")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        {t("common.reset")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>{t("customers.pointHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : pointHistory && pointHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointHistory.map((transaction: PointTransaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {getTypeLabel(transaction.type)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()} P
                          </div>
                          <div className="text-sm text-gray-500">
                            {t("customers.previousBalance")}: {transaction.previousBalance.toLocaleString()} P
                          </div>
                          <div className="text-sm font-medium">
                            {t("customers.balance")}: {transaction.newBalance.toLocaleString()} P
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t("customers.noPointHistory")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}