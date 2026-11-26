import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { PageTransitionStyleId, ViewState } from "../types";
import { useNavbar } from "../context/NavbarContext";

const VIEW_ORDER: Record<ViewState, number> = {
  DASHBOARD: 0,
  BULK_INPUT_INVOICE: 1,
  INVOICE_HISTORY: 2,
  PAYMENT_HISTORY: 3,
  CUSTOMERS: 4,
  REPORTS: 5,
  SETTINGS: 6,
};

const EASE_EXECUTIVE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_EXIT: [number, number, number, number] = [0.4, 0, 1, 1];

function getVariants(style: PageTransitionStyleId): Variants {
  switch (style) {
    case "directional-glide":
      return {
        initial: (dir: number) => ({
          opacity: 0,
          x: dir >= 0 ? 34 : -34,
          scale: 0.992,
        }),
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: {
            duration: 0.28,
            ease: EASE_EXECUTIVE,
          },
        },
        exit: (dir: number) => ({
          opacity: 0,
          x: dir >= 0 ? -24 : 24,
          scale: 0.994,
          transition: {
            duration: 0.16,
            ease: EASE_EXIT,
          },
        }),
      };

    case "desk-tilt-3d":
      return {
        initial: (dir: number) => ({
          opacity: 0,
          y: dir >= 0 ? 18 : -14,
          rotateX: dir >= 0 ? 3.5 : -3.5,
          scale: 0.982,
        }),
        animate: {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          transition: {
            duration: 0.32,
            ease: EASE_EXECUTIVE,
          },
        },
        exit: (dir: number) => ({
          opacity: 0,
          y: dir >= 0 ? -12 : 12,
          rotateX: dir >= 0 ? -2 : 2,
          scale: 0.988,
          transition: {
            duration: 0.17,
            ease: EASE_EXIT,
          },
        }),
      };

    case "editorial-veil":
      return {
        initial: {
          opacity: 0,
          y: 14,
          clipPath: "inset(0% 0% 4% 0% round 12px)",
        },
        animate: {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          transition: {
            duration: 0.32,
            ease: EASE_EXECUTIVE,
          },
        },
        exit: {
          opacity: 0,
          y: -8,
          clipPath: "inset(2% 0% 0% 0% round 8px)",
          transition: {
            duration: 0.16,
            ease: EASE_EXIT,
          },
        },
      };

    case "executive-fade":
      return {
        initial: {
          opacity: 0,
          scale: 0.994,
        },
        animate: {
          opacity: 1,
          scale: 1,
          transition: {
            duration: 0.18,
            ease: EASE_EXECUTIVE,
          },
        },
        exit: {
          opacity: 0,
          scale: 0.996,
          transition: {
            duration: 0.12,
            ease: EASE_EXIT,
          },
        },
      };

    case "precision-3d":
    default:
      return {
        initial: (dir: number) => ({
          opacity: 0,
          y: dir >= 0 ? 16 : -12,
          x: dir >= 0 ? 10 : -10,
          scale: 0.986,
        }),
        animate: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: {
            duration: 0.28,
            ease: EASE_EXECUTIVE,
          },
        },
        exit: (dir: number) => ({
          opacity: 0,
          y: dir >= 0 ? -10 : 10,
          x: dir >= 0 ? -8 : 8,
          scale: 0.992,
          transition: {
            duration: 0.15,
            ease: EASE_EXIT,
          },
        }),
      };
  }
}

export function RouteProgressSweep({ view }: { view: ViewState }) {
  const { activeTheme } = useNavbar();
  const [sweepKey, setSweepKey] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSweepKey((k) => k + 1);
  }, [view]);

  if (sweepKey === 0) return null;

  const accent = activeTheme.swatchColors[1] || "#2563eb";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-[2.5px] overflow-hidden"
    >
      <motion.div
        key={sweepKey}
        initial={{ x: "-100%", opacity: 0.95 }}
        animate={{ x: "100%", opacity: [0.95, 1, 0] }}
        transition={{ duration: 0.45, ease: EASE_EXECUTIVE }}
        className="h-full w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 45%, #ffffff 75%, transparent 100%)`,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
    </div>
  );
}

export function PageTransitionStage({
  view,
  children,
}: {
  view: ViewState;
  children: React.ReactNode;
}) {
  const { settings } = useNavbar();
  const transitionStyle: PageTransitionStyleId =
    settings.pageTransition || "precision-3d";

  const prevViewRef = useRef<ViewState>(view);
  const directionRef = useRef<number>(1);
  const [isAnimating3D, setIsAnimating3D] = useState<boolean>(false);

  if (prevViewRef.current !== view) {
    const prevIdx = VIEW_ORDER[prevViewRef.current] ?? 0;
    const nextIdx = VIEW_ORDER[view] ?? 0;
    directionRef.current = nextIdx >= prevIdx ? 1 : -1;
    prevViewRef.current = view;
  }

  const direction = directionRef.current;
  const variants = getVariants(transitionStyle);

  return (
    <div
      className="relative w-full"
      style={
        transitionStyle === "desk-tilt-3d" && isAnimating3D
          ? { perspective: "1400px" }
          : undefined
      }
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={view}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          onAnimationStart={() => {
            if (transitionStyle === "desk-tilt-3d") setIsAnimating3D(true);
          }}
          onAnimationComplete={() => {
            setIsAnimating3D(false);
          }}
          style={{
            transformOrigin: "center top",
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
