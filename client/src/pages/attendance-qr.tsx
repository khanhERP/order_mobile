import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, LogIn, LogOut, Coffee, Play, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import type { Employee, AttendanceRecord } from "@shared/schema";

export default function AttendanceQRPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: employees } = useQuery({
    queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/employees'],
  });

  const { data: todayAttendance, refetch: refetchTodayAttendance } = useQuery({
    queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance/today', selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const clockInMutation = useMutation({
    mutationFn: () => apiRequest('POST', 'https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance/clock-in', {
      employeeId: parseInt(selectedEmployeeId),
      notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance'] });
      refetchTodayAttendance();
      setNotes("");
      toast({
        title: "출근 기록 완료",
        description: "출근이 성공적으로 기록되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "출근 기록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiRequest('POST', `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance/clock-out/${(todayAttendance as AttendanceRecord)?.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance'] });
      refetchTodayAttendance();
      toast({
        title: "퇴근 기록 완료",
        description: "퇴근이 성공적으로 기록되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('attendance.clockOutError'),
        variant: "destructive",
      });
    },
  });

  const breakStartMutation = useMutation({
    mutationFn: () => apiRequest('POST', `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance/break-start/${(todayAttendance as AttendanceRecord)?.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance'] });
      refetchTodayAttendance();
      toast({
        title: t('attendance.breakStartSuccess'),
        description: t('attendance.breakStartSuccessDesc'),
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "휴식 시작 기록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const breakEndMutation = useMutation({
    mutationFn: () => apiRequest('POST', `https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance/break-end/${(todayAttendance as AttendanceRecord)?.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['https://ae5ea441-9a81-4f0c-badc-1b445a58a294-00-bx7jg4f6rly0.sisko.replit.dev/api/attendance'] });
      refetchTodayAttendance();
      toast({
        title: "휴식 종료",
        description: "휴식이 종료되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "오류",
        description: "휴식 종료 기록에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const selectedEmployee = (employees as Employee[] | undefined)?.find((emp: Employee) => emp.id === parseInt(selectedEmployeeId));

  const formatTime = (dateInput: Date | string) => {
    return new Date(dateInput).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWorkingHours = (clockIn: Date | string, clockOut?: Date | string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(1);
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (!record.clockOut) {
      if (record.breakStart && !record.breakEnd) {
        return <Badge variant="secondary">휴식 중</Badge>;
      }
      return <Badge variant="default">근무 중</Badge>;
    }
    return <Badge variant="outline">퇴근 완료</Badge>;
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6" />
              QR 근태 기록
            </CardTitle>
            <CardDescription>
              직원을 선택하고 출근/퇴근을 기록하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee-select">직원 선택</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="직원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {(employees as Employee[] | undefined)?.map((employee: Employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{employee.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {t(`employees.roles.${employee.role}`)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes Input */}
            {selectedEmployeeId && (
              <div className="space-y-2">
                <Label htmlFor="notes">메모 (선택사항)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="특이사항이나 메모를 입력하세요"
                />
              </div>
            )}

            {/* Current Status */}
            {selectedEmployee && todayAttendance && (todayAttendance as AttendanceRecord) && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">오늘의 근무 상태</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>출근 시간:</span>
                    <span className="font-medium">{formatTime((todayAttendance as AttendanceRecord).clockIn)}</span>
                  </div>
                  {(todayAttendance as AttendanceRecord).clockOut && (
                    <div className="flex justify-between">
                      <span>퇴근 시간:</span>
                      <span className="font-medium">{formatTime((todayAttendance as AttendanceRecord).clockOut!)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>근무 시간:</span>
                    <span className="font-medium">{getWorkingHours((todayAttendance as AttendanceRecord).clockIn, (todayAttendance as AttendanceRecord).clockOut)}시간</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>상태:</span>
                    {getStatusBadge(todayAttendance as AttendanceRecord)}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedEmployee && (
              <div className="space-y-2">
                {!todayAttendance ? (
                  <Button
                    onClick={() => clockInMutation.mutate()}
                    disabled={clockInMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {clockInMutation.isPending ? "처리 중..." : "출근 기록"}
                  </Button>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {!(todayAttendance as AttendanceRecord).clockOut && (
                      <>
                        {(todayAttendance as AttendanceRecord).breakStart && !(todayAttendance as AttendanceRecord).breakEnd ? (
                          <Button
                            onClick={() => breakEndMutation.mutate()}
                            disabled={breakEndMutation.isPending}
                            variant="outline"
                            size="lg"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            휴식 종료
                          </Button>
                        ) : (
                          <Button
                            onClick={() => breakStartMutation.mutate()}
                            disabled={breakStartMutation.isPending}
                            variant="outline"
                            size="lg"
                          >
                            <Coffee className="w-4 h-4 mr-2" />
                            휴식 시작
                          </Button>
                        )}
                        <Button
                          onClick={() => clockOutMutation.mutate()}
                          disabled={clockOutMutation.isPending}
                          size="lg"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          퇴근 기록
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {!selectedEmployee && selectedEmployeeId === "" && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">직원을 선택해 주세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}