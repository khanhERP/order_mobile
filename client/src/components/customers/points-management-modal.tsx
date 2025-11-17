import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { type Customer } from "@shared/schema";
import { 
  CreditCard, 
  Plus, 
  Minus, 
  History, 
  Search,
  Calculator,
  Gift,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  X,
  Save
} from "lucide-react";

interface PointsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PointTransaction {
  id: number;
  customerId: number;
  points: number;
  type: 'earned' | 'redeemed' | 'adjusted' | 'expired';
  description: string;
  createdAt: string;
}

export function PointsManagementModal({ isOpen, onClose }: PointsManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  // State for point operations
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [operationType, setOperationType] = useState<'add' | 'subtract' | 'set'>('add');
  const [activeTab, setActiveTab] = useState('management');

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers'],
    enabled: isOpen,
  });

  // Fetch point transactions history
  const { data: pointTransactions, isLoading: transactionsLoading } = useQuery<PointTransaction[]>({
    queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/point-transactions'],
    enabled: isOpen && activeTab === 'history',
  });

  // Point adjustment mutation
  const adjustPointsMutation = useMutation({
    mutationFn: async ({ customerId, points, type, description }: { 
      customerId: number; 
      points: number; 
      type: string; 
      description: string 
    }) => {
      const response = await apiRequest('POST', 'https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers/adjust-points', {
        customerId,
        points,
        type,
        description
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/point-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-points', selectedCustomer?.id] });
      toast({
        title: t("customers.customerUpdated"),
        description: t("customers.pointsManagementDesc"),
      });
      setPointsAmount('');
      setAdjustmentReason('');
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("customers.customerError"),
        variant: 'destructive',
      });
    },
  });

  // Point payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ customerId, points }: { customerId: number; points: number }) => {
      const response = await apiRequest('POST', 'https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers/redeem-points', {
        customerId,
        points
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['https://9c3c35f0-d45a-4ce8-ac45-ec905101bbe5-00-iqc6atklkasw.pike.replit.dev/api/point-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer-points', selectedCustomer?.id] });
      toast({
        title: t("common.success"),
        description: t("customers.processPayment"),
      });
      setPointsAmount('');
      setSelectedCustomer(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("customers.customerError"),
        variant: 'destructive',
      });
    },
  });

  const handlePointsAdjustment = () => {
    if (!selectedCustomer || !pointsAmount || !adjustmentReason) {
      toast({
        title: t("common.error"),
        description: t("customers.customerFormDesc"),
        variant: 'destructive',
      });
      return;
    }

    const points = parseInt(pointsAmount);
    const currentPoints = selectedCustomer.points || 0;
    
    let finalPoints = points;
    let type = 'adjusted';
    
    if (operationType === 'add') {
      finalPoints = points;
      type = 'earned';
    } else if (operationType === 'subtract') {
      finalPoints = -points;
      type = 'redeemed';
    } else if (operationType === 'set') {
      finalPoints = points - currentPoints;
      type = 'adjusted';
    }

    adjustPointsMutation.mutate({
      customerId: selectedCustomer.id,
      points: finalPoints,
      type,
      description: adjustmentReason
    });
  };

  const handlePointsPayment = () => {
    if (!selectedCustomer || !pointsAmount) {
      toast({
        title: t("common.error"),
        description: t("customers.customerSelection"),
        variant: 'destructive',
      });
      return;
    }

    const points = parseInt(pointsAmount);
    const currentPoints = selectedCustomer.points || 0;
    
    if (points > currentPoints) {
      toast({
        title: t("customers.insufficientPoints"),
        description: t("customers.insufficientPoints"),
        variant: 'destructive',
      });
      return;
    }

    processPaymentMutation.mutate({
      customerId: selectedCustomer.id,
      points
    });
  };

  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return customer.name?.toLowerCase().includes(searchLower) ||
           customer.customerId?.toLowerCase().includes(searchLower) ||
           customer.phone?.toLowerCase().includes(searchLower);
  }) || [];

  const totalPoints = customers?.reduce((sum, customer) => sum + (customer.points || 0), 0) || 0;
  const avgPoints = customers?.length ? Math.round(totalPoints / customers.length) : 0;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            {t("customers.pointsManagementTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("customers.pointsManagementDesc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="management">{t("customers.pointsAdjustment")}</TabsTrigger>
            <TabsTrigger value="payment">{t("customers.pointsPayment")}</TabsTrigger>
            <TabsTrigger value="history">{t("customers.history")}</TabsTrigger>
          </TabsList>

          {/* Points Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("customers.totalPoints")}</p>
                    <p className="text-2xl font-bold text-blue-600">{totalPoints.toLocaleString()}P</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("customers.averagePoints")}</p>
                    <p className="text-2xl font-bold text-green-600">{avgPoints.toLocaleString()}P</p>
                  </div>
                  <Calculator className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t("customers.total")} {t("customers.customers")}</p>
                    <p className="text-2xl font-bold text-purple-600">{customers?.length || 0}{t("customers.customers")}</p>
                  </div>
                  <Gift className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  {t("customers.pointsEditTitle")}
                </CardTitle>
                <CardDescription>{t("customers.pointsEditDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <Label>{t("customers.customerSelection")}</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder={t("customers.searchCustomers")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="max-h-64 overflow-y-auto border rounded-md">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${
                              selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.customerId}</p>
                              </div>
                              <Badge variant="outline">
                                {(customer.points || 0).toLocaleString()}P
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Point Adjustment */}
                  <div className="space-y-4">
                    <Label>{t("customers.pointsAdjustment")}</Label>
                    {selectedCustomer && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-gray-600">{t("customers.currentPoints")}: {(selectedCustomer.points || 0).toLocaleString()}P</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <Label>{t("customers.adjustmentType")}</Label>
                        <Select value={operationType} onValueChange={(value: 'add' | 'subtract' | 'set') => setOperationType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">{t("customers.addPoints")}</SelectItem>
                            <SelectItem value="subtract">{t("customers.subtractPoints")}</SelectItem>
                            <SelectItem value="set">{t("customers.setPoints")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>
                          {operationType === 'add' ? t("customers.pointsToAdd") : 
                           operationType === 'subtract' ? t("customers.pointsToSubtract") : 
                           t("customers.pointsToSet")}
                        </Label>
                        <Input
                          type="number"
                          placeholder={t("customers.pointsToUsePlaceholder")}
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>{t("customers.adjustmentReason")}</Label>
                        <Textarea
                          placeholder={t("customers.adjustmentReasonPlaceholder")}
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                        />
                      </div>

                      <Button 
                        onClick={handlePointsAdjustment}
                        className="w-full"
                        disabled={!selectedCustomer || !pointsAmount || !adjustmentReason || adjustPointsMutation.isPending}
                      >
                        {adjustPointsMutation.isPending ? t("customers.processing") : 
                         operationType === 'add' ? <Plus className="w-4 h-4 mr-2" /> : 
                         operationType === 'subtract' ? <Minus className="w-4 h-4 mr-2" /> : 
                         <Calculator className="w-4 h-4 mr-2" />}
                        {operationType === 'add' ? t("customers.addPoints") : 
                         operationType === 'subtract' ? t("customers.subtractPoints") : 
                         t("customers.setPoints")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  {t("customers.pointsPaymentTitle")}
                </CardTitle>
                <CardDescription>{t("customers.pointsPaymentDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Selection for Payment */}
                  <div className="space-y-4">
                    <Label>{t("customers.paymentCustomerSelection")}</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder={t("customers.searchCustomers")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="max-h-64 overflow-y-auto border rounded-md">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${
                              selectedCustomer?.id === customer.id ? 'bg-green-50 border-green-200' : ''
                            }`}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.customerId}</p>
                              </div>
                              <Badge variant="outline" className={
                                (customer.points || 0) >= 1000 ? 'bg-green-100 text-green-800' : 
                                (customer.points || 0) >= 500 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'
                              }>
                                {(customer.points || 0).toLocaleString()}P
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Processing */}
                  <div className="space-y-4">
                    <Label>{t("customers.pointsPayment")}</Label>
                    {selectedCustomer && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-gray-600">{t("customers.availablePoints")}: {(selectedCustomer.points || 0).toLocaleString()}P</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <Label>{t("customers.pointsToUse")}</Label>
                        <Input
                          type="number"
                          placeholder={t("customers.pointsToUsePlaceholder")}
                          value={pointsAmount}
                          onChange={(e) => setPointsAmount(e.target.value)}
                        />
                        {selectedCustomer && pointsAmount && parseInt(pointsAmount) > (selectedCustomer.points || 0) && (
                          <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-4 h-4" />
                            {t("customers.insufficientPoints")}
                          </p>
                        )}
                      </div>

                      {pointsAmount && selectedCustomer && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>{t("customers.pointsAfterPayment")}:</span>
                            <span className="font-medium">
                              {Math.max(0, (selectedCustomer.points || 0) - parseInt(pointsAmount || '0')).toLocaleString()}P
                            </span>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={handlePointsPayment}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!selectedCustomer || !pointsAmount || parseInt(pointsAmount || '0') > (selectedCustomer?.points || 0) || processPaymentMutation.isPending}
                      >
                        {processPaymentMutation.isPending ? t("customers.processing") : 
                         <>
                           <CreditCard className="w-4 h-4 mr-2" />
                           {t("customers.processPayment")}
                         </>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  {t("customers.historyTitle")}
                </CardTitle>
                <CardDescription>{t("customers.historyDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t("customers.loadingHistory")}</p>
                  </div>
                ) : !pointTransactions || pointTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">{t("customers.noHistory")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pointTransactions.map((transaction) => {
                      const customer = customers?.find(c => c.id === transaction.customerId);
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'earned' ? 'bg-green-100' :
                              transaction.type === 'redeemed' ? 'bg-red-100' :
                              transaction.type === 'adjusted' ? 'bg-blue-100' :
                              'bg-gray-100'
                            }`}>
                              {transaction.type === 'earned' ? <TrendingUp className="w-5 h-5 text-green-600" /> :
                               transaction.type === 'redeemed' ? <TrendingDown className="w-5 h-5 text-red-600" /> :
                               transaction.type === 'adjusted' ? <Calculator className="w-5 h-5 text-blue-600" /> :
                               <AlertCircle className="w-5 h-5 text-gray-600" />}
                            </div>
                            <div>
                              <p className="font-medium">{customer?.name || t("customers.unknown")}</p>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(transaction.createdAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}P
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {transaction.type === 'earned' ? t("customers.earned") :
                               transaction.type === 'redeemed' ? t("customers.redeemed") :
                               transaction.type === 'adjusted' ? t("customers.adjusted") :
                               t("customers.expired")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}