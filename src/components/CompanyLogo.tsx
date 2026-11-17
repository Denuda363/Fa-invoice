import React, { useState, useEffect } from "react";
import { cn } from "../utils";

interface CompanyLogoProps {
  iconUrl?: string;
  companyName?: string;
  className?: string;
  alt?: string;
}

export function CompanyLogo({
  iconUrl,
  companyName = "AF Faktur",
  className = "w-8 h-8 rounded-lg",
  alt = "Logo Perusahaan",
}: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false);
  const src = iconUrl && iconUrl.trim() ? iconUrl : "/icon.jpg";

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = companyName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "AF";

  if (imgError) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-extrabold flex items-center justify-center shrink-0 logo-frame-3d border border-white/30 select-none text-xs",
          className
        )}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={cn(
        "object-cover shrink-0 logo-frame-3d border border-white/25 bg-white",
        className
      )}
    />
  );
}
