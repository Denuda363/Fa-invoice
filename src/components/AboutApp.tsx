import React from "react";
import {
  Info,
  ShieldCheck,
  Code2,
  Copyright,
  Sparkles,
  Layers,
  CheckCircle2,
  Cpu,
  Smartphone,
  FileSpreadsheet,
  Heart,
  ExternalLink,
} from "lucide-react";

export function AboutApp() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm overflow-hidden relative">
      {/* Subtle background decoration */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Info size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tentang Aplikasi</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Sparkles size={11} className="text-blue-600" />
                Versi 2.5 Pro
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sistem Manajemen Faktur, Penagihan Piutang & Rekapitulasi Kas Terintegrasi
            </p>
          </div>
        </div>

        {/* Developer Badge Pill */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 text-indigo-900 shadow-2xs">
          <Code2 size={16} className="text-indigo-600" />
          <div className="text-left">
            <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Developer</span>
            <span className="text-sm font-extrabold text-indigo-950">Denuda</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Detail Aplikasi, Developer, & Hak Cipta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-5">
        {/* Kolom 1: Profil & Tujuan Aplikasi */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Layers size={15} className="text-blue-600" />
            <span>Profil Sistem</span>
          </div>
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-900 font-semibold">AF Faktur</strong> merupakan aplikasi manajemen penjualan dan piutang toko/grosir yang dirancang untuk kecepatan operasional, akurasi perhitungan saldo utang, serta pemantauan jatuh tempo secara real-time.
            </p>
            <p>
              Mendukung operasi <strong className="text-slate-800 font-medium">multi-perangkat</strong> (Laptop, Tablet, dan Smartphone Android/iOS) dengan antarmuka yang responsif dan dapat dipasang langsung sebagai aplikasi mandiri (PWA).
            </p>
          </div>
        </div>

        {/* Kolom 2: Developer & Perancang */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Code2 size={15} className="text-indigo-600" />
            <span>Pengembang (Developer)</span>
          </div>
          <div className="rounded-xl bg-indigo-50/40 border border-indigo-200/70 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-600 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                D
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Denuda</h4>
                <p className="text-[11px] text-indigo-600 font-medium">Software Engineer & Creator</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aplikasi ini dirancang, dibangun, dan dikembangkan secara penuh oleh{" "}
              <strong className="text-indigo-900 font-bold">Denuda</strong> untuk memberikan solusi manajemen pencatatan faktur yang cepat, bebas ribet, dan aman tanpa ketergantungan pada server pihak ketiga yang rumit.
            </p>
            <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[11px] text-indigo-800/80">
              <span className="flex items-center gap-1 font-medium">
                <Heart size={12} className="text-rose-500 fill-rose-500" />
                Dibuat dengan dedikasi penuh
              </span>
              <span className="font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-[10px]">
                Original Build
              </span>
            </div>
          </div>
        </div>

        {/* Kolom 3: Hak Cipta & Lisensi */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>Hak Cipta & Keamanan</span>
          </div>
          <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <Copyright size={14} className="text-slate-700 shrink-0" />
              <span>Hak Cipta © {currentYear} Denuda.</span>
            </div>
            <p className="text-slate-600">
              Seluruh hak cipta, tata letak, kode sumber, logika perhitungan, dan desain antarmuka aplikasi dilindungi undang-undang.
            </p>
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Privasi Data: Data tersimpan aman di perangkat lokal Anda.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                <span>Backup Rutin: Mendukung ekspor & impor JSON / Excel kapan saja.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Spesifikasi & Teknologi */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <Cpu size={13} className="text-blue-500" />
            React 19 & TypeScript
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <Smartphone size={13} className="text-indigo-500" />
            Progressive Web App (PWA)
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <FileSpreadsheet size={13} className="text-emerald-600" />
            Excel Multi-Sheet Engine
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Dirancang & Dikembangkan oleh <strong className="text-slate-700 font-semibold">Denuda</strong>
        </div>
      </div>
    </div>
  );
}
