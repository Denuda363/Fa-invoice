export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  exportSeparateSheet?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  payments: Payment[];
  status: "UNPAID" | "PARTIAL" | "PAID";
}

export interface AppData {
  invoices: Invoice[];
  customers: Customer[];
}

export type ViewState = "DASHBOARD" | "INVOICE_HISTORY" | "BULK_INPUT_INVOICE" | "REPORTS" | "CUSTOMERS" | "SETTINGS" | "PAYMENT_HISTORY";

export type NavbarThemeId =
  | "modern-light"
  | "midnight-dark"
  | "deep-navy"
  | "emerald-luxury"
  | "royal-purple"
  | "sunset-crimson"
  | "graphite-dark"
  | "soft-pastel";

export type NavbarLayoutMode = "sidebar" | "topbar";
export type NavbarButtonShape = "rounded-lg" | "rounded-full" | "rounded-md";

export interface NavbarSettings {
  theme: NavbarThemeId;
  layout: NavbarLayoutMode;
  isMinimized: boolean;
  buttonShape: NavbarButtonShape;
}
