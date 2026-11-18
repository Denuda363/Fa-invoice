import React, { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCcw,
  Trash2,
  Building2,
  Palette,
  Clock,
  Database,
  BookOpen,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  SlidersHorizontal,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { CompanyProfile } from "../types";
import { UserGuide } from "./UserGuide";
import { NavbarSettingsPanel } from "./NavbarSettingsPanel";
import { ClockSettingsPanel } from "./ClockSettingsPanel";
import { CompanyProfilePanel } from "./CompanyProfilePanel";
import { AboutApp } from "./AboutApp";
import { useNavbar } from "../context/NavbarContext";
import { useClock } from "../context/ClockContext";

type SettingsTabId = "profil" | "navbar" | "jam" | "data" | "panduan" | "tentang";

interface SettingsProps {
  companyProfile: CompanyProfile;
  onUpdateCompanyProfile: (profile: CompanyProfile) => void;
  onResetCompanyProfile: () => void;
  onRestore: (jsonData: string) => boolean;
  getBackupData: () => string;
  resetData: () => void;
  resetDueDates: () => void;
}

interface PendingConfirm {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "warning" | "primary";
  onConfirm: () => void;
}

export function Settings({
  companyProfile,
  onUpdateCompanyProfile,
  onResetCompanyProfile,
  onRestore,
  getBackupData,
  resetData,
  resetDueDates,
}: SettingsProps) {
  const { activeTheme } = useNavbar();
  const { activeClockMeta } = useClock();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("profil");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputExcelRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const tabs: {
    id: SettingsTabId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { id: "profil", label: "Profil", icon: Building2 },
    { id: "navbar", label: "Tema 3D", icon: Palette },
    { id: "jam", label: "Gaya Jam", icon: Clock },
    { id: "data", label: "Backup & Data", icon: Database },
    { id: "panduan", label: "Panduan", icon: BookOpen },
    { id: "tentang", label: "Tentang", icon: Info },
  ];

  const handleBackup = () => {
    const data = getBackupData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_faktur_app_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback("success", "File backup JSON berhasil diunduh.");
  };

  const handleBackupExcel = () => {
    try {
      const dataStr = getBackupData();
      const data = JSON.parse(dataStr);
      const wb = XLSX.utils.book_new();

      const customersAoa = [["id", "name", "phone", "address", "exportSeparateSheet"]];
      (data.customers || []).forEach((c: any) => {
        customersAoa.push([
          c.id,
          c.name,
          c.phone || "",
          c.address || "",
          c.exportSeparateSheet ? "true" : "false",
        ]);
      });

      const invoicesAoa = [
        ["id", "invoiceNumber", "customerName", "date", "dueDate", "totalAmount", "status"],
      ];
      const paymentsAoa = [["id", "invoiceId", "date", "amount"]];

      (data.invoices || []).forEach((inv: any) => {
        invoicesAoa.push([
          inv.id,
          inv.invoiceNumber,
          inv.customerName,
          inv.date,
          inv.dueDate,
          inv.totalAmount,
          inv.status,
        ]);
        (inv.payments || []).forEach((p: any) => {
          paymentsAoa.push([p.id, inv.id, p.date, p.amount]);
        });
      });

      const wsCustomers = XLSX.utils.aoa_to_sheet(customersAoa);
      const wsInvoices = XLSX.utils.aoa_to_sheet(invoicesAoa);
      const wsPayments = XLSX.utils.aoa_to_sheet(paymentsAoa);

      wsCustomers["!cols"] = [
        { wch: 36 },
        { wch: 25 },
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
      ];
      wsInvoices["!cols"] = [
        { wch: 36 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
      ];
      wsPayments["!cols"] = [
        { wch: 36 },
        { wch: 36 },
        { wch: 12 },
        { wch: 15 },
      ];

      XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers");
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices");
      XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

      XLSX.writeFile(wb, `backup_faktur_app_${new Date().toISOString().split("T")[0]}.xlsx`);
      showFeedback("success", "File backup Excel berhasil diunduh.");
    } catch (err) {
      console.error(err);
      showFeedback("error", "Terjadi kesalahan saat membackup ke Excel.");
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPendingConfirm({
          title: "Konfirmasi Restore JSON",
          message:
            "Restore data dari file JSON akan menimpa seluruh data faktur, pembayaran, dan konsumen saat ini. Lanjutkan?",
          confirmLabel: "Ya, Pulihkan Data",
          variant: "primary",
          onConfirm: () => {
            const success = onRestore(content);
            if (success) {
              showFeedback("success", "Data dari file JSON berhasil dipulihkan.");
            } else {
              showFeedback("error", "Gagal memulihkan data. Format file JSON tidak valid.");
            }
          },
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });

        const wsCustomers = wb.Sheets["Customers"];
        const wsInvoices = wb.Sheets["Invoices"];
        const wsPayments = wb.Sheets["Payments"];

        if (!wsCustomers || !wsInvoices) {
          showFeedback(
            "error",
            "Format file Excel tidak valid. Sheet Customers atau Invoices tidak ditemukan."
          );
          return;
        }

        const customersRaw: any[] = XLSX.utils.sheet_to_json(wsCustomers);
        const invoicesRaw: any[] = XLSX.utils.sheet_to_json(wsInvoices);
        const paymentsRaw: any[] = wsPayments ? XLSX.utils.sheet_to_json(wsPayments) : [];

        const customers = customersRaw.map((c) => ({
          id: String(c.id),
          name: String(c.name),
          phone: c.phone && c.phone !== "undefined" ? String(c.phone) : "",
          address: c.address && c.address !== "undefined" ? String(c.address) : "",
          exportSeparateSheet:
            c.exportSeparateSheet === "true" || c.exportSeparateSheet === true,
        }));

        const paymentsMap: Record<string, any[]> = {};
        paymentsRaw.forEach((p) => {
          const invId = String(p.invoiceId);
          if (!paymentsMap[invId]) paymentsMap[invId] = [];
          paymentsMap[invId].push({
            id: String(p.id),
            date: String(p.date),
            amount: Number(p.amount),
          });
        });

        const invoices = invoicesRaw.map((inv) => ({
          id: String(inv.id),
          invoiceNumber: String(inv.invoiceNumber),
          customerName: String(inv.customerName),
          date: String(inv.date),
          dueDate: String(inv.dueDate),
          totalAmount: Number(inv.totalAmount),
          status: String(inv.status),
          payments: paymentsMap[String(inv.id)] || [],
        }));

        const appData = { customers, invoices };

        setPendingConfirm({
          title: "Konfirmasi Restore Excel",
          message:
            "Restore data dari file Excel akan menggantikan seluruh data saat ini. Pastikan Anda sudah membackup data sebelumnya.",
          confirmLabel: "Ya, Pulihkan Excel",
          variant: "primary",
          onConfirm: () => {
            const success = onRestore(JSON.stringify(appData));
            if (success) {
              showFeedback("success", "Data dari file Excel berhasil dipulihkan.");
            } else {
              showFeedback("error", "Gagal memulihkan data. Format isi Excel tidak valid.");
            }
          },
        });
      } catch (err) {
        console.error(err);
        showFeedback("error", "Terjadi kesalahan saat membaca file Excel.");
      }

      if (fileInputExcelRef.current) {
        fileInputExcelRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResetDueDatesClick = () => {
    setPendingConfirm({
      title: "Reset Tanggal Jatuh Tempo",
      message:
        "Apakah Anda yakin ingin mengatur ulang semua tanggal jatuh tempo faktur menjadi 30 hari setelah tanggal faktur?",
      confirmLabel: "Ya, Atur Ulang",
      variant: "warning",
      onConfirm: () => {
        resetDueDates();
        showFeedback("success", "Tanggal jatuh tempo seluruh faktur berhasil diatur ulang.");
      },
    });
  };

  const handleResetDataClick = () => {
    setPendingConfirm({
      title: "Hapus Semua Data Permanen",
      message:
        "PERINGATAN: Semua data faktur, riwayat pembayaran, dan data konsumen akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Ya, Reset Semua Data",
      variant: "danger",
      onConfirm: () => {
        resetData();
        showFeedback("success", "Seluruh data transaksi berhasil direset.");
      },
    });
  };

  return (
    <div className="space-y-5 w-full max-w-6xl mx-auto">
      {/* Header + 3D Tab Navigation Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_4px_0_#020617,0_8px_16px_-4px_rgba(15,23,42,0.3)]">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Pengaturan Aplikasi
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                Kelola profil usaha, tema 3D, gaya jam realtime, cadangan data, dan informasi sistem dalam tab terstruktur.
              </p>
            </div>
          </div>

          {/* Unboxed context summary */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 lg:text-right">
            <span className="font-semibold text-slate-700">{companyProfile.name || "AF Faktur"}</span>
            <span aria-hidden="true">·</span>
            <span>{activeTheme.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeClockMeta.name}</span>
          </div>
        </div>

        {/* Tactile 3D Tab Selector Bar */}
        <div
          role="tablist"
          aria-label="Kategori Pengaturan"
          className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-xl bg-slate-100/90 border border-slate-200/90"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[42px] rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap shrink-0 flex-1 sm:flex-initial ${
                  isActive
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-b-[3px] border-blue-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_4px_10px_-2px_rgba(37,99,235,0.35)] -translate-y-0.5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inline Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Active Tab Panel */}
      <div role="tabpanel" className="w-full">
        {activeTab === "profil" && (
          <CompanyProfilePanel
            profile={companyProfile}
            onSave={onUpdateCompanyProfile}
            onReset={onResetCompanyProfile}
          />
        )}

        {activeTab === "navbar" && (
          <NavbarSettingsPanel companyProfile={companyProfile} />
        )}

        {activeTab === "jam" && <ClockSettingsPanel />}

        {activeTab === "data" && (
          <div className="space-y-5">
            {/* Row 1: JSON & Excel Backup side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Backup & Restore JSON */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#1e40af]">
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Backup & Restore (JSON)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cadangan lengkap seluruh data aplikasi dalam format JSON.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Unduh file JSON untuk menyimpan arsip aman di perangkat Anda, atau pulihkan kembali kapan saja.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleBackup}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 border-b-[3px] border-b-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Download size={16} />
                    <span>Backup JSON</span>
                  </button>

                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleRestore}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
                    >
                      <Upload size={16} />
                      <span>Restore JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Excel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#065f46]">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Backup & Restore (Excel)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Format spreadsheet (.xlsx) yang mudah dibuka di Microsoft Excel.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Ekspor tabel konsumen, faktur, dan riwayat pembayaran ke Excel, atau impor kembali dari file backup Excel.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleBackupExcel}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 border-b-[3px] border-b-slate-400 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    <span>Backup Excel</span>
                  </button>

                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      ref={fileInputExcelRef}
                      onChange={handleRestoreExcel}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputExcelRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
                    >
                      <Upload size={16} />
                      <span>Restore Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Maintenance & Danger Zone side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Pemeliharaan Data */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#9a3412]">
                      <RefreshCcw size={18} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Pemeliharaan Jatuh Tempo
                      </h3>
                      <p className="text-xs text-slate-500">Termin standar 30 hari</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Atur ulang tanggal jatuh tempo pada seluruh faktur otomatis menjadi 30 hari setelah tanggal faktur.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleResetDueDatesClick}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 w-full sm:w-auto transition-all"
                  >
                    <RefreshCcw size={16} />
                    <span>Reset Tanggal Jatuh Tempo</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-rose-200 border-b-[4px] border-b-rose-300 bg-rose-50/70 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#991b1b]">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-rose-900">
                        Danger Zone
                      </h3>
                      <p className="text-xs text-rose-700">Penghapusan data permanen</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-700 leading-relaxed">
                    Tindakan ini akan menghapus seluruh faktur, pembayaran, dan konsumen. Pastikan Anda sudah membuat backup sebelum reset.
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleResetDataClick}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 w-full sm:w-auto transition-all"
                  >
                    <Trash2 size={16} />
                    <span>Reset Semua Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "panduan" && <UserGuide />}

        {activeTab === "tentang" && <AboutApp />}
      </div>

      {/* Confirmation Modal */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPendingConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    pendingConfirm.variant === "danger"
                      ? "bg-rose-100 text-rose-600"
                      : pendingConfirm.variant === "warning"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {pendingConfirm.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {pendingConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingConfirm.onConfirm;
                  setPendingConfirm(null);
                  action();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all ${
                  pendingConfirm.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : pendingConfirm.variant === "warning"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
