import { useState, useEffect } from "react";
import { Invoice, Payment, Customer, AppData } from "./types";
import { v4 as uuidv4 } from "uuid";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const INITIAL_DATA: AppData = { invoices: [], customers: [] };

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

export function useAppStore() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state to Firebase
  useEffect(() => {
    setIsLoading(true);
    
    const docRef = doc(db, "appData", "main");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as AppData;
        setData({
          invoices: deduplicateInvoices(remoteData.invoices || []),
          customers: remoteData.customers || []
        });
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore sync error:", error);
      setIsLoading(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Persist local mutations
  const mutateData = (mutator: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = mutator(prev);
      
      // Save to Firebase
      setDoc(doc(db, "appData", "main"), next).catch(e => {
        console.error("Error saving to Firestore", e);
      });
      return next;
    });
  };

  const resetData = () => {
    mutateData(() => INITIAL_DATA);
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
  };

  const addInvoices = (
    invoicesData: Omit<Invoice, "id" | "payments" | "status">[]
  ) => {
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
  };

  const addBulkPayments = (payments: {invoiceId: string, amount: number, date: string}[]) => {
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
  };

  const addPayment = (invoiceId: string, amount: number, date: string) => {
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
  };

  const editPayment = (invoiceId: string, paymentId: string, newAmount: number, newDate: string) => {
    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        
        const updatedPayments = inv.payments.map(p => 
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
  };

  const deletePayment = (invoiceId: string, paymentId: string) => {
    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        
        const updatedPayments = inv.payments.filter(p => p.id !== paymentId);
        
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
  };

  const resetDueDates = () => {
    mutateData((prev) => {
      const nextInvoices = prev.invoices.map((inv) => {
        if (inv.date) {
          const d = new Date(inv.date);
          d.setDate(d.getDate() + 30);
          // format logic needs to handle yyyy-MM-dd
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
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
  };

  const deleteInvoice = (invoiceId: string) => {
    mutateData((prev) => ({
      ...prev,
      invoices: prev.invoices.filter((inv) => inv.id !== invoiceId),
    }));
  };

  const addCustomer = (name: string, phone?: string, address?: string, exportSeparateSheet?: boolean) => {
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

  const updateCustomer = (id: string, name: string, phone?: string, address?: string, exportSeparateSheet?: boolean) => {
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
        mutateData(() => ({
          invoices: deduplicateInvoices(parsed.invoices),
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
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
    isLoading,
    resetData,
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
