import React, { useState, useRef, useEffect } from "react";
import { CompanyProfile } from "../types";
import { CompanyLogo } from "./CompanyLogo";
import {
  Building2,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  FileBadge2,
  Image as ImageIcon,
  Save,
  Trash2,
} from "lucide-react";

interface CompanyProfilePanelProps {
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  onReset: () => void;
}

const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar (PNG, JPG, WEBP, atau SVG)."));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Ukuran file terlalu besar (maksimal 8 MB)."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const result = reader.result as string;

      // If small SVG (< 40 KB), keep crisp SVG data URI
      if (file.type === "image/svg+xml" && result.length < 45000) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak dapat diproses."));
      img.onload = () => {
        const MAX_SIZE = 256;
        let width = img.width || MAX_SIZE;
        let height = img.height || MAX_SIZE;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Preserve transparency for PNG/WEBP/SVG, otherwise crisp JPEG
        const outputType =
          file.type === "image/png" || file.type === "image/webp" || file.type === "image/svg+xml"
            ? "image/webp"
            : "image/jpeg";
        const compressed = canvas.toDataURL(outputType, 0.86);
        resolve(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
};

export function CompanyProfilePanel({
  profile,
  onSave,
  onReset,
}: CompanyProfilePanelProps) {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDirty) {
      setFormData(profile);
    }
  }, [profile, isDirty]);

  const handleFieldChange = (field: keyof CompanyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSavedNotice(false);
  };

  const handleImageSelect = async (file?: File) => {
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, iconUrl: dataUrl }));
      setIsDirty(true);
      setSavedNotice(false);
    } catch (err: any) {
      setUploadError(err?.message || "Gagal mengunggah icon perusahaan.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleImageSelect(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleImageSelect(file);
  };

  const handleRemoveIcon = () => {
    setFormData((prev) => ({ ...prev, iconUrl: "" }));
    setUploadError(null);
    setIsDirty(true);
    setSavedNotice(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setUploadError("Nama perusahaan wajib diisi.");
      return;
    }
    setUploadError(null);
    onSave(formData);
    setIsDirty(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 4000);
  };

  const handleConfirmReset = () => {
    onReset();
    setIsDirty(false);
    setConfirmReset(false);
    setUploadError(null);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_0_#1e40af,0_8px_16px_-4px_rgba(37,99,235,0.35)]">
            <Building2 size={21} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Profil & Icon Perusahaan</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Ubah nama toko/perusahaan, kontak, alamat, dan upload icon logo yang tampil di aplikasi & laporan PDF.
            </p>
          </div>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border-b-2 border-slate-300 transition-all self-start sm:self-auto"
          >
            <RotateCcw size={13} />
            <span>Reset Default</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-medium text-rose-700">Kembalikan default?</span>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Ya, Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banners */}
      {savedNotice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-medium text-emerald-800">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Profil dan icon perusahaan berhasil disimpan dan diterapkan di seluruh aplikasi.</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-medium text-rose-800">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Icon & Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload Icon / Logo Perusahaan
            </label>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50/70 scale-[1.01]"
                  : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                {/* 3D Preview of Icon */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <CompanyLogo
                      iconUrl={formData.iconUrl}
                      companyName={formData.name}
                      className="w-20 h-20 rounded-2xl"
                      alt="Preview Logo Kotak"
                    />
                    <span className="text-[10px] font-medium text-slate-500">Ikon Navbar</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CompanyLogo
                      iconUrl={formData.iconUrl}
                      companyName={formData.name}
                      className="w-16 h-16 rounded-full"
                      alt="Preview Logo Bulat"
                    />
                    <span className="text-[10px] font-medium text-slate-500">Badge Bulat</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Tarik & lepas gambar di sini, atau pilih file
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Format: PNG, JPG, WEBP, SVG · Otomatis dioptimalkan ke 256×256 px
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
                  >
                    <Upload size={14} />
                    <span>{formData.iconUrl ? "Ganti Icon" : "Upload Icon"}</span>
                  </button>

                  {formData.iconUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Pakai Default</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Mini Header Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-white shadow-inner space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon size={12} className="text-blue-400" />
                Pratinjau Kop Navbar & Dokumen
              </span>
              <div className="flex items-start gap-3 pt-1">
                <CompanyLogo
                  iconUrl={formData.iconUrl}
                  companyName={formData.name}
                  className="w-10 h-10 rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-white break-words whitespace-normal leading-snug">
                    {formData.name || "Nama Perusahaan"}
                  </div>
                  <div className="text-[11px] text-blue-300 break-words whitespace-normal leading-tight mt-0.5">
                    {formData.tagline || "Manajemen Faktur"}
                  </div>
                </div>
              </div>
              {(formData.address || formData.phone) && (
                <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-2 break-words whitespace-normal leading-relaxed">
                  {[formData.phone, formData.address].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Company Details Form */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Perusahaan / Nama Toko <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="Contoh: Apotek Assyifa Farma / CV Maju Jaya"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tagline / Bidang Usaha
              </label>
              <input
                type="text"
                maxLength={60}
                value={formData.tagline}
                onChange={(e) => handleFieldChange("tagline", e.target.value)}
                placeholder="Contoh: Distributor Farmasi & Alat Kesehatan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  maxLength={30}
                  value={formData.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Perusahaan
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  maxLength={60}
                  value={formData.email || ""}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="admin@perusahaan.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Pemilik / Penanggung Jawab
              </label>
              <div className="relative">
                <UserCheck
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  maxLength={50}
                  value={formData.ownerName || ""}
                  onChange={(e) => handleFieldChange("ownerName", e.target.value)}
                  placeholder="Nama pimpinan / admin"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NPWP / Nomor Izin Usaha
              </label>
              <div className="relative">
                <FileBadge2
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  maxLength={40}
                  value={formData.npwp || ""}
                  onChange={(e) => handleFieldChange("npwp", e.target.value)}
                  placeholder="Opsional"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Lengkap Perusahaan
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3.5 top-3 text-slate-400"
                />
                <textarea
                  rows={3}
                  maxLength={200}
                  value={formData.address || ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Jl. Raya Utama No. 123, Kota / Kabupaten..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {isDirty
                  ? "Ada perubahan yang belum disimpan."
                  : "Profil tersimpan dan tersinkronisasi."}
              </span>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
              >
                <Save size={16} />
                <span>Simpan Profil Perusahaan</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
