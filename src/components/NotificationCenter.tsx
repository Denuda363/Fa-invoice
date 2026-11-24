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
  Receipt,
  Smartphone,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUpRight,
  MonitorCheck,
  ShieldAlert,
  BellOff,
  Search,
  SlidersHorizontal,
  Check,
  TrendingUp,
  Activity,
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
import { CompanyLogo } from "./CompanyLogo";
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
        topAccent: "bg-gradient-to-r from-emerald-500 to-teal-500",
        progressColor: "bg-emerald-500",
        timelineRing: "ring-emerald-100",
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
        topAccent: "bg-gradient-to-r from-teal-500 to-emerald-500",
        progressColor: "bg-teal-500",
        timelineRing: "ring-teal-100",
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
        topAccent: "bg-gradient-to-r from-amber-400 to-orange-500",
        progressColor: "bg-amber-500",
        timelineRing: "ring-amber-100",
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
        topAccent: "bg-gradient-to-r from-rose-500 to-red-600",
        progressColor: "bg-rose-500",
        timelineRing: "ring-rose-100",
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
        topAccent: "bg-gradient-to-r from-blue-500 to-indigo-600",
        progressColor: "bg-blue-500",
        timelineRing: "ring-blue-100",
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
        topAccent: "bg-gradient-to-r from-indigo-500 to-blue-600",
        progressColor: "bg-indigo-500",
        timelineRing: "ring-indigo-100",
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
        topAccent: "bg-gradient-to-r from-sky-500 to-blue-500",
        progressColor: "bg-sky-500",
        timelineRing: "ring-sky-100",
      };
    case "INVOICE_DELETED":
    default:
      return {
        icon: FileX2,
        iconBg:
          "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#991b1b]",
        amountColor: "text-rose-700",
        amountPrefix: "",
        categoryLabel: "Hapus Faktur",
        cardTint: "border-rose-200/90 border-b-[3px] border-b-rose-300",
        topAccent: "bg-gradient-to-r from-rose-500 to-red-600",
        progressColor: "bg-rose-500",
        timelineRing: "ring-rose-100",
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
 * 2. UNIQUE FLOATING 3D TRANSACTION RECEIPT SLIP TOAST STACK
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
      initial={{ opacity: 0, x: 52, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 44, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-md border overflow-hidden shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)]",
        visual.cardTint
      )}
    >
      {/* Top Color Rail */}
      <div className={cn("h-1 w-full", visual.topAccent)} />

      {/* Receipt Header Strip */}
      <div className="px-3.5 py-2 bg-slate-50/90 border-b border-dashed border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
          <Sparkles size={12} className="text-blue-600" />
          <span>{visual.categoryLabel}</span>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span className="font-mono tabular-nums text-slate-500 font-medium">
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
          <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
            {toast.title}
          </h4>

          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>

          {toast.statusNote && (
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {toast.statusNote}
            </p>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
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
                Tersimpan
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
              <span>Pusat Notifikasi</span>
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
          className={cn("h-0.5 w-full opacity-75", visual.progressColor)}
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
 * 3. EXECUTIVE 3D NOTIFICATION CENTER DRAWER
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

  const [filterTab, setFilterTab] = useState<
    "ALL" | "UNREAD" | "PAYMENT" | "INVOICE" | "CHANGES"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrefs, setShowPrefs] = useState(
    () => devicePermission === "default" || devicePermission === "denied"
  );

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, setDrawerOpen]);

  // Real-time Daily Pulse Summary computed from today's notifications
  const dailySummary = useMemo(() => {
    let paidToday = 0;
    let invoicedToday = 0;
    let todayCount = 0;

    notifications.forEach((n) => {
      if (!isToday(new Date(n.createdAt))) return;
      todayCount++;
      if (
        (n.type === "PAYMENT_ADDED" || n.type === "PAYMENT_BULK_ADDED") &&
        typeof n.amount === "number"
      ) {
        paidToday += n.amount;
      }
      if (
        (n.type === "INVOICE_CREATED" || n.type === "INVOICE_BULK_CREATED") &&
        typeof n.amount === "number"
      ) {
        invoicedToday += n.amount;
      }
    });

    return { paidToday, invoicedToday, todayCount };
  }, [notifications]);

  const tabCounts = useMemo(() => {
    return {
      ALL: notifications.length,
      UNREAD: unreadCount,
      PAYMENT: notifications.filter(
        (n) => n.type === "PAYMENT_ADDED" || n.type === "PAYMENT_BULK_ADDED"
      ).length,
      INVOICE: notifications.filter(
        (n) => n.type === "INVOICE_CREATED" || n.type === "INVOICE_BULK_CREATED"
      ).length,
      CHANGES: notifications.filter(
        (n) =>
          n.type === "INVOICE_UPDATED" ||
          n.type === "INVOICE_DELETED" ||
          n.type === "PAYMENT_UPDATED" ||
          n.type === "PAYMENT_DELETED"
      ).length,
    };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      if (filterTab === "UNREAD" && n.read) return false;
      if (
        filterTab === "PAYMENT" &&
        n.type !== "PAYMENT_ADDED" &&
        n.type !== "PAYMENT_BULK_ADDED"
      )
        return false;
      if (
        filterTab === "INVOICE" &&
        n.type !== "INVOICE_CREATED" &&
        n.type !== "INVOICE_BULK_CREATED"
      )
        return false;
      if (
        filterTab === "CHANGES" &&
        n.type !== "INVOICE_UPDATED" &&
        n.type !== "INVOICE_DELETED" &&
        n.type !== "PAYMENT_UPDATED" &&
        n.type !== "PAYMENT_DELETED"
      )
        return false;

      if (q) {
        const hay = `${n.title} ${n.message} ${n.customerName || ""} ${
          n.invoiceNumber || ""
        } ${n.statusNote || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, filterTab, searchQuery]);

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
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          {/* Slide-over Executive Command Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            role="dialog"
            aria-label="Pusat Notifikasi Transaksi"
            className="relative z-10 w-full max-w-lg h-full bg-slate-100 border-l border-slate-300/80 shadow-2xl flex flex-col"
          >
            {/* Branded Executive Dark Header + Live Daily Ledger Telemetry */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white px-5 pt-4 pb-4 border-b border-slate-800 shadow-[0_6px_20px_-6px_rgba(2,6,23,0.5)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo
                    iconUrl={companyIcon}
                    companyName={companyName}
                    className="w-10 h-10 rounded-xl shrink-0"
                    alt={companyName}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold tracking-tight text-white">
                        Pusat Notifikasi
                      </h3>
                      {unreadCount > 0 && (
                        <span className="font-mono tabular-nums text-[11px] font-bold text-amber-300">
                          · {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {companyName} — Log Transaksi & Sistem
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPrefs((prev) => !prev)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all",
                      showPrefs
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/10 border-white/15 text-slate-200 hover:bg-white/15"
                    )}
                    title="Atur Notifikasi Perangkat & Suara"
                    aria-expanded={showPrefs}
                  >
                    <SlidersHorizontal size={15} />
                    <span className="hidden sm:inline">Sistem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-2 rounded-xl border border-white/15 bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition-colors"
                    aria-label="Tutup Pusat Notifikasi"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 3-Column Daily Activity Telemetry Bar */}
              <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-xl bg-white/[0.06] border border-white/10 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                    <TrendingUp size={11} className="shrink-0" />
                    <span className="truncate">Masuk Hari Ini</span>
                  </div>
                  <div className="font-mono tabular-nums text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate">
                    {formatCurrency(dailySummary.paidToday)}
                  </div>
                </div>

                <div className="min-w-0 border-l border-white/10 pl-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-sky-300">
                    <FilePlus2 size={11} className="shrink-0" />
                    <span className="truncate">Faktur Hari Ini</span>
                  </div>
                  <div className="font-mono tabular-nums text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate">
                    {formatCurrency(dailySummary.invoicedToday)}
                  </div>
                </div>

                <div className="min-w-0 border-l border-white/10 pl-2.5">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                    <Activity size={11} className="shrink-0" />
                    <span className="truncate">Aktivitas</span>
                  </div>
                  <div className="font-mono tabular-nums text-xs sm:text-sm font-extrabold text-white mt-0.5">
                    {dailySummary.todayCount}{" "}
                    <span className="font-sans text-[10px] font-medium text-slate-400">
                      trx
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Device Notification & Sound Control Panel */}
            <AnimatePresence initial={false}>
              {showPrefs && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-200 bg-white"
                >
                  <div className="p-4 space-y-3">
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
                            Notifikasi Sistem Perangkat (HP / Desktop)
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {devicePermission === "granted"
                              ? preferences.deviceEnabled
                                ? "Aktif — pemberitahuan muncul di bilah notifikasi perangkat."
                                : "Izin aktif, namun notifikasi sistem sedang dijeda."
                              : devicePermission === "denied"
                              ? "Diblokir browser. Izinkan notifikasi lewat ikon pengaturan situs di address bar."
                              : devicePermission === "unsupported"
                              ? "Perangkat/browser tidak mendukung notifikasi sistem; popup layar tetap aktif."
                              : "Klik Aktifkan agar setiap transaksi muncul di notifikasi sistem perangkat."}
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
                          {preferences.deviceEnabled ? "Aktif" : "Dijeda"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updatePreferences({ toastEnabled: !preferences.toastEnabled })
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                            preferences.toastEnabled
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          )}
                        >
                          <MonitorCheck size={12} />
                          <span>Slip Layar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updatePreferences({ soundEnabled: !preferences.soundEnabled })
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
                            preferences.soundEnabled
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          )}
                        >
                          {preferences.soundEnabled ? (
                            <Volume2 size={12} />
                          ) : (
                            <VolumeX size={12} />
                          )}
                          <span>Suara Lonceng</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => sendTestNotification(companyIcon, companyName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 border-b-2 transition-colors"
                      >
                        <Sparkles size={12} className="text-amber-600" />
                        <span>Tes Notif</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search & Segmented Filter Bar */}
            <div className="bg-white/90 backdrop-blur-xs px-4 py-3 border-b border-slate-200 space-y-2.5">
              {/* Instant Search Input */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari konsumen, no. faktur, atau aktivitas..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                    aria-label="Hapus pencarian"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px]">
                {[
                  { id: "ALL" as const, label: "Semua", count: tabCounts.ALL },
                  { id: "UNREAD" as const, label: "Baru", count: tabCounts.UNREAD },
                  { id: "PAYMENT" as const, label: "Bayar", count: tabCounts.PAYMENT },
                  { id: "INVOICE" as const, label: "Faktur", count: tabCounts.INVOICE },
                  { id: "CHANGES" as const, label: "Ubah", count: tabCounts.CHANGES },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all whitespace-nowrap inline-flex items-center justify-center gap-1",
                      filterTab === tab.id
                        ? "bg-white text-slate-900 shadow-[0_2px_0_#cbd5e1]"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={cn(
                          "font-mono tabular-nums text-[10px]",
                          filterTab === tab.id ? "text-blue-600 font-bold" : "text-slate-400"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Timeline Notifications Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {filteredNotifications.length === 0 ? (
                <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6 py-10">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 border-b-[3px] border-b-slate-300 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                    <BellOff size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {searchQuery
                      ? "Tidak Ada Notifikasi yang Cocok"
                      : filterTab === "UNREAD"
                      ? "Semua Notifikasi Sudah Dibaca"
                      : "Belum Ada Notifikasi Transaksi"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    {searchQuery
                      ? "Coba kata kunci lain atau hapus pencarian untuk melihat semua log transaksi."
                      : "Setiap faktur baru, pembayaran masuk, pelunasan massal, atau perubahan data akan tercatat otomatis di lini masa ini."}
                  </p>
                </div>
              ) : (
                <>
                  {todayItems.length > 0 && (
                    <TimelineSection
                      title="Hari Ini"
                      items={todayItems}
                      onItemClick={handleItemClick}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  )}

                  {earlierItems.length > 0 && (
                    <TimelineSection
                      title="Sebelumnya"
                      items={earlierItems}
                      onItemClick={handleItemClick}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  )}
                </>
              )}
            </div>

            {/* Footer Action Bar */}
            {notifications.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-45 disabled:pointer-events-none transition-colors"
                >
                  <CheckCheck size={15} />
                  <span>Tandai Semua Dibaca</span>
                </button>

                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 size={15} />
                  <span>Bersihkan Semua</span>
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function TimelineSection({
  title,
  items,
  onItemClick,
  onMarkRead,
  onDelete,
}: {
  title: string;
  items: AppNotification[];
  onItemClick: (item: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[11px] font-mono tabular-nums text-slate-400">
          {items.length} aktivitas
        </span>
      </div>

      {/* Timeline Container with Vertical Rail */}
      <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-px before:bg-slate-300/80">
        {items.map((item) => (
          <NotificationFeedCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            onMarkRead={() => onMarkRead(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationFeedCard({
  item,
  onClick,
  onMarkRead,
  onDelete,
}: {
  key?: string;
  item: AppNotification;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const visual = getNotificationVisual(item.type);
  const Icon = visual.icon;

  return (
    <div className="relative group">
      {/* 3D Node Anchor on Timeline */}
      <div
        className={cn(
          "absolute -left-6 top-3.5 w-8 h-8 rounded-xl flex items-center justify-center ring-4 ring-slate-100 z-10 transition-transform group-hover:scale-105",
          visual.iconBg
        )}
      >
        <Icon size={15} />
      </div>

      {/* Ledger Ticket Card */}
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
          "ml-4 rounded-2xl border p-3.5 transition-all cursor-pointer",
          item.read
            ? "bg-white/85 border-slate-200/90 hover:bg-white hover:border-slate-300"
            : cn("bg-white shadow-sm hover:-translate-y-0.5", visual.cardTint)
        )}
      >
        {/* Top Metadata Line (Unboxed) */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 min-w-0">
            <span className="font-bold text-slate-700">{visual.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-400">
              {formatRelativeTime(item.createdAt)}
            </span>
            {!item.read && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-blue-600">Baru</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!item.read && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Tandai sudah dibaca"
                aria-label="Tandai sudah dibaca"
              >
                <Check size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Hapus notifikasi ini"
              aria-label="Hapus notifikasi"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Main Row: Title + Details + Prominent Right-aligned Nominal */}
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h5
              className={cn(
                "text-xs sm:text-sm leading-snug",
                item.read ? "font-bold text-slate-800" : "font-extrabold text-slate-950"
              )}
            >
              {item.title}
            </h5>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
              {item.message}
            </p>
          </div>

          {typeof item.amount === "number" && item.amount > 0 && (
            <div className="text-right shrink-0">
              <div
                className={cn(
                  "font-mono tabular-nums text-xs sm:text-sm font-extrabold",
                  visual.amountColor
                )}
              >
                {visual.amountPrefix}
                {formatCurrency(item.amount)}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Hairline Status + Quick Jump */}
        {(item.statusNote || item.targetView) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-500 font-medium truncate">
              {item.statusNote || "Tercatat dalam sistem"}
            </span>
            {item.targetView && (
              <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 opacity-85 group-hover:opacity-100 shrink-0">
                <span>Lihat</span>
                <ArrowUpRight size={12} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
