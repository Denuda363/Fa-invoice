export interface StepIllustrationMeta {
  caption: string;
}

const SVG_WIDTH = 680;
const SVG_HEIGHT = 215;

export const STEP_ILLUSTRATION_ASPECT = SVG_HEIGHT / SVG_WIDTH;

function esc(val: string): string {
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke?: string,
  rx = 4,
  strokeW = 1
): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${strokeW}"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${s}/>`;
}

function txt(
  x: number,
  y: number,
  content: string,
  opts?: {
    size?: number;
    weight?: "normal" | "bold";
    fill?: string;
    anchor?: "start" | "middle" | "end";
    italic?: boolean;
  }
): string {
  const size = opts?.size ?? 10;
  const weight = opts?.weight ?? "normal";
  const fill = opts?.fill ?? "#0f172a";
  const anchor = opts?.anchor ?? "start";
  const style = opts?.italic ? ` font-style="italic"` : "";
  return `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${style}>${esc(
    content
  )}</text>`;
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke = "#cbd5e1",
  width = 1.2,
  dash?: string
): string {
  const d = dash ? ` stroke-dasharray="${dash}"` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"${d}/>`;
}

function arrowRight(x1: number, y: number, x2: number, color = "#2563eb"): string {
  return (
    line(x1, y, x2 - 6, y, color, 1.8) +
    `<polygon points="${x2 - 6},${y - 4} ${x2},${y} ${x2 - 6},${y + 4}" fill="${color}"/>`
  );
}

function arrowDown(x: number, y1: number, y2: number, color = "#2563eb"): string {
  return (
    line(x, y1, x, y2 - 6, color, 1.8) +
    `<polygon points="${x - 4},${y2 - 6} ${x},${y2} ${x + 4},${y2 - 6}" fill="${color}"/>`
  );
}

function stepBadge(cx: number, cy: number, num: string | number, bg = "#2563eb"): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="9.5" fill="${bg}" stroke="#ffffff" stroke-width="1.5"/>` +
    txt(cx, cy + 3.5, String(num), {
      size: 9.5,
      weight: "bold",
      fill: "#ffffff",
      anchor: "middle",
    })
  );
}

function pillBox(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  bg: string,
  fg: string,
  stroke?: string,
  size = 9
): string {
  return (
    rect(x, y, w, h, bg, stroke, 4, 1) +
    txt(x + w / 2, y + h / 2 + size * 0.35, label, {
      size,
      weight: "bold",
      fill: fg,
      anchor: "middle",
    })
  );
}

function fieldInput(
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  badgeNum?: string | number,
  highlightColor = "#2563eb"
): string {
  const out = [
    txt(x, y, label, { size: 8.2, weight: "bold", fill: "#475569" }),
    rect(x, y + 4, w, 20, "#ffffff", badgeNum ? highlightColor : "#cbd5e1", 3.5, badgeNum ? 1.4 : 1),
    txt(x + 7, y + 17, value, { size: 8.8, fill: "#0f172a" }),
  ];
  if (badgeNum !== undefined) {
    out.push(stepBadge(x + w - 4, y + 4, badgeNum, highlightColor));
  }
  return out.join("");
}

function appWindow(
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  activeMenu?: string
): string {
  const parts: string[] = [
    rect(x, y, w, h, "#ffffff", "#cbd5e1", 6, 1.2),
    `<path d="M${x + 6} ${y} H${x + w - 6} Q${x + w} ${y} ${x + w} ${y + 6} V${y + 22} H${x} V${y + 6} Q${x} ${y} ${x + 6} ${y} Z" fill="#0f172a"/>`,
    `<circle cx="${x + 12}" cy="${y + 11}" r="3" fill="#ef4444"/>`,
    `<circle cx="${x + 22}" cy="${y + 11}" r="3" fill="#f59e0b"/>`,
    `<circle cx="${x + 32}" cy="${y + 11}" r="3" fill="#10b981"/>`,
    txt(x + 44, y + 14.5, title, { size: 9, weight: "bold", fill: "#ffffff" }),
  ];
  if (activeMenu) {
    parts.push(
      rect(x + 6, y + 27, 88, h - 33, "#f8fafc", "#e2e8f0", 4, 1)
    );
    const menus = [
      "Dashboard",
      "Input Faktur",
      "Riwayat Faktur",
      "Riwayat Bayar",
      "Laporan JT",
      "Data Konsumen",
      "Pengaturan",
    ];
    menus.forEach((m, idx) => {
      const my = y + 33 + idx * 20;
      const isAct = m === activeMenu;
      if (isAct) {
        parts.push(rect(x + 10, my, 80, 16, "#1d4ed8", undefined, 3));
        parts.push(txt(x + 16, my + 11, m, { size: 8, weight: "bold", fill: "#ffffff" }));
      } else {
        parts.push(txt(x + 16, my + 11, m, { size: 8, fill: "#475569" }));
      }
    });
  }
  return parts.join("");
}

function wrapSvg(bgFill: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">${rect(
    0,
    0,
    SVG_WIDTH,
    SVG_HEIGHT,
    bgFill,
    undefined,
    0
  )}${inner}</svg>`;
}

const CAPTION_MAP: Record<string, string[]> = {
  "pengenalan-aplikasi": [
    "Arsitektur Alur Kerja Terpadu Sistem Manajemen Faktur dan Piutang",
    "Perbandingan Pembukuan Manual dengan Sistem Digital Otomatis",
    "Pemetaan Peran Pengguna dan Hak Akses Operasional Modul",
    "Peta Enam Modul Utama Aplikasi yang Saling Terintegrasi",
  ],
  "alur-kerja": [
    "Langkah 1: Pendaftaran Profil Konsumen Baru di Menu Data Konsumen",
    "Langkah 2: Pengisian Formulir Faktur Penjualan dan Penentuan Jatuh Tempo",
    "Langkah 3: Pemantauan Ringkasan Piutang dan Peringatan di Dashboard",
    "Langkah 4: Pencatatan Pembayaran Cicilan maupun Pelunasan Faktur",
    "Langkah 5: Penyaringan Data dan Ekspor Laporan dari Menu Laporan Jatuh Tempo",
    "Langkah 6: Pencadangan Data Berkala ke Format JSON dan Excel Multi-Sheet",
  ],
  "input-faktur": [
    "Urutan Pengisian Formulir Input Faktur Manual (Langkah 1 sampai 6)",
    "Formulir Input Massal Multi-Baris untuk Banyak Faktur Sekaligus",
    "Alur Impor Berkas Excel Menggunakan Template Kolom Resmi",
    "Antarmuka Riwayat Faktur, Lencana Total Tagihan, dan Filter Periode",
  ],
  "pembayaran-faktur": [
    "Alur Pencatatan Pembayaran Baru dan Tombol Cepat Bayar Lunas",
    "Tampilan Rincian Riwayat Cicilan dan Penurunan Sisa Tagihan",
    "Prosedur Pembatalan Salah Catat Pembayaran dan Hitung Ulang Saldo",
    "Menu Terpusat Riwayat Pembayaran dan Rekap Total per Konsumen",
  ],
  "laporan-dan-export": [
    "Panel Filter Tanggal Faktur Berwarna Biru dan Pintasan Periode",
    "Panel Filter Jatuh Tempo Berwarna Oranye dan Klasifikasi Umur Piutang",
    "Panel Filter Nominal Tagihan Cakupan Per Faktur dan Total per Konsumen",
    "Penandaan Sorotan Merah untuk Faktur Jatuh Tempo pada Export Excel",
    "Tiga Format Keluaran Laporan Tambahan: Excel Pembayaran, PDF, dan TXT",
    "Perhitungan Real-Time Total Sisa Tagihan Ceklis dan Pelunasan Massal",
    "Pengaturan Jumlah Baris Data per Halaman (10 hingga Semua Data)",
  ],
  "data-konsumen": [
    "Formulir Tambah dan Ubah Profil Konsumen serta Kontak Toko",
    "Aktivasi Opsi Pemisahan Lembar Kerja (Sheet) Khusus per Konsumen",
    "Akses Cepat Konfirmasi Tagihan Konsumen via Telepon dan WhatsApp",
    "Pencarian Kata Kunci, Filter Status Cepat, dan Pengurutan Daftar Toko",
    "Visualisasi Grafik Bar Bulanan dan Tren Perbandingan MoM Konsumen",
  ],
  "backup-restore": [
    "Dua Metode Pencadangan Data Resmi: Format JSON Utuh dan Excel 3 Sheet",
    "Alur Pemulihan Data (Restore) Antar Perangkat dari Berkas Cadangan",
    "Penyeragaman Massal Batas Jatuh Tempo Menjadi 30 Hari dari Tanggal Faktur",
    "Prosedur Pengaman Zona Berbahaya Sebelum Melakukan Reset Semua Data",
  ],
  "mobile-pwa": [
    "Tata Letak Dashboard Ringkas Satu Layar Penuh pada Perangkat Smartphone",
    "Navigasi Bar Bawah (Bottom Navbar) untuk Akses Cepat Satu Tangan",
    "Langkah Pemasangan Aplikasi (Install PWA) di Android Chrome dan iPhone Safari",
  ],
  "gaya-navbar": [
    "Galeri Delapan Tema Antarmuka Berdimensi 3D dan Efek Bevel",
    "Pembaruan Profil Perusahaan, NPWP, dan Unggah Logo Kustom",
    "Perbandingan Mode Sidebar Normal dan Mode Ringkas (Minimize 80px)",
    "Pilihan Tata Letak Navigasi 3D serta Lima Gaya Animasi Transisi Halaman",
    "Pengaturan Delapan Gaya Jam Realtime dan Panel Pusat Notifikasi",
  ],
  "tentang-developer": [
    "Identitas Pengembang Resmi Denuda dan Fokus Rekayasa Sistem",
    "Perlindungan Hak Cipta Resmi atas Antarmuka, Formula, dan Arsitektur",
    "Arsitektur Teknologi Web Modern, Penyimpanan Lokal, dan Keamanan Data",
  ],
};

export function getStepIllustrationMeta(
  sectionId: string,
  stepIndex: number
): StepIllustrationMeta {
  const list = CAPTION_MAP[sectionId];
  const caption =
    list?.[stepIndex] || `Ilustrasi Visual Langkah ${stepIndex + 1}`;
  return { caption };
}

export function buildStepIllustrationSvg(
  sectionId: string,
  stepIndex: number,
  companyName = "AF Faktur"
): string {
  const safeComp = companyName.trim() || "AF Faktur";

  switch (`${sectionId}:${stepIndex}`) {
    // =========================================================================
    // BAB 1: PENGENALAN TENTANG APLIKASI
    // =========================================================================
    case "pengenalan-aplikasi:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 12, 648, 191, "#ffffff", "#cbd5e1", 8, 1.2),
          rect(16, 12, 648, 28, "#0f172a", undefined, 8),
          rect(16, 32, 648, 8, "#0f172a"),
          txt(32, 30, `SISTEM MANAJEMEN FAKTUR & PIUTANG · ${safeComp.toUpperCase()}`, {
            size: 10,
            weight: "bold",
            fill: "#ffffff",
          }),
          pillBox(532, 17, 118, 18, "WEB & PWA OFFLINE-READY", "#1e3a8a", "#93c5fd", "#3b82f6", 7.8),
          // 3 pillars
          rect(34, 56, 184, 108, "#eff6ff", "#bfdbfe", 6, 1.2),
          stepBadge(52, 74, "1", "#1d4ed8"),
          txt(68, 78, "Pencatatan Faktur", { size: 10.5, weight: "bold", fill: "#1e3a8a" }),
          txt(46, 98, "- Input manual & massal", { size: 8.6, fill: "#334155" }),
          txt(46, 113, "- Impor template Excel", { size: 8.6, fill: "#334155" }),
          txt(46, 128, "- Hitung jatuh tempo otomatis", { size: 8.6, fill: "#334155" }),
          pillBox(46, 140, 158, 16, "Data Faktur Tersimpan Rapi", "#dbeafe", "#1e40af", undefined, 8),

          arrowRight(222, 110, 244, "#2563eb"),

          rect(248, 56, 184, 108, "#ecfdf5", "#a7f3d0", 6, 1.2),
          stepBadge(266, 74, "2", "#059669"),
          txt(282, 78, "Pantau & Cicilan", { size: 10.5, weight: "bold", fill: "#065f46" }),
          txt(260, 98, "- Dashboard ringkas real-time", { size: 8.6, fill: "#334155" }),
          txt(260, 113, "- Bayar cicilan maupun lunas", { size: 8.6, fill: "#334155" }),
          txt(260, 128, "- Peringatan lewat tenggat", { size: 8.6, fill: "#334155" }),
          pillBox(260, 140, 158, 16, "Saldo Piutang Akurat 100%", "#d1fae5", "#065f46", undefined, 8),

          arrowRight(436, 110, 458, "#059669"),

          rect(462, 56, 184, 108, "#fffbeb", "#fde68a", 6, 1.2),
          stepBadge(480, 74, "3", "#d97706"),
          txt(496, 78, "Laporan & Arsip", { size: 10.5, weight: "bold", fill: "#92400e" }),
          txt(474, 98, "- Filter tanggal, umur & nominal", { size: 8.6, fill: "#334155" }),
          txt(474, 113, "- Ekspor Excel, PDF & TXT", { size: 8.6, fill: "#334155" }),
          txt(474, 128, "- Backup & Restore JSON/XLSX", { size: 8.6, fill: "#334155" }),
          pillBox(474, 140, 158, 16, "Siap Audit & Kirim WhatsApp", "#fef3c7", "#92400e", undefined, 8),

          rect(34, 174, 612, 20, "#f1f5f9", "#e2e8f0", 4),
          txt(340, 187.5, "Akses Resmi: https://fa-invoice.vercel.app  ·  Penyimpanan Lokal Aman  ·  Desktop & Smartphone", {
            size: 8.4,
            weight: "bold",
            fill: "#1e3a8a",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "pengenalan-aplikasi:1": {
      return wrapSvg(
        "#f8fafc",
        [
          // Left: Before
          rect(16, 14, 210, 187, "#fef2f2", "#fecaca", 6, 1.2),
          pillBox(28, 24, 186, 20, "CARA MANUAL (RENTAN KELIRU)", "#dc2626", "#ffffff", undefined, 8.5),
          txt(30, 64, "x  Nota kertas mudah hilang atau rusak", { size: 8.8, fill: "#7f1d1d" }),
          txt(30, 86, "x  Sulit melacak sisa cicilan per toko", { size: 8.8, fill: "#7f1d1d" }),
          txt(30, 108, "x  Faktur jatuh tempo sering terlewat", { size: 8.8, fill: "#7f1d1d" }),
          txt(30, 130, "x  Rekap laporan butuh berjam-jam", { size: 8.8, fill: "#7f1d1d" }),
          txt(30, 152, "x  Tidak ada backup cadangan aman", { size: 8.8, fill: "#7f1d1d" }),
          rect(28, 168, 186, 22, "#fee2e2", "#fca5a5", 4),
          txt(121, 182, "Risiko Arus Kas Terganggu", { size: 8.5, weight: "bold", fill: "#991b1b", anchor: "middle" }),

          arrowRight(232, 108, 258, "#16a34a"),

          // Right: 4 Benefits
          rect(264, 14, 400, 187, "#ffffff", "#bfdbfe", 6, 1.2),
          pillBox(278, 24, 372, 20, "MANFAAT UTAMA SISTEM TERINTEGRASI", "#1e3a8a", "#ffffff", undefined, 8.8),

          rect(278, 54, 180, 64, "#eff6ff", "#bfdbfe", 5),
          stepBadge(294, 70, "1", "#1d4ed8"),
          txt(308, 73.5, "Kontrol Piutang Akurat", { size: 9.2, weight: "bold", fill: "#1e3a8a" }),
          txt(288, 92, "Tanggal terbit, jatuh tempo, dan", { size: 8.2, fill: "#475569" }),
          txt(288, 105, "sisa tagihan terhitung otomatis.", { size: 8.2, fill: "#475569" }),

          rect(470, 54, 180, 64, "#fff7ed", "#fed7aa", 5),
          stepBadge(486, 70, "2", "#ea580c"),
          txt(500, 73.5, "Penagihan Lebih Cepat", { size: 9.2, weight: "bold", fill: "#9a3412" }),
          txt(480, 92, "Kelompok umur piutang (1-30 hr,", { size: 8.2, fill: "#475569" }),
          txt(480, 105, "31-60 hr, >60 hr) langsung tampil.", { size: 8.2, fill: "#475569" }),

          rect(278, 126, 180, 64, "#ecfdf5", "#a7f3d0", 5),
          stepBadge(294, 142, "3", "#059669"),
          txt(308, 145.5, "Arus Kas Transparan", { size: 9.2, weight: "bold", fill: "#065f46" }),
          txt(288, 164, "Semua setoran cicilan dan total", { size: 8.2, fill: "#475569" }),
          txt(288, 177, "bayar per konsumen tercatat rapi.", { size: 8.2, fill: "#475569" }),

          rect(470, 126, 180, 64, "#eef2ff", "#c7d2fe", 5),
          stepBadge(486, 142, "4", "#4f46e5"),
          txt(500, 145.5, "Ekspor Lintas Format", { size: 9.2, weight: "bold", fill: "#3730a3" }),
          txt(480, 164, "Sekali klik unduh Excel multi-", { size: 8.2, fill: "#475569" }),
          txt(480, 177, "sheet, PDF resmi, atau teks TXT.", { size: 8.2, fill: "#475569" }),
        ].join("")
      );
    }

    case "pengenalan-aplikasi:2": {
      const roles = [
        {
          x: 20,
          num: "1",
          color: "#1d4ed8",
          bg: "#eff6ff",
          border: "#93c5fd",
          role: "Pimpinan / Pemilik",
          sub: "Pengawasan Strategis",
          tasks: [
            "• Pantau total piutang di Dashboard",
            "• Analisis Grafik Tren MoM bulanan",
            "• Cek peringkat tagihan konsumen",
            "• Evaluasi rasio pelunasan usaha",
          ],
          badge: "Dashboard & Grafik MoM",
        },
        {
          x: 238,
          num: "2",
          color: "#059669",
          bg: "#ecfdf5",
          border: "#6ee7b7",
          role: "Staf Admin & Kasir",
          sub: "Operasional Input Harian",
          tasks: [
            "• Input faktur satuan & multi-baris",
            "• Impor data faktur file Excel",
            "• Daftarkan & edit Data Konsumen",
            "• Atur opsi Pisah Sheet per toko",
          ],
          badge: "Input Faktur & Konsumen",
        },
        {
          x: 456,
          num: "3",
          color: "#d97706",
          bg: "#fffbeb",
          border: "#fcd34d",
          role: "Keuangan & Penagih",
          sub: "Pelunasan & Penagihan",
          tasks: [
            "• Catat cicilan maupun Bayar Lunas",
            "• Ceklis massal & Bayar Terpilih",
            "• Filter jatuh tempo & nominal",
            "• Kirim TXT WA, PDF & Excel JT",
          ],
          badge: "Pembayaran & Laporan JT",
        },
      ];
      return wrapSvg(
        "#f8fafc",
        roles
          .map((r) =>
            [
              rect(r.x, 16, 204, 183, "#ffffff", r.border, 7, 1.3),
              rect(r.x, 16, 204, 42, r.bg, undefined, 7),
              rect(r.x, 48, 204, 10, r.bg),
              stepBadge(r.x + 22, 37, r.num, r.color),
              txt(r.x + 38, 34, r.role, { size: 10.5, weight: "bold", fill: "#0f172a" }),
              txt(r.x + 38, 47, r.sub, { size: 8.2, fill: r.color, weight: "bold" }),
              ...r.tasks.map((t, i) => txt(r.x + 14, 78 + i * 21, t, { size: 8.8, fill: "#334155" })),
              pillBox(r.x + 14, 166, 176, 22, r.badge, r.color, "#ffffff", undefined, 8.4),
            ].join("")
          )
          .join("")
      );
    }

    case "pengenalan-aplikasi:3": {
      const mods = [
        { x: 20, y: 18, n: "1", c: "#1d4ed8", t: "Dashboard Eksekutif", d: "Ringkasan piutang, faktur aktif, & status JT." },
        { x: 238, y: 18, n: "2", c: "#0284c7", t: "Input & Riwayat Faktur", d: "Manual, massal, import Excel, & filter tanggal." },
        { x: 456, y: 18, n: "3", c: "#059669", t: "Riwayat Pembayaran", d: "Setoran kronologis & total bayar per toko." },
        { x: 20, y: 114, n: "4", c: "#ea580c", t: "Laporan Jatuh Tempo", d: "Filter fleksibel, ceklis massal, Excel/PDF/TXT." },
        { x: 238, y: 114, n: "5", c: "#7c3aed", t: "Konsumen & Grafik Tren", d: "Profil pelanggan, pisah sheet, & kurva MoM." },
        { x: 456, y: 114, n: "6", c: "#334155", t: "Pengaturan & Panduan", d: "Backup JSON/XLS, tema 3D, jam, & cetak buku." },
      ];
      return wrapSvg(
        "#f1f5f9",
        mods
          .map((m) =>
            [
              rect(m.x, m.y, 204, 82, "#ffffff", "#cbd5e1", 6, 1.2),
              rect(m.x, m.y, 6, 82, m.c, undefined, 2),
              stepBadge(m.x + 24, m.y + 24, m.n, m.c),
              txt(m.x + 40, m.y + 28, m.t, { size: 10, weight: "bold", fill: "#0f172a" }),
              txt(m.x + 16, m.y + 52, m.d, { size: 8.3, fill: "#475569" }),
              rect(m.x + 16, m.y + 62, 174, 12, "#f8fafc", "#e2e8f0", 3),
              txt(m.x + 103, m.y + 70.5, "Terhubung Otomatis Secara Real-Time", {
                size: 7.4,
                weight: "bold",
                fill: m.c,
                anchor: "middle",
              }),
            ].join("")
          )
          .join("")
      );
    }

    // =========================================================================
    // BAB 2: ALUR SINGKAT PENGGUNAAN APLIKASI
    // =========================================================================
    case "alur-kerja:0": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Data Konsumen`, "Data Konsumen"),
          pillBox(515, 42, 134, 22, "+ Tambah Konsumen", "#2563eb", "#ffffff", undefined, 8.6),
          stepBadge(515, 42, "1", "#ea580c"),
          rect(116, 72, 534, 118, "#f8fafc", "#cbd5e1", 5),
          txt(128, 88, "Form Profil Pelanggan Baru", { size: 9.5, weight: "bold", fill: "#1e3a8a" }),
          fieldInput(128, 98, 162, "Nama Toko / Pelanggan", "BD DIAN JATITUJUH", "2"),
          fieldInput(302, 98, 155, "No. Telepon / WhatsApp", "0812-3456-7890"),
          fieldInput(469, 98, 168, "Alamat Pengiriman", "Jl. Raya Jatitujuh No. 12"),
          rect(128, 152, 15, 15, "#2563eb", undefined, 3),
          txt(135.5, 162.5, "v", { size: 9, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          txt(150, 163, "Pisahkan Sheet Khusus saat Export Excel", { size: 8.8, weight: "bold", fill: "#0f172a" }),
          stepBadge(128, 152, "3", "#059669"),
          pillBox(542, 150, 95, 22, "Simpan Konsumen", "#059669", "#ffffff", undefined, 8.5),
        ].join("")
      );
    }

    case "alur-kerja:1": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Input Faktur Penjualan`, "Input Faktur"),
          txt(116, 52, "Formulir Pencatatan Faktur Baru", { size: 10, weight: "bold", fill: "#0f172a" }),
          pillBox(532, 39, 118, 20, "Import File Excel", "#059669", "#ffffff", undefined, 8.2),
          fieldInput(116, 66, 165, "No. Faktur Unik", "INV-2026-0148", "1"),
          fieldInput(293, 66, 175, "Pilih / Ketik Konsumen", "APT ASSIFA CIPEUNDEUY", "2"),
          fieldInput(480, 66, 168, "Total Tagihan (Rp)", "Rp 1.109.370", "4"),
          fieldInput(116, 118, 165, "Tanggal Faktur", "26/11/2026", "3"),
          fieldInput(293, 118, 175, "Jatuh Tempo (+30 Hari)", "26/12/2026"),
          rect(480, 122, 168, 24, "#fffbeb", "#fcd34d", 4),
          txt(564, 137, "Otomatis +30 Hr / Sesuai", { size: 8.2, weight: "bold", fill: "#92400e", anchor: "middle" }),
          pillBox(480, 162, 168, 24, "Simpan Faktur", "#2563eb", "#ffffff", undefined, 9),
          stepBadge(480, 162, "5", "#ea580c"),
        ].join("")
      );
    }

    case "alur-kerja:2": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Dashboard Ringkas`, "Dashboard"),
          // 4 KPI Cards
          rect(116, 42, 126, 52, "#eff6ff", "#93c5fd", 5),
          txt(124, 57, "TOTAL PIUTANG", { size: 7.4, weight: "bold", fill: "#1d4ed8" }),
          txt(124, 75, "Rp 48.250.000", { size: 10.5, weight: "bold", fill: "#0f172a" }),
          stepBadge(234, 46, "1", "#1d4ed8"),

          rect(250, 42, 126, 52, "#ecfdf5", "#6ee7b7", 5),
          txt(258, 57, "FAKTUR LUNAS", { size: 7.4, weight: "bold", fill: "#059669" }),
          txt(258, 75, "42 Faktur", { size: 10.5, weight: "bold", fill: "#0f172a" }),
          stepBadge(368, 46, "2", "#059669"),

          rect(384, 42, 126, 52, "#fffbeb", "#fcd34d", 5),
          txt(392, 57, "SISA TAGIHAN", { size: 7.4, weight: "bold", fill: "#d97706" }),
          txt(392, 75, "18 Faktur Aktif", { size: 10.5, weight: "bold", fill: "#0f172a" }),
          stepBadge(502, 46, "3", "#d97706"),

          rect(518, 42, 132, 52, "#fef2f2", "#fca5a5", 5),
          txt(526, 57, "LEWAT JATUH TEMPO", { size: 7.4, weight: "bold", fill: "#dc2626" }),
          txt(526, 75, "5 Faktur Kritis!", { size: 10.5, weight: "bold", fill: "#991b1b" }),
          stepBadge(642, 46, "4", "#dc2626"),

          // Bottom summary graph + warning alert
          rect(116, 104, 326, 86, "#f8fafc", "#cbd5e1", 5),
          txt(126, 119, "Grafik Status Piutang & Pelunasan", { size: 8.6, weight: "bold", fill: "#334155" }),
          rect(140, 146, 36, 34, "#2563eb", undefined, 2),
          rect(192, 134, 36, 46, "#10b981", undefined, 2),
          rect(244, 154, 36, 26, "#f59e0b", undefined, 2),
          rect(296, 162, 36, 18, "#ef4444", undefined, 2),
          txt(158, 188, "Faktur", { size: 7.2, fill: "#475569", anchor: "middle" }),
          txt(210, 188, "Lunas", { size: 7.2, fill: "#475569", anchor: "middle" }),
          txt(262, 188, "Cicil", { size: 7.2, fill: "#475569", anchor: "middle" }),
          txt(314, 188, "Lewat JT", { size: 7.2, fill: "#dc2626", anchor: "middle" }),

          rect(450, 104, 200, 86, "#fef2f2", "#fecaca", 5),
          txt(460, 120, "Peringatan Jatuh Tempo", { size: 8.6, weight: "bold", fill: "#991b1b" }),
          txt(460, 138, "• INV-091 BD DIAN (Lewat 6 hr)", { size: 8, fill: "#7f1d1d" }),
          txt(460, 153, "• INV-084 APT ASSIFA (Lewat 3 hr)", { size: 8, fill: "#7f1d1d" }),
          pillBox(460, 164, 180, 18, "Klik ke Laporan Jatuh Tempo ->", "#dc2626", "#ffffff", undefined, 7.8),
        ].join("")
      );
    }

    case "alur-kerja:3": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Riwayat Faktur & Pelunasan`, "Riwayat Faktur"),
          // Table Header
          rect(114, 42, 536, 22, "#f1f5f9", "#cbd5e1", 3),
          txt(124, 56, "No. Faktur", { size: 8, weight: "bold", fill: "#475569" }),
          txt(212, 56, "Konsumen", { size: 8, weight: "bold", fill: "#475569" }),
          txt(348, 56, "Sisa Tagihan", { size: 8, weight: "bold", fill: "#475569" }),
          txt(448, 56, "Status", { size: 8, weight: "bold", fill: "#475569" }),
          txt(540, 56, "Aksi", { size: 8, weight: "bold", fill: "#475569" }),

          // Row 1
          rect(114, 68, 536, 32, "#ffffff", "#e2e8f0", 3),
          txt(124, 87, "INV-2026-014", { size: 8.4, weight: "bold" }),
          txt(212, 87, "BD DIAN JATITUJUH", { size: 8.4 }),
          txt(348, 87, "Rp 499.048", { size: 8.4, weight: "bold", fill: "#dc2626" }),
          pillBox(434, 75, 62, 18, "Sebagian", "#fef3c7", "#b45309", "#fcd34d", 7.8),
          pillBox(518, 74, 58, 20, "Bayar", "#16a34a", "#ffffff", undefined, 8.4),
          stepBadge(518, 74, "1", "#ea580c"),
          pillBox(582, 74, 58, 20, "Riwayat", "#f1f5f9", "#334155", "#cbd5e1", 8),

          // Step arrow to popup
          arrowDown(547, 96, 114, "#16a34a"),

          // Payment Mini Modal
          rect(150, 116, 480, 74, "#ecfdf5", "#10b981", 6, 1.4),
          txt(164, 132, "Form Pembayaran · INV-2026-014", { size: 9, weight: "bold", fill: "#065f46" }),
          fieldInput(164, 140, 125, "Tgl Pembayaran", "26/11/2026", "2", "#059669"),
          fieldInput(300, 140, 145, "Nominal Diterima", "Rp 499.048"),
          pillBox(456, 150, 74, 22, "Bayar Lunas", "#0f172a", "#ffffff", undefined, 7.8),
          pillBox(538, 150, 82, 22, "Konfirmasi", "#16a34a", "#ffffff", undefined, 8),
          stepBadge(538, 150, "3", "#1d4ed8"),
          txt(164, 185, "Status berubah otomatis: Lunas (100%) atau Sebagian (jika masih bersisa).", {
            size: 7.8,
            weight: "bold",
            fill: "#065f46",
          }),
        ].join("")
      );
    }

    case "alur-kerja:4": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Laporan Jatuh Tempo & Ekspor`, "Laporan JT"),
          rect(114, 42, 536, 48, "#eff6ff", "#93c5fd", 5),
          stepBadge(126, 48, "1", "#1d4ed8"),
          txt(140, 56, "Panel Penyaringan Aktif: Tgl Faktur + Status Jatuh Tempo + Nominal Tagihan", {
            size: 8.6,
            weight: "bold",
            fill: "#1e3a8a",
          }),
          pillBox(128, 64, 112, 18, "Tgl: Bulan Ini", "#dbeafe", "#1e40af", "#93c5fd", 7.8),
          pillBox(248, 64, 116, 18, "Status: Lewat JT", "#ffedd5", "#9a3412", "#fdba74", 7.8),
          pillBox(372, 64, 134, 18, "Nominal: > Rp 500rb", "#dcfce7", "#166534", "#86efac", 7.8),

          arrowDown(382, 92, 108, "#2563eb"),

          rect(114, 110, 536, 78, "#ffffff", "#cbd5e1", 5),
          stepBadge(126, 116, "2", "#059669"),
          txt(140, 124, "Pilih Format Ekspor Laporan Sesuai Kebutuhan:", {
            size: 8.8,
            weight: "bold",
            fill: "#0f172a",
          }),
          pillBox(128, 136, 122, 38, "Export Excel", "#15803d", "#ffffff", undefined, 9),
          txt(189, 166, "Baris lewat JT = Merah", { size: 7.2, fill: "#dcfce7", anchor: "middle" }),
          pillBox(260, 136, 122, 38, "Export Pembayaran", "#0369a1", "#ffffff", undefined, 8.6),
          txt(321, 166, "Detail cicilan masuk", { size: 7.2, fill: "#e0f2fe", anchor: "middle" }),
          pillBox(392, 136, 122, 38, "Export PDF", "#b91c1c", "#ffffff", undefined, 9),
          txt(453, 166, "Kop & Logo resmi", { size: 7.2, fill: "#fee2e2", anchor: "middle" }),
          pillBox(524, 136, 114, 38, "Export TXT", "#334155", "#ffffff", undefined, 9),
          txt(581, 166, "Ringkas WhatsApp", { size: 7.2, fill: "#e2e8f0", anchor: "middle" }),
        ].join("")
      );
    }

    case "alur-kerja:5": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Pengaturan Backup Data`, "Pengaturan"),
          rect(114, 44, 250, 142, "#eff6ff", "#93c5fd", 6, 1.2),
          stepBadge(130, 60, "1", "#1d4ed8"),
          txt(145, 64, "Backup JSON (Lengkap)", { size: 9.8, weight: "bold", fill: "#1e3a8a" }),
          txt(126, 86, "• Seluruh data faktur & konsumen", { size: 8.3, fill: "#334155" }),
          txt(126, 102, "• Riwayat cicilan utuh & pengaturan", { size: 8.3, fill: "#334155" }),
          txt(126, 118, "• Paling aman untuk Restore ulang", { size: 8.3, fill: "#334155" }),
          pillBox(128, 146, 222, 26, "Unduh File Backup (.json)", "#2563eb", "#ffffff", undefined, 8.8),

          rect(384, 44, 266, 142, "#ecfdf5", "#6ee7b7", 6, 1.2),
          stepBadge(400, 60, "2", "#059669"),
          txt(415, 64, "Backup Excel (3 Sheet)", { size: 9.8, weight: "bold", fill: "#065f46" }),
          txt(396, 86, "• Sheet 1: Customers (Konsumen)", { size: 8.3, fill: "#334155" }),
          txt(396, 102, "• Sheet 2: Invoices (Daftar Faktur)", { size: 8.3, fill: "#334155" }),
          txt(396, 118, "• Sheet 3: Payments (Pembayaran)", { size: 8.3, fill: "#334155" }),
          pillBox(398, 146, 238, 26, "Unduh File Backup (.xlsx)", "#059669", "#ffffff", undefined, 8.8),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 3: INPUT FAKTUR & IMPORT EXCEL
    // =========================================================================
    case "input-faktur:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 12, 648, 191, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(16, 12, 648, 26, "#1e3a8a", undefined, 6),
          rect(16, 30, 648, 8, "#1e3a8a"),
          txt(30, 29, "PANDUAN LANGKAH 1-6: INPUT FAKTUR MANUAL", { size: 9.5, weight: "bold", fill: "#ffffff" }),
          stepBadge(38, 56, "1", "#2563eb"),
          txt(54, 60, "Buka Menu Input Faktur", { size: 9.2, weight: "bold", fill: "#1e3a8a" }),

          fieldInput(30, 72, 190, "No. Faktur Penjualan", "INV-001", "2"),
          fieldInput(238, 72, 200, "Nama Konsumen (Dropdown/Baru)", "BD DIAN JATITUJUH", "3"),
          fieldInput(456, 72, 192, "Tanggal Faktur (+JT 30 Hr)", "26/11/2026 -> 26/12/2026", "4"),

          fieldInput(30, 126, 290, "Total Tagihan Faktur (Rupiah)", "Rp 2.450.000", "5"),
          rect(338, 126, 150, 28, "#f1f5f9", "#cbd5e1", 4),
          txt(413, 143, "Status Awal: Belum Lunas", { size: 8.2, fill: "#475569", anchor: "middle" }),

          pillBox(506, 130, 142, 28, "Simpan Faktur", "#2563eb", "#ffffff", undefined, 9.5),
          stepBadge(506, 130, "6", "#ea580c"),

          rect(30, 172, 618, 20, "#eff6ff", "#bfdbfe", 4),
          txt(339, 185.5, "Tips: Nomor faktur harus unik (tidak ganda) dan konsumen baru otomatis tersimpan ke Data Konsumen.", {
            size: 8.2,
            weight: "bold",
            fill: "#1e40af",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "input-faktur:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 12, 648, 191, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(16, 12, 648, 26, "#0f172a", undefined, 6),
          rect(16, 30, 648, 8, "#0f172a"),
          txt(30, 29, "FORMULIR INPUT MASSAL (BANYAK FAKTUR SEKALIGUS)", { size: 9.2, weight: "bold", fill: "#ffffff" }),
          pillBox(532, 16, 120, 18, "+ Tambah Baris", "#3b82f6", "#ffffff", undefined, 8),

          // Table header
          rect(28, 46, 624, 20, "#f1f5f9", "#cbd5e1", 3),
          txt(38, 59, "#", { size: 8, weight: "bold" }),
          txt(64, 59, "No. Faktur", { size: 8, weight: "bold" }),
          txt(178, 59, "Nama Konsumen", { size: 8, weight: "bold" }),
          txt(348, 59, "Tgl Faktur", { size: 8, weight: "bold" }),
          txt(442, 59, "Jatuh Tempo", { size: 8, weight: "bold" }),
          txt(536, 59, "Total (Rp)", { size: 8, weight: "bold" }),

          // Rows
          ...[
            ["1", "INV-201", "BD DIAN JATITUJUH", "26/11/2026", "26/12/2026", "Rp 499.048"],
            ["2", "INV-202", "APT ASSIFA CIPEUNDEUY", "26/11/2026", "26/12/2026", "Rp 1.109.370"],
            ["3", "INV-203", "TOKO SEHAT MAKMUR", "26/11/2026", "26/12/2026", "Rp 850.000"],
          ]
            .map((row, idx) => {
              const ry = 70 + idx * 27;
              return [
                rect(28, ry, 624, 24, "#ffffff", "#e2e8f0", 3),
                txt(38, ry + 15, row[0], { size: 8.2, weight: "bold", fill: "#2563eb" }),
                txt(64, ry + 15, row[1], { size: 8.4, weight: "bold" }),
                txt(178, ry + 15, row[2], { size: 8.4 }),
                txt(348, ry + 15, row[3], { size: 8.2, fill: "#475569" }),
                txt(442, ry + 15, row[4], { size: 8.2, fill: "#475569" }),
                txt(536, ry + 15, row[5], { size: 8.4, weight: "bold", fill: "#059669" }),
              ].join("");
            })
            .join(""),

          pillBox(468, 162, 184, 26, "Simpan Semua Faktur (3 Baris)", "#059669", "#ffffff", undefined, 8.8),
          stepBadge(468, 162, "v", "#1d4ed8"),
          txt(30, 178, "Efisien untuk rekapitulasi puluhan nota penjualan harian dalam satu kali simpan.", {
            size: 8.3,
            fill: "#475569",
          }),
        ].join("")
      );
    }

    case "input-faktur:2": {
      const steps = [
        { x: 20, n: "1", c: "#1d4ed8", t: "Klik Import Excel", d: "Buka halaman Input", d2: "Faktur -> Import Excel" },
        { x: 185, n: "2", c: "#059669", t: "Unduh Template", d: "Gunakan kolom baku:", d2: "No, Toko, Tgl, JT, Total" },
        { x: 350, n: "3", c: "#d97706", t: "Isi Data di Excel", d: "Format tanggal", d2: "YYYY-MM-DD / standar" },
        { x: 515, n: "4", c: "#7c3aed", t: "Upload & Simpan", d: "Seluruh faktur masuk", d2: "otomatis ke sistem" },
      ];
      return wrapSvg(
        "#f8fafc",
        [
          ...steps.map((s, idx) =>
            [
              rect(s.x, 22, 145, 118, "#ffffff", "#cbd5e1", 6, 1.2),
              rect(s.x, 22, 145, 26, s.c, undefined, 6),
              rect(s.x, 40, 145, 8, s.c),
              stepBadge(s.x + 18, 35, s.n, "#0f172a"),
              txt(s.x + 34, 39, s.t, { size: 8.6, weight: "bold", fill: "#ffffff" }),
              txt(s.x + 12, 72, s.d, { size: 8.3, fill: "#334155" }),
              txt(s.x + 12, 87, s.d2, { size: 8.3, weight: "bold", fill: "#0f172a" }),
              pillBox(s.x + 12, 108, 121, 20, `Tahap ${s.n}`, "#f1f5f9", s.c, "#cbd5e1", 8),
              idx < 3 ? arrowRight(s.x + 147, 81, s.x + 163, "#2563eb") : "",
            ].join("")
          ),
          // Template preview bar
          rect(20, 152, 640, 46, "#ecfdf5", "#6ee7b7", 5),
          txt(32, 168, "Contoh Urutan Kolom Template Excel Resmi:", { size: 8.4, weight: "bold", fill: "#065f46" }),
          pillBox(32, 174, 110, 18, "A: No. Faktur", "#ffffff", "#065f46", "#a7f3d0", 7.8),
          pillBox(148, 174, 130, 18, "B: Nama Konsumen", "#ffffff", "#065f46", "#a7f3d0", 7.8),
          pillBox(284, 174, 120, 18, "C: Tgl (YYYY-MM-DD)", "#ffffff", "#065f46", "#a7f3d0", 7.8),
          pillBox(410, 174, 118, 18, "D: Jatuh Tempo", "#ffffff", "#065f46", "#a7f3d0", 7.8),
          pillBox(534, 174, 114, 18, "E: Total Nominal", "#ffffff", "#065f46", "#a7f3d0", 7.8),
        ].join("")
      );
    }

    case "input-faktur:3": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Riwayat Faktur & Total Tagihan`, "Riwayat Faktur"),
          // Tabs
          pillBox(114, 40, 106, 20, "Daftar Faktur", "#1e3a8a", "#ffffff", undefined, 8.2),
          pillBox(224, 40, 146, 20, "Total per Konsumen", "#eff6ff", "#1e3a8a", "#93c5fd", 8.2),
          stepBadge(224, 40, "1", "#ea580c"),
          pillBox(512, 40, 138, 20, "Export Excel 2 Sheet", "#15803d", "#ffffff", undefined, 8),
          stepBadge(512, 40, "4", "#059669"),

          // Filter bar
          rect(114, 66, 536, 30, "#f8fafc", "#cbd5e1", 4),
          stepBadge(122, 70, "2", "#2563eb"),
          pillBox(134, 72, 60, 18, "Hari Ini", "#ffffff", "#334155", "#cbd5e1", 7.5),
          pillBox(198, 72, 62, 18, "Bulan Ini", "#2563eb", "#ffffff", undefined, 7.5),
          pillBox(264, 72, 70, 18, "Semua Waktu", "#ffffff", "#334155", "#cbd5e1", 7.5),
          pillBox(342, 72, 144, 18, "Dropdown Konsumen v", "#ffffff", "#334155", "#cbd5e1", 7.5),
          stepBadge(342, 72, "3", "#7c3aed"),
          pillBox(492, 72, 148, 18, "Status: Semua Status v", "#ffffff", "#334155", "#cbd5e1", 7.5),

          // Table with badge
          rect(114, 104, 536, 86, "#ffffff", "#cbd5e1", 4),
          rect(114, 104, 536, 20, "#f1f5f9", "#cbd5e1", 3),
          txt(124, 117, "Faktur & Konsumen", { size: 8, weight: "bold" }),
          txt(330, 117, "Lencana Akumulasi", { size: 8, weight: "bold" }),
          txt(486, 117, "Nilai Faktur", { size: 8, weight: "bold" }),

          txt(124, 142, "INV-011 · BD DIAN JATITUJUH", { size: 8.4, weight: "bold" }),
          pillBox(330, 130, 136, 18, "Total Tagihan: Rp 4,2jt", "#dbeafe", "#1e40af", "#93c5fd", 7.6),
          txt(486, 142, "Rp 499.048", { size: 8.4, weight: "bold" }),

          line(120, 156, 642, 156, "#e2e8f0", 1),
          txt(124, 174, "INV-012 · APT ASSIFA CIPEUNDEUY", { size: 8.4, weight: "bold" }),
          pillBox(330, 162, 136, 18, "Total Tagihan: Rp 3,8jt", "#dbeafe", "#1e40af", "#93c5fd", 7.6),
          txt(486, 174, "Rp 1.109.370", { size: 8.4, weight: "bold" }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 4: PENCATATAN PEMBAYARAN & CICILAN
    // =========================================================================
    case "pembayaran-faktur:0": {
      return wrapSvg(
        "#f8fafc",
        [
          // Left: Table Row
          rect(16, 16, 270, 183, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(28, 34, "1-3. Pilih Faktur di Riwayat", { size: 9, weight: "bold", fill: "#1e3a8a" }),
          rect(28, 44, 246, 24, "#f1f5f9", "#cbd5e1", 4),
          txt(38, 59, "Cari: INV-2026 / Nama Toko...", { size: 8, fill: "#64748b" }),
          rect(28, 78, 246, 62, "#f8fafc", "#cbd5e1", 4),
          txt(38, 95, "INV-088 · TOKO BERKAH", { size: 8.8, weight: "bold" }),
          txt(38, 110, "Sisa Tagihan: Rp 1.500.000", { size: 8.3, fill: "#dc2626", weight: "bold" }),
          pillBox(182, 108, 82, 22, "Bayar", "#16a34a", "#ffffff", undefined, 8.8),
          stepBadge(182, 108, "3", "#ea580c"),
          txt(38, 164, "Klik tombol hijau [Bayar] pada", { size: 8, fill: "#475569" }),
          txt(38, 177, "baris faktur yang ingin dilunasi.", { size: 8, fill: "#475569" }),

          arrowRight(290, 108, 316, "#16a34a"),

          // Right: Modal Konfirmasi
          rect(322, 16, 342, 183, "#ffffff", "#16a34a", 6, 1.4),
          rect(322, 16, 342, 26, "#15803d", undefined, 6),
          rect(322, 34, 342, 8, "#15803d"),
          txt(336, 33, "4-6. KONFIRMASI PEMBAYARAN FAKTUR", { size: 9, weight: "bold", fill: "#ffffff" }),
          fieldInput(336, 52, 150, "Tanggal Penerimaan", "26/11/2026", "4", "#16a34a"),
          fieldInput(498, 52, 152, "Nominal Diterima (Rp)", "Rp 1.500.000"),
          pillBox(336, 110, 146, 26, "Bayar Lunas (100%)", "#0f172a", "#ffffff", undefined, 8.4),
          stepBadge(336, 110, "5", "#d97706"),
          pillBox(494, 110, 156, 26, "Konfirmasi Pembayaran", "#16a34a", "#ffffff", undefined, 8.4),
          stepBadge(494, 110, "6", "#1d4ed8"),
          rect(336, 150, 314, 36, "#ecfdf5", "#a7f3d0", 4),
          txt(493, 166, "Saldo faktur langsung terpotong & status", { size: 8, weight: "bold", fill: "#065f46", anchor: "middle" }),
          txt(493, 179, "berubah menjadi Lunas / Sebagian.", { size: 8, fill: "#065f46", anchor: "middle" }),
        ].join("")
      );
    }

    case "pembayaran-faktur:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(16, 14, 648, 26, "#1e3a8a", undefined, 6),
          rect(16, 32, 648, 8, "#1e3a8a"),
          txt(30, 31, "RINCIAN RIWAYAT CICILAN FAKTUR INV-088 (TOTAL: Rp 3.000.000)", { size: 9, weight: "bold", fill: "#ffffff" }),
          pillBox(542, 18, 110, 18, "Tombol: Riwayat", "#3b82f6", "#ffffff", undefined, 8),
          stepBadge(542, 18, "1", "#ea580c"),

          // Timeline rows
          rect(32, 52, 616, 34, "#f8fafc", "#e2e8f0", 4),
          stepBadge(52, 69, "1", "#16a34a"),
          txt(72, 66, "Setoran Pertama · 05/11/2026", { size: 9, weight: "bold" }),
          txt(72, 79, "Dibayar: Rp 1.000.000", { size: 8.4, weight: "bold", fill: "#059669" }),
          txt(634, 72, "Sisa Tagihan: Rp 2.000.000", { size: 8.6, weight: "bold", fill: "#d97706", anchor: "end" }),

          rect(32, 94, 616, 34, "#f8fafc", "#e2e8f0", 4),
          stepBadge(52, 111, "2", "#16a34a"),
          txt(72, 108, "Setoran Kedua · 15/11/2026", { size: 9, weight: "bold" }),
          txt(72, 121, "Dibayar: Rp 1.250.000", { size: 8.4, weight: "bold", fill: "#059669" }),
          txt(634, 114, "Sisa Tagihan: Rp 750.000", { size: 8.6, weight: "bold", fill: "#d97706", anchor: "end" }),

          rect(32, 136, 616, 34, "#ecfdf5", "#6ee7b7", 4),
          stepBadge(52, 153, "3", "#059669"),
          txt(72, 150, "Pelunasan Akhir · 26/11/2026", { size: 9, weight: "bold", fill: "#065f46" }),
          txt(72, 163, "Dibayar: Rp 750.000", { size: 8.4, weight: "bold", fill: "#059669" }),
          pillBox(540, 143, 96, 20, "LUNAS (Rp 0)", "#059669", "#ffffff", undefined, 8.2),

          txt(340, 190, "Setiap tahap cicilan mencatat tanggal bayar, nominal setoran, serta sisa piutang secara kronologis.", {
            size: 8.2,
            fill: "#475569",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "pembayaran-faktur:2": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 224, 183, "#ffffff", "#fca5a5", 6, 1.2),
          stepBadge(34, 34, "1", "#dc2626"),
          txt(50, 38, "Pilih Baris Keliru", { size: 9.2, weight: "bold", fill: "#991b1b" }),
          rect(28, 52, 200, 52, "#fef2f2", "#fecaca", 4),
          txt(38, 70, "26/11/2026 · Rp 5.000.000", { size: 8.4, weight: "bold", fill: "#7f1d1d" }),
          txt(38, 84, "(Salah ketik nol berlebih)", { size: 7.8, fill: "#b91c1c" }),
          pillBox(166, 74, 54, 20, "Hapus", "#dc2626", "#ffffff", undefined, 7.8),
          txt(28, 126, "Klik ikon tempat sampah pada", { size: 8.2, fill: "#475569" }),
          txt(28, 140, "jendela Riwayat Pembayaran", { size: 8.2, fill: "#475569" }),
          txt(28, 154, "faktur yang salah input.", { size: 8.2, fill: "#475569" }),

          arrowRight(244, 106, 266, "#dc2626"),

          rect(270, 16, 184, 183, "#fffbeb", "#fcd34d", 6, 1.2),
          stepBadge(288, 34, "2", "#d97706"),
          txt(304, 38, "Hitung Ulang Otomatis", { size: 9.2, weight: "bold", fill: "#92400e" }),
          txt(282, 72, "Sistem menghapus setoran", { size: 8.4, fill: "#78350f" }),
          txt(282, 87, "keliru dan mengembalikan:", { size: 8.4, fill: "#78350f" }),
          pillBox(284, 106, 156, 24, "Sisa Tagihan Pulih", "#ffffff", "#b45309", "#fcd34d", 8.2),
          pillBox(284, 138, 156, 24, "Status Faktur Disesuaikan", "#ffffff", "#b45309", "#fcd34d", 8),

          arrowRight(458, 106, 480, "#059669"),

          rect(484, 16, 180, 183, "#ecfdf5", "#6ee7b7", 6, 1.2),
          stepBadge(502, 34, "3", "#059669"),
          txt(518, 38, "Input Ulang Benar", { size: 9.2, weight: "bold", fill: "#065f46" }),
          fieldInput(496, 58, 156, "Nominal Seharusnya", "Rp 500.000", undefined, "#059669"),
          pillBox(496, 122, 156, 24, "Simpan Nominal Benar", "#059669", "#ffffff", undefined, 8.2),
          txt(496, 168, "Pembukuan kembali akurat.", { size: 8.2, weight: "bold", fill: "#065f46" }),
        ].join("")
      );
    }

    case "pembayaran-faktur:3": {
      return wrapSvg(
        "#f8fafc",
        [
          appWindow(16, 12, 648, 191, `${safeComp} — Riwayat Pembayaran Terpusat`, "Riwayat Bayar"),
          pillBox(114, 40, 124, 20, "Riwayat Transaksi", "#eff6ff", "#1e3a8a", "#93c5fd", 8),
          stepBadge(114, 40, "1", "#2563eb"),
          pillBox(242, 40, 136, 20, "Total per Konsumen", "#1e3a8a", "#ffffff", undefined, 8),
          stepBadge(242, 40, "2", "#059669"),
          pillBox(510, 40, 140, 20, "Export Excel 2 Sheet", "#15803d", "#ffffff", undefined, 7.8),
          stepBadge(510, 40, "6", "#d97706"),

          // Filter row
          rect(114, 66, 536, 28, "#f8fafc", "#cbd5e1", 4),
          pillBox(122, 71, 148, 18, "Periode: Dari - Sampai", "#dbeafe", "#1e40af", "#93c5fd", 7.4),
          stepBadge(122, 71, "3", "#2563eb"),
          pillBox(276, 71, 174, 18, "[v] Hanya yang Membayar di Rentang", "#ecfdf5", "#065f46", "#6ee7b7", 7.2),
          stepBadge(276, 71, "4", "#059669"),
          pillBox(456, 71, 186, 18, "Cari / Pilih Konsumen v", "#ffffff", "#334155", "#cbd5e1", 7.4),
          stepBadge(456, 71, "5", "#7c3aed"),

          // Period Table
          rect(114, 102, 536, 86, "#ffffff", "#cbd5e1", 4),
          rect(114, 102, 536, 20, "#f1f5f9", "#cbd5e1", 3),
          txt(124, 115, "Nama Konsumen", { size: 8, weight: "bold" }),
          txt(300, 115, "Setoran Periode Ini", { size: 8, weight: "bold", fill: "#059669" }),
          txt(440, 115, "Frekuensi", { size: 8, weight: "bold" }),
          txt(525, 115, "Pembanding All-time", { size: 8, weight: "bold", fill: "#475569" }),

          txt(124, 140, "BD DIAN JATITUJUH", { size: 8.4, weight: "bold" }),
          txt(300, 140, "Rp 2.400.000", { size: 8.6, weight: "bold", fill: "#059669" }),
          txt(455, 140, "3x bayar", { size: 8.2 }),
          txt(525, 140, "All-time: Rp 9.850.000", { size: 8, fill: "#64748b" }),
          line(120, 152, 642, 152, "#e2e8f0", 1),
          txt(124, 170, "APT ASSIFA CIPEUNDEUY", { size: 8.4, weight: "bold" }),
          txt(300, 170, "Rp 1.850.000", { size: 8.6, weight: "bold", fill: "#059669" }),
          txt(455, 170, "2x bayar", { size: 8.2 }),
          txt(525, 170, "All-time: Rp 7.120.000", { size: 8, fill: "#64748b" }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 5: LAPORAN, FILTER FLEKSIBEL & EXPORT EXCEL
    // =========================================================================
    case "laporan-dan-export:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 648, 183, "#eff6ff", "#93c5fd", 8, 1.5),
          pillBox(30, 28, 224, 22, "PANEL FILTER TANGGAL FAKTUR", "#1d4ed8", "#ffffff", undefined, 8.6),
          fieldInput(30, 62, 184, "Tanggal Terbit Dari", "01/11/2026", "1", "#1d4ed8"),
          fieldInput(232, 62, 184, "Tanggal Terbit Sampai", "30/11/2026", "2", "#1d4ed8"),
          txt(434, 66, "Tombol Pintasan Cepat:", { size: 8.4, weight: "bold", fill: "#1e3a8a" }),
          pillBox(434, 75, 102, 22, "Hari Ini", "#ffffff", "#1e3a8a", "#93c5fd", 8.4),
          pillBox(544, 75, 104, 22, "Bulan Ini", "#2563eb", "#ffffff", undefined, 8.4),
          stepBadge(544, 75, "3", "#d97706"),
          rect(30, 126, 618, 56, "#ffffff", "#bfdbfe", 5),
          txt(44, 146, "Hasil Penyaringan Langsung:", { size: 9, weight: "bold", fill: "#1e3a8a" }),
          txt(44, 165, "Menampilkan hanya faktur yang tanggal penerbitannya berada di dalam rentang 01/11/2026 s.d. 30/11/2026.", {
            size: 8.6,
            fill: "#334155",
          }),
        ].join("")
      );
    }

    case "laporan-dan-export:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 648, 183, "#fff7ed", "#fdba74", 8, 1.5),
          pillBox(30, 28, 280, 22, "PANEL FILTER JATUH TEMPO & UMUR PIUTANG", "#ea580c", "#ffffff", undefined, 8.4),
          txt(30, 68, "1. Filter Status Jatuh Tempo:", { size: 9, weight: "bold", fill: "#9a3412" }),
          pillBox(30, 78, 118, 26, "Semua Status", "#ffffff", "#9a3412", "#fdba74", 8.4),
          pillBox(158, 78, 162, 26, "Belum Jatuh Tempo", "#ffffff", "#9a3412", "#fdba74", 8.4),
          pillBox(330, 78, 178, 26, "Sudah Lewat Jatuh Tempo", "#dc2626", "#ffffff", undefined, 8.4),
          stepBadge(330, 78, "1", "#0f172a"),

          txt(30, 126, "2. Klasifikasi Umur Piutang (Aging Analysis):", { size: 9, weight: "bold", fill: "#9a3412" }),
          pillBox(30, 138, 190, 32, "Umur 1 - 30 Hari", "#ffedd5", "#9a3412", "#fb923c", 8.8),
          pillBox(234, 138, 190, 32, "Umur 31 - 60 Hari", "#fed7aa", "#9a3412", "#f97316", 8.8),
          pillBox(438, 138, 208, 32, "Lebih dari 60 Hari (> 60 Hr)", "#fee2e2", "#991b1b", "#ef4444", 8.8),
          stepBadge(438, 138, "2", "#dc2626"),
        ].join("")
      );
    }

    case "laporan-dan-export:2": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 648, 183, "#f0fdf4", "#86efac", 8, 1.5),
          pillBox(30, 28, 260, 22, "PANEL FILTER NOMINAL TAGIHAN", "#15803d", "#ffffff", undefined, 8.6),
          txt(306, 42, "Cakupan Filter:", { size: 8.6, weight: "bold", fill: "#166534" }),
          pillBox(390, 28, 108, 22, "Per Faktur", "#ffffff", "#166534", "#86efac", 8.4),
          pillBox(506, 28, 142, 22, "Total per Konsumen", "#16a34a", "#ffffff", undefined, 8.4),
          stepBadge(506, 28, "1", "#1e3a8a"),

          fieldInput(30, 62, 166, "Kondisi Pembanding", "Lebih dari (>)", "2", "#16a34a"),
          fieldInput(212, 62, 210, "Nominal Batas (atau Min - Max)", "Rp 1.000.000", "3", "#16a34a"),

          txt(440, 68, "Preset Sekali Klik:", { size: 8.4, weight: "bold", fill: "#166534" }),
          pillBox(440, 77, 50, 20, "> 500rb", "#ffffff", "#15803d", "#86efac", 7.8),
          pillBox(495, 77, 48, 20, "> 1jt", "#16a34a", "#ffffff", undefined, 7.8),
          pillBox(548, 77, 48, 20, "> 5jt", "#ffffff", "#15803d", "#86efac", 7.8),
          pillBox(601, 77, 48, 20, "< 1jt", "#ffffff", "#15803d", "#86efac", 7.8),

          rect(30, 126, 618, 56, "#ffffff", "#86efac", 5),
          txt(44, 146, "Mode Total per Konsumen:", { size: 9, weight: "bold", fill: "#166534" }),
          txt(44, 165, "Menjumlahkan total sisa tagihan tiap toko lalu menyaring toko yang melebihi batas nominal (misal > Rp 1.000.000).", {
            size: 8.4,
            fill: "#334155",
          }),
        ].join("")
      );
    }

    case "laporan-dan-export:3": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(16, 14, 648, 26, "#15803d", undefined, 6),
          rect(16, 32, 648, 8, "#15803d"),
          txt(30, 31, "STRUKTUR WORKBOOK EXPORT EXCEL & PENANDAAN MERAH JATUH TEMPO", { size: 9, weight: "bold", fill: "#ffffff" }),

          // Excel Sheet Preview
          rect(30, 50, 620, 108, "#ffffff", "#cbd5e1", 4),
          rect(30, 50, 620, 22, "#f1f5f9", "#cbd5e1", 3),
          txt(42, 64, "No. Faktur", { size: 8.2, weight: "bold" }),
          txt(138, 64, "Konsumen", { size: 8.2, weight: "bold" }),
          txt(308, 64, "Jatuh Tempo", { size: 8.2, weight: "bold" }),
          txt(412, 64, "Sisa Tagihan", { size: 8.2, weight: "bold" }),
          txt(526, 64, "Keterangan", { size: 8.2, weight: "bold" }),

          // Overdue RED row
          rect(32, 74, 616, 26, "#fee2e2", "#ef4444", 3, 1.2),
          txt(42, 90, "INV-071", { size: 8.4, weight: "bold", fill: "#991b1b" }),
          txt(138, 90, "BD DIAN JATITUJUH", { size: 8.4, weight: "bold", fill: "#991b1b" }),
          txt(308, 90, "10/11/2026", { size: 8.4, weight: "bold", fill: "#991b1b" }),
          txt(412, 90, "Rp 499.048", { size: 8.4, weight: "bold", fill: "#991b1b" }),
          pillBox(520, 78, 120, 18, "LEWAT JATUH TEMPO", "#dc2626", "#ffffff", undefined, 7.2),

          // Normal row
          rect(32, 104, 616, 24, "#ffffff", "#e2e8f0", 3),
          txt(42, 119, "INV-095", { size: 8.4 }),
          txt(138, 119, "APT ASSIFA CIPEUNDEUY", { size: 8.4 }),
          txt(308, 119, "20/12/2026", { size: 8.4, fill: "#475569" }),
          txt(412, 119, "Rp 1.109.370", { size: 8.4, weight: "bold" }),
          pillBox(520, 107, 120, 18, "Belum Jatuh Tempo", "#ecfdf5", "#065f46", "#a7f3d0", 7.4),

          // Sheet Tabs
          pillBox(34, 134, 134, 20, "Sheet 1: Rekap Utama", "#ffffff", "#15803d", "#86efac", 7.6),
          pillBox(174, 134, 170, 20, "Sheet 2: Per Tgl Jatuh Tempo", "#15803d", "#ffffff", undefined, 7.6),
          pillBox(350, 134, 166, 20, "Sheet 3: Khusus Konsumen*", "#eff6ff", "#1e3a8a", "#93c5fd", 7.6),

          txt(340, 182, "Faktur yang melewati batas jatuh tempo otomatis diberi latar & teks merah tegas agar mudah diprioritaskan.", {
            size: 8.3,
            weight: "bold",
            fill: "#991b1b",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "laporan-dan-export:4": {
      return wrapSvg(
        "#f8fafc",
        [
          // Card 1: Excel Pembayaran
          rect(16, 16, 204, 183, "#ffffff", "#93c5fd", 6, 1.3),
          rect(16, 16, 204, 34, "#0369a1", undefined, 6),
          rect(16, 40, 204, 10, "#0369a1"),
          stepBadge(36, 33, "1", "#0f172a"),
          txt(52, 37, "Export Pembayaran", { size: 9.5, weight: "bold", fill: "#ffffff" }),
          txt(28, 70, "Berkas Excel (.xlsx)", { size: 9, weight: "bold", fill: "#0369a1" }),
          txt(28, 88, "Berisi rincian lengkap", { size: 8.3, fill: "#475569" }),
          txt(28, 102, "riwayat setiap cicilan", { size: 8.3, fill: "#475569" }),
          txt(28, 116, "per faktur beserta tanggal", { size: 8.3, fill: "#475569" }),
          txt(28, 130, "dan sisa saldo.", { size: 8.3, fill: "#475569" }),
          pillBox(28, 160, 180, 24, "Arsip Audit Arus Kas", "#e0f2fe", "#0369a1", "#7dd3fc", 8.2),

          // Card 2: Export PDF
          rect(238, 16, 204, 183, "#ffffff", "#fca5a5", 6, 1.3),
          rect(238, 16, 204, 34, "#b91c1c", undefined, 6),
          rect(238, 40, 204, 10, "#b91c1c"),
          stepBadge(258, 33, "2", "#0f172a"),
          txt(274, 37, "Export PDF Resmi", { size: 9.5, weight: "bold", fill: "#ffffff" }),
          rect(254, 62, 172, 86, "#f8fafc", "#cbd5e1", 4),
          rect(254, 62, 172, 20, "#1e3a8a", undefined, 3),
          txt(340, 75, "KOP & LOGO PERUSAHAAN", { size: 7.4, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          txt(264, 96, "Laporan Jatuh Tempo", { size: 8, weight: "bold" }),
          line(264, 104, 412, 104, "#cbd5e1"),
          line(264, 114, 412, 114, "#cbd5e1"),
          line(264, 124, 380, 124, "#cbd5e1"),
          pillBox(250, 160, 180, 24, "Dokumen Siap Cetak A4", "#fee2e2", "#991b1b", "#fca5a5", 8.2),

          // Card 3: Export TXT
          rect(460, 16, 204, 183, "#ffffff", "#94a3b8", 6, 1.3),
          rect(460, 16, 204, 34, "#1e293b", undefined, 6),
          rect(460, 40, 204, 10, "#1e293b"),
          stepBadge(480, 33, "3", "#16a34a"),
          txt(496, 37, "Export TXT (WhatsApp)", { size: 9.2, weight: "bold", fill: "#ffffff" }),
          rect(474, 62, 176, 86, "#f1f5f9", "#cbd5e1", 4),
          txt(482, 80, "Format Ringkasan TXT:", { size: 7.8, weight: "bold", fill: "#334155" }),
          txt(482, 98, "- BD DIAN JATITUJUH", { size: 8, weight: "bold", fill: "#0f172a" }),
          txt(490, 111, "Rp 499.048", { size: 8, weight: "bold", fill: "#059669" }),
          txt(482, 126, "- APT ASSIFA CIPEUNDEUY", { size: 8, weight: "bold", fill: "#0f172a" }),
          txt(490, 139, "Rp 1.109.370", { size: 8, weight: "bold", fill: "#059669" }),
          pillBox(472, 160, 180, 24, "Salin & Kirim ke WhatsApp", "#dcfce7", "#166534", "#86efac", 8.2),
        ].join("")
      );
    }

    case "laporan-dan-export:5": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          // Store Group Header
          rect(28, 24, 624, 24, "#eff6ff", "#93c5fd", 4),
          txt(40, 39, "BD DIAN JATITUJUH (2 Faktur Terpilih)", { size: 8.8, weight: "bold", fill: "#1e3a8a" }),
          txt(640, 39, "Akumulasi Sisa: Rp 1.608.418", { size: 8.8, weight: "bold", fill: "#dc2626", anchor: "end" }),
          stepBadge(640, 24, "4", "#1d4ed8"),

          // Checked rows
          rect(28, 54, 624, 26, "#f8fafc", "#cbd5e1", 3),
          rect(38, 60, 14, 14, "#2563eb", undefined, 3),
          txt(45, 70, "v", { size: 8.5, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          txt(62, 70, "INV-011 · Awal Rp 800.000 · Terbayar Rp 300.952", { size: 8.2 }),
          txt(640, 70, "Sisa: Rp 499.048", { size: 8.4, weight: "bold", fill: "#dc2626", anchor: "end" }),

          rect(28, 84, 624, 26, "#f8fafc", "#cbd5e1", 3),
          rect(38, 90, 14, 14, "#2563eb", undefined, 3),
          txt(45, 100, "v", { size: 8.5, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          txt(62, 100, "INV-015 · Awal Rp 1.109.370 · Terbayar Rp 0", { size: 8.2 }),
          txt(640, 100, "Sisa: Rp 1.109.370", { size: 8.4, weight: "bold", fill: "#dc2626", anchor: "end" }),

          // Floating Bottom Action Bar
          rect(28, 128, 624, 60, "#0f172a", undefined, 6),
          stepBadge(46, 142, "1", "#2563eb"),
          txt(62, 145, "Total Sisa Ceklis:", { size: 8, fill: "#94a3b8" }),
          txt(62, 162, "Rp 1.608.418", { size: 11.5, weight: "bold", fill: "#38bdf8" }),

          stepBadge(214, 142, "2", "#059669"),
          txt(230, 145, "Faktur Awal / Terbayar:", { size: 8, fill: "#94a3b8" }),
          txt(230, 162, "Rp 1.909.370 / Rp 300.952", { size: 9, weight: "bold", fill: "#e2e8f0" }),

          stepBadge(398, 142, "3", "#d97706"),
          txt(414, 145, "Terpilih:", { size: 8, fill: "#94a3b8" }),
          txt(414, 162, "2 Faktur", { size: 9.5, weight: "bold", fill: "#fbbf24" }),

          pillBox(514, 142, 124, 30, "Bayar Terpilih (Massal)", "#16a34a", "#ffffff", undefined, 8.2),
        ].join("")
      );
    }

    case "laporan-dan-export:6": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 20, 648, 175, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(32, 42, "KONTROL PAGINASI DI SETIAP HALAMAN TABEL DATA", { size: 9.5, weight: "bold", fill: "#1e3a8a" }),
          txt(32, 58, "(Tersedia di Riwayat Faktur, Riwayat Pembayaran, Data Konsumen, dan Laporan Jatuh Tempo)", {
            size: 8.2,
            fill: "#64748b",
          }),

          rect(32, 74, 616, 56, "#f8fafc", "#cbd5e1", 5),
          txt(46, 98, "Tampilkan per Halaman:", { size: 8.8, weight: "bold", fill: "#334155" }),
          pillBox(178, 84, 38, 24, "10", "#2563eb", "#ffffff", undefined, 8.5),
          pillBox(222, 84, 38, 24, "20", "#ffffff", "#334155", "#cbd5e1", 8.5),
          pillBox(266, 84, 38, 24, "50", "#ffffff", "#334155", "#cbd5e1", 8.5),
          pillBox(310, 84, 42, 24, "100", "#ffffff", "#334155", "#cbd5e1", 8.5),
          pillBox(358, 84, 54, 24, "Semua", "#ffffff", "#334155", "#cbd5e1", 8.2),
          stepBadge(178, 84, "1", "#ea580c"),

          pillBox(454, 84, 30, 24, "<", "#ffffff", "#334155", "#cbd5e1", 9),
          pillBox(488, 84, 30, 24, "1", "#1e3a8a", "#ffffff", undefined, 8.8),
          pillBox(522, 84, 30, 24, "2", "#ffffff", "#334155", "#cbd5e1", 8.8),
          pillBox(556, 84, 30, 24, "3", "#ffffff", "#334155", "#cbd5e1", 8.8),
          pillBox(590, 84, 30, 24, ">", "#ffffff", "#334155", "#cbd5e1", 9),
          stepBadge(522, 84, "2", "#059669"),

          rect(32, 144, 616, 36, "#fffbeb", "#fde68a", 4),
          txt(340, 165, "Saran: Gunakan 10 atau 20 baris saat mengakses dari ponsel agar pengguliran tetap ringan dan responsif.", {
            size: 8.3,
            weight: "bold",
            fill: "#92400e",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 6: MANAJEMEN KONSUMEN & OPSI PISAH SHEET
    // =========================================================================
    case "data-konsumen:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(16, 14, 648, 26, "#1e3a8a", undefined, 6),
          rect(16, 32, 648, 8, "#1e3a8a"),
          txt(30, 31, "TAMBAH & UBAH DATA PROFIL KONSUMEN", { size: 9.2, weight: "bold", fill: "#ffffff" }),
          fieldInput(32, 54, 290, "Nama Toko / Pelanggan", "APT ASSIFA CIPEUNDEUY", "1"),
          fieldInput(344, 54, 302, "Nomor Telepon / WhatsApp Aktif", "0813-9876-5432", "2"),
          fieldInput(32, 108, 430, "Alamat Pengiriman Lengkap", "Jl. Pasar Cipeundeuy Blok B No. 8", "3"),
          pillBox(480, 122, 166, 28, "Simpan Data Konsumen", "#2563eb", "#ffffff", undefined, 8.8),
          stepBadge(480, 122, "4", "#059669"),
          txt(32, 178, "Menu: Data Konsumen -> Klik [Tambah Konsumen] atau ikon [Edit] pada daftar toko.", {
            size: 8.3,
            fill: "#475569",
          }),
        ].join("")
      );
    }

    case "data-konsumen:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 20, 290, 175, "#ffffff", "#93c5fd", 6, 1.3),
          stepBadge(34, 38, "1", "#2563eb"),
          txt(50, 42, "Aktifkan Pada Profil Konsumen", { size: 9.2, weight: "bold", fill: "#1e3a8a" }),
          rect(30, 58, 260, 44, "#eff6ff", "#bfdbfe", 5),
          rect(42, 71, 16, 16, "#2563eb", undefined, 3),
          txt(50, 82.5, "v", { size: 9.5, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          txt(66, 77, "Pisahkan Sheet saat Export Excel", { size: 8.6, weight: "bold", fill: "#0f172a" }),
          txt(66, 90, "(Khusus pelanggan prioritas)", { size: 7.6, fill: "#475569" }),
          txt(30, 126, "Setiap Export Excel diunduh, sistem", { size: 8.2, fill: "#475569" }),
          txt(30, 141, "otomatis membuat tab tersendiri", { size: 8.2, fill: "#475569" }),
          txt(30, 156, "berisi daftar faktur toko tersebut.", { size: 8.2, fill: "#475569" }),

          arrowRight(312, 108, 342, "#15803d"),

          rect(348, 20, 316, 175, "#ffffff", "#86efac", 6, 1.3),
          stepBadge(366, 38, "2", "#15803d"),
          txt(382, 42, "Hasil Workbook Excel (.xlsx)", { size: 9.2, weight: "bold", fill: "#166534" }),
          rect(364, 58, 284, 88, "#f8fafc", "#cbd5e1", 4),
          txt(376, 78, "Daftar Faktur: BD DIAN JATITUJUH", { size: 8.6, weight: "bold", fill: "#0f172a" }),
          line(376, 86, 636, 86, "#cbd5e1"),
          txt(376, 102, "• INV-011  |  26/10/2026  |  Rp 499.048", { size: 8.2, fill: "#334155" }),
          txt(376, 118, "• INV-019  |  12/11/2026  |  Rp 750.000", { size: 8.2, fill: "#334155" }),
          txt(376, 134, "Total Piutang Toko: Rp 1.249.048", { size: 8.2, weight: "bold", fill: "#15803d" }),
          pillBox(364, 156, 72, 22, "Rekap", "#e2e8f0", "#475569", undefined, 7.6),
          pillBox(440, 156, 100, 22, "BD DIAN *", "#16a34a", "#ffffff", undefined, 7.6),
          pillBox(544, 156, 104, 22, "APT ASSIFA *", "#1d4ed8", "#ffffff", undefined, 7.6),
        ].join("")
      );
    }

    case "data-konsumen:2": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 20, 648, 175, "#ffffff", "#cbd5e1", 6, 1.2),
          rect(32, 34, 300, 146, "#f8fafc", "#cbd5e1", 6),
          txt(46, 54, "KARTU KONTAK KONSUMEN", { size: 8.6, weight: "bold", fill: "#1e3a8a" }),
          txt(46, 76, "APT ASSIFA CIPEUNDEUY", { size: 10.5, weight: "bold", fill: "#0f172a" }),
          txt(46, 94, "Telp / WA: 0813-9876-5432", { size: 9, weight: "bold", fill: "#059669" }),
          txt(46, 112, "Alamat: Jl. Raya Cipeundeuy No. 8", { size: 8.3, fill: "#475569" }),
          pillBox(46, 136, 126, 26, "Hubungi Telepon", "#2563eb", "#ffffff", undefined, 8.2),
          pillBox(182, 136, 136, 26, "Chat WhatsApp", "#16a34a", "#ffffff", undefined, 8.2),

          arrowRight(338, 108, 366, "#16a34a"),

          rect(372, 34, 276, 146, "#ecfdf5", "#6ee7b7", 6),
          txt(386, 56, "Tindak Lanjut Penagihan Cepat", { size: 9.2, weight: "bold", fill: "#065f46" }),
          txt(386, 78, "1. Cek faktur mendekati jatuh tempo", { size: 8.4, fill: "#334155" }),
          txt(386, 97, "2. Lihat nomor WA tersimpan di profil", { size: 8.4, fill: "#334155" }),
          txt(386, 116, "3. Kirim konfirmasi + ringkasan TXT", { size: 8.4, fill: "#334155" }),
          pillBox(386, 136, 248, 26, "Penagihan Lebih Sopan & Tepat Waktu", "#059669", "#ffffff", undefined, 8.2),
        ].join("")
      );
    }

    case "data-konsumen:3": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 648, 183, "#ffffff", "#cbd5e1", 6, 1.2),
          // 1. Search Box
          fieldInput(32, 26, 286, "1. Kotak Pencarian Bebas", "Cari: dian / utang / lunas / sheet", "1"),
          // 3. Sort
          fieldInput(334, 26, 210, "3. Pengurutan Data", "Sisa Utang Terbesar (v)", "3", "#7c3aed"),
          pillBox(558, 40, 90, 22, "Reset Filter", "#f1f5f9", "#334155", "#cbd5e1", 8),

          // 2. Filter Chips
          txt(32, 92, "2. Tombol Filter Cepat Status Konsumen:", { size: 8.6, weight: "bold", fill: "#1e3a8a" }),
          pillBox(32, 100, 128, 24, "Semua (24 Toko)", "#ffffff", "#334155", "#cbd5e1", 8),
          pillBox(168, 100, 138, 24, "Ada Utang (14)", "#fee2e2", "#991b1b", "#ef4444", 8),
          stepBadge(168, 100, "2", "#dc2626"),
          pillBox(314, 100, 124, 24, "Lunas (10)", "#dcfce7", "#166534", "#86efac", 8),
          pillBox(446, 100, 202, 24, "Pisah Sheet Excel (6)", "#dbeafe", "#1e40af", "#93c5fd", 8),

          // 4. Grafik & Tren Quick Switch
          rect(32, 138, 616, 46, "#f8fafc", "#cbd5e1", 5),
          stepBadge(48, 152, "4", "#059669"),
          txt(64, 156, "Pencarian Pada Tab Grafik & Tren:", { size: 8.6, weight: "bold", fill: "#065f46" }),
          txt(64, 172, "Tersedia kotak pencarian konsumen cepat untuk berpindah data antar toko serta pencarian pada tabel matriks.", {
            size: 8.2,
            fill: "#475569",
          }),
        ].join("")
      );
    }

    case "data-konsumen:4": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(30, 34, "GRAFIK PERBANDINGAN FAKTUR, PEMBAYARAN & UTANG BULANAN (MoM)", { size: 9, weight: "bold", fill: "#1e3a8a" }),
          pillBox(460, 20, 62, 18, "6 Bulan", "#2563eb", "#ffffff", undefined, 7.6),
          pillBox(526, 20, 62, 18, "12 Bulan", "#f1f5f9", "#334155", "#cbd5e1", 7.6),
          pillBox(592, 20, 56, 18, "Semua", "#f1f5f9", "#334155", "#cbd5e1", 7.6),

          // Legend
          rect(30, 44, 10, 10, "#2563eb", undefined, 2),
          txt(44, 53, "Faktur Baru", { size: 7.8 }),
          rect(104, 44, 10, 10, "#10b981", undefined, 2),
          txt(118, 53, "Pembayaran", { size: 7.8 }),
          rect(186, 44, 10, 10, "#ef4444", undefined, 2),
          txt(200, 53, "Sisa Utang Timbul", { size: 7.8 }),

          // Chart Area
          rect(30, 62, 340, 124, "#f8fafc", "#e2e8f0", 5),
          line(46, 162, 356, 162, "#94a3b8", 1.2),
          // Jan Bars: 5jt, 3jt, 2jt
          rect(76, 92, 24, 70, "#2563eb", undefined, 2),
          rect(104, 120, 24, 42, "#10b981", undefined, 2),
          rect(132, 134, 24, 28, "#ef4444", undefined, 2),
          txt(116, 176, "Januari (5jt / 3jt / 2jt)", { size: 7.6, weight: "bold", fill: "#334155", anchor: "middle" }),
          // Feb Bars: 6jt, 4jt, 2jt
          rect(224, 78, 24, 84, "#2563eb", undefined, 2),
          rect(252, 106, 24, 56, "#10b981", undefined, 2),
          rect(280, 134, 24, 28, "#ef4444", undefined, 2),
          txt(264, 176, "Februari (6jt / 4jt / 2jt)", { size: 7.6, weight: "bold", fill: "#334155", anchor: "middle" }),

          // Right Table MoM
          rect(384, 62, 266, 124, "#ffffff", "#cbd5e1", 5),
          rect(384, 62, 266, 22, "#1e3a8a", undefined, 4),
          txt(394, 76, "Tabel Rincian MoM & Rasio", { size: 8.2, weight: "bold", fill: "#ffffff" }),
          txt(394, 100, "Jan: Faktur 5jt | Bayar 3jt (60%)", { size: 8, fill: "#334155" }),
          txt(394, 117, "Feb: Faktur 6jt | Bayar 4jt (67%)", { size: 8, fill: "#334155" }),
          line(394, 128, 638, 128, "#e2e8f0"),
          txt(394, 144, "Pertumbuhan Setoran MoM:", { size: 8, weight: "bold", fill: "#059669" }),
          txt(394, 159, "+Rp 1.000.000 (+33.3%)", { size: 9.2, weight: "bold", fill: "#059669" }),
          txt(394, 176, "Mode: Konsolidasi / Per Konsumen", { size: 7.6, fill: "#64748b" }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 7: BACKUP, RESTORE & PEMELIHARAAN DATA
    // =========================================================================
    case "backup-restore:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 304, 183, "#eff6ff", "#93c5fd", 7, 1.3),
          stepBadge(36, 36, "1", "#1d4ed8"),
          txt(54, 40, "Metode 1: Backup JSON", { size: 10, weight: "bold", fill: "#1e3a8a" }),
          txt(32, 66, "• Format mentah arsip penuh (.json)", { size: 8.4, fill: "#334155" }),
          txt(32, 84, "• Menyimpan seluruh konsumen & faktur", { size: 8.4, fill: "#334155" }),
          txt(32, 102, "• Menyimpan detail tiap transaksi cicilan", { size: 8.4, fill: "#334155" }),
          pillBox(32, 128, 272, 26, "Klik [Backup JSON] -> Simpan ke Drive", "#2563eb", "#ffffff", undefined, 8.2),
          txt(168, 174, "Disarankan rutin setiap akhir pekan", { size: 7.8, weight: "bold", fill: "#1e40af", anchor: "middle" }),

          rect(340, 16, 324, 183, "#ecfdf5", "#6ee7b7", 7, 1.3),
          stepBadge(360, 36, "2", "#059669"),
          txt(378, 40, "Metode 2: Backup Excel (3 Sheet)", { size: 10, weight: "bold", fill: "#065f46" }),
          pillBox(356, 60, 292, 22, "Sheet 1: Customers (Data Konsumen)", "#ffffff", "#065f46", "#a7f3d0", 8),
          pillBox(356, 86, 292, 22, "Sheet 2: Invoices (Data Faktur)", "#ffffff", "#065f46", "#a7f3d0", 8),
          pillBox(356, 112, 292, 22, "Sheet 3: Payments (Riwayat Bayar)", "#ffffff", "#065f46", "#a7f3d0", 8),
          pillBox(356, 146, 292, 26, "Klik [Backup Excel] -> File .xlsx", "#059669", "#ffffff", undefined, 8.2),
        ].join("")
      );
    }

    case "backup-restore:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 18, 200, 128, "#ffffff", "#93c5fd", 6, 1.2),
          stepBadge(34, 36, "1", "#2563eb"),
          txt(50, 40, "Menu Pengaturan", { size: 9.2, weight: "bold", fill: "#1e3a8a" }),
          pillBox(30, 62, 172, 24, "Klik [Restore JSON]", "#2563eb", "#ffffff", undefined, 8.4),
          pillBox(30, 94, 172, 24, "Klik [Restore Excel]", "#059669", "#ffffff", undefined, 8.4),

          arrowRight(220, 84, 242, "#2563eb"),

          rect(246, 18, 194, 128, "#ffffff", "#cbd5e1", 6, 1.2),
          stepBadge(264, 36, "2", "#d97706"),
          txt(280, 40, "Pilih File Cadangan", { size: 9.2, weight: "bold", fill: "#92400e" }),
          rect(260, 62, 166, 56, "#f8fafc", "#cbd5e1", 4),
          txt(343, 86, "backup_faktur_2026.json", { size: 8.2, weight: "bold", fill: "#0f172a", anchor: "middle" }),
          txt(343, 102, "atau .xlsx dari perangkat", { size: 7.8, fill: "#64748b", anchor: "middle" }),

          arrowRight(444, 84, 466, "#059669"),

          rect(470, 18, 194, 128, "#ecfdf5", "#6ee7b7", 6, 1.2),
          stepBadge(488, 36, "3", "#059669"),
          txt(504, 40, "Konfirmasi & Pulih", { size: 9.2, weight: "bold", fill: "#065f46" }),
          pillBox(484, 62, 166, 26, "Konfirmasi Restore", "#059669", "#ffffff", undefined, 8.4),
          txt(567, 108, "Seluruh faktur & cicilan", { size: 8.2, fill: "#065f46", anchor: "middle" }),
          txt(567, 122, "otomatis dimuat ulang.", { size: 8.2, fill: "#065f46", anchor: "middle" }),

          rect(16, 158, 648, 38, "#fef3c7", "#f59e0b", 5, 1.2),
          txt(340, 181, "PERHATIAN: Proses Restore akan menggantikan seluruh data yang sedang aktif pada perangkat ini.", {
            size: 8.6,
            weight: "bold",
            fill: "#92400e",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "backup-restore:2": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 20, 278, 175, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(30, 42, "SEBELUM PENYERAGAMAN", { size: 8.8, weight: "bold", fill: "#64748b" }),
          rect(30, 56, 250, 32, "#f8fafc", "#e2e8f0", 4),
          txt(40, 75, "INV-01  Tgl: 01/11 -> JT: 10/11 (9 hr)", { size: 8.2 }),
          rect(30, 96, 250, 32, "#f8fafc", "#e2e8f0", 4),
          txt(40, 115, "INV-02  Tgl: 05/11 -> JT: 20/11 (15 hr)", { size: 8.2 }),
          rect(30, 136, 250, 32, "#f8fafc", "#e2e8f0", 4),
          txt(40, 155, "INV-03  Tgl: 10/11 -> JT: 25/12 (45 hr)", { size: 8.2 }),

          arrowRight(298, 108, 376, "#2563eb"),
          pillBox(298, 72, 78, 22, "Reset JT", "#2563eb", "#ffffff", undefined, 8),

          rect(380, 20, 284, 175, "#eff6ff", "#93c5fd", 6, 1.3),
          txt(394, 42, "SESUDAH (+30 HARI SERAGAM)", { size: 8.8, weight: "bold", fill: "#1e3a8a" }),
          rect(394, 56, 256, 32, "#ffffff", "#93c5fd", 4),
          txt(404, 75, "INV-01  Tgl: 01/11 -> JT: 01/12 (+30 hr)", { size: 8.2, weight: "bold", fill: "#1e40af" }),
          rect(394, 96, 256, 32, "#ffffff", "#93c5fd", 4),
          txt(404, 115, "INV-02  Tgl: 05/11 -> JT: 05/12 (+30 hr)", { size: 8.2, weight: "bold", fill: "#1e40af" }),
          rect(394, 136, 256, 32, "#ffffff", "#93c5fd", 4),
          txt(404, 155, "INV-03  Tgl: 10/11 -> JT: 10/12 (+30 hr)", { size: 8.2, weight: "bold", fill: "#1e40af" }),
        ].join("")
      );
    }

    case "backup-restore:3": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 18, 648, 179, "#fef2f2", "#ef4444", 7, 1.5),
          pillBox(32, 30, 240, 22, "ZONA BERBAHAYA · RESET SEMUA DATA", "#dc2626", "#ffffff", undefined, 8.2),

          rect(32, 66, 192, 110, "#ffffff", "#93c5fd", 5, 1.2),
          stepBadge(50, 84, "1", "#2563eb"),
          txt(66, 88, "Wajib Backup Dahulu", { size: 8.8, weight: "bold", fill: "#1e3a8a" }),
          txt(44, 112, "Unduh Backup JSON &", { size: 8.2, fill: "#334155" }),
          txt(44, 126, "Excel sebelum menghapus", { size: 8.2, fill: "#334155" }),
          txt(44, 140, "seluruh arsip aktif.", { size: 8.2, fill: "#334155" }),

          arrowRight(228, 120, 248, "#dc2626"),

          rect(252, 66, 192, 110, "#ffffff", "#fca5a5", 5, 1.2),
          stepBadge(270, 84, "2", "#dc2626"),
          txt(286, 88, "Klik Reset Semua", { size: 8.8, weight: "bold", fill: "#991b1b" }),
          pillBox(266, 110, 164, 24, "Reset Semua Data", "#dc2626", "#ffffff", undefined, 8.4),
          txt(348, 152, "Di bagian bawah Pengaturan", { size: 7.8, fill: "#64748b", anchor: "middle" }),

          arrowRight(448, 120, 468, "#dc2626"),

          rect(472, 66, 176, 110, "#ffffff", "#fca5a5", 5, 1.2),
          stepBadge(490, 84, "3", "#991b1b"),
          txt(506, 88, "Pembukuan Kosong", { size: 8.8, weight: "bold", fill: "#991b1b" }),
          txt(484, 112, "Semua faktur, bayar,", { size: 8.2, fill: "#334155" }),
          txt(484, 126, "dan konsumen terhapus", { size: 8.2, fill: "#334155" }),
          txt(484, 140, "untuk mulai dari nol.", { size: 8.2, fill: "#334155" }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 8: MODE MOBILE & PWA
    // =========================================================================
    case "mobile-pwa:0": {
      return wrapSvg(
        "#f8fafc",
        [
          // Phone Frame
          rect(260, 10, 160, 195, "#0f172a", "#334155", 16, 2),
          rect(270, 22, 140, 170, "#ffffff", undefined, 10),
          rect(318, 14, 44, 5, "#334155", undefined, 2.5),
          rect(270, 22, 140, 22, "#1e3a8a", undefined, 6),
          txt(340, 36, safeComp, { size: 8, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          rect(278, 50, 124, 34, "#eff6ff", "#93c5fd", 4),
          txt(286, 62, "TOTAL PIUTANG", { size: 6.5, weight: "bold", fill: "#1d4ed8" }),
          txt(286, 76, "Rp 48.250.000", { size: 9, weight: "bold", fill: "#0f172a" }),
          rect(278, 90, 60, 32, "#ecfdf5", "#6ee7b7", 4),
          txt(308, 104, "Lunas", { size: 6.8, fill: "#065f46", anchor: "middle" }),
          txt(308, 116, "42", { size: 9.5, weight: "bold", fill: "#059669", anchor: "middle" }),
          rect(342, 90, 60, 32, "#fef2f2", "#fca5a5", 4),
          txt(372, 104, "Lewat JT", { size: 6.8, fill: "#991b1b", anchor: "middle" }),
          txt(372, 116, "5", { size: 9.5, weight: "bold", fill: "#dc2626", anchor: "middle" }),
          rect(278, 128, 124, 34, "#f8fafc", "#e2e8f0", 4),
          rect(294, 142, 16, 16, "#2563eb"),
          rect(318, 136, 16, 22, "#10b981"),
          rect(342, 145, 16, 13, "#f59e0b"),
          rect(366, 149, 16, 9, "#ef4444"),
          rect(270, 170, 140, 22, "#f1f5f9"),
          txt(340, 184, "Dash · Input · Riwayat · Lap", { size: 6.6, weight: "bold", fill: "#1e3a8a", anchor: "middle" }),

          // Side annotations
          rect(24, 44, 212, 46, "#ffffff", "#93c5fd", 5),
          stepBadge(40, 60, "1", "#1d4ed8"),
          txt(56, 64, "Tanpa Guliran Panjang", { size: 8.8, weight: "bold", fill: "#1e3a8a" }),
          txt(36, 80, "Statistik utama tampil penuh 1 layar.", { size: 8, fill: "#475569" }),
          line(236, 68, 268, 68, "#2563eb", 1.4),

          rect(444, 96, 212, 54, "#ffffff", "#6ee7b7", 5),
          stepBadge(460, 112, "2", "#059669"),
          txt(476, 116, "Baca Sekali Pandang", { size: 8.8, weight: "bold", fill: "#065f46" }),
          txt(456, 133, "Total piutang, lunas, & faktur kritis", { size: 8, fill: "#475569" }),
          txt(456, 144, "langsung terpantau dari ponsel.", { size: 8, fill: "#475569" }),
          line(412, 114, 444, 114, "#059669", 1.4),
        ].join("")
      );
    }

    case "mobile-pwa:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 18, 648, 179, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(340, 42, "NAVIGASI BAR BAWAH (BOTTOM NAVBAR) RAMAH SATU TANGAN", {
            size: 9.5,
            weight: "bold",
            fill: "#1e3a8a",
            anchor: "middle",
          }),
          rect(56, 60, 568, 84, "#0f172a", undefined, 10),
          ...[
            { x: 74, n: "1", t: "Dashboard", c: "#3b82f6" },
            { x: 184, n: "2", t: "Input Faktur", c: "#10b981" },
            { x: 294, n: "3", t: "Riwayat", c: "#f59e0b" },
            { x: 404, n: "4", t: "Laporan", c: "#ef4444" },
            { x: 514, n: "5", t: "Menu Lain", c: "#8b5cf6" },
          ]
            .map((b) =>
              [
                rect(b.x, 74, 94, 56, "#1e293b", b.c, 6, 1.2),
                stepBadge(b.x + 47, 94, b.n, b.c),
                txt(b.x + 47, 118, b.t, { size: 8.4, weight: "bold", fill: "#ffffff", anchor: "middle" }),
              ].join("")
            )
            .join(""),
          txt(340, 174, "Ditempatkan di bagian bawah layar ponsel & tablet agar mudah dijangkau dengan ibu jari.", {
            size: 8.4,
            fill: "#475569",
            anchor: "middle",
          }),
        ].join("")
      );
    }

    case "mobile-pwa:2": {
      return wrapSvg(
        "#f8fafc",
        [
          // Android Chrome
          rect(16, 16, 304, 183, "#ecfdf5", "#6ee7b7", 7, 1.3),
          pillBox(30, 28, 276, 24, "ANDROID (BROWSER CHROME)", "#059669", "#ffffff", undefined, 8.8),
          stepBadge(46, 74, "1", "#059669"),
          txt(64, 78, "Buka https://fa-invoice.vercel.app", { size: 8.4, weight: "bold", fill: "#065f46" }),
          stepBadge(46, 104, "2", "#059669"),
          txt(64, 108, "Klik [Install Aplikasi] atau ikon titik tiga (:)", { size: 8.3 }),
          stepBadge(46, 134, "3", "#059669"),
          txt(64, 138, "Pilih [Tambahkan ke Layar Utama]", { size: 8.4, weight: "bold", fill: "#065f46" }),
          pillBox(32, 160, 272, 24, "Ikon Aplikasi Terpasang di Home Screen", "#ffffff", "#065f46", "#6ee7b7", 8),

          // iPhone Safari
          rect(340, 16, 324, 183, "#eff6ff", "#93c5fd", 7, 1.3),
          pillBox(354, 28, 296, 24, "IPHONE / IPAD (BROWSER SAFARI)", "#1d4ed8", "#ffffff", undefined, 8.8),
          stepBadge(372, 74, "1", "#1d4ed8"),
          txt(390, 78, "Buka https://fa-invoice.vercel.app di Safari", { size: 8.4, weight: "bold", fill: "#1e3a8a" }),
          stepBadge(372, 104, "2", "#1d4ed8"),
          txt(390, 108, "Ketuk tombol Share (ikon panah ke atas)", { size: 8.4 }),
          stepBadge(372, 134, "3", "#1d4ed8"),
          txt(390, 138, "Pilih [Add to Home Screen] -> Tambah", { size: 8.4, weight: "bold", fill: "#1e3a8a" }),
          pillBox(356, 160, 292, 24, "Buka Mode Layar Penuh Tanpa Bar Browser", "#ffffff", "#1e3a8a", "#93c5fd", 8),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 9: TEMA 3D, PROFIL & KUSTOMISASI NAVBAR
    // =========================================================================
    case "gaya-navbar:0": {
      const themes = [
        { name: "Modern Clean", c: "#2563eb" },
        { name: "Midnight Slate", c: "#1e293b" },
        { name: "Deep Navy", c: "#1e3a8a" },
        { name: "Emerald Forest", c: "#059669" },
        { name: "Royal Purple", c: "#7c3aed" },
        { name: "Sunset Crimson", c: "#e11d48" },
        { name: "Graphite Minimal", c: "#3f3f46" },
        { name: "Soft Sky", c: "#0284c7" },
      ];
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(340, 36, "PILIHAN 8 TEMA ANTARMUKA BERDIMENSI 3D", { size: 9.8, weight: "bold", fill: "#0f172a", anchor: "middle" }),
          ...themes
            .map((t, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              const x = 32 + col * 156;
              const y = 52 + row * 68;
              return [
                rect(x, y + 4, 144, 54, "#cbd5e1", undefined, 6),
                rect(x, y, 144, 54, "#ffffff", t.c, 6, 1.4),
                `<circle cx="${x + 24}" cy="${y + 27}" r="11" fill="${t.c}"/>`,
                txt(x + 42, y + 25, t.name, { size: 8.6, weight: "bold", fill: "#0f172a" }),
                txt(x + 42, y + 38, "Bevel 3D Aktif", { size: 7.4, fill: t.c }),
              ].join("");
            })
            .join(""),
        ].join("")
      );
    }

    case "gaya-navbar:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#cbd5e1", 6, 1.2),
          // Upload Box
          rect(32, 28, 174, 156, "#eff6ff", "#3b82f6", 6, 1.3),
          stepBadge(48, 44, "1", "#1d4ed8"),
          txt(64, 48, "Upload Logo Toko", { size: 8.8, weight: "bold", fill: "#1e3a8a" }),
          rect(62, 62, 114, 66, "#ffffff", "#93c5fd", 6, 1.2),
          txt(119, 92, "LOGO", { size: 13, weight: "bold", fill: "#2563eb", anchor: "middle" }),
          txt(119, 108, "PNG / JPG / SVG", { size: 7.4, fill: "#64748b", anchor: "middle" }),
          pillBox(46, 142, 146, 22, "Pakai Default / Upload", "#1d4ed8", "#ffffff", undefined, 7.6),

          // Fields
          stepBadge(234, 38, "2", "#059669"),
          txt(250, 42, "Lengkapi Identitas & Kontak Perusahaan", { size: 9.2, weight: "bold", fill: "#065f46" }),
          fieldInput(226, 54, 200, "Nama Perusahaan / Toko", safeComp),
          fieldInput(440, 54, 206, "Tagline Usaha", "Manajemen Faktur & Piutang"),
          fieldInput(226, 104, 200, "No. WA, Email & NPWP", "0812-xxx / NPWP Aktif"),
          pillBox(440, 118, 206, 26, "Simpan Profil Perusahaan", "#059669", "#ffffff", undefined, 8.6),
          stepBadge(440, 118, "3", "#ea580c"),
          txt(226, 172, "Otomatis memperbarui Navbar, Sampul Buku Panduan, dan Kop Laporan PDF.", {
            size: 8.2,
            weight: "bold",
            fill: "#334155",
          }),
        ].join("")
      );
    }

    case "gaya-navbar:2": {
      return wrapSvg(
        "#f8fafc",
        [
          // Normal sidebar
          rect(16, 18, 286, 179, "#ffffff", "#cbd5e1", 6, 1.2),
          txt(30, 38, "MODE SIDEBAR NORMAL", { size: 9, weight: "bold", fill: "#475569" }),
          rect(30, 48, 122, 134, "#0f172a", undefined, 5),
          pillBox(38, 58, 106, 20, "Dashboard", "#2563eb", "#ffffff", undefined, 8),
          txt(46, 94, "Input Faktur", { size: 8, fill: "#cbd5e1" }),
          txt(46, 114, "Riwayat Faktur", { size: 8, fill: "#cbd5e1" }),
          txt(46, 134, "Laporan Jatuh Tempo", { size: 8, fill: "#cbd5e1" }),
          rect(158, 48, 130, 134, "#f8fafc", "#e2e8f0", 4),
          txt(223, 116, "Area Tabel Standar", { size: 8, fill: "#64748b", anchor: "middle" }),

          arrowRight(308, 108, 344, "#2563eb"),
          pillBox(300, 74, 52, 20, "Minimize", "#2563eb", "#ffffff", undefined, 7),

          // Minimized sidebar
          rect(352, 18, 312, 179, "#ffffff", "#3b82f6", 6, 1.3),
          txt(366, 38, "MODE RINGKAS (MINIMIZE 80PX)", { size: 9, weight: "bold", fill: "#1d4ed8" }),
          rect(366, 48, 38, 134, "#0f172a", undefined, 5),
          rect(374, 58, 22, 20, "#2563eb", undefined, 4),
          txt(385, 71, "D", { size: 8, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          rect(374, 86, 22, 20, "#1e293b", undefined, 4),
          rect(374, 114, 22, 20, "#1e293b", undefined, 4),
          pillBox(412, 58, 92, 20, "Tooltip Menu", "#1e293b", "#ffffff", undefined, 7.6),
          rect(412, 48, 238, 134, "#eff6ff", "#93c5fd", 4),
          txt(531, 116, "Area Kerja Tabel Jauh Lebih Lega!", { size: 8.6, weight: "bold", fill: "#1e3a8a", anchor: "middle" }),
        ].join("")
      );
    }

    case "gaya-navbar:3": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 304, 187, "#ffffff", "#93c5fd", 6, 1.2),
          txt(30, 34, "1. TATA LETAK NAVIGASI 3D", { size: 9, weight: "bold", fill: "#1e3a8a" }),
          rect(30, 48, 130, 78, "#f8fafc", "#cbd5e1", 4),
          rect(30, 48, 34, 78, "#0f172a", undefined, 3),
          txt(110, 90, "Sidebar Kiri 3D", { size: 8.2, weight: "bold", fill: "#1e3a8a", anchor: "middle" }),

          rect(174, 48, 132, 78, "#f8fafc", "#cbd5e1", 4),
          rect(174, 48, 132, 20, "#0f172a", undefined, 3),
          txt(240, 94, "Navbar Atas 3D", { size: 8.2, weight: "bold", fill: "#1e3a8a", anchor: "middle" }),

          pillBox(30, 142, 276, 42, "Kustomisasi Bentuk Tombol Menu Navigasi", "#eff6ff", "#1e40af", "#93c5fd", 8.2),

          rect(338, 14, 326, 187, "#ffffff", "#a7f3d0", 6, 1.2),
          txt(354, 34, "2. LIMA GAYA TRANSISI HALAMAN HALUS", { size: 9, weight: "bold", fill: "#065f46" }),
          ...[
            "1. Precision 3D Stage (Dimensi Profesional)",
            "2. Directional Ledger (Geser Buku Kas)",
            "3. 3D Executive Tilt (Kemiringan Elegan)",
            "4. Silk Editorial Veil (Halus Minimalis)",
            "5. Instant Crossfade (Cepat & Ringan)",
          ]
            .map((label, idx) =>
              pillBox(354, 48 + idx * 28, 294, 22, label, idx === 0 ? "#059669" : "#f8fafc", idx === 0 ? "#ffffff" : "#334155", "#cbd5e1", 8)
            )
            .join(""),
        ].join("")
      );
    }

    case "gaya-navbar:4": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 304, 183, "#ffffff", "#93c5fd", 6, 1.2),
          stepBadge(34, 34, "1", "#2563eb"),
          txt(50, 38, "Jam Realtime & Tanggal (8 Gaya)", { size: 9.2, weight: "bold", fill: "#1e3a8a" }),
          rect(32, 54, 272, 74, "#0f172a", undefined, 6),
          txt(168, 86, "14 : 35 : 08 WIB", { size: 17, weight: "bold", fill: "#38bdf8", anchor: "middle" }),
          txt(168, 108, "Kamis, 26 November 2026", { size: 8.6, fill: "#cbd5e1", anchor: "middle" }),
          pillBox(32, 142, 272, 36, "Pilih Gaya Jam di Tab [Gaya Jam] Pengaturan", "#eff6ff", "#1e40af", "#93c5fd", 8),

          rect(340, 16, 324, 183, "#ffffff", "#fcd34d", 6, 1.2),
          stepBadge(358, 34, "2", "#d97706"),
          txt(374, 38, "Pusat Notifikasi Transaksi & Lonceng", { size: 9.2, weight: "bold", fill: "#92400e" }),
          pillBox(578, 24, 72, 20, "Lonceng (3)", "#dc2626", "#ffffff", undefined, 7.8),
          rect(354, 54, 296, 34, "#ecfdf5", "#a7f3d0", 4),
          txt(364, 74, "[+] Pembayaran masuk Rp 499.048 · BD DIAN", { size: 8.2, weight: "bold", fill: "#065f46" }),
          rect(354, 94, 296, 34, "#eff6ff", "#bfdbfe", 4),
          txt(364, 114, "[+] Faktur baru INV-204 · APT ASSIFA", { size: 8.2, weight: "bold", fill: "#1e3a8a" }),
          rect(354, 134, 296, 44, "#fffbeb", "#fde68a", 4),
          txt(502, 160, "Lengkap dengan efek suara lonceng & notifikasi browser.", { size: 8, weight: "bold", fill: "#92400e", anchor: "middle" }),
        ].join("")
      );
    }

    // =========================================================================
    // BAB 10: TENTANG APLIKASI, HAK CIPTA & DENUDA
    // =========================================================================
    case "tentang-developer:0": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#0f172a", "#1e3a8a", 8, 1.5),
          pillBox(246, 28, 188, 20, "PENGEMBANG RESMI SISTEM", "#1e3a8a", "#93c5fd", "#3b82f6", 8),
          txt(340, 80, "DENUDA", { size: 28, weight: "bold", fill: "#ffffff", anchor: "middle" }),
          rect(280, 88, 86, 3, "#2563eb"),
          rect(370, 88, 30, 3, "#f59e0b"),
          txt(340, 108, "Perancang & Pengembang Solusi Digital Manajemen Faktur dan Piutang", {
            size: 9.2,
            weight: "bold",
            fill: "#cbd5e1",
            anchor: "middle",
          }),
          txt(340, 124, "Tautan Akses Resmi: https://fa-invoice.vercel.app", {
            size: 9,
            weight: "bold",
            fill: "#fbbf24",
            anchor: "middle",
          }),
          pillBox(62, 138, 174, 38, "Kecepatan Kerja Tinggi", "#1e293b", "#38bdf8", "#334155", 8.6),
          pillBox(254, 138, 174, 38, "Presisi Perhitungan 100%", "#1e293b", "#34d399", "#334155", 8.6),
          pillBox(446, 138, 174, 38, "Pembukuan Harian Praktis", "#1e293b", "#fbbf24", "#334155", 8.6),
        ].join("")
      );
    }

    case "tentang-developer:1": {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 14, 648, 187, "#ffffff", "#1e3a8a", 8, 2),
          rect(24, 22, 632, 171, "#f8fafc", "#cbd5e1", 5, 1),
          pillBox(224, 34, 232, 22, "PERLINDUNGAN HAK CIPTA RESMI", "#0f172a", "#fbbf24", undefined, 8.6),
          txt(340, 84, "Hak Cipta © 2026 Denuda · All Rights Reserved", {
            size: 14,
            weight: "bold",
            fill: "#0f172a",
            anchor: "middle",
          }),
          txt(340, 108, "Seluruh komponen berikut dilindungi undang-undang hak cipta resmi:", {
            size: 8.8,
            fill: "#475569",
            anchor: "middle",
          }),
          pillBox(44, 126, 188, 44, "Tata Letak & UI 3D", "#eff6ff", "#1e3a8a", "#93c5fd", 8.6),
          pillBox(246, 126, 188, 44, "Arsitektur Data & Ekspor", "#ecfdf5", "#065f46", "#6ee7b7", 8.6),
          pillBox(448, 126, 188, 44, "Formula Hitung Piutang", "#fffbeb", "#92400e", "#fcd34d", 8.6),
        ].join("")
      );
    }

    case "tentang-developer:2":
    default: {
      return wrapSvg(
        "#f8fafc",
        [
          rect(16, 16, 206, 183, "#ffffff", "#93c5fd", 6, 1.3),
          stepBadge(34, 34, "1", "#2563eb"),
          txt(50, 38, "Teknologi Web Modern", { size: 9, weight: "bold", fill: "#1e3a8a" }),
          pillBox(30, 56, 178, 22, "React 19 + TypeScript", "#eff6ff", "#1e40af", "#bfdbfe", 8),
          pillBox(30, 84, 178, 22, "Tailwind CSS Modern", "#eff6ff", "#1e40af", "#bfdbfe", 8),
          pillBox(30, 112, 178, 22, "Progressive Web App", "#eff6ff", "#1e40af", "#bfdbfe", 8),
          pillBox(30, 140, 178, 22, "SheetJS Excel & jsPDF", "#eff6ff", "#1e40af", "#bfdbfe", 8),

          arrowRight(226, 108, 250, "#059669"),

          rect(254, 16, 186, 183, "#ecfdf5", "#6ee7b7", 6, 1.3),
          stepBadge(272, 34, "2", "#059669"),
          txt(288, 38, "Privasi Lokal Aman", { size: 9, weight: "bold", fill: "#065f46" }),
          txt(268, 70, "Data transaksi tersimpan", { size: 8.4, fill: "#334155" }),
          txt(268, 86, "langsung di perangkat Anda.", { size: 8.4, fill: "#334155" }),
          txt(268, 106, "Akses instan, cepat, dan", { size: 8.4, fill: "#334155" }),
          txt(268, 122, "kendali penuh di tangan", { size: 8.4, fill: "#334155" }),
          txt(268, 138, "pengelola usaha.", { size: 8.4, fill: "#334155" }),

          arrowRight(444, 108, 468, "#d97706"),

          rect(472, 16, 192, 183, "#fffbeb", "#fcd34d", 6, 1.3),
          stepBadge(490, 34, "3", "#d97706"),
          txt(506, 38, "Portabel & Terjaga", { size: 9, weight: "bold", fill: "#92400e" }),
          pillBox(486, 62, 164, 28, "Backup / Restore JSON", "#ffffff", "#92400e", "#fcd34d", 8.2),
          pillBox(486, 98, 164, 28, "Backup / Restore Excel", "#ffffff", "#92400e", "#fcd34d", 8.2),
          txt(568, 152, "Mudah dipindahkan ke", { size: 8.2, fill: "#78350f", anchor: "middle" }),
          txt(568, 166, "komputer atau HP baru.", { size: 8.2, fill: "#78350f", anchor: "middle" }),
        ].join("")
      );
    }
  }
}

export function getStepIllustrationDataUrl(
  sectionId: string,
  stepIndex: number,
  companyName?: string
): string {
  const svg = buildStepIllustrationSvg(sectionId, stepIndex, companyName);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function renderStepIllustrationPngDataUrl(
  sectionId: string,
  stepIndex: number,
  companyName?: string
): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const svg = buildStepIllustrationSvg(sectionId, stepIndex, companyName);
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), 2000);

    img.onload = () => {
      window.clearTimeout(timer);
      try {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = SVG_WIDTH * scale;
        canvas.height = SVG_HEIGHT * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };

    img.src = dataUri;
  });
}
