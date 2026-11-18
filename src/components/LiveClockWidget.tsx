import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import { ClockStyleId } from "../types";
import { useClock } from "../context/ClockContext";
import { useNavbar } from "../context/NavbarContext";
import { cn } from "../utils";

interface LiveClockWidgetProps {
  overrideStyle?: ClockStyleId;
  compact?: boolean;
  className?: string;
}

function capitalizeFirst(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function FlipDigitTile({
  value,
  compact,
}: {
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center font-mono tabular-nums font-extrabold text-white rounded-lg overflow-hidden select-none",
        "bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950",
        "border border-slate-700/90 border-b-[3px] border-b-black",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_3px_8px_rgba(15,23,42,0.35)]",
        compact ? "w-7 h-7 text-xs" : "w-10 h-10 sm:w-12 sm:h-11 text-lg sm:text-xl"
      )}
    >
      {/* Top glossy split half */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.06] border-b border-black/70" />
      {/* Side mechanical hinge notches */}
      <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-500/70" />
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-500/70" />
      <span className="relative z-10 tracking-tight">{value}</span>
    </div>
  );
}

function AnalogDial({
  hours,
  minutes,
  seconds,
  compact,
  darkTheme,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  compact?: boolean;
  darkTheme?: boolean;
}) {
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const size = compact ? 42 : 52;

  return (
    <div
      className={cn(
        "relative rounded-full shrink-0 flex items-center justify-center border-2",
        darkTheme
          ? "bg-gradient-to-b from-slate-800 to-slate-950 border-slate-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_3px_0_#020617]"
          : "bg-gradient-to-b from-white to-slate-100 border-slate-300 shadow-[inset_0_1px_2px_#ffffff,0_3px_0_#cbd5e1,0_4px_10px_rgba(15,23,42,0.12)]"
      )}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Hour tick marks */}
        {Array.from({ length: 12 }).map((_, idx) => {
          const angle = idx * 30;
          const isQuarter = idx % 3 === 0;
          return (
            <line
              key={idx}
              x1="50"
              y1={isQuarter ? "9" : "11"}
              x2="50"
              y2={isQuarter ? "17" : "15"}
              stroke={darkTheme ? (isQuarter ? "#e2e8f0" : "#64748b") : isQuarter ? "#0f172a" : "#94a3b8"}
              strokeWidth={isQuarter ? "3.2" : "2"}
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="50"
          y1="52"
          x2="50"
          y2="27"
          stroke={darkTheme ? "#f8fafc" : "#0f172a"}
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 50 50)`}
        />

        {/* Minute hand */}
        <line
          x1="50"
          y1="54"
          x2="50"
          y2="18"
          stroke={darkTheme ? "#38bdf8" : "#2563eb"}
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
        />

        {/* Second hand */}
        <line
          x1="50"
          y1="60"
          x2="50"
          y2="14"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinecap="round"
          transform={`rotate(${secondAngle} 50 50)`}
        />

        {/* Center cap */}
        <circle cx="50" cy="50" r="4.5" fill="#ef4444" />
        <circle cx="50" cy="50" r="1.8" fill="#ffffff" />
      </svg>
    </div>
  );
}

export function LiveClockWidget({
  overrideStyle,
  compact = false,
  className,
}: LiveClockWidgetProps) {
  const { clockSettings } = useClock();
  const { activeTheme } = useNavbar();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const styleId = overrideStyle || clockSettings.style;
  const { format24h, showSeconds } = clockSettings;

  const dayName = capitalizeFirst(format(now, "EEEE", { locale: idLocale }));
  const dayShort = capitalizeFirst(format(now, "EEE", { locale: idLocale }));
  const dateNumber = format(now, "dd");
  const monthShort = format(now, "MMM", { locale: idLocale }).toUpperCase();
  const fullDate = format(now, "dd MMMM yyyy", { locale: idLocale });
  const shortDate = format(now, "dd MMM yyyy", { locale: idLocale });

  const rawHours = now.getHours();
  const displayHours = format24h
    ? String(rawHours).padStart(2, "0")
    : String(rawHours % 12 || 12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = rawHours >= 12 ? "PM" : "AM";

  const timeString = showSeconds
    ? `${displayHours}:${minutes}:${seconds}`
    : `${displayHours}:${minutes}`;

  // 1. Classic 3D Tactile Capsule
  if (styleId === "classic-3d") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 border-b-[4px] border-b-slate-300 bg-gradient-to-b from-white to-slate-50 shadow-[inset_0_1px_0_#ffffff,0_8px_18px_-6px_rgba(15,23,42,0.08)] flex items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2.5" : "px-4 py-3 sm:px-5",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_3px_0_#1e40af]",
              compact ? "w-8 h-8" : "w-10 h-10"
            )}
          >
            <Calendar size={compact ? 15 : 18} />
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                "font-bold text-slate-900 leading-tight",
                compact ? "text-xs" : "text-sm sm:text-base"
              )}
            >
              {dayName}
            </div>
            <div
              className={cn(
                "text-slate-500 font-medium leading-tight mt-0.5",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {compact ? shortDate : fullDate}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 shrink-0 pl-3 border-l border-slate-200">
          <span
            className={cn(
              "font-mono tabular-nums font-extrabold tracking-tight text-slate-900",
              compact ? "text-base" : "text-xl sm:text-2xl"
            )}
          >
            {timeString}
          </span>
          {!format24h && (
            <span className="text-[11px] font-bold text-blue-600">{ampm}</span>
          )}
        </div>
      </div>
    );
  }

  // 2. Mechanical Flip Clock
  if (styleId === "flip-clock") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-700 border-b-[4px] border-b-slate-950 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_20px_-8px_rgba(15,23,42,0.45)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2.5" : "px-4 py-3 sm:px-5",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex flex-col">
            <span
              className={cn(
                "font-bold text-amber-300 tracking-wide",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {dayName}
            </span>
            <span
              className={cn(
                "text-slate-300 font-medium",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {compact ? shortDate : fullDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <FlipDigitTile value={displayHours} compact={compact} />
          <span className="font-mono font-bold text-slate-400 text-base">:</span>
          <FlipDigitTile value={minutes} compact={compact} />
          {showSeconds && (
            <>
              <span className="font-mono font-bold text-slate-400 text-base">:</span>
              <FlipDigitTile value={seconds} compact={compact} />
            </>
          )}
          {!format24h && (
            <span className="ml-1 text-[11px] font-bold text-amber-300">{ampm}</span>
          )}
        </div>
      </div>
    );
  }

  // 3. Analog Dial + Digital Hybrid
  if (styleId === "analog-hybrid") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-sky-200 border-b-[4px] border-b-sky-300 bg-gradient-to-r from-white via-sky-50/50 to-white shadow-[inset_0_1px_0_#ffffff,0_8px_18px_-6px_rgba(2,132,199,0.15)] flex items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2" : "px-4 py-2.5 sm:px-5",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <AnalogDial
            hours={rawHours}
            minutes={now.getMinutes()}
            seconds={now.getSeconds()}
            compact={compact}
            darkTheme={false}
          />
          <div className="min-w-0">
            <div
              className={cn(
                "font-extrabold text-slate-900 leading-tight",
                compact ? "text-xs" : "text-sm sm:text-base"
              )}
            >
              {dayName}
            </div>
            <div
              className={cn(
                "text-sky-700 font-medium leading-tight mt-0.5",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {compact ? shortDate : fullDate}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={cn(
              "font-mono tabular-nums font-extrabold text-slate-900 tracking-tight",
              compact ? "text-base" : "text-xl sm:text-2xl"
            )}
          >
            {timeString}
            {!format24h && (
              <span className="ml-1 text-xs font-bold text-sky-600">{ampm}</span>
            )}
          </div>
          {!compact && (
            <div className="text-[11px] text-slate-500 font-medium">
              Jam Analog & Digital Realtime
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Hardware Retro LCD Matrix
  if (styleId === "retro-lcd") {
    return (
      <div
        className={cn(
          "rounded-2xl border-2 border-zinc-700 border-b-[4px] border-b-zinc-950 bg-gradient-to-b from-zinc-800 to-zinc-900 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_18px_-6px_rgba(9,9,11,0.4)] transition-all",
          className
        )}
      >
        <div
          className={cn(
            "rounded-xl bg-[#c9d6b3] border border-[#8e9b78] shadow-[inset_0_2px_6px_rgba(28,36,18,0.22)] flex items-center justify-between gap-3 text-[#1e2912]",
            compact ? "px-2.5 py-2" : "px-3.5 py-2.5 sm:px-4"
          )}
        >
          <div className="min-w-0">
            <div
              className={cn(
                "font-mono font-bold tracking-wider uppercase leading-tight",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {dayName}
            </div>
            <div
              className={cn(
                "font-mono font-semibold opacity-85 mt-0.5",
                compact ? "text-[10px]" : "text-xs"
              )}
            >
              {compact ? shortDate : fullDate}
            </div>
          </div>

          <div className="flex items-baseline gap-1 shrink-0">
            <span
              className={cn(
                "font-mono tabular-nums font-extrabold tracking-widest",
                compact ? "text-base" : "text-xl sm:text-2xl"
              )}
            >
              {timeString}
            </span>
            {!format24h && (
              <span className="font-mono text-[10px] font-bold">{ampm}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. Desk Calendar 3D
  if (styleId === "calendar-desk") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-slate-200 border-b-[4px] border-b-slate-300 bg-white shadow-[inset_0_1px_0_#ffffff,0_8px_18px_-6px_rgba(15,23,42,0.09)] flex items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2" : "px-4 py-2.5 sm:px-5",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Physical Tear-off Calendar Block */}
          <div
            className={cn(
              "rounded-xl overflow-hidden border border-slate-300 border-b-[3px] border-b-slate-400 bg-white shrink-0 text-center shadow-xs",
              compact ? "w-10" : "w-12"
            )}
          >
            <div className="bg-gradient-to-b from-red-500 to-red-600 text-white text-[9px] font-extrabold tracking-wider py-0.5">
              {monthShort}
            </div>
            <div
              className={cn(
                "font-mono tabular-nums font-black text-slate-900 leading-none py-1",
                compact ? "text-sm" : "text-lg"
              )}
            >
              {dateNumber}
            </div>
          </div>

          <div className="min-w-0">
            <div
              className={cn(
                "font-extrabold text-slate-900 leading-tight",
                compact ? "text-xs" : "text-sm sm:text-base"
              )}
            >
              {dayName}
            </div>
            <div
              className={cn(
                "text-slate-500 font-medium leading-tight mt-0.5",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {compact ? shortDate : fullDate}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Clock size={compact ? 14 : 16} className="text-red-500 hidden sm:block" />
          <div
            className={cn(
              "font-mono tabular-nums font-extrabold text-slate-900",
              compact ? "text-base" : "text-xl sm:text-2xl"
            )}
          >
            {timeString}
            {!format24h && (
              <span className="ml-1 text-xs font-bold text-red-600">{ampm}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Glass Prism 3D
  if (styleId === "glass-prism") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-indigo-200/90 border-b-[4px] border-b-indigo-300/90 bg-gradient-to-br from-white/90 via-indigo-50/75 to-sky-100/75 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-8px_rgba(79,70,229,0.22)] flex items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2.5" : "px-4 py-3 sm:px-5",
          className
        )}
      >
        <div className="pointer-events-none absolute -top-10 -left-10 w-36 h-36 bg-white/50 rotate-12 blur-md" />
        <div className="relative z-10 min-w-0">
          <div
            className={cn(
              "font-extrabold text-indigo-950 leading-tight",
              compact ? "text-xs" : "text-sm sm:text-base"
            )}
          >
            {dayName}
          </div>
          <div
            className={cn(
              "text-indigo-700/80 font-medium leading-tight mt-0.5",
              compact ? "text-[11px]" : "text-xs sm:text-sm"
            )}
          >
            {compact ? shortDate : fullDate}
          </div>
        </div>

        <div className="relative z-10 flex items-baseline gap-1.5 shrink-0">
          <span
            className={cn(
              "font-mono tabular-nums font-black text-indigo-950 tracking-tight",
              compact ? "text-base" : "text-xl sm:text-2xl"
            )}
          >
            {timeString}
          </span>
          {!format24h && (
            <span className="text-[11px] font-bold text-indigo-600">{ampm}</span>
          )}
        </div>
      </div>
    );
  }

  // 7. Orbit Seconds Ring
  if (styleId === "orbit-ring") {
    const secProgress = (now.getSeconds() / 60) * 100;
    const radius = 17;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (secProgress / 100) * circumference;

    return (
      <div
        className={cn(
          "rounded-2xl border border-emerald-200 border-b-[4px] border-b-emerald-300 bg-gradient-to-b from-white to-emerald-50/40 shadow-[inset_0_1px_0_#ffffff,0_8px_18px_-6px_rgba(16,185,129,0.16)] flex items-center justify-between gap-3 transition-all",
          compact ? "px-3 py-2" : "px-4 py-2.5 sm:px-5",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Live 60s Orbit Progress Ring */}
          <div
            className={cn(
              "relative flex items-center justify-center shrink-0",
              compact ? "w-9 h-9" : "w-11 h-11"
            )}
          >
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="#d1fae5"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="#059669"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>
            <span className="absolute font-mono tabular-nums text-[10px] font-extrabold text-emerald-800">
              {seconds}
            </span>
          </div>

          <div className="min-w-0">
            <div
              className={cn(
                "font-extrabold text-slate-900 leading-tight",
                compact ? "text-xs" : "text-sm sm:text-base"
              )}
            >
              {dayName}
            </div>
            <div
              className={cn(
                "text-emerald-700 font-medium leading-tight mt-0.5",
                compact ? "text-[11px]" : "text-xs sm:text-sm"
              )}
            >
              {compact ? shortDate : fullDate}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1 shrink-0">
          <span
            className={cn(
              "font-mono tabular-nums font-black text-slate-900",
              compact ? "text-base" : "text-xl sm:text-2xl"
            )}
          >
            {displayHours}:{minutes}
          </span>
          {showSeconds && (
            <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-emerald-600">
              :{seconds}
            </span>
          )}
          {!format24h && (
            <span className="ml-0.5 text-[11px] font-bold text-emerald-700">{ampm}</span>
          )}
        </div>
      </div>
    );
  }

  // 8. Editorial Chronograph Serif (Fallback / Default 8th style)
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200/90 border-b-[4px] border-b-amber-300/90 bg-gradient-to-b from-[#fffdf7] to-[#faf4e4] shadow-[inset_0_1px_0_#ffffff,0_8px_18px_-6px_rgba(180,83,9,0.14)] flex items-center justify-between gap-3 transition-all",
        compact ? "px-3 py-2.5" : "px-4 py-3 sm:px-5",
        className
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "font-serif font-bold text-stone-900 tracking-tight leading-tight",
            compact ? "text-xs" : "text-base sm:text-lg"
          )}
        >
          {compact ? dayShort : dayName}, {compact ? shortDate : fullDate}
        </div>
        {!compact && (
          <div className="text-[11px] text-amber-800/80 font-medium mt-0.5">
            Waktu Operasional · {activeTheme.name}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 shrink-0 pl-3 border-l border-amber-200">
        <span
          className={cn(
            "font-mono tabular-nums font-bold text-stone-900 tracking-tight",
            compact ? "text-base" : "text-xl sm:text-2xl"
          )}
        >
          {timeString}
        </span>
        {!format24h && (
          <span className="text-[11px] font-serif font-bold text-amber-800">{ampm}</span>
        )}
      </div>
    </div>
  );
}
