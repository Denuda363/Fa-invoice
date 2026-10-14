import React, { useState, useMemo } from "react";
import { Customer, Invoice } from "../types";
import { formatCurrency } from "../utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Filter,
  PieChart,
  Layers,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface CustomerAnalyticsProps {
  customers: Customer[];
  invoices: Invoice[];
  initialCustomerId?: string;
  onBackToTable?: () => void;
}

export function CustomerAnalytics({
  customers,
  invoices,
  initialCustomerId,
  onBackToTable,
}: CustomerAnalyticsProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || "ALL"
  );
  const [timeRange, setTimeRange] = useState<"6m" | "12m" | "all">("6m");
  const [chartMetricView, setChartMetricView] = useState<"ALL" | "FAKTUR_VS_BAYAR" | "BAYAR_VS_UTANG">("ALL");
  const [allCustomerGraphMode, setAllCustomerGraphMode] = useState<"monthly" | "by_customer">("monthly");
  const [searchFilter, setSearchFilter] = useState("");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<"ALL" | "DEBT" | "PAID">("ALL");

  // Customer options
  const selectedCustomer = useMemo(() => {
    if (selectedCustomerId === "ALL") return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Invoices filtered by customer
  const filteredInvoices = useMemo(() => {
    if (!selectedCustomer) {
      return invoices;
    }
    const targetName = selectedCustomer.name.toLowerCase().trim();
    return invoices.filter(
      (inv) => inv.customerName.toLowerCase().trim() === targetName
    );
  }, [invoices, selectedCustomer]);

  // Overall calculations for current selection
  const overallStats = useMemo(() => {
    let totalTagihan = 0;
    let totalPembayaran = 0;

    filteredInvoices.forEach((inv) => {
      totalTagihan += inv.totalAmount;
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      totalPembayaran += paid;
    });

    const totalUtang = Math.max(0, totalTagihan - totalPembayaran);
    const rasioLunas =
      totalTagihan > 0 ? (totalPembayaran / totalTagihan) * 100 : 0;

    return {
      totalTagihan,
      totalPembayaran,
      totalUtang,
      rasioLunas,
      jumlahFaktur: filteredInvoices.length,
    };
  }, [filteredInvoices]);

  // Helper to extract "yyyy-MM" safely
  const getMonthKey = (dateStr?: string) => {
    if (!dateStr) return "";
    const trimmed = dateStr.trim();
    if (trimmed.length >= 7 && /^\d{4}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 7);
    }
    try {
      const d = parseISO(trimmed);
      if (!isNaN(d.getTime())) {
        return format(d, "yyyy-MM");
      }
    } catch {}
    return "";
  };

  // Month-by-month analysis (MoM)
  // Perhitungan grafik bulanan dari data:
  // - Total nominal faktur per bulan (contoh: Jan Rp 5.000.000, Feb Rp 6.000.000)
  // - Total pembayaran per bulan (contoh: Jan Rp 3.000.000, Feb Rp 4.000.000)
  // - Sisa utang timbul pada bulan tersebut (Tagihan - Pembayaran)
  const monthlyData = useMemo(() => {
    // 1. Kumpulkan semua bulan yang ada transaksi faktur atau pembayaran
    const discoveredMonths = new Set<string>();

    filteredInvoices.forEach((inv) => {
      const invMonth = getMonthKey(inv.date);
      if (invMonth) discoveredMonths.add(invMonth);

      inv.payments.forEach((p) => {
        const pMonth = getMonthKey(p.date) || invMonth;
        if (pMonth) discoveredMonths.add(pMonth);
      });
    });

    const today = new Date();
    const currentMonthKey = format(today, "yyyy-MM");
    discoveredMonths.add(currentMonthKey);

    // Tambahkan bulan-bulan bergulir standar (rolling calendar)
    const rollingCount = timeRange === "6m" ? 6 : timeRange === "12m" ? 12 : 24;
    for (let i = 0; i < rollingCount; i++) {
      const d = subMonths(today, i);
      discoveredMonths.add(format(d, "yyyy-MM"));
    }

    // Urutkan bulan secara kronologis (dari bulan lama ke bulan terbaru)
    const allSortedKeys = Array.from(discoveredMonths).sort();

    // Tentukan bulan yang akan ditampilkan di grafik
    let monthKeys: string[] = [];

    if (timeRange === "all") {
      monthKeys = allSortedKeys;
    } else {
      // Cari bulan yang benar-benar memiliki data faktur atau pembayaran
      const activeMonthsWithData = allSortedKeys.filter((m) => {
        return filteredInvoices.some((inv) => {
          const invM = getMonthKey(inv.date);
          if (invM === m) return true;
          return inv.payments.some((p) => (getMonthKey(p.date) || invM) === m);
        });
      });

      const maxWindow = timeRange === "6m" ? 6 : 12;

      // Jika data aktif ada dan muat dalam window waktu, tampilkan data aktif tersebut
      if (activeMonthsWithData.length > 0 && activeMonthsWithData.length <= maxWindow) {
        const earliest = activeMonthsWithData[0];
        const startIdx = allSortedKeys.indexOf(earliest);
        const candidateSlice = allSortedKeys.slice(Math.max(0, startIdx));
        if (candidateSlice.length <= maxWindow) {
          monthKeys = candidateSlice;
        } else {
          monthKeys = candidateSlice.slice(0, maxWindow);
        }
      } else {
        monthKeys = allSortedKeys.slice(-maxWindow);
      }
    }

    if (monthKeys.length === 0) {
      monthKeys = [currentMonthKey];
    }

    // Accumulators per bulan
    const agg: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        tagihan: number; // Total nominal faktur
        pembayaran: number; // Total pembayaran
        fakturCount: number;
      }
    > = {};

    monthKeys.forEach((key) => {
      const [year, month] = key.split("-").map(Number);
      const d = new Date(year, (month || 1) - 1, 1);
      const label = format(d, "MMM yyyy", { locale: id });
      agg[key] = {
        monthKey: key,
        monthLabel: label,
        tagihan: 0,
        pembayaran: 0,
        fakturCount: 0,
      };
    });

    // Agregasi Faktur dan Pembayaran ke masing-masing bulan
    filteredInvoices.forEach((inv) => {
      const invKey = getMonthKey(inv.date);
      if (agg[invKey]) {
        agg[invKey].tagihan += inv.totalAmount;
        agg[invKey].fakturCount += 1;
      }

      // Agregasi pembayaran
      inv.payments.forEach((p) => {
        const pKey = getMonthKey(p.date) || invKey;
        if (agg[pKey]) {
          agg[pKey].pembayaran += p.amount;
        }
      });
    });

    // Hitung sisa utang dan MoM (Month over Month deltas)
    const rawList = monthKeys.map((k) => agg[k]);
    const result: Array<{
      monthKey: string;
      monthLabel: string;
      tagihan: number; // Total nominal faktur
      pembayaran: number; // Total pembayaran
      sisaUtangBulan: number; // Sisa utang di bulan tersebut (Tagihan - Pembayaran)
      rasioLunasBulan: number;
      fakturCount: number;
      // MoM Tagihan
      tagihanDiff: number;
      tagihanPercent: number;
      // MoM Pembayaran
      pembayaranDiff: number;
      pembayaranPercent: number;
    }> = [];

    for (let i = 0; i < rawList.length; i++) {
      const current = rawList[i];
      const prev = i > 0 ? rawList[i - 1] : null;

      const sisaUtangBulan = Math.max(0, current.tagihan - current.pembayaran);
      const rasioLunasBulan =
        current.tagihan > 0
          ? (current.pembayaran / current.tagihan) * 100
          : current.pembayaran > 0
          ? 100
          : 0;

      let tagihanDiff = 0;
      let tagihanPercent = 0;
      let pembayaranDiff = 0;
      let pembayaranPercent = 0;

      if (prev) {
        tagihanDiff = current.tagihan - prev.tagihan;
        if (prev.tagihan > 0) {
          tagihanPercent = (tagihanDiff / prev.tagihan) * 100;
        } else if (current.tagihan > 0) {
          tagihanPercent = 100;
        }

        pembayaranDiff = current.pembayaran - prev.pembayaran;
        if (prev.pembayaran > 0) {
          pembayaranPercent = (pembayaranDiff / prev.pembayaran) * 100;
        } else if (current.pembayaran > 0) {
          pembayaranPercent = 100;
        }
      }

      result.push({
        ...current,
        sisaUtangBulan,
        rasioLunasBulan,
        tagihanDiff,
        tagihanPercent,
        pembayaranDiff,
        pembayaranPercent,
      });
    }

    return result;
  }, [filteredInvoices, timeRange]);

  // Latest MoM trend metrics (comparing last month with the month before)
  const latestMoM = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const currentMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData[monthlyData.length - 2];

    return {
      currentLabel: currentMonth.monthLabel,
      prevLabel: prevMonth.monthLabel,
      // Pembayaran
      currentPembayaran: currentMonth.pembayaran,
      pembayaranDiff: currentMonth.pembayaranDiff,
      pembayaranPercent: currentMonth.pembayaranPercent,
      // Utang / Tagihan
      currentTagihan: currentMonth.tagihan,
      tagihanDiff: currentMonth.tagihanDiff,
      tagihanPercent: currentMonth.tagihanPercent,
    };
  }, [monthlyData]);

  // Top Customers Comparison Data (when "ALL" is selected)
  const customerComparisonData = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        customerId?: string;
        tagihan: number;
        pembayaran: number;
        utang: number;
        fakturCount: number;
      }
    > = {};

    customers.forEach((c) => {
      map[c.name.toLowerCase().trim()] = {
        name: c.name,
        customerId: c.id,
        tagihan: 0,
        pembayaran: 0,
        utang: 0,
        fakturCount: 0,
      };
    });

    invoices.forEach((inv) => {
      const key = inv.customerName.toLowerCase().trim();
      if (!map[key]) {
        map[key] = {
          name: inv.customerName,
          tagihan: 0,
          pembayaran: 0,
          utang: 0,
          fakturCount: 0,
        };
      }
      map[key].tagihan += inv.totalAmount;
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      map[key].pembayaran += paid;
      map[key].fakturCount += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        utang: Math.max(0, item.tagihan - item.pembayaran),
      }))
      .filter((item) => item.tagihan > 0 || item.pembayaran > 0)
      .sort((a, b) => b.utang - a.utang); // Highest debt first
  }, [customers, invoices]);

  // Filtered customer list for dropdown search
  const filteredCustomerList = useMemo(() => {
    if (!searchFilter.trim()) return customers;
    const q = searchFilter.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, searchFilter]);

  // Filtered customer matrix data with search & status
  const filteredMatrixData = useMemo(() => {
    let result = customerComparisonData;

    if (matrixStatusFilter === "DEBT") {
      result = result.filter((item) => item.utang > 0);
    } else if (matrixStatusFilter === "PAID") {
      result = result.filter((item) => item.utang === 0);
    }

    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase().trim();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    return result;
  }, [customerComparisonData, matrixStatusFilter, matrixSearch]);

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthItem = monthlyData.find(
        (m) => m.monthLabel === label || m.monthKey === label
      );

      return (
        <div className="bg-white p-3.5 border border-gray-200 rounded-xl shadow-lg text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
            <span className="font-bold text-gray-900 text-sm">{label}</span>
            {monthItem && monthItem.fakturCount > 0 && (
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {monthItem.fakturCount} Faktur
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {payload.map((item: any, idx: number) => {
              return (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: item.color }}>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}:
                  </span>
                  <span className="font-bold text-gray-800">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              );
            })}
          </div>

          {monthItem && (
            <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-500">
              <div className="flex items-center justify-between">
                <span>Sisa Utang Bulan Ini:</span>
                <span className={`font-bold ${monthItem.sisaUtangBulan > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {formatCurrency(monthItem.sisaUtangBulan)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tingkat Pelunasan:</span>
                <span className={`font-bold ${monthItem.rasioLunasBulan >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                  {monthItem.rasioLunasBulan.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <BarChart2 size={20} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Analisis & Grafik Konsumen
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              {selectedCustomer
                ? `Grafik & Tren: ${selectedCustomer.name}`
                : "Grafik Perbandingan & Tren Semua Konsumen"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Pantau perbandingan total pembayaran vs utang serta pertumbuhan naik-turun dari bulan ke bulan.
            </p>
          </div>

          {/* Customer Selection & Time Range */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Customer Search & Dropdown Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari konsumen..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    title="Hapus pencarian"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="w-full sm:w-56">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">🌟 Semua Konsumen ({filteredCustomerList.length})</option>
                  {filteredCustomerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Range Pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeRange("6m")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === "6m"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                6 Bulan
              </button>
              <button
                onClick={() => setTimeRange("12m")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === "12m"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                12 Bulan
              </button>
              <button
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeRange === "all"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Semua
              </button>
            </div>

            {onBackToTable && (
              <button
                onClick={onBackToTable}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Daftar Tabel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Pembayaran, Utang, & MoM Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pembayaran */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Pembayaran
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">
            {formatCurrency(overallStats.totalPembayaran)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <span>Tingkat Pelunasan:</span>
            <span className="font-bold text-emerald-600">
              {overallStats.rasioLunas.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallStats.rasioLunas)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Total Utang / Piutang */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs relative overflow-hidden group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Sisa Utang / Piutang
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">
            {formatCurrency(overallStats.totalUtang)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Dari total tagihan{" "}
            <span className="font-semibold text-gray-700">
              {formatCurrency(overallStats.totalTagihan)}
            </span>
          </div>
        </div>

        {/* Card 3: Tren Pembayaran MoM */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tren Pembayaran (MoM)
            </span>
            <div
              className={`p-2 rounded-xl ${
                !latestMoM || latestMoM.pembayaranDiff >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {!latestMoM || latestMoM.pembayaranDiff >= 0 ? (
                <TrendingUp size={18} />
              ) : (
                <TrendingDown size={18} />
              )}
            </div>
          </div>
          {latestMoM ? (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-lg sm:text-xl font-black ${
                    latestMoM.pembayaranDiff >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {latestMoM.pembayaranDiff >= 0 ? "+" : ""}
                  {formatCurrency(latestMoM.pembayaranDiff)}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    latestMoM.pembayaranDiff >= 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {latestMoM.pembayaranDiff >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(latestMoM.pembayaranPercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {latestMoM.currentLabel} vs {latestMoM.prevLabel}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Data bulan belum cukup</p>
          )}
        </div>

        {/* Card 4: Tren Utang / Tagihan Baru MoM */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tren Utang Baru (MoM)
            </span>
            <div
              className={`p-2 rounded-xl ${
                !latestMoM || latestMoM.tagihanDiff <= 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {!latestMoM || latestMoM.tagihanDiff <= 0 ? (
                <TrendingDown size={18} />
              ) : (
                <TrendingUp size={18} />
              )}
            </div>
          </div>
          {latestMoM ? (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-lg sm:text-xl font-black ${
                    latestMoM.tagihanDiff > 0 ? "text-amber-600" : "text-blue-600"
                  }`}
                >
                  {latestMoM.tagihanDiff >= 0 ? "+" : ""}
                  {formatCurrency(latestMoM.tagihanDiff)}
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    latestMoM.tagihanDiff > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {latestMoM.tagihanDiff >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(latestMoM.tagihanPercent).toFixed(1)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Tagihan baru ({latestMoM.currentLabel})
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2">Data bulan belum cukup</p>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Grafik Perbandingan Faktur, Pembayaran & Utang Per Bulan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" />
                {selectedCustomer
                  ? `Grafik Bulanan: ${selectedCustomer.name}`
                  : allCustomerGraphMode === "monthly"
                  ? "Grafik Bulanan: Konsolidasi Seluruh Konsumen"
                  : "Perbandingan Utang Antar Konsumen"}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedCustomer
                  ? "Data per bulan: total nominal faktur, pembayaran, dan sisa utang"
                  : allCustomerGraphMode === "monthly"
                  ? "Data per bulan: akumulasi total nominal faktur terbit vs pembayaran"
                  : "Ranking 8 konsumen dengan sisa utang terbesar"}
              </p>
            </div>

            {/* Toggle Mode for All Customers: Per Bulan vs Antar Konsumen */}
            {!selectedCustomer && (
              <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                <button
                  onClick={() => setAllCustomerGraphMode("monthly")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    allCustomerGraphMode === "monthly"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Per Bulan
                </button>
                <button
                  onClick={() => setAllCustomerGraphMode("by_customer")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    allCustomerGraphMode === "by_customer"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Antar Konsumen
                </button>
              </div>
            )}
          </div>

          {/* Metric Selector Pills & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
            {/* Metric Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200/60">
              <button
                onClick={() => setChartMetricView("ALL")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  chartMetricView === "ALL"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Semua Indikator
              </button>
              <button
                onClick={() => setChartMetricView("FAKTUR_VS_BAYAR")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  chartMetricView === "FAKTUR_VS_BAYAR"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Faktur vs Pembayaran
              </button>
              <button
                onClick={() => setChartMetricView("BAYAR_VS_UTANG")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  chartMetricView === "BAYAR_VS_UTANG"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pembayaran vs Utang
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-3 text-xs">
              {(chartMetricView === "ALL" || chartMetricView === "FAKTUR_VS_BAYAR") && (
                <span className="flex items-center gap-1 font-semibold text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Total Faktur
                </span>
              )}
              {(chartMetricView === "ALL" || chartMetricView === "FAKTUR_VS_BAYAR" || chartMetricView === "BAYAR_VS_UTANG") && (
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Pembayaran
                </span>
              )}
              {(chartMetricView === "ALL" || chartMetricView === "BAYAR_VS_UTANG") && (
                <span className="flex items-center gap-1 font-semibold text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Sisa Utang
                </span>
              )}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {selectedCustomer || allCustomerGraphMode === "monthly" ? (
                // Monthly Data Chart (both for Single Customer and All Customers consolidated)
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {(chartMetricView === "ALL" || chartMetricView === "FAKTUR_VS_BAYAR") && (
                    <Bar
                      dataKey="tagihan"
                      name="Total Nominal Faktur"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={30}
                    />
                  )}
                  {(chartMetricView === "ALL" || chartMetricView === "FAKTUR_VS_BAYAR" || chartMetricView === "BAYAR_VS_UTANG") && (
                    <Bar
                      dataKey="pembayaran"
                      name="Total Pembayaran"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={30}
                    />
                  )}
                  {(chartMetricView === "ALL" || chartMetricView === "BAYAR_VS_UTANG") && (
                    <Bar
                      dataKey="sisaUtangBulan"
                      name="Sisa Utang Bulan Ini"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={30}
                    />
                  )}
                </BarChart>
              ) : (
                // Multi-Customer Comparison (Ranking top customers by debt)
                <BarChart
                  data={customerComparisonData.slice(0, 8)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="pembayaran"
                    name="Pembayaran"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="utang"
                    name="Sisa Utang"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-gray-400 text-center italic">
            * Nominal pada sumbu Y dalam jutaan Rupiah (M = Million / Juta)
          </div>
        </div>

        {/* CHART 2: Grafik Tren Kenaikan & Penurunan Bulan ke Bulan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                Tren Kenaikan & Penurunan (MoM)
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Fluktuasi penerimaan pembayaran vs total nominal faktur baru per bulan
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total Faktur
              </span>
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pembayaran
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPembayaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTagihan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tagihan"
                  name="Total Nominal Faktur"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTagihan)"
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="pembayaran"
                  name="Total Pembayaran"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPembayaran)"
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 1, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-gray-400 text-center italic">
            * Menampilkan tren fluktuasi nominal faktur dan penerimaan pembayaran per bulannya
          </div>
        </div>
      </div>

      {/* MoM Detailed Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Tabel Rincian Kenaikan & Penurunan Dari Bulan ke Bulan
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Detail data per bulannya: total nominal faktur, total pembayaran, sisa utang, serta selisih kenaikan/penurunan (MoM).
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Menampilkan data <strong>{monthlyData.length} bulan</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Periode Bulan</th>
                <th className="px-4 py-3.5">Total Nominal Faktur</th>
                <th className="px-4 py-3.5">Kenaikan / Penurunan Faktur (MoM)</th>
                <th className="px-4 py-3.5">Total Pembayaran</th>
                <th className="px-4 py-3.5">Kenaikan / Penurunan Pembayaran (MoM)</th>
                <th className="px-4 py-3.5">Sisa Utang Bulan Ini</th>
                <th className="px-4 py-3.5 text-center">Tingkat Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {[...monthlyData].reverse().map((row, idx) => {
                const isLatest = idx === 0;

                return (
                  <tr
                    key={row.monthKey}
                    className={`hover:bg-gray-50 transition-colors ${
                      isLatest ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {/* Bulan */}
                    <td className="px-4 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                      <span>{row.monthLabel}</span>
                      {isLatest && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Bulan Ini
                        </span>
                      )}
                    </td>

                    {/* Total Nominal Faktur */}
                    <td className="px-4 py-3.5 text-blue-900 font-semibold">
                      {formatCurrency(row.tagihan)}
                    </td>

                    {/* MoM Tagihan */}
                    <td className="px-4 py-3.5">
                      {row.tagihanDiff === 0 ? (
                        <span className="text-gray-400 flex items-center gap-1 text-xs">
                          <Minus size={13} /> 0%
                        </span>
                      ) : row.tagihanDiff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md text-xs font-semibold">
                          <ArrowUpRight size={13} />
                          +{formatCurrency(row.tagihanDiff)} (+{row.tagihanPercent.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md text-xs font-semibold">
                          <ArrowDownRight size={13} />
                          {formatCurrency(row.tagihanDiff)} ({row.tagihanPercent.toFixed(1)}%)
                        </span>
                      )}
                    </td>

                    {/* Pembayaran Diterima */}
                    <td className="px-4 py-3.5 text-emerald-700 font-semibold">
                      {formatCurrency(row.pembayaran)}
                    </td>

                    {/* MoM Pembayaran */}
                    <td className="px-4 py-3.5">
                      {row.pembayaranDiff === 0 ? (
                        <span className="text-gray-400 flex items-center gap-1 text-xs">
                          <Minus size={13} /> 0%
                        </span>
                      ) : row.pembayaranDiff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md text-xs font-semibold">
                          <ArrowUpRight size={13} />
                          +{formatCurrency(row.pembayaranDiff)} (+{row.pembayaranPercent.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md text-xs font-semibold">
                          <ArrowDownRight size={13} />
                          {formatCurrency(row.pembayaranDiff)} ({row.pembayaranPercent.toFixed(1)}%)
                        </span>
                      )}
                    </td>

                    {/* Sisa Utang Bulan Ini */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`font-semibold ${
                          row.sisaUtangBulan > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(row.sisaUtangBulan)}
                      </span>
                    </td>

                    {/* Tingkat Pelunasan */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                          row.rasioLunasBulan >= 100
                            ? "bg-emerald-100 text-emerald-700"
                            : row.rasioLunasBulan > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {row.rasioLunasBulan.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Quick Comparison Matrix (if ALL is selected) */}
      {selectedCustomerId === "ALL" && customerComparisonData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Daftar Utang & Pembayaran Per Konsumen
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Cari dan filter konsumen untuk melihat tren individu bulan ke bulan.
              </p>
            </div>

            {/* Matrix Search & Status Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari konsumen di tabel..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {matrixSearch && (
                  <button
                    onClick={() => setMatrixSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Hapus pencarian tabel"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setMatrixStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    matrixStatusFilter === "ALL"
                      ? "bg-white text-blue-600 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setMatrixStatusFilter("DEBT")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    matrixStatusFilter === "DEBT"
                      ? "bg-white text-rose-600 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ada Utang
                </button>
                <button
                  onClick={() => setMatrixStatusFilter("PAID")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    matrixStatusFilter === "PAID"
                      ? "bg-white text-emerald-600 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Lunas
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Konsumen</th>
                  <th className="px-4 py-3">Total Tagihan</th>
                  <th className="px-4 py-3">Total Pembayaran</th>
                  <th className="px-4 py-3">Sisa Utang</th>
                  <th className="px-4 py-3">Status Pelunasan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <p className="text-xs">Tidak ditemukan konsumen yang cocok di tabel.</p>
                    </td>
                  </tr>
                ) : (
                  filteredMatrixData.map((item) => {
                    const rasio = item.tagihan > 0 ? (item.pembayaran / item.tagihan) * 100 : 0;
                    return (
                      <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3.5 text-gray-700">{formatCurrency(item.tagihan)}</td>
                      <td className="px-4 py-3.5 text-emerald-600 font-semibold">
                        {formatCurrency(item.pembayaran)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-bold ${
                            item.utang > 0 ? "text-rose-600" : "text-gray-400"
                          }`}
                        >
                          {formatCurrency(item.utang)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, rasio)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">
                            {rasio.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {item.customerId && (
                          <button
                            onClick={() => setSelectedCustomerId(item.customerId!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs transition-colors"
                          >
                            <BarChart2 size={13} />
                            Lihat Grafik & Tren
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
