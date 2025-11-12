
import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FileQuestion className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Trang không tìm thấy</p>
        <Link href="/reports">
          <Button className="inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang báo cáo
          </Button>
        </Link>
      </div>
    </div>
  );
}
