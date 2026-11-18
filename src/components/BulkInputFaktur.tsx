import React, { useMemo, useState } from "react";
import { Customer, Invoice } from "../types";
import { formatCurrency } from "../utils";
import {
  Plus,
  Trash2,
  UserPlus,
  FileDown,
  Upload,
  FilePlus2,
  CopyPlus,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  CalendarClock,
  Save,
  X,
} from "lucide-react";
import { addDays, format, differenceInDays } from "date-fns";
import { CustomerSelect } from "./CustomerSelect";
import * as XLSX from "xlsx";

interface BulkInputFakturProps {
  customers: Customer[];
  existingInvoiceNumbers: string[];
  onSave: (invoices: Omit<Invoice, "id" | "payments" | "status">[]) => void;
  onCancel: () => void;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  termDays: number | "";
  dueDate: string;
  totalAmount: string;
}

interface InvoiceGroup {
  id: string;
  customerName: string;
  rows: InvoiceRow[];
}

export function BulkInputFaktur({
  customers,
  existingInvoiceNumbers,
  onSave,
  onCancel,
}: BulkInputFakturProps) {
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [formNotice, setFormNotice] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [duplicateDraftInvoices, setDuplicateDraftInvoices] = useState<
    Omit<Invoice, "id" | "payments" | "status">[] | null
  >(null);

  const createEmptyRow = (termDays = 30): InvoiceRow => {
    const today = new Date();
    return {
      id: crypto.randomUUID(),
      invoiceNumber: "",
      date: format(today, "yyyy-MM-dd"),
      termDays,
      dueDate: format(addDays(today, termDays), "yyyy-MM-dd"),
      totalAmount: "",
    };
  };

  const createEmptyGroup = (): InvoiceGroup => ({
    id: crypto.randomUUID(),
    customerName: "",
    rows: [createEmptyRow(), createEmptyRow()],
  });

  const [groups, setGroups] = useState<InvoiceGroup[]>([createEmptyGroup()]);

  const existingSet = useMemo(
    () => new Set(existingInvoiceNumbers.map((n) => n.trim().toLowerCase())),
    [existingInvoiceNumbers]
  );

  // Track duplicate counts across all active rows for instant row-level feedback
  const draftNumberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    groups.forEach((g) =>
      g.rows.forEach((r) => {
        const key = r.invoiceNumber.trim().toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
      })
    );
    return counts;
  }, [groups]);

  // Live batch metrics
  const batchStats = useMemo(() => {
    let validCount = 0;
    let totalNominal = 0;

    groups.forEach((g) => {
      g.rows.forEach((r) => {
        const num = parseFloat(r.totalAmount);
        if (!isNaN(num) && num > 0) {
          totalNominal += num;
        }
        if (
          g.customerName.trim() &&
          r.invoiceNumber.trim() &&
          r.date &&
          r.dueDate &&
          !isNaN(num) &&
          num > 0
        ) {
          validCount++;
        }
      });
    });

    return {
      groupCount: groups.length,
      totalRows: groups.reduce((sum, g) => sum + g.rows.length, 0),
      validCount,
      totalNominal,
    };
  }, [groups]);

  const updateGroupCustomer = (groupId: string, val: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, customerName: val } : g))
    );
  };

  const applyTermToGroup = (groupId: string, term: number) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          rows: g.rows.map((row) => ({
            ...row,
            termDays: term,
            dueDate: row.date
              ? format(addDays(new Date(row.date), term), "yyyy-MM-dd")
              : row.dueDate,
          })),
        };
      })
    );
  };

  const updateRow = (
    groupId: string,
    rowId: string,
    field: keyof InvoiceRow,
    value: string | number
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;

        const newRows = g.rows.map((row) => {
          if (row.id !== rowId) return row;

          const newRow = { ...row, [field]: value };

          if (field === "date" || field === "termDays") {
            if (newRow.date && typeof newRow.termDays === "number") {
              newRow.dueDate = format(
                addDays(new Date(newRow.date), newRow.termDays),
                "yyyy-MM-dd"
              );
            }
          } else if (field === "dueDate") {
            if (newRow.date && newRow.dueDate) {
              const diff = differenceInDays(
                new Date(newRow.dueDate),
                new Date(newRow.date)
              );
              newRow.termDays = diff >= 0 ? diff : "";
            }
          }

          return newRow;
        });

        return { ...g, rows: newRows };
      })
    );
  };

  const addRowsToGroup = (groupId: string, count = 1) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const lastTerm =
          typeof g.rows[g.rows.length - 1]?.termDays === "number"
            ? (g.rows[g.rows.length - 1].termDays as number)
            : 30;
        const additions = Array.from({ length: count }, () => createEmptyRow(lastTerm));
        return { ...g, rows: [...g.rows, ...additions] };
      })
    );
  };

  const duplicateRow = (groupId: string, row: InvoiceRow) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const idx = g.rows.findIndex((r) => r.id === row.id);
        const cloned: InvoiceRow = {
          ...row,
          id: crypto.randomUUID(),
          invoiceNumber: row.invoiceNumber ? `${row.invoiceNumber}-COPY` : "",
        };
        const updated = [...g.rows];
        updated.splice(idx + 1, 0, cloned);
        return { ...g, rows: updated };
      })
    );
  };

  const removeRowFromGroup = (groupId: string, rowId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (g.rows.length <= 1) return g;
        return { ...g, rows: g.rows.filter((r) => r.id !== rowId) };
      })
    );
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, createEmptyGroup()]);
  };

  const removeGroup = (groupId: string) => {
    if (groups.length > 1) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  const handleResetAll = () => {
    setGroups([createEmptyGroup()]);
    setImportErrors([]);
    setFormNotice(null);
  };

  const downloadTemplate = () => {
    const aoa = [
      ["KONSUMEN", "NO FAKTUR", "TANGGAL FAKTUR", "TERMIN (HARI)", "TOTAL TAGIHAN"],
      ["BD DIAN JATITUJUH", "INV-1001", format(new Date(), "yyyy-MM-dd"), "30", "500000"],
      ["BD DIAN JATITUJUH", "INV-1002", format(new Date(), "yyyy-MM-dd"), "30", "750000"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Faktur");
    XLSX.writeFile(wb, "Template_Import_Faktur.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setFormNotice(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        const rows = jsonData.slice(1);
        const errors: string[] = [];
        const groupsByCustomer: Record<string, InvoiceRow[]> = {};

        rows.forEach((row, index) => {
          if (!row || row.length === 0) return;

          const rowIndex = index + 2;
          const custName = (row[0] || "").toString().trim();
          const invNum = (row[1] || "").toString().trim();

          let dateStr = row[2];
          if (dateStr === undefined || dateStr === null || dateStr === "") {
            dateStr = format(new Date(), "yyyy-MM-dd");
          } else if (typeof dateStr === "number") {
            const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
            dateStr = d.toISOString().split("T")[0];
          } else {
            dateStr = String(dateStr);
          }

          const termRaw = row[3];
          let term = 30;
          if (termRaw !== undefined && termRaw !== null && termRaw !== "") {
            term = parseInt(String(termRaw), 10);
            if (isNaN(term)) term = 30;
          }

          const amountRaw = row[4];
          let amount = "";
          if (amountRaw !== undefined && amountRaw !== null && amountRaw !== "") {
            amount = amountRaw.toString().trim();
          }

          const rowErrors: string[] = [];
          if (!custName) rowErrors.push("Konsumen kosong");
          if (!invNum) rowErrors.push("No Faktur kosong");
          if (!amount) rowErrors.push("Total Tagihan kosong");
          else if (isNaN(parseFloat(amount))) rowErrors.push("Total Tagihan bukan angka");

          if (rowErrors.length > 0) {
            errors.push(`Baris ${rowIndex}: ${rowErrors.join(", ")}`);
            return;
          }

          if (!groupsByCustomer[custName]) {
            groupsByCustomer[custName] = [];
          }
          groupsByCustomer[custName].push({
            id: crypto.randomUUID(),
            invoiceNumber: invNum,
            date: dateStr,
            termDays: term,
            dueDate: format(addDays(new Date(dateStr), term), "yyyy-MM-dd"),
            totalAmount: amount.toString(),
          });
        });

        if (errors.length > 0) {
          setImportErrors(errors);
        }

        const newGroups = Object.entries(groupsByCustomer).map(
          ([custName, custRows]) => ({
            id: crypto.randomUUID(),
            customerName: custName,
            rows: custRows,
          })
        );

        if (newGroups.length > 0) {
          const importedTotal = newGroups.reduce((s, g) => s + g.rows.length, 0);
          setGroups((prev) => {
            const isEmpty =
              prev.length === 1 &&
              prev[0].customerName === "" &&
              prev[0].rows.every(
                (r) => r.invoiceNumber === "" && r.totalAmount === ""
              );
            return isEmpty ? newGroups : [...prev, ...newGroups];
          });
          setFormNotice({
            type: "success",
            text: `Berhasil memuat ${importedTotal} faktur dari ${newGroups.length} konsumen ke dalam daftar input.`,
          });
        } else if (errors.length === 0) {
          setFormNotice({
            type: "error",
            text: "Tidak ada data faktur yang valid di file Excel tersebut.",
          });
        }
      } catch (err) {
        console.error("Error reading file", err);
        setFormNotice({
          type: "error",
          text: "Gagal membaca file Excel. Pastikan format file .xlsx atau .xls benar.",
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    let allValidRows: Omit<Invoice, "id" | "payments" | "status">[] = [];

    for (const group of groups) {
      const validRows = group.rows.filter(
        (r) =>
          r.invoiceNumber.trim() &&
          group.customerName.trim() &&
          r.date &&
          r.dueDate &&
          r.totalAmount
      );

      const processedInvoices = validRows.map((r) => {
        const amount = parseFloat(r.totalAmount);
        return {
          invoiceNumber: r.invoiceNumber.trim(),
          customerName: group.customerName.trim(),
          date: r.date,
          dueDate: r.dueDate,
          totalAmount: isNaN(amount) ? 0 : amount,
        };
      });

      allValidRows = [...allValidRows, ...processedInvoices];
    }

    if (allValidRows.length === 0) {
      setFormNotice({
        type: "error",
        text: "Harap isi minimal satu faktur dengan lengkap beserta nama konsumennya.",
      });
      return;
    }

    if (allValidRows.some((inv) => inv.totalAmount <= 0)) {
      setFormNotice({
        type: "error",
        text: "Terdapat tagihan dengan nominal 0 atau tidak valid. Periksa kembali nominal tagihan.",
      });
      return;
    }

    const seenInDraft = new Set<string>();
    let hasDuplicate = false;

    for (const inv of allValidRows) {
      const invNum = inv.invoiceNumber.toLowerCase();
      if (existingSet.has(invNum) || seenInDraft.has(invNum)) {
        hasDuplicate = true;
        break;
      }
      seenInDraft.add(invNum);
    }

    if (hasDuplicate) {
      setDuplicateDraftInvoices(allValidRows);
      return;
    }

    onSave(allValidRows);
  };

  const handleConfirmAutoRenameDuplicates = () => {
    if (!duplicateDraftInvoices) return;
    const combinedExisting = new Set(existingSet);
    const generatedRows = duplicateDraftInvoices.map((inv) => {
      let newNumber = inv.invoiceNumber;
      let counter = 1;
      while (combinedExisting.has(newNumber.toLowerCase())) {
        newNumber = `${inv.invoiceNumber}-${counter}`;
        counter++;
      }
      combinedExisting.add(newNumber.toLowerCase());
      return { ...inv, invoiceNumber: newNumber };
    });
    setDuplicateDraftInvoices(null);
    onSave(generatedRows);
  };

  const isRowDuplicate = (invoiceNumber: string) => {
    const key = invoiceNumber.trim().toLowerCase();
    if (!key) return false;
    return existingSet.has(key) || (draftNumberCounts[key] || 0) > 1;
  };

  return (
    <div className="space-y-5 w-full">
      {/* Studio Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#1e40af,0_8px_16px_-4px_rgba(37,99,235,0.35)]">
              <FilePlus2 size={23} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Studio Input Faktur
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Catat faktur baru secara massal per konsumen atau impor langsung dari file Excel.
              </p>
            </div>
          </div>

          {/* Excel & Form Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 border-b-[3px] border-b-slate-400 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all whitespace-nowrap shrink-0"
            >
              <FileDown size={16} className="text-blue-600" />
              <span>Template Excel</span>
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Import Data dari Excel"
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-all whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet size={16} />
                <span>Import Excel</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all whitespace-nowrap shrink-0"
              title="Bersihkan seluruh form input"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Batch Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 rounded-xl bg-slate-50/90 border border-slate-200/80 p-3.5 sm:px-5">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Konsumen</div>
            <div className="font-mono tabular-nums text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              {batchStats.groupCount}
              <span className="text-xs font-sans font-medium text-slate-500 ml-1">grup</span>
            </div>
          </div>

          <div className="border-l border-slate-200 pl-3 sm:pl-4">
            <div className="text-[11px] font-medium text-slate-500">Faktur Siap Simpan</div>
            <div className="font-mono tabular-nums text-base sm:text-lg font-extrabold text-blue-600 mt-0.5">
              {batchStats.validCount}
              <span className="text-xs font-sans font-medium text-slate-400 ml-1">
                / {batchStats.totalRows}
              </span>
            </div>
          </div>

          <div className="border-l border-slate-200 pl-3 sm:pl-4">
            <div className="text-[11px] font-medium text-slate-500">Total Nominal Batch</div>
            <div className="font-mono tabular-nums text-sm sm:text-lg font-extrabold text-emerald-700 mt-0.5 truncate">
              {formatCurrency(batchStats.totalNominal)}
            </div>
          </div>
        </div>

        {/* Inline Notice */}
        {formNotice && (
          <div
            className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium border ${
              formNotice.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {formNotice.type === "success" ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
              )}
              <span>{formNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormNotice(null)}
              className="p-1 rounded-lg hover:bg-black/5 shrink-0"
              aria-label="Tutup pemberitahuan"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Excel Import Error List */}
        {importErrors.length > 0 && (
          <div className="rounded-xl bg-rose-50 p-4 border border-rose-200 text-xs sm:text-sm text-rose-800">
            <p className="font-bold mb-1.5 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>Terdapat {importErrors.length} baris bermasalah saat import Excel:</span>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {groups.map((group, groupIndex) => {
          const groupSubtotal = group.rows.reduce((sum, r) => {
            const val = parseFloat(r.totalAmount);
            return sum + (!isNaN(val) && val > 0 ? val : 0);
          }, 0);

          return (
            <div
              key={group.id}
              className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm"
            >
              {/* Customer Folio Header */}
              <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/40 px-4 sm:px-6 py-4 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 text-white font-mono tabular-nums text-xs font-extrabold flex items-center justify-center shrink-0 shadow-[0_3px_0_#020617]">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0 max-w-md">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Konsumen / Toko <span className="text-rose-500">*</span>
                    </label>
                    <CustomerSelect
                      customers={customers}
                      value={group.customerName}
                      onChange={(val) => updateGroupCustomer(group.id, val)}
                      required={groupIndex === 0}
                    />
                  </div>
                </div>

                {/* Quick Term Selector + Subtotal + Delete Group */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-1 lg:pt-0">
                  {/* Batch Term Presets */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 px-1.5 flex items-center gap-1">
                      <CalendarClock size={12} className="text-blue-600" />
                      Termin:
                    </span>
                    {[14, 30, 45, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => applyTermToGroup(group.id, days)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-white hover:bg-blue-600 hover:text-white border border-slate-200/80 transition-colors"
                        title={`Atur semua baris menjadi termin ${days} hari`}
                      >
                        {days}h
                      </button>
                    ))}
                  </div>

                  {/* Subtotal Konsumen */}
                  <div className="text-right px-2">
                    <div className="text-[10px] font-semibold text-slate-500">
                      Subtotal ({group.rows.length} baris)
                    </div>
                    <div className="font-mono tabular-nums text-sm font-extrabold text-slate-900">
                      {formatCurrency(groupSubtotal)}
                    </div>
                  </div>

                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                      title="Hapus kelompok konsumen ini"
                    >
                      <Trash2 size={14} />
                      <span>Hapus Grup</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-4">
                {/* Mobile View: Card-based Invoice Rows */}
                <div className="space-y-3 block md:hidden">
                  {group.rows.map((row, rowIndex) => {
                    const dup = isRowDuplicate(row.invoiceNumber);
                    return (
                      <div
                        key={row.id}
                        className={`rounded-xl border p-3.5 space-y-3 ${
                          dup
                            ? "border-amber-300 bg-amber-50/40"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                          <span className="font-mono text-xs font-extrabold text-slate-700">
                            Faktur #{String(rowIndex + 1).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => duplicateRow(group.id, row)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              title="Gandakan baris ini"
                            >
                              <CopyPlus size={14} />
                              <span>Duplikat</span>
                            </button>
                            {group.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRowFromGroup(group.id, row.id)}
                                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold"
                              >
                                <Trash2 size={14} />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            No. Faktur *
                          </label>
                          <input
                            type="text"
                            required={groupIndex === 0 && rowIndex === 0}
                            value={row.invoiceNumber}
                            onChange={(e) =>
                              updateRow(group.id, row.id, "invoiceNumber", e.target.value)
                            }
                            placeholder="INV-..."
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
                              dup
                                ? "border-amber-400 focus:ring-amber-500/20"
                                : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                            }`}
                          />
                          {dup && (
                            <p className="text-[11px] text-amber-700 font-medium mt-1">
                              Nomor faktur ini sudah terdaftar atau ganda di daftar.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Tgl Faktur *
                            </label>
                            <input
                              type="date"
                              required={groupIndex === 0 && rowIndex === 0}
                              value={row.date}
                              onChange={(e) =>
                                updateRow(group.id, row.id, "date", e.target.value)
                              }
                              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Termin (Hari)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={row.termDays}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? ""
                                    : parseInt(e.target.value, 10);
                                updateRow(group.id, row.id, "termDays", val);
                              }}
                              placeholder="30"
                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Jatuh Tempo *
                          </label>
                          <input
                            type="date"
                            required={groupIndex === 0 && rowIndex === 0}
                            value={row.dueDate}
                            onChange={(e) =>
                              updateRow(group.id, row.id, "dueDate", e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Total Tagihan (Rp) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              Rp
                            </span>
                            <input
                              type="number"
                              min="1"
                              required={groupIndex === 0 && rowIndex === 0}
                              value={row.totalAmount}
                              onChange={(e) =>
                                updateRow(group.id, row.id, "totalAmount", e.target.value)
                              }
                              placeholder="1500000"
                              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm font-mono tabular-nums font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop/Tablet View: High-Density Ledger Table */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[740px] text-left text-sm bg-white">
                    <thead className="bg-slate-100/90 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-3 font-bold w-12 text-center">#</th>
                        <th className="px-3 py-3 font-bold">No. Faktur *</th>
                        <th className="px-3 py-3 font-bold w-40">Tgl Faktur *</th>
                        <th className="px-3 py-3 font-bold w-28">Termin</th>
                        <th className="px-3 py-3 font-bold w-40">Jatuh Tempo *</th>
                        <th className="px-3 py-3 font-bold text-right">Total Tagihan (Rp) *</th>
                        <th className="px-3 py-3 font-bold w-24 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.rows.map((row, rowIndex) => {
                        const dup = isRowDuplicate(row.invoiceNumber);
                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              dup ? "bg-amber-50/50" : "hover:bg-blue-50/25"
                            }`}
                          >
                            <td className="px-2 py-2.5 text-center font-mono tabular-nums text-xs font-bold text-slate-400">
                              {String(rowIndex + 1).padStart(2, "0")}
                            </td>
                            <td className="px-2 py-2.5">
                              <input
                                type="text"
                                required={groupIndex === 0 && rowIndex === 0}
                                value={row.invoiceNumber}
                                onChange={(e) =>
                                  updateRow(group.id, row.id, "invoiceNumber", e.target.value)
                                }
                                placeholder="INV-..."
                                className={`w-full rounded-lg border bg-white px-2.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
                                  dup
                                    ? "border-amber-400 text-amber-900 focus:ring-amber-500/20"
                                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                }`}
                              />
                              {dup && (
                                <span className="block text-[10px] font-semibold text-amber-700 mt-0.5">
                                  No. faktur ganda / sudah ada
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2.5">
                              <input
                                type="date"
                                required={groupIndex === 0 && rowIndex === 0}
                                value={row.date}
                                onChange={(e) =>
                                  updateRow(group.id, row.id, "date", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                              />
                            </td>
                            <td className="px-2 py-2.5">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.termDays}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value, 10);
                                    updateRow(group.id, row.id, "termDays", val);
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white pl-2.5 pr-7 py-2 text-sm font-mono tabular-nums focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400">
                                  hr
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-2.5">
                              <input
                                type="date"
                                required={groupIndex === 0 && rowIndex === 0}
                                value={row.dueDate}
                                onChange={(e) =>
                                  updateRow(group.id, row.id, "dueDate", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                              />
                            </td>
                            <td className="px-2 py-2.5">
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  required={groupIndex === 0 && rowIndex === 0}
                                  value={row.totalAmount}
                                  onChange={(e) =>
                                    updateRow(group.id, row.id, "totalAmount", e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2.5 py-2 text-sm font-mono tabular-nums font-bold text-right text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <div className="inline-flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateRow(group.id, row)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="Duplikat baris ini"
                                >
                                  <CopyPlus size={15} />
                                </button>
                                {group.rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeRowFromGroup(group.id, row.id)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                    title="Hapus baris ini"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Group Row Add Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => addRowsToGroup(group.id, 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm font-bold transition-colors"
                  >
                    <Plus size={15} />
                    <span>Tambah 1 Baris</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addRowsToGroup(group.id, 5)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    <span>+ 5 Baris Sekaligus</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Consumer Group Button */}
        <div>
          <button
            type="button"
            onClick={addGroup}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-blue-50/40 hover:border-blue-400 hover:text-blue-700 w-full transition-all"
          >
            <UserPlus size={18} />
            <span>Tambah Kelompok Konsumen Lainnya</span>
          </button>
        </div>

        {/* Bottom Submit Action Bar */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-600">
            Siap menyimpan{" "}
            <strong className="font-mono tabular-nums text-slate-900">
              {batchStats.validCount}
            </strong>{" "}
            faktur senilai{" "}
            <strong className="font-mono tabular-nums text-emerald-700">
              {formatCurrency(batchStats.totalNominal)}
            </strong>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all"
            >
              <Save size={16} />
              <span>Simpan Semua Faktur</span>
            </button>
          </div>
        </div>
      </form>

      {/* Duplicate Invoice Number Confirmation Modal */}
      {duplicateDraftInvoices && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDuplicateDraftInvoices(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Nomor Faktur Ganda Terdeteksi
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateDraftInvoices(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Terdapat nomor faktur yang sama dengan data faktur sebelumnya atau ganda di dalam daftar ini. Apakah Anda ingin membuatkan akhiran nomor faktur baru secara otomatis (mis. <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">-1</code>) sebelum menyimpan?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateDraftInvoices(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmAutoRenameDuplicates}
                className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-all"
              >
                Buatkan Otomatis & Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
