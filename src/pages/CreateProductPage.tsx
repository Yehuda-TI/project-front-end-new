import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { uploadProductImage } from '@/services/storage.service';
import { createProductListing } from '@/services/product.service';
import { ProductCategory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  X, 
  Phone, 
  Tag, 
  AlertCircle 
} from 'lucide-react';

const CATEGORIES: ProductCategory[] = [
  'Buku & Kuliah',
  'Elektronik & Gadget',
  'Perlengkapan Kos',
  'Fashion & Aksesori',
  'Hobi & Olahraga',
  'Lainnya',
];

const productSchema = z.object({
  title: z.string().min(5, 'Judul barang minimal 5 karakter').max(100, 'Judul maksimal 100 karakter'),
  price: z.coerce.number().positive('Harga harus lebih besar dari 0').min(1000, 'Harga minimal Rp 1.000'),
  category: z.enum([
    'Buku & Kuliah',
    'Elektronik & Gadget',
    'Perlengkapan Kos',
    'Fashion & Aksesori',
    'Hobi & Olahraga',
    'Lainnya',
  ] as const),
  condition: z.enum(['new', 'used'] as const),
  description: z.string().min(15, 'Deskripsi barang minimal 15 karakter agar pembeli paham'),
  whatsappNumber: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const CreateProductPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: 'Buku & Kuliah',
      condition: 'used',
      whatsappNumber: profile?.whatsappNumber || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Maksimal 5 foto per barang
    if (selectedFiles.length + files.length > 5) {
      toastError('Maksimal 5 foto per barang.');
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toastError(`Foto "${file.name}" melebihi batas 5MB.`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user) {
      toastError('Anda harus login terlebih dahulu.');
      return;
    }

    if (selectedFiles.length === 0) {
      setFormError('Harap unggah minimal 1 foto produk.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setUploadProgress(10);

    try {
      const tempProductId = 'prod_' + Date.now();
      const imageUrls: string[] = [];
      const storagePaths: string[] = [];

      // 1. Unggah foto-foto ke Firebase Storage
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const res = await uploadProductImage(user.uid, tempProductId, file, (percent) => {
          // Hitung estimasi progress agregat
          const stepProgress = 10 + Math.round((percent / selectedFiles.length) * 0.7);
          setUploadProgress(stepProgress);
        });
        imageUrls.push(res.url);
        storagePaths.push(res.storagePath);
      }

      setUploadProgress(85);

      // 2. Simpan data produk ke Cloud Firestore
      const newProductId = await createProductListing({
        sellerId: user.uid,
        sellerName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Mahasiswa',
        sellerEmail: user.email || '',
        sellerPhotoURL: profile?.photoURL || user.photoURL || null,
        sellerWhatsapp: values.whatsappNumber || profile?.whatsappNumber || '',
        title: values.title,
        description: values.description,
        price: values.price,
        category: values.category,
        condition: values.condition,
        imageUrls: imageUrls,
        storagePaths: storagePaths,
        status: 'available',
      });

      setUploadProgress(100);
      success('Iklan barang Anda berhasil dipublikasikan!');
      navigate(`/products/${newProductId}`);
    } catch (err: any) {
      console.error('Error creating product:', err);
      setFormError(err.message || 'Gagal memasang iklan. Silakan periksa koneksi Anda.');
      toastError('Terjadi kesalahan saat memasang iklan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pasang Iklan Barang Baru / Preloved
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Barang Anda akan langsung tampil di marketplace mahasiswa
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        
        {formError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Bagian Foto Produk */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Foto Barang <span className="text-rose-500">*</span>
              <span className="text-[11px] font-normal text-slate-400 ml-1.5 lowercase">
                (maks 5 foto, format JPG/PNG/WEBP, maks 5MB/foto)
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {previews.map((previewUrl, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full transition-colors shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/70 text-white text-[9px] font-bold rounded">
                      Utama
                    </span>
                  )}
                </div>
              ))}

              {previews.length < 5 && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50 hover:bg-indigo-50/50 transition-colors text-slate-400 hover:text-indigo-600">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-semibold">+ Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={submitting}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Judul Produk */}
          <Input
            label="Nama / Judul Barang"
            placeholder="Contoh: Buku Kalkulus Thomas Edisi 13 Original"
            leftIcon={<Tag className="w-4 h-4" />}
            required
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Kategori & Kondisi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kategori Produk <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('category')}
                className="w-full text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Kondisi Barang <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700">
                  <input type="radio" value="used" {...register('condition')} className="text-indigo-600" />
                  Bekas (Preloved)
                </label>
                <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700">
                  <input type="radio" value="new" {...register('condition')} className="text-indigo-600" />
                  Baru (Gress)
                </label>
              </div>
            </div>
          </div>

          {/* Harga */}
          <Input
            label="Harga Jual (Rupiah)"
            type="number"
            placeholder="Contoh: 125000"
            helperText="Tentukan harga yang wajar dan ramah kantong mahasiswa"
            required
            error={errors.price?.message}
            {...register('price')}
          />

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Deskripsi Barang <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Jelaskan kondisi barang, kelengkapan, minus (jika ada), serta preferensi lokasi COD di kampus..."
              className={`w-full text-sm rounded-xl border p-3.5 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
              }`}
              {...register('description')}
            ></textarea>
            {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
          </div>

          {/* Nomor WhatsApp */}
          <Input
            label="Nomor WhatsApp untuk Pembeli"
            type="tel"
            placeholder="081234567890"
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Nomor ini akan digunakan calon pembeli untuk menghubungi Anda langsung via chat WhatsApp"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />

          {/* Progress bar jika sedang mengunggah */}
          {submitting && (
            <div className="space-y-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex justify-between text-xs font-semibold text-indigo-900">
                <span>Mengunggah foto & menyimpan data ke Firebase...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
            >
              Publikasikan Iklan Sekarang
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
