import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

interface PinAuthProps {
  onAuthSuccess: () => void;
}

export function PinAuth({ onAuthSuccess }: PinAuthProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch store settings để lấy PIN
  const {
    data: storeData,
    isLoading: isLoadingSettings,
    error: settingsError,
  } = useQuery({
    queryKey: ["https://order-mobile-be.onrender.com/api/store-settings"],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching store settings from API...");
        const response = await apiRequest("GET", "https://order-mobile-be.onrender.com/api/store-settings");

        console.log("📡 Store settings response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get response text first to check if it's valid JSON
        const responseText = await response.text();
        console.log(
          "📄 Store settings response text:",
          responseText.substring(0, 200),
        );

        if (!responseText || responseText.trim() === "") {
          throw new Error("Empty response from server");
        }

        const data = JSON.parse(responseText);
        console.log("✅ Store settings parsed successfully:", data);
        return data;
      } catch (error) {
        console.error("❌ Failed to fetch store settings:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Hiển thị lỗi nếu không thể load store settings
  useEffect(() => {
    if (settingsError) {
      toast({
        title: "Lỗi tải cài đặt",
        description:
          "Không thể tải thông tin cài đặt cửa hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  }, [settingsError, toast]);

  useEffect(() => {
    // Kiểm tra nếu đã đăng nhập trong session này
    const isAuthenticated = sessionStorage.getItem("pinAuthenticated");
    if (isAuthenticated === "true") {
      onAuthSuccess();
    }
  }, [onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã PIN",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔐 Verifying PIN via API...");

      // Call API to verify PIN
      const response = await fetch("https://order-mobile-be.onrender.com/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Lưu trạng thái đăng nhập vào sessionStorage
        sessionStorage.setItem("pinAuthenticated", "true");

        // Removed success toast notification as per user request
        // toast({
        //   title: "Đăng nhập thành công",
        //   description: "Chào mừng bạn đến với hệ thống POS",
        // });

        console.log("✅ PIN verification successful");
        onAuthSuccess();
      } else {
        toast({
          title: "Mã PIN không đúng",
          description: data.message || "Vui lòng kiểm tra lại mã PIN",
          variant: "destructive",
        });
        setPin("");
        console.log("❌ PIN verification failed");
      }
    } catch (error) {
      console.error("❌ PIN verification error:", error);
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi xác thực. Vui lòng thử lại.",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
    if (value.length <= 6) {
      setPin(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ffffff 0%, transparent 50%),
                           radial-gradient(circle at 75% 25%, #ffffff 0%, transparent 50%),
                           radial-gradient(circle at 25% 75%, #ffffff 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #ffffff 0%, transparent 50%)`,
            backgroundSize: "100px 100px",
          }}
        ></div>
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Xác thực bảo mật
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Nhập mã PIN để truy cập hệ thống POS
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="pin"
                className="text-sm font-medium text-gray-700"
              >
                Mã PIN
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={handlePinChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập mã PIN (4-6 chữ số)"
                  className="pr-10 text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                  autoFocus
                  disabled={isLoading || isLoadingSettings}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
              disabled={isLoading || isLoadingSettings || pin.length < 4}
            >
              {isLoadingSettings ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang tải cài đặt...
                </div>
              ) : isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xác thực...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Đăng nhập
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Liên hệ quản trị viên nếu bạn quên mã PIN
            </p>
          </div>

          {/* Virtual Keypad for mobile */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                className="h-12 text-lg font-semibold"
                onClick={() => {
                  if (pin.length <= 6) {
                    setPin((prev) => prev + num);
                  }
                }}
                disabled={isLoading || isLoadingSettings || pin.length >= 6}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-12 text-lg font-semibold text-red-600"
              onClick={() => setPin("")}
              disabled={isLoading || pin.length === 0}
            >
              Xóa
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-lg font-semibold"
              onClick={() => {
                if (pin.length < 6) {
                  setPin((prev) => prev + "0");
                }
              }}
              disabled={isLoading || pin.length >= 6}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-lg font-semibold text-red-600"
              onClick={() => setPin((prev) => prev.slice(0, -1))}
              disabled={isLoading || pin.length === 0}
            >
              ←
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}