import React, { useState } from "react";
import { CLOCK_STYLES, useClock } from "../context/ClockContext";
import { LiveClockWidget } from "./LiveClockWidget";
import {
  Clock,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Timer,
  Sparkles,
} from "lucide-react";

export function ClockSettingsPanel() {
  const {
    clockSettings,
    activeClockMeta,
    setClockStyle,
    setFormat24h,
    setShowSeconds,
    setShowClock,
    resetClockSettings,
  } = useClock();

  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "3D & Mekanik" | "Modern & Kaca" | "Klasik & Instrumen"
  >("ALL");

  const filteredStyles =
    categoryFilter === "ALL"
      ? CLOCK_STYLES
      : CLOCK_STYLES.filter((s) => s.category === categoryFilter);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#065f46,0_8px_16px_-4px_rgba(16,185,129,0.35)]">
            <Clock size={21} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Jam Realtime, Tanggal & Gaya Jam
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Pilih dari {CLOCK_STYLES.length} gaya jam unik untuk menampilkan hari, tanggal, dan waktu secara langsung.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetClockSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border-b-2 border-slate-300 transition-all self-start sm:self-auto"
          title="Kembalikan gaya jam ke pengaturan default"
        >
          <RotateCcw size={13} />
          <span>Reset Gaya Jam</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Timer size={14} className="text-emerald-600" />
            Pratinjau Jam Aktif
          </span>
          <span className="text-xs text-slate-500">
            Gaya Terpilih: <strong className="text-slate-800">{activeClockMeta.name}</strong>
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4">
          {clockSettings.showClock ? (
            <LiveClockWidget />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/80 py-5 px-4 text-center text-xs text-slate-500">
              Jam realtime saat ini disembunyikan dari layar utama. Aktifkan kembali tombol di bawah untuk menampilkannya.
            </div>
          )}
        </div>
      </div>

      {/* Quick Controls (Visibility, 24h/12h Format, Seconds) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Show/Hide Toggle */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800">Tampilkan Jam</div>
            <div className="text-[11px] text-slate-500">Di atas ruang kerja</div>
          </div>
          <button
            type="button"
            onClick={() => setShowClock(!clockSettings.showClock)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              clockSettings.showClock
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {clockSettings.showClock ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{clockSettings.showClock ? "Aktif" : "Mati"}</span>
          </button>
        </div>

        {/* Format 24h vs 12h */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800">Format Jam</div>
            <div className="text-[11px] text-slate-500">24 Jam atau AM/PM</div>
          </div>
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setFormat24h(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                clockSettings.format24h
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              24J
            </button>
            <button
              type="button"
              onClick={() => setFormat24h(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                !clockSettings.format24h
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              12J
            </button>
          </div>
        </div>

        {/* Show Seconds */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800">Tampilkan Detik</div>
            <div className="text-[11px] text-slate-500">Detak tiap detik</div>
          </div>
          <button
            type="button"
            onClick={() => setShowSeconds(!clockSettings.showSeconds)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              clockSettings.showSeconds
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
            }`}
          >
            <span>{clockSettings.showSeconds ? "Aktif" : "Nonaktif"}</span>
          </button>
        </div>
      </div>

      {/* Style Gallery Header & Filter */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-emerald-600" />
              Galeri Gaya Jam Unik ({CLOCK_STYLES.length} Pilihan)
            </h4>
            <p className="text-xs text-slate-500">
              Klik salah satu kartu di bawah untuk langsung mengganti gaya jam pada seluruh aplikasi.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
            {(["ALL", "3D & Mekanik", "Modern & Kaca", "Klasik & Instrumen"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-white text-slate-900 shadow-[0_2px_0_#cbd5e1]"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {cat === "ALL" ? `Semua (${CLOCK_STYLES.length})` : cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* 8 Clock Styles Grid with Real Live Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStyles.map((styleMeta) => {
            const isSelected = clockSettings.style === styleMeta.id;
            return (
              <button
                key={styleMeta.id}
                type="button"
                onClick={() => setClockStyle(styleMeta.id)}
                className={`group text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-emerald-600 border-b-4 border-b-emerald-700 bg-emerald-50/40 -translate-y-0.5 shadow-[0_10px_20px_-6px_rgba(16,185,129,0.24)] ring-2 ring-emerald-500/20"
                    : "border-slate-200 border-b-4 border-b-slate-300 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_18px_-6px_rgba(15,23,42,0.1)] active:translate-y-0"
                }`}
              >
                {/* Card Top Info */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {styleMeta.name}
                      </h5>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {styleMeta.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {styleMeta.description}
                    </p>
                  </div>

                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_#065f46]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 shrink-0">
                      Pilih
                    </span>
                  )}
                </div>

                {/* Live Interactive Miniature Preview */}
                <div className="w-full pointer-events-none">
                  <LiveClockWidget overrideStyle={styleMeta.id} compact />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
