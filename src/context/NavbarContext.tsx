import React, { createContext, useContext, useState, useEffect } from "react";
import {
  NavbarSettings,
  NavbarThemeId,
  NavbarLayoutMode,
  NavbarButtonShape,
} from "../types";

export interface NavbarThemeConfig {
  id: NavbarThemeId;
  name: string;
  category: "Terang" | "Gelap" | "Warna-Warni";
  description: string;
  swatchColors: [string, string, string]; // [bg, accent, border]
  appBg: string;
  sidebarBg: string;
  sidebarBorder: string;
  headerBg: string;
  headerBorder: string;
  textLogo: string;
  textSub: string;
  navItemInactive: string;
  navItemActive: string;
  navIconActive: string;
  navIconInactive: string;
  toggleBtnHover: string;
  mobileBottomBg: string;
  mobileBottomBorder: string;
  mobileActiveIndicator: string;
  mobileInactiveText: string;
  mobileActiveText: string;
  badgeBg: string;
  isDark: boolean;
}

export const NAVBAR_THEMES: Record<NavbarThemeId, NavbarThemeConfig> = {
  "modern-light": {
    id: "modern-light",
    name: "Modern Clean 3D",
    category: "Terang",
    description: "Permukaan putih 3D dengan bevel perak halus dan tombol biru royal timbul.",
    swatchColors: ["#ffffff", "#2563eb", "#cbd5e1"],
    appBg: "bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50/40",
    sidebarBg:
      "bg-gradient-to-b from-white via-slate-50 to-slate-100/90 shadow-[inset_-1px_0_0_rgba(255,255,255,0.9),6px_0_24px_-12px_rgba(15,23,42,0.12)]",
    sidebarBorder: "border-slate-200/90",
    headerBg:
      "bg-gradient-to-b from-white to-slate-50 shadow-[inset_0_1px_0_#ffffff,0_4px_0_#e2e8f0,0_8px_18px_-6px_rgba(15,23,42,0.08)]",
    headerBorder: "border-slate-200",
    textLogo: "text-slate-900",
    textSub: "text-blue-600",
    navItemInactive:
      "text-slate-600 border border-transparent hover:bg-white hover:text-slate-900 hover:border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#e2e8f0,0_6px_12px_-4px_rgba(15,23,42,0.08)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-blue-500 to-blue-600 text-white border-b-[3px] border-blue-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-3px_rgba(37,99,235,0.45)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-slate-400 group-hover:text-blue-600",
    toggleBtnHover:
      "hover:bg-white text-slate-500 hover:text-slate-900 hover:shadow-[0_2px_0_#cbd5e1] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-slate-100 to-white shadow-[0_-6px_20px_-4px_rgba(15,23,42,0.12)]",
    mobileBottomBorder: "border-slate-200",
    mobileActiveIndicator: "bg-blue-600 shadow-[0_2px_6px_rgba(37,99,235,0.5)]",
    mobileInactiveText: "text-slate-500 hover:text-slate-900",
    mobileActiveText: "text-blue-600 font-bold",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200 shadow-[0_2px_0_#bfdbfe]",
    isDark: false,
  },
  "midnight-dark": {
    id: "midnight-dark",
    name: "Midnight Slate 3D",
    category: "Gelap",
    description: "Panel slate 3D berdimensi dengan aksen tombol indigo timbul bercahaya.",
    swatchColors: ["#0f172a", "#6366f1", "#334155"],
    appBg: "bg-gradient-to-br from-slate-100 via-indigo-50/30 to-slate-200/70",
    sidebarBg:
      "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[inset_1px_0_0_rgba(255,255,255,0.08),8px_0_28px_-8px_rgba(15,23,42,0.4)]",
    sidebarBorder: "border-slate-700/80",
    headerBg:
      "bg-gradient-to-b from-slate-800 to-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_0_#020617,0_10px_20px_-6px_rgba(15,23,42,0.38)]",
    headerBorder: "border-slate-700/80",
    textLogo: "text-white drop-shadow-xs",
    textSub: "text-indigo-300",
    navItemInactive:
      "text-slate-300 border border-transparent hover:bg-slate-800/90 hover:text-white hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#020617,0_6px_14px_rgba(0,0,0,0.3)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-b-[3px] border-indigo-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_6px_16px_-2px_rgba(99,102,241,0.5)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-slate-400 group-hover:text-indigo-300",
    toggleBtnHover:
      "hover:bg-slate-800 text-slate-300 hover:text-white hover:shadow-[0_2px_0_#020617] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-slate-950 to-slate-900 shadow-[0_-8px_24px_-4px_rgba(2,6,23,0.45)]",
    mobileBottomBorder: "border-slate-700/80",
    mobileActiveIndicator: "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]",
    mobileInactiveText: "text-slate-400 hover:text-slate-100",
    mobileActiveText: "text-indigo-300 font-bold",
    badgeBg: "bg-indigo-950 text-indigo-200 border-indigo-700 shadow-[0_2px_0_#1e1b4b]",
    isDark: true,
  },
  "deep-navy": {
    id: "deep-navy",
    name: "Deep Navy 3D",
    category: "Gelap",
    description: "Biru laut korporat 3D dengan efek bevel metalik dan tombol biru langit timbul.",
    swatchColors: ["#172554", "#0284c7", "#1d4ed8"],
    appBg: "bg-gradient-to-br from-slate-100 via-sky-50/40 to-blue-100/50",
    sidebarBg:
      "bg-gradient-to-b from-blue-900 via-blue-950 to-[#0b1538] shadow-[inset_1px_0_0_rgba(255,255,255,0.12),8px_0_28px_-8px_rgba(23,37,84,0.45)]",
    sidebarBorder: "border-blue-800/80",
    headerBg:
      "bg-gradient-to-b from-blue-900 to-blue-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_0_#091230,0_10px_20px_-6px_rgba(23,37,84,0.4)]",
    headerBorder: "border-blue-800/80",
    textLogo: "text-white drop-shadow-xs",
    textSub: "text-sky-300",
    navItemInactive:
      "text-blue-100/85 border border-transparent hover:bg-blue-900/85 hover:text-white hover:border-blue-700/80 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#08102b,0_6px_14px_rgba(0,0,0,0.32)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-sky-400 to-blue-600 text-white border-b-[3px] border-blue-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-2px_rgba(56,189,248,0.45)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-blue-300 group-hover:text-sky-200",
    toggleBtnHover:
      "hover:bg-blue-900 text-blue-200 hover:text-white hover:shadow-[0_2px_0_#08102b] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-[#0b1538] to-blue-950 shadow-[0_-8px_24px_-4px_rgba(11,21,56,0.45)]",
    mobileBottomBorder: "border-blue-800/80",
    mobileActiveIndicator: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]",
    mobileInactiveText: "text-blue-300 hover:text-white",
    mobileActiveText: "text-sky-300 font-bold",
    badgeBg: "bg-blue-900 text-blue-100 border-blue-700 shadow-[0_2px_0_#172554]",
    isDark: true,
  },
  "emerald-luxury": {
    id: "emerald-luxury",
    name: "Emerald Forest 3D",
    category: "Warna-Warni",
    description: "Hijau zamrud 3D berdimensi dalam dengan tombol zamrud timbul berkilau.",
    swatchColors: ["#064e3b", "#10b981", "#047857"],
    appBg: "bg-gradient-to-br from-slate-100 via-emerald-50/40 to-teal-100/40",
    sidebarBg:
      "bg-gradient-to-b from-emerald-900 via-emerald-950 to-[#022c22] shadow-[inset_1px_0_0_rgba(255,255,255,0.12),8px_0_28px_-8px_rgba(6,78,59,0.45)]",
    sidebarBorder: "border-emerald-800/80",
    headerBg:
      "bg-gradient-to-b from-emerald-900 to-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_0_#022c22,0_10px_20px_-6px_rgba(6,78,59,0.4)]",
    headerBorder: "border-emerald-800/80",
    textLogo: "text-white drop-shadow-xs",
    textSub: "text-emerald-300",
    navItemInactive:
      "text-emerald-100/85 border border-transparent hover:bg-emerald-900/85 hover:text-white hover:border-emerald-700/80 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#022c22,0_6px_14px_rgba(0,0,0,0.3)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-b-[3px] border-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-2px_rgba(16,185,129,0.45)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-emerald-300 group-hover:text-emerald-100",
    toggleBtnHover:
      "hover:bg-emerald-900 text-emerald-200 hover:text-white hover:shadow-[0_2px_0_#022c22] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-[#022c22] to-emerald-950 shadow-[0_-8px_24px_-4px_rgba(2,44,34,0.45)]",
    mobileBottomBorder: "border-emerald-800/80",
    mobileActiveIndicator: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    mobileInactiveText: "text-emerald-300 hover:text-white",
    mobileActiveText: "text-emerald-300 font-bold",
    badgeBg: "bg-emerald-900 text-emerald-100 border-emerald-700 shadow-[0_2px_0_#022c22]",
    isDark: true,
  },
  "royal-purple": {
    id: "royal-purple",
    name: "Royal Purple 3D",
    category: "Warna-Warni",
    description: "Ungu kerajaan 3D bertekstur luks dengan tombol violet timbul penuh kedalaman.",
    swatchColors: ["#2e1065", "#9333ea", "#6b21a8"],
    appBg: "bg-gradient-to-br from-slate-100 via-purple-50/40 to-fuchsia-50/40",
    sidebarBg:
      "bg-gradient-to-b from-purple-900 via-purple-950 to-[#1e0842] shadow-[inset_1px_0_0_rgba(255,255,255,0.12),8px_0_28px_-8px_rgba(46,16,101,0.45)]",
    sidebarBorder: "border-purple-800/80",
    headerBg:
      "bg-gradient-to-b from-purple-900 to-purple-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_0_#1e0842,0_10px_20px_-6px_rgba(46,16,101,0.4)]",
    headerBorder: "border-purple-800/80",
    textLogo: "text-white drop-shadow-xs",
    textSub: "text-purple-300",
    navItemInactive:
      "text-purple-100/85 border border-transparent hover:bg-purple-900/85 hover:text-white hover:border-purple-700/80 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#1e0842,0_6px_14px_rgba(0,0,0,0.3)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-purple-400 to-purple-600 text-white border-b-[3px] border-purple-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_6px_16px_-2px_rgba(168,85,247,0.5)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-purple-300 group-hover:text-purple-100",
    toggleBtnHover:
      "hover:bg-purple-900 text-purple-200 hover:text-white hover:shadow-[0_2px_0_#1e0842] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-[#1e0842] to-purple-950 shadow-[0_-8px_24px_-4px_rgba(30,8,66,0.45)]",
    mobileBottomBorder: "border-purple-800/80",
    mobileActiveIndicator: "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.85)]",
    mobileInactiveText: "text-purple-300 hover:text-white",
    mobileActiveText: "text-purple-200 font-bold",
    badgeBg: "bg-purple-900 text-purple-100 border-purple-700 shadow-[0_2px_0_#1e0842]",
    isDark: true,
  },
  "sunset-crimson": {
    id: "sunset-crimson",
    name: "Sunset Crimson 3D",
    category: "Warna-Warni",
    description: "Merah marun tegas 3D dengan sudut bevel hangat dan aksen rose timbul.",
    swatchColors: ["#4c0519", "#e11d48", "#9f1239"],
    appBg: "bg-gradient-to-br from-slate-100 via-rose-50/40 to-orange-50/40",
    sidebarBg:
      "bg-gradient-to-b from-rose-900 via-rose-950 to-[#310310] shadow-[inset_1px_0_0_rgba(255,255,255,0.12),8px_0_28px_-8px_rgba(76,5,25,0.45)]",
    sidebarBorder: "border-rose-800/80",
    headerBg:
      "bg-gradient-to-b from-rose-900 to-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_0_#310310,0_10px_20px_-6px_rgba(76,5,25,0.4)]",
    headerBorder: "border-rose-800/80",
    textLogo: "text-white drop-shadow-xs",
    textSub: "text-rose-300",
    navItemInactive:
      "text-rose-100/85 border border-transparent hover:bg-rose-900/85 hover:text-white hover:border-rose-700/80 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#310310,0_6px_14px_rgba(0,0,0,0.3)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-rose-400 to-rose-600 text-white border-b-[3px] border-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_6px_16px_-2px_rgba(244,63,94,0.5)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-rose-300 group-hover:text-rose-100",
    toggleBtnHover:
      "hover:bg-rose-900 text-rose-200 hover:text-white hover:shadow-[0_2px_0_#310310] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-[#310310] to-rose-950 shadow-[0_-8px_24px_-4px_rgba(49,3,16,0.45)]",
    mobileBottomBorder: "border-rose-800/80",
    mobileActiveIndicator: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.85)]",
    mobileInactiveText: "text-rose-300 hover:text-white",
    mobileActiveText: "text-rose-200 font-bold",
    badgeBg: "bg-rose-900 text-rose-100 border-rose-700 shadow-[0_2px_0_#310310]",
    isDark: true,
  },
  "graphite-dark": {
    id: "graphite-dark",
    name: "Graphite Minimal 3D",
    category: "Gelap",
    description: "Hitam arang monokrom 3D dengan tombol perak putih bertepi timbul presisi.",
    swatchColors: ["#09090b", "#f4f4f5", "#3f3f46"],
    appBg: "bg-gradient-to-br from-zinc-200/70 via-zinc-100 to-slate-200/70",
    sidebarBg:
      "bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 shadow-[inset_1px_0_0_rgba(255,255,255,0.1),8px_0_28px_-8px_rgba(9,9,11,0.5)]",
    sidebarBorder: "border-zinc-700/80",
    headerBg:
      "bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_0_#000000,0_10px_20px_-6px_rgba(9,9,11,0.45)]",
    headerBorder: "border-zinc-700/80",
    textLogo: "text-zinc-50 drop-shadow-xs",
    textSub: "text-zinc-400",
    navItemInactive:
      "text-zinc-300 border border-transparent hover:bg-zinc-800/90 hover:text-white hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#000000,0_6px_14px_rgba(0,0,0,0.4)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-white to-zinc-200 text-zinc-950 font-bold border-b-[3px] border-zinc-400 shadow-[inset_0_1px_0_#ffffff,0_6px_16px_-2px_rgba(255,255,255,0.28)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-zinc-950",
    navIconInactive: "text-zinc-400 group-hover:text-zinc-100",
    toggleBtnHover:
      "hover:bg-zinc-800 text-zinc-300 hover:text-white hover:shadow-[0_2px_0_#000000] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-black to-zinc-950 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.5)]",
    mobileBottomBorder: "border-zinc-800",
    mobileActiveIndicator: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]",
    mobileInactiveText: "text-zinc-400 hover:text-zinc-100",
    mobileActiveText: "text-white font-bold",
    badgeBg: "bg-zinc-900 text-zinc-200 border-zinc-700 shadow-[0_2px_0_#000000]",
    isDark: true,
  },
  "soft-pastel": {
    id: "soft-pastel",
    name: "Soft Sky 3D",
    category: "Terang",
    description: "Biru es pastel 3D berkilau lembut dengan efek kaca timbul yang sejuk di mata.",
    swatchColors: ["#e0f2fe", "#0284c7", "#7dd3fc"],
    appBg: "bg-gradient-to-br from-sky-100/70 via-slate-50 to-indigo-100/60",
    sidebarBg:
      "bg-gradient-to-b from-white via-sky-50 to-sky-100/80 shadow-[inset_-1px_0_0_rgba(255,255,255,0.95),6px_0_24px_-12px_rgba(2,132,199,0.2)]",
    sidebarBorder: "border-sky-200",
    headerBg:
      "bg-gradient-to-b from-white to-sky-50 shadow-[inset_0_1px_0_#ffffff,0_4px_0_#bae6fd,0_8px_18px_-6px_rgba(2,132,199,0.14)]",
    headerBorder: "border-sky-200",
    textLogo: "text-sky-950",
    textSub: "text-sky-600",
    navItemInactive:
      "text-slate-600 border border-transparent hover:bg-white hover:text-sky-950 hover:border-sky-200 hover:-translate-y-0.5 hover:shadow-[0_3px_0_#bae6fd,0_6px_12px_-4px_rgba(2,132,199,0.15)] active:translate-y-0",
    navItemActive:
      "bg-gradient-to-b from-sky-400 to-sky-600 text-white border-b-[3px] border-sky-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_14px_-3px_rgba(2,132,199,0.4)] -translate-y-0.5 active:translate-y-[1px] active:border-b-0",
    navIconActive: "text-white drop-shadow-xs",
    navIconInactive: "text-sky-500 group-hover:text-sky-700",
    toggleBtnHover:
      "hover:bg-white text-sky-600 hover:text-sky-950 hover:shadow-[0_2px_0_#bae6fd] active:translate-y-0.5",
    mobileBottomBg:
      "bg-gradient-to-t from-sky-100 to-white shadow-[0_-6px_20px_-4px_rgba(2,132,199,0.16)]",
    mobileBottomBorder: "border-sky-200",
    mobileActiveIndicator: "bg-sky-600 shadow-[0_2px_6px_rgba(2,132,199,0.5)]",
    mobileInactiveText: "text-slate-500 hover:text-sky-950",
    mobileActiveText: "text-sky-700 font-bold",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-300 shadow-[0_2px_0_#7dd3fc]",
    isDark: false,
  },
};

const DEFAULT_SETTINGS: NavbarSettings = {
  theme: "modern-light",
  layout: "sidebar",
  isMinimized: false,
  buttonShape: "rounded-lg",
};

const STORAGE_KEY = "af_faktur_navbar_settings_v1";

interface NavbarContextType {
  settings: NavbarSettings;
  activeTheme: NavbarThemeConfig;
  setTheme: (theme: NavbarThemeId) => void;
  setLayout: (layout: NavbarLayoutMode) => void;
  setIsMinimized: (minimized: boolean) => void;
  toggleMinimized: () => void;
  setButtonShape: (shape: NavbarButtonShape) => void;
  resetNavbarSettings: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<NavbarSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
        };
      }
    } catch (e) {
      console.error("Failed to read navbar settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save navbar settings to localStorage", e);
    }
  }, [settings]);

  const setTheme = (theme: NavbarThemeId) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setLayout = (layout: NavbarLayoutMode) => {
    setSettings((prev) => ({ ...prev, layout }));
  };

  const setIsMinimized = (isMinimized: boolean) => {
    setSettings((prev) => ({ ...prev, isMinimized }));
  };

  const toggleMinimized = () => {
    setSettings((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const setButtonShape = (buttonShape: NavbarButtonShape) => {
    setSettings((prev) => ({ ...prev, buttonShape }));
  };

  const resetNavbarSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const activeTheme = NAVBAR_THEMES[settings.theme] || NAVBAR_THEMES["modern-light"];

  return (
    <NavbarContext.Provider
      value={{
        settings,
        activeTheme,
        setTheme,
        setLayout,
        setIsMinimized,
        toggleMinimized,
        setButtonShape,
        resetNavbarSettings,
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within a NavbarProvider");
  }
  return context;
}
