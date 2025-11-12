import { useState } from "react";
import { POSHeader } from "@/components/pos/header";
import { RightSidebar } from "@/components/ui/right-sidebar";
import { AttendanceList } from "@/components/attendance/attendance-list";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { ClockInOut } from "@/components/attendance/clock-in-out";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/lib/i18n";

interface AttendancePageProps {
  onLogout: () => void;
}

export default function AttendancePage({ onLogout }: AttendancePageProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [useRange, setUseRange] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{startDate: string, endDate: string}>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="min-h-screen bg-green-50 grocery-bg">
      {/* Header */}
      <POSHeader />

      {/* Right Sidebar */}
      <RightSidebar />

      <div className="main-content pt-16 px-6">
        <div className="max-w-5xl mx-auto py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('attendance.title')}</h1>
              <p className="mt-2 text-gray-600">{t('attendance.description')}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/employees">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  {t('employees.employeeManagement')}
                </Button>
              </Link>
              <Link href="/sales-orders">
                <Button variant="outline">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('common.comboValues.backToSales')}
                </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="clock" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clock" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('attendance.clockInOut')}
              </TabsTrigger>
              <TabsTrigger value="records" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('attendance.attendanceRecords')}
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('attendance.statistics')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clock">
              <ClockInOut />
            </TabsContent>

            <TabsContent value="records">
              <AttendanceList 
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                useRange={useRange}
              />
            </TabsContent>

            <TabsContent value="stats">
              <AttendanceStats />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}