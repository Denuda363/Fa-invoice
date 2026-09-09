import React, { useState } from "react";
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
import {
  LayoutDashboard,
  FilePlus,
  Files,
  PieChart,
  FileText,
  Menu,
  X,
  Users,
  Settings as SettingsIcon,
  Receipt,
} from "lucide-react";
import { cn } from "./utils";

export default function App() {
  const store = useAppStore();
  const [view, setView] = useState<ViewState>("DASHBOARD");
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", id: "DASHBOARD" as ViewState, icon: LayoutDashboard },
    { name: "Input Faktur", id: "BULK_INPUT_INVOICE" as ViewState, icon: FilePlus },
    { name: "Riwayat Faktur", id: "INVOICE_HISTORY" as ViewState, icon: Files },
    { name: "Riwayat Pembayaran", id: "PAYMENT_HISTORY" as ViewState, icon: Receipt },
    { name: "Data Konsumen", id: "CUSTOMERS" as ViewState, icon: Users },
    { name: "Laporan Jatuh Tempo", id: "REPORTS" as ViewState, icon: PieChart },
    { name: "Pengaturan", id: "SETTINGS" as ViewState, icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans pb-16 md:pb-0">
      {/* Mobile Sidebar Backdrop (Only for 'More' menu now) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Desktop) & Sliding Menu (Mobile) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-out md:static md:translate-x-0 md:w-64",
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="/icon.jpg" alt="Logo" className="w-8 h-8 rounded-md object-cover hidden md:block" />
            <h1 className="font-bold text-gray-800 tracking-tight hidden md:block">AF Faktur</h1>
            <h1 className="font-bold text-lg text-gray-800 md:hidden">Menu Lainnya</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                view === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon size={18} className={view === item.id ? "text-white" : "text-gray-400"} />
              {item.name}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <PWAInstallButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
          {view === "DASHBOARD" && (
            <Dashboard
              invoices={store.invoices}
              onAddFaktur={() => setView("BULK_INPUT_INVOICE")}
            />
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
              existingInvoiceNumbers={store.invoices.map(i => i.invoiceNumber.toLowerCase())}
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
              onPayFaktur={(invoice) => setPaymentInvoice(invoice)}
              onBulkPay={(payments) => store.addBulkPayments(payments)}
            />
          )}

          {view === "SETTINGS" && (
            <Settings
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
          invoice={store.invoices.find(i => i.id === historyInvoice.id) || null}
          onClose={() => setHistoryInvoice(null)}
          onEditPayment={store.editPayment}
          onDeletePayment={store.deletePayment}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {[
          { id: "DASHBOARD" as ViewState, icon: LayoutDashboard, label: "Home" },
          { id: "BULK_INPUT_INVOICE" as ViewState, icon: FilePlus, label: "Input" },
          { id: "REPORTS" as ViewState, icon: PieChart, label: "Laporan" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              view === item.id ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <item.icon size={22} className={view === item.id ? "fill-blue-50/50" : ""} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
            isSidebarOpen ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>
    </div>
  );
}
