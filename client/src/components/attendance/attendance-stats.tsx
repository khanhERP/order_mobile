import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Clock, Users, TrendingUp, Calendar } from "lucide-react";
import type { AttendanceRecord, Employee } from "@shared/schema";
import { useTranslation } from "@/lib/i18n";

export function AttendanceStats() {
  const { t, currentLanguage } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  const { data: employees } = useQuery({
    queryKey: ['https://order-mobile-be.onrender.com/api/employees'],
  });

  const { data: attendanceRecords } = useQuery({
    queryKey: ['https://order-mobile-be.onrender.com/api/attendance'],
  });

  const getMonthlyStats = () => {
    if (!attendanceRecords || !employees) return null;

    const monthRecords = attendanceRecords.filter((record: AttendanceRecord) => {
      const recordDate = new Date(record.clockIn);
      const recordMonth = recordDate.toISOString().slice(0, 7);
      return recordMonth === selectedMonth;
    });

    const stats = {
      totalWorkingDays: new Set(monthRecords.map((r: AttendanceRecord) => 
        new Date(r.clockIn).toDateString()
      )).size,
      totalEmployees: employees.length,
      totalAttendance: monthRecords.length,
      totalWorkingHours: monthRecords.reduce((sum: number, record: AttendanceRecord) => 
        sum + (parseFloat(record.totalHours || "0")), 0
      ),
      totalOvertime: monthRecords.reduce((sum: number, record: AttendanceRecord) => 
        sum + (parseFloat(record.overtime || "0")), 0
      ),
      averageWorkingHours: 0,
      attendanceRate: 0,
    };

    stats.averageWorkingHours = stats.totalAttendance > 0 
      ? stats.totalWorkingHours / stats.totalAttendance 
      : 0;

    stats.attendanceRate = stats.totalWorkingDays > 0 
      ? (stats.totalAttendance / (stats.totalEmployees * stats.totalWorkingDays)) * 100 
      : 0;

    return stats;
  };

  const getEmployeeStats = () => {
    if (!attendanceRecords || !employees) return [];

    return employees.map((employee: Employee) => {
      const employeeRecords = attendanceRecords.filter((record: AttendanceRecord) => {
        const recordDate = new Date(record.clockIn);
        const recordMonth = recordDate.toISOString().slice(0, 7);
        return record.employeeId === employee.id && recordMonth === selectedMonth;
      });

      const totalHours = employeeRecords.reduce((sum: number, record: AttendanceRecord) => 
        sum + (parseFloat(record.totalHours || "0")), 0
      );

      const overtimeHours = employeeRecords.reduce((sum: number, record: AttendanceRecord) => 
        sum + (parseFloat(record.overtime || "0")), 0
      );

      const lateCount = employeeRecords.filter((r: AttendanceRecord) => r.status === 'late').length;
      const absentCount = employeeRecords.filter((r: AttendanceRecord) => r.status === 'absent').length;

      return {
        employee,
        totalDays: employeeRecords.length,
        totalHours: totalHours.toFixed(1),
        overtimeHours: overtimeHours.toFixed(1),
        lateCount,
        absentCount,
        attendanceRate: employeeRecords.length > 0 
          ? ((employeeRecords.length - absentCount) / employeeRecords.length) * 100 
          : 0,
      };
    });
  };

  const monthlyStats = getMonthlyStats();
  const employeeStats = getEmployeeStats();

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + "-01");
    const locale = currentLanguage === 'ko' ? 'ko-KR' : currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t('attendance.monthlyStats')}
              </CardTitle>
              <CardDescription>
                {t('attendance.monthlyStatsDesc')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="month-picker">{t('attendance.selectMonth')}:</Label>
              <Input
                id="month-picker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Monthly Overview */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('attendance.totalWorkDays')}</p>
                  <p className="text-3xl font-bold">{monthlyStats.totalWorkingDays}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('attendance.totalAttendance')}</p>
                  <p className="text-3xl font-bold">{monthlyStats.totalAttendance}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('attendance.totalWorkHours')}</p>
                  <p className="text-3xl font-bold">{monthlyStats.totalWorkingHours.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{t('attendance.hours')}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('attendance.totalOvertime')}</p>
                  <p className="text-3xl font-bold">{monthlyStats.totalOvertime.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{t('attendance.hours')}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('attendance.averageWorkHours')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {monthlyStats.averageWorkingHours.toFixed(1)} {t('attendance.hours')}
              </div>
              <p className="text-sm text-gray-600 mt-2">{t('attendance.dailyAverageWorkHours')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('attendance.attendanceRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {monthlyStats.attendanceRate.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 mt-2">{t('attendance.overallAttendanceRate')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.employeeStats')} ({formatMonth(selectedMonth)})</CardTitle>
          <CardDescription>
            {t('attendance.employeeStatsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeeStats.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('attendance.noRecords')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {employeeStats.map(({ employee, totalDays, totalHours, overtimeHours, lateCount, absentCount, attendanceRate }) => (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{t(`employees.roles.${employee.role}`)}</p>
                    </div>
                    <Badge variant={attendanceRate >= 95 ? "default" : attendanceRate >= 85 ? "secondary" : "destructive"}>
                      {t('attendance.attendanceRate')} {attendanceRate.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t('attendance.workDays')}</p>
                      <p className="font-semibold">{totalDays}{t('attendance.days')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('attendance.totalWorkHours')}</p>
                      <p className="font-semibold">{totalHours}{t('attendance.hours')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('attendance.overtimeHours')}</p>
                      <p className="font-semibold">{overtimeHours}{t('attendance.hours')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('attendance.lateCount')}</p>
                      <p className="font-semibold text-orange-600">{lateCount}{t('attendance.times')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('attendance.absentCount')}</p>
                      <p className="font-semibold text-red-600">{absentCount}{t('attendance.times')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}