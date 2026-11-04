import React, { useState } from "react";
import { Invoice } from "../types";
import { Search, FileDown, Calendar, Edit2, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";

interface PaymentHistoryProps {
  invoices: Invoice[];
  onEditPayment: (invoiceId: string, paymentId: string, newAmount: number, newDate: string) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
}

export function PaymentHistory({ invoices, onEditPayment, onDeletePayment }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");

  const formatRp = (num: number) => `Rp${new Intl.NumberFormat("id-ID").format(num)}`;

  const allPayments = invoices.flatMap(inv => 
    inv.payments.map(p => ({
      payment: p,
      invoice: inv
    }))
  ).sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());

  const filteredPayments = allPayments.filter(({ payment, invoice }) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchLower) ||
      invoice.invoiceNumber.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (startDate || endDate) {
      const pDate = new Date(payment.date);
      pDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (pDate < sDate) return false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (pDate > eDate) return false;
      }
    }

    return true;
  });

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

  const exportExcel = () => {
    const aoa: any[][] = [
      ["NO", "TANGGAL BAYAR", "KONSUMEN", "NO FAKTUR", "NOMINAL FAKTUR", "NOMINAL BAYAR", "SISA TAGIHAN", "KETERANGAN"],
    ];

    let counter = 1;
    let totalNominalFaktur = 0;
    let totalNominalBayar = 0;
    let totalSisaTagihan = 0;

    filteredPayments.forEach(({ payment, invoice }) => {
      const pDate = new Date(payment.date);
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = invoice.totalAmount - totalPaid;
      
      totalNominalFaktur += invoice.totalAmount;
      totalNominalBayar += payment.amount;
      // We only sum up sisa tagihan if it makes sense, maybe not total Sisa Tagihan as it would duplicate per payment.
      // But let's just leave it empty or sum it up for the rows shown.
      totalSisaTagihan += sisa;
      
      aoa.push([
        counter++,
        format(pDate, "dd-MMM-yy", { locale: id }),
        invoice.customerName,
        invoice.invoiceNumber,
        formatRp(invoice.totalAmount),
        formatRp(payment.amount),
        formatRp(sisa),
        sisa <= 0 ? "Lunas" : "Belum Lunas"
      ]);
    });

    aoa.push([
      "",
      "",
      "",
      "TOTAL",
      formatRp(totalNominalFaktur),
      formatRp(totalNominalBayar),
      "",
      ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const borderStyle = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    };
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "E5E7EB" } },
      border: borderStyle
    };
    const totalStyle = {
      font: { bold: true },
      border: borderStyle
    };
    const regularStyle = {
      border: borderStyle
    };

    for (let R = 0; R < aoa.length; ++R) {
      const isTotal = R === aoa.length - 1;
      for (let C = 0; C < aoa[R].length; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (ws[cell_ref]) {
          if (R === 0) {
            ws[cell_ref].s = headerStyle;
          } else if (isTotal) {
            ws[cell_ref].s = totalStyle;
          } else {
            ws[cell_ref].s = regularStyle;
          }
        }
      }
    }

    const wscols = [
      { wch: 5 },  // NO
      { wch: 15 }, // TGL BAYAR
      { wch: 25 }, // KONSUMEN
      { wch: 15 }, // NO FAKTUR
      { wch: 18 }, // NOMINAL FAKTUR
      { wch: 18 }, // NOMINAL BAYAR
      { wch: 18 }, // SISA TAGIHAN
      { wch: 15 }, // KETERANGAN
    ];
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Pembayaran");
    XLSX.writeFile(wb, `Riwayat_Pembayaran_${format(new Date(), "dd-MMM-yyyy")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h2>
          <p className="text-sm text-gray-500 mt-1">Lihat seluruh riwayat pembayaran konsumen.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
          >
            <FileDown size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 w-full max-w-md">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari faktur / konsumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none w-full sm:w-auto"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="space-y-3 block md:hidden">
        {filteredPayments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
            Tidak ada data pembayaran yang ditemukan.
          </div>
        ) : (
          filteredPayments.map(({ payment, invoice }) => {
            const isEditing = editingPaymentId === payment.id;

            if (isEditing) {
              return (
                <div key={payment.id} className="rounded-xl border-2 border-blue-400 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-blue-700">Edit Pembayaran</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveEdit(invoice.id, payment.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        <Check size={14} /> Simpan
                      </button>
                      <button
                        onClick={() => setEditingPaymentId(null)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <X size={14} /> Batal
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Konsumen & Faktur:</span>
                    <p className="text-sm font-bold text-gray-900">{invoice.customerName} ({invoice.invoiceNumber})</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Bayar</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Bayar (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={payment.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{invoice.customerName}</h4>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 mt-1">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Nominal Bayar</span>
                    <span className="font-extrabold text-emerald-600 text-sm sm:text-base">
                      {formatRp(payment.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" />
                    <span>{format(new Date(payment.date), "dd MMM yyyy", { locale: id })}</span>
                  </div>
                  <span className="text-gray-400">Total Faktur: {formatRp(invoice.totalAmount)}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(payment.id, payment.date, payment.amount)}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id, payment.id)}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={13} /> Hapus
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
                <th className="px-6 py-4 font-medium">Tanggal Bayar</th>
                <th className="px-6 py-4 font-medium">Konsumen</th>
                <th className="px-6 py-4 font-medium">No Faktur</th>
                <th className="px-6 py-4 font-medium">Nominal Faktur</th>
                <th className="px-6 py-4 font-medium">Nominal Bayar</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data pembayaran yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(({ payment, invoice }) => (
                  editingPaymentId === payment.id ? (
                    <tr key={payment.id} className="bg-blue-50/50">
                      <td className="px-4 py-2 align-top">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 align-top text-gray-900 font-medium">
                        {invoice.customerName}
                      </td>
                      <td className="px-4 py-2 align-top text-gray-500">
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
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar size={16} className="text-gray-400" />
                        {format(new Date(payment.date), "dd MMM yyyy", { locale: id })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatRp(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
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
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
