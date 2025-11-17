import { useState } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { type Customer } from "@shared/schema";
import { 
  Crown, 
  Medal, 
  Award, 
  Users, 
  TrendingUp, 
  Gift,
  Star,
  Search,
  Save,
  X
} from "lucide-react";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingThresholds, setIsEditingThresholds] = useState(false);
  const [thresholds, setThresholds] = useState({
    GOLD: 300000,
    VIP: 1000000
  });

  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers'],
    enabled: isOpen,
  });

  // Fetch membership thresholds
  const { data: fetchedThresholds } = useQuery<{ GOLD: number; VIP: number }>({
    queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/membership-thresholds'],
    enabled: isOpen,
  });

  // Update thresholds when data is fetched
  React.useEffect(() => {
    if (fetchedThresholds) {
      setThresholds(fetchedThresholds);
    }
  }, [fetchedThresholds]);

  const membershipTiers = [
    {
      level: 'SILVER',
      name: t("customers.silver"),
      icon: Medal,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      benefits: [t("customers.basicPointsEarning"), t("customers.birthdayDiscount5")],
      minSpent: 0,
      description: t("customers.basicLevelDesc")
    },
    {
      level: 'GOLD', 
      name: t("customers.gold"),
      icon: Award,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      benefits: [t("customers.pointsEarning15"), t("customers.birthdayDiscount10"), t("customers.freeDrinkMonthly")],
      minSpent: thresholds.GOLD,
      description: t("customers.premiumLevelDesc")
    },
    {
      level: 'VIP',
      name: t("customers.vip"),
      icon: Crown,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      benefits: [t("customers.pointsEarning2x"), t("customers.birthdayDiscount20"), t("customers.freeDrink2Monthly"), t("customers.vipRoomAccess")],
      minSpent: thresholds.VIP,
      description: t("customers.vipLevelDesc")
    }
  ];

  // Update customer membership
  const updateMembershipMutation = useMutation({
    mutationFn: async ({ customerId, membershipLevel }: { customerId: number; membershipLevel: string }) => {
      const response = await fetch(`https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipLevel }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers'] });
      toast({
        title: t("common.success"),
        description: t("customers.customerUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("customers.customerError"),
        variant: 'destructive',
      });
    },
  });

  // Update membership thresholds
  const updateThresholdsMutation = useMutation({
    mutationFn: async (newThresholds: { GOLD: number; VIP: number }) => {
      const response = await fetch('https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/membership-thresholds', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newThresholds),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/membership-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/customers'] });
      toast({
        title: t("common.success"),
        description: "Đã cập nhật mức chi tiêu nâng hạng",
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Không thể cập nhật mức chi tiêu",
        variant: 'destructive',
      });
    },
  });

  const handleUpdateMembership = (customerId: number, newLevel: string) => {
    updateMembershipMutation.mutate({ customerId, membershipLevel: newLevel });
  };

  const autoUpgradeBasedOnSpending = (customerId: number, totalSpent: number) => {
    let newLevel = 'SILVER';
    if (totalSpent >= thresholds.VIP) newLevel = 'VIP';
    else if (totalSpent >= thresholds.GOLD) newLevel = 'GOLD';
    
    handleUpdateMembership(customerId, newLevel);
  };

  const saveThresholds = () => {
    updateThresholdsMutation.mutate(thresholds);
    setIsEditingThresholds(false);
  };

  const autoUpgradeAllCustomers = () => {
    customers?.forEach(customer => {
      const totalSpent = parseFloat(customer.totalSpent || '0');
      const currentLevel = customer.membershipLevel || 'SILVER';
      let suggestedLevel = 'SILVER';
      
      if (totalSpent >= thresholds.VIP) suggestedLevel = 'VIP';
      else if (totalSpent >= thresholds.GOLD) suggestedLevel = 'GOLD';
      
      if (currentLevel !== suggestedLevel) {
        autoUpgradeBasedOnSpending(customer.id, totalSpent);
      }
    });
  };

  const filteredCustomers = customers?.filter(customer => {
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customerId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = !selectedTier || selectedTier === 'all' || customer.membershipLevel?.toLowerCase().includes(selectedTier.toLowerCase());
    return matchesSearch && matchesTier;
  }) || [];

  const membershipStats = customers?.reduce((acc, customer) => {
    const level = customer.membershipLevel || 'SILVER';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            {t("customers.membershipManagementTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("customers.membershipManagementDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Membership Tiers Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t("customers.membershipTierGuide")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {membershipTiers.map((tier) => {
                const IconComponent = tier.icon;
                const count = membershipStats[tier.level] || 0;
                
                return (
                  <Card key={tier.level} className={`border-2 ${tier.color.includes('gray') ? 'border-gray-200' : tier.color.includes('yellow') ? 'border-yellow-200' : 'border-purple-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="w-5 h-5" />
                        {tier.name}
                        <Badge variant="outline" className="ml-auto">
                          {count}명
                        </Badge>
                      </CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {t("customers.minPurchaseAmount")}: 
                          {isEditingThresholds && tier.level !== 'SILVER' ? (
                            <Input
                              type="number"
                              value={thresholds[tier.level as keyof typeof thresholds]}
                              onChange={(e) => setThresholds(prev => ({
                                ...prev,
                                [tier.level]: parseInt(e.target.value) || 0
                              }))}
                              className="w-32 h-6 text-xs"
                            />
                          ) : (
                            <span>₩{tier.minSpent.toLocaleString()}</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{t("customers.membershipBenefits")}:</div>
                          {tier.benefits.map((benefit, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                              <Gift className="w-3 h-3" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Customer Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                {t("customers.customerMembershipManagement")}
              </h3>
              <div className="flex gap-2">
                {isEditingThresholds ? (
                  <>
                    <Button
                      onClick={saveThresholds}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t("common.saveSpendingThreshold")}
                    </Button>
                    <Button
                      onClick={() => setIsEditingThresholds(false)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t("common.cancel")}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditingThresholds(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t("common.editSpendingThreshold")}
                  </Button>
                )}
                <Button
                  onClick={autoUpgradeAllCustomers}
                  variant="outline"
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t("customers.autoUpgrade")}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder={t("customers.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("customers.filterByTier")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("customers.allTiers")}</SelectItem>
                  <SelectItem value="silver">{t("customers.silver")}</SelectItem>
                  <SelectItem value="gold">{t("customers.gold")}</SelectItem>
                  <SelectItem value="vip">{t("customers.vip")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer List */}
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t("common.loading")}</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <div className="grid grid-cols-7 gap-4 p-4 font-medium text-sm text-gray-600 bg-gray-50 border-b">
                  <div>{t("customers.customerId")}</div>
                  <div>{t("customers.name")}</div>
                  <div>{t("customers.membershipLevel")}</div>
                  <div>{t("customers.totalSpent")}</div>
                  <div>{t("customers.visitCount")}</div>
                  <div>{t("customers.points")}</div>
                  <div className="text-center">{t("common.actions")}</div>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {filteredCustomers.map((customer) => {
                    const currentTier = membershipTiers.find(t => t.level === (customer.membershipLevel || 'SILVER'));
                    const totalSpent = parseFloat(customer.totalSpent || '0');
                    const suggestedTier = totalSpent >= thresholds.VIP ? 'VIP' : totalSpent >= thresholds.GOLD ? 'GOLD' : 'SILVER';
                    const needsUpgrade = suggestedTier !== (customer.membershipLevel || 'SILVER');
                    
                    return (
                      <div key={customer.id} className="grid grid-cols-7 gap-4 p-4 items-center">
                        <div className="font-mono text-sm">{customer.customerId || ''}</div>
                        <div className="font-medium">{customer.name}</div>
                        <div>
                          <Badge className={currentTier?.color || 'bg-gray-100 text-gray-800'}>
                            {currentTier?.name || customer.membershipLevel}
                          </Badge>
                          {needsUpgrade && (
                            <Badge variant="outline" className="ml-1 text-orange-600">
                              {t("customers.upgradeAvailable")}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm">{totalSpent.toLocaleString()} ₫</div>
                        <div className="text-sm">{customer.visitCount || 0}회</div>
                        <div className="text-sm">{customer.points || 0}P</div>
                        <div className="flex items-center justify-center gap-2">
                          <Select
                            value={customer.membershipLevel || 'SILVER'}
                            onValueChange={(newLevel) => handleUpdateMembership(customer.id, newLevel)}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SILVER">{t("customers.silver")}</SelectItem>
                              <SelectItem value="GOLD">{t("customers.gold")}</SelectItem>
                              <SelectItem value="VIP">{t("customers.vip")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {needsUpgrade && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autoUpgradeBasedOnSpending(customer.id, totalSpent)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <TrendingUp className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            {t("customers.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}