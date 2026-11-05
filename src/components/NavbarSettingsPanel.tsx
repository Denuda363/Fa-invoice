import React, { useState } from "react";
import { useNavbar, NAVBAR_THEMES, NavbarThemeConfig } from "../context/NavbarContext";
import { NavbarThemeId, NavbarLayoutMode, NavbarButtonShape } from "../types";
import {
  Palette,
  Layout,
  Minimize2,
  Maximize2,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Files,
  Receipt,
  FilePlus,
} from "lucide-react";

export function NavbarSettingsPanel() {
  const {
    settings,
    activeTheme,
    setTheme,
    setLayout,
    setIsMinimized,
    toggleMinimized,
    setButtonShape,
    resetNavbarSettings,
  } = useNavbar();

  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "Terang" | "Gelap" | "Warna-Warni">("ALL");

  const themesList = Object.values(NAVBAR_THEMES);
  const filteredThemes =
    categoryFilter === "ALL"
      ? themesList
      : themesList.filter((t) => t.category === categoryFilter);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tampilan & Gaya Navbar</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Ubah gaya tema warna, ukuran minimize, tata letak, dan bentuk tombol navbar.
            </p>
          </div>
        </div>

        <button
          onClick={resetNavbarSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors self-start sm:self-auto"
          title="Kembalikan navbar ke pengaturan default"
        >
          <RotateCcw size={13} />
          <span>Reset Gaya Default</span>
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Pratinjau Langsung Gaya Navbar (Live Preview)
          </span>
          <span className="text-xs text-gray-400">
            Tema: <strong className="text-gray-700">{activeTheme.name}</strong>
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 bg-gray-100/70 overflow-hidden">
          {/* Mini Mockup Window */}
          <div className="rounded-lg shadow-sm overflow-hidden border border-gray-300/80 bg-white">
            {/* Window bar */}
            <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 font-medium text-gray-600">AF Faktur - Pratinjau Tampilan</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {settings.isMinimized ? "Mode Minimized (Ikon)" : "Mode Penuh"}
              </span>
            </div>

            {/* Inner App Canvas */}
            <div className="flex min-h-[140px] bg-slate-50">
              {/* Mini Sidebar */}
              <div
                className={`transition-all duration-300 p-2.5 flex flex-col justify-between border-r ${activeTheme.sidebarBg} ${activeTheme.sidebarBorder} ${
                  settings.isMinimized ? "w-16" : "w-48"
                }`}
              >
                <div>
                  {/* Brand logo preview */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <img src="/icon.jpg" alt="Logo" className="w-6 h-6 rounded-md object-cover shrink-0 shadow-2xs" />
                    {!settings.isMinimized && (
                      <div className="truncate">
                        <div className={`text-xs font-bold leading-tight ${activeTheme.textLogo}`}>AF Faktur</div>
                        <div className={`text-[9px] ${activeTheme.textSub}`}>Manajemen</div>
                      </div>
                    )}
                  </div>

                  {/* Sample Nav Links */}
                  <div className="space-y-1">
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 text-xs font-medium ${settings.buttonShape} ${activeTheme.navItemActive} ${
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
                  <span className={`text-[9px] ${activeTheme.isDark ? "text-slate-400" : "text-gray-400"}`}>
                    {settings.isMinimized ? "80px" : "256px"}
                  </span>
                </div>
              </div>

              {/* Mini Main Content Area */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="h-8 bg-white border border-gray-200 rounded p-1">
                      <div className="h-2 bg-blue-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-blue-600 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-white border border-gray-200 rounded p-1">
                      <div className="h-2 bg-emerald-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-emerald-600 rounded w-1/2" />
                    </div>
                    <div className="h-8 bg-white border border-gray-200 rounded p-1">
                      <div className="h-2 bg-red-100 rounded w-2/3 mb-1" />
                      <div className="h-2.5 bg-red-600 rounded w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 italic">
                  * Ruang kerja faktur melebar otomatis saat navbar di-minimize.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Minimize Navbar Toggle */}
      <div className="rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            {settings.isMinimized ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm">Mode Minimize / Kecilkan Navbar</h4>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  settings.isMinimized
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {settings.isMinimized ? "SEDANG AKTIF" : "NONAKTIF"}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5 max-w-xl">
              Mengecilkan sidebar menjadi mode ikon ringkas (80px). Memberikan ruang layar ekstra besar untuk tabel faktur, laporan jatuh tempo, dan data konsumen.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMinimized}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 shrink-0 ${
            settings.isMinimized
              ? "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-600/30"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
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

      {/* Feature 2: Color Themes Gallery */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <Palette size={16} className="text-blue-600" />
              Pilihan Gaya & Tema Warna Navbar ({themesList.length} Gaya)
            </h4>
            <p className="text-xs text-gray-500">
              Pilih gaya visual yang paling sesuai dengan selera Anda atau identitas bisnis Anda.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start sm:self-auto text-xs">
            {(["ALL", "Terang", "Gelap", "Warna-Warni"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  categoryFilter === cat
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {cat === "ALL" ? "Semua (8)" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredThemes.map((theme) => {
            const isSelected = settings.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setTheme(theme.id)}
                className={`group relative text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-600/20"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs"
                }`}
              >
                {/* Top swatch & indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center -space-x-1">
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-2xs inline-block"
                      style={{ backgroundColor: theme.swatchColors[0] }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-2xs inline-block"
                      style={{ backgroundColor: theme.swatchColors[1] }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-2xs inline-block"
                      style={{ backgroundColor: theme.swatchColors[2] }}
                    />
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* Theme Name & Description */}
                <div>
                  <h5 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors">
                    {theme.name}
                  </h5>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Sample visual pill */}
                <div
                  className={`mt-1 py-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center justify-between border ${theme.sidebarBg} ${theme.sidebarBorder}`}
                >
                  <span className={theme.textLogo}>AF Faktur</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{
                      backgroundColor: theme.swatchColors[1],
                      color: "#ffffff",
                    }}
                  >
                    Aktif
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 3: Button Shape & Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        {/* Button Shape */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Bentuk Tombol Menu (Button Shape)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "rounded-lg" as NavbarButtonShape, label: "Rounded Modern", previewClass: "rounded-lg" },
              { id: "rounded-full" as NavbarButtonShape, label: "Kapsul (Pill)", previewClass: "rounded-full" },
              { id: "rounded-md" as NavbarButtonShape, label: "Klasik Kotak", previewClass: "rounded-md" },
            ].map((shape) => {
              const isSelected = settings.buttonShape === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => setButtonShape(shape.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 font-bold text-blue-700 shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs"
                  }`}
                >
                  <div
                    className={`h-5 w-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold mb-1.5 ${shape.previewClass}`}
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
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Tata Letak Navbar (Layout Desktop)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: "sidebar" as NavbarLayoutMode,
                label: "Sidebar Kiri",
                desc: "Di samping kiri layar (dapat diminimize)",
                icon: Layout,
              },
              {
                id: "topbar" as NavbarLayoutMode,
                label: "Navbar Atas",
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
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-2xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon size={16} className={isSelected ? "text-blue-600" : "text-gray-400"} />
                    {isSelected && <Check size={14} className="text-blue-600 font-bold" />}
                  </div>
                  <div className="font-bold text-xs text-gray-900">{layoutItem.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{layoutItem.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
