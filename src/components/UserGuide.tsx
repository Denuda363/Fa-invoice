import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  FileDown,
  BookMarked,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CompanyProfile } from "../types";
import { exportGuideBookA4Pdf } from "../utils/guideBookPdf";

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
      },
      {
        title: "Riwayat Faktur, Total Tagihan Tiap Konsumen & Filter Rentang Tanggal",
        description: "Buka menu 'Riwayat Faktur' untuk meninjau dan mengelola seluruh faktur penjualan:\n1. Total Tagihan Tiap Konsumen: Pada setiap baris faktur tercantum tag 'Total Tagihan' yang mengakumulasikan total nominal faktur dari toko tersebut. Anda juga dapat beralih ke tab 'Total Tagihan per Konsumen' untuk melihat rekap peringkat nilai penjualan, jumlah faktur, total pembayaran yang telah masuk, sisa utang berjalan, dan kontribusi persentase tiap toko.\n2. Filter Rentang Tanggal: Saring data berdasarkan Tanggal Faktur atau Tanggal Jatuh Tempo dengan memilih tanggal 'Dari' dan 'Sampai', atau menggunakan tombol pintas 'Hari Ini', 'Bulan Ini', 'Bulan Lalu', dan 'Semua Waktu'.\n3. Filter Dropdown Konsumen & Status: Pilih toko tertentu dari dropdown untuk langsung melihat seluruh fakturnya beserta akumulasi tagihannya.\n4. Export Excel 2 Sheet Lengkap: Unduh lembar kerja Excel yang otomatis berisi Sheet 'Daftar Faktur' dan Sheet 'Total Tagihan per Konsumen'.",
        tip: "Klik badge 'Total Tagihan' pada nama konsumen di tabel faktur untuk langsung menyaring semua transaksi milik konsumen tersebut."
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
        title: "Menu Terpusat: Riwayat Pembayaran & Total Pembayaran Setiap Konsumen",
        description: "Gunakan menu navigasi 'Riwayat Pembayaran' untuk mengawasi seluruh arus kas masuk. Kini dilengkapi fitur pemantauan total pembayaran setiap konsumen yang dapat disaring berdasarkan rentang tanggal:\n\n1. Tab 'Riwayat Transaksi': Menampilkan daftar setiap kali konsumen menyetor dana dengan info 'Total Disetor' pada tiap baris transaksi.\n2. Tab 'Total per Konsumen': Rekapitulasi total pembayaran per masing-masing pelanggan. Anda dapat menyaring data berdasarkan rentang tanggal tertentu (Dari & Sampai Tanggal), atau menggunakan tombol pintas cepat seperti 'Hari Ini', 'Bulan Ini', 'Bulan Lalu', atau 'Semua Waktu'.\n3. Perhitungan Akurat Berdasarkan Rentang Tanggal: Saat rentang tanggal disaring, kolom Total Pembayaran dan frekuensi setoran otomatis menghitung murni dana yang dibayarkan konsumen pada rentang tanggal tersebut. Teks 'All-time' tetap disertakan untuk perbandingan.\n4. Opsi 'Hanya yang Membayar di Rentang Ini': Menyaring daftar agar hanya menampilkan konsumen yang memang menyetorkan pembayaran pada periode terpilih.\n5. Filter Konsumen & Pencarian: Cari konsumen berdasarkan nama atau pilih langsung dari dropdown konsumen.\n6. Export Excel 2 Sheet Lengkap: Hasil ekspor Excel otomatis menyesuaikan dengan rentang tanggal yang dipilih, lengkap dengan judul periode dan lembar kerja 'Riwayat Transaksi' serta 'Total per Konsumen'.",
        tip: "Gunakan pintasan 'Bulan Ini' pada tab Total per Konsumen untuk langsung mengecek performa setoran toko pelanggan pada bulan berjalan."
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
        title: "Filter Nominal Tagihan (Per Faktur & Total per Konsumen)",
        description: "Gunakan panel 'Filter Nominal Tagihan' (warna hijau lembut) untuk menyaring tagihan dengan kondisi Lebih dari (>), Minimal (>=), Kurang dari (<), Maksimal (<=), maupun Rentang (Min - Max). Anda dapat memilih cakupan 'Per Faktur' atau 'Total per Konsumen' untuk menyaring berdasarkan akumulasi total sisa tagihan atau total nominal faktur tiap konsumen.",
        tip: "Tersedia tombol preset cepat (> 500rb, > 1jt, > 5jt, < 1jt) untuk penyaringan satu klik."
      },
      {
        title: "Tanda Warna Merah pada Export Excel",
        description: "Saat Anda menekan 'Export Excel', file spreadsheet yang dihasilkan berisi:\n- Sheet Rekap Utama.\n- Sheet per Tanggal Jatuh Tempo (data yang telah melewati tanggal jatuh tempo otomatis ditandai dengan sorotan teks dan latar merah tebal agar mudah diprioritaskan untuk penagihan).\n- Sheet khusus per Konsumen (jika opsi pisah sheet aktif).",
        tip: "Warna merah memudahkan tim penagih fokus pada faktur yang sudah terlambat."
      },
      {
        title: "Export Pembayaran, Export PDF & Export TXT",
        description: "Selain Export Excel, tersedia tiga format ekspor tambahan:\n1. Export Pembayaran: File Excel rincian seluruh pembayaran per faktur.\n2. Export PDF: Laporan ringkas siap cetak atau kirim ke manajemen lengkap dengan kop logo perusahaan.\n3. Export TXT: Ringkasan teks cepat per konsumen dengan format '- NAMA KONSUMEN Rp NOMINAL' yang praktis disalin ke pesan WhatsApp.",
      },
      {
        title: "Perhitungan Otomatis Total Sisa Tagihan yang Diceklis",
        description: "Pada tabel rekap jatuh tempo, centang satu atau beberapa faktur yang ingin Anda rekap atau lunasi. Aplikasi secara otomatis menghitung secara real-time:\n1. Total Sisa Tagihan Ceklis (Rp) sebagai perhitungan utama yang wajib ditagih/dilunasi.\n2. Total Nominal Faktur awal & rincian pembayaran yang telah masuk.\n3. Jumlah faktur yang terpilih.\n4. Akumulasi sisa tagihan per konsumen pada header masing-masing toko.\nInformasi total sisa tagihan ini disorot di bagian atas tabel, kartu ringkasan ceklis, dan floating bar di bawah layar (dilengkapi tombol 'Bayar Terpilih' untuk pembayaran massal cepat).",
        tip: "Perhitungan sisa tagihan otomatis mengurangi cicilan/pembayaran yang sudah dicicil sebelumnya sehingga angka yang muncul adalah murni sisa utang yang belum lunas."
      },
      {
        title: "Pengaturan Jumlah Baris Data per Halaman (Paginasi)",
        description: "Pada setiap halaman data (Riwayat Faktur, Riwayat Pembayaran, Data Konsumen, dan Rekap Laporan), Anda dapat mengatur jumlah data yang ingin ditampilkan per halaman: 10 baris, 20 baris, 50 baris, 100 baris, atau Semua data sekaligus. Gunakan tombol navigasi halaman (<, >, atau nomor halaman) untuk berpindah halaman dengan cepat dan mulus.",
        tip: "Memilih 10 atau 20 baris sangat direkomendasikan pada smartphone/HP agar scrolling terasa ringan dan nyaman."
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
      },
      {
        title: "Pencarian & Filter Cepat Data Konsumen",
        description: "Pada menu 'Data Konsumen', Anda dapat memfilter dan mencari pelanggan secara fleksibel:\n1. Kotak Pencarian: Cari konsumen berdasarkan nama toko, nomor telepon, alamat, hingga kata kunci status seperti 'utang', 'lunas', atau 'sheet'.\n2. Tombol Filter Cepat & Dropdown: Filter instan berdasarkan status (Semua, Ada Utang, Lunas, Pisah Sheet Excel) lengkap dengan badge jumlah konsumen.\n3. Pengurutan Data: Urutkan berdasarkan Sisa Utang Terbesar, Nama (A-Z/Z-A), atau Total Pembayaran Terbanyak.\n4. Pencarian di Grafik & Tren: Pada tab 'Grafik & Tren', tersedia kolom pencarian untuk memilih konsumen grafik dengan cepat serta mencari langsung di tabel matriks utang-pembayaran.",
        tip: "Pencarian dan filter status dapat digabungkan secara bersamaan. Gunakan tombol 'Reset' untuk mengembalikan tampilan ke awal."
      },
      {
        title: "Grafik Perbandingan Pembayaran, Faktur & Utang Per Bulan (MoM)",
        description: "Di menu 'Data Konsumen', buka tab 'Grafik & Tren' atau klik tombol 'Grafik & Tren' pada baris konsumen. Grafik secara otomatis mengakumulasi data transaksi per bulannya:\n\n• Contoh Perhitungan Bulanan:\n  - Bulan Januari: Total nominal faktur Rp 5.000.000, Total pembayaran Rp 3.000.000 -> Sisa utang timbul Rp 2.000.000.\n  - Bulan Februari: Total nominal faktur Rp 6.000.000, Total pembayaran Rp 4.000.000 -> Sisa utang timbul Rp 2.000.000.\n\n• Fitur Grafik & Analisis:\n1. Grafik Bar Bulanan: Menampilkan diagram batang per bulan untuk Total Nominal Faktur (biru), Total Pembayaran (hijau), dan Sisa Utang (merah). Anda dapat memfilter indikator (Semua, Faktur vs Bayar, atau Bayar vs Utang).\n2. Mode Konsolidasi & Per Konsumen: Menampilkan data bulanan gabungan seluruh konsumen atau khusus konsumen tertentu yang dipilih.\n3. Grafik Area Tren MoM: Memantau kurva kenaikan dan penurunan penerimaan pembayaran vs nilai faktur baru.\n4. Tabel Rincian MoM: Tabel detail angka nominal per bulan, selisih pertumbuhan (Rp), persentase kenaikan/penurunan (%), dan tingkat pelunasan.",
        tip: "Anda dapat memfilter rentang waktu (6 Bulan, 12 Bulan, atau Semua) serta menggunakan kotak pencarian konsumen untuk beralih data toko secara instan."
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
  },
  {
    id: "gaya-navbar",
    category: "mobile",
    title: "8. Tema 3D, Profil Perusahaan & Kustomisasi Navbar",
    summary: "Mengubah seluruh tema menjadi gaya 3D, mengedit profil & icon logo perusahaan, serta mengecilkan navbar (minimize).",
    steps: [
      {
        title: "Memilih Tema 3D (8 Pilihan Gaya Berdimensi)",
        description: "Buka menu 'Pengaturan' > pada panel 'Tampilan & Tema 3D Navbar', pilih dari 8 tema 3D berdimensi lengkap dengan sudut bevel timbul dan highlight arah cahaya: Modern Clean 3D, Midnight Slate 3D, Deep Navy 3D, Emerald Forest 3D, Royal Purple 3D, Sunset Crimson 3D, Graphite Minimal 3D, atau Soft Sky 3D.",
        tip: "Seluruh kartu, tombol aksi, dan navigasi aplikasi otomatis mengikuti gaya 3D dari tema yang Anda pilih."
      },
      {
        title: "Edit Profil Perusahaan & Upload Icon Perusahaan",
        description: "Di menu 'Pengaturan', gunakan panel 'Profil & Icon Perusahaan':\n1. Upload Icon Logo: Seret & lepas atau pilih file gambar (PNG, JPG, WEBP, atau SVG). Gambar otomatis dikompresi agar ringan dan langsung tampil di navbar, header mobile, favicon browser, dan laporan PDF.\n2. Edit Data Perusahaan: Isi Nama Perusahaan/Toko, Tagline, Nomor Telepon/WA, Email, Nama Penanggung Jawab, NPWP, serta Alamat Lengkap.\n3. Klik 'Simpan Profil Perusahaan' untuk menerapkan perubahan ke seluruh aplikasi.",
        tip: "Gunakan tombol 'Pakai Default' kapan saja untuk mengembalikan logo standar."
      },
      {
        title: "Mode Minimize / Kecilkan Navbar",
        description: "Anda dapat mengecilkan navbar samping menjadi mode ikon ringkas (80px) untuk memaksimalkan ruang kerja tabel faktur dan laporan:\n1. Klik ikon tombol minimize di sudut kanan atas sidebar desktop.\n2. Atau aktifkan tombol 'Minimize Navbar' di halaman Pengaturan.\nSaat dalam mode minimize, teks disembunyikan dan tooltip nama halaman akan muncul saat ikon disentuh/disorot kursor.",
        tip: "Sangat berguna untuk layar laptop beresolusi sedang agar tabel faktur tidak terpotong ke samping."
      },
      {
        title: "Tata Letak Navbar, Bentuk Tombol & Gaya Transisi Halaman",
        description: "Anda dapat memilih tata letak 'Sidebar Kiri 3D' atau 'Navbar Atas 3D', bentuk tombol 3D, serta memilih 5 gaya animasi perpindahan halaman profesional (Precision 3D Stage, Directional Ledger, 3D Executive Tilt, Silk Editorial Veil, atau Instant Crossfade).",
      },
      {
        title: "Jam Realtime (8 Gaya) & Pusat Notifikasi Transaksi",
        description: "1. Jam Realtime & Tanggal: Di menu Pengaturan tab 'Gaya Jam', pilih dari 8 tampilan jam realtime lengkap dengan nama hari dan tanggal.\n2. Pusat Notifikasi: Setiap faktur baru, pembayaran masuk, pelunasan massal, atau perubahan data otomatis tercatat di ikon lonceng kanan atas beserta slip notifikasi layar, suara lonceng, dan dukungan notifikasi sistem perangkat (HP/Desktop).",
      }
    ]
  },
  {
    id: "tentang-developer",
    category: "alur",
    title: "9. Tentang Aplikasi, Hak Cipta & Developer Denuda",
    summary: "Informasi resmi mengenai aplikasi, hak cipta yang dilindungi, serta profil Denuda sebagai pembuat dan pengembang aplikasi.",
    steps: [
      {
        title: "Developer Aplikasi: Denuda",
        description: "Aplikasi ini dirancang, dibuat, dan dikembangkan secara penuh oleh Denuda sebagai solusi pencatatan dan manajemen faktur, penagihan, dan monitoring piutang toko yang cepat, andal, dan responsif.",
        tip: "Dibuat dengan dedikasi penuh untuk memudahkan operasional pembukuan bisnis harian."
      },
      {
        title: "Hak Cipta Aplikasi",
        description: "Hak Cipta © 2026 Denuda. Seluruh hak cipta dilindungi undang-undang (All Rights Reserved). Seluruh tata letak antarmuka, arsitektur data, formula kalkulasi, dan fitur-fitur di dalam aplikasi ini dilindungi hak cipta resmi.",
      },
      {
        title: "Teknologi & Keamanan Data",
        description: "Dibangun dengan arsitektur modern (React 19, TypeScript, Tailwind CSS, PWA). Seluruh data transaksi tersimpan aman di perangkat lokal pengguna dan dapat dibackup atau dipulihkan dalam format JSON maupun Excel multi-sheet kapan saja tanpa risiko kebocoran data.",
      }
    ],
    faq: [
      {
        q: "Siapa developer yang membuat aplikasi ini?",
        a: "Aplikasi ini dibuat dan dikembangkan oleh Denuda."
      },
      {
        q: "Apakah data transaksi saya aman?",
        a: "Ya, seluruh data tersimpan secara lokal di perangkat Anda dan Anda dapat melakukan backup berkala ke file JSON maupun spreadsheet Excel."
      }
    ]
  }
];

export function UserGuide({ companyProfile }: { companyProfile?: CompanyProfile }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [expandedSection, setExpandedSection] = useState<string | null>("alur-kerja");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookPreviewOpen, setIsBookPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [coverLogoError, setCoverLogoError] = useState(false);

  const companyName = companyProfile?.name || "AF Faktur";
  const companyTagline = companyProfile?.tagline || "Manajemen Faktur & Piutang";
  const logoSrc = companyProfile?.iconUrl?.trim() || "/icon.jpg";

  useEffect(() => {
    setCoverLogoError(false);
  }, [logoSrc]);
  const companyInitials =
    companyName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "AF";
  const printDateStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
  const currentYear = new Date().getFullYear();

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

  const handlePrintA4Book = () => {
    window.print();
  };

  const handleDownloadA4Pdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await exportGuideBookA4Pdf(GUIDE_DATA, companyProfile);
    } finally {
      setIsGeneratingPdf(false);
    }
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

  const renderA4BookDocument = () => (
    <div className="text-slate-900 font-sans">
      {/* HALAMAN 1: SAMPUL BUKU RESMI */}
      <section className="a4-book-cover border border-slate-200 rounded-lg p-8 sm:p-12 bg-white relative overflow-hidden mb-8 print:border-0 print:rounded-none print:p-0 print:mb-0">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 border-l-8 border-l-blue-700 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              {!coverLogoError ? (
                <img
                  src={logoSrc}
                  alt={companyName}
                  onError={() => setCoverLogoError(true)}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                  {companyInitials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight break-words">
                {companyName}
              </h1>
              <p className="text-sm font-semibold text-blue-700 mt-0.5 break-words">
                {companyTagline}
              </p>
              {(companyProfile?.phone || companyProfile?.email || companyProfile?.address) && (
                <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                  {[companyProfile?.phone, companyProfile?.email, companyProfile?.address]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="my-12 sm:my-16 space-y-5">
          <div className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-widest">
            Dokumentasi Resmi Perusahaan
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            BUKU PANDUAN
            <br />
            PENGGUNAAN APLIKASI
          </h2>
          <div className="w-24 h-1.5 bg-blue-600 rounded-full" />
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Panduan operasional lengkap pengelolaan faktur penjualan, pencatatan pembayaran &amp; cicilan konsumen, pemantauan laporan jatuh tempo, notifikasi transaksi, serta pengamanan cadangan data.
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2 mb-3">
              Informasi Dokumen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
              <div>
                <span className="text-slate-500">Nama Sistem:</span>{" "}
                <strong className="text-slate-900">{companyName} (Versi 2.5 Pro)</strong>
              </div>
              <div>
                <span className="text-slate-500">Cakupan Materi:</span>{" "}
                <strong className="text-slate-900">{GUIDE_DATA.length} Bab Lengkap &amp; FAQ</strong>
              </div>
              <div>
                <span className="text-slate-500">Tanggal Cetak:</span>{" "}
                <strong className="text-slate-900">{printDateStr}</strong>
              </div>
              <div>
                <span className="text-slate-500">Pengembang:</span>{" "}
                <strong className="text-slate-900">Denuda</strong>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Hak Cipta © {currentYear} Denuda · All Rights Reserved
            </span>
            <span>Dokumentasi Operasional Resmi</span>
          </div>
        </div>
      </section>

      {/* HALAMAN 2: KATA PENGANTAR & DAFTAR ISI */}
      <section className="a4-book-page-break border border-slate-200 rounded-lg p-8 sm:p-10 bg-white mb-8 print:border-0 print:rounded-none print:p-0 print:mb-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
              Kata Pengantar
            </h3>
            <div className="w-16 h-1 bg-blue-600 mt-1 mb-3" />
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Selamat datang di Buku Panduan Penggunaan <strong>{companyName}</strong>. Buku panduan ini disusun agar admin, staf keuangan, maupun pemilik usaha dapat mengoperasikan seluruh fitur pencatatan faktur, pelunasan cicilan, pemantauan jatuh tempo, ekspor laporan, hingga pengamanan cadangan data secara cepat dan akurat.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
              Daftar Isi Buku Panduan
            </h3>
            <div className="w-16 h-1 bg-blue-600 mt-1 mb-4" />
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {GUIDE_DATA.map((sec, idx) => (
                <div key={sec.id} className="px-4 py-3 flex items-start justify-between gap-4 bg-white">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {sec.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {sec.summary}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-700 shrink-0">
                    Bab {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HALAMAN 3+: ISI BAB-BAB PANDUAN */}
      <div className="space-y-8">
        {GUIDE_DATA.map((section, secIdx) => (
          <article
            key={section.id}
            className={`border border-slate-200 rounded-lg p-7 sm:p-9 bg-white print:border-0 print:rounded-none print:p-0 ${
              secIdx < GUIDE_DATA.length - 1 ? "a4-book-page-break" : ""
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-5">
              <span className="font-bold uppercase tracking-wider text-slate-600">
                Buku Panduan · {companyName}
              </span>
              <span>Bab {secIdx + 1} dari {GUIDE_DATA.length}</span>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 border-l-4 border-l-blue-600 p-4 mb-5">
              <h3 className="text-base sm:text-lg font-extrabold text-blue-950">
                {section.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {section.summary}
              </p>
            </div>

            <div className="space-y-4">
              {section.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="a4-book-avoid-break rounded-lg border border-slate-200 p-4 space-y-2 bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 pl-8 leading-relaxed whitespace-pre-line">
                    {step.description}
                  </p>
                  {step.tip && (
                    <div className="ml-8 rounded-md bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 px-3 py-2 text-xs text-amber-900">
                      <strong>Tips:</strong> {step.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {section.faq && section.faq.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5 a4-book-avoid-break">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  Pertanyaan Umum (FAQ)
                </h5>
                <div className="space-y-2">
                  {section.faq.map((f, fIdx) => (
                    <div
                      key={fIdx}
                      className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs"
                    >
                      <div className="font-bold text-slate-900">Q: {f.q}</div>
                      <div className="text-slate-600 mt-1">A: {f.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-blue-200 bg-linear-to-b from-blue-50/70 to-white p-5 md:p-6 shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Panduan Lengkap Penggunaan</h3>
            <p className="text-xs text-gray-600">
              Pelajari seluruh fitur aplikasi, cetak langsung menjadi buku A4, atau unduh PDF siap jilid.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleDownloadA4Pdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            title="Unduh file PDF Buku Panduan ukuran kertas A4 lengkap dengan sampul dan daftar isi"
          >
            <FileDown size={14} />
            <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh Buku PDF (A4)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBookPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            title="Lihat pratinjau format buku kertas A4 dan cetak langsung ke printer"
          >
            <Printer size={14} />
            <span>Cetak Buku (A4)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
            title="Buka panduan dalam mode baca layar penuh"
          >
            <Maximize2 size={14} />
            <span>Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Info Banner Cetak Buku A4 */}
      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 text-indigo-950">
          <BookMarked size={16} className="text-indigo-600 shrink-0" />
          <span>
            <strong>Edisi Cetak Buku A4:</strong> Tersedia sampul resmi perusahaan, kata pengantar, daftar isi bernomor halaman otomatis, dan {GUIDE_DATA.length} bab lengkap siap cetak atau jilid.
          </span>
        </div>
        <button
          type="button"
          onClick={handlePrintA4Book}
          className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-bold shrink-0 self-start sm:self-auto"
        >
          <Printer size={13} />
          <span>Print Langsung A4</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Guide Content in Settings */}
      <div className="pt-4">
        {guideContent(false)}
      </div>

      {/* Quick summary footer callout */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{companyName} — Dirancang cepat untuk operasional toko &amp; grosir.</span>
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
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Buku Panduan Penggunaan {companyName}</h3>
                  <p className="text-xs text-gray-500">Dokumentasi operasional lengkap siap cetak ukuran A4</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadA4Pdf}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  <FileDown size={14} />
                  <span>PDF Buku (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4Book}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                  title="Cetak buku panduan ukuran kertas A4"
                >
                  <Printer size={14} />
                  <span>Cetak A4</span>
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

      {/* A4 Book Print Preview Modal */}
      {isBookPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-hidden">
          <div className="bg-slate-200 rounded-2xl max-w-5xl w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            {/* Toolbar */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <BookMarked size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold">
                    Pratinjau Cetak Buku Panduan (Kertas A4 · 210 × 297 mm)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Siap dicetak langsung ke printer atau disimpan sebagai buku PDF A4.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadA4Pdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  <FileDown size={14} />
                  <span>Unduh PDF A4</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintA4Book}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Printer size={14} />
                  <span>Cetak Sekarang (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBookPreviewOpen(false)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Tutup pratinjau buku"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Simulated A4 Paper Pages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[210mm]">
                {renderA4BookDocument()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden A4 Print Portal (Rendered outside .app-3d-shell for clean @media print) */}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="a4-print-only-container" aria-hidden="true">
            {renderA4BookDocument()}
          </div>,
          document.body
        )}
    </div>
  );
}
