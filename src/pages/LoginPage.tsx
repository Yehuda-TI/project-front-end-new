import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginUser, translateAuthError } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const { loginAsDemoUser, setSessionUser } = useAuth();

  const rawFrom = (location.state as any)?.from?.pathname;
  const targetDestination = rawFrom && rawFrom !== '/login' && rawFrom !== '/register' && rawFrom !== '/marketplace'
    ? rawFrom
    : '/catalog';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await loginUser(values.email, values.password);
      if (res.profile) {
        setSessionUser(res.profile);
      }
      success('Berhasil masuk! Selamat datang di CampusMarket.');
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err.code || '';
      setAuthError(translateAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoUser();
    success('Berhasil masuk sebagai Mahasiswa Demo!');
    navigate(targetDestination, { replace: true });
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/catalog" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gunakan email dan kata sandi untuk melanjutkan
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Quick Demo Login Option */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-center">
            <span className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Mode Akses Instan
            </span>
            <p className="text-[11px] text-emerald-700">
              Uji langsung seluruh fitur katalog, konsultasi AI, wishlist, dan profil tanpa perlu input kata sandi.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              ⚡ Masuk Langsung Sebagai Mahasiswa Demo
            </button>
          </div>

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed space-y-2">
              <p>{authError}</p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Atau langsung masuk dengan Mode Demo
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            <Input
              label="Alamat Email Mahasiswa"
              type="email"
              placeholder="nama@student.campus.ac.id"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
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
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl shadow-sm"
            >
              Masuk Sekarang
            </Button>

          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Belum memiliki akun?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
              Daftar akun baru
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
