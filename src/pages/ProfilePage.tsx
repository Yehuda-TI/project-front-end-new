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
  ShieldCheck 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsappNumber || '');
  const [campusName, setCampusName] = useState(profile?.campusName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

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
      });
      await refreshProfile();
      success('Profil Anda berhasil diperbarui!');
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
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-600 text-white font-bold text-3xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100">
          {(profile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
        </div>

        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {profile?.displayName || 'Mahasiswa Kampus'}
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Akun Aktif
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {user?.email}
          </p>

          <p className="text-xs text-slate-400">
            {profile?.campusName ? `Mahasiswa di ${profile.campusName}` : 'Belum memilih kampus'}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Ubah Informasi Kontak & Profil</h2>
          <p className="text-xs text-slate-500">
            Informasi ini mempermudah sesama mahasiswa saat bertransaksi dengan Anda
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
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
            helperText="Nomor ini akan otomatis digunakan sebagai tombol chat pada iklan barang Anda"
          />

          <Input
            label="Asal Universitas / Kampus"
            type="text"
            placeholder="Contoh: Universitas Indonesia, ITB, UGM, Unair..."
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
              placeholder="Contoh: Mahasiswa semester akhir teknik informatika, sering jual buku preloved..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Simpan Perubahan
            </Button>
          </div>

        </form>
      </div>

    </div>
  );
};
