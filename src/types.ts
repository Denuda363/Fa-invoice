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
export type PageTransitionStyleId =
  | "precision-3d"
  | "directional-glide"
  | "desk-tilt-3d"
  | "editorial-veil"
  | "executive-fade";

export interface NavbarSettings {
  theme: NavbarThemeId;
  layout: NavbarLayoutMode;
  isMinimized: boolean;
  buttonShape: NavbarButtonShape;
  pageTransition?: PageTransitionStyleId;
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

export type TransactionNotificationType =
  | "INVOICE_CREATED"
  | "INVOICE_BULK_CREATED"
  | "INVOICE_UPDATED"
  | "INVOICE_DELETED"
  | "PAYMENT_ADDED"
  | "PAYMENT_BULK_ADDED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_DELETED";

export interface AppNotification {
  id: string;
  type: TransactionNotificationType;
  title: string;
  message: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: number;
  count?: number;
  statusNote?: string;
  createdAt: string;
  read: boolean;
  targetView?: ViewState;
}

export interface NotificationPreferences {
  deviceEnabled: boolean;
  toastEnabled: boolean;
  soundEnabled: boolean;
}


