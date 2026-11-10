import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword, translateAuthError } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await resetPassword(values.email);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(translateAuthError(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Reset Kata Sandi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Masukkan alamat email yang terdaftar untuk menerima tautan penyetelan ulang kata sandi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Email Telah Dikirim!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan periksa kotak masuk atau folder spam email Anda untuk instruksi pengaturan ulang kata sandi.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 pt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Alamat Email Terdaftar"
                  type="email"
                  placeholder="nama@student.campus.ac.id"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full mt-2"
                >
                  Kirim Tautan Reset
                </Button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke login</span>
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
