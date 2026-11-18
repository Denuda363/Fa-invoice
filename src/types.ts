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

export interface CompanyProfile {
  name: string;
  tagline: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  ownerName?: string;
  iconUrl?: string;
}

export interface AppData {
  invoices: Invoice[];
  customers: Customer[];
  companyProfile?: CompanyProfile;
}

export type ViewState =
  | "DASHBOARD"
  | "INVOICE_HISTORY"
  | "BULK_INPUT_INVOICE"
  | "REPORTS"
  | "CUSTOMERS"
  | "SETTINGS"
  | "PAYMENT_HISTORY";

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

export type ClockStyleId =
  | "classic-3d"
  | "flip-clock"
  | "analog-hybrid"
  | "retro-lcd"
  | "calendar-desk"
  | "glass-prism"
  | "orbit-ring"
  | "editorial-serif";

export interface ClockSettings {
  style: ClockStyleId;
  format24h: boolean;
  showSeconds: boolean;
  showClock: boolean;
}

