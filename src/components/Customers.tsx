import React, { useState, useMemo } from "react";
import { Customer, Invoice } from "../types";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  FileDown,
  RefreshCcw,
  Search,
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { CustomerAnalytics } from "./CustomerAnalytics";
import { formatCurrency } from "../utils";

interface CustomersProps {
  customers: Customer[];
  invoices?: Invoice[];
  onAdd: (name: string, phone?: string, address?: string, exportSeparateSheet?: boolean) => void;
  onAddBulk?: (customers: Omit<Customer, "id">[]) => void;
  onUpdate: (id: string, name: string, phone?: string, address?: string, exportSeparateSheet?: boolean) => void;
  onDelete: (id: string) => void;
  onSyncFromInvoices?: () => void;
}

export function Customers({ customers, invoices = [], onAdd, onAddBulk, onUpdate, onDelete, onSyncFromInvoices }: CustomersProps) {
  const [activeTab, setActiveTab] = useState<"TABLE" | "ANALYTICS">("TABLE");
  const [analyticsCustomerId, setAnalyticsCustomerId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HAS_DEBT" | "PAID" | "SEPARATE_SHEET" | "SAME_SHEET">("ALL");
  const [sortBy, setSortBy] = useState<"NAME_ASC" | "NAME_DESC" | "DEBT_DESC" | "DEBT_ASC" | "PAYMENT_DESC">("NAME_ASC");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", exportSeparateSheet: false });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Compute total utang and pembayaran per customer
  const customerDebtStats = useMemo(() => {
    const map: Record<string, { totalTagihan: number; totalPembayaran: number; sisaUtang: number; invoiceCount: number }> = {};
    
    invoices.forEach((inv) => {
      const key = inv.customerName.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { totalTagihan: 0, totalPembayaran: 0, sisaUtang: 0, invoiceCount: 0 };
      }
      map[key].totalTagihan += inv.totalAmount;
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      map[key].totalPembayaran += paid;
      map[key].invoiceCount += 1;
    });

    Object.values(map).forEach((item) => {
      item.sisaUtang = Math.max(0, item.totalTagihan - item.totalPembayaran);
    });

    return map;
  }, [invoices]);

  const openCustomerAnalytics = (customerId: string) => {
    setAnalyticsCustomerId(customerId);
    setActiveTab("ANALYTICS");
  };

  // Quick statistics counts for filter pills
  const counts = useMemo(() => {
    let hasDebt = 0;
    let paid = 0;
    let separateSheet = 0;

    customers.forEach((c) => {
      const stats = customerDebtStats[c.name.toLowerCase().trim()];
      if (stats && stats.sisaUtang > 0) {
        hasDebt++;
      } else {
        paid++;
      }
      if (c.exportSeparateSheet) {
        separateSheet++;
      }
    });

    return {
      all: customers.length,
      hasDebt,
      paid,
      separateSheet,
    };
  }, [customers, customerDebtStats]);

  // Combined Search and Filter Logic
  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // 1. Status Filter
    if (statusFilter === "HAS_DEBT") {
      result = result.filter((c) => {
        const stats = customerDebtStats[c.name.toLowerCase().trim()];
        return stats && stats.sisaUtang > 0;
      });
    } else if (statusFilter === "PAID") {
      result = result.filter((c) => {
        const stats = customerDebtStats[c.name.toLowerCase().trim()];
        return !stats || stats.sisaUtang === 0;
      });
    } else if (statusFilter === "SEPARATE_SHEET") {
      result = result.filter((c) => c.exportSeparateSheet === true);
    } else if (statusFilter === "SAME_SHEET") {
      result = result.filter((c) => !c.exportSeparateSheet);
    }

    // 2. Search Term Filter (Name, Phone, Address, keywords)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneMatch = c.phone ? c.phone.toLowerCase().includes(q) : false;
        const addressMatch = c.address ? c.address.toLowerCase().includes(q) : false;

        // Also match keywords like "utang", "lunas", "sheet"
        const stats = customerDebtStats[c.name.toLowerCase().trim()];
        const hasDebt = stats && stats.sisaUtang > 0;
        const debtKeywordMatch = (q === "utang" || q === "belum lunas" || q === "menunggak") && hasDebt;
        const paidKeywordMatch = (q === "lunas" || q === "bebas utang") && !hasDebt;
        const sheetKeywordMatch = (q === "sheet" || q === "pisah") && c.exportSeparateSheet;

        return nameMatch || phoneMatch || addressMatch || debtKeywordMatch || paidKeywordMatch || sheetKeywordMatch;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      const statsA = customerDebtStats[a.name.toLowerCase().trim()] || { sisaUtang: 0, totalPembayaran: 0 };
      const statsB = customerDebtStats[b.name.toLowerCase().trim()] || { sisaUtang: 0, totalPembayaran: 0 };

      if (sortBy === "NAME_ASC") {
        return a.name.localeCompare(b.name, "id");
      }
      if (sortBy === "NAME_DESC") {
        return b.name.localeCompare(a.name, "id");
      }
      if (sortBy === "DEBT_DESC") {
        return statsB.sisaUtang - statsA.sisaUtang;
      }
      if (sortBy === "DEBT_ASC") {
        return statsA.sisaUtang - statsB.sisaUtang;
      }
      if (sortBy === "PAYMENT_DESC") {
        return statsB.totalPembayaran - statsA.totalPembayaran;
      }
      return 0;
    });

    return result;
  }, [customers, statusFilter, searchTerm, sortBy, customerDebtStats]);

  const isFilterActive = searchTerm.trim() !== "" || statusFilter !== "ALL" || sortBy !== "NAME_ASC";
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setSortBy("NAME_ASC");
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
        exportSeparateSheet: customer.exportSeparateSheet || false,
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", address: "", exportSeparateSheet: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      onUpdate(editingCustomer.id, formData.name, formData.phone, formData.address, formData.exportSeparateSheet);
    } else {
      onAdd(formData.name, formData.phone, formData.address, formData.exportSeparateSheet);
    }
    closeModal();
  };

  const downloadTemplate = () => {
    const aoa = [
      ["NAMA KONSUMEN", "NO HP", "ALAMAT", "PISAH SHEET (TRUE/FALSE)"],
      ["CV Bintang Terang", "08123456789", "Jl. Raya Cikarang No 1", "TRUE"],
      ["Toko Makmur", "08198765432", "Pasar Induk", "FALSE"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Konsumen");
    XLSX.writeFile(wb, "Template_Import_Konsumen.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        
        // Skip header
        const rows = jsonData.slice(1);
        const newCustomers: Omit<Customer, "id">[] = [];
        let skipped = 0;

        rows.forEach(row => {
          if (!row || row.length === 0) return;
          const name = (row[0] || "").toString().trim();
          if (!name) return; // name is required
          
          // Check if already exists in the current list
          const exists = customers.some(c => c.name.toLowerCase() === name.toLowerCase());
          if (exists) {
            skipped++;
            return;
          }

          const phone = (row[1] || "").toString().trim();
          const address = (row[2] || "").toString().trim();
          const exportSeparateStr = (row[3] || "").toString().trim().toUpperCase();
          const exportSeparateSheet = exportSeparateStr === "TRUE";

          newCustomers.push({
            name,
            phone,
            address,
            exportSeparateSheet
          });
        });

        if (newCustomers.length > 0) {
          if (onAddBulk) {
            onAddBulk(newCustomers);
            alert(`Berhasil mengimpor ${newCustomers.length} konsumen baru. ${skipped > 0 ? `(${skipped} konsumen dilewati karena nama sudah ada)` : ""}`);
          } else {
             // Fallback to adding one by one if onAddBulk is somehow not provided
             newCustomers.forEach(c => onAdd(c.name, c.phone, c.address, c.exportSeparateSheet));
             alert(`Berhasil mengimpor ${newCustomers.length} konsumen baru. ${skipped > 0 ? `(${skipped} konsumen dilewati karena nama sudah ada)` : ""}`);
          }
        } else {
          alert(skipped > 0 ? `Semua konsumen dalam file sudah ada di sistem (${skipped} dilewati).` : "Tidak ada data konsumen valid ditemukan.");
        }
      } catch (err) {
        console.error(err);
        alert("Gagal membaca file Excel.");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Konsumen</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola master data pelanggan, grafik pembayaran vs utang, serta tren MoM.</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setActiveTab("TABLE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "TABLE"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users size={16} />
            <span>Master Konsumen</span>
            <span className="text-[11px] bg-gray-200/80 text-gray-700 px-1.5 py-0.5 rounded-full font-bold">
              {customers.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("ANALYTICS");
              setAnalyticsCustomerId("ALL");
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === "ANALYTICS"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart2 size={16} />
            <span>Grafik & Tren</span>
            <span className="text-[11px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
              MoM
            </span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: ANALYTICS */}
      {activeTab === "ANALYTICS" ? (
        <CustomerAnalytics
          customers={customers}
          invoices={invoices}
          initialCustomerId={analyticsCustomerId}
          onBackToTable={() => setActiveTab("TABLE")}
        />
      ) : (
        /* RENDER VIEW: TABLE & MANAGEMENT */
        <>
          {/* SEARCH, FILTER, SORT & ACTIONS TOOLBAR */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
            {/* Top Toolbar Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search & Select Filters */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Input with Clear Button */}
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari konsumen (nama, telepon, alamat, status)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                      title="Hapus pencarian"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <Filter size={15} className="text-gray-500 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-gray-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="HAS_DEBT">Ada Utang (Belum Lunas)</option>
                    <option value="PAID">Lunas (Bebas Utang)</option>
                    <option value="SEPARATE_SHEET">Pisah Sheet Excel</option>
                    <option value="SAME_SHEET">Gabung Sheet Excel</option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                  <ArrowUpDown size={15} className="text-gray-500 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs sm:text-sm font-semibold text-gray-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="NAME_ASC">Nama (A - Z)</option>
                    <option value="NAME_DESC">Nama (Z - A)</option>
                    <option value="DEBT_DESC">Sisa Utang Terbesar</option>
                    <option value="DEBT_ASC">Sisa Utang Terkecil</option>
                    <option value="PAYMENT_DESC">Pembayaran Terbanyak</option>
                  </select>
                </div>

                {/* Reset Filter Button if active */}
                {isFilterActive && (
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-colors"
                    title="Reset semua filter dan pencarian"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Action Buttons: Template, Import, Sync, Tambah */}
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-600/70 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  <FileDown size={16} />
                  <span>Template</span>
                </button>
                <div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    ref={fileInputRef}
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                  >
                    <Upload size={16} />
                    <span>Import</span>
                  </button>
                </div>
                {onSyncFromInvoices && (
                  <button
                    onClick={onSyncFromInvoices}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-600/70 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
                  >
                    <RefreshCcw size={16} />
                    <span>Sync Faktur</span>
                  </button>
                )}
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                >
                  <Plus size={16} />
                  <span>Tambah Konsumen</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Pill Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
                  <Filter size={12} /> Filter Cepat:
                </span>
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>Semua</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}>
                    {counts.all}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("HAS_DEBT")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "HAS_DEBT"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100"
                  }`}
                >
                  <AlertCircle size={12} />
                  <span>Ada Utang</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === "HAS_DEBT" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-800"
                  }`}>
                    {counts.hasDebt}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("PAID")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "PAID"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 size={12} />
                  <span>Lunas</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === "PAID" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-800"
                  }`}>
                    {counts.paid}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter("SEPARATE_SHEET")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === "SEPARATE_SHEET"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "bg-purple-50 text-purple-700 border border-purple-200/60 hover:bg-purple-100"
                  }`}
                >
                  <Layers size={12} />
                  <span>Pisah Sheet Excel</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === "SEPARATE_SHEET" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"
                  }`}>
                    {counts.separateSheet}
                  </span>
                </button>
              </div>

              {/* Status Text & Result Info */}
              <div className="text-xs text-gray-500 font-medium">
                Menampilkan <strong className="text-gray-900">{filteredCustomers.length}</strong> dari <strong className="text-gray-900">{customers.length}</strong> konsumen
                {isFilterActive && (
                  <span className="ml-1 text-blue-600 font-semibold">(Filter Aktif)</span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama Konsumen</th>
                    <th className="px-4 py-3 font-medium">Nomor Telepon</th>
                    <th className="px-4 py-3 font-medium">Sisa Utang</th>
                    <th className="px-4 py-3 font-medium">Total Pembayaran</th>
                    <th className="px-4 py-3 font-medium">Alamat</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users size={44} className="text-gray-300" />
                          <p className="font-semibold text-gray-700 text-base">
                            {customers.length === 0
                              ? "Belum ada data konsumen."
                              : "Tidak ditemukan konsumen yang cocok."}
                          </p>
                          {isFilterActive && (
                            <p className="text-xs text-gray-400 max-w-sm">
                              Coba ubah kata kunci pencarian atau reset filter untuk menampilkan data konsumen lainnya.
                            </p>
                          )}
                          {isFilterActive && (
                            <button
                              onClick={resetFilters}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <RotateCcw size={13} />
                              <span>Reset Pencarian & Filter</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const stats = customerDebtStats[c.name.toLowerCase().trim()] || {
                        sisaUtang: 0,
                        totalPembayaran: 0,
                        totalTagihan: 0,
                      };

                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{c.name}</span>
                              {c.exportSeparateSheet && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/70 px-1.5 py-0.5 rounded"
                                  title="Konsumen ini otomatis dibuatkan sheet terpisah saat export Excel"
                                >
                                  <Layers size={10} />
                                  Pisah Sheet
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{c.phone || "-"}</td>
                          <td className="px-4 py-4">
                            {stats.sisaUtang > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md text-xs">
                                <AlertCircle size={12} />
                                {formatCurrency(stats.sisaUtang)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs font-semibold">Rp 0 (Lunas)</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-emerald-700 text-xs">
                              {formatCurrency(stats.totalPembayaran)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500 max-w-xs truncate">{c.address || "-"}</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => openCustomerAnalytics(c.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                title="Lihat Grafik Perbandingan Pembayaran vs Utang & Tren Bulan ke Bulan"
                              >
                                <BarChart2 size={14} />
                                <span>Grafik & Tren</span>
                              </button>
                              <button
                                onClick={() => openModal(c)}
                                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Apakah Anda yakin ingin menghapus konsumen ini?")) {
                                    onDelete(c.id);
                                  }
                                }}
                                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCustomer ? "Edit Konsumen" : "Tambah Konsumen"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Konsumen *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Alamat</label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exportSeparateSheet"
                  checked={formData.exportSeparateSheet}
                  onChange={(e) => setFormData({ ...formData, exportSeparateSheet: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="exportSeparateSheet" className="text-sm font-medium text-gray-700">
                  Rekap di sheet terpisah saat export laporan
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
