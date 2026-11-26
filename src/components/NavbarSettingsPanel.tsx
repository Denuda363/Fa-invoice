import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useNavbar,
  NAVBAR_THEMES,
  PAGE_TRANSITION_STYLES,
} from "../context/NavbarContext";
import {
  NavbarLayoutMode,
  NavbarButtonShape,
  PageTransitionStyleId,
  CompanyProfile,
} from "../types";
import { CompanyLogo } from "./CompanyLogo";
import {
  Palette,
  Layout,
  Minimize2,
  Maximize2,
  Check,
  RotateCcw,
  Box,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Files,
  FilePlus,
  Sparkles,
  Play,
} from "lucide-react";

interface NavbarSettingsPanelProps {
  companyProfile?: CompanyProfile;
}

export function NavbarSettingsPanel({ companyProfile }: NavbarSettingsPanelProps) {
  const {
    settings,
    activeTheme,
    setTheme,
    setLayout,
    toggleMinimized,
    setButtonShape,
    setPageTransition,
    resetNavbarSettings,
  } = useNavbar();

  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "Terang" | "Gelap" | "Warna-Warni"
  >("ALL");
  const [previewStep, setPreviewStep] = useState(0);

  const currentTransition: PageTransitionStyleId =
    settings.pageTransition || "precision-3d";

  const brandName = companyProfile?.name || "AF Faktur";
  const brandSub = companyProfile?.tagline || "Manajemen";

  const themesList = Object.values(NAVBAR_THEMES);
  const filteredThemes =
    categoryFilter === "ALL"
      ? themesList
      : themesList.filter((t) => t.category === categoryFilter);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#3730a3,0_8px_16px_-4px_rgba(79,70,229,0.35)]">
            <Palette size={21} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tampilan & Tema 3D Navbar</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Seluruh tema kini hadir dalam desain 3D berdimensi dengan tombol timbul, bevel halus, dan mode minimize.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetNavbarSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border-b-2 border-slate-300 transition-all self-start sm:self-auto"
          title="Kembalikan navbar ke pengaturan default"
        >
          <RotateCcw size={13} />
          <span>Reset Gaya Default</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Box size={14} className="text-indigo-600" />
            Pratinjau Langsung Tema 3D
          </span>
          <span className="text-xs text-slate-500">
            Tema Aktif: <strong className="text-slate-800">{activeTheme.name}</strong>
          </span>
        </div>

        <div className={`rounded-2xl border border-slate-200 p-4 overflow-hidden ${activeTheme.appBg}`}>
          {/* Mini Mockup Window with 3D Elevation */}
          <div className="rounded-xl shadow-[0_6px_0_#cbd5e1,0_14px_28px_-8px_rgba(15,23,42,0.18)] overflow-hidden border border-slate-300/90 bg-white">
            {/* Window bar */}
            <div className="bg-gradient-to-b from-slate-100 to-slate-200/80 px-3 py-2 border-b border-slate-300/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 swatch-3d-sphere inline-block shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 swatch-3d-sphere inline-block shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 swatch-3d-sphere inline-block shrink-0" />
                <span className="ml-2 font-bold text-slate-700 break-words whitespace-normal leading-snug">
                  {brandName} · Mode 3D
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                {settings.layout === "topbar"
                  ? "Navbar Atas 3D"
                  : settings.isMinimized
                  ? "Sidebar Minimized (80px)"
                  : "Sidebar Penuh (288px)"}
              </span>
            </div>

            {/* Inner App Canvas */}
            <div className={`flex min-h-[155px] ${activeTheme.appBg}`}>
              {/* Mini Sidebar */}
              <div
                className={`transition-all duration-300 p-2.5 flex flex-col justify-between border-r shrink-0 ${activeTheme.sidebarBg} ${activeTheme.sidebarBorder} ${
                  settings.isMinimized ? "w-16" : "w-52"
                }`}
              >
                <div>
                  {/* Brand logo preview */}
                  <div className={`flex items-start gap-2 mb-3 px-1 ${settings.isMinimized ? "justify-center" : ""}`}>
                    <CompanyLogo
                      iconUrl={companyProfile?.iconUrl}
                      companyName={brandName}
                      className="w-7 h-7 rounded-lg shrink-0"
                    />
                    {!settings.isMinimized && (
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-extrabold leading-snug break-words whitespace-normal ${activeTheme.textLogo}`}>
                          {brandName}
                        </div>
                        <div className={`text-[9px] leading-tight break-words whitespace-normal mt-0.5 ${activeTheme.textSub}`}>
                          {brandSub}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sample 3D Nav Links */}
                  <div className="space-y-1.5">
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 text-xs font-bold ${settings.buttonShape} ${activeTheme.navItemActive} ${
                        settings.isMinimized ? "justify-center" : ""
                      }`}
                    >
                      <LayoutDashboard size={14} className={activeTheme.navIconActive} />
                      {!settings.isMinimized && <span>Dashboard</span>}
                    </div>
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 text-xs font-medium ${settings.buttonShape} ${activeTheme.navItemInactive} ${
                        settings.isMinimized ? "justify-center" : ""
                      }`}
                    >
                      <FilePlus size={14} className={activeTheme.navIconInactive} />
                      {!settings.isMinimized && <span>Input Faktur</span>}
                    </div>
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 text-xs font-medium ${settings.buttonShape} ${activeTheme.navItemInactive} ${
                        settings.isMinimized ? "justify-center" : ""
                      }`}
                    >
                      <Files size={14} className={activeTheme.navIconInactive} />
                      {!settings.isMinimized && <span>Riwayat Faktur</span>}
                    </div>
                  </div>
                </div>

                {/* Bottom hint inside preview */}
                <div className="pt-2 border-t border-white/10 text-center">
                  <span className={`text-[9px] font-medium ${activeTheme.isDark ? "text-slate-400" : "text-slate-400"}`}>
                    {settings.isMinimized ? "80px" : "288px"}
                  </span>
                </div>
              </div>

              {/* Mini 3D Main Content Area */}
              <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between">
                <div>
                  {settings.isMinimized ? (
                    <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200 flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-slate-800 break-words whitespace-normal">
                        {brandName}
                      </span>
                    </div>
                  ) : (
                    <div className="h-4 bg-slate-300/80 rounded-md w-1/3 mb-3 shadow-inner" />
                  )}
                  <div className="grid grid-cols-3 gap-2.5 mb-2">
                    <div className="h-10 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-lg p-1.5 shadow-xs">
                      <div className="h-2 bg-blue-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-blue-600 rounded w-1/2" />
                    </div>
                    <div className="h-10 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-lg p-1.5 shadow-xs">
                      <div className="h-2 bg-emerald-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-emerald-600 rounded w-1/2" />
                    </div>
                    <div className="h-10 bg-white border border-slate-200 border-b-[3px] border-b-slate-300 rounded-lg p-1.5 shadow-xs">
                      <div className="h-2 bg-rose-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-rose-600 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Seluruh kartu, tombol, dan navigasi otomatis menyesuaikan kedalaman 3D dari tema terpilih.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Minimize Navbar Toggle */}
      <div className="rounded-xl border border-blue-200 border-b-[3px] border-b-blue-300 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#1e40af]">
            {settings.isMinimized ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm">Mode Minimize / Kecilkan Navbar</h4>
              <span className="text-xs text-slate-500">·</span>
              <span className={`text-xs font-bold ${settings.isMinimized ? "text-blue-700" : "text-slate-500"}`}>
                {settings.isMinimized ? "Aktif (80px)" : "Nonaktif (Penuh)"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
              Mengecilkan sidebar menjadi mode ikon ringkas (80px) agar ruang kerja tabel faktur dan laporan lebih lega.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMinimized}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            settings.isMinimized
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-white text-slate-700 border border-slate-300 border-b-[3px] border-b-slate-400 hover:bg-slate-50 active:translate-y-0.5"
          }`}
        >
          {settings.isMinimized ? (
            <>
              <Maximize2 size={15} />
              <span>Kembalikan Penuh</span>
            </>
          ) : (
            <>
              <Minimize2 size={15} />
              <span>Minimize Navbar</span>
            </>
          )}
        </button>
      </div>

      {/* Feature 2: 3D Color Themes Gallery */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Box size={16} className="text-blue-600" />
              Galeri Tema 3D ({themesList.length} Gaya Pilihan)
            </h4>
            <p className="text-xs text-slate-500">
              Setiap tema dilengkapi efek kedalaman 3D, highlight sudut atas, dan tombol navigasi timbul.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
            {(["ALL", "Terang", "Gelap", "Warna-Warni"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  categoryFilter === cat
                    ? "bg-white text-slate-900 shadow-[0_2px_0_#cbd5e1]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {cat === "ALL" ? "Semua (8)" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredThemes.map((theme) => {
            const isSelected = settings.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setTheme(theme.id)}
                className={`group relative text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-blue-600 border-b-4 border-b-blue-700 bg-blue-50/40 -translate-y-0.5 shadow-[0_10px_20px_-6px_rgba(37,99,235,0.28)] ring-2 ring-blue-500/20"
                    : "border-slate-200 border-b-4 border-b-slate-300 bg-white hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_10px_18px_-6px_rgba(15,23,42,0.12)] active:translate-y-0"
                }`}
              >
                {/* Top 3D Swatch Spheres & Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-1.5">
                    <span
                      className="w-6 h-6 rounded-full border border-white/80 swatch-3d-sphere inline-block"
                      style={{ backgroundColor: theme.swatchColors[0] }}
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-white/80 swatch-3d-sphere inline-block"
                      style={{ backgroundColor: theme.swatchColors[1] }}
                    />
                    <span
                      className="w-6 h-6 rounded-full border border-white/80 swatch-3d-sphere inline-block"
                      style={{ backgroundColor: theme.swatchColors[2] }}
                    />
                  </div>

                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-[0_2px_0_#1e40af]">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                      3D
                    </span>
                  )}
                </div>

                {/* Theme Name & Description */}
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                    {theme.name}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* 3D Beveled Sample Strip */}
                <div
                  className={`mt-1 py-2 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-between gap-2 border border-b-[3px] ${theme.sidebarBg} ${theme.sidebarBorder}`}
                >
                  <span className={`min-w-0 flex-1 break-words whitespace-normal leading-tight text-left ${theme.textLogo}`}>
                    {brandName}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md text-[9px] font-bold shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_0_rgba(0,0,0,0.28)]"
                    style={{
                      backgroundColor: theme.swatchColors[1],
                      color: theme.id === "graphite-dark" ? "#09090b" : "#ffffff",
                    }}
                  >
                    Aktif 3D
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 3: Button Shape & Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        {/* Button Shape */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Bentuk Tombol 3D
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "rounded-lg" as NavbarButtonShape, label: "Rounded 3D", previewClass: "rounded-lg" },
              { id: "rounded-full" as NavbarButtonShape, label: "Kapsul 3D", previewClass: "rounded-full" },
              { id: "rounded-md" as NavbarButtonShape, label: "Kotak 3D", previewClass: "rounded-md" },
            ].map((shape) => {
              const isSelected = settings.buttonShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setButtonShape(shape.id)}
                  className={`p-2.5 rounded-xl border border-b-[3px] text-center transition-all ${
                    isSelected
                      ? "border-blue-600 border-b-blue-700 bg-blue-50/50 font-bold text-blue-700 shadow-sm"
                      : "border-slate-200 border-b-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-xs"
                  }`}
                >
                  <div
                    className={`h-6 w-full bg-gradient-to-b from-blue-500 to-blue-600 border-b-2 border-blue-800 text-white text-[10px] flex items-center justify-center font-bold mb-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ${shape.previewClass}`}
                  >
                    Menu
                  </div>
                  <span className="text-[11px] font-medium">{shape.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Mode (Sidebar vs Topbar) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Tata Letak Navbar Desktop
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: "sidebar" as NavbarLayoutMode,
                label: "Sidebar Kiri 3D",
                desc: "Di samping kiri layar (dapat diminimize)",
                icon: Layout,
              },
              {
                id: "topbar" as NavbarLayoutMode,
                label: "Navbar Atas 3D",
                desc: "Di bagian atas layar untuk lebar penuh 100%",
                icon: Sliders,
              },
            ].map((layoutItem) => {
              const isSelected = settings.layout === layoutItem.id;
              const Icon = layoutItem.icon;
              return (
                <button
                  key={layoutItem.id}
                  type="button"
                  onClick={() => setLayout(layoutItem.id)}
                  className={`p-2.5 rounded-xl border border-b-[3px] text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 border-b-blue-700 bg-blue-50/50 text-blue-900 shadow-sm"
                      : "border-slate-200 border-b-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                    {isSelected && <Check size={14} className="text-blue-600 font-bold" />}
                  </div>
                  <div className="font-bold text-xs text-slate-900">{layoutItem.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{layoutItem.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature 4: Gaya Transisi Perpindahan Halaman */}
      <div className="space-y-3.5 pt-5 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-indigo-600" />
              Gaya Transisi Perpindahan Halaman
            </h4>
            <p className="text-xs text-slate-500">
              Pilih karakter animasi saat berpindah antar menu agar terasa halus, khas, dan tetap profesional.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPreviewStep((s) => s + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <Play size={12} />
            <span>Uji Transisi</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Style Options */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {PAGE_TRANSITION_STYLES.map((styleItem) => {
              const isSelected = currentTransition === styleItem.id;
              return (
                <button
                  key={styleItem.id}
                  type="button"
                  onClick={() => {
                    setPageTransition(styleItem.id);
                    setPreviewStep((s) => s + 1);
                  }}
                  className={`text-left p-3 rounded-xl border border-b-[3px] transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "border-indigo-600 border-b-indigo-700 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/15"
                      : "border-slate-200 border-b-slate-300 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {styleItem.badge}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      {styleItem.name}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {styleItem.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mini Live Transition Demo Stage */}
          <div
            className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-100/80 p-3 flex flex-col justify-between overflow-hidden min-h-[140px]"
            style={{ perspective: "900px" }}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              <span>Pratinjau Transisi</span>
              <span className="text-indigo-600">
                {PAGE_TRANSITION_STYLES.find((s) => s.id === currentTransition)?.name}
              </span>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${currentTransition}-${previewStep}`}
                  initial={
                    currentTransition === "directional-glide"
                      ? { opacity: 0, x: 26, scale: 0.99 }
                      : currentTransition === "desk-tilt-3d"
                      ? { opacity: 0, y: 14, rotateX: 5, scale: 0.97 }
                      : currentTransition === "editorial-veil"
                      ? { opacity: 0, y: 10, clipPath: "inset(0% 0% 25% 0% round 8px)" }
                      : currentTransition === "executive-fade"
                      ? { opacity: 0, scale: 0.99 }
                      : { opacity: 0, y: 12, x: 8, scale: 0.98 }
                  }
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotateX: 0,
                    scale: 1,
                    clipPath: "inset(0% 0% 0% 0% round 8px)",
                  }}
                  exit={
                    currentTransition === "directional-glide"
                      ? { opacity: 0, x: -20 }
                      : { opacity: 0, y: -8 }
                  }
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-lg bg-white border border-slate-200 border-b-[3px] border-b-slate-300 p-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800">
                      {previewStep % 2 === 0 ? "Dashboard Ringkasan" : "Laporan Jatuh Tempo"}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">
                      {previewStep % 2 === 0 ? "Rp 24.500.000" : "18 Faktur"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 rounded bg-slate-200 w-3/4" />
                    <div className="h-2 rounded bg-slate-100 w-full" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
