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

interface PdfTocEntry {
  key: string;
  kind: "special" | "chapter" | "sub";
  label: string;
  page: number;
}

function sanitizePdfText(text: string): string {
  return text
    .replace(/→/g, "menjadi")
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

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

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

function getLineStepMm(doc: jsPDF): number {
  return (doc.getFontSize() * doc.getLineHeightFactor()) / doc.internal.scaleFactor;
}

function renderTocPages(
  doc: jsPDF,
  entries: PdfTocEntry[],
  startPdfPage: number,
  options: {
    dryRun: boolean;
    pageWidth: number;
    marginX: number;
    contentWidth: number;
    topY: number;
    bottomLimit: number;
  }
): number {
  const { dryRun, pageWidth, marginX, contentWidth, topY, bottomLimit } = options;
  const pageCenterX = pageWidth / 2;
  const rightX = pageWidth - marginX;

  let currentPageOffset = 0;
  let y = topY + 3;

  const drawTocHeading = () => {
    if (!dryRun) {
      doc.setPage(startPdfPage + currentPageOffset);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.setTextColor(37, 99, 235);
      doc.text("STRUKTUR BUKU PANDUAN", pageCenterX, y, { align: "center" });
    }
    y += 7;

    if (!dryRun) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(19);
      doc.setTextColor(15, 23, 42);
      doc.text("DAFTAR ISI", pageCenterX, y, { align: "center" });
    }
    y += 4.2;

    if (!dryRun) {
      doc.setFillColor(37, 99, 235);
      doc.rect(pageCenterX - 22, y, 32, 1.3, "F");
      doc.setFillColor(217, 119, 6);
      doc.rect(pageCenterX + 12, y, 10, 1.3, "F");
    }
    y += 12;
  };

  drawTocHeading();

  const nextTocPage = () => {
    currentPageOffset += 1;
    y = topY + 3;
    drawTocHeading();
  };

  entries.forEach((entry, idx) => {
    const pageStr = `Hal. ${dryRun ? 99 : entry.page}`;

    if (entry.kind === "sub") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.7);
      doc.setLineHeightFactor(1.3);
      const subStep = getLineStepMm(doc);
      const subX = marginX + 6.5;
      const maxLabelW = contentWidth - 28;
      const wrappedLabel = doc.splitTextToSize(entry.label, maxLabelW);
      const itemH = wrappedLabel.length * subStep + 2.1;

      if (y + itemH > bottomLimit) {
        nextTocPage();
      }

      if (!dryRun) {
        doc.setFillColor(148, 163, 184);
        doc.circle(marginX + 3.2, y - 1, 0.75, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.7);
        doc.setLineHeightFactor(1.3);
        doc.setTextColor(51, 65, 85);
        doc.text(wrappedLabel, subX, y);

        const lastLineText = wrappedLabel[wrappedLabel.length - 1] || "";
        const lastLineY = y + (wrappedLabel.length - 1) * subStep;
        const labelW = doc.getTextWidth(lastLineText);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.7);
        doc.setTextColor(37, 99, 235);
        const pageW = doc.getTextWidth(pageStr);
        doc.text(pageStr, rightX, lastLineY, { align: "right" });

        const dotStart = subX + labelW + 2.5;
        const dotEnd = rightX - pageW - 2.5;
        if (dotEnd - dotStart > 6) {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.25);
          doc.setLineDashPattern([0.7, 1.4], 0);
          doc.line(dotStart, lastLineY - 0.4, dotEnd, lastLineY - 0.4);
          doc.setLineDashPattern([], 0);
        }
      }

      y += itemH;
      return;
    }

    const isChapter = entry.kind === "chapter";
    if (isChapter && idx > 0) {
      y += 2.2;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.8);
    doc.setLineHeightFactor(1.3);
    const titleStep = getLineStepMm(doc);
    const titleMaxW = contentWidth - 24;
    const titleLines = doc.splitTextToSize(entry.label, titleMaxW);
    const blockH = titleLines.length * titleStep + (isChapter ? 5.2 : 4.2);

    if (y + blockH > bottomLimit) {
      nextTocPage();
    }

    if (!dryRun) {
      if (isChapter) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, y - 3.9, contentWidth, blockH - 1.2, 1.2, 1.2, "FD");
        doc.setFillColor(37, 99, 235);
        doc.rect(marginX, y - 3.9, 1.8, blockH - 1.2, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.8);
      doc.setLineHeightFactor(1.3);
      doc.setTextColor(
        entry.kind === "special" ? 30 : 15,
        entry.kind === "special" ? 58 : 23,
        entry.kind === "special" ? 138 : 42
      );
      const tx = isChapter ? marginX + 4.2 : marginX;
      doc.text(titleLines, tx, y);

      const lastLineText = titleLines[titleLines.length - 1] || "";
      const lastLineY = y + (titleLines.length - 1) * titleStep;
      const lastTitleW = doc.getTextWidth(lastLineText);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.6);
      doc.setTextColor(37, 99, 235);
      const pRight = isChapter ? rightX - 2.5 : rightX;
      const pW = doc.getTextWidth(pageStr);
      doc.text(pageStr, pRight, lastLineY, { align: "right" });

      const dStart = tx + lastTitleW + 2.5;
      const dEnd = pRight - pW - 2.5;
      if (dEnd - dStart > 6) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.setLineDashPattern([0.7, 1.4], 0);
        doc.line(dStart, lastLineY - 0.4, dEnd, lastLineY - 0.4);
        doc.setLineDashPattern([], 0);
      }
    }

    y += blockH;
  });

  return currentPageOffset + 1;
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
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm
  const topY = 24;
  const bottomLimit = pageHeight - 21;

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
  // SAMPUL BUKU RESMI (TIDAK DIHITUNG HALAMAN / TANPA NOMOR HALAMAN)
  // ============================================================================
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 12, pageHeight, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(12, 0, 2.2, pageHeight, "F");
  doc.setFillColor(217, 119, 6);
  doc.rect(14.2, 0, 0.7, pageHeight, "F");

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.rect(20, 14, pageWidth - 32, pageHeight - 28);

  const mastX = 26;
  const mastY = 22;
  const mastW = pageWidth - mastX - 18;

  const contactParts = [
    companyProfile?.phone,
    companyProfile?.email,
    companyProfile?.address,
  ]
    .filter(Boolean)
    .map((p) => sanitizePdfText(String(p)));
  const contactText = contactParts.join("  |  ");

  const textColX = mastX + 28;
  const textColW = mastW - 33;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setLineHeightFactor(1.22);
  const nameWrapped = doc.splitTextToSize(companyName, textColW);
  const nameStep = getLineStepMm(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const tagWrapped = doc.splitTextToSize(companyTagline, textColW);
  const tagStep = getLineStepMm(doc);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  const contactWrapped = contactText
    ? doc.splitTextToSize(contactText, textColW)
    : [];
  const contactStep = getLineStepMm(doc);

  const mastTextHeight =
    nameWrapped.length * nameStep +
    tagWrapped.length * tagStep +
    (contactWrapped.length > 0 ? contactWrapped.length * contactStep + 1.5 : 0);

  const mastH = Math.max(30, mastTextHeight + 12);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(mastX, mastY, mastW, mastH, 2.5, 2.5, "FD");

  const logoSize = 20;
  const logoX = mastX + 4.5;
  const logoY = mastY + (mastH - logoSize) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, "FD");

  if (processedLogoPng) {
    try {
      doc.addImage(
        processedLogoPng,
        "PNG",
        logoX + 1.2,
        logoY + 1.2,
        logoSize - 2.4,
        logoSize - 2.4
      );
    } catch {
      drawInitialsEmblem(doc, rawCompanyName, logoX, logoY, logoSize);
    }
  } else {
    drawInitialsEmblem(doc, rawCompanyName, logoX, logoY, logoSize);
  }

  let mastTextY = mastY + (mastH - mastTextHeight) / 2 + 4.2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(15, 23, 42);
  doc.text(nameWrapped, textColX, mastTextY);
  mastTextY += nameWrapped.length * nameStep;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(37, 99, 235);
  doc.text(tagWrapped, textColX, mastTextY);
  mastTextY += tagWrapped.length * tagStep + 1.2;

  if (contactWrapped.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(100, 116, 139);
    doc.text(contactWrapped, textColX, mastTextY);
  }

  const coverCenterX = mastX + mastW / 2;
  const heroTopY = Math.max(84, mastY + mastH + 26);

  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.5);
  doc.line(coverCenterX - 48, heroTopY, coverCenterX - 10, heroTopY);
  doc.line(coverCenterX + 10, heroTopY, coverCenterX + 48, heroTopY);
  doc.setFillColor(37, 99, 235);
  doc.circle(coverCenterX, heroTopY, 2.2, "F");

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(coverCenterX - 42, heroTopY + 7, 84, 7.5, 1.8, 1.8, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 58, 138);
  doc.text("DOKUMENTASI RESMI OPERASIONAL", coverCenterX, heroTopY + 12, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(31);
  doc.setTextColor(15, 23, 42);
  doc.text("BUKU PANDUAN", coverCenterX, heroTopY + 31, { align: "center" });

  doc.setFontSize(22.5);
  doc.setTextColor(30, 58, 138);
  doc.text("PENGGUNAAN APLIKASI", coverCenterX, heroTopY + 42.5, {
    align: "center",
  });

  doc.setFillColor(37, 99, 235);
  doc.rect(coverCenterX - 24, heroTopY + 48, 36, 1.8, "F");
  doc.setFillColor(217, 119, 6);
  doc.rect(coverCenterX + 14, heroTopY + 48, 10, 1.8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `EDISI RESMI · ${companyName.toUpperCase()}`,
    coverCenterX,
    heroTopY + 58,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.2);
  doc.setLineHeightFactor(1.45);
  doc.setTextColor(71, 85, 105);
  const coverDescWidth = mastW - 18;
  const coverSynopsis =
    "Panduan komprehensif tata kelola faktur penjualan, pencatatan pembayaran dan cicilan konsumen, pemantauan laporan jatuh tempo, pusat notifikasi transaksi, serta prosedur pengamanan cadangan data.";
  const coverSynLines = doc.splitTextToSize(coverSynopsis, coverDescWidth);
  const coverSynStep = getLineStepMm(doc);
  coverSynLines.forEach((line: string, lIdx: number) => {
    doc.text(line, coverCenterX, heroTopY + 69 + lIdx * coverSynStep, {
      align: "center",
    });
  });

  const metaRows: [string, string][] = [
    ["Nama Sistem", `${companyName} (Versi 2.5 Pro)`],
    ["Cakupan Materi", `${sections.length} Bab Panduan Lengkap & Tanya Jawab (FAQ)`],
    ["Tanggal Penerbitan", printDateStr],
    ["Pengembang Resmi", "Denuda"],
  ];

  const metaBoxY = 200;
  const metaBoxH = 17 + metaRows.length * 7.5 + 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(mastX, metaBoxY, mastW, metaBoxH, 2.5, 2.5, "FD");
  doc.setFillColor(30, 58, 138);
  doc.rect(mastX, metaBoxY, mastW, 8.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(255, 255, 255);
  doc.text("INFORMASI DOKUMEN & EDISI", coverCenterX, metaBoxY + 5.8, {
    align: "center",
  });

  let metaY = metaBoxY + 16;
  metaRows.forEach(([label, val], idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(100, 116, 139);
    doc.text(label, mastX + 8, metaY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`: ${val}`, mastX + 56, metaY);

    if (idx < metaRows.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(mastX + 8, metaY + 2.5, mastX + mastW - 8, metaY + 2.5);
    }
    metaY += 7.5;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(mastX + 10, pageHeight - 31, mastX + mastW - 10, pageHeight - 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Hak Cipta (c) ${currentYear} Denuda · Seluruh Hak Dilindungi Undang-Undang`,
    coverCenterX,
    pageHeight - 24,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Dokumen referensi operasional resmi sistem manajemen faktur dan piutang.",
    coverCenterX,
    pageHeight - 18.5,
    { align: "center" }
  );

  // ============================================================================
  // HALAMAN 1 BUKU: KATA PENGANTAR (TERPISAH DARI DAFTAR ISI)
  // ============================================================================
  doc.addPage(); // PDF Page 2 => Buku Halaman 1
  const prefaceBookPage = doc.getNumberOfPages() - 1; // 1

  let preY = topY + 4;
  const pageCenterX = pageWidth / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("PRAKATA PENYUSUNAN", pageCenterX, preY, { align: "center" });
  preY += 7.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 23, 42);
  doc.text("KATA PENGANTAR", pageCenterX, preY, { align: "center" });
  preY += 4.5;

  doc.setFillColor(37, 99, 235);
  doc.rect(pageCenterX - 22, preY, 32, 1.4, "F");
  doc.setFillColor(217, 119, 6);
  doc.rect(pageCenterX + 12, preY, 10, 1.4, "F");
  preY += 13;

  const prefaceParagraphs = [
    `Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya Buku Panduan Penggunaan Aplikasi ${companyName}. Dokumen ini dihadirkan sebagai rujukan operasional resmi bagi pimpinan usaha, staf administrasi, tim keuangan, serta bagian penagihan dalam menjalankan seluruh alur pengelolaan faktur penjualan dan pemantauan piutang secara terstruktur, transparan, dan akurat.`,
    `Dalam dinamika operasional perdagangan modern, ketepatan pencatatan transaksi serta kecepatan pemantauan status pembayaran konsumen menjadi kunci utama menjaga kesehatan arus kas perusahaan. Aplikasi ${companyName} dirancang secara khusus untuk menjawab kebutuhan tersebut melalui fitur input faktur terintegrasi, pencatatan cicilan berkala, penyaringan laporan jatuh tempo berbasis umur piutang maupun nominal, pusat notifikasi transaksi waktu nyata, hingga pelaporan lintas format (Excel, PDF, dan TXT).`,
    `Buku panduan ini disusun secara sistematis ke dalam ${sections.length} (sembilan) bab utama yang mencakup gambaran alur kerja terpadu, tata cara penginputan dan impor data, mekanisme pelunasan piutang, manajemen basis data konsumen beserta analisis tren bulanan, prosedur cadangan dan pemulihan data (backup dan restore), hingga optimalisasi penggunaan di perangkat seluler serta kustomisasi antarmuka.`,
    `Kami berharap buku panduan ini dapat menjadi pedoman praktis yang memudahkan setiap pengguna dalam mengoptimalkan seluruh kapabilitas sistem, meminimalkan kesalahan pencatatan administratif, serta mendukung kelancaran aktivitas bisnis harian. Masukan konstruktif senantiasa kami harapkan demi penyempurnaan sistem di masa mendatang.`,
  ].map((p) => sanitizePdfText(p));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setLineHeightFactor(1.52);
  doc.setTextColor(30, 41, 59);
  const preStep = getLineStepMm(doc);

  prefaceParagraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, contentWidth);
    doc.text(para, marginX, preY, {
      maxWidth: contentWidth,
      align: "justify",
    });
    preY += lines.length * preStep + 5.5;
  });

  preY += 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const noteText = sanitizePdfText(
    "Catatan Penggunaan: Untuk menjaga kesinambungan arsip pembukuan, pengelola disarankan membaca Bab 6 mengenai prosedur pencadangan data (Backup JSON dan Excel) sebelum memulai pengoperasian rutin secara penuh."
  );
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.4);
  doc.setLineHeightFactor(1.42);
  const noteStep = getLineStepMm(doc);
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 16);
  const noteBoxH = noteLines.length * noteStep + 8;

  doc.roundedRect(marginX, preY, contentWidth, noteBoxH, 2, 2, "FD");
  doc.setFillColor(37, 99, 235);
  doc.rect(marginX, preY, 2.5, noteBoxH, "F");
  doc.setTextColor(51, 65, 85);
  doc.text(noteText, marginX + 8, preY + 5.8, {
    maxWidth: contentWidth - 16,
    align: "justify",
  });
  preY += noteBoxH + 14;

  const signX = pageWidth - marginX;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Diterbitkan pada ${printDateStr}`, signX, preY, { align: "right" });
  preY += 5.5;
  doc.text("Hormat kami,", signX, preY, { align: "right" });
  preY += 16;

  doc.setDrawColor(148, 163, 184);
  doc.line(signX - 48, preY - 3, signX, preY - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Denuda", signX, preY + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.2);
  doc.setTextColor(37, 99, 235);
  doc.text("Pengembang & Arsitek Sistem", signX, preY + 7, { align: "right" });

  // ============================================================================
  // PERSIAPAN DAFTAR ISI LENGKAP (UKUR JUMLAH HALAMAN & RESERVASI SLOT)
  // ============================================================================
  const tocEntries: PdfTocEntry[] = [
    {
      key: "preface",
      kind: "special",
      label: "Kata Pengantar",
      page: prefaceBookPage,
    },
    {
      key: "toc",
      kind: "special",
      label: "Daftar Isi",
      page: prefaceBookPage + 1,
    },
  ];

  sections.forEach((sec, secIdx) => {
    tocEntries.push({
      key: `chap-${sec.id}`,
      kind: "chapter",
      label: sanitizePdfText(sec.title),
      page: 0,
    });
    sec.steps.forEach((step, stepIdx) => {
      tocEntries.push({
        key: `step-${sec.id}-${stepIdx}`,
        kind: "sub",
        label: sanitizePdfText(`${secIdx + 1}.${stepIdx + 1}  ${step.title}`),
        page: 0,
      });
    });
    if (sec.faq && sec.faq.length > 0) {
      tocEntries.push({
        key: `faq-${sec.id}`,
        kind: "sub",
        label: sanitizePdfText(
          `${secIdx + 1}.${sec.steps.length + 1}  Pertanyaan Umum (FAQ)`
        ),
        page: 0,
      });
    }
  });

  tocEntries.push({
    key: "closing",
    kind: "special",
    label: "Catatan Penutup & Hak Cipta",
    page: 0,
  });

  const tocLayoutOpts = {
    pageWidth,
    marginX,
    contentWidth,
    topY,
    bottomLimit,
  };

  const reservedTocPages = renderTocPages(doc, tocEntries, 3, {
    ...tocLayoutOpts,
    dryRun: true,
  });

  const tocStartPdfPage = doc.getNumberOfPages() + 1;
  for (let i = 0; i < reservedTocPages; i++) {
    doc.addPage();
  }

  const updateTocPage = (key: string, bookPage: number) => {
    const found = tocEntries.find((e) => e.key === key);
    if (found) found.page = bookPage;
  };

  // ============================================================================
  // HALAMAN ISI BAB PANDUAN
  // ============================================================================
  doc.addPage();
  let y = topY;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      y = topY;
    }
  };

  const renderJustifiedBlock = (
    rawText: string,
    startX: number,
    maxW: number,
    fontSize: number,
    lineFactor = 1.42
  ) => {
    doc.setFontSize(fontSize);
    doc.setLineHeightFactor(lineFactor);
    const stepMm = getLineStepMm(doc);
    const wrapped = doc.splitTextToSize(rawText, maxW);
    const blockH = wrapped.length * stepMm;

    if (y + blockH <= bottomLimit) {
      doc.text(rawText, startX, y, { maxWidth: maxW, align: "justify" });
      y += blockH;
      return;
    }

    const usablePageH = bottomLimit - topY;
    if (blockH <= usablePageH) {
      doc.addPage();
      y = topY;
      doc.text(rawText, startX, y, { maxWidth: maxW, align: "justify" });
      y += blockH;
      return;
    }

    const sentences = rawText.split(/(?<=[.!?])\s+/);
    let buffer = "";
    sentences.forEach((sentence) => {
      const candidate = buffer ? `${buffer} ${sentence}` : sentence;
      const candLines = doc.splitTextToSize(candidate, maxW);
      if (y + candLines.length * stepMm > bottomLimit && buffer) {
        doc.text(buffer, startX, y, { maxWidth: maxW, align: "justify" });
        doc.addPage();
        y = topY;
        buffer = sentence;
      } else {
        buffer = candidate;
      }
    });
    if (buffer) {
      const remLines = doc.splitTextToSize(buffer, maxW);
      ensureSpace(remLines.length * stepMm);
      doc.text(buffer, startX, y, { maxWidth: maxW, align: "justify" });
      y += remLines.length * stepMm;
    }
  };

  const renderFormattedDescription = (
    rawDesc: string,
    baseX: number,
    baseWidth: number
  ) => {
    const lines = rawDesc.split("\n");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) {
        y += 2.2;
        return;
      }

      const numberedMatch = line.match(/^(\d+\.)\s+(.*)$/);
      const bulletMatch = line.match(/^-\s+(.*)$/);

      if (numberedMatch) {
        const numLabel = numberedMatch[1];
        const bodyText = numberedMatch[2];
        const bodyX = baseX + 6;
        const bodyW = baseWidth - 6;

        doc.setFontSize(9.4);
        doc.setLineHeightFactor(1.42);
        const stepMm = getLineStepMm(doc);
        const bodyLines = doc.splitTextToSize(bodyText, bodyW);
        const bodyH = bodyLines.length * stepMm;

        // Ensure the prefix number and its entire paragraph stay together whenever <= 1 page
        if (y + bodyH > bottomLimit && bodyH <= bottomLimit - topY) {
          doc.addPage();
          y = topY;
        } else if (y + Math.min(bodyLines.length, 2) * stepMm > bottomLimit) {
          doc.addPage();
          y = topY;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138);
        doc.text(numLabel, baseX, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        renderJustifiedBlock(bodyText, bodyX, bodyW, 9.4, 1.42);
        y += 1.4;
      } else if (bulletMatch) {
        const bodyText = bulletMatch[1];
        const bodyX = baseX + 5;
        const bodyW = baseWidth - 5;

        doc.setFontSize(9.4);
        doc.setLineHeightFactor(1.42);
        const stepMm = getLineStepMm(doc);
        const bodyLines = doc.splitTextToSize(bodyText, bodyW);
        const bodyH = bodyLines.length * stepMm;

        if (y + bodyH > bottomLimit && bodyH <= bottomLimit - topY) {
          doc.addPage();
          y = topY;
        } else if (y + Math.min(bodyLines.length, 2) * stepMm > bottomLimit) {
          doc.addPage();
          y = topY;
        }

        doc.setFillColor(37, 99, 235);
        doc.circle(baseX + 1.8, y - 1.1, 0.85, "F");

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        renderJustifiedBlock(bodyText, bodyX, bodyW, 9.4, 1.42);
        y += 1.2;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        renderJustifiedBlock(line, baseX, baseWidth, 9.4, 1.45);
        if (idx < lines.length - 1 && lines[idx + 1]?.trim()) {
          y += 1.6;
        }
      }
    });
  };

  sections.forEach((sec, secIdx) => {
    if (secIdx > 0 && y > topY + 12) {
      doc.addPage();
      y = topY;
    } else {
      ensureSpace(42);
    }

    const chapterBookPage = doc.getNumberOfPages() - 1;
    updateTocPage(`chap-${sec.id}`, chapterBookPage);

    const cleanTitle = sanitizePdfText(sec.title);
    const cleanSummary = sanitizePdfText(sec.summary);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setLineHeightFactor(1.25);
    const titleStep = getLineStepMm(doc);
    const titleWrapped = doc.splitTextToSize(cleanTitle, contentWidth - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    doc.setLineHeightFactor(1.38);
    const sumStep = getLineStepMm(doc);
    const summaryWrapped = doc.splitTextToSize(cleanSummary, contentWidth - 14);

    const bannerHeight =
      9 + titleWrapped.length * titleStep + summaryWrapped.length * sumStep + 5;

    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(marginX, y, contentWidth, bannerHeight, 2.5, 2.5, "FD");
    doc.setFillColor(30, 58, 138);
    doc.rect(marginX, y, 3.2, bannerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setLineHeightFactor(1.25);
    doc.setTextColor(30, 58, 138);
    doc.text(titleWrapped, marginX + 7, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    doc.setLineHeightFactor(1.38);
    doc.setTextColor(71, 85, 105);
    doc.text(
      cleanSummary,
      marginX + 7,
      y + 8.5 + titleWrapped.length * titleStep,
      {
        maxWidth: contentWidth - 14,
        align: "justify",
      }
    );

    y += bannerHeight + 8;

    sec.steps.forEach((step, stepIdx) => {
      const sTitle = sanitizePdfText(step.title);
      const sDesc = sanitizePdfText(step.description);
      const sTip = step.tip ? sanitizePdfText(step.tip) : "";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setLineHeightFactor(1.3);
      const stepTitleStep = getLineStepMm(doc);
      const stepTitleLines = doc.splitTextToSize(sTitle, contentWidth - 12);

      ensureSpace(stepTitleLines.length * stepTitleStep + 22);

      const stepBookPage = doc.getNumberOfPages() - 1;
      updateTocPage(`step-${sec.id}-${stepIdx}`, stepBookPage);

      doc.setFillColor(37, 99, 235);
      doc.circle(marginX + 3.5, y + 2.2, 3.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.4);
      doc.setTextColor(255, 255, 255);
      doc.text(String(stepIdx + 1), marginX + 3.5, y + 3.2, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setLineHeightFactor(1.3);
      doc.setTextColor(15, 23, 42);
      doc.text(stepTitleLines, marginX + 9.5, y + 3.4);
      y += stepTitleLines.length * stepTitleStep + 2.8;

      renderFormattedDescription(sDesc, marginX + 9.5, contentWidth - 9.5);

      if (sTip) {
        y += 2;
        const tipFullText = `Tips Operasional: ${sTip}`;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.9);
        doc.setLineHeightFactor(1.38);
        const tipStep = getLineStepMm(doc);
        const tipLines = doc.splitTextToSize(tipFullText, contentWidth - 20);
        const tipHeight = tipLines.length * tipStep + 6;
        ensureSpace(tipHeight + 3);

        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(253, 230, 138);
        doc.roundedRect(
          marginX + 9.5,
          y,
          contentWidth - 9.5,
          tipHeight,
          1.5,
          1.5,
          "FD"
        );
        doc.setFillColor(217, 119, 6);
        doc.rect(marginX + 9.5, y, 2.2, tipHeight, "F");

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.9);
        doc.setLineHeightFactor(1.38);
        doc.setTextColor(146, 64, 14);
        doc.text(tipFullText, marginX + 14.5, y + 4.8, {
          maxWidth: contentWidth - 20,
          align: "justify",
        });
        y += tipHeight + 2.5;
      }

      if (stepIdx < sec.steps.length - 1 && y + 6 < bottomLimit) {
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(marginX + 9.5, y, pageWidth - marginX, y);
        y += 4.5;
      } else {
        y += 4.5;
      }
    });

    if (sec.faq && sec.faq.length > 0) {
      ensureSpace(26);
      const faqBookPage = doc.getNumberOfPages() - 1;
      updateTocPage(`faq-${sec.id}`, faqBookPage);

      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(5, 150, 105);
      doc.text("PERTANYAAN UMUM (FAQ)", marginX, y + 2);
      y += 6;

      sec.faq.forEach((f) => {
        const qText = `Pertanyaan: ${sanitizePdfText(f.q)}`;
        const aText = `Jawaban: ${sanitizePdfText(f.a)}`;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setLineHeightFactor(1.36);
        const qStep = getLineStepMm(doc);
        const qLines = doc.splitTextToSize(qText, contentWidth - 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setLineHeightFactor(1.38);
        const aStep = getLineStepMm(doc);
        const aLines = doc.splitTextToSize(aText, contentWidth - 10);

        const faqH = qLines.length * qStep + aLines.length * aStep + 8;
        ensureSpace(faqH + 3);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(marginX, y, contentWidth, faqH, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(qText, marginX + 5, y + 5.2, {
          maxWidth: contentWidth - 10,
          align: "justify",
        });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(aText, marginX + 5, y + 5.8 + qLines.length * qStep, {
          maxWidth: contentWidth - 10,
          align: "justify",
        });
        y += faqH + 3;
      });
    }
  });

  // ============================================================================
  // HALAMAN PENUTUP & KOLOFON RESMI
  // ============================================================================
  doc.addPage();
  const closingBookPage = doc.getNumberOfPages() - 1;
  updateTocPage("closing", closingBookPage);

  let closeY = topY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text("KOLOFON & PERNYATAAN RESMI", pageCenterX, closeY, {
    align: "center",
  });
  closeY += 7.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("CATATAN PENUTUP & HAK CIPTA", pageCenterX, closeY, {
    align: "center",
  });
  closeY += 4.5;
  doc.setFillColor(37, 99, 235);
  doc.rect(pageCenterX - 20, closeY, 40, 1.4, "F");
  closeY += 14;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, closeY, contentWidth, 74, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `DOKUMENTASI RESMI · ${companyName.toUpperCase()}`,
    pageCenterX,
    closeY + 13,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.8);
  doc.setLineHeightFactor(1.48);
  doc.setTextColor(226, 232, 240);
  const closingBody = sanitizePdfText(
    `Buku panduan ini diterbitkan sebagai referensi operasional resmi bagi seluruh pengguna aplikasi ${companyName}. Demi menjaga keamanan dan keutuhan arsip transaksi perusahaan, pengguna sangat dianjurkan melakukan pencadangan data (Backup JSON maupun Excel) secara berkala melalui menu Pengaturan.`
  );
  doc.text(closingBody, marginX + 10, closeY + 23, {
    maxWidth: contentWidth - 20,
    align: "justify",
  });

  doc.setDrawColor(51, 65, 85);
  doc.line(marginX + 10, closeY + 55, marginX + contentWidth - 10, closeY + 55);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(147, 197, 253);
  doc.text(
    `Dikembangkan oleh Denuda  |  Hak Cipta (c) ${currentYear} Denuda  |  All Rights Reserved`,
    pageCenterX,
    closeY + 64,
    { align: "center" }
  );

  // ============================================================================
  // RENDER DAFTAR ISI LENGKAP KE HALAMAN YANG DIRESERVASI
  // ============================================================================
  renderTocPages(doc, tocEntries, tocStartPdfPage, {
    ...tocLayoutOpts,
    dryRun: false,
  });

  // ============================================================================
  // RUNNING HEADER & FOOTER (COVER TIDAK DIHITUNG; KATA PENGANTAR = HALAMAN 1)
  // ============================================================================
  const totalPdfPages = doc.getNumberOfPages();
  const totalContentPages = Math.max(1, totalPdfPages - 1);

  for (let p = 2; p <= totalPdfPages; p++) {
    doc.setPage(p);
    const bookPageNum = p - 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `BUKU PANDUAN PENGGUNAAN · ${companyName.toUpperCase()}`,
      marginX,
      12.5
    );
    doc.setFont("helvetica", "normal");
    doc.text("Edisi Resmi · Versi 2.5 Pro", pageWidth - marginX, 12.5, {
      align: "right",
    });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, 15, pageWidth - marginX, 15);

    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 14.5, pageWidth - marginX, pageHeight - 14.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`(c) ${currentYear} Denuda`, marginX, pageHeight - 9.2);

    doc.text(`Dicetak ${printDateStr}`, pageCenterX, pageHeight - 9.2, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Halaman ${bookPageNum} dari ${totalContentPages}`,
      pageWidth - marginX,
      pageHeight - 9.2,
      { align: "right" }
    );
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
