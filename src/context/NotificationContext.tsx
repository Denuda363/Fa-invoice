import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  AppNotification,
  NotificationPreferences,
  TransactionNotificationType,
  ViewState,
} from "../types";
import { formatCurrency } from "../utils";

export interface CreateNotificationInput {
  type: TransactionNotificationType;
  title: string;
  message: string;
  customerName?: string;
  invoiceNumber?: string;
  amount?: number;
  count?: number;
  statusNote?: string;
  targetView?: ViewState;
}

export type DevicePermissionState = NotificationPermission | "unsupported";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeToasts: AppNotification[];
  isDrawerOpen: boolean;
  preferences: NotificationPreferences;
  devicePermission: DevicePermissionState;
  lastTriggeredAt: number;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  notifyTransaction: (input: CreateNotificationInput, iconUrl?: string, companyName?: string) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updatePreferences: (partial: Partial<NotificationPreferences>) => void;
  requestDevicePermission: () => Promise<DevicePermissionState>;
  sendTestNotification: (iconUrl?: string, companyName?: string) => void;
}

const NOTIFICATIONS_STORAGE_KEY = "af_faktur_notifications_v1";
const PREFS_STORAGE_KEY = "af_faktur_notif_prefs_v1";
const MAX_STORED_NOTIFICATIONS = 100;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  deviceEnabled: true,
  toastEnabled: true,
  soundEnabled: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function getBrowserPermission(): DevicePermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

function playTransactionChime(type: TransactionNotificationType) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const isPositive =
      type === "PAYMENT_ADDED" ||
      type === "PAYMENT_BULK_ADDED" ||
      type === "INVOICE_CREATED" ||
      type === "INVOICE_BULK_CREATED";
    const isDelete = type === "INVOICE_DELETED" || type === "PAYMENT_DELETED";

    const notes = isDelete
      ? [440, 349.23]
      : isPositive
      ? [587.33, 880]
      : [523.25, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.085);
      gain.gain.setValueAtTime(0.001, now + idx * 0.085);
      gain.gain.exponentialRampToValueAtTime(0.065, now + idx * 0.085 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.085 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.085);
      osc.stop(now + idx * 0.085 + 0.27);
    });

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 650);
  } catch {
    // Ignore autoplay restriction errors when AudioContext cannot start
  }
}

async function dispatchDeviceOSNotification(
  notif: AppNotification,
  iconUrl?: string,
  companyName?: string
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const icon = iconUrl && iconUrl.trim() ? iconUrl : "/icon.jpg";
  const amountSuffix =
    typeof notif.amount === "number" && notif.amount > 0
      ? ` · ${formatCurrency(notif.amount)}`
      : "";
  const title = `${companyName ? `${companyName} — ` : ""}${notif.title}${amountSuffix}`;
  const bodyParts = [notif.message];
  if (notif.statusNote) {
    bodyParts.push(notif.statusNote);
  }
  const body = bodyParts.join(" • ");

  const options: NotificationOptions = {
    body,
    icon,
    badge: "/icon.jpg",
    tag: `af-faktur-${notif.id}`,
    silent: false,
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch {
    // Fall back to direct Notification constructor
  }

  try {
    const osNotif = new Notification(title, options);
    osNotif.onclick = () => {
      window.focus();
      osNotif.close();
    };
  } catch (err) {
    console.warn("Tidak dapat menampilkan notifikasi perangkat:", err);
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load notifications from localStorage:", e);
    }
    return [];
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error("Failed to load notification preferences:", e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [devicePermission, setDevicePermission] = useState<DevicePermissionState>(
    getBrowserPermission
  );
  const [lastTriggeredAt, setLastTriggeredAt] = useState<number>(0);

  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  useEffect(() => {
    try {
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notifications.slice(0, MAX_STORED_NOTIFICATIONS))
      );
    } catch (e) {
      console.error("Failed to persist notifications:", e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error("Failed to persist notification preferences:", e);
    }
  }, [preferences]);

  useEffect(() => {
    const syncPerm = () => setDevicePermission(getBrowserPermission());
    window.addEventListener("focus", syncPerm);
    return () => window.removeEventListener("focus", syncPerm);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notifyTransaction = useCallback(
    (input: CreateNotificationInput, iconUrl?: string, companyName?: string) => {
      const item: AppNotification = {
        id: uuidv4(),
        type: input.type,
        title: input.title,
        message: input.message,
        customerName: input.customerName,
        invoiceNumber: input.invoiceNumber,
        amount: input.amount,
        count: input.count,
        statusNote: input.statusNote,
        targetView: input.targetView,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [item, ...prev].slice(0, MAX_STORED_NOTIFICATIONS));
      setLastTriggeredAt(Date.now());

      const currentPrefs = prefsRef.current;

      if (currentPrefs.toastEnabled) {
        setActiveToasts((prev) => [item, ...prev].slice(0, 4));
      }

      if (currentPrefs.soundEnabled) {
        playTransactionChime(input.type);
      }

      if (currentPrefs.deviceEnabled && getBrowserPermission() === "granted") {
        void dispatchDeviceOSNotification(item, iconUrl, companyName);
      }
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setActiveToasts([]);
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const updatePreferences = useCallback((partial: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));
  }, []);

  const requestDevicePermission = useCallback(async (): Promise<DevicePermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setDevicePermission("unsupported");
      return "unsupported";
    }

    try {
      const result = await Notification.requestPermission();
      setDevicePermission(result);
      if (result === "granted") {
        setPreferences((prev) => ({ ...prev, deviceEnabled: true }));
      }
      return result;
    } catch (err) {
      console.error("Permission request failed:", err);
      const current = getBrowserPermission();
      setDevicePermission(current);
      return current;
    }
  }, []);

  const sendTestNotification = useCallback(
    (iconUrl?: string, companyName?: string) => {
      notifyTransaction(
        {
          type: "PAYMENT_ADDED",
          title: "Tes Notifikasi Sistem & Transaksi",
          message: "Notifikasi perangkat dan pusat transaksi aktif berjalan dengan baik.",
          customerName: companyName || "AF Faktur",
          invoiceNumber: "TEST-001",
          amount: 1500000,
          statusNote: "Simulasi Transaksi Berhasil",
          targetView: "DASHBOARD",
        },
        iconUrl,
        companyName
      );
    },
    [notifyTransaction]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToasts,
        isDrawerOpen,
        preferences,
        devicePermission,
        lastTriggeredAt,
        setDrawerOpen,
        toggleDrawer,
        notifyTransaction,
        dismissToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        updatePreferences,
        requestDevicePermission,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
