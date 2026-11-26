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
    summary: "Panduan cepat memahami bagaimana seluruh fitur AF Faktur saling terhubung secara sistematis dari tahap awal hingga pelaporan akhir.",
    steps: [
      {
        title: "Langkah 1: Daftarkan Konsumen (Opsional namun Disarankan)",
        description: "Buka menu “Data Konsumen”, lalu tambahkan nama toko atau pelanggan Anda beserta nomor telepon dan alamat lengkap. Anda juga dapat mengaktifkan pengaturan agar konsumen tertentu otomatis dibuatkan sheet terpisah saat melakukan Export Excel.",
        tip: "Jika Anda langsung menginput faktur baru, data konsumen baru akan otomatis tersimpan ke dalam daftar pelanggan."
      },
      {
        title: "Langkah 2: Input Faktur Penjualan",
        description: "Buka menu “Input Faktur”, kemudian masukkan nomor faktur, pilih konsumen, tentukan tanggal faktur, tanggal jatuh tempo (otomatis 30 hari atau sesuai kesepakatan), serta total nominal tagihan. Anda juga dapat melakukan input banyak faktur sekaligus maupun mengimpor langsung dari file Excel.",
        tip: "Pastikan setiap nomor faktur bersifat unik dan tidak ganda agar pencatatan pelunasan tetap akurat."
      },
      {
        title: "Langkah 3: Pantau Status di Dashboard",
        description: "Halaman Dashboard menyajikan ringkasan instan mengenai total piutang berjalan, faktur yang telah lunas, faktur yang masih memiliki sisa tagihan, serta peringatan faktur yang telah melewati tanggal jatuh tempo.",
        tip: "Pada layar smartphone, tampilan Dashboard otomatis beralih ke mode ringkas agar nyaman dipantau dalam satu layar."
      },
      {
        title: "Langkah 4: Catat Pembayaran dan Pelunasan",
        description: "Saat konsumen melakukan pembayaran (baik cicilan sebagian maupun pelunasan penuh), buka menu “Riwayat Faktur”, klik tombol “Bayar” pada faktur terkait, lalu masukkan tanggal transaksi dan nominal yang diterima.",
        tip: "Status faktur akan otomatis berubah menjadi “Sebagian” jika masih bersisa, atau “Lunas” apabila pembayaran telah mencapai 100%."
      },
      {
        title: "Langkah 5: Ekspor Laporan dan Rekapitulasi",
        description: "Buka menu “Laporan Jatuh Tempo” untuk menyaring data berdasarkan Tanggal Faktur, Jatuh Tempo, maupun Nominal Tagihan, kemudian unduh laporan dalam format Excel Rekap, Excel Pembayaran, PDF, atau ringkasan teks TXT.",
        tip: "Pada lembar kerja per tanggal jatuh tempo di Excel, faktur yang telah melewati batas jatuh tempo otomatis ditandai dengan sorotan warna merah."
      },
      {
        title: "Langkah 6: Backup Rutin Data Anda",
        description: "Melalui menu “Pengaturan”, lakukan Backup Data ke file JSON maupun Excel secara berkala agar seluruh arsip faktur, transaksi pembayaran, dan data konsumen selalu terjaga dengan aman.",
      }
    ]
  },
  {
    id: "input-faktur",
    category: "faktur",
    title: "2. Input Faktur & Import File Excel",
    summary: "Tata cara menambahkan faktur baru secara satuan, penginputan massal sekaligus, serta mengunggah berkas spreadsheet Excel.",
    steps: [
      {
        title: "Input Faktur Manual",
        description: "1. Klik menu “Input Faktur” pada bilah navigasi.\n2. Masukkan Nomor Faktur secara lengkap (contoh: INV-001).\n3. Pilih nama konsumen dari daftar dropdown atau ketikkan nama pelanggan baru.\n4. Tentukan Tanggal Faktur. Tanggal Jatuh Tempo akan terisi otomatis 30 hari ke depan dan tetap dapat disesuaikan secara manual.\n5. Masukkan Total Tagihan Faktur dalam satuan Rupiah (Rp).\n6. Klik tombol “Simpan Faktur” untuk menyimpan data.",
      },
      {
        title: "Input Massal (Banyak Faktur Sekaligus)",
        description: "Gunakan formulir multi-baris pada halaman Input Faktur untuk memasukkan beberapa faktur sekaligus tanpa perlu menekan simpan berulang kali. Setelah seluruh baris terisi dengan benar, klik “Simpan Semua Faktur”.",
        tip: "Fitur ini sangat efisien untuk merekap tumpukan faktur penjualan pada akhir hari kerja."
      },
      {
        title: "Import Faktur dari File Excel",
        description: "1. Pada halaman Input Faktur, klik tombol “Import Excel”.\n2. Unduh template Excel resmi yang tersedia untuk memastikan kesesuaian urutan kolom (No. Faktur, Nama Konsumen, Tanggal Faktur, Jatuh Tempo, dan Total).\n3. Lengkapi data faktur pada lembar kerja Excel tersebut, lalu simpan berkas.\n4. Unggah kembali file Excel ke aplikasi agar seluruh faktur terbaca dan tersimpan secara otomatis.",
        tip: "Pastikan format penulisan tanggal di Excel menggunakan format tahun-bulan-hari (YYYY-MM-DD) atau format tanggal standar Excel."
      },
      {
        title: "Riwayat Faktur, Total Tagihan Tiap Konsumen & Filter Rentang Tanggal",
        description: "Buka menu “Riwayat Faktur” untuk meninjau serta mengelola seluruh catatan faktur penjualan:\n1. Total Tagihan Tiap Konsumen: Pada setiap baris faktur tercantum label “Total Tagihan” yang mengakumulasikan nilai faktur dari toko terkait. Anda juga dapat membuka tab “Total Tagihan per Konsumen” untuk melihat peringkat nilai penjualan, jumlah faktur, total pembayaran masuk, sisa piutang berjalan, serta kontribusi persentase tiap pelanggan.\n2. Filter Rentang Tanggal: Saring data berdasarkan Tanggal Faktur atau Tanggal Jatuh Tempo dengan menentukan rentang tanggal “Dari” dan “Sampai”, atau menggunakan pintasan “Hari Ini”, “Bulan Ini”, “Bulan Lalu”, serta “Semua Waktu”.\n3. Filter Dropdown Konsumen & Status: Pilih pelanggan tertentu dari dropdown untuk menampilkan seluruh daftar fakturnya beserta akumulasi tagihan.\n4. Export Excel 2 Sheet Lengkap: Unduh laporan Excel yang otomatis memuat Sheet “Daftar Faktur” dan Sheet “Total Tagihan per Konsumen”.",
        tip: "Klik lencana “Total Tagihan” pada nama konsumen di tabel faktur untuk langsung menyaring seluruh transaksi milik pelanggan tersebut."
      }
    ],
    faq: [
      {
        q: "Bagaimana jika nomor faktur sudah pernah digunakan sebelumnya?",
        a: "Aplikasi akan menampilkan peringatan otomatis apabila terdeteksi duplikasi nomor faktur guna mencegah kesalahan pencatatan piutang."
      },
      {
        q: "Apakah tanggal jatuh tempo harus selalu berjarak 30 hari?",
        a: "Tidak. Nilai 30 hari hanyalah pengaturan awal (default) yang praktis, sehingga Anda bebas menentukan tanggal jatuh tempo sesuai kesepakatan transaksi."
      }
    ]
  },
  {
    id: "pembayaran-faktur",
    category: "faktur",
    title: "3. Pencatatan Pembayaran & Riwayat Cicilan",
    summary: "Prosedur pencatatan arus kas masuk, pengelolaan pembayaran cicilan bertahap, serta pemeriksaan riwayat pelunasan faktur.",
    steps: [
      {
        title: "Mencatat Pembayaran Baru",
        description: "1. Masuk ke menu “Riwayat Faktur”.\n2. Cari faktur yang dituju melalui kolom pencarian atau filter status.\n3. Klik tombol hijau “Bayar” pada baris faktur yang bersangkutan.\n4. Masukkan tanggal penerimaan dana beserta nominal pembayaran yang diterima.\n5. Gunakan tombol cepat “Bayar Lunas” apabila konsumen langsung melunasi seluruh sisa tagihan.\n6. Klik “Konfirmasi Pembayaran” untuk memperbarui saldo faktur.",
      },
      {
        title: "Melihat Rincian Riwayat Pembayaran",
        description: "1. Pada faktur yang memiliki riwayat cicilan, klik tombol “Riwayat” atau ketuk indikator status pembayaran.\n2. Jendela rincian akan menampilkan daftar lengkap setiap setoran, meliputi tanggal bayar, nominal setoran, serta sisa tagihan pada setiap tahap.",
      },
      {
        title: "Membatalkan atau Menghapus Salah Catat Pembayaran",
        description: "Apabila terjadi kekeliruan saat memasukkan nominal maupun tanggal pembayaran, buka jendela “Riwayat Pembayaran” pada faktur tersebut, lalu klik ikon hapus pada baris transaksi yang keliru. Sisa saldo beserta status faktur akan dihitung ulang secara otomatis ke kondisi semula.",
        tip: "Lakukan penghapusan riwayat pembayaran hanya apabila benar-benar terjadi kesalahan input."
      },
      {
        title: "Menu Terpusat: Riwayat Pembayaran & Total Pembayaran Setiap Konsumen",
        description: "Gunakan menu navigasi “Riwayat Pembayaran” untuk memantau seluruh arus kas masuk secara terpusat beserta rekap total pembayaran per konsumen:\n1. Tab Riwayat Transaksi: Menampilkan rincian kronologis setiap setoran dana konsumen lengkap dengan informasi “Total Disetor” pada masing-masing baris.\n2. Tab Total per Konsumen: Menyajikan rekapitulasi total pembayaran per pelanggan yang dapat disaring berdasarkan rentang tanggal (“Dari” dan “Sampai”) maupun pintasan cepat (“Hari Ini”, “Bulan Ini”, “Bulan Lalu”, dan “Semua Waktu”).\n3. Perhitungan Akurat Berdasarkan Periode: Saat rentang tanggal aktif, kolom Total Pembayaran dan frekuensi setoran menghitung murni dana yang diterima pada periode tersebut, sementara informasi “All-time” tetap ditampilkan sebagai pembanding.\n4. Opsi Hanya yang Membayar di Rentang Ini: Menyaring daftar agar hanya menampilkan pelanggan yang melakukan transaksi pembayaran pada rentang tanggal terpilih.\n5. Filter Konsumen & Pencarian: Cari pelanggan berdasarkan nama toko atau pilih langsung melalui dropdown konsumen.\n6. Export Excel 2 Sheet Lengkap: Hasil unduhan Excel menyesuaikan rentang tanggal terpilih, lengkap dengan judul periode serta lembar kerja “Riwayat Transaksi” dan “Total per Konsumen”.",
        tip: "Gunakan pintasan “Bulan Ini” pada tab Total per Konsumen untuk mengevaluasi kinerja setoran pelanggan pada bulan berjalan secara instan."
      }
    ]
  },
  {
    id: "laporan-dan-export",
    category: "laporan",
    title: "4. Laporan, Filter Fleksibel & Export Excel",
    summary: "Panduan penyaringan laporan berdasarkan tanggal faktur, jatuh tempo, dan nominal tagihan, serta ekspor ke Excel, PDF, dan TXT.",
    steps: [
      {
        title: "Filter Berdasarkan Tanggal Faktur",
        description: "Pada menu “Laporan Jatuh Tempo”, gunakan panel Filter Tanggal Faktur berwarna biru lembut untuk memasukkan rentang tanggal “Dari” dan “Sampai”, atau menekan tombol pintas “Bulan Ini” dan “Hari Ini”.",
        tip: "Filter ini membatasi laporan hanya pada faktur yang diterbitkan dalam rentang tanggal yang dipilih."
      },
      {
        title: "Filter Berdasarkan Jatuh Tempo & Umur Faktur",
        description: "Manfaatkan panel Filter Jatuh Tempo berwarna oranye lembut untuk mengelompokkan status tagihan, meliputi pilihan Semua, Belum Jatuh Tempo, Sudah Lewat Jatuh Tempo, maupun klasifikasi umur piutang (1-30 hari, 31-60 hari, atau lebih dari 60 hari).",
      },
      {
        title: "Filter Nominal Tagihan (Per Faktur & Total per Konsumen)",
        description: "Gunakan panel “Filter Nominal Tagihan” berwarna hijau lembut untuk menyaring data dengan kondisi Lebih dari (>), Minimal (>=), Kurang dari (<), Maksimal (<=), maupun Rentang (Min - Max). Anda dapat memilih cakupan “Per Faktur” atau “Total per Konsumen” untuk menyaring berdasarkan akumulasi total sisa tagihan atau nilai faktur masing-masing pelanggan.",
        tip: "Tersedia tombol preset cepat (> 500rb, > 1jt, > 5jt, < 1jt) untuk melakukan penyaringan hanya dengan satu klik."
      },
      {
        title: "Tanda Warna Merah pada Export Excel",
        description: "Saat Anda menekan tombol “Export Excel”, berkas spreadsheet yang dihasilkan secara otomatis mencakup:\n- Sheet Rekap Utama: Berisi ringkasan keseluruhan data faktur yang memenuhi filter aktif.\n- Sheet per Tanggal Jatuh Tempo: Faktur yang telah melewati batas jatuh tempo ditandai dengan teks dan latar merah tegas agar mudah diprioritaskan untuk penagihan.\n- Sheet Khusus per Konsumen: Dibuat otomatis apabila opsi pisah sheet diaktifkan pada profil pelanggan.",
        tip: "Penandaan warna merah membantu tim penagihan memprioritaskan faktur yang telah melewati tenggat pembayaran."
      },
      {
        title: "Export Pembayaran, Export PDF & Export TXT",
        description: "Selain format Export Excel utama, tersedia tiga format ekspor tambahan untuk kebutuhan pelaporan yang beragam:\n1. Export Pembayaran: Mengunduh berkas Excel berisi rincian seluruh riwayat pembayaran per faktur.\n2. Export PDF: Menghasilkan dokumen laporan ringkas siap cetak lengkap dengan kop identitas dan logo perusahaan.\n3. Export TXT: Menyajikan ringkasan teks cepat per konsumen dengan format “- NAMA KONSUMEN Rp NOMINAL” yang praktis dibagikan melalui WhatsApp.",
      },
      {
        title: "Perhitungan Otomatis Total Sisa Tagihan yang Diceklis",
        description: "Pada tabel rekap jatuh tempo, beri tanda centang pada satu atau beberapa faktur yang hendak direkap maupun dilunasi. Sistem akan menghitung secara waktu nyata (real-time):\n1. Total Sisa Tagihan Ceklis (Rp): Nilai utama yang wajib ditagih atau dilunasi.\n2. Total Nominal Faktur Awal: Beserta rincian pembayaran yang telah diterima.\n3. Jumlah Keseluruhan Faktur Terpilih: Total baris faktur yang sedang dicentang.\n4. Akumulasi Sisa Tagihan per Konsumen: Ditampilkan pada baris header masing-masing toko beserta bilah aksi mengambang dengan tombol “Bayar Terpilih” untuk pelunasan massal.",
        tip: "Perhitungan sisa tagihan otomatis memperhitungkan cicilan yang telah masuk sehingga angka yang tampil adalah murni sisa piutang berjalan."
      },
      {
        title: "Pengaturan Jumlah Baris Data per Halaman (Paginasi)",
        description: "Pada setiap halaman tabel data (Riwayat Faktur, Riwayat Pembayaran, Data Konsumen, dan Laporan Jatuh Tempo), Anda dapat mengatur jumlah baris yang ditampilkan per halaman, yaitu 10, 20, 50, 100 baris, atau Semua data sekaligus. Gunakan tombol navigasi halaman untuk berpindah halaman secara cepat.",
        tip: "Memilih tampilan 10 atau 20 baris per halaman sangat disarankan saat mengakses melalui smartphone agar pengguliran layar tetap ringan."
      }
    ]
  },
  {
    id: "data-konsumen",
    category: "konsumen",
    title: "5. Manajemen Konsumen & Opsi Pisah Sheet",
    summary: "Tata kelola basis data pelanggan, pengaturan pemisahan sheet Excel per toko, serta analisis grafik tren piutang bulanan.",
    steps: [
      {
        title: "Menambah & Mengubah Data Konsumen",
        description: "Buka menu “Data Konsumen”, kemudian klik tombol “Tambah Konsumen” untuk mendaftarkan Nama Toko atau Pelanggan, Nomor Telepon atau WhatsApp, dan Alamat Pengiriman.",
      },
      {
        title: "Fitur Pisah Sheet Saat Export",
        description: "Aktifkan opsi centang “Pisahkan Sheet saat Export Excel” pada konsumen prioritas. Setiap kali laporan Excel diunduh, sistem otomatis membuatkan tab lembar kerja tersendiri khusus untuk konsumen tersebut beserta seluruh daftar fakturnya.",
        tip: "Fitur ini sangat menghemat waktu apabila Anda rutin mengirimkan kartu piutang secara terpisah kepada pelanggan utama."
      },
      {
        title: "Hubungi Langsung via Telepon atau WhatsApp",
        description: "Nomor kontak yang tersimpan pada profil konsumen memudahkan tim administrasi untuk segera menghubungi atau mengonfirmasi tagihan yang mendekati tanggal jatuh tempo.",
      },
      {
        title: "Pencarian & Filter Cepat Data Konsumen",
        description: "Pada menu “Data Konsumen”, Anda dapat mencari dan menyaring data pelanggan secara fleksibel:\n1. Kotak Pencarian: Lakukan pencarian berdasarkan nama toko, nomor telepon, alamat, hingga kata kunci status seperti “utang”, “lunas”, atau “sheet”.\n2. Tombol Filter Cepat & Dropdown: Saring data secara instan berdasarkan status (Semua, Ada Utang, Lunas, atau Pisah Sheet Excel) lengkap dengan jumlah konsumen.\n3. Pengurutan Data: Urutkan daftar berdasarkan Sisa Utang Terbesar, Nama (A-Z atau Z-A), maupun Total Pembayaran Terbanyak.\n4. Pencarian pada Grafik & Tren: Pada tab “Grafik & Tren”, tersedia kotak pencarian konsumen untuk berpindah data toko dengan cepat serta pencarian langsung pada tabel matriks utang-pembayaran.",
        tip: "Kolom pencarian dan filter status dapat digunakan secara bersamaan, lalu klik “Reset” untuk memulihkan tampilan awal."
      },
      {
        title: "Grafik Perbandingan Pembayaran, Faktur & Utang Per Bulan (MoM)",
        description: "Di menu “Data Konsumen”, buka tab “Grafik & Tren” atau klik tombol “Grafik & Tren” pada baris konsumen. Grafik otomatis mengakumulasi transaksi per bulan secara akurat. Sebagai contoh, apabila pada bulan Januari tercatat total nominal faktur Rp 5.000.000 dengan pembayaran Rp 3.000.000, maka sisa utang timbul adalah Rp 2.000.000; sedangkan pada bulan Februari dengan faktur Rp 6.000.000 dan pembayaran Rp 4.000.000 akan menghasilkan sisa utang Rp 2.000.000.\n1. Grafik Bar Bulanan: Menampilkan perbandingan diagram batang untuk Total Nominal Faktur (biru), Total Pembayaran (hijau), dan Sisa Utang (merah) dengan opsi filter indikator.\n2. Mode Konsolidasi & Per Konsumen: Mendukung tampilan gabungan seluruh konsumen maupun per pelanggan tertentu.\n3. Grafik Area Tren MoM: Memvisualisasikan kurva kenaikan atau penurunan penerimaan pembayaran dibandingkan nilai faktur baru.\n4. Tabel Rincian MoM: Menyajikan angka nominal per bulan, selisih pertumbuhan (Rp), persentase perubahan (%), serta rasio pelunasan.",
        tip: "Anda dapat menyaring rentang waktu (6 Bulan, 12 Bulan, atau Semua) untuk mengevaluasi kinerja penagihan jangka panjang."
      }
    ]
  },
  {
    id: "backup-restore",
    category: "backup",
    title: "6. Backup, Restore & Pemeliharaan Data",
    summary: "Prosedur pengamanan arsip tagihan, pemindahan data antar perangkat, serta pemeliharaan basis data aplikasi.",
    steps: [
      {
        title: "Backup Data (Format JSON & Excel)",
        description: "Pada menu “Pengaturan”, tersedia dua metode pencadangan data yang dapat dipilih sesuai kebutuhan:\n1. Backup JSON: Menyimpan seluruh struktur basis data mentah secara utuh termasuk rincian riwayat pembayaran.\n2. Backup Excel: Menyimpan data ke dalam file spreadsheet Excel 3 lembar kerja (Customers, Invoices, dan Payments).",
        tip: "Sangat dianjurkan melakukan Backup JSON secara rutin setiap akhir pekan lalu menyimpannya di Google Drive atau media penyimpanan terpisah."
      },
      {
        title: "Restore (Pulihkan) Data",
        description: "Apabila Anda hendak memulihkan cadangan data lama atau memindahkan pembukuan ke perangkat lain:\n1. Buka menu Pengaturan, lalu klik “Restore JSON” atau “Restore Excel”.\n2. Pilih file cadangan yang tersimpan di perangkat Anda.\n3. Lakukan konfirmasi agar sistem memuat ulang seluruh data cadangan.",
        tip: "Perhatian: Proses restore akan menggantikan seluruh data yang sedang aktif pada perangkat."
      },
      {
        title: "Reset Tanggal Jatuh Tempo",
        description: "Apabila diperlukan penyeragaman batas waktu kredit, tombol “Reset Tanggal Jatuh Tempo” memungkinkan seluruh faktur disesuaikan menjadi jatuh tempo tepat 30 hari dari tanggal penerbitan masing-masing faktur.",
      },
      {
        title: "Reset Semua Data (Zona Berbahaya)",
        description: "Fitur ini hanya digunakan apabila Anda ingin mengosongkan seluruh catatan pembukuan dan memulai pencatatan dari awal. Pastikan Anda selalu melakukan Backup Data terlebih dahulu sebelum menjalankan aksi ini.",
      }
    ]
  },
  {
    id: "mobile-pwa",
    category: "mobile",
    title: "7. Mode Mobile & Pemasangan Aplikasi (PWA)",
    summary: "Kemudahan pengoperasian pada perangkat seluler dan panduan instalasi sebagai aplikasi mandiri di layar utama ponsel.",
    steps: [
      {
        title: "Dashboard Minimalis 1 Layar Penuh",
        description: "Pada perangkat smartphone, tampilan Dashboard dirancang ringkas tanpa guliran panjang sehingga kartu saldo, statistik tagihan, dan grafik ringkas dapat dipahami dalam sekali pandang.",
      },
      {
        title: "Navigasi Bar Bawah (Bottom Navbar)",
        description: "Saat diakses melalui ponsel atau tablet, navigasi utama ditempatkan pada bagian bawah layar (Dashboard, Input Faktur, Riwayat, Laporan, dan Menu Lainnya) agar mudah dijangkau dengan satu tangan.",
      },
      {
        title: "Pasang Aplikasi di Layar Utama Ponsel (Install PWA)",
        description: "Aplikasi ini mendukung teknologi Progressive Web App (PWA) sehingga dapat dipasang langsung pada perangkat Android maupun iPhone:\n- Melalui Browser Chrome Android: Klik tombol “Install Aplikasi” di sidebar atau ketuk menu titik tiga di pojok kanan atas browser, lalu pilih “Tambahkan ke Layar Utama” (Add to Home Screen).\n- Melalui Browser Safari iPhone: Ketuk tombol Share (ikon panah ke atas), lalu pilih “Add to Home Screen”.\nSetelah terpasang, aplikasi memiliki ikon tersendiri di layar utama dan terbuka dalam mode layar penuh tanpa bilah alamat browser.",
        tip: "Aplikasi beroperasi dengan sangat ringan dan responsif tanpa membebani kapasitas penyimpanan perangkat."
      }
    ]
  },
  {
    id: "gaya-navbar",
    category: "mobile",
    title: "8. Tema 3D, Profil Perusahaan & Kustomisasi Navbar",
    summary: "Pengaturan tema antarmuka berdimensi 3D, pembaruan profil dan logo perusahaan, mode minimize navbar, serta pusat notifikasi.",
    steps: [
      {
        title: "Memilih Tema 3D (8 Pilihan Gaya Berdimensi)",
        description: "Buka menu “Pengaturan”, kemudian pada panel “Tampilan & Tema 3D Navbar” pilih salah satu dari 8 tema berdimensi lengkap dengan aksen bevel dan pencahayaan terarah: Modern Clean 3D, Midnight Slate 3D, Deep Navy 3D, Emerald Forest 3D, Royal Purple 3D, Sunset Crimson 3D, Graphite Minimal 3D, atau Soft Sky 3D.",
        tip: "Seluruh panel kartu, tombol aksi, dan bilah navigasi otomatis menyesuaikan karakter 3D dari tema terpilih."
      },
      {
        title: "Edit Profil Perusahaan & Upload Icon Perusahaan",
        description: "Melalui panel “Profil & Icon Perusahaan” di menu Pengaturan:\n1. Upload Icon Logo: Seret dan lepas atau pilih berkas gambar (PNG, JPG, WEBP, atau SVG). Sistem otomatis menyesuaikan ukuran logo untuk ditampilkan pada navbar, header seluler, favicon browser, sampul buku panduan, serta laporan PDF.\n2. Edit Data Perusahaan: Lengkapi Nama Perusahaan atau Toko, Tagline, Nomor Telepon atau WhatsApp, Email, Nama Penanggung Jawab, NPWP, dan Alamat Lengkap.\n3. Klik “Simpan Profil Perusahaan” untuk menerapkan pembaruan secara menyeluruh.",
        tip: "Gunakan tombol “Pakai Default” kapan saja apabila ingin mengembalikan ikon logo bawaan aplikasi."
      },
      {
        title: "Mode Minimize (Kecilkan Navbar)",
        description: "Anda dapat memperkecil bilah navigasi samping menjadi mode ikon ringkas (80px) guna memperluas area kerja tabel faktur dan laporan:\n1. Klik tombol minimize pada sudut kanan atas sidebar desktop.\n2. Atau aktifkan sakelar “Minimize Navbar” pada halaman Pengaturan.\nSaat mode ringkas aktif, label teks disembunyikan dan tooltip nama menu muncul otomatis ketika kursor diarahkan ke ikon.",
        tip: "Sangat bermanfaat pada layar laptop beresolusi sedang agar tabel faktur tampil lega tanpa terpotong."
      },
      {
        title: "Tata Letak Navbar, Bentuk Tombol & Gaya Transisi Halaman",
        description: "Pengguna dapat memilih tata letak “Sidebar Kiri 3D” atau “Navbar Atas 3D”, menyesuaikan bentuk tombol navigasi, serta memilih 5 gaya animasi perpindahan halaman yang halus dan profesional (Precision 3D Stage, Directional Ledger, 3D Executive Tilt, Silk Editorial Veil, atau Instant Crossfade).",
      },
      {
        title: "Jam Realtime (8 Gaya) & Pusat Notifikasi Transaksi",
        description: "1. Jam Realtime & Tanggal: Pada tab “Gaya Jam” di menu Pengaturan, tersedia 8 pilihan tampilan jam waktu nyata lengkap beserta hari dan tanggal.\n2. Pusat Notifikasi: Setiap penambahan faktur, penerimaan pembayaran, pelunasan massal, atau perubahan data otomatis tercatat pada ikon lonceng di sudut kanan atas, lengkap dengan panel riwayat notifikasi, efek suara lonceng, serta dukungan notifikasi sistem perangkat.",
      }
    ]
  },
  {
    id: "tentang-developer",
    category: "alur",
    title: "9. Tentang Aplikasi, Hak Cipta & Developer Denuda",
    summary: "Informasi resmi mengenai identitas sistem, perlindungan hak cipta, serta profil Denuda selaku perancang dan pengembang aplikasi.",
    steps: [
      {
        title: "Developer Aplikasi: Denuda",
        description: "Aplikasi ini dirancang, dibangun, dan dikembangkan secara penuh oleh Denuda sebagai solusi digital pencatatan dan manajemen faktur penjualan, penagihan, serta pemantauan piutang usaha yang cepat, presisi, dan andal.",
        tip: "Dikembangkan dengan fokus tinggi pada kecepatan kerja serta kemudahan operasional pembukuan harian."
      },
      {
        title: "Hak Cipta Aplikasi",
        description: "Hak Cipta © 2026 Denuda. Seluruh hak cipta dilindungi undang-undang (All Rights Reserved). Seluruh tata letak antarmuka, arsitektur pengelolaan data, formula perhitungan, dan komponen fitur di dalam aplikasi ini dilindungi hak cipta resmi.",
      },
      {
        title: "Teknologi & Keamanan Data",
        description: "Dibangun menggunakan teknologi web modern (React 19, TypeScript, Tailwind CSS, dan PWA). Seluruh catatan transaksi tersimpan secara lokal di perangkat pengguna dan dapat dicadangkan maupun dipulihkan kapan saja dalam format JSON maupun Excel multi-sheet.",
      }
    ],
    faq: [
      {
        q: "Siapa developer yang merancang dan mengembangkan aplikasi ini?",
        a: "Aplikasi ini dirancang dan dikembangkan secara resmi oleh Denuda."
      },
      {
        q: "Apakah data transaksi perusahaan tersimpan dengan aman?",
        a: "Ya. Seluruh data tersimpan langsung secara lokal di perangkat Anda, dan Anda memiliki kendali penuh untuk melakukan pencadangan berkala ke file JSON maupun Excel."
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

  const renderInlineWithLeadLabel = (content: string) => {
    const colonIdx = content.indexOf(":");
    if (colonIdx > 0 && colonIdx <= 48) {
      const lead = content.slice(0, colonIdx + 1);
      const rest = content.slice(colonIdx + 1);
      if (rest.trim().length > 0 && !lead.includes("http")) {
        return (
          <>
            <strong className="font-semibold text-slate-900">{lead}</strong>
            {rest}
          </>
        );
      }
    }
    return content;
  };

  const renderBookFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return (
      <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
        {lines.map((rawLine, lIdx) => {
          const line = rawLine.trim();
          if (!line) return null;

          const numMatch = line.match(/^(\d+\.)\s+(.*)$/);
          const bulletMatch = line.match(/^-\s+(.*)$/);

          if (numMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-2">
                <span className="font-bold text-blue-900 shrink-0 w-5">
                  {numMatch[1]}
                </span>
                <p className="flex-1 text-justify">
                  {renderInlineWithLeadLabel(numMatch[2])}
                </p>
              </div>
            );
          }

          if (bulletMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <p className="flex-1 text-justify">
                  {renderInlineWithLeadLabel(bulletMatch[1])}
                </p>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-justify">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const bookLayout = useMemo(() => {
    interface BookTocRow {
      key: string;
      kind: "special" | "chapter" | "sub";
      label: string;
    }

    interface BookChapterSheet {
      pageNumber: number;
      section: GuideSection;
      sectionIndex: number;
      isContinuation: boolean;
      steps: { step: GuideSection["steps"][number]; stepIndex: number }[];
      includeFaq: boolean;
    }

    const tocRows: BookTocRow[] = [
      {
        key: "preface",
        kind: "special",
        label: "Kata Pengantar",
      },
      {
        key: "toc",
        kind: "special",
        label: "Daftar Isi",
      },
    ];

    GUIDE_DATA.forEach((sec, secIdx) => {
      tocRows.push({
        key: `chap-${sec.id}`,
        kind: "chapter",
        label: sec.title,
      });
      sec.steps.forEach((step, stepIdx) => {
        tocRows.push({
          key: `step-${sec.id}-${stepIdx}`,
          kind: "sub",
          label: `${secIdx + 1}.${stepIdx + 1}  ${step.title}`,
        });
      });
      if (sec.faq && sec.faq.length > 0) {
        tocRows.push({
          key: `faq-${sec.id}`,
          kind: "sub",
          label: `${secIdx + 1}.${sec.steps.length + 1}  Pertanyaan Umum (FAQ)`,
        });
      }
    });

    tocRows.push({
      key: "closing",
      kind: "special",
      label: "Catatan Penutup & Hak Cipta",
    });

    // Paginate TOC entries cleanly into A4 sheets (~182mm usable body budget)
    const tocChunks: BookTocRow[][] = [];
    let currentTocChunk: BookTocRow[] = [];
    let tocUsedMm = 26;

    tocRows.forEach((row) => {
      const rowH = row.kind === "sub" ? 5.6 : row.kind === "chapter" ? 9.5 : 8;
      if (tocUsedMm + rowH > 182 && currentTocChunk.length > 0) {
        tocChunks.push(currentTocChunk);
        currentTocChunk = [row];
        tocUsedMm = 26 + rowH;
      } else {
        currentTocChunk.push(row);
        tocUsedMm += rowH;
      }
    });
    if (currentTocChunk.length > 0) {
      tocChunks.push(currentTocChunk);
    }

    // Estimate step & FAQ vertical height in mm for clean A4 page breaks
    const estimateStepMm = (step: GuideSection["steps"][number]) => {
      const lines = step.description.split("\n").filter((l) => l.trim().length > 0);
      const descMm = lines.reduce(
        (acc, line) => acc + Math.max(1, Math.ceil(line.length / 76)) * 4.8 + 1.6,
        0
      );
      const tipMm = step.tip
        ? Math.max(1, Math.ceil(step.tip.length / 72)) * 4.6 + 10
        : 0;
      return 18 + descMm + tipMm;
    };

    const estimateFaqMm = (faq: { q: string; a: string }[]) => {
      return (
        12 +
        faq.reduce(
          (acc, f) =>
            acc +
            (Math.max(1, Math.ceil(f.q.length / 76)) +
              Math.max(1, Math.ceil(f.a.length / 76))) *
              4.6 +
            9,
          0
        )
      );
    };

    const pageMap: Record<string, number> = {
      preface: 1,
      toc: 2,
    };

    let nextPage = 2 + tocChunks.length; // Page 1 = Kata Pengantar, Page 2.. = Daftar Isi
    const chapterSheets: BookChapterSheet[] = [];
    const SHEET_BODY_BUDGET_MM = 172;

    GUIDE_DATA.forEach((section, sectionIndex) => {
      let currentSteps: { step: GuideSection["steps"][number]; stepIndex: number }[] = [];
      let usedMm = 28; // Chapter title banner height
      let isContinuation = false;

      const flushSheet = (includeFaq: boolean) => {
        const assignedPage = nextPage++;
        if (!isContinuation) {
          pageMap[`chap-${section.id}`] = assignedPage;
        }
        currentSteps.forEach((item) => {
          pageMap[`step-${section.id}-${item.stepIndex}`] = assignedPage;
        });
        if (includeFaq) {
          pageMap[`faq-${section.id}`] = assignedPage;
        }
        chapterSheets.push({
          pageNumber: assignedPage,
          section,
          sectionIndex,
          isContinuation,
          steps: currentSteps,
          includeFaq,
        });
        currentSteps = [];
        isContinuation = true;
        usedMm = 12; // Continuation banner height
      };

      section.steps.forEach((step, stepIndex) => {
        const stepMm = estimateStepMm(step);
        if (usedMm + stepMm > SHEET_BODY_BUDGET_MM && currentSteps.length > 0) {
          flushSheet(false);
        }
        currentSteps.push({ step, stepIndex });
        usedMm += stepMm;
      });

      const hasFaq = Boolean(section.faq && section.faq.length > 0);
      if (hasFaq && section.faq) {
        const faqMm = estimateFaqMm(section.faq);
        if (usedMm + faqMm > SHEET_BODY_BUDGET_MM && currentSteps.length > 0) {
          flushSheet(false);
          flushSheet(true);
        } else {
          flushSheet(true);
        }
      } else if (currentSteps.length > 0) {
        flushSheet(false);
      }
    });

    const closingPageNumber = nextPage;
    pageMap["closing"] = closingPageNumber;
    const totalContentPages = closingPageNumber;

    return {
      tocChunks,
      chapterSheets,
      pageMap,
      closingPageNumber,
      totalContentPages,
    };
  }, []);

  const renderPageHeaderBar = () => (
    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200 pb-2 mb-6">
      <span className="font-bold uppercase tracking-wider text-slate-600">
        Buku Panduan Penggunaan · {companyName}
      </span>
      <span>Edisi Resmi · Versi 2.5 Pro</span>
    </div>
  );

  const renderPageFooterBar = (pageNum: number, totalPages: number) => (
    <div className="mt-8 pt-3 border-t border-slate-200 grid grid-cols-3 items-center text-[11px] text-slate-500">
      <span className="text-left">© {currentYear} Denuda</span>
      <span className="text-center">Dicetak {printDateStr}</span>
      <span className="text-right font-bold text-slate-800">
        Halaman {pageNum} dari {totalPages}
      </span>
    </div>
  );

  const renderA4BookDocument = () => {
    const {
      tocChunks,
      chapterSheets,
      pageMap,
      closingPageNumber,
      totalContentPages,
    } = bookLayout;

    return (
      <div className="text-slate-900 font-sans">
        {/* ====================================================================
            SAMPUL BUKU RESMI (TIDAK DIHITUNG HALAMAN / TANPA NOMOR HALAMAN)
            ==================================================================== */}
        <section className="a4-book-cover border border-slate-200 rounded-lg bg-white relative overflow-hidden mb-8 print:border-0 print:rounded-none print:mb-0">
          {/* Architectural Left Spine */}
          <div className="absolute inset-y-0 left-0 flex pointer-events-none">
            <div className="w-3 sm:w-4 bg-slate-900" />
            <div className="w-1 bg-blue-600" />
            <div className="w-0.5 bg-amber-500" />
          </div>

          <div className="pl-9 pr-6 py-7 sm:pl-14 sm:pr-10 sm:py-10 min-h-[256mm] flex flex-col justify-between">
            {/* Top Corporate Masthead */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-5 py-4 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1.5 flex items-center justify-center shrink-0">
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
                  <p className="text-sm font-bold text-blue-700 mt-0.5 break-words">
                    {companyTagline}
                  </p>
                  {(companyProfile?.phone || companyProfile?.email || companyProfile?.address) && (
                    <p className="text-xs text-slate-500 mt-1 break-words leading-relaxed">
                      {[companyProfile?.phone, companyProfile?.email, companyProfile?.address]
                        .filter(Boolean)
                        .join("  |  ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Centered Hero Section (Rata Tengah Profesional) */}
            <div className="my-10 sm:my-12 text-center space-y-5 px-2">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-16 bg-blue-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <div className="h-px w-16 bg-blue-200" />
              </div>

              <div>
                <span className="inline-block px-4 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold uppercase tracking-widest">
                  Dokumentasi Resmi Operasional
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                  BUKU PANDUAN
                </h2>
                <p className="text-xl sm:text-3xl font-extrabold text-blue-900 tracking-wide">
                  PENGGUNAAN APLIKASI
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="w-16 h-1.5 bg-blue-600 rounded-full" />
                <div className="w-5 h-1.5 bg-amber-500 rounded-full" />
              </div>

              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Edisi Resmi · {companyName}
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto text-center">
                Panduan komprehensif tata kelola faktur penjualan, pencatatan pembayaran dan cicilan konsumen, pemantauan laporan jatuh tempo, pusat notifikasi transaksi, serta prosedur pengamanan cadangan data.
              </p>
            </div>

            {/* Bottom Document Control & Centered Copyright (Tanpa Nomor Halaman) */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="bg-blue-950 text-white text-center py-2 text-[11px] font-extrabold uppercase tracking-widest">
                  Informasi Dokumen &amp; Edisi
                </div>
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-500">Nama Sistem:</span>{" "}
                    <strong className="text-slate-900">{companyName} (Versi 2.5 Pro)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Cakupan Materi:</span>{" "}
                    <strong className="text-slate-900">{GUIDE_DATA.length} Bab Lengkap &amp; FAQ</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tanggal Penerbitan:</span>{" "}
                    <strong className="text-slate-900">{printDateStr}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Pengembang Resmi:</span>{" "}
                    <strong className="text-slate-900">Denuda</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-center space-y-1 text-xs">
                <div className="font-bold text-slate-800">
                  Hak Cipta © {currentYear} Denuda · Seluruh Hak Dilindungi Undang-Undang
                </div>
                <div className="text-[11px] text-slate-500">
                  Dokumen referensi operasional resmi sistem manajemen faktur dan piutang.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            HALAMAN 1 BUKU: KATA PENGANTAR (TERPISAH DARI DAFTAR ISI)
            ==================================================================== */}
        <section className="a4-book-front-page a4-book-page-break border border-slate-200 rounded-lg p-8 sm:p-11 sm:min-h-[256mm] bg-white mb-8 print:border-0 print:rounded-none print:p-0 print:mb-0 flex flex-col justify-between">
          <div>
            {renderPageHeaderBar()}

            <div className="text-center space-y-2 mb-7">
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                Prakata Penyusunan
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                KATA PENGANTAR
              </h3>
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="w-12 h-1 bg-blue-600 rounded-full" />
                <div className="w-4 h-1 bg-amber-500 rounded-full" />
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="text-justify">
                Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya Buku Panduan Penggunaan Aplikasi{" "}
                <strong className="text-slate-900">{companyName}</strong>. Dokumen ini dihadirkan sebagai rujukan operasional resmi bagi pimpinan usaha, staf administrasi, tim keuangan, serta bagian penagihan dalam menjalankan seluruh alur pengelolaan faktur penjualan dan pemantauan piutang secara terstruktur, transparan, dan akurat.
              </p>
              <p className="text-justify">
                Dalam dinamika operasional perdagangan modern, ketepatan pencatatan transaksi serta kecepatan pemantauan status pembayaran konsumen menjadi kunci utama menjaga kesehatan arus kas perusahaan. Aplikasi{" "}
                <strong className="text-slate-900">{companyName}</strong> dirancang secara khusus untuk menjawab kebutuhan tersebut melalui fitur input faktur terintegrasi, pencatatan cicilan berkala, penyaringan laporan jatuh tempo berbasis umur piutang maupun nominal, pusat notifikasi transaksi waktu nyata, hingga pelaporan lintas format (Excel, PDF, dan TXT).
              </p>
              <p className="text-justify">
                Buku panduan ini disusun secara sistematis ke dalam {GUIDE_DATA.length} (sembilan) bab utama yang mencakup gambaran alur kerja terpadu, tata cara penginputan dan impor data, mekanisme pelunasan piutang, manajemen basis data konsumen beserta analisis tren bulanan, prosedur cadangan dan pemulihan data (backup dan restore), hingga optimalisasi penggunaan di perangkat seluler serta kustomisasi antarmuka.
              </p>
              <p className="text-justify">
                Kami berharap buku panduan ini dapat menjadi pedoman praktis yang memudahkan setiap pengguna dalam mengoptimalkan seluruh kapabilitas sistem, meminimalkan kesalahan pencatatan administratif, serta mendukung kelancaran aktivitas bisnis harian. Masukan konstruktif senantiasa kami harapkan demi penyempurnaan sistem di masa mendatang.
              </p>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 border-l-4 border-l-blue-600 p-4 text-xs text-slate-600 italic leading-relaxed text-justify">
              <strong className="not-italic text-slate-800">Catatan Penggunaan:</strong> Untuk menjaga kesinambungan arsip pembukuan, pengelola disarankan membaca Bab 6 mengenai prosedur pencadangan data (Backup JSON dan Excel) sebelum memulai pengoperasian rutin secara penuh.
            </div>

            <div className="mt-8 text-right text-xs text-slate-600 space-y-1">
              <div>Diterbitkan pada {printDateStr}</div>
              <div>Hormat kami,</div>
              <div className="pt-8 inline-block border-t border-slate-300 min-w-[180px]">
                <div className="text-sm font-extrabold text-slate-900">Denuda</div>
                <div className="text-[11px] font-semibold text-blue-700">
                  Pengembang &amp; Arsitek Sistem
                </div>
              </div>
            </div>
          </div>

          {renderPageFooterBar(1, totalContentPages)}
        </section>

        {/* ====================================================================
            HALAMAN 2+: DAFTAR ISI LENGKAP (TERPISAH DARI KATA PENGANTAR)
            ==================================================================== */}
        {tocChunks.map((chunk, chunkIdx) => {
          const tocPageNum = 2 + chunkIdx;
          return (
            <section
              key={`toc-page-${tocPageNum}`}
              className="a4-book-front-page a4-book-page-break border border-slate-200 rounded-lg p-8 sm:p-11 sm:min-h-[256mm] bg-white mb-8 print:border-0 print:rounded-none print:p-0 print:mb-0 flex flex-col justify-between"
            >
              <div>
                {renderPageHeaderBar()}

                <div className="text-center space-y-2 mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                    Struktur Buku Panduan
                  </p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    DAFTAR ISI
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <div className="w-12 h-1 bg-blue-600 rounded-full" />
                    <div className="w-4 h-1 bg-amber-500 rounded-full" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {chunk.map((entry) => {
                    const targetPage = pageMap[entry.key] || 1;
                    if (entry.kind === "sub") {
                      return (
                        <div
                          key={entry.key}
                          className="pl-5 flex items-baseline text-[11px] text-slate-600 leading-snug py-0.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2 shrink-0 self-center" />
                          <span className="font-medium text-slate-700">{entry.label}</span>
                          <span className="flex-1 border-b border-dotted border-slate-300 mx-2 min-w-[16px]" />
                          <span className="font-mono font-bold text-blue-700 shrink-0">
                            Hal. {targetPage}
                          </span>
                        </div>
                      );
                    }

                    const isChapter = entry.kind === "chapter";
                    return (
                      <div
                        key={entry.key}
                        className={
                          isChapter
                            ? "mt-2 rounded-md bg-slate-50 border border-slate-200 border-l-3 border-l-blue-600 px-3 py-1.5"
                            : "py-1.5 border-b border-dotted border-slate-300"
                        }
                      >
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-xs font-extrabold ${
                              isChapter ? "text-slate-900" : "text-blue-950"
                            }`}
                          >
                            {entry.label}
                          </span>
                          <span className="flex-1 border-b border-dotted border-slate-300 mx-1 min-w-[16px]" />
                          <span className="text-xs font-mono font-bold text-blue-700 shrink-0">
                            Hal. {targetPage}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {renderPageFooterBar(tocPageNum, totalContentPages)}
            </section>
          );
        })}

        {/* ====================================================================
            ISI BAB PANDUAN (BERNOMOR HALAMAN BERURUTAN)
            ==================================================================== */}
        <div className="space-y-8">
          {chapterSheets.map((sheet) => (
            <article
              key={`sheet-${sheet.section.id}-${sheet.pageNumber}`}
              className="a4-book-front-page a4-book-page-break border border-slate-200 rounded-lg p-7 sm:p-10 sm:min-h-[256mm] bg-white print:border-0 print:rounded-none print:p-0 flex flex-col justify-between"
            >
              <div>
                {renderPageHeaderBar()}

                {!sheet.isContinuation ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 border-l-4 border-l-blue-900 p-4 mb-5">
                    <h3 className="text-base sm:text-lg font-extrabold text-blue-950">
                      {sheet.section.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed text-justify">
                      {sheet.section.summary}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 border border-slate-200 border-l-4 border-l-blue-600 px-3.5 py-2 mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-blue-950">
                      {sheet.section.title}
                    </h3>
                  </div>
                )}

                <div className="space-y-4">
                  {sheet.steps.map(({ step, stepIndex }) => (
                    <div
                      key={stepIndex}
                      className="a4-book-avoid-break rounded-lg border border-slate-200 p-4 space-y-2 bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {stepIndex + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {step.title}
                        </h4>
                      </div>
                      <div className="pl-8">
                        {renderBookFormattedText(step.description)}
                      </div>
                      {step.tip && (
                        <div className="ml-8 rounded-md bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 px-3 py-2 text-xs text-amber-900 text-justify">
                          <strong>Tips Operasional:</strong> {step.tip}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {sheet.includeFaq && sheet.section.faq && sheet.section.faq.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-200 space-y-2.5 a4-book-avoid-break">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      Pertanyaan Umum (FAQ)
                    </h5>
                    <div className="space-y-2">
                      {sheet.section.faq.map((f, fIdx) => (
                        <div
                          key={fIdx}
                          className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-justify space-y-1"
                        >
                          <div className="font-bold text-slate-900">
                            Pertanyaan: {f.q}
                          </div>
                          <div className="text-slate-600">
                            Jawaban: {f.a}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {renderPageFooterBar(sheet.pageNumber, totalContentPages)}
            </article>
          ))}

          {/* HALAMAN PENUTUP / KOLOFON */}
          <section className="a4-book-front-page border border-slate-200 rounded-lg p-8 sm:p-11 sm:min-h-[256mm] bg-white print:border-0 print:rounded-none print:p-0 flex flex-col justify-between">
            <div>
              {renderPageHeaderBar()}

              <div className="text-center space-y-2 mb-7">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                  Kolofon &amp; Pernyataan Resmi
                </p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  CATATAN PENUTUP &amp; HAK CIPTA
                </h3>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <div className="w-12 h-1 bg-blue-600 rounded-full" />
                  <div className="w-4 h-1 bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 text-white p-6 sm:p-8 space-y-4">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-center text-blue-300">
                  Dokumentasi Resmi · {companyName}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify">
                  Buku panduan ini diterbitkan sebagai referensi operasional resmi bagi seluruh pengguna aplikasi{" "}
                  <strong className="text-white">{companyName}</strong>. Demi menjaga keamanan dan keutuhan arsip transaksi perusahaan, pengguna sangat dianjurkan melakukan pencadangan data (Backup JSON maupun Excel) secara berkala melalui menu Pengaturan.
                </p>
                <div className="pt-4 border-t border-slate-700 text-center text-xs font-bold text-blue-300">
                  Dikembangkan oleh Denuda  ·  Hak Cipta © {currentYear} Denuda  ·  All Rights Reserved
                </div>
              </div>
            </div>

            {renderPageFooterBar(closingPageNumber, totalContentPages)}
          </section>
        </div>
      </div>
    );
  };

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
            <strong>Edisi Cetak Buku A4:</strong> Dilengkapi sampul resmi (tidak dihitung halaman), kata pengantar pada Halaman 1, daftar isi terpisah pada Halaman 2, serta {GUIDE_DATA.length} bab lengkap siap cetak atau jilid.
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
