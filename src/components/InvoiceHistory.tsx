import React, { useState, useMemo } from "react";
import { Invoice, Customer } from "../types";
import { formatCurrency } from "../utils";
import {
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  List,
  Calendar,
  Users,
  FileText,
  FileDown,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Percent,
  Wallet,
  Receipt,
  Filter,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";
import { CustomerSelect } from "./CustomerSelect";
import { Pagination } from "./Pagination";

export interface CustomerInvoiceStat {
  customerName: string;
  totalTagihan: number;          // Total tagihan faktur dalam rentang tanggal
  invoicesCount: number;         // Jumlah faktur dalam rentang tanggal
  totalPaid: number;             // Total pembayaran yang telah disetor untuk faktur di rentang ini
  sisaUtang: number;             // Sisa utang untuk faktur di rentang ini
  latestInvoiceDate: string;     // Tanggal faktur terbaru
  totalTagihanAllTime: number;   // Total tagihan faktur sepanjang waktu
  invoicesCountAllTime: number;  // Jumlah faktur sepanjang waktu
  totalPaidAllTime: number;      // Total terbayar sepanjang waktu
  sisaUtangAllTime: number;      // Sisa utang sepanjang waktu
}

interface InvoiceHistoryProps {
  invoices: Invoice[];
  customers: Customer[];
  onDelete: (id: string) => void;
  onViewHistory?: (invoice: Invoice) => void;
  onEdit: (
    id: string,
    invoiceNumber: string,
    customerName: string,
    date: string,
    dueDate: string,
    totalAmount: number
  ) => void;
}

export function InvoiceHistory({
  invoices,
  customers,
  onDelete,
  onViewHistory,
  onEdit,
}: InvoiceHistoryProps) {
  const [activeTab, setActiveTab] = useState<"INVOICES" | "CUSTOMERS">("INVOICES");

  // Shared Date Range Filter for both tabs
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"INVOICE_DATE" | "DUE_DATE">("INVOICE_DATE");

  // Tab 1: Invoices list filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tab 2: Customer billings tab filters & pagination
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSortBy, setCustomerSortBy] = useState<
    "TAGIHAN_DESC" | "TAGIHAN_ASC" | "NAME_ASC" | "COUNT_DESC" | "UTANG_DESC"
  >("TAGIHAN_DESC");
  const [onlyWithInvoicesInPeriod, setOnlyWithInvoicesInPeriod] = useState<boolean>(false);
  const [customerPageSize, setCustomerPageSize] = useState<number>(10);
  const [customerCurrentPage, setCustomerCurrentPage] = useState<number>(1);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState<number | "">("");

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

  // 1. Comprehensive aggregated invoice statistics per customer respecting date range
  const customerInvoiceStats = useMemo<Record<string, CustomerInvoiceStat>>(() => {
    const map: Record<string, CustomerInvoiceStat> = {};

    invoices.forEach((inv) => {
      const cName = inv.customerName.trim();
      if (!cName) return;
      const key = cName.toLowerCase();

      if (!map[key]) {
        map[key] = {
          customerName: cName,
          totalTagihan: 0,
          invoicesCount: 0,
          totalPaid: 0,
          sisaUtang: 0,
          latestInvoiceDate: "",
          totalTagihanAllTime: 0,
          invoicesCountAllTime: 0,
          totalPaidAllTime: 0,
          sisaUtangAllTime: 0,
        };
      }

      const invPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);

      // Accumulate all-time numbers
      map[key].totalTagihanAllTime += inv.totalAmount;
      map[key].invoicesCountAllTime += 1;
      map[key].totalPaidAllTime += invPaid;

      // Check if invoice falls into selected date range
      const targetDate = dateFilterType === "DUE_DATE" ? inv.dueDate : inv.date;
      if (isDateInRange(targetDate, startDate, endDate)) {
        map[key].totalTagihan += inv.totalAmount;
        map[key].invoicesCount += 1;
        map[key].totalPaid += invPaid;
        if (!map[key].latestInvoiceDate || new Date(inv.date) > new Date(map[key].latestInvoiceDate)) {
          map[key].latestInvoiceDate = inv.date;
        }
      }
    });

    (Object.values(map) as CustomerInvoiceStat[]).forEach((item) => {
      item.sisaUtang = Math.max(0, item.totalTagihan - item.totalPaid);
      item.sisaUtangAllTime = Math.max(0, item.totalTagihanAllTime - item.totalPaidAllTime);
    });

    return map;
  }, [invoices, startDate, endDate, dateFilterType]);

  // Unique customer names list for filter dropdown
  const customerOptions = useMemo(() => {
    const list = (Object.values(customerInvoiceStats) as CustomerInvoiceStat[]).map(c => c.customerName);
    return list.sort((a, b) => a.localeCompare(b, "id"));
  }, [customerInvoiceStats]);

  // Helpers to get single customer stats
  const getCustomerTotalTagihan = (customerName: string) => {
    const stat = customerInvoiceStats[customerName.toLowerCase().trim()];
    return stat ? stat.totalTagihan : 0;
  };

  const getCustomerTotalTagihanAllTime = (customerName: string) => {
    const stat = customerInvoiceStats[customerName.toLowerCase().trim()];
    return stat ? stat.totalTagihanAllTime : 0;
  };

  const getCustomerInvoicesCount = (customerName: string) => {
    const stat = customerInvoiceStats[customerName.toLowerCase().trim()];
    return stat ? stat.invoicesCount : 0;
  };

  // 2. Filtered invoices for Tab 1 (Daftar Faktur)
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Customer dropdown filter
        if (
          selectedCustomer !== "ALL" &&
          inv.customerName.toLowerCase().trim() !== selectedCustomer.toLowerCase().trim()
        ) {
          return false;
        }

        // Status filter
        if (statusFilter !== "ALL" && inv.status !== statusFilter) {
          return false;
        }

        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          inv.customerName.toLowerCase().includes(searchLower) ||
          inv.invoiceNumber.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Date range filter
        const targetDate = dateFilterType === "DUE_DATE" ? inv.dueDate : inv.date;
        if (!isDateInRange(targetDate, startDate, endDate)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, selectedCustomer, statusFilter, searchTerm, startDate, endDate, dateFilterType]);

  const totalPages = pageSize > 0 ? Math.ceil(filteredInvoices.length / pageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedInvoices = useMemo(() => {
    return pageSize === 0
      ? filteredInvoices
      : filteredInvoices.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  }, [filteredInvoices, pageSize, safeCurrentPage]);

  // 3. Customer Total Billings List for Tab 2
  const allCustomerList = useMemo<CustomerInvoiceStat[]>(() => {
    return Object.values(customerInvoiceStats) as CustomerInvoiceStat[];
  }, [customerInvoiceStats]);

  const grandTotalTagihanAll = useMemo(() => {
    return allCustomerList.reduce((sum, c) => sum + c.totalTagihan, 0);
  }, [allCustomerList]);

  const customersWithInvoicesCount = useMemo(() => {
    return allCustomerList.filter(c => c.totalTagihan > 0).length;
  }, [allCustomerList]);

  const filteredCustomerList = useMemo(() => {
    let result = [...allCustomerList];

    if (onlyWithInvoicesInPeriod) {
      result = result.filter(c => c.totalTagihan > 0);
    }

    if (customerSearchTerm.trim()) {
      const q = customerSearchTerm.toLowerCase().trim();
      result = result.filter(c => c.customerName.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (customerSortBy === "TAGIHAN_DESC") return b.totalTagihan - a.totalTagihan;
      if (customerSortBy === "TAGIHAN_ASC") return a.totalTagihan - b.totalTagihan;
      if (customerSortBy === "NAME_ASC") return a.customerName.localeCompare(b.customerName, "id");
      if (customerSortBy === "COUNT_DESC") return b.invoicesCount - a.invoicesCount;
      if (customerSortBy === "UTANG_DESC") return b.sisaUtang - a.sisaUtang;
      return 0;
    });

    return result;
  }, [allCustomerList, customerSearchTerm, customerSortBy, onlyWithInvoicesInPeriod]);

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

  // Summary Metrics for Top Cards (reactive to filtered invoices & date range)
  const summaryMetrics = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalTagihan = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const activeCustomers = new Set(filteredInvoices.map(inv => inv.customerName.toLowerCase().trim())).size;
    const avgPerCustomer = activeCustomers > 0 ? totalTagihan / activeCustomers : 0;

    const sortedByTagihan = [...allCustomerList].sort((a, b) => b.totalTagihan - a.totalTagihan);
    const topCustomer = sortedByTagihan.length > 0 && sortedByTagihan[0].totalTagihan > 0 ? sortedByTagihan[0] : null;

    return {
      totalInvoices,
      totalTagihan,
      activeCustomers,
      avgPerCustomer,
      topCustomer,
    };
  }, [filteredInvoices, allCustomerList]);

  // Edit actions
  const handleEditClick = (inv: Invoice) => {
    setEditingId(inv.id);
    setEditInvoiceNumber(inv.invoiceNumber);
    setEditCustomerName(inv.customerName);
    setEditDate(inv.date);
    setEditDueDate(inv.dueDate);
    setEditTotalAmount(inv.totalAmount);
  };

  const handleSaveEdit = (id: string) => {
    if (!editInvoiceNumber || !editCustomerName || !editDate || !editDueDate || editTotalAmount === "") {
      alert("Harap isi semua bidang");
      return;
    }

    let finalInvoiceNumber = editInvoiceNumber;
    const duplicate = invoices.find(
      (inv) => inv.id !== id && inv.invoiceNumber.toLowerCase() === finalInvoiceNumber.toLowerCase()
    );
    if (duplicate) {
      const generateNew = window.confirm(
        `No faktur ${finalInvoiceNumber} sudah digunakan. Buatkan no faktur otomatis yang berbeda?`
      );
      if (!generateNew) {
        return;
      }

      const existingNumbers = new Set(
        invoices.map((inv) => (inv.id !== id ? inv.invoiceNumber.toLowerCase() : ""))
      );
      let counter = 1;
      while (existingNumbers.has(finalInvoiceNumber.toLowerCase())) {
        finalInvoiceNumber = `${editInvoiceNumber}-${counter}`;
        counter++;
      }
    }

    onEdit(
      id,
      finalInvoiceNumber,
      editCustomerName,
      editDate,
      editDueDate,
      Number(editTotalAmount)
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus faktur ini?")) {
      onDelete(id);
    }
  };

  // Switch to Invoice List filtered by customer
  const handleFilterByCustomer = (customerName: string) => {
    setSelectedCustomer(customerName);
    setSearchTerm("");
    setCurrentPage(1);
    setActiveTab("INVOICES");
  };

  // Export Excel with 2 detailed sheets
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };
    const headerStyle = {
      font: { bold: true, color: { rgb: "111827" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "E5E7EB" } },
      border: borderStyle,
    };
    const totalStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "F3F4F6" } },
      border: borderStyle,
    };
    const regularStyle = {
      border: borderStyle,
    };

    const periodLabel = isPeriodActive
      ? `Rentang ${dateFilterType === "DUE_DATE" ? "Jatuh Tempo" : "Tgl Faktur"}: ${
          startDate ? format(new Date(startDate), "dd/MM/yyyy") : "Awal"
        } s/d ${endDate ? format(new Date(endDate), "dd/MM/yyyy") : "Kini"}`
      : "Semua Waktu";

    // --- SHEET 1: Daftar Faktur ---
    const invAoa: any[][] = [
      ["LAPORAN RIWAYAT FAKTUR PENJUALAN"],
      [`${periodLabel} | Filter Konsumen: ${selectedCustomer !== "ALL" ? selectedCustomer : "Semua"}`],
      [],
      [
        "NO",
        "NO FAKTUR",
        "KONSUMEN",
        "TGL FAKTUR",
        "JATUH TEMPO",
        "NOMINAL FAKTUR",
        "TOTAL DIBAYAR",
        "SISA TAGIHAN",
        "TOTAL TAGIHAN KONSUMEN",
        "STATUS",
      ],
    ];

    let invCounter = 1;
    let sumNominalFaktur = 0;
    let sumNominalDibayar = 0;
    let sumSisaTagihan = 0;

    filteredInvoices.forEach((inv) => {
      const invPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = inv.totalAmount - invPaid;
      const cStat = customerInvoiceStats[inv.customerName.toLowerCase().trim()];

      sumNominalFaktur += inv.totalAmount;
      sumNominalDibayar += invPaid;
      sumSisaTagihan += Math.max(0, sisa);

      invAoa.push([
        invCounter++,
        inv.invoiceNumber,
        inv.customerName,
        format(new Date(inv.date), "dd-MMM-yy", { locale: id }),
        format(new Date(inv.dueDate), "dd-MMM-yy", { locale: id }),
        formatRp(inv.totalAmount),
        formatRp(invPaid),
        formatRp(Math.max(0, sisa)),
        cStat ? formatRp(cStat.totalTagihan) : "-",
        inv.status === "PAID" || sisa <= 0
          ? "Lunas"
          : inv.status === "PARTIAL"
          ? "Sebagian"
          : "Belum Bayar",
      ]);
    });

    invAoa.push([
      "",
      "",
      "TOTAL KESELURUHAN",
      "",
      "",
      formatRp(sumNominalFaktur),
      formatRp(sumNominalDibayar),
      formatRp(sumSisaTagihan),
      "",
      "",
    ]);

    const wsInv = XLSX.utils.aoa_to_sheet(invAoa);
    const invHeaderIndex = 3;
    for (let R = invHeaderIndex; R < invAoa.length; ++R) {
      const isTotal = R === invAoa.length - 1;
      for (let C = 0; C < invAoa[R].length; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (wsInv[cell_ref]) {
          if (R === invHeaderIndex) wsInv[cell_ref].s = headerStyle;
          else if (isTotal) wsInv[cell_ref].s = totalStyle;
          else wsInv[cell_ref].s = regularStyle;
        }
      }
    }
    wsInv["!cols"] = [
      { wch: 5 },  // NO
      { wch: 16 }, // NO FAKTUR
      { wch: 26 }, // KONSUMEN
      { wch: 14 }, // TGL FAKTUR
      { wch: 14 }, // JATUH TEMPO
      { wch: 18 }, // NOMINAL FAKTUR
      { wch: 18 }, // TOTAL DIBAYAR
      { wch: 18 }, // SISA TAGIHAN
      { wch: 24 }, // TOTAL TAGIHAN KONSUMEN
      { wch: 14 }, // STATUS
    ];
    XLSX.utils.book_append_sheet(wb, wsInv, "Daftar Faktur");

    // --- SHEET 2: Total Tagihan per Konsumen ---
    const custAoa: any[][] = [
      ["REKAP TOTAL TAGIHAN FAKTUR TIAP KONSUMEN"],
      [`${periodLabel} | Total Tagihan: ${formatRp(grandTotalTagihanAll)}`],
      [],
      [
        "NO",
        "NAMA KONSUMEN",
        isPeriodActive ? "TOTAL TAGIHAN (PERIODE)" : "TOTAL TAGIHAN FAKTUR",
        isPeriodActive ? "TOTAL SEPANJANG WAKTU" : "JUMLAH FAKTUR",
        isPeriodActive ? "JUMLAH FAKTUR PERIODE" : "TOTAL TERBAYAR",
        isPeriodActive ? "TOTAL TERBAYAR" : "SISA UTANG",
        "SISA UTANG",
        "STATUS",
        "TGL FAKTUR TERAKHIR",
        "KONTRIBUSI %",
      ],
    ];

    let custCounter = 1;
    let sumCustTagihan = 0;
    let sumCustAllTime = 0;
    let sumCustBayar = 0;
    let sumCustUtang = 0;

    filteredCustomerList.forEach((c) => {
      sumCustTagihan += c.totalTagihan;
      sumCustAllTime += c.totalTagihanAllTime;
      sumCustBayar += c.totalPaid;
      sumCustUtang += c.sisaUtang;

      const pct =
        grandTotalTagihanAll > 0 ? ((c.totalTagihan / grandTotalTagihanAll) * 100).toFixed(1) + "%" : "0%";
      const lastDate = c.latestInvoiceDate
        ? format(new Date(c.latestInvoiceDate), "dd-MMM-yy", { locale: id })
        : "-";

      if (isPeriodActive) {
        custAoa.push([
          custCounter++,
          c.customerName,
          formatRp(c.totalTagihan),
          formatRp(c.totalTagihanAllTime),
          c.invoicesCount + " faktur",
          formatRp(c.totalPaid),
          formatRp(c.sisaUtang),
          c.sisaUtang <= 0 ? "Lunas" : "Ada Utang",
          lastDate,
          pct,
        ]);
      } else {
        custAoa.push([
          custCounter++,
          c.customerName,
          formatRp(c.totalTagihan),
          c.invoicesCount + " faktur",
          formatRp(c.totalPaid),
          formatRp(c.sisaUtang),
          formatRp(c.sisaUtang),
          c.sisaUtang <= 0 ? "Lunas" : "Ada Utang",
          lastDate,
          pct,
        ]);
      }
    });

    custAoa.push([
      "",
      "TOTAL KESELURUHAN",
      formatRp(sumCustTagihan),
      isPeriodActive ? formatRp(sumCustAllTime) : filteredInvoices.length + " faktur",
      isPeriodActive ? filteredInvoices.length + " faktur" : formatRp(sumCustBayar),
      isPeriodActive ? formatRp(sumCustBayar) : formatRp(sumCustUtang),
      formatRp(sumCustUtang),
      "",
      "",
      "100%",
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
      { wch: 24 }, // TOTAL TAGIHAN
      { wch: 24 }, // TOTAL ALL TIME / JUMLAH FAKTUR
      { wch: 20 }, // JUMLAH FAKTUR PERIODE / TOTAL TERBAYAR
      { wch: 20 }, // TOTAL TERBAYAR / SISA UTANG
      { wch: 18 }, // SISA UTANG
      { wch: 14 }, // STATUS
      { wch: 18 }, // TGL FAKTUR TERAKHIR
      { wch: 15 }, // KONTRIBUSI %
    ];
    XLSX.utils.book_append_sheet(wb, wsCust, "Total Tagihan per Konsumen");

    const dateName = format(new Date(), "dd-MMM-yyyy");
    XLSX.writeFile(wb, `Riwayat_dan_Total_Tagihan_Faktur_${dateName}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Faktur</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pantau dan kelola faktur penjualan, total tagihan faktur tiap konsumen, dan filter berdasarkan rentang tanggal.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
            title="Download file Excel 2 sheet: Daftar Faktur & Rekap Total Tagihan per Konsumen"
          >
            <FileDown size={18} />
            <span>Export Excel Faktur</span>
          </button>
        </div>
      </div>

      {/* Top Metric Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Total Tagihan Faktur</span>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-blue-700">
              {formatRp(summaryMetrics.totalTagihan)}
            </div>
            <p className="text-[11px] text-blue-600/80 mt-0.5 truncate">
              {isPeriodActive ? (
                <span>
                  Periode {startDate ? format(new Date(startDate), "dd/MM") : "Awal"} -{" "}
                  {endDate ? format(new Date(endDate), "dd/MM/yy") : "Kini"}
                </span>
              ) : (
                <span>Dari {summaryMetrics.totalInvoices} faktur tercatat</span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Konsumen Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-emerald-700">
              {summaryMetrics.activeCustomers} <span className="text-sm font-semibold text-emerald-600">Konsumen</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">
              {isPeriodActive ? "Memiliki faktur di rentang ini" : "Total konsumen aktif"}
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
              Rata-rata tagihan tiap toko
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800">Tagihan Terbesar</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-base font-black text-purple-900 truncate">
              {summaryMetrics.topCustomer ? summaryMetrics.topCustomer.customerName : "-"}
            </div>
            <div className="text-xs sm:text-sm font-bold text-purple-700 mt-0.5">
              {summaryMetrics.topCustomer ? formatRp(summaryMetrics.topCustomer.totalTagihan) : "Rp 0"}
            </div>
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs: Daftar Faktur vs Total Tagihan per Konsumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "INVOICES"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            <FileText size={16} />
            <span>Daftar Faktur</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "INVOICES" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {filteredInvoices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CUSTOMERS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "CUSTOMERS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            <Users size={16} />
            <span>Total Tagihan per Konsumen</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "CUSTOMERS" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"
              }`}
            >
              {filteredCustomerList.length}
            </span>
          </button>
        </div>

        {/* Info Active Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPeriodActive && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Calendar size={13} className="text-amber-600" />
              <span>
                {dateFilterType === "DUE_DATE" ? "Jatuh Tempo" : "Tgl Faktur"}:{" "}
                {startDate ? format(new Date(startDate), "dd/MM/yy") : "Awal"} -{" "}
                {endDate ? format(new Date(endDate), "dd/MM/yy") : "Kini"}
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

          {activeTab === "INVOICES" && selectedCustomer !== "ALL" && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800">
              <span>
                Konsumen: <strong>{selectedCustomer}</strong> (Total Tagihan:{" "}
                <strong>{formatRp(getCustomerTotalTagihan(selectedCustomer))}</strong>)
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
      {/* TAB 1: DAFTAR FAKTUR                                                      */}
      {/* ========================================================================= */}
      {activeTab === "INVOICES" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Input */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 flex-1 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari no faktur atau nama konsumen..."
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

              {/* Customer Dropdown Filter with Total Tagihan */}
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
                      {name} (Tagihan: {formatRp(getCustomerTotalTagihan(name))})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shrink-0">
                <span className="text-xs text-gray-500 font-semibold shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="UNPAID">Belum Bayar</option>
                  <option value="PARTIAL">Sebagian</option>
                  <option value="PAID">Lunas</option>
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

            {/* Quick Date Presets Bar & Target Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
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

              {/* Date type filter toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setDateFilterType("INVOICE_DATE")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    dateFilterType === "INVOICE_DATE"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Filter Tgl Faktur
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType("DUE_DATE")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    dateFilterType === "DUE_DATE"
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Filter Jatuh Tempo
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Summary Counter */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Menampilkan <strong>{filteredInvoices.length}</strong> dari <strong>{invoices.length}</strong> faktur
            </span>
            <span className="font-semibold text-gray-700">
              Total Tagihan Ditampilkan:{" "}
              <strong className="text-blue-700">{formatRp(summaryMetrics.totalTagihan)}</strong>
            </span>
          </div>

          {/* Mobile View: Cards */}
          <div className="space-y-3 block md:hidden">
            {filteredInvoices.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
                Tidak ada faktur yang ditemukan dengan filter ini.
              </div>
            ) : (
              paginatedInvoices.map((inv) => {
                const isEditing = editingId === inv.id;
                const diffDays = differenceInDays(new Date(inv.dueDate), new Date());
                const isOverdue = diffDays < 0 && inv.status !== "PAID";
                const custTagihan = getCustomerTotalTagihan(inv.customerName);
                const custCount = getCustomerInvoicesCount(inv.customerName);
                const custAllTime = getCustomerTotalTagihanAllTime(inv.customerName);

                if (isEditing) {
                  return (
                    <div
                      key={inv.id}
                      className="rounded-xl border-2 border-blue-400 bg-white p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <span className="text-xs font-bold text-blue-700">Edit Faktur</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(inv.id)}
                            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-green-700"
                          >
                            <Check size={14} /> Simpan
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            <X size={14} /> Batal
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">No. Faktur</label>
                        <input
                          type="text"
                          value={editInvoiceNumber}
                          onChange={(e) => setEditInvoiceNumber(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Konsumen</label>
                        <CustomerSelect
                          customers={customers}
                          value={editCustomerName}
                          onChange={setEditCustomerName}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Tgl Faktur</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setEditDate(newDate);
                              if (newDate) {
                                const d = new Date(newDate);
                                d.setDate(d.getDate() + 30);
                                setEditDueDate(format(d, "yyyy-MM-dd"));
                              }
                            }}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Jatuh Tempo</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Total Tagihan (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editTotalAmount}
                          onChange={(e) =>
                            setEditTotalAmount(e.target.value ? Number(e.target.value) : "")
                          }
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-gray-900 text-sm">{inv.invoiceNumber}</span>
                        <h4 className="text-xs text-gray-800 font-bold mt-0.5">{inv.customerName}</h4>

                        {/* Customer Total Invoices Badge */}
                        <button
                          onClick={() => handleFilterByCustomer(inv.customerName)}
                          className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-2 py-0.5 rounded-md transition-colors"
                          title="Klik untuk melihat faktur khusus konsumen ini"
                        >
                          <FileText size={11} className="text-blue-600" />
                          <span>Total Tagihan: {formatRp(custTagihan)}</span>
                          <span className="text-[10px] text-blue-600 font-normal">({custCount} faktur)</span>
                        </button>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            inv.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : inv.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {inv.status === "PAID"
                            ? "LUNAS"
                            : inv.status === "PARTIAL"
                            ? "SEBAGIAN"
                            : "BELUM BAYAR"}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-red-600 font-semibold">
                            Lewat {Math.abs(diffDays)} hari
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                      <div>
                        <span>Tgl: {format(new Date(inv.date), "dd/MM/yyyy")}</span>
                        <span className="mx-1.5">·</span>
                        <span>JT: {format(new Date(inv.dueDate), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="font-extrabold text-gray-900 text-sm">
                        {formatCurrency(inv.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      {onViewHistory && inv.payments.length > 0 && (
                        <button
                          onClick={() => onViewHistory(inv)}
                          className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          <List size={14} /> Riwayat ({inv.payments.length})
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(inv)}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet View: Table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">No. Faktur</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Konsumen & Total Tagihan</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Tanggal Faktur</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Jatuh Tempo</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Nominal Faktur</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                        Tidak ada faktur yang ditemukan dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => {
                      const isEditing = editingId === inv.id;
                      const custTagihan = getCustomerTotalTagihan(inv.customerName);
                      const custCount = getCustomerInvoicesCount(inv.customerName);
                      const custAllTime = getCustomerTotalTagihanAllTime(inv.customerName);

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                          {isEditing ? (
                            <>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="text"
                                  value={editInvoiceNumber}
                                  onChange={(e) => setEditInvoiceNumber(e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <CustomerSelect
                                  customers={customers}
                                  value={editCustomerName}
                                  onChange={setEditCustomerName}
                                  required
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => {
                                    const newDate = e.target.value;
                                    setEditDate(newDate);
                                    if (newDate) {
                                      const d = new Date(newDate);
                                      d.setDate(d.getDate() + 30);
                                      setEditDueDate(format(d, "yyyy-MM-dd"));
                                    }
                                  }}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) => setEditDueDate(e.target.value)}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <input
                                  type="number"
                                  min="0"
                                  value={editTotalAmount}
                                  onChange={(e) =>
                                    setEditTotalAmount(e.target.value ? Number(e.target.value) : "")
                                  }
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-2 align-top">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                    inv.status === "PAID"
                                      ? "bg-green-100 text-green-700"
                                      : inv.status === "PARTIAL"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {inv.status === "PAID"
                                    ? "LUNAS"
                                    : inv.status === "PARTIAL"
                                    ? "SEBAGIAN"
                                    : "BELUM BAYAR"}
                                </span>
                              </td>
                              <td className="px-4 py-2 align-top text-right space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(inv.id)}
                                  className="rounded p-1 text-green-600 hover:bg-green-50"
                                  title="Simpan"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                  title="Batal"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-bold text-gray-900">
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                  {inv.invoiceNumber}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="font-bold text-gray-900 block">{inv.customerName}</span>
                                  {/* Total Tagihan Toko Badge/Button */}
                                  <button
                                    onClick={() => handleFilterByCustomer(inv.customerName)}
                                    className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-2 py-0.5 rounded-md transition-colors"
                                    title="Klik untuk memfilter faktur khusus konsumen ini"
                                  >
                                    <FileText size={11} className="text-blue-600" />
                                    <span>Total Tagihan: {formatRp(custTagihan)}</span>
                                    <span className="text-[10px] text-blue-600 font-normal">
                                      ({custCount} faktur)
                                    </span>
                                  </button>
                                  {isPeriodActive && custAllTime !== custTagihan && (
                                    <span className="text-[10px] text-gray-400 block ml-0.5">
                                      All-time: {formatRp(custAllTime)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={13} className="text-gray-400" />
                                  <span>{format(new Date(inv.date), "dd MMM yyyy", { locale: id })}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-900">{format(new Date(inv.dueDate), "dd MMM yyyy", { locale: id })}</div>
                                {differenceInDays(new Date(inv.dueDate), new Date()) < 0 &&
                                  inv.status !== "PAID" && (
                                    <span className="text-xs text-red-600 font-semibold">
                                      Lewat {Math.abs(differenceInDays(new Date(inv.dueDate), new Date()))} hari
                                    </span>
                                  )}
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-900 text-base">
                                {formatCurrency(inv.totalAmount)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                    inv.status === "PAID"
                                      ? "bg-green-100 text-green-700"
                                      : inv.status === "PARTIAL"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {inv.status === "PAID"
                                    ? "LUNAS"
                                    : inv.status === "PARTIAL"
                                    ? "SEBAGIAN"
                                    : "BELUM BAYAR"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                {onViewHistory && inv.payments.length > 0 && (
                                  <button
                                    onClick={() => onViewHistory(inv)}
                                    className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Riwayat Pembayaran"
                                  >
                                    <List size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditClick(inv)}
                                  className="rounded p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(inv.id)}
                                  className="rounded p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </>
                          )}
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
            totalItems={filteredInvoices.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            itemName="faktur"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TOTAL TAGIHAN PER KONSUMEN                                         */}
      {/* ========================================================================= */}
      {activeTab === "CUSTOMERS" && (
        <div className="space-y-4">
          {/* Customer Date Range & Filter Toolbar */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
            {/* Top row: Search, Sort & Toggle */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Customer Input */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50/50 px-3 py-2 flex-1 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
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
                  <option value="TAGIHAN_DESC">Total Tagihan Tertinggi</option>
                  <option value="TAGIHAN_ASC">Total Tagihan Terendah</option>
                  <option value="NAME_ASC">Nama Konsumen (A - Z)</option>
                  <option value="COUNT_DESC">Jumlah Faktur Terbanyak</option>
                  <option value="UTANG_DESC">Sisa Utang Terbesar</option>
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

            {/* Bottom row: Quick Preset Buttons & Active Customers Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-gray-400 font-medium mr-1 shrink-0">Pintasan Rentang:</span>
                <button
                  type="button"
                  onClick={handlePresetAll}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0 ${
                    !isPeriodActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

              {/* Only With Invoices in Period Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyWithInvoicesInPeriod(!onlyWithInvoicesInPeriod);
                    setCustomerCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    onlyWithInvoicesInPeriod
                      ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Filter size={13} className={onlyWithInvoicesInPeriod ? "text-indigo-600" : "text-gray-400"} />
                  <span>Hanya yang Ada Faktur di Rentang Ini</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                    {customersWithInvoicesCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Date Banner Notification */}
          {isPeriodActive && (
            <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200/80 px-4 py-2.5 rounded-xl text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600 shrink-0" />
                <span>
                  Menampilkan total tagihan faktur dalam rentang{" "}
                  <strong>{dateFilterType === "DUE_DATE" ? "Jatuh Tempo" : "Tanggal Faktur"}</strong>:{" "}
                  <strong>
                    {startDate ? format(new Date(startDate), "dd MMMM yyyy", { locale: id }) : "Awal"} s/d{" "}
                    {endDate ? format(new Date(endDate), "dd MMMM yyyy", { locale: id }) : "Sekarang"}
                  </strong>
                  . Akumulasi tagihan: <strong>{formatRp(grandTotalTagihanAll)}</strong> dari{" "}
                  <strong>{customersWithInvoicesCount} konsumen</strong>.
                </span>
              </div>
              <button
                onClick={handlePresetAll}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0"
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
              Akumulasi Tagihan {isPeriodActive ? "Periode Ini" : "Semua Waktu"}:{" "}
              <strong className="text-blue-700 font-bold">{formatRp(grandTotalTagihanAll)}</strong>
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
                  grandTotalTagihanAll > 0 ? Number(((c.totalTagihan / grandTotalTagihanAll) * 100).toFixed(1)) : 0;

                return (
                  <div
                    key={c.customerName}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {rank}
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{c.customerName}</h4>
                          <span className="text-[11px] text-gray-500">
                            {c.invoicesCount} faktur {isPeriodActive && "(di rentang ini)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block">
                          {isPeriodActive ? "Tagihan Periode Ini" : "Total Tagihan Faktur"}
                        </span>
                        <span className="text-base font-black text-blue-700">
                          {formatRp(c.totalTagihan)}
                        </span>
                        {isPeriodActive && c.totalTagihanAllTime !== c.totalTagihan && (
                          <span className="text-[10px] text-gray-400 block">
                            All-time: {formatRp(c.totalTagihanAllTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of Contribution */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Porsi dari Total Tagihan:</span>
                        <span className="font-bold text-indigo-700">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Total Terbayar:</span>
                        <span className="font-semibold text-emerald-700">{formatRp(c.totalPaid)}</span>
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
                        {c.latestInvoiceDate
                          ? `Faktur terakhir: ${format(new Date(c.latestInvoiceDate), "dd/MM/yyyy")}`
                          : "Belum ada faktur di rentang ini"}
                      </span>
                      <button
                        onClick={() => handleFilterByCustomer(c.customerName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                      >
                        <span>Lihat Faktur</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table: Customer Invoice Ranking Table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider w-12 text-center">No</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Nama Konsumen</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                      {isPeriodActive ? "Total Tagihan (Periode)" : "Total Tagihan Faktur"}
                    </th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Jumlah Faktur</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Total Terbayar</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Sisa Utang</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Faktur Terakhir</th>
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
                        grandTotalTagihanAll > 0 ? ((c.totalTagihan / grandTotalTagihanAll) * 100).toFixed(1) : "0";

                      return (
                        <tr key={c.customerName} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-4 text-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold inline-flex items-center justify-center">
                              {rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 text-sm">{c.customerName}</div>
                            <span className="text-[11px] text-gray-400">
                              {c.invoicesCountAllTime} faktur total tersimpan
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-black text-blue-700 text-base">
                              {formatRp(c.totalTagihan)}
                            </div>
                            {isPeriodActive && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block text-[10px] text-blue-800 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded font-semibold">
                                  Periode Ini
                                </span>
                                {c.totalTagihanAllTime !== c.totalTagihan && (
                                  <span className="text-[11px] text-gray-400">
                                    All-time: {formatRp(c.totalTagihanAllTime)}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              <FileText size={12} />
                              {c.invoicesCount} faktur
                            </span>
                            {isPeriodActive && c.invoicesCountAllTime !== c.invoicesCount && (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Total: {c.invoicesCountAllTime} faktur
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-emerald-700">
                            {formatRp(c.totalPaid)}
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
                            {c.latestInvoiceDate ? (
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-gray-400" />
                                <span>{format(new Date(c.latestInvoiceDate), "dd MMM yyyy", { locale: id })}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Tidak ada transaksi</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(3, Number(percentage)))}%` }}
                                />
                              </div>
                              <span className="font-bold text-gray-700 text-xs">{percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleFilterByCustomer(c.customerName)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                              title="Lihat daftar faktur milik konsumen ini"
                            >
                              <span>Lihat Faktur</span>
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
