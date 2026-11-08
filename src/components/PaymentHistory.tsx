import React, { useState, useMemo } from "react";
import { Invoice } from "../types";
import {
  Search,
  FileDown,
  Calendar,
  Edit2,
  Trash2,
  X,
  Check,
  Users,
  Wallet,
  Receipt,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Percent,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";
import { Pagination } from "./Pagination";
import { formatCurrency } from "../utils";

export interface CustomerPaymentStat {
  customerName: string;
  totalPaid: number;           // Total dibayar dalam rentang tanggal yang dipilih
  paymentCount: number;        // Jumlah transaksi dalam rentang tanggal
  invoicesCount: number;       // Jumlah faktur tercatat
  totalTagihan: number;        // Total nilai tagihan faktur
  sisaUtang: number;           // Sisa utang berjalan
  lastPaymentDate: string;     // Tanggal bayar terakhir dalam rentang tanggal (atau terbaru)
  totalPaidAllTime: number;    // Total dibayar sepanjang waktu
  paymentCountAllTime: number; // Jumlah transaksi sepanjang waktu
}

interface PaymentHistoryProps {
  invoices: Invoice[];
  onEditPayment: (invoiceId: string, paymentId: string, newAmount: number, newDate: string) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
}

export function PaymentHistory({ invoices, onEditPayment, onDeletePayment }: PaymentHistoryProps) {
  const [activeTab, setActiveTab] = useState<"TRANSACTIONS" | "CUSTOMERS">("TRANSACTIONS");
  
  // Shared Date Range Filter for both tabs
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Transaction list filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Customer totals tab filters & pagination
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSortBy, setCustomerSortBy] = useState<"TOTAL_DESC" | "TOTAL_ASC" | "NAME_ASC" | "COUNT_DESC">("TOTAL_DESC");
  const [onlyPaidInPeriod, setOnlyPaidInPeriod] = useState<boolean>(false);
  const [customerPageSize, setCustomerPageSize] = useState<number>(10);
  const [customerCurrentPage, setCustomerCurrentPage] = useState<number>(1);
  
  // Inline editing state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");

  const formatRp = (num: number) => `Rp${new Intl.NumberFormat("id-ID").format(num)}`;

  const isPeriodActive = Boolean(startDate || endDate);

  // Helper date-in-range checker
  const isDateInRange = (dateStr: string, start?: string, end?: string): boolean => {
    if (!start && !end) return true;
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);

      if (start) {
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);
        if (d < s) return false;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Date Preset Handlers
  const handlePresetAll = () => {
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setCustomerCurrentPage(1);
  };

  const handlePresetToday = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setStartDate(today);
    setEndDate(today);
    setCurrentPage(1);
    setCustomerCurrentPage(1);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const start = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
    const end = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
    setCustomerCurrentPage(1);
  };

  const handlePresetLastMonth = () => {
    const now = new Date();
    const start = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), "yyyy-MM-dd");
    const end = format(new Date(now.getFullYear(), now.getMonth(), 0), "yyyy-MM-dd");
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1);
    setCustomerCurrentPage(1);
  };

  // 1. Flatten all payments from invoices
  const allPayments = useMemo(() => {
    return invoices.flatMap(inv => 
      inv.payments.map(p => ({
        payment: p,
        invoice: inv
      }))
    ).sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());
  }, [invoices]);

  // 2. Comprehensive aggregated payment statistics per customer, respecting selected date range
  const customerPaymentStats = useMemo<Record<string, CustomerPaymentStat>>(() => {
    const map: Record<string, CustomerPaymentStat> = {};

    invoices.forEach((inv) => {
      const cName = inv.customerName.trim();
      if (!cName) return;
      const key = cName.toLowerCase();

      if (!map[key]) {
        map[key] = {
          customerName: cName,
          totalPaid: 0,
          paymentCount: 0,
          invoicesCount: 0,
          totalTagihan: 0,
          sisaUtang: 0,
          lastPaymentDate: "",
          totalPaidAllTime: 0,
          paymentCountAllTime: 0,
        };
      }

      map[key].invoicesCount += 1;
      map[key].totalTagihan += inv.totalAmount;

      inv.payments.forEach((p) => {
        // Accumulate all-time numbers
        map[key].totalPaidAllTime += p.amount;
        map[key].paymentCountAllTime += 1;

        // Check if payment falls in selected date range
        if (isDateInRange(p.date, startDate, endDate)) {
          map[key].totalPaid += p.amount;
          map[key].paymentCount += 1;
          if (!map[key].lastPaymentDate || new Date(p.date) > new Date(map[key].lastPaymentDate)) {
            map[key].lastPaymentDate = p.date;
          }
        }
      });
    });

    (Object.values(map) as CustomerPaymentStat[]).forEach((item) => {
      item.sisaUtang = Math.max(0, item.totalTagihan - item.totalPaidAllTime);
    });

    return map;
  }, [invoices, startDate, endDate]);

  // Unique customer names list for filter dropdown
  const customerOptions = useMemo(() => {
    const list = (Object.values(customerPaymentStats) as CustomerPaymentStat[]).map(c => c.customerName);
    return list.sort((a, b) => a.localeCompare(b, "id"));
  }, [customerPaymentStats]);

  // 3. Filtered payments for Transaction Tab
  const filteredPayments = useMemo(() => {
    return allPayments.filter(({ payment, invoice }) => {
      // Customer specific filter
      if (selectedCustomer !== "ALL" && invoice.customerName.toLowerCase().trim() !== selectedCustomer.toLowerCase().trim()) {
        return false;
      }

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        invoice.customerName.toLowerCase().includes(searchLower) ||
        invoice.invoiceNumber.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (!isDateInRange(payment.date, startDate, endDate)) {
        return false;
      }

      return true;
    });
  }, [allPayments, searchTerm, selectedCustomer, startDate, endDate]);

  const totalPages = pageSize > 0 ? Math.ceil(filteredPayments.length / pageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedPayments = useMemo(() => {
    return pageSize === 0
      ? filteredPayments
      : filteredPayments.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  }, [filteredPayments, pageSize, safeCurrentPage]);

  // 4. Filtered & Sorted Customer Totals List for "Total per Konsumen" Tab
  const allCustomerList = useMemo<CustomerPaymentStat[]>(() => {
    return Object.values(customerPaymentStats) as CustomerPaymentStat[];
  }, [customerPaymentStats]);

  // Total paid across all customers within current date range
  const grandTotalPaidAll = useMemo(() => {
    return allCustomerList.reduce((sum, c) => sum + c.totalPaid, 0);
  }, [allCustomerList]);

  // Customers who made payments within the filtered date range
  const payingCustomersCount = useMemo(() => {
    return allCustomerList.filter(c => c.totalPaid > 0).length;
  }, [allCustomerList]);

  const filteredCustomerList = useMemo(() => {
    let result = [...allCustomerList];

    // Optional toggle: only show customers who have payments in current period
    if (onlyPaidInPeriod) {
      result = result.filter(c => c.totalPaid > 0);
    }

    if (customerSearchTerm.trim()) {
      const q = customerSearchTerm.toLowerCase().trim();
      result = result.filter(c => c.customerName.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (customerSortBy === "TOTAL_DESC") return b.totalPaid - a.totalPaid;
      if (customerSortBy === "TOTAL_ASC") return a.totalPaid - b.totalPaid;
      if (customerSortBy === "NAME_ASC") return a.customerName.localeCompare(b.customerName, "id");
      if (customerSortBy === "COUNT_DESC") return b.paymentCount - a.paymentCount;
      return 0;
    });

    return result;
  }, [allCustomerList, customerSearchTerm, customerSortBy, onlyPaidInPeriod]);

  const totalCustomerPages = customerPageSize > 0 ? Math.ceil(filteredCustomerList.length / customerPageSize) : 1;
  const safeCustomerCurrentPage = Math.min(Math.max(1, customerCurrentPage), Math.max(1, totalCustomerPages));

  const paginatedCustomerList = useMemo(() => {
    return customerPageSize === 0
      ? filteredCustomerList
      : filteredCustomerList.slice(
          (safeCustomerCurrentPage - 1) * customerPageSize,
          safeCustomerCurrentPage * customerPageSize
        );
  }, [filteredCustomerList, customerPageSize, safeCustomerCurrentPage]);

  // Overall statistics for Top Metric Widgets (reactive to date filter)
  const summaryMetrics = useMemo(() => {
    const totalTransactions = filteredPayments.length;
    const totalPaid = grandTotalPaidAll;
    const customersWithPayments = allCustomerList.filter(c => c.totalPaid > 0);
    const customerCount = customersWithPayments.length;
    const avgPerCustomer = customerCount > 0 ? totalPaid / customerCount : 0;
    
    // Top customer by payment in current filter
    const sortedByTotal = [...allCustomerList].sort((a, b) => b.totalPaid - a.totalPaid);
    const topCustomer = sortedByTotal.length > 0 && sortedByTotal[0].totalPaid > 0 ? sortedByTotal[0] : null;

    // Filtered sum in current view
    const filteredSum = filteredPayments.reduce((sum, item) => sum + item.payment.amount, 0);

    return {
      totalTransactions,
      totalPaid,
      customerCount,
      avgPerCustomer,
      topCustomer,
      filteredSum,
    };
  }, [filteredPayments, grandTotalPaidAll, allCustomerList]);

  const handleEditClick = (paymentId: string, date: string, amount: number) => {
    setEditingPaymentId(paymentId);
    setEditDate(date);
    setEditAmount(amount);
  };

  const handleSaveEdit = (invoiceId: string, paymentId: string) => {
    if (!editDate || editAmount === "") {
      alert("Tanggal dan nominal bayar harus diisi.");
      return;
    }
    onEditPayment(invoiceId, paymentId, Number(editAmount), editDate);
    setEditingPaymentId(null);
  };

  const handleDelete = (invoiceId: string, paymentId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pembayaran ini?")) {
      onDeletePayment(invoiceId, paymentId);
    }
  };

  // Switch to Transactions Tab specifically filtered by a customer
  const handleFilterByCustomer = (customerName: string) => {
    setSelectedCustomer(customerName);
    setSearchTerm("");
    setCurrentPage(1);
    setActiveTab("TRANSACTIONS");
  };

  // Comprehensive Export Excel with 2 detailed worksheets
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    };
    const headerStyle = {
      font: { bold: true, color: { rgb: "111827" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "E5E7EB" } },
      border: borderStyle
    };
    const totalStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "F3F4F6" } },
      border: borderStyle
    };
    const regularStyle = {
      border: borderStyle
    };

    const periodLabel = isPeriodActive
      ? `Periode: ${startDate ? format(new Date(startDate), "dd/MM/yyyy") : "Awal"} s/d ${endDate ? format(new Date(endDate), "dd/MM/yyyy") : "Kini"}`
      : "Semua Waktu";

    // --- SHEET 1: Riwayat Transaksi ---
    const txAoa: any[][] = [
      ["LAPORAN RIWAYAT PEMBAYARAN"],
      [`${periodLabel} | Filter Konsumen: ${selectedCustomer !== "ALL" ? selectedCustomer : "Semua"}`],
      [],
      ["NO", "TANGGAL BAYAR", "KONSUMEN", "NO FAKTUR", "NOMINAL FAKTUR", "NOMINAL BAYAR", "SISA TAGIHAN", "TOTAL BAYAR KONSUMEN (PERIODE)", "STATUS"],
    ];

    let txCounter = 1;
    let totalNominalFaktur = 0;
    let totalNominalBayar = 0;

    filteredPayments.forEach(({ payment, invoice }) => {
      const pDate = new Date(payment.date);
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = invoice.totalAmount - totalPaid;
      const cStat = customerPaymentStats[invoice.customerName.toLowerCase().trim()];
      
      totalNominalFaktur += invoice.totalAmount;
      totalNominalBayar += payment.amount;
      
      txAoa.push([
        txCounter++,
        format(pDate, "dd-MMM-yy", { locale: id }),
        invoice.customerName,
        invoice.invoiceNumber,
        formatRp(invoice.totalAmount),
        formatRp(payment.amount),
        formatRp(Math.max(0, sisa)),
        cStat ? formatRp(cStat.totalPaid) : "-",
        invoice.status === "PAID" || sisa <= 0 ? "Lunas" : "Belum Lunas"
      ]);
    });

    txAoa.push([
      "",
      "",
      "",
      "TOTAL",
      formatRp(totalNominalFaktur),
      formatRp(totalNominalBayar),
      "",
      "",
      ""
    ]);

    const wsTx = XLSX.utils.aoa_to_sheet(txAoa);
    const headerRowIndex = 3;
    for (let R = headerRowIndex; R < txAoa.length; ++R) {
      const isTotal = R === txAoa.length - 1;
      for (let C = 0; C < txAoa[R].length; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (wsTx[cell_ref]) {
          if (R === headerRowIndex) wsTx[cell_ref].s = headerStyle;
          else if (isTotal) wsTx[cell_ref].s = totalStyle;
          else wsTx[cell_ref].s = regularStyle;
        }
      }
    }
    wsTx["!cols"] = [
      { wch: 5 },  // NO
      { wch: 15 }, // TGL BAYAR
      { wch: 26 }, // KONSUMEN
      { wch: 15 }, // NO FAKTUR
      { wch: 18 }, // NOMINAL FAKTUR
      { wch: 18 }, // NOMINAL BAYAR
      { wch: 18 }, // SISA TAGIHAN
      { wch: 25 }, // TOTAL BAYAR KONSUMEN
      { wch: 14 }, // STATUS
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, "Riwayat Transaksi");

    // --- SHEET 2: Total per Konsumen ---
    const custAoa: any[][] = [
      ["REKAP TOTAL PEMBAYARAN SETIAP KONSUMEN"],
      [`${periodLabel} | Total Setoran Periode: ${formatRp(grandTotalPaidAll)}`],
      [],
      [
        "NO",
        "NAMA KONSUMEN",
        isPeriodActive ? "TOTAL BAYAR (PERIODE)" : "TOTAL PEMBAYARAN",
        isPeriodActive ? "TOTAL SEPANJANG WAKTU" : "JUMLAH TRANSAKSI",
        isPeriodActive ? "TRANSAKSI PERIODE" : "TOTAL TAGIHAN FAKTUR",
        isPeriodActive ? "TOTAL TAGIHAN" : "SISA UTANG",
        "SISA UTANG",
        "STATUS",
        "TGL BAYAR TERAKHIR",
        "KONTRIBUSI %"
      ],
    ];

    let custCounter = 1;
    let sumCustBayar = 0;
    let sumCustAllTime = 0;
    let sumCustTagihan = 0;
    let sumCustUtang = 0;

    filteredCustomerList.forEach((c) => {
      sumCustBayar += c.totalPaid;
      sumCustAllTime += c.totalPaidAllTime;
      sumCustTagihan += c.totalTagihan;
      sumCustUtang += c.sisaUtang;

      const pct = grandTotalPaidAll > 0 ? ((c.totalPaid / grandTotalPaidAll) * 100).toFixed(1) + "%" : "0%";
      const lastDate = c.lastPaymentDate ? format(new Date(c.lastPaymentDate), "dd-MMM-yy", { locale: id }) : "-";
      
      if (isPeriodActive) {
        custAoa.push([
          custCounter++,
          c.customerName,
          formatRp(c.totalPaid),
          formatRp(c.totalPaidAllTime),
          c.paymentCount + " kali",
          formatRp(c.totalTagihan),
          formatRp(c.sisaUtang),
          c.sisaUtang <= 0 ? "Lunas" : "Ada Utang",
          lastDate,
          pct
        ]);
      } else {
        custAoa.push([
          custCounter++,
          c.customerName,
          formatRp(c.totalPaid),
          c.paymentCount + " kali",
          formatRp(c.totalTagihan),
          formatRp(c.sisaUtang),
          formatRp(c.sisaUtang),
          c.sisaUtang <= 0 ? "Lunas" : "Ada Utang",
          lastDate,
          pct
        ]);
      }
    });

    custAoa.push([
      "",
      "TOTAL KESELURUHAN",
      formatRp(sumCustBayar),
      isPeriodActive ? formatRp(sumCustAllTime) : filteredPayments.length + " kali",
      isPeriodActive ? filteredPayments.length + " kali" : formatRp(sumCustTagihan),
      isPeriodActive ? formatRp(sumCustTagihan) : formatRp(sumCustUtang),
      formatRp(sumCustUtang),
      "",
      "",
      "100%"
    ]);

    const wsCust = XLSX.utils.aoa_to_sheet(custAoa);
    const custHeaderIndex = 3;
    for (let R = custHeaderIndex; R < custAoa.length; ++R) {
      const isTotal = R === custAoa.length - 1;
      for (let C = 0; C < custAoa[R].length; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (wsCust[cell_ref]) {
          if (R === custHeaderIndex) wsCust[cell_ref].s = headerStyle;
          else if (isTotal) wsCust[cell_ref].s = totalStyle;
          else wsCust[cell_ref].s = regularStyle;
        }
      }
    }
    wsCust["!cols"] = [
      { wch: 5 },  // NO
      { wch: 26 }, // NAMA KONSUMEN
      { wch: 22 }, // TOTAL PEMBAYARAN
      { wch: 22 }, // TOTAL ALL TIME / TRANSAKSI
      { wch: 18 }, // TRANSAKSI PERIODE / TOTAL TAGIHAN
      { wch: 18 }, // TOTAL TAGIHAN / SISA UTANG
      { wch: 16 }, // SISA UTANG
      { wch: 14 }, // STATUS
      { wch: 18 }, // TGL BAYAR TERAKHIR
      { wch: 15 }, // KONTRIBUSI %
    ];
    XLSX.utils.book_append_sheet(wb, wsCust, "Total per Konsumen");

    const dateName = format(new Date(), "dd-MMM-yyyy");
    XLSX.writeFile(wb, `Riwayat_dan_Total_Pembayaran_${dateName}.xlsx`);
  };

  // Helper to fetch total paid for a single customer in current date filter
  const getCustomerTotalPaid = (customerName: string) => {
    const stat = customerPaymentStats[customerName.toLowerCase().trim()];
    return stat ? stat.totalPaid : 0;
  };

  const getCustomerPaymentCount = (customerName: string) => {
    const stat = customerPaymentStats[customerName.toLowerCase().trim()];
    return stat ? stat.paymentCount : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h2>
          <p className="text-sm text-gray-500 mt-1">
            Lihat daftar transaksi pembayaran dan total pembayaran yang telah disetor setiap konsumen berdasarkan rentang tanggal.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow-2xs"
            title="Download file Excel dengan 2 sheet: Riwayat Transaksi & Rekap Total per Konsumen"
          >
            <FileDown size={18} />
            <span>Export Excel Lengkap</span>
          </button>
        </div>
      </div>

      {/* Top Summary Widgets (Reactive to date range) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Total Pembayaran</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-emerald-700">
              {formatRp(summaryMetrics.totalPaid)}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5 truncate">
              {isPeriodActive ? (
                <span>
                  Periode {startDate ? format(new Date(startDate), "dd/MM") : "Awal"} - {endDate ? format(new Date(endDate), "dd/MM/yy") : "Kini"}
                </span>
              ) : (
                <span>Dari {summaryMetrics.totalTransactions} transaksi masuk</span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Konsumen Membayar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-blue-700">
              {summaryMetrics.customerCount} <span className="text-sm font-semibold text-blue-600">Konsumen</span>
            </div>
            <p className="text-[11px] text-blue-600/80 mt-0.5">
              {isPeriodActive ? "Menyetor di periode ini" : "Telah menyetor pembayaran"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Rata-rata per Konsumen</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Percent size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-indigo-700">
              {formatRp(Math.round(summaryMetrics.avgPerCustomer))}
            </div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">
              Rata-rata setoran tiap konsumen
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">Setoran Terbesar</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-black text-purple-900 truncate">
              {summaryMetrics.topCustomer ? summaryMetrics.topCustomer.customerName : "-"}
            </div>
            <div className="text-xs sm:text-sm font-bold text-purple-700 mt-0.5">
              {summaryMetrics.topCustomer ? formatRp(summaryMetrics.topCustomer.totalPaid) : "Rp 0"}
            </div>
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs: Transaksi vs Total per Konsumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "TRANSACTIONS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            <Receipt size={16} />
            <span>Riwayat Transaksi</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "TRANSACTIONS" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {filteredPayments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CUSTOMERS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "CUSTOMERS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            <Users size={16} />
            <span>Total per Konsumen</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "CUSTOMERS" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {filteredCustomerList.length}
            </span>
          </button>
        </div>

        {/* Info Active Date / Customer Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPeriodActive && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Calendar size={13} className="text-amber-600" />
              <span>
                Periode: {startDate ? format(new Date(startDate), "dd/MM/yy") : "Awal"} - {endDate ? format(new Date(endDate), "dd/MM/yy") : "Kini"}
              </span>
              <button
                onClick={handlePresetAll}
                className="ml-1 text-amber-700 hover:text-amber-900 font-bold hover:underline"
                title="Hapus filter rentang tanggal"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === "TRANSACTIONS" && selectedCustomer !== "ALL" && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800">
              <span>
                Konsumen: <strong>{selectedCustomer}</strong> (Total Disetor:{" "}
                <strong>{formatRp(getCustomerTotalPaid(selectedCustomer))}</strong>)
              </span>
              <button
                onClick={() => setSelectedCustomer("ALL")}
                className="text-blue-600 hover:text-blue-800 font-bold ml-1 hover:underline"
                title="Tampilkan semua konsumen"
              >
                ✕ Semua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RIWAYAT TRANSAKSI                                                 */}
      {/* ========================================================================= */}
      {activeTab === "TRANSACTIONS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Input */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 flex-1 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari faktur atau nama konsumen..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Customer Dropdown Filter */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shrink-0">
                <Users size={16} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 font-semibold shrink-0">Konsumen:</span>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-gray-800 outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                >
                  <option value="ALL">Semua Konsumen ({customerOptions.length})</option>
                  {customerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name} ({formatRp(getCustomerTotalPaid(name))})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                      setCustomerCurrentPage(1);
                    }}
                    className="bg-transparent text-xs sm:text-sm outline-none text-gray-800"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                      setCustomerCurrentPage(1);
                    }}
                    className="bg-transparent text-xs sm:text-sm outline-none text-gray-800"
                  />
                </div>

                {isPeriodActive && (
                  <button
                    onClick={handlePresetAll}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Reset rentang tanggal"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Date Presets Bar */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 overflow-x-auto text-xs">
              <span className="text-gray-400 font-medium mr-1 shrink-0">Pintasan Tanggal:</span>
              <button
                type="button"
                onClick={handlePresetAll}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                  !isPeriodActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semua Waktu
              </button>
              <button
                type="button"
                onClick={handlePresetToday}
                className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={handlePresetThisMonth}
                className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={handlePresetLastMonth}
                className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
              >
                Bulan Lalu
              </button>
            </div>
          </div>

          {/* Transaction Summary Counter */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Menampilkan <strong>{filteredPayments.length}</strong> dari <strong>{allPayments.length}</strong> transaksi pembayaran
            </span>
            <span className="font-semibold text-gray-700">
              Total Pembayaran Ditampilkan: <strong className="text-emerald-700">{formatRp(summaryMetrics.filteredSum)}</strong>
            </span>
          </div>

          {/* Mobile View: Payment Cards */}
          <div className="space-y-3 block md:hidden">
            {filteredPayments.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
                Tidak ada riwayat pembayaran yang cocok dengan filter.
              </div>
            ) : (
              paginatedPayments.map(({ payment, invoice }) => {
                const isEditing = editingPaymentId === payment.id;
                const custTotal = getCustomerTotalPaid(invoice.customerName);
                const custCount = getCustomerPaymentCount(invoice.customerName);

                return (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{format(new Date(payment.date), "dd MMMM yyyy", { locale: id })}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mt-0.5">{invoice.customerName}</h4>
                        
                        {/* Direct Customer Total Badge */}
                        <button
                          onClick={() => handleFilterByCustomer(invoice.customerName)}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded-md transition-colors"
                          title="Klik untuk melihat transaksi konsumen ini saja"
                        >
                          <Wallet size={11} className="text-emerald-600" />
                          <span>Total Disetor: {formatRp(custTotal)}</span>
                          <span className="text-[10px] text-emerald-600 font-normal">({custCount}x)</span>
                        </button>
                      </div>

                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {invoice.invoiceNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Total Tagihan Faktur:</span>
                        <span className="font-semibold text-gray-700">{formatRp(invoice.totalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Nominal Pembayaran:</span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : "")}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                          />
                        ) : (
                          <span className="font-bold text-emerald-600 text-sm">{formatRp(payment.amount)}</span>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="pt-2">
                        <label className="text-[10px] text-gray-400 block mb-1">Tanggal Pembayaran:</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(invoice.id, payment.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check size={14} />
                            <span>Simpan</span>
                          </button>
                          <button
                            onClick={() => setEditingPaymentId(null)}
                            className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                          >
                            <X size={14} />
                            <span>Batal</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(payment.id, payment.date, payment.amount)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id, payment.id)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            <span>Hapus</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Tanggal Bayar</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Konsumen & Total Disetor</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nomor Faktur</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nominal Faktur</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nominal Bayar</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        Tidak ada riwayat pembayaran yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map(({ payment, invoice }) => {
                      const isEditing = editingPaymentId === payment.id;
                      const custTotal = getCustomerTotalPaid(invoice.customerName);
                      const custCount = getCustomerPaymentCount(invoice.customerName);

                      return isEditing ? (
                        <tr key={payment.id} className="bg-blue-50/50">
                          <td className="px-4 py-2 align-top">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 align-top font-bold text-gray-900">
                            {invoice.customerName}
                          </td>
                          <td className="px-4 py-2 align-top font-medium text-gray-600">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-4 py-2 align-top text-gray-500">
                            {formatRp(invoice.totalAmount)}
                          </td>
                          <td className="px-4 py-2 align-top">
                            <input
                              type="number"
                              min="0"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : "")}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(invoice.id, payment.id)}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                title="Simpan"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => setEditingPaymentId(null)}
                                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                title="Batal"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={payment.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                              <Calendar size={15} className="text-gray-400" />
                              {format(new Date(payment.date), "dd MMM yyyy", { locale: id })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-gray-900 block">{invoice.customerName}</span>
                              {/* Total Pembayaran Konsumen Badge/Button */}
                              <button
                                onClick={() => handleFilterByCustomer(invoice.customerName)}
                                className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded-md transition-colors"
                                title="Klik untuk memfilter transaksi khusus konsumen ini"
                              >
                                <Wallet size={11} className="text-emerald-600" />
                                <span>Total Disetor: {formatRp(custTotal)}</span>
                                <span className="text-[10px] text-emerald-600 font-normal">({custCount}x)</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {invoice.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatRp(invoice.totalAmount)}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600 text-base">
                            {formatRp(payment.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditClick(payment.id, payment.date, payment.amount)}
                                className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice.id, payment.id)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 transition-colors"
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

          {/* Pagination Controls */}
          <Pagination
            currentPage={safeCurrentPage}
            totalItems={filteredPayments.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemName="transaksi pembayaran"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TOTAL PEMBAYARAN SETIAP KONSUMEN                                   */}
      {/* ========================================================================= */}
      {activeTab === "CUSTOMERS" && (
        <div className="space-y-4">
          {/* Customer Date Range & Filter Toolbar */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            {/* Top row: Search, Sort & Toggle */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Customer Input */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 flex-1 focus-within:border-emerald-500 focus-within:bg-white transition-colors">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari nama konsumen..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    setCustomerCurrentPage(1);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm outline-none"
                />
                {customerSearchTerm && (
                  <button
                    onClick={() => {
                      setCustomerSearchTerm("");
                      setCustomerCurrentPage(1);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shrink-0">
                <ArrowUpDown size={15} className="text-gray-500 shrink-0" />
                <span className="text-xs text-gray-500 font-semibold shrink-0">Urutkan:</span>
                <select
                  value={customerSortBy}
                  onChange={(e) => {
                    setCustomerSortBy(e.target.value as any);
                    setCustomerCurrentPage(1);
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="TOTAL_DESC">Total Pembayaran Tertinggi</option>
                  <option value="TOTAL_ASC">Total Pembayaran Terendah</option>
                  <option value="NAME_ASC">Nama Konsumen (A - Z)</option>
                  <option value="COUNT_DESC">Jumlah Transaksi Terbanyak</option>
                </select>
              </div>

              {/* Date Range Filter Inputs */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Dari:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCustomerCurrentPage(1);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-xs sm:text-sm outline-none text-gray-800"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Sampai:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCustomerCurrentPage(1);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-xs sm:text-sm outline-none text-gray-800"
                  />
                </div>

                {isPeriodActive && (
                  <button
                    onClick={handlePresetAll}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Reset rentang tanggal"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom row: Quick Preset Buttons & Paying Customers Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100">
              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <span className="text-gray-400 font-medium mr-1 shrink-0">Pintasan Rentang:</span>
                <button
                  type="button"
                  onClick={handlePresetAll}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                    !isPeriodActive ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Semua Waktu
                </button>
                <button
                  type="button"
                  onClick={handlePresetToday}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handlePresetThisMonth}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={handlePresetLastMonth}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors shrink-0"
                >
                  Bulan Lalu
                </button>
              </div>

              {/* Only Paid in Period Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyPaidInPeriod(!onlyPaidInPeriod);
                    setCustomerCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    onlyPaidInPeriod
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={13} className={onlyPaidInPeriod ? "text-emerald-600" : "text-gray-400"} />
                  <span>Hanya yang Membayar di Rentang Ini</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                    {payingCustomersCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Date Banner Notification */}
          {isPeriodActive && (
            <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200/80 px-4 py-2.5 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Menampilkan total pembayaran dalam rentang:{" "}
                  <strong>
                    {startDate ? format(new Date(startDate), "dd MMMM yyyy", { locale: id }) : "Awal"} s/d{" "}
                    {endDate ? format(new Date(endDate), "dd MMMM yyyy", { locale: id }) : "Sekarang"}
                  </strong>
                  . Terdapat <strong>{payingCustomersCount} konsumen</strong> yang menyetor total{" "}
                  <strong>{formatRp(grandTotalPaidAll)}</strong>.
                </span>
              </div>
              <button
                onClick={handlePresetAll}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0"
              >
                Reset Rentang
              </button>
            </div>
          )}

          {/* Customer Count Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Menampilkan <strong>{filteredCustomerList.length}</strong> dari{" "}
              <strong>{allCustomerList.length}</strong> konsumen
            </span>
            <span className="text-gray-600 font-medium">
              Akumulasi Setoran {isPeriodActive ? "Periode Ini" : "Semua Waktu"}:{" "}
              <strong className="text-emerald-700 font-bold">{formatRp(grandTotalPaidAll)}</strong>
            </span>
          </div>

          {/* Mobile View: Customer Summary Cards */}
          <div className="space-y-3 block md:hidden">
            {filteredCustomerList.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
                Tidak ada data konsumen yang cocok dengan rentang tanggal atau pencarian.
              </div>
            ) : (
              paginatedCustomerList.map((c, index) => {
                const rank = (safeCustomerCurrentPage - 1) * (customerPageSize || 10) + index + 1;
                const percentage =
                  grandTotalPaidAll > 0 ? Number(((c.totalPaid / grandTotalPaidAll) * 100).toFixed(1)) : 0;

                return (
                  <div
                    key={c.customerName}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {rank}
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{c.customerName}</h4>
                          <span className="text-[11px] text-gray-500">
                            {c.paymentCount}x bayar {isPeriodActive && "(di rentang ini)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">
                          {isPeriodActive ? "Total Periode Ini" : "Total Pembayaran"}
                        </span>
                        <span className="text-base font-black text-emerald-700">
                          {formatRp(c.totalPaid)}
                        </span>
                        {isPeriodActive && c.totalPaidAllTime !== c.totalPaid && (
                          <span className="text-[10px] text-gray-400 block">
                            All-time: {formatRp(c.totalPaidAllTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of Contribution */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Porsi dari Total {isPeriodActive ? "Periode Ini" : "Pembayaran"}:</span>
                        <span className="font-bold text-emerald-700">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Total Tagihan Faktur:</span>
                        <span className="font-semibold text-gray-800">{formatRp(c.totalTagihan)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Sisa Utang Berjalan:</span>
                        {c.sisaUtang > 0 ? (
                          <span className="font-bold text-rose-600">{formatRp(c.sisaUtang)}</span>
                        ) : (
                          <span className="font-bold text-emerald-600">Lunas (Rp 0)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        {c.lastPaymentDate
                          ? `Terakhir bayar: ${format(new Date(c.lastPaymentDate), "dd/MM/yyyy")}`
                          : "Belum ada transaksi di rentang ini"}
                      </span>
                      <button
                        onClick={() => handleFilterByCustomer(c.customerName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
                      >
                        <span>Lihat Transaksi</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table: Customer Totals Ranking Table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider w-12 text-center">No</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nama Konsumen</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                      {isPeriodActive ? "Total Bayar (Periode)" : "Total Pembayaran"}
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Frekuensi</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Total Tagihan</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Sisa Utang</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Terakhir Bayar</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-36">Kontribusi (%)</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomerList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                        Tidak ada konsumen yang sesuai dengan pencarian atau rentang tanggal.
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomerList.map((c, index) => {
                      const rank = (safeCustomerCurrentPage - 1) * (customerPageSize || 10) + index + 1;
                      const percentage =
                        grandTotalPaidAll > 0 ? ((c.totalPaid / grandTotalPaidAll) * 100).toFixed(1) : "0";

                      return (
                        <tr key={c.customerName} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-4 text-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold inline-flex items-center justify-center">
                              {rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 text-sm">{c.customerName}</div>
                            <span className="text-[11px] text-gray-400">{c.invoicesCount} faktur tercatat</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-emerald-700 text-base">
                              {formatRp(c.totalPaid)}
                            </div>
                            {isPeriodActive && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded font-semibold">
                                  Periode Ini
                                </span>
                                {c.totalPaidAllTime !== c.totalPaid && (
                                  <span className="text-[11px] text-gray-400">
                                    All-time: {formatRp(c.totalPaidAllTime)}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              <Receipt size={12} />
                              {c.paymentCount} kali
                            </span>
                            {isPeriodActive && c.paymentCountAllTime !== c.paymentCount && (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Total: {c.paymentCountAllTime}x
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {formatRp(c.totalTagihan)}
                          </td>
                          <td className="px-6 py-4">
                            {c.sisaUtang > 0 ? (
                              <span className="font-bold text-rose-600">
                                {formatRp(c.sisaUtang)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                                <CheckCircle2 size={13} className="text-emerald-500" />
                                Lunas
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-xs">
                            {c.lastPaymentDate ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{format(new Date(c.lastPaymentDate), "dd MMM yyyy", { locale: id })}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Tidak ada transaksi</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(3, Number(percentage)))}%` }}
                                />
                              </div>
                              <span className="font-bold text-gray-700 text-xs">{percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleFilterByCustomer(c.customerName)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                              title="Lihat riwayat rincian pembayaran konsumen ini"
                            >
                              <span>Lihat Transaksi</span>
                              <ExternalLink size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Tab Pagination Controls */}
          <Pagination
            currentPage={safeCustomerCurrentPage}
            totalItems={filteredCustomerList.length}
            pageSize={customerPageSize}
            onPageChange={(page) => setCustomerCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setCustomerPageSize(newSize);
              setCustomerCurrentPage(1);
            }}
            itemName="konsumen"
          />
        </div>
      )}
    </div>
  );
}
