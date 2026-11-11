import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updateUserProfileData } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  CheckCircle, 
  ShieldCheck,
  Sliders 
} from 'lucide-react';
import { ProductCategory } from '@/types';

const AVAILABLE_CATEGORIES: ProductCategory[] = [
  'Laptop & Komputer',
  'Smartphone & Tablet',
  'Audio & Aksesori',
  'Kamera & Fotografi',
  'Perlengkapan Belajar',
  'Peralatan Rumah Tangga',
];

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsappNumber || '');
  const [campusName, setCampusName] = useState(profile?.campusName || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Preferensi Belanja untuk Modul Rekomendasi CRS
  const [budgetMin, setBudgetMin] = useState<number>(profile?.preferences?.budgetMin ?? 200000);
  const [budgetMax, setBudgetMax] = useState<number>(profile?.preferences?.budgetMax ?? 10000000);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(
    profile?.preferences?.favoriteCategories || ['Laptop & Komputer', 'Smartphone & Tablet']
  );

  const [saving, setSaving] = useState(false);

  const handleToggleCategory = (cat: string) => {
    setFavoriteCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateUserProfileData(user.uid, {
        displayName,
        whatsappNumber,
        campusName,
        bio,
        preferences: {
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          favoriteCategories,
        },
      });
      await refreshProfile();
      success('Profil & preferensi belanja Anda berhasil diperbarui!');
    } catch (err) {
      console.error('Error saving profile:', err);
      toastError('Gagal menyimpan perubahan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-600 text-white font-bold text-3xl flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200">
          {(profile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
        </div>

        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {profile?.displayName || 'Mahasiswa Kampus'}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akun Terverifikasi
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {user?.email}
          </p>

          <p className="text-xs text-slate-400">
            {profile?.campusName ? `Mahasiswa di ${profile.campusName}` : 'Mahasiswa Kampus'}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Bagian 1: Data Diri */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Informasi Akun & Kontak</h2>
              <p className="text-xs text-slate-500">
                Data identitas profil Anda di sistem CampusMarket
              </p>
            </div>

            <Input
              label="Nama Lengkap"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Nomor WhatsApp"
              type="tel"
              placeholder="081234567890"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Input
              label="Asal Universitas / Kampus"
              type="text"
              placeholder="Contoh: Universitas Indonesia, ITB, UGM..."
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              leftIcon={<School className="w-4 h-4" />}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Bio Singkat</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan minat atau program studi Anda..."
                className="w-full text-sm rounded-xl border border-slate-300 p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
              ></textarea>
            </div>
          </div>

          {/* Bagian 2: Preferensi Rekomendasi CRS (Inti Paper) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>Preferensi Belanja Asisten AI (CRS)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Preferensi ini otomatis digunakan oleh modul CRS untuk menghitung skor kandidat produk terbaik bagi Anda
                </p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                CRS Personalization
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Batas Anggaran Minimum (Rp)"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                helperText="Batas bawah harga produk yang diutamakan"
              />

              <Input
                label="Batas Anggaran Maksimum (Rp)"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                helperText="Batas atas harga produk yang diutamakan"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Kategori Produk Favorit Anda (Pilih minimal 1):
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isSelected = favoriteCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Produk dengan kategori yang Anda pilih akan mendapat bonus skor relevansi +20 poin saat Asisten AI merekomendasikan produk.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Simpan Profil & Preferensi CRS
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
};
