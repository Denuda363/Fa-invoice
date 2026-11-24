import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  X,
  FilePlus2,
  Files,
  FileEdit,
  FileX2,
  Banknote,
  Layers,
  Pencil,
  Receipt,
  Smartphone,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  MonitorCheck,
  ShieldAlert,
  BellOff,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  AppNotification,
  TransactionNotificationType,
  ViewState,
} from "../types";
import { useNotifications } from "../context/NotificationContext";
import { useNavbar } from "../context/NavbarContext";
import { cn, formatCurrency } from "../utils";

function getNotificationVisual(type: TransactionNotificationType) {
  switch (type) {
    case "PAYMENT_ADDED":
      return {
        icon: Banknote,
        iconBg:
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#065f46]",
        amountColor: "text-emerald-700",
        amountPrefix: "+",
        categoryLabel: "Pembayaran",
        cardTint: "border-emerald-200/90 border-b-[3px] border-b-emerald-300",
        progressColor: "bg-emerald-500",
      };
    case "PAYMENT_BULK_ADDED":
      return {
        icon: Layers,
        iconBg:
          "bg-gradient-to-b from-teal-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#0f766e]",
        amountColor: "text-teal-700",
        amountPrefix: "+",
        categoryLabel: "Pelunasan Massal",
        cardTint: "border-teal-200/90 border-b-[3px] border-b-teal-300",
        progressColor: "bg-teal-500",
      };
    case "PAYMENT_UPDATED":
      return {
        icon: Receipt,
        iconBg:
          "bg-gradient-to-b from-amber-400 to-amber-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#92400e]",
        amountColor: "text-amber-700",
        amountPrefix: "",
        categoryLabel: "Edit Pembayaran",
        cardTint: "border-amber-200/90 border-b-[3px] border-b-amber-300",
        progressColor: "bg-amber-500",
      };
    case "PAYMENT_DELETED":
      return {
        icon: FileX2,
        iconBg:
          "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#9f1239]",
        amountColor: "text-rose-700",
        amountPrefix: "-",
        categoryLabel: "Hapus Pembayaran",
        cardTint: "border-rose-200/90 border-b-[3px] border-b-rose-300",
        progressColor: "bg-rose-500",
      };
    case "INVOICE_CREATED":
      return {
        icon: FilePlus2,
        iconBg:
          "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#1e40af]",
        amountColor: "text-blue-700",
        amountPrefix: "",
        categoryLabel: "Faktur Baru",
        cardTint: "border-blue-200/90 border-b-[3px] border-b-blue-300",
        progressColor: "bg-blue-500",
      };
    case "INVOICE_BULK_CREATED":
      return {
        icon: Files,
        iconBg:
          "bg-gradient-to-b from-indigo-500 to-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#3730a3]",
        amountColor: "text-indigo-700",
        amountPrefix: "",
        categoryLabel: "Faktur Massal",
        cardTint: "border-indigo-200/90 border-b-[3px] border-b-indigo-300",
        progressColor: "bg-indigo-500",
      };
    case "INVOICE_UPDATED":
      return {
        icon: FileEdit,
        iconBg:
          "bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#0369a1]",
        amountColor: "text-sky-700",
        amountPrefix: "",
        categoryLabel: "Edit Faktur",
        cardTint: "border-sky-200/90 border-b-[3px] border-b-sky-300",
        progressColor: "bg-sky-500",
      };
    case "INVOICE_DELETED":
    default:
      return {
        icon: Pencil,
        iconBg:
          "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#991b1b]",
        amountColor: "text-rose-700",
        amountPrefix: "",
        categoryLabel: "Hapus Faktur",
        cardTint: "border-rose-200/90 border-b-[3px] border-b-rose-300",
        progressColor: "bg-rose-500",
      };
  }
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 15) return "Baru saja";
  if (diffSec < 60) return `${diffSec} dtk lalu`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24 && isToday(date)) return `${diffHour} jam lalu · ${format(date, "HH:mm")}`;
  return format(date, "dd MMM · HH:mm", { locale: idLocale });
}

/* ============================================================================
 * 1. TOP-RIGHT 3D NOTIFICATION BELL TRIGGER BUTTON
 * ============================================================================ */
export function NotificationBellButton({ className }: { className?: string }) {
  const { unreadCount, isDrawerOpen, toggleDrawer, lastTriggeredAt } = useNotifications();
  const { activeTheme } = useNavbar();
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (!lastTriggeredAt) return;
    setIsRinging(true);
    const t = setTimeout(() => setIsRinging(false), 1100);
    return () => clearTimeout(t);
  }, [lastTriggeredAt]);

  return (
    <button
      type="button"
      onClick={toggleDrawer}
      aria-label={`Notifikasi Transaksi${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ""}`}
      aria-expanded={isDrawerOpen}
      title="Lihat Semua Notifikasi Transaksi"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        activeTheme.isDark
          ? "bg-white/10 hover:bg-white/20 text-white border border-white/15 border-b-[3px] border-b-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0.5"
          : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 border-b-[3px] border-b-slate-300 shadow-[inset_0_1px_0_#ffffff,0_4px_10px_-4px_rgba(15,23,42,0.12)] active:translate-y-0.5",
        isDrawerOpen &&
          (activeTheme.isDark
            ? "ring-2 ring-sky-400/60 bg-white/20"
            : "ring-2 ring-blue-500/30 border-blue-400 text-blue-700"),
        className
      )}
    >
      <motion.span
        animate={
          isRinging
            ? { rotate: [0, -18, 16, -14, 12, -6, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.75, ease: "easeInOut" }}
        className="inline-flex items-center justify-center"
      >
        {unreadCount > 0 ? (
          <BellRing
            size={19}
            className={activeTheme.isDark ? "text-amber-300" : "text-blue-600"}
          />
        ) : (
          <Bell size={19} />
        )}
      </motion.span>

      <span className="hidden lg:inline text-xs font-bold whitespace-nowrap">
        Notifikasi
      </span>

      {unreadCount > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-b from-rose-500 to-red-600 text-white font-mono tabular-nums text-[10px] font-extrabold flex items-center justify-center border border-white/60 shadow-[0_2px_0_#881337,0_4px_8px_rgba(225,29,72,0.4)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

/* ============================================================================
 * 2. UNIQUE FLOATING 3D TRANSACTION SLIP TOAST STACK
 * ============================================================================ */
function ToastCard({
  toast,
  onDismiss,
  onOpenAll,
}: {
  key?: string;
  toast: AppNotification;
  onDismiss: (id: string) => void;
  onOpenAll: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const visual = getNotificationVisual(toast.type);
  const Icon = visual.icon;

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5200);
    return () => clearTimeout(timer);
  }, [toast.id, paused, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-md border overflow-hidden shadow-[0_18px_36px_-10px_rgba(15,23,42,0.28)]",
        visual.cardTint
      )}
    >
      {/* Ticket Perforation Header Strip */}
      <div className="px-3.5 py-2 bg-slate-50/90 border-b border-dashed border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          <Sparkles size={12} className="text-blue-600" />
          <span>{visual.categoryLabel}</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono tabular-nums text-slate-400 font-medium">
            {format(new Date(toast.createdAt), "HH:mm:ss")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
          aria-label="Tutup notifikasi"
        >
          <X size={14} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-3.5 flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            visual.iconBg
          )}
        >
          <Icon size={19} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
              {toast.title}
            </h4>
          </div>

          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {typeof toast.amount === "number" && toast.amount > 0 ? (
              <span
                className={cn(
                  "font-mono tabular-nums text-sm font-extrabold",
                  visual.amountColor
                )}
              >
                {visual.amountPrefix}
                {formatCurrency(toast.amount)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                {toast.statusNote || "Tercatat"}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                onDismiss(toast.id);
                onOpenAll();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Animated Auto-dismiss Progress Bar */}
      {!paused && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 5.2, ease: "linear" }}
          style={{ transformOrigin: "left" }}
          className={cn("h-1 w-full", visual.progressColor)}
        />
      )}
    </motion.div>
  );
}

export function NotificationToastStack() {
  const { activeToasts, dismissToast, setDrawerOpen } = useNotifications();

  return (
    <div
      aria-live="polite"
      className="fixed top-16 right-3 sm:right-6 z-50 flex flex-col gap-2.5 w-[calc(100%-1.5rem)] sm:w-96 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {activeToasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onOpenAll={() => setDrawerOpen(true)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
 * 3. SLIDE-OVER 3D NOTIFICATION CENTER DRAWER
 * ============================================================================ */
export function NotificationDrawer({
  companyName,
  companyIcon,
  onNavigate,
}: {
  companyName: string;
  companyIcon?: string;
  onNavigate?: (view: ViewState) => void;
}) {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    preferences,
    devicePermission,
    setDrawerOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    requestDevicePermission,
    sendTestNotification,
  } = useNotifications();

  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "PAYMENT" | "INVOICE">("ALL");

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, setDrawerOpen]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === "UNREAD") return !n.read;
      if (filterTab === "PAYMENT") return n.type.startsWith("PAYMENT_");
      if (filterTab === "INVOICE") return n.type.startsWith("INVOICE_");
      return true;
    });
  }, [notifications, filterTab]);

  const todayItems = filteredNotifications.filter((n) => isToday(new Date(n.createdAt)));
  const earlierItems = filteredNotifications.filter((n) => !isToday(new Date(n.createdAt)));

  const handleItemClick = (item: AppNotification) => {
    if (!item.read) markAsRead(item.id);
    if (item.targetView && onNavigate) {
      onNavigate(item.targetView);
      setDrawerOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
          />

          {/* Slide-over 3D Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            role="dialog"
            aria-label="Pusat Notifikasi Transaksi"
            className="relative z-10 w-full max-w-md h-full bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col"
          >
            {/* Top Header */}
            <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#1e40af]">
                  <BellRing size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Pusat Notifikasi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {unreadCount > 0
                      ? `${unreadCount} belum dibaca · ${notifications.length} total`
                      : `${notifications.length} riwayat transaksi`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Tutup Pusat Notifikasi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Device OS Notification & Sound Control Card */}
            <div className="px-4 pt-4">
              <div className="rounded-2xl border border-slate-200 border-b-[3px] border-b-slate-300 bg-white p-3.5 space-y-3 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        devicePermission === "granted" && preferences.deviceEnabled
                          ? "bg-emerald-100 text-emerald-700"
                          : devicePermission === "denied"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {devicePermission === "denied" ? (
                        <ShieldAlert size={16} />
                      ) : (
                        <Smartphone size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        Notifikasi Sistem Perangkat
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {devicePermission === "granted"
                          ? preferences.deviceEnabled
                            ? "Aktif — muncul di panel notifikasi HP/Laptop saat transaksi."
                            : "Izin diberikan, saat ini dijeda."
                          : devicePermission === "denied"
                          ? "Diblokir browser. Izinkan notifikasi lewat ikon gembok di address bar."
                          : devicePermission === "unsupported"
                          ? "Browser ini tidak mendukung notifikasi sistem; notifikasi layar tetap aktif."
                          : "Aktifkan agar setiap faktur & pembayaran muncul di notifikasi sistem perangkat."}
                      </p>
                    </div>
                  </div>

                  {devicePermission === "default" && (
                    <button
                      type="button"
                      onClick={requestDevicePermission}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-[0_2px_0_#1e40af] active:translate-y-0.5 transition-all"
                    >
                      Aktifkan
                    </button>
                  )}

                  {devicePermission === "granted" && (
                    <button
                      type="button"
                      onClick={() =>
                        updatePreferences({ deviceEnabled: !preferences.deviceEnabled })
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors",
                        preferences.deviceEnabled
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      )}
                    >
                      {preferences.deviceEnabled ? "Aktif" : "Nonaktif"}
                    </button>
                  )}
                </div>

                {/* Quick Utility Row: Toast, Sound, Test */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updatePreferences({ toastEnabled: !preferences.toastEnabled })
                      }
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                        preferences.toastEnabled
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      )}
                      title="Tampilkan kartu notifikasi mengambang saat transaksi"
                    >
                      <MonitorCheck size={12} />
                      <span>Popup Layar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updatePreferences({ soundEnabled: !preferences.soundEnabled })
                      }
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors",
                        preferences.soundEnabled
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      )}
                      title="Bunyi lonceng halus saat transaksi baru"
                    >
                      {preferences.soundEnabled ? (
                        <Volume2 size={12} />
                      ) : (
                        <VolumeX size={12} />
                      )}
                      <span>Suara</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => sendTestNotification(companyIcon, companyName)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                  >
                    <Sparkles size={12} className="text-amber-600" />
                    <span>Tes Notif</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 pt-3">
              <div className="flex items-center gap-1 bg-slate-200/75 p-1 rounded-xl border border-slate-200 text-xs">
                {[
                  { id: "ALL" as const, label: "Semua" },
                  {
                    id: "UNREAD" as const,
                    label: unreadCount > 0 ? `Baru (${unreadCount})` : "Baru",
                  },
                  { id: "PAYMENT" as const, label: "Pembayaran" },
                  { id: "INVOICE" as const, label: "Faktur" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all whitespace-nowrap",
                      filterTab === tab.id
                        ? "bg-white text-slate-900 shadow-[0_2px_0_#cbd5e1]"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredNotifications.length === 0 ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 py-10">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 border-b-[3px] border-b-slate-300 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                    <BellOff size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {filterTab === "UNREAD"
                      ? "Semua Notifikasi Sudah Dibaca"
                      : "Belum Ada Notifikasi Transaksi"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Setiap faktur baru, pembayaran masuk, pelunasan massal, atau perubahan transaksi akan tercatat otomatis di sini.
                  </p>
                </div>
              ) : (
                <>
                  {todayItems.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Hari Ini
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {todayItems.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {todayItems.map((item) => (
                          <NotificationFeedCard
                            key={item.id}
                            item={item}
                            onClick={() => handleItemClick(item)}
                            onDelete={() => deleteNotification(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {earlierItems.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Sebelumnya
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {earlierItems.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {earlierItems.map((item) => (
                          <NotificationFeedCard
                            key={item.id}
                            item={item}
                            onClick={() => handleItemClick(item)}
                            onDelete={() => deleteNotification(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Controls */}
            {notifications.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-45 disabled:pointer-events-none transition-colors"
                >
                  <CheckCheck size={15} />
                  <span>Tandai Semua Dibaca</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={15} />
                  <span>Hapus Semua</span>
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function NotificationFeedCard({
  item,
  onClick,
  onDelete,
}: {
  key?: string;
  item: AppNotification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const visual = getNotificationVisual(item.type);
  const Icon = visual.icon;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative rounded-2xl border p-3.5 transition-all cursor-pointer flex items-start gap-3",
        item.read
          ? "bg-white border-slate-200 hover:border-slate-300"
          : cn("bg-white shadow-sm hover:-translate-y-0.5", visual.cardTint)
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          visual.iconBg
        )}
      >
        <Icon size={17} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h5
                className={cn(
                  "text-xs sm:text-sm leading-snug",
                  item.read ? "font-bold text-slate-800" : "font-extrabold text-slate-950"
                )}
              >
                {item.title}
              </h5>
              {!item.read && (
                <span className="text-[10px] font-bold text-blue-600">· Baru</span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
              {item.message}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
            title="Hapus notifikasi ini"
            aria-label="Hapus notifikasi"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
            <span className="truncate">{formatRelativeTime(item.createdAt)}</span>
            {item.statusNote && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 font-medium truncate">
                  {item.statusNote}
                </span>
              </>
            )}
          </div>

          {typeof item.amount === "number" && item.amount > 0 && (
            <span
              className={cn(
                "font-mono tabular-nums font-extrabold shrink-0",
                visual.amountColor
              )}
            >
              {visual.amountPrefix}
              {formatCurrency(item.amount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
