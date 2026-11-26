import jsPDF from "jspdf";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CompanyProfile } from "../types";

export interface PrintableGuideStep {
  title: string;
  description: string;
  tip?: string;
}

export interface PrintableGuideFaq {
  q: string;
  a: string;
}

export interface PrintableGuideSection {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: PrintableGuideStep[];
  faq?: PrintableGuideFaq[];
}

function sanitizePdfText(text: string): string {
  return text
    .replace(/→/g, "->")
    .replace(/•/g, "-")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/©/g, "(c)")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=");
}

async function loadRasterLogoDataUrl(src: string): Promise<string | null> {
  if (typeof window === "undefined" || !src) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timer = window.setTimeout(() => resolve(null), 2500);

    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        // Clean white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        // Preserve aspect ratio cleanly (contain with subtle padding)
        const pad = 16;
        const maxW = size - pad * 2;
        const maxH = size - pad * 2;
        const natW = img.naturalWidth || size;
        const natH = img.naturalHeight || size;
        const ratio = Math.min(maxW / natW, maxH / natH);
        const drawW = natW * ratio;
        const drawH = natH * ratio;
        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };

    img.src = src;
  });
}

export async function exportGuideBookA4Pdf(
  sections: PrintableGuideSection[],
  companyProfile?: CompanyProfile
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174mm
  const topY = 22;
  const bottomLimit = pageHeight - 20;

  const rawCompanyName = companyProfile?.name || "AF Faktur";
  const companyName = sanitizePdfText(rawCompanyName);
  const companyTagline = sanitizePdfText(
    companyProfile?.tagline || "Manajemen Faktur & Piutang"
  );
  const printDateStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
  const currentYear = new Date().getFullYear();

  const logoSrc = companyProfile?.iconUrl?.trim() || "/icon.jpg";
  const processedLogoPng = await loadRasterLogoDataUrl(logoSrc);

  // ============================================================================
  // HALAMAN 1: SAMPUL BUKU RESMI
  // ============================================================================
  // Left decorative spine strip
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 11, pageHeight, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(11, 0, 2, pageHeight, "F");

  // Top Header Card (Logo + Company Identity)
  const headerStartX = 24;
  const headerTopY = 18;
  const headerWidth = pageWidth - headerStartX - 18;

  const contactParts = [
    companyProfile?.phone,
    companyProfile?.email,
    companyProfile?.address,
  ]
    .filter(Boolean)
    .map((p) => sanitizePdfText(String(p)));
  const contactText = contactParts.join("  |  ");

  const textColX = headerStartX + 27;
  const textColWidth = headerWidth - 31;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const nameWrapped = doc.splitTextToSize(companyName, textColWidth);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const taglineWrapped = doc.splitTextToSize(companyTagline, textColWidth);

  doc.setFontSize(8.5);
  const contactWrapped = contactText
    ? doc.splitTextToSize(contactText, textColWidth)
    : [];

  const textBlockHeight =
    nameWrapped.length * 6 +
    taglineWrapped.length * 4.5 +
    (contactWrapped.length > 0 ? contactWrapped.length * 4 + 2 : 0);

  const headerCardHeight = Math.max(30, textBlockHeight + 12);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(headerStartX, headerTopY, headerWidth, headerCardHeight, 3, 3, "FD");

  // Crisp Square Logo Frame centered vertically in header card
  const logoBoxSize = 21;
  const logoBoxX = headerStartX + 4;
  const logoBoxY = headerTopY + (headerCardHeight - logoBoxSize) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 2.5, 2.5, "FD");

  if (processedLogoPng) {
    try {
      doc.addImage(
        processedLogoPng,
        "PNG",
        logoBoxX + 1.2,
        logoBoxY + 1.2,
        logoBoxSize - 2.4,
        logoBoxSize - 2.4
      );
    } catch {
      // Fall back to initials below
      drawInitialsEmblem(doc, rawCompanyName, logoBoxX, logoBoxY, logoBoxSize);
    }
  } else {
    drawInitialsEmblem(doc, rawCompanyName, logoBoxX, logoBoxY, logoBoxSize);
  }

  // Company Text Block vertically centered alongside logo
  let headerTextY =
    headerTopY + (headerCardHeight - textBlockHeight) / 2 + 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(nameWrapped, textColX, headerTextY);
  headerTextY += nameWrapped.length * 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.8);
  doc.setTextColor(37, 99, 235);
  doc.text(taglineWrapped, textColX, headerTextY);
  headerTextY += taglineWrapped.length * 4.5 + 1.5;

  if (contactWrapped.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    doc.setTextColor(100, 116, 139);
    doc.text(contactWrapped, textColX, headerTextY);
  }

  // Hero Cover Typography
  const heroStartY = Math.max(82, headerTopY + headerCardHeight + 24);

  doc.setFillColor(219, 234, 254);
  doc.roundedRect(24, heroStartY, 64, 7.5, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(29, 78, 216);
  doc.text("DOKUMENTASI RESMI PERUSAHAAN", 28, heroStartY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(15, 23, 42);
  doc.text("BUKU PANDUAN", 24, heroStartY + 23);
  doc.text("PENGGUNAAN APLIKASI", 24, heroStartY + 36);

  doc.setFillColor(37, 99, 235);
  doc.rect(24, heroStartY + 43, 48, 2.2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const subtitleLines = doc.splitTextToSize(
    "Panduan operasional lengkap pengelolaan faktur penjualan, pencatatan pembayaran & cicilan konsumen, pemantauan laporan jatuh tempo, notifikasi transaksi, serta pengamanan cadangan data.",
    pageWidth - 46
  );
  doc.text(subtitleLines, 24, heroStartY + 55);

  // Clean Book Metadata Box (without Format Kertas Cetak text)
  const metaRows: [string, string][] = [
    ["Nama Aplikasi", `${companyName} (Versi 2.5 Pro)`],
    ["Cakupan Materi", `${sections.length} Bab Panduan Lengkap & FAQ`],
    ["Tanggal Cetak", printDateStr],
    ["Pengembang (Developer)", "Denuda"],
  ];

  const metaBoxY = 186;
  const metaBoxHeight = 20 + metaRows.length * 8 + 4;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(24, metaBoxY, pageWidth - 42, metaBoxHeight, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text("INFORMASI DOKUMEN", 31, metaBoxY + 9.5);

  doc.setDrawColor(226, 232, 240);
  doc.line(31, metaBoxY + 13, pageWidth - 25, metaBoxY + 13);

  let metaY = metaBoxY + 21.5;
  metaRows.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 31, metaY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${val}`, 84, metaY);
    metaY += 8;
  });

  // Cover Bottom Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(24, pageHeight - 28, pageWidth - 18, pageHeight - 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Hak Cipta (c) ${currentYear} Denuda`, 24, pageHeight - 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Referensi operasional resmi sistem manajemen faktur & piutang.",
    24,
    pageHeight - 14.5
  );

  // ============================================================================
  // HALAMAN 2: HALAMAN KATA PENGANTAR & DAFTAR ISI
  // ============================================================================
  doc.addPage();
  const tocPageNumber = doc.getNumberOfPages();

  // ============================================================================
  // HALAMAN 3+: KONTEN BAB PANDUAN
  // ============================================================================
  doc.addPage();
  let y = topY;
  const chapterToc: { title: string; summary: string; page: number }[] = [];

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = topY;
    }
  };

  sections.forEach((sec, secIdx) => {
    if (secIdx > 0 && y > topY + 25) {
      doc.addPage();
      y = topY;
    } else {
      ensureSpace(40);
    }

    const chapterPage = doc.getNumberOfPages();
    const cleanTitle = sanitizePdfText(sec.title);
    const cleanSummary = sanitizePdfText(sec.summary);
    chapterToc.push({
      title: cleanTitle,
      summary: cleanSummary,
      page: chapterPage,
    });

    // Chapter Top Banner Box
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    const titleWrapped = doc.splitTextToSize(cleanTitle, contentWidth - 10);
    const summaryWrapped = doc.splitTextToSize(cleanSummary, contentWidth - 10);
    const bannerHeight = 8 + titleWrapped.length * 6 + summaryWrapped.length * 4.5 + 4;

    doc.roundedRect(marginX, y, contentWidth, bannerHeight, 2.5, 2.5, "FD");
    doc.setFillColor(37, 99, 235);
    doc.rect(marginX, y, 3, bannerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(30, 58, 138);
    doc.text(titleWrapped, marginX + 6.5, y + 7.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(71, 85, 105);
    doc.text(summaryWrapped, marginX + 6.5, y + 7.5 + titleWrapped.length * 6 + 1);

    y += bannerHeight + 7;

    // Steps inside Chapter
    sec.steps.forEach((step, stepIdx) => {
      const sTitle = sanitizePdfText(step.title);
      const sDesc = sanitizePdfText(step.description);
      const sTip = step.tip ? sanitizePdfText(step.tip) : "";

      const stepTitleLines = doc.splitTextToSize(sTitle, contentWidth - 12);
      const stepDescLines = doc.splitTextToSize(sDesc, contentWidth - 12);
      const tipLines = sTip
        ? doc.splitTextToSize(`Tips: ${sTip}`, contentWidth - 20)
        : [];

      const estimatedBlockHeight =
        stepTitleLines.length * 5.2 +
        stepDescLines.length * 4.4 +
        (tipLines.length > 0 ? tipLines.length * 4.2 + 7 : 0) +
        8;

      if (estimatedBlockHeight < 95) {
        ensureSpace(estimatedBlockHeight);
      } else {
        ensureSpace(26);
      }

      // Step number circle badge
      doc.setFillColor(37, 99, 235);
      doc.circle(marginX + 3.5, y + 2.5, 3.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(stepIdx + 1), marginX + 3.5, y + 3.5, { align: "center" });

      // Step title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(stepTitleLines, marginX + 9.5, y + 3.8);
      y += stepTitleLines.length * 5.2 + 2;

      // Step description lines
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.4);
      doc.setTextColor(51, 65, 85);
      stepDescLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, marginX + 9.5, y);
        y += 4.4;
      });

      // Tip Callout Box
      if (tipLines.length > 0) {
        y += 2;
        const tipHeight = tipLines.length * 4.2 + 5;
        ensureSpace(tipHeight + 3);
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(marginX + 9.5, y, contentWidth - 9.5, tipHeight, 1.5, 1.5, "FD");
        doc.setFillColor(217, 119, 6);
        doc.rect(marginX + 9.5, y, 2, tipHeight, "F");

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.8);
        doc.setTextColor(146, 64, 14);
        doc.text(tipLines, marginX + 14, y + 4.8);
        y += tipHeight + 2;
      }

      y += 5;
    });

    // FAQ Section if present
    if (sec.faq && sec.faq.length > 0) {
      ensureSpace(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105);
      doc.text("PERTANYAAN UMUM (FAQ)", marginX, y + 2);
      y += 5.5;

      sec.faq.forEach((f) => {
        const qLines = doc.splitTextToSize(`Q: ${sanitizePdfText(f.q)}`, contentWidth - 8);
        const aLines = doc.splitTextToSize(`A: ${sanitizePdfText(f.a)}`, contentWidth - 8);
        const faqH = qLines.length * 4.3 + aLines.length * 4.3 + 6;
        ensureSpace(faqH + 3);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, y, contentWidth, faqH, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(qLines, marginX + 4, y + 4.8);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(aLines, marginX + 4, y + 4.8 + qLines.length * 4.3 + 0.5);
        y += faqH + 3;
      });
    }
  });

  // ============================================================================
  // HALAMAN PENUTUP
  // ============================================================================
  doc.addPage();
  y = topY + 6;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, contentWidth, 56, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("CATATAN PENUTUP & HAK CIPTA", marginX + 8, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  const closingText = doc.splitTextToSize(
    `Buku panduan ini diterbitkan sebagai referensi operasional resmi untuk ${companyName}. Disarankan melakukan backup data (JSON & Excel) secara berkala melalui menu Pengaturan agar seluruh arsip faktur, pembayaran, dan daftar konsumen tetap terjaga dengan aman.`,
    contentWidth - 16
  );
  doc.text(closingText, marginX + 8, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(147, 197, 253);
  doc.text(
    `Dikembangkan oleh Denuda · Hak Cipta (c) ${currentYear} Denuda`,
    marginX + 8,
    y + 46
  );

  // ============================================================================
  // ISI HALAMAN 2: KATA PENGANTAR & DAFTAR ISI OTOMATIS
  // ============================================================================
  doc.setPage(tocPageNumber);
  let tocY = topY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("KATA PENGANTAR", marginX, tocY);
  doc.setFillColor(37, 99, 235);
  doc.rect(marginX, tocY + 2.5, 24, 1.2, "F");
  tocY += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const introLines = doc.splitTextToSize(
    `Selamat datang di Buku Panduan Penggunaan ${companyName}. Buku panduan ini disusun untuk memandu admin, staf keuangan, maupun pemilik usaha dalam mengoperasikan seluruh fitur pencatatan faktur, pelunasan cicilan konsumen, pemantauan laporan jatuh tempo, notifikasi transaksi, serta pengamanan cadangan data.`,
    contentWidth
  );
  doc.text(introLines, marginX, tocY);
  tocY += introLines.length * 4.6 + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("DAFTAR ISI", marginX, tocY);
  doc.setFillColor(37, 99, 235);
  doc.rect(marginX, tocY + 2.5, 24, 1.2, "F");
  tocY += 11;

  chapterToc.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, marginX, tocY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(`Hal. ${item.page}`, pageWidth - marginX, tocY, { align: "right" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 1.5], 0);
    doc.line(marginX, tocY + 2, pageWidth - marginX, tocY + 2);
    doc.setLineDashPattern([], 0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const sumLines = doc.splitTextToSize(item.summary, contentWidth - 18);
    doc.text(sumLines, marginX + 2, tocY + 6.2);

    tocY += 7 + sumLines.length * 4 + 3.5;
  });

  // ============================================================================
  // RUNNING HEADER & FOOTER UNTUK SELURUH HALAMAN ISI (HALAMAN 2 s.d. AKHIR)
  // ============================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);

    // Top running header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`BUKU PANDUAN PENGGUNAAN - ${companyName.toUpperCase()}`, marginX, 12);
    doc.setFont("helvetica", "normal");
    doc.text("Versi 2.5 Pro", pageWidth - marginX, 12, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, 14.5, pageWidth - marginX, 14.5);

    // Bottom running footer
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`(c) ${currentYear} Denuda · Dicetak ${printDateStr}`, marginX, pageHeight - 9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 9, {
      align: "right",
    });
  }

  const safeSlug = (companyProfile?.name || "AF_Faktur")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  doc.save(`Buku_Panduan_${safeSlug || "AF_Faktur"}.pdf`);
}

function drawInitialsEmblem(
  doc: jsPDF,
  companyName: string,
  x: number,
  y: number,
  size: number
) {
  const initials =
    companyName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "AF";

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(x + 1, y + 1, size - 2, size - 2, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(initials, x + size / 2, y + size / 2 + 1.8, { align: "center" });
}
