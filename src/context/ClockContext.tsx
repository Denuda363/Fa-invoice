import React, { createContext, useContext, useState, useEffect } from "react";
import { ClockSettings, ClockStyleId } from "../types";

export interface ClockStyleMeta {
  id: ClockStyleId;
  name: string;
  category: "3D & Mekanik" | "Modern & Kaca" | "Klasik & Instrumen";
  description: string;
  accentColor: string;
}

export const CLOCK_STYLES: ClockStyleMeta[] = [
  {
    id: "classic-3d",
    name: "Kapsul Taktil 3D",
    category: "3D & Mekanik",
    description: "Panel 3D timbul bersih dengan angka jam presisi dan pemisah kalender elegan.",
    accentColor: "#2563eb",
  },
  {
    id: "flip-clock",
    name: "Jam Flip Mekanik",
    category: "3D & Mekanik",
    description: "Kartu angka belah mekanik ala papan jadwal stasiun retro dengan engsel tengah.",
    accentColor: "#1e293b",
  },
  {
    id: "analog-hybrid",
    name: "Analog Dial & Digital",
    category: "Klasik & Instrumen",
    description: "Jarum jam analog berdetak langsung berpadu dengan pembacaan digital dan hari.",
    accentColor: "#0284c7",
  },
  {
    id: "retro-lcd",
    name: "Instrumen LCD Matrix",
    category: "Klasik & Instrumen",
    description: "Layar instrumen LCD zaitun klasik dalam bingkai bezel metalik gelap berdimensi.",
    accentColor: "#4d7c0f",
  },
  {
    id: "calendar-desk",
    name: "Kalender Meja 3D",
    category: "3D & Mekanik",
    description: "Blok kalender meja fisik dengan kepala merah khas tanggal harian di sisi kiri.",
    accentColor: "#dc2626",
  },
  {
    id: "glass-prism",
    name: "Kaca Prisma 3D",
    category: "Modern & Kaca",
    description: "Lapisan kaca buram berkilau lembut dengan pantulan cahaya diagonal dan tipografi tajam.",
    accentColor: "#6366f1",
  },
  {
    id: "orbit-ring",
    name: "Cincin Detik Orbit",
    category: "Modern & Kaca",
    description: "Lingkar progres 60 detik yang mengisi penuh setiap menit di samping penunjuk waktu.",
    accentColor: "#059669",
  },
  {
    id: "editorial-serif",
    name: "Kronograf Klasik",
    category: "Klasik & Instrumen",
    description: "Nuansa kertas gading & tinta arloji klasik dengan tipografi serif berkelas.",
    accentColor: "#b45309",
  },
];

const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  style: "classic-3d",
  format24h: true,
  showSeconds: true,
  showClock: true,
};

const CLOCK_STORAGE_KEY = "af_faktur_clock_settings_v1";

interface ClockContextType {
  clockSettings: ClockSettings;
  activeClockMeta: ClockStyleMeta;
  setClockStyle: (style: ClockStyleId) => void;
  setFormat24h: (format24h: boolean) => void;
  setShowSeconds: (showSeconds: boolean) => void;
  setShowClock: (showClock: boolean) => void;
  resetClockSettings: () => void;
}

const ClockContext = createContext<ClockContextType | undefined>(undefined);

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const [clockSettings, setClockSettings] = useState<ClockSettings>(() => {
    try {
      const saved = localStorage.getItem(CLOCK_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CLOCK_SETTINGS,
          ...parsed,
        };
      }
    } catch (e) {
      console.error("Failed to read clock settings from localStorage", e);
    }
    return DEFAULT_CLOCK_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CLOCK_STORAGE_KEY, JSON.stringify(clockSettings));
    } catch (e) {
      console.error("Failed to save clock settings to localStorage", e);
    }
  }, [clockSettings]);

  const setClockStyle = (style: ClockStyleId) => {
    setClockSettings((prev) => ({ ...prev, style }));
  };

  const setFormat24h = (format24h: boolean) => {
    setClockSettings((prev) => ({ ...prev, format24h }));
  };

  const setShowSeconds = (showSeconds: boolean) => {
    setClockSettings((prev) => ({ ...prev, showSeconds }));
  };

  const setShowClock = (showClock: boolean) => {
    setClockSettings((prev) => ({ ...prev, showClock }));
  };

  const resetClockSettings = () => {
    setClockSettings(DEFAULT_CLOCK_SETTINGS);
  };

  const activeClockMeta =
    CLOCK_STYLES.find((c) => c.id === clockSettings.style) || CLOCK_STYLES[0];

  return (
    <ClockContext.Provider
      value={{
        clockSettings,
        activeClockMeta,
        setClockStyle,
        setFormat24h,
        setShowSeconds,
        setShowClock,
        resetClockSettings,
      }}
    >
      {children}
    </ClockContext.Provider>
  );
}

export function useClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error("useClock must be used within a ClockProvider");
  }
  return context;
}
