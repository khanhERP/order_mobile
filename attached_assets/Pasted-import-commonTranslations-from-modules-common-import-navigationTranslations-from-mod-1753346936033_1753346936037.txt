import { commonTranslations } from './modules/common';
import { navigationTranslations } from './modules/navigation';
import { reportsTranslations } from './modules/reports';
import { settingsTranslations } from './modules/settings';
import { notFoundTranslations } from './modules/notFound';
import { ordersTranslations } from './modules/orders';
import { customersTranslations } from './modules/customers';
import { employeesTranslations } from './modules/employees';
import { attendanceTranslations } from './modules/attendance';
import { tablesTranslations } from './modules/tables';
import { inventoryTranslations } from './modules/inventory';
import type { LanguageTranslations } from './types';

export const translations: LanguageTranslations = {
  ko: {
    common: commonTranslations.ko,
    nav: navigationTranslations.ko,
    reports: reportsTranslations.ko,
    settings: settingsTranslations.ko,
    notFound: notFoundTranslations.ko,
    orders: ordersTranslations.ko,
    customers: customersTranslations.ko,
    employees: employeesTranslations.ko,
    attendance: attendanceTranslations.ko,
    inventory: inventoryTranslations.ko,
    tables: tablesTranslations.ko,
  },
  en: {
    common: commonTranslations.en,
    nav: navigationTranslations.en,
    reports: reportsTranslations.en,
    settings: settingsTranslations.en,
    notFound: notFoundTranslations.en,
    orders: ordersTranslations.en,
    customers: customersTranslations.en,
    employees: employeesTranslations.en,
    attendance: attendanceTranslations.en,
    inventory: inventoryTranslations.en,
    tables: tablesTranslations.en,
  },
  vi: {
    common: commonTranslations.vi,
    nav: navigationTranslations.vi,
    reports: reportsTranslations.vi,
    settings: settingsTranslations.vi,
    notFound: notFoundTranslations.vi,
    orders: ordersTranslations.vi,
    customers: customersTranslations.vi,
    employees: employeesTranslations.vi,
    attendance: attendanceTranslations.vi,
    inventory: inventoryTranslations.vi,
    tables: tablesTranslations.vi,
  },
};