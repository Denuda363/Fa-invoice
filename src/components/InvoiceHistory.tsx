import React, { useState } from "react";
import { Invoice, Customer } from "../types";
import { formatCurrency } from "../utils";
import { Search, Edit2, Trash2, X, Check, Eye, List } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { CustomerSelect } from "./CustomerSelect";
import { Pagination } from "./Pagination";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Edit state
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState<number | "">("");

  const filteredInvoices = invoices
    .filter(
      (inv) =>
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = pageSize > 0 ? Math.ceil(filteredInvoices.length / pageSize) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const paginatedInvoices =
    pageSize === 0
      ? filteredInvoices
      : filteredInvoices.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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
      const generateNew = window.confirm(`No faktur ${finalInvoiceNumber} sudah digunakan. Buatkan no faktur otomatis yang berbeda?`);
      if (!generateNew) {
        return;
      }
      
      const existingNumbers = new Set(invoices.map(inv => inv.id !== id ? inv.invoiceNumber.toLowerCase() : ""));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat Faktur</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola dan edit faktur yang telah diinput.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 w-full sm:w-64">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Cari faktur / konsumen..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="space-y-3 block md:hidden">
        {filteredInvoices.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
            Tidak ada faktur yang ditemukan.
          </div>
        ) : (
          paginatedInvoices.map((inv) => {
            const isEditing = editingId === inv.id;
            const diffDays = differenceInDays(new Date(inv.dueDate), new Date());
            const isOverdue = diffDays < 0 && inv.status !== "PAID";

            if (isEditing) {
              return (
                <div key={inv.id} className="rounded-xl border-2 border-blue-400 bg-white p-4 shadow-sm space-y-3">
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Total Tagihan (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={editTotalAmount}
                      onChange={(e) => setEditTotalAmount(e.target.value ? Number(e.target.value) : "")}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={inv.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-gray-900 text-sm">{inv.invoiceNumber}</span>
                    <h4 className="text-xs text-gray-700 font-semibold">{inv.customerName}</h4>
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
                <th className="px-4 py-3 font-medium">No. Faktur</th>
                <th className="px-4 py-3 font-medium">Konsumen</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
                <th className="px-4 py-3 font-medium">Total (Rp)</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada faktur yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const isEditing = editingId === inv.id;
                  
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
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
                              onChange={(e) => setEditTotalAmount(e.target.value ? Number(e.target.value) : "")}
                              className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 align-top">
                             <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                inv.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : inv.status === "PARTIAL"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
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
                          <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3">{inv.customerName}</td>
                          <td className="px-4 py-3">{format(new Date(inv.date), "dd/MM/yyyy")}</td>
                          <td className="px-4 py-3">
                            <div>{format(new Date(inv.dueDate), "dd/MM/yyyy")}</div>
                            {differenceInDays(new Date(inv.dueDate), new Date()) < 0 && inv.status !== "PAID" && (
                              <span className="text-xs text-red-600 font-medium">Lewat waktu</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(inv.totalAmount)}</td>
                          <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                inv.status === "PAID"
                                  ? "bg-green-100 text-green-700"
                                  : inv.status === "PARTIAL"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {inv.status === "PAID"
                                  ? "LUNAS"
                                  : inv.status === "PARTIAL"
                                  ? "SEBAGIAN"
                                  : "BELUM BAYAR"}
                              </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                            {onViewHistory && inv.payments.length > 0 && (
                              <button
                                onClick={() => onViewHistory(inv)}
                                className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                                title="Riwayat Pembayaran"
                              >
                                <List size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(inv)}
                              className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="rounded p-1.5 text-red-600 hover:bg-red-50"
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
  );
}
