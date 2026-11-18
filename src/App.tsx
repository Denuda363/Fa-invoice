import React, { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { ViewState, Invoice } from "./types";
import { Dashboard } from "./components/Dashboard";
import { InvoiceHistory } from "./components/InvoiceHistory";
import { BulkInputFaktur } from "./components/BulkInputFaktur";
import { Reports } from "./components/Reports";
import { Customers } from "./components/Customers";
import { Settings } from "./components/Settings";
import { PaymentModal } from "./components/PaymentModal";
import { PaymentHistoryModal } from "./components/PaymentHistoryModal";
import { PaymentHistory } from "./components/PaymentHistory";
import { PWAInstallButton } from "./components/PWAInstallButton";
import { CompanyLogo } from "./components/CompanyLogo";
import { LiveClockWidget } from "./components/LiveClockWidget";
import { NavbarProvider, useNavbar } from "./context/NavbarContext";
import { ClockProvider, useClock } from "./context/ClockContext";
import {
  LayoutDashboard,
  FilePlus,
  Files,
  PieChart,
  Menu,
  X,
  Users,
  Settings as SettingsIcon,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  Layout,
} from "lucide-react";
import { cn } from "./utils";

function AppContent() {
  const store = useAppStore();
  const { settings, activeTheme, toggleMinimized, setLayout } = useNavbar();
  const { clockSettings } = useClock();
  const [view, setView] = useState<ViewState>("DASHBOARD");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const companyName = store.companyProfile?.name || "AF Faktur";
  const companyTagline = store.companyProfile?.tagline || "Manajemen Faktur";
  const companyIcon = store.companyProfile?.iconUrl || "";

  // Dynamically sync browser title & favicon with Company Profile & uploaded icon
  useEffect(() => {
    document.title = `${companyName} — ${companyTagline}`;
    const iconHref = companyIcon.trim() || "/icon.jpg";

    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (favicon) favicon.href = iconHref;

    const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (appleIcon) appleIcon.href = iconHref;
  }, [companyName, companyTagline, companyIcon]);

  const navigation = [
    { name: "Dashboard", id: "DASHBOARD" as ViewState, icon: LayoutDashboard },
    { name: "Input Faktur", id: "BULK_INPUT_INVOICE" as ViewState, icon: FilePlus },
    { name: "Riwayat Faktur", id: "INVOICE_HISTORY" as ViewState, icon: Files },
    { name: "Riwayat Pembayaran", id: "PAYMENT_HISTORY" as ViewState, icon: Receipt },
    { name: "Data Konsumen", id: "CUSTOMERS" as ViewState, icon: Users },
    { name: "Laporan Jatuh Tempo", id: "REPORTS" as ViewState, icon: PieChart },
    { name: "Pengaturan", id: "SETTINGS" as ViewState, icon: SettingsIcon },
  ];

  const currentTitle = navigation.find((n) => n.id === view)?.name || companyName;
  const isTopbarMode = settings.layout === "topbar";

  return (
    <div
      data-theme={activeTheme.id}
      className={cn(
        "app-3d-shell min-h-screen text-gray-900 flex font-sans pb-24 md:pb-6 transition-colors duration-300",
        activeTheme.appBg,
        isTopbarMode ? "flex-col" : "flex-col md:flex-row"
      )}
    >
      {/* Mobile Sidebar Backdrop (Drawer) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Top Header (3D Theme Matched) */}
      <header
        className={cn(
          "md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-2.5 min-h-[3.5rem] border-b transition-all",
          activeTheme.headerBg,
          activeTheme.headerBorder
        )}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <CompanyLogo
            iconUrl={companyIcon}
            companyName={companyName}
            className="w-8 h-8 rounded-lg shrink-0"
            alt={companyName}
          />
          <div className="min-w-0 flex-1">
            <h1 className={cn("text-sm font-extrabold leading-snug break-words whitespace-normal", activeTheme.textLogo)}>
              {companyName}
            </h1>
            <p className={cn("text-[10px] font-medium leading-tight break-words whitespace-normal mt-0.5", activeTheme.textSub)}>
              {currentTitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn("p-2 rounded-xl transition-all shrink-0", activeTheme.toggleBtnHover)}
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* DESKTOP TOPBAR LAYOUT (3D Topbar Mode) */}
      {isTopbarMode && (
        <header
          className={cn(
            "hidden md:flex sticky top-0 z-40 items-center justify-between gap-4 px-5 lg:px-6 py-2.5 border-b transition-all",
            activeTheme.headerBg,
            activeTheme.headerBorder
          )}
        >
          <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
            <div
              className="flex items-center gap-3 cursor-pointer shrink-0 max-w-[260px] xl:max-w-[340px]"
              onClick={() => setView("DASHBOARD")}
            >
              <CompanyLogo
                iconUrl={companyIcon}
                companyName={companyName}
                className="w-9 h-9 rounded-xl shrink-0"
                alt={companyName}
              />
              <div className="min-w-0">
                <h1 className={cn("font-extrabold text-sm leading-snug tracking-tight break-words whitespace-normal", activeTheme.textLogo)}>
                  {companyName}
                </h1>
                <p className={cn("text-[10px] font-medium leading-tight break-words whitespace-normal mt-0.5", activeTheme.textSub)}>
                  {companyTagline}
                </p>
              </div>
            </div>

            {/* Horizontal 3D Nav Links */}
            <nav className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5">
              {navigation.map((item) => {
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
                      settings.buttonShape,
                      isActive ? activeTheme.navItemActive : activeTheme.navItemInactive
                    )}
                  >
                    <item.icon
                      size={15}
                      className={cn(
                        "shrink-0",
                        isActive ? activeTheme.navIconActive : activeTheme.navIconInactive
                      )}
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLayout("sidebar")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap",
                activeTheme.toggleBtnHover,
                activeTheme.sidebarBorder
              )}
              title="Kembalikan ke mode Sidebar Kiri"
            >
              <Layout size={14} />
              <span>Ganti Sidebar</span>
            </button>
            <PWAInstallButton />
          </div>
        </header>
      )}

      {/* DESKTOP 3D SIDEBAR & MOBILE SLIDING DRAWER */}
      {(!isTopbarMode || isSidebarOpen) && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform border-r flex flex-col transition-all duration-300 ease-in-out md:static md:translate-x-0",
            isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full",
            isTopbarMode ? "md:hidden" : "",
            !isTopbarMode && (settings.isMinimized ? "md:w-20" : "md:w-72"),
            activeTheme.sidebarBg,
            activeTheme.sidebarBorder
          )}
        >
          {/* Sidebar Brand Header */}
          <div
            className={cn(
              "min-h-16 flex border-b transition-colors",
              activeTheme.sidebarBorder,
              settings.isMinimized && !isSidebarOpen
                ? "flex-col items-center justify-center gap-2 py-3 px-2"
                : "items-start justify-between gap-2.5 py-3 px-4"
            )}
          >
            <div
              className={cn(
                "flex items-center min-w-0",
                settings.isMinimized && !isSidebarOpen ? "justify-center" : "gap-3 flex-1"
              )}
            >
              <div
                className="relative group hidden md:flex shrink-0"
                title={settings.isMinimized && !isSidebarOpen ? `${companyName} — ${companyTagline}` : undefined}
              >
                <CompanyLogo
                  iconUrl={companyIcon}
                  companyName={companyName}
                  className="w-9 h-9 rounded-xl shrink-0"
                  alt={companyName}
                />
                {settings.isMinimized && !isSidebarOpen && (
                  <div className="hidden group-hover:md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none border border-gray-700">
                    {companyName}
                  </div>
                )}
              </div>
              {(!settings.isMinimized || isSidebarOpen) && (
                <div className="hidden md:block flex-1 min-w-0">
                  <h1 className={cn("font-extrabold text-sm leading-snug tracking-tight break-words whitespace-normal", activeTheme.textLogo)}>
                    {companyName}
                  </h1>
                  <p className={cn("text-[10px] font-medium leading-tight break-words whitespace-normal mt-0.5", activeTheme.textSub)}>
                    {companyTagline}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2.5 md:hidden flex-1 min-w-0">
                <CompanyLogo
                  iconUrl={companyIcon}
                  companyName={companyName}
                  className="w-8 h-8 rounded-lg shrink-0"
                  alt={companyName}
                />
                <div className="min-w-0 flex-1">
                  <h1 className={cn("font-bold text-sm leading-snug break-words whitespace-normal", activeTheme.textLogo)}>
                    {companyName}
                  </h1>
                  <p className={cn("text-[10px] font-medium leading-tight break-words whitespace-normal mt-0.5", activeTheme.textSub)}>
                    {companyTagline}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Minimize / Expand Toggle Button for Desktop */}
            <button
              onClick={toggleMinimized}
              className={cn(
                "hidden md:flex items-center justify-center p-2 rounded-lg transition-all shrink-0",
                !(settings.isMinimized && !isSidebarOpen) && "mt-0.5",
                activeTheme.toggleBtnHover
              )}
              title={settings.isMinimized ? "Perbesar Navbar (Expand)" : "Kecilkan Navbar (Minimize)"}
              aria-label={settings.isMinimized ? "Perbesar Navbar" : "Kecilkan Navbar"}
            >
              {settings.isMinimized ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Close button for Mobile sliding drawer */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden rounded-lg p-2 text-gray-400 hover:text-gray-100 hover:bg-white/10 shrink-0"
              aria-label="Tutup Menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* 3D Navigation Links */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
            {navigation.map((item) => {
              const isActive = view === item.id;
              const isMinimizedDesktop = settings.isMinimized && !isSidebarOpen;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  title={isMinimizedDesktop ? item.name : undefined}
                  className={cn(
                    "w-full flex items-center transition-all duration-200 group relative",
                    settings.buttonShape,
                    isMinimizedDesktop
                      ? "justify-center p-3"
                      : "gap-3 px-3.5 py-2.5 text-sm font-semibold",
                    isActive ? activeTheme.navItemActive : activeTheme.navItemInactive
                  )}
                >
                  <item.icon
                    size={isMinimizedDesktop ? 20 : 18}
                    className={cn(
                      "shrink-0 transition-transform group-hover:scale-105",
                      isActive ? activeTheme.navIconActive : activeTheme.navIconInactive
                    )}
                  />
                  {(!settings.isMinimized || isSidebarOpen) && (
                    <span className="truncate text-left">{item.name}</span>
                  )}

                  {/* Floating Hover Tooltip when Minimized on Desktop */}
                  {isMinimizedDesktop && (
                    <div className="hidden group-hover:md:flex absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center gap-1.5 border border-gray-700">
                      <span>{item.name}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className={cn("p-3 border-t transition-colors", activeTheme.sidebarBorder)}>
            {!settings.isMinimized || isSidebarOpen ? (
              <div className="space-y-2">
                <PWAInstallButton />
                <div className="hidden md:flex items-center justify-between px-1 text-[10px] text-gray-400">
                  <span className="truncate">Tema: {activeTheme.name}</span>
                  <button
                    onClick={() => setView("SETTINGS")}
                    className="hover:underline text-blue-500 font-semibold shrink-0 ml-1"
                  >
                    Ubah Gaya
                  </button>
                </div>
                <div className="px-1 text-[10px] text-gray-400/80 flex items-center justify-between border-t border-gray-200/40 pt-1.5">
                  <span>© 2026 Denuda</span>
                  <span className="font-medium text-gray-500">v2.5 Pro</span>
                </div>
              </div>
            ) : (
              <button
                onClick={toggleMinimized}
                className={cn(
                  "w-full flex items-center justify-center p-2 rounded-lg transition-colors",
                  activeTheme.toggleBtnHover
                )}
                title="Perbesar Navbar (Expand)"
                aria-label="Perbesar Navbar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area (Automatically Expands when Sidebar is Minimized) */}
      <main className="flex-1 overflow-y-auto w-full min-w-0 transition-all">
        {/* Desktop Brand Banner when Sidebar is Minimized so Company Name is always visible */}
        {settings.isMinimized && !isTopbarMode && (
          <div
            className={cn(
              "hidden md:flex items-center justify-between gap-4 px-6 lg:px-8 py-2.5 border-b transition-colors",
              activeTheme.headerBg,
              activeTheme.headerBorder
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <CompanyLogo
                iconUrl={companyIcon}
                companyName={companyName}
                className="w-8 h-8 rounded-lg shrink-0"
                alt={companyName}
              />
              <div className="min-w-0">
                <p className={cn("font-extrabold text-sm leading-snug break-words whitespace-normal", activeTheme.textLogo)}>
                  {companyName}
                </p>
                <p className={cn("text-[11px] font-medium leading-tight break-words whitespace-normal", activeTheme.textSub)}>
                  {companyTagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMinimized}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 whitespace-nowrap",
                activeTheme.toggleBtnHover,
                activeTheme.sidebarBorder
              )}
              title="Tampilkan Navbar Penuh"
            >
              <PanelLeftOpen size={14} />
              <span>Tampilkan Menu</span>
            </button>
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-5 md:py-6">
          {clockSettings.showClock && (
            <LiveClockWidget className="mb-4 sm:mb-5" />
          )}

          {view === "DASHBOARD" && (
            <Dashboard invoices={store.invoices} />
          )}

          {view === "INVOICE_HISTORY" && (
            <InvoiceHistory
              invoices={store.invoices}
              customers={store.customers}
              onDelete={store.deleteInvoice}
              onViewHistory={(invoice) => setHistoryInvoice(invoice)}
              onEdit={store.editInvoice}
            />
          )}

          {view === "BULK_INPUT_INVOICE" && (
            <BulkInputFaktur
              customers={store.customers}
              existingInvoiceNumbers={store.invoices.map((i) => i.invoiceNumber.toLowerCase())}
              onSave={(invoices) => {
                store.addInvoices(invoices);
                setView("DASHBOARD");
              }}
              onCancel={() => setView("DASHBOARD")}
            />
          )}

          {view === "CUSTOMERS" && (
            <Customers
              customers={store.customers}
              invoices={store.invoices}
              onAdd={store.addCustomer}
              onAddBulk={store.addCustomers}
              onUpdate={store.updateCustomer}
              onDelete={store.deleteCustomer}
              onSyncFromInvoices={store.syncCustomersFromInvoices}
            />
          )}

          {view === "PAYMENT_HISTORY" && (
            <PaymentHistory
              invoices={store.invoices}
              onEditPayment={store.editPayment}
              onDeletePayment={store.deletePayment}
            />
          )}

          {view === "REPORTS" && (
            <Reports
              invoices={store.invoices}
              customers={store.customers}
              companyProfile={store.companyProfile}
              onPayFaktur={(invoice) => setPaymentInvoice(invoice)}
              onBulkPay={(payments) => store.addBulkPayments(payments)}
            />
          )}

          {view === "SETTINGS" && (
            <Settings
              companyProfile={store.companyProfile}
              onUpdateCompanyProfile={store.updateCompanyProfile}
              onResetCompanyProfile={store.resetCompanyProfile}
              onRestore={store.restoreData}
              getBackupData={store.getBackupData}
              resetData={store.resetData}
              resetDueDates={store.resetDueDates}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={store.addPayment}
        />
      )}

      {historyInvoice && (
        <PaymentHistoryModal
          invoice={store.invoices.find((i) => i.id === historyInvoice.id) || null}
          onClose={() => setHistoryInvoice(null)}
          onEditPayment={store.editPayment}
          onDeletePayment={store.deletePayment}
        />
      )}

      {/* Mobile Bottom Navigation (3D Theme Matched) */}
      <nav
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 z-30 px-1 transition-colors",
          activeTheme.mobileBottomBg,
          activeTheme.mobileBottomBorder
        )}
      >
        {[
          { id: "DASHBOARD" as ViewState, icon: LayoutDashboard, label: "Home" },
          { id: "BULK_INPUT_INVOICE" as ViewState, icon: FilePlus, label: "Input" },
          { id: "INVOICE_HISTORY" as ViewState, icon: Files, label: "Faktur" },
          { id: "REPORTS" as ViewState, icon: PieChart, label: "Laporan" },
        ].map((item) => {
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full py-1 transition-all relative",
                isActive ? activeTheme.mobileActiveText : activeTheme.mobileInactiveText
              )}
            >
              <item.icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {isActive && (
                <span
                  className={cn(
                    "absolute bottom-1 w-6 h-1 rounded-full",
                    activeTheme.mobileActiveIndicator
                  )}
                />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full py-1 transition-all relative",
            isSidebarOpen ? activeTheme.mobileActiveText : activeTheme.mobileInactiveText
          )}
        >
          <Menu size={20} className={isSidebarOpen ? "stroke-[2.5]" : "stroke-[1.8]"} />
          <span className="text-[10px] mt-0.5">Menu</span>
          {isSidebarOpen && (
            <span
              className={cn(
                "absolute bottom-1 w-6 h-1 rounded-full",
                activeTheme.mobileActiveIndicator
              )}
            />
          )}
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <NavbarProvider>
      <ClockProvider>
        <AppContent />
      </ClockProvider>
    </NavbarProvider>
  );
}
