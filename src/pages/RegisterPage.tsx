import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerUser, translateAuthError } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Eye, EyeOff, Lock, Mail, User, Phone, Sparkles } from 'lucide-react';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  whatsappNumber: z.string().optional(),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { success } = useToast();
  const { setSessionUser, loginAsDemoUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setAuthError(null);
    try {
      const profile = await registerUser(
        values.email,
        values.password,
        values.displayName,
        values.whatsappNumber
      );
      
      // Sinkronkan state sesi ke AuthContext
      setSessionUser(profile);
      success('Akun Anda berhasil dibuat! Selamat datang di CampusMarket.');
      navigate('/catalog', { replace: true });
    } catch (err: any) {
      console.error('Register error:', err);
      const code = err.code || '';
      setAuthError(translateAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    loginAsDemoUser();
    success('Berhasil masuk menggunakan Akun Demo Mahasiswa!');
    navigate('/catalog', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/catalog" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Daftar Akun Mahasiswa
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Bergabung bersama ribuan mahasiswa untuk jual & beli kebutuhan kuliah
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          
          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed space-y-2">
              <p>{authError}</p>
              <button
                type="button"
                onClick={handleDemoMode}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Atau langsung masuk dengan 1-Klik Mode Demo
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Contoh: sompie yehuda sompie"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.displayName?.message}
              {...register('displayName')}
            />

            <Input
              label="Alamat Email Kampus"
              type="email"
              placeholder="12510220@student.unklab.ac.id"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Nomor WhatsApp (Opsional)"
              type="tel"
              placeholder="0853428888329"
              leftIcon={<Phone className="w-4 h-4" />}
              helperText="Digunakan agar calon pembeli dapat langsung menghubungi Anda"
              error={errors.whatsappNumber?.message}
              {...register('whatsappNumber')}
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Konfirmasi Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi kata sandi"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm"
            >
              Daftar Sekarang
            </Button>

          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 text-center text-xs text-slate-500">
            <div>
              Sudah memiliki akun?{' '}
              <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                Masuk di sini
              </Link>
            </div>
            <div>
              <button
                type="button"
                onClick={handleDemoMode}
                className="text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Coba langsung dengan Akun Demo (Tanpa Daftar)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
