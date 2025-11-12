import { commonTranslations } from "./modules/common";
import { navigationTranslations } from "./modules/navigation";
import { attendanceTranslations } from "./modules/attendance";
import { customersTranslations } from "./modules/customers";
import { employeesTranslations } from "./modules/employees";
import { inventoryTranslations } from "./modules/inventory";
import { notFoundTranslations } from "./modules/notFound";
import { ordersTranslations } from "./modules/orders";
import { posTranslations } from "./modules/pos";
import { reportsTranslations } from "./modules/reports";
import { settingsTranslations } from "./modules/settings";
import { tablesTranslations } from "./modules/tables";
import { einvoiceTranslations } from "./modules/einvoice";
import { suppliersTranslations } from "./modules/suppliers";
import { purchasesTranslations } from "./modules/purchases";
import type { LanguageTranslations } from "./types";

export const translations: LanguageTranslations = {
  ko: {
    common: commonTranslations.ko,
    nav: navigationTranslations.ko,
    attendance: attendanceTranslations.ko,
    customers: customersTranslations.ko,
    employees: employeesTranslations.ko,
    inventory: inventoryTranslations.ko,
    notFound: notFoundTranslations.ko,
    orders: ordersTranslations.ko,
    pos: posTranslations.ko,
    reports: reportsTranslations.ko,
    settings: settingsTranslations.ko,
    tables: tablesTranslations.ko,
    einvoice: einvoiceTranslations.ko,
    suppliers: suppliersTranslations.ko,
    purchases: purchasesTranslations.ko,
  },
  en: {
    common: commonTranslations.en,
    nav: navigationTranslations.en,
    attendance: attendanceTranslations.en,
    customers: customersTranslations.en,
    employees: employeesTranslations.en,
    inventory: inventoryTranslations.en,
    notFound: notFoundTranslations.en,
    orders: ordersTranslations.en,
    pos: posTranslations.en,
    reports: {
      ...reportsTranslations.en,
      customerSalesReport: "Customer Sales Report",
      topCustomersByRevenue: "Top 10 Customers by Revenue",
    },
    settings: settingsTranslations.en,
    tables: tablesTranslations.en,
    einvoice: einvoiceTranslations.en,
    suppliers: suppliersTranslations.en,
    purchases: purchasesTranslations.en,
  },
  vi: {
    common: commonTranslations.vi,
    nav: navigationTranslations.vi,
    attendance: attendanceTranslations.vi,
    customers: customersTranslations.vi,
    employees: employeesTranslations.vi,
    inventory: inventoryTranslations.vi,
    notFound: notFoundTranslations.vi,
    orders: ordersTranslations.vi,
    pos: posTranslations.vi,
    reports: {
      ...reportsTranslations.vi,
      customerSalesReport: "Báo cáo doanh thu khách hàng",
      topCustomersByRevenue: "Top 10 khách hàng doanh thu cao nhất",
    },
    settings: {
      ...settingsTranslations.vi,
      storeUpdated: "Thông tin cửa hàng đã được cập nhật",
      updateError: "Có lỗi xảy ra trong quá trình cập nhật",
      updateSuccess: "Cập nhật thành công",
      updateFailed: "Cập nhật thất bại",
      saveSuccess: "Lưu thành công",
      saveFailed: "Lưu thất bại",
    },
    tables: tablesTranslations.vi,
    einvoice: einvoiceTranslations.vi,
    suppliers: suppliersTranslations.vi,
    purchases: purchasesTranslations.vi,
  },
};