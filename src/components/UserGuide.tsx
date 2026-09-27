import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  FilePlus,
  CreditCard,
  PieChart,
  FileSpreadsheet,
  Database,
  Smartphone,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Maximize2,
  X,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

interface GuideSection {
  id: string;
  category: "alur" | "faktur" | "konsumen" | "laporan" | "backup" | "mobile";
  title: string;
  summary: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  faq?: { q: string; a: string }[];
}

const GUIDE_DATA: GuideSection[] = [
  {
    id: "alur-kerja",
    category: "alur",
    title: "1. Alur Singkat Penggunaan Aplikasi",
    summary: "Panduan cepat memahami bagaimana seluruh fitur AF Faktur saling terhubung dari awal hingga akhir.",
    steps: [
      {
        title: "Langkah 1: Daftarkan Konsumen (Opsional namun Disarankan)",
        description: "Buka menu 'Data Konsumen'. Tambahkan nama toko/pelanggan Anda beserta nomor telepon dan alamat. Anda juga bisa mengatur agar konsumen tertentu otomatis dibuatkan sheet terpisah saat Export Excel.",
        tip: "Jika Anda langsung menginput faktur, konsumen baru akan otomatis tersimpan dalam daftar."
      },
      {
        title: "Langkah 2: Input Faktur Penjualan",
        description: "Buka menu 'Input Faktur'. Masukkan nomor faktur, pilih konsumen, tentukan tanggal faktur, tanggal jatuh tempo (otomatis 30 hari atau custom), dan total nominal tagihan. Anda juga dapat melakukan input banyak faktur sekaligus atau Import dari file Excel.",
        tip: "Pastikan nomor faktur tidak ganda agar data pembayaran tetap akurat."
      },
      {
        title: "Langkah 3: Pantau Status di Dashboard",
        description: "Dashboard memberikan ringkasan instan mengenai total piutang, faktur yang sudah lunas, faktur yang belum lunas, dan peringatan faktur yang telah melewati tanggal jatuh tempo.",
        tip: "Pada layar smartphone/HP, Dashboard otomatis beralih ke mode minimalis yang pas dalam 1 layar."
      },
      {
        title: "Langkah 4: Catat Pembayaran / Pelunasan",
        description: "Saat konsumen membayar (baik cicilan sebagian maupun lunas penuh), buka 'Riwayat Faktur', klik tombol 'Bayar' pada faktur yang bersangkutan, masukkan tanggal pembayaran dan nominal yang diterima.",
        tip: "Faktur akan otomatis berubah status menjadi 'Sebagian' jika belum lunas, atau 'Lunas' jika sudah tercapai 100%."
      },
      {
        title: "Langkah 5: Ekspor Laporan & Rekapitulasi",
        description: "Buka menu 'Laporan Jatuh Tempo' untuk memfilter data berdasarkan Tanggal Faktur atau Tanggal Jatuh Tempo, lalu unduh laporan dalam format Excel Rekap, Excel Pembayaran, atau PDF.",
        tip: "Pada sheet per tanggal jatuh tempo di Excel, faktur yang telah lewat jatuh tempo otomatis ditandai dengan warna merah."
      },
      {
        title: "Langkah 6: Backup Rutin Data Anda",
        description: "Di menu 'Pengaturan', lakukan Backup Data ke file JSON atau Excel secara berkala agar arsip tagihan Anda selalu aman.",
      }
    ]
  },
  {
    id: "input-faktur",
    category: "faktur",
    title: "2. Input Faktur & Import File Excel",
    summary: "Cara menambahkan faktur baru secara manual, massal, ataupun mengunggah file spreadsheet Excel.",
    steps: [
      {
        title: "Input Faktur Manual",
        description: "1. Klik menu 'Input Faktur'.\n2. Masukkan Nomor Faktur (contoh: INV-001).\n3. Pilih nama konsumen dari daftar dropdown atau ketik nama baru.\n4. Pilih Tanggal Faktur. Tanggal Jatuh Tempo akan otomatis terisi 30 hari ke depan (dapat diubah sesuai kesepakatan).\n5. Masukkan Total Tagihan Faktur (Rp).\n6. Klik 'Simpan Faktur'.",
      },
      {
        title: "Input Massal (Banyak Faktur Sekaligus)",
        description: "Gunakan form multi-baris pada halaman Input Faktur untuk memasukkan beberapa faktur sekaligus tanpa harus menekan simpan berulang-ulang. Setelah semua baris terisi, klik 'Simpan Semua Faktur'.",
        tip: "Sangat cocok untuk merekap faktur di akhir hari kerja."
      },
      {
        title: "Import Faktur dari File Excel",
        description: "1. Pada halaman Input Faktur, klik tombol 'Import Excel'.\n2. Unduh template Excel yang telah disediakan untuk melihat struktur kolom yang benar (No Faktur, Nama Konsumen, Tgl Faktur, Jatuh Tempo, Total).\n3. Masukkan data faktur Anda ke file Excel tersebut lalu simpan.\n4. Upload kembali file Excel. Aplikasi akan membaca dan menyimpan seluruh faktur secara instan.",
        tip: "Pastikan format tanggal di Excel adalah tahun-bulan-hari (YYYY-MM-DD) atau format tanggal standar Excel."
      }
    ],
    faq: [
      {
        q: "Bagaimana jika nomor faktur sudah pernah digunakan?",
        a: "Aplikasi akan memberi peringatan jika terdapat duplikasi nomor faktur untuk mencegah kesalahan pencatatan piutang."
      },
      {
        q: "Apakah tanggal jatuh tempo harus 30 hari?",
        a: "Tidak, nilai 30 hari hanyalah default praktis. Anda bebas memilih tanggal jatuh tempo berapa pun pada pemilih tanggal (date picker)."
      }
    ]
  },
  {
    id: "pembayaran-faktur",
    category: "faktur",
    title: "3. Pencatatan Pembayaran & Riwayat Cicilan",
    summary: "Cara mencatat uang masuk, pembayaran cicilan berkala, hingga melihat riwayat pelunasan.",
    steps: [
      {
        title: "Mencatat Pembayaran Baru",
        description: "1. Masuk ke menu 'Riwayat Faktur'.\n2. Cari faktur melalui kolom pencarian atau filter status.\n3. Klik tombol hijau 'Bayar' pada baris faktur.\n4. Masukkan tanggal penerimaan uang dan jumlah nominal yang dibayarkan.\n5. Tersedia tombol cepat 'Bayar Lunas' jika konsumen langsung melunasi seluruh sisa tagihan.\n6. Klik 'Konfirmasi Pembayaran'.",
      },
      {
        title: "Melihat Rincian Riwayat Pembayaran",
        description: "1. Pada faktur yang memiliki cicilan, klik tombol 'Riwayat' atau klik pada status pembayaran.\n2. Modal akan menampilkan daftar setiap pembayaran: tanggal setor, nominal yang dibayar, dan sisa tagihan per tahap.",
      },
      {
        title: "Membatalkan / Menghapus Salah Catat Pembayaran",
        description: "Jika Anda salah memasukkan nominal atau tanggal pembayaran, buka modal 'Riwayat Pembayaran' pada faktur tersebut, lalu klik ikon tempat sampah (Hapus) pada transaksi pembayaran yang salah. Sisa saldo dan status faktur akan otomatis dihitung ulang kembali ke kondisi semula.",
        tip: "Hanya hapus riwayat pembayaran jika terjadi kekeliruan input."
      },
      {
        title: "Menu Terpusat: Riwayat Pembayaran",
        description: "Gunakan menu navigasi 'Riwayat Pembayaran' untuk melihat rekapitulasi semua penerimaan kas yang masuk dari berbagai faktur dalam rentang waktu tertentu.",
      }
    ]
  },
  {
    id: "laporan-dan-export",
    category: "laporan",
    title: "4. Laporan, Filter Fleksibel & Export Excel",
    summary: "Panduan menyaring data berdasarkan tanggal faktur, jatuh tempo, serta mencetak atau mengekspor ke Excel & PDF.",
    steps: [
      {
        title: "Filter Berdasarkan Tanggal Faktur",
        description: "Pada menu 'Laporan Jatuh Tempo', gunakan panel Filter Tanggal Faktur (warna biru lembut). Anda dapat memasukkan rentang tanggal 'Dari' dan 'Sampai', atau menekan tombol pintas 'Bulan Ini' dan 'Hari Ini'.",
        tip: "Filter ini membatasi rekap hanya untuk faktur yang diterbitkan pada rentang tanggal tertentu."
      },
      {
        title: "Filter Berdasarkan Jatuh Tempo & Umur Faktur",
        description: "Gunakan panel Filter Jatuh Tempo (warna oranye lembut). Anda bisa memilih: Semua, Belum Jatuh Tempo, Sudah Lewat Jatuh Tempo, atau berdasarkan kelompok umur piutang (misal: 1-30 hari, 31-60 hari, >60 hari).",
      },
      {
        title: "Tanda Warna Merah pada Export Excel",
        description: "Saat Anda menekan 'Export Excel', file spreadsheet yang dihasilkan berisi:\n- Sheet Rekap Utama.\n- Sheet per Tanggal Jatuh Tempo (data yang telah melewati tanggal jatuh tempo otomatis ditandai dengan sorotan teks dan latar merah tebal agar mudah diprioritaskan untuk penagihan).\n- Sheet khusus per Konsumen (jika opsi pisah sheet aktif).",
        tip: "Warna merah memudahkan tim penagih fokus pada faktur yang sudah terlambat."
      },
      {
        title: "Export Pembayaran & Export PDF",
        description: "Klik tombol 'Export Pembayaran' untuk mendapatkan file Excel rincian seluruh pembayaran per faktur. Atau klik 'Export PDF' untuk mencetak laporan ringkas siap cetak/kirim ke manajemen.",
      }
    ]
  },
  {
    id: "data-konsumen",
    category: "konsumen",
    title: "5. Manajemen Konsumen & Opsi Pisah Sheet",
    summary: "Mengelola database toko pelanggan dan mengatur pemisahan sheet Excel per pelanggan.",
    steps: [
      {
        title: "Menambah & Mengubah Data Konsumen",
        description: "Buka menu 'Data Konsumen'. Klik 'Tambah Konsumen' untuk memasukkan Nama Toko/Pelanggan, Nomor WhatsApp/Telepon, dan Alamat Pengiriman.",
      },
      {
        title: "Fitur 'Pisah Sheet Saat Export'",
        description: "Aktifkan centang 'Pisahkan Sheet saat Export Excel' pada konsumen-konsumen besar/prioritas. Ketika Anda mengunduh laporan Excel, aplikasi akan secara otomatis membuatkan tab worksheet tersendiri khusus untuk konsumen tersebut berisi seluruh daftarnya.",
        tip: "Fitur ini sangat menghemat waktu ketika Anda perlu mengirimkan kartu piutang ke masing-masing toko pelanggan."
      },
      {
        title: "Hubungi Langsung via Telepon/WhatsApp",
        description: "Nomor telepon yang tersimpan pada data konsumen memudahkan Anda untuk langsung menghubungi atau menagih konsumen terkait faktur yang mendekati jatuh tempo.",
      }
    ]
  },
  {
    id: "backup-restore",
    category: "backup",
    title: "6. Backup, Restore & Pemeliharaan Data",
    summary: "Mengamankan data tagihan Anda, memindahkan data antar perangkat, dan mereset data.",
    steps: [
      {
        title: "Backup Data (JSON & Excel)",
        description: "Pada menu 'Pengaturan', Anda memiliki 2 opsi backup:\n1. Backup JSON: Menyimpan seluruh struktur data mentah lengkap dengan riwayat pembayaran.\n2. Backup Excel: Menyimpan data dalam format lembar kerja Excel 3 sheet (Customers, Invoices, Payments).",
        tip: "Disarankan melakukan Backup JSON secara teratur (misalnya setiap akhir pekan) dan menyimpannya di Google Drive atau flashdisk."
      },
      {
        title: "Restore / Pulihkan Data",
        description: "Jika Anda ingin memulihkan data lama atau memindahkan data ke komputer/HP lain:\n1. Di menu Pengaturan, klik 'Restore JSON' atau 'Restore Excel'.\n2. Pilih file cadangan dari perangkat Anda.\n3. Konfirmasi pemulihan data.",
        tip: "Peringatan: Melakukan restore akan menimpa data yang sedang aktif di aplikasi."
      },
      {
        title: "Reset Tanggal Jatuh Tempo",
        description: "Jika Anda ingin menyeragamkan seluruh faktur yang ada agar jatuh tempo tepat 30 hari dari tanggal fakturnya, gunakan tombol 'Reset Tanggal Jatuh Tempo'.",
      },
      {
        title: "Reset Semua Data (Danger Zone)",
        description: "Tombol ini digunakan hanya jika Anda ingin mengosongkan aplikasi secara total dan memulai pembukuan dari nol. Selalu lakukan Backup terlebih dahulu sebelum menekan tombol ini.",
      }
    ]
  },
  {
    id: "mobile-pwa",
    category: "mobile",
    title: "7. Mode Mobile & Pemasangan Aplikasi (PWA)",
    summary: "Kemudahan penggunaan di layar smartphone dan cara menginstal sebagai aplikasi mandiri di HP.",
    steps: [
      {
        title: "Dashboard Minimalis 1 Layar Penuh",
        description: "Pada layar HP, dashboard tampil ringkas tanpa perlu scroll panjang. Kartu saldo, statistik tagihan, dan grafik ditampilkan dalam ukuran padat dan mudah dipahami dalam sekali pandang.",
      },
      {
        title: "Navigasi Bar Bawah (Bottom Navbar)",
        description: "Pada perangkat HP/tablet, menu utama dipindahkan ke bagian bawah layar (Dashboard, Input Faktur, Riwayat, Laporan, dan Menu Lainnya) sehingga mudah dijangkau dengan ibu jari satu tangan.",
      },
      {
        title: "Pasang Aplikasi di Layar Utama HP (Install PWA)",
        description: "Aplikasi ini mendukung Progressive Web App (PWA). Anda dapat menginstalnya di HP Android atau iPhone:\n- Di browser Chrome Android: Klik tombol 'Install Aplikasi' di sidebar atau ketuk titik tiga di pojok kanan atas browser > pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).\n- Di browser Safari iPhone: Ketuk tombol Share (kotak panah ke atas) > pilih 'Add to Home Screen'.\nSetelah terpasang, aplikasi akan memiliki icon sendiri di HP dan dapat dibuka dalam layar penuh tanpa address bar browser.",
        tip: "Aplikasi berjalan sangat cepat dan ringan tanpa membebani memori ponsel Anda."
      }
    ]
  }
];

export function UserGuide() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [expandedSection, setExpandedSection] = useState<string | null>("alur-kerja");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { id: "semua", label: "Semua Panduan", icon: Layers },
    { id: "alur", label: "Alur Kerja", icon: BookOpen },
    { id: "faktur", label: "Faktur & Pembayaran", icon: CreditCard },
    { id: "laporan", label: "Laporan & Excel", icon: PieChart },
    { id: "konsumen", label: "Konsumen", icon: Users },
    { id: "backup", label: "Backup & Restore", icon: Database },
    { id: "mobile", label: "Mobile & PWA", icon: Smartphone },
  ];

  const filteredSections = useMemo(() => {
    return GUIDE_DATA.filter((sec) => {
      const matchCategory = selectedCategory === "semua" || sec.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSummary = sec.summary.toLowerCase().includes(q);
      const matchSteps = sec.steps.some(
        (s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.tip && s.tip.toLowerCase().includes(q))
      );
      const matchFaq = sec.faq?.some((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));

      return matchTitle || matchSummary || matchSteps || matchFaq;
    });
  }, [searchQuery, selectedCategory]);

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const handlePrint = () => {
    window.print();
  };

  const guideContent = (isModal = false) => (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari panduan (contoh: bayar lunas, export excel, warna merah, backup)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-0.5"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide List / Accordion */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-sm">
          Tidak ada panduan yang cocok dengan pencarian <strong>"{searchQuery}"</strong>.
          <div className="mt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("semua");
              }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Reset Pencarian
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const isExpanded = isModal ? true : expandedSection === section.id;
            return (
              <div
                key={section.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all hover:border-gray-300"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      {section.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {section.summary}
                    </p>
                  </div>
                  <div className="shrink-0 p-1 text-gray-400">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-gray-100 bg-gray-50/40 space-y-4">
                    {/* Steps */}
                    <div className="space-y-3 mt-2">
                      {section.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-100 rounded-lg p-3.5 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="text-sm font-semibold text-gray-800">
                              {step.title}
                            </h5>
                          </div>
                          <p className="text-xs text-gray-600 pl-7 leading-relaxed whitespace-pre-line">
                            {step.description}
                          </p>
                          {step.tip && (
                            <div className="ml-7 mt-2 flex items-start gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md p-2 text-xs">
                              <Lightbulb size={14} className="shrink-0 text-amber-600 mt-0.5" />
                              <span className="leading-snug">
                                <strong className="font-semibold">Tips:</strong> {step.tip}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* FAQ if available */}
                    {section.faq && section.faq.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200/70 space-y-2">
                        <h6 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Pertanyaan Umum (FAQ)
                        </h6>
                        <div className="space-y-2">
                          {section.faq.map((f, fIdx) => (
                            <div key={fIdx} className="bg-white border border-gray-100 rounded-md p-2.5 text-xs">
                              <div className="font-semibold text-gray-800 flex items-center gap-1">
                                <span className="text-blue-600 font-bold">Q:</span> {f.q}
                              </div>
                              <div className="text-gray-600 mt-1 pl-3 leading-relaxed">
                                <span className="text-emerald-600 font-bold">A:</span> {f.a}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-blue-200 bg-linear-to-b from-blue-50/70 to-white p-5 md:p-6 shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Panduan Lengkap Penggunaan</h3>
            <p className="text-xs text-gray-600">
              Pelajari cara mengelola faktur, pembayaran, ekspor Excel, hingga mode mobile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
            title="Buka panduan dalam mode baca layar penuh"
          >
            <Maximize2 size={14} />
            <span>Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Guide Content in Settings */}
      <div className="pt-4">
        {guideContent(false)}
      </div>

      {/* Quick summary footer callout */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>AF Faktur — Dirancang cepat untuk operasional toko & grosir.</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setSelectedCategory("semua");
            setExpandedSection(expandedSection ? null : "alur-kerja");
          }}
          className="text-blue-600 font-medium hover:underline"
        >
          {expandedSection ? "Tutup Semua Accordion" : "Buka Panduan Utama"}
        </button>
      </div>

      {/* Fullscreen Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Buku Panduan Penggunaan AF Faktur</h3>
                  <p className="text-xs text-gray-500">Dokumentasi operasional lengkap dan tips praktis</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                  title="Cetak panduan"
                >
                  <Printer size={14} />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {guideContent(true)}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Punya pertanyaan lain? Anda dapat menanyakan langsung melalui tim admin.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
