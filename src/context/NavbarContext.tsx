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
    name: "Modern Clean (Putih Minimalis)",
    category: "Terang",
    description: "Putih bersih minimalis dengan aksen biru royal standar profesional.",
    swatchColors: ["#ffffff", "#2563eb", "#e2e8f0"],
    sidebarBg: "bg-white",
    sidebarBorder: "border-gray-200",
    headerBg: "bg-white",
    headerBorder: "border-gray-200",
    textLogo: "text-gray-900",
    textSub: "text-blue-600",
    navItemInactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    navItemActive: "bg-blue-600 text-white shadow-sm shadow-blue-500/20",
    navIconActive: "text-white",
    navIconInactive: "text-gray-400 group-hover:text-gray-600",
    toggleBtnHover: "hover:bg-gray-100 text-gray-500 hover:text-gray-800",
    mobileBottomBg: "bg-white",
    mobileBottomBorder: "border-gray-200",
    mobileActiveIndicator: "bg-blue-600",
    mobileInactiveText: "text-gray-500 hover:text-gray-900",
    mobileActiveText: "text-blue-600 font-semibold",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    isDark: false,
  },
  "midnight-dark": {
    id: "midnight-dark",
    name: "Midnight Slate (Gelap Elegan)",
    category: "Gelap",
    description: "Latar slate pekat modern dengan aksen indigo menyala yang adem di mata.",
    swatchColors: ["#0f172a", "#6366f1", "#1e293b"],
    sidebarBg: "bg-slate-900",
    sidebarBorder: "border-slate-800",
    headerBg: "bg-slate-900",
    headerBorder: "border-slate-800",
    textLogo: "text-white",
    textSub: "text-indigo-400",
    navItemInactive: "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
    navItemActive: "bg-indigo-600 text-white shadow-md shadow-indigo-500/30",
    navIconActive: "text-white",
    navIconInactive: "text-slate-500 group-hover:text-slate-300",
    toggleBtnHover: "hover:bg-slate-800 text-slate-400 hover:text-slate-200",
    mobileBottomBg: "bg-slate-900",
    mobileBottomBorder: "border-slate-800",
    mobileActiveIndicator: "bg-indigo-400",
    mobileInactiveText: "text-slate-400 hover:text-slate-200",
    mobileActiveText: "text-indigo-400 font-semibold",
    badgeBg: "bg-indigo-950 text-indigo-300 border-indigo-800",
    isDark: true,
  },
  "deep-navy": {
    id: "deep-navy",
    name: "Deep Navy (Biru Korporat)",
    category: "Gelap",
    description: "Biru laut pekat berwibawa dengan aksen biru langit cerah terpercaya.",
    swatchColors: ["#172554", "#38bdf8", "#1e3a8a"],
    sidebarBg: "bg-blue-950",
    sidebarBorder: "border-blue-900",
    headerBg: "bg-blue-950",
    headerBorder: "border-blue-900",
    textLogo: "text-white",
    textSub: "text-sky-400",
    navItemInactive: "text-blue-200/80 hover:bg-blue-900/70 hover:text-white",
    navItemActive: "bg-blue-600 text-white shadow-md shadow-blue-500/30",
    navIconActive: "text-white",
    navIconInactive: "text-blue-400 group-hover:text-blue-200",
    toggleBtnHover: "hover:bg-blue-900 text-blue-300 hover:text-white",
    mobileBottomBg: "bg-blue-950",
    mobileBottomBorder: "border-blue-900",
    mobileActiveIndicator: "bg-sky-400",
    mobileInactiveText: "text-blue-300 hover:text-white",
    mobileActiveText: "text-sky-300 font-semibold",
    badgeBg: "bg-blue-900 text-blue-200 border-blue-700",
    isDark: true,
  },
  "emerald-luxury": {
    id: "emerald-luxury",
    name: "Emerald Forest (Hijau Bisnis)",
    category: "Warna-Warni",
    description: "Nuansa hijau zamrud mewah dan segar, melambangkan pertumbuhan bisnis & kas.",
    swatchColors: ["#064e3b", "#10b981", "#065f46"],
    sidebarBg: "bg-emerald-950",
    sidebarBorder: "border-emerald-900",
    headerBg: "bg-emerald-950",
    headerBorder: "border-emerald-900",
    textLogo: "text-white",
    textSub: "text-emerald-300",
    navItemInactive: "text-emerald-200/80 hover:bg-emerald-900/70 hover:text-white",
    navItemActive: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
    navIconActive: "text-white",
    navIconInactive: "text-emerald-400 group-hover:text-emerald-200",
    toggleBtnHover: "hover:bg-emerald-900 text-emerald-300 hover:text-white",
    mobileBottomBg: "bg-emerald-950",
    mobileBottomBorder: "border-emerald-900",
    mobileActiveIndicator: "bg-emerald-400",
    mobileInactiveText: "text-emerald-300 hover:text-white",
    mobileActiveText: "text-emerald-400 font-semibold",
    badgeBg: "bg-emerald-900 text-emerald-200 border-emerald-700",
    isDark: true,
  },
  "royal-purple": {
    id: "royal-purple",
    name: "Royal Purple (Ungu Mewah)",
    category: "Warna-Warni",
    description: "Ungu kerajaan eksklusif dengan aksen violet berkilau untuk sentuhan premium.",
    swatchColors: ["#2e1065", "#c084fc", "#3b0764"],
    sidebarBg: "bg-purple-950",
    sidebarBorder: "border-purple-900",
    headerBg: "bg-purple-950",
    headerBorder: "border-purple-900",
    textLogo: "text-white",
    textSub: "text-purple-300",
    navItemInactive: "text-purple-200/80 hover:bg-purple-900/70 hover:text-white",
    navItemActive: "bg-purple-600 text-white shadow-md shadow-purple-600/30",
    navIconActive: "text-white",
    navIconInactive: "text-purple-400 group-hover:text-purple-200",
    toggleBtnHover: "hover:bg-purple-900 text-purple-300 hover:text-white",
    mobileBottomBg: "bg-purple-950",
    mobileBottomBorder: "border-purple-900",
    mobileActiveIndicator: "bg-purple-400",
    mobileInactiveText: "text-purple-300 hover:text-white",
    mobileActiveText: "text-purple-300 font-semibold",
    badgeBg: "bg-purple-900 text-purple-200 border-purple-700",
    isDark: true,
  },
  "sunset-crimson": {
    id: "sunset-crimson",
    name: "Sunset Crimson (Merah Marun)",
    category: "Warna-Warni",
    description: "Merah marun berani dan tegas dengan aksen rose dinamis untuk tim energik.",
    swatchColors: ["#4c0519", "#f43f5e", "#881337"],
    sidebarBg: "bg-rose-950",
    sidebarBorder: "border-rose-900",
    headerBg: "bg-rose-950",
    headerBorder: "border-rose-900",
    textLogo: "text-white",
    textSub: "text-rose-300",
    navItemInactive: "text-rose-200/80 hover:bg-rose-900/70 hover:text-white",
    navItemActive: "bg-rose-600 text-white shadow-md shadow-rose-600/30",
    navIconActive: "text-white",
    navIconInactive: "text-rose-400 group-hover:text-rose-200",
    toggleBtnHover: "hover:bg-rose-900 text-rose-300 hover:text-white",
    mobileBottomBg: "bg-rose-950",
    mobileBottomBorder: "border-rose-900",
    mobileActiveIndicator: "bg-rose-400",
    mobileInactiveText: "text-rose-300 hover:text-white",
    mobileActiveText: "text-rose-400 font-semibold",
    badgeBg: "bg-rose-900 text-rose-200 border-rose-700",
    isDark: true,
  },
  "graphite-dark": {
    id: "graphite-dark",
    name: "Graphite Minimal (Hitam Arang)",
    category: "Gelap",
    description: "Hitam monokrom modern ala studio kreatif berkelas dengan kontras tajam.",
    swatchColors: ["#09090b", "#f4f4f5", "#27272a"],
    sidebarBg: "bg-zinc-950",
    sidebarBorder: "border-zinc-800",
    headerBg: "bg-zinc-950",
    headerBorder: "border-zinc-800",
    textLogo: "text-zinc-100",
    textSub: "text-zinc-400",
    navItemInactive: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
    navItemActive: "bg-zinc-100 text-zinc-950 shadow-sm font-semibold",
    navIconActive: "text-zinc-950",
    navIconInactive: "text-zinc-500 group-hover:text-zinc-300",
    toggleBtnHover: "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200",
    mobileBottomBg: "bg-zinc-950",
    mobileBottomBorder: "border-zinc-800",
    mobileActiveIndicator: "bg-zinc-200",
    mobileInactiveText: "text-zinc-400 hover:text-zinc-200",
    mobileActiveText: "text-zinc-100 font-semibold",
    badgeBg: "bg-zinc-900 text-zinc-300 border-zinc-800",
    isDark: true,
  },
  "soft-pastel": {
    id: "soft-pastel",
    name: "Soft Sky (Pastel Langit)",
    category: "Terang",
    description: "Gradasi sejuk biru langit & es pastel yang terang, tenang, dan bersih.",
    swatchColors: ["#f0f9ff", "#0284c7", "#bae6fd"],
    sidebarBg: "bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50/50",
    sidebarBorder: "border-sky-200/80",
    headerBg: "bg-sky-50",
    headerBorder: "border-sky-200/80",
    textLogo: "text-sky-950",
    textSub: "text-sky-600",
    navItemInactive: "text-slate-600 hover:bg-sky-100/70 hover:text-sky-950",
    navItemActive: "bg-sky-600 text-white shadow-sm shadow-sky-600/25",
    navIconActive: "text-white",
    navIconInactive: "text-sky-500 group-hover:text-sky-700",
    toggleBtnHover: "hover:bg-sky-100 text-sky-600 hover:text-sky-950",
    mobileBottomBg: "bg-sky-50",
    mobileBottomBorder: "border-sky-200/80",
    mobileActiveIndicator: "bg-sky-600",
    mobileInactiveText: "text-slate-500 hover:text-sky-900",
    mobileActiveText: "text-sky-700 font-semibold",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-300",
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
