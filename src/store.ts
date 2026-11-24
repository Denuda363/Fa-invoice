import { useState, useEffect, useRef } from "react";
import { Invoice, Payment, Customer, AppData, CompanyProfile } from "./types";
import { v4 as uuidv4 } from "uuid";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { CreateNotificationInput } from "./context/NotificationContext";
import { formatCurrency } from "./utils";

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: "AF Faktur",
  tagline: "Manajemen Faktur",
  phone: "",
  email: "",
  address: "",
  npwp: "",
  ownerName: "",
  iconUrl: "",
};

const COMPANY_STORAGE_KEY = "af_faktur_company_profile_v1";

const loadCachedCompanyProfile = (): CompanyProfile => {
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load cached company profile:", e);
  }
  return DEFAULT_COMPANY_PROFILE;
};

const saveCachedCompanyProfile = (profile: CompanyProfile) => {
  try {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to cache company profile:", e);
  }
};

const INITIAL_DATA: AppData = {
  invoices: [],
  customers: [],
  companyProfile: loadCachedCompanyProfile(),
};

const deduplicateInvoices = (invoices: Invoice[]): Invoice[] => {
  const seen = new Set<string>();
  return invoices.map((inv) => {
    let newNumber = inv.invoiceNumber;
    let counter = 1;
    while (seen.has(newNumber.toLowerCase())) {
      newNumber = `${inv.invoiceNumber}-${counter}`;
      counter++;
    }
    seen.add(newNumber.toLowerCase());
    return { ...inv, invoiceNumber: newNumber };
  });
};

export function useAppStore(
  onNotify?: (input: CreateNotificationInput, iconUrl?: string, companyName?: string) => void
) {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const dataRef = useRef<AppData>(data);
  dataRef.current = data;

  const emitNotify = (input: CreateNotificationInput) => {
    if (!onNotify) return;
    const profile = dataRef.current.companyProfile || DEFAULT_COMPANY_PROFILE;
    onNotify(input, profile.iconUrl, profile.name);
  };

  // Sync state to Firebase
  useEffect(() => {
    setIsLoading(true);

    const docRef = doc(db, "appData", "main");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as AppData;
          const mergedProfile = remoteData.companyProfile
            ? { ...DEFAULT_COMPANY_PROFILE, ...remoteData.companyProfile }
            : loadCachedCompanyProfile();

          if (remoteData.companyProfile) {
            saveCachedCompanyProfile(mergedProfile);
          }

          setData({
            invoices: deduplicateInvoices(remoteData.invoices || []),
            customers: remoteData.customers || [],
            companyProfile: mergedProfile,
          });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore sync error:", error);
        setIsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persist local mutations
  const mutateData = (mutator: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = mutator(prev);

      if (next.companyProfile) {
        saveCachedCompanyProfile(next.companyProfile);
      }

      // Save to Firebase
      setDoc(doc(db, "appData", "main"), next).catch((e) => {
        console.error("Error saving to Firestore", e);
      });
      return next;
    });
  };

  const resetData = () => {
    mutateData((prev) => ({
      invoices: [],
      customers: [],
      companyProfile: prev.companyProfile || DEFAULT_COMPANY_PROFILE,
    }));
  };

  const updateCompanyProfile = (profile: CompanyProfile) => {
    const cleanProfile: CompanyProfile = {
      ...DEFAULT_COMPANY_PROFILE,
      ...profile,
      name: profile.name.trim() || DEFAULT_COMPANY_PROFILE.name,
      tagline: profile.tagline.trim() || DEFAULT_COMPANY_PROFILE.tagline,
    };
    saveCachedCompanyProfile(cleanProfile);
    mutateData((prev) => ({
      ...prev,
      companyProfile: cleanProfile,
    }));
  };

  const resetCompanyProfile = () => {
    saveCachedCompanyProfile(DEFAULT_COMPANY_PROFILE);
    mutateData((prev) => ({
      ...prev,
      companyProfile: DEFAULT_COMPANY_PROFILE,
    }));
  };

  const addInvoice = (
    invoiceNumber: string,
    customerName: string,
    date: string,
    dueDate: string,
    totalAmount: number
  ) => {
    const newInvoice: Invoice = {
      id: uuidv4(),
      invoiceNumber,
      customerName,
      date,
      dueDate,
      totalAmount,
      payments: [],
      status: "UNPAID",
    };
    mutateData((prev) => {
      const nextCustomers = [...prev.customers];
      if (!nextCustomers.some((c) => c.name.toLowerCase() === customerName.toLowerCase())) {
        nextCustomers.push({
          id: uuidv4(),
          name: customerName,
          exportSeparateSheet: false,
        });
      }
      return { ...prev, invoices: [...prev.invoices, newInvoice], customers: nextCustomers };
    });

    emitNotify({
      type: "INVOICE_CREATED",
      title: "Faktur Baru Dicatat",
      message: `${customerName} · No. ${invoiceNumber}`,
      customerName,
      invoiceNumber,
      amount: totalAmount,
      statusNote: `Jatuh tempo ${dueDate}`,
      targetView: "INVOICE_HISTORY",
    });
  };

  const addInvoices = (invoicesData: Omit<Invoice, "id" | "payments" | "status">[]) => {
    const newInvoices: Invoice[] = invoicesData.map((inv) => ({
      ...inv,
      id: uuidv4(),
      payments: [],
      status: "UNPAID",
    }));
    mutateData((prev) => {
      const nextCustomers = [...prev.customers];
      const newCustomerNames = new Set(newInvoices.map((inv) => inv.customerName));

      newCustomerNames.forEach((name) => {
        if (!nextCustomers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          nextCustomers.push({
            id: uuidv4(),
            name: name,
            exportSeparateSheet: false,
          });
        }
      });

      return {
        ...prev,
        invoices: [...prev.invoices, ...newInvoices],
        customers: nextCustomers,
      };
    });

    const totalNominal = newInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
    const uniqueCustomers = Array.from(new Set(newInvoices.map((inv) => inv.customerName)));

    if (newInvoices.length === 1) {
      const only = newInvoices[0];
      emitNotify({
        type: "INVOICE_CREATED",
        title: "Faktur Baru Dicatat",
        message: `${only.customerName} · No. ${only.invoiceNumber}`,
        customerName: only.customerName,
        invoiceNumber: only.invoiceNumber,
        amount: only.totalAmount,
        statusNote: `Jatuh tempo ${only.dueDate}`,
        targetView: "INVOICE_HISTORY",
      });
    } else if (newInvoices.length > 1) {
      emitNotify({
        type: "INVOICE_BULK_CREATED",
        title: `${newInvoices.length} Faktur Baru Disimpan`,
        message:
          uniqueCustomers.length === 1
            ? `${uniqueCustomers[0]} · ${newInvoices.length} faktur`
            : `${uniqueCustomers.length} konsumen · ${newInvoices.length} faktur`,
        customerName:
          uniqueCustomers.length === 1 ? uniqueCustomers[0] : `${uniqueCustomers.length} Konsumen`,
        amount: totalNominal,
        count: newInvoices.length,
        statusNote: "Berhasil masuk ke riwayat faktur",
        targetView: "INVOICE_HISTORY",
      });
    }
  };

  const addBulkPayments = (payments: { invoiceId: string; amount: number; date: string }[]) => {
    const snapshotInvoices = dataRef.current.invoices;
    const affectedNames = new Set<string>();
    let totalPaidBatch = 0;
    let paidOffCount = 0;

    payments.forEach((p) => {
      totalPaidBatch += p.amount;
      const inv = snapshotInvoices.find((i) => i.id === p.invoiceId);
      if (inv) {
        affectedNames.add(inv.customerName);
        const prevPaid = inv.payments.reduce((sum, item) => sum + item.amount, 0);
        if (prevPaid + p.amount >= inv.totalAmount) {
          paidOffCount++;
        }
      }
    });

    mutateData((prev) => {
      let nextInvoices = [...prev.invoices];
      for (const p of payments) {
        nextInvoices = nextInvoices.map((inv) => {
          if (inv.id !== p.invoiceId) return inv;
          const newPayment: Payment = {
            id: uuidv4(),
            date: p.date,
            amount: p.amount,
          };
          const updatedPayments = [...inv.payments, newPayment];
          const totalPaid = updatedPayments.reduce((sum, pmt) => sum + pmt.amount, 0);
          let status: Invoice["status"] = "UNPAID";
          if (totalPaid >= inv.totalAmount) {
            status = "PAID";
          } else if (totalPaid > 0) {
            status = "PARTIAL";
          }
          return {
            ...inv,
            payments: updatedPayments,
            status,
          };
        });
      }
      return { ...prev, invoices: nextInvoices };
    });

    if (payments.length > 0) {
      const custLabel =
        affectedNames.size === 1
          ? Array.from(affectedNames)[0]
          : `${affectedNames.size} Konsumen`;

      emitNotify({
        type: "PAYMENT_BULK_ADDED",
        title: `Pelunasan Massal (${payments.length} Faktur)`,
        message: `${custLabel} · ${payments.length} pembayaran diproses`,
        customerName: custLabel,
        amount: totalPaidBatch,
        count: payments.length,
        statusNote:
          paidOffCount > 0
            ? `${paidOffCount} faktur berstatus Lunas`
            : "Pembayaran tercatat",
        targetView: "PAYMENT_HISTORY",
      });
    }
  };

  const addPayment = (invoiceId: string, amount: number, date: string) => {
    const targetInv = dataRef.current.invoices.find((i) => i.id === invoiceId);

    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPayment: Payment = {
          id: uuidv4(),
          date,
          amount,
        };
        const updatedPayments = [...inv.payments, newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let status: Invoice["status"] = "UNPAID";
        if (totalPaid >= inv.totalAmount) {
          status = "PAID";
        } else if (totalPaid > 0) {
          status = "PARTIAL";
        }
        return {
          ...inv,
          payments: updatedPayments,
          status,
        };
      }),
    }));

    if (targetInv) {
      const prevPaid = targetInv.payments.reduce((sum, p) => sum + p.amount, 0);
      const newRemaining = Math.max(0, targetInv.totalAmount - (prevPaid + amount));
      emitNotify({
        type: "PAYMENT_ADDED",
        title: newRemaining === 0 ? "Faktur Lunas Terbayar" : "Pembayaran Diterima",
        message: `${targetInv.customerName} · No. ${targetInv.invoiceNumber}`,
        customerName: targetInv.customerName,
        invoiceNumber: targetInv.invoiceNumber,
        amount,
        statusNote:
          newRemaining === 0
            ? "Status: Lunas 100%"
            : `Sisa tagihan ${formatCurrency(newRemaining)}`,
        targetView: "PAYMENT_HISTORY",
      });
    }
  };

  const editPayment = (
    invoiceId: string,
    paymentId: string,
    newAmount: number,
    newDate: string
  ) => {
    const targetInv = dataRef.current.invoices.find((i) => i.id === invoiceId);

    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const updatedPayments = inv.payments.map((p) =>
          p.id === paymentId ? { ...p, amount: newAmount, date: newDate } : p
        );

        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let status: Invoice["status"] = "UNPAID";
        if (totalPaid >= inv.totalAmount) {
          status = "PAID";
        } else if (totalPaid > 0) {
          status = "PARTIAL";
        }
        return {
          ...inv,
          payments: updatedPayments,
          status,
        };
      }),
    }));

    if (targetInv) {
      emitNotify({
        type: "PAYMENT_UPDATED",
        title: "Pembayaran Diperbarui",
        message: `${targetInv.customerName} · No. ${targetInv.invoiceNumber}`,
        customerName: targetInv.customerName,
        invoiceNumber: targetInv.invoiceNumber,
        amount: newAmount,
        statusNote: `Tanggal bayar ${newDate}`,
        targetView: "PAYMENT_HISTORY",
      });
    }
  };

  const deletePayment = (invoiceId: string, paymentId: string) => {
    const targetInv = dataRef.current.invoices.find((i) => i.id === invoiceId);
    const targetPay = targetInv?.payments.find((p) => p.id === paymentId);

    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;

        const updatedPayments = inv.payments.filter((p) => p.id !== paymentId);

        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let status: Invoice["status"] = "UNPAID";
        if (totalPaid >= inv.totalAmount) {
          status = "PAID";
        } else if (totalPaid > 0) {
          status = "PARTIAL";
        }
        return {
          ...inv,
          payments: updatedPayments,
          status,
        };
      }),
    }));

    if (targetInv) {
      emitNotify({
        type: "PAYMENT_DELETED",
        title: "Pembayaran Dihapus",
        message: `${targetInv.customerName} · No. ${targetInv.invoiceNumber}`,
        customerName: targetInv.customerName,
        invoiceNumber: targetInv.invoiceNumber,
        amount: targetPay?.amount,
        statusNote: "Saldo tagihan disesuaikan otomatis",
        targetView: "PAYMENT_HISTORY",
      });
    }
  };

  const resetDueDates = () => {
    mutateData((prev) => {
      const nextInvoices = prev.invoices.map((inv) => {
        if (inv.date) {
          const d = new Date(inv.date);
          d.setDate(d.getDate() + 30);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return {
            ...inv,
            dueDate: `${year}-${month}-${day}`,
          };
        }
        return inv;
      });
      return { ...prev, invoices: nextInvoices };
    });
  };

  const editInvoice = (
    invoiceId: string,
    invoiceNumber: string,
    customerName: string,
    date: string,
    dueDate: string,
    totalAmount: number
  ) => {
    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
        let status: Invoice["status"] = "UNPAID";
        if (totalPaid >= totalAmount) {
          status = "PAID";
        } else if (totalPaid > 0) {
          status = "PARTIAL";
        }
        return {
          ...inv,
          invoiceNumber,
          customerName,
          date,
          dueDate,
          totalAmount,
          status,
        };
      }),
    }));

    emitNotify({
      type: "INVOICE_UPDATED",
      title: "Faktur Diperbarui",
      message: `${customerName} · No. ${invoiceNumber}`,
      customerName,
      invoiceNumber,
      amount: totalAmount,
      statusNote: `Jatuh tempo ${dueDate}`,
      targetView: "INVOICE_HISTORY",
    });
  };

  const deleteInvoice = (invoiceId: string) => {
    const targetInv = dataRef.current.invoices.find((i) => i.id === invoiceId);

    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((inv) => inv.id !== invoiceId),
    }));

    if (targetInv) {
      emitNotify({
        type: "INVOICE_DELETED",
        title: "Faktur Dihapus",
        message: `${targetInv.customerName} · No. ${targetInv.invoiceNumber}`,
        customerName: targetInv.customerName,
        invoiceNumber: targetInv.invoiceNumber,
        amount: targetInv.totalAmount,
        statusNote: "Dihapus dari daftar faktur",
        targetView: "INVOICE_HISTORY",
      });
    }
  };

  const addCustomer = (
    name: string,
    phone?: string,
    address?: string,
    exportSeparateSheet?: boolean
  ) => {
    const newCustomer: Customer = {
      id: uuidv4(),
      name,
      phone,
      address,
      exportSeparateSheet,
    };
    mutateData((prev) => ({ ...prev, customers: [...prev.customers, newCustomer] }));
  };

  const addCustomers = (customersToAdd: Omit<Customer, "id">[]) => {
    const newCustomers: Customer[] = customersToAdd.map((c) => ({
      ...c,
      id: uuidv4(),
    }));
    mutateData((prev) => ({
      ...prev,
      customers: [...prev.customers, ...newCustomers],
    }));
  };

  const updateCustomer = (
    id: string,
    name: string,
    phone?: string,
    address?: string,
    exportSeparateSheet?: boolean
  ) => {
    mutateData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === id ? { ...c, name, phone, address, exportSeparateSheet } : c
      ),
    }));
  };

  const deleteCustomer = (id: string) => {
    mutateData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  };

  const syncCustomersFromInvoices = () => {
    mutateData((prev) => {
      const nextCustomers = [...prev.customers];
      let addedCount = 0;

      const invoiceCustomerNames = new Set(prev.invoices.map((inv) => inv.customerName));

      invoiceCustomerNames.forEach((name) => {
        if (!name) return;
        if (!nextCustomers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          nextCustomers.push({
            id: uuidv4(),
            name: name,
            exportSeparateSheet: false,
          });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        alert(`Berhasil menambahkan ${addedCount} konsumen baru dari data faktur.`);
      } else {
        alert("Semua konsumen dari faktur sudah terdaftar.");
      }

      return {
        ...prev,
        customers: nextCustomers,
      };
    });
  };

  const restoreData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && Array.isArray(parsed.invoices)) {
        mutateData((prev) => ({
          invoices: deduplicateInvoices(parsed.invoices),
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          companyProfile: parsed.companyProfile
            ? { ...DEFAULT_COMPANY_PROFILE, ...parsed.companyProfile }
            : prev.companyProfile || DEFAULT_COMPANY_PROFILE,
        }));
        return true;
      }
    } catch (e) {
      console.error("Failed to restore data", e);
    }
    return false;
  };

  const getBackupData = () => JSON.stringify(data, null, 2);

  return {
    invoices: data.invoices,
    customers: data.customers,
    companyProfile: data.companyProfile || DEFAULT_COMPANY_PROFILE,
    isLoading,
    resetData,
    updateCompanyProfile,
    resetCompanyProfile,
    addInvoice,
    addInvoices,
    editInvoice,
    addPayment,
    editPayment,
    deletePayment,
    addBulkPayments,
    deleteInvoice,
    addCustomer,
    addCustomers,
    updateCustomer,
    deleteCustomer,
    syncCustomersFromInvoices,
    restoreData,
    getBackupData,
    resetDueDates,
  };
}
