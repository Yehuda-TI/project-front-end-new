import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '@/types';
import { fetchProductById } from '@/services/product.service';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatRelativeDate, cleanWhatsappNumber } from '@/utils/formatters';
import { ConditionBadge, StatusBadge, CategoryBadge } from '@/components/ui/Badge';
import { 
  MessageCircle, 
  Share2, 
  ShieldCheck, 
  Clock, 
  User as UserIcon, 
  ArrowLeft, 
  AlertCircle, 
  Edit3, 
  Check, 
  ImageOff 
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (err) {
        console.error('Error loading product detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-200 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-8 w-1/3 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">
          Barang yang Anda cari mungkin telah dihapus oleh pemiliknya atau tautan tidak valid.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Marketplace</span>
        </Link>
      </div>
    );
  }

  const isOwner = user && user.uid === product.sellerId;
  const isSold = product.status === 'sold';
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];
  const currentImage = images[activeImageIndex] || null;

  // Build WhatsApp URL
  const waNumber = product.sellerWhatsapp ? cleanWhatsappNumber(product.sellerWhatsapp) : '';
  const waMessage = encodeURIComponent(
    `Halo ${product.sellerName}, saya tertarik dengan barang "${product.title}" seharga ${formatRupiah(product.price)} yang Anda iklankan di CampusMarket. Apakah masih tersedia dan bisa COD di kampus?`
  );
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waMessage}` : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Produk</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            {currentImage ? (
              <img
                src={currentImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="w-12 h-12 mb-2" />
                <span className="text-xs">Tidak ada foto</span>
              </div>
            )}

            {isSold && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-5 py-2 bg-red-600 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg">
                  Barang Ini Sudah Terjual
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-indigo-600 scale-105 shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Actions */}
        <div className="flex flex-col space-y-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={product.category} />
              <ConditionBadge condition={product.condition} />
              <StatusBadge status={product.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Diposting {formatRelativeDate(product.createdAt)}
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs text-slate-500 font-medium block mb-1">Harga Barang</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {formatRupiah(product.price)}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deskripsi Barang
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-100">
              {product.description}
            </div>
          </div>

          {/* Seller Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {product.sellerPhotoURL ? (
                <img
                  src={product.sellerPhotoURL}
                  alt={product.sellerName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {product.sellerName ? product.sellerName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
              )}
              <div>
                <span className="text-xs text-slate-400 block">Penjual</span>
                <span className="text-sm font-bold text-slate-800">{product.sellerName}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mahasiswa Terverifikasi</span>
            </div>
          </div>

          {/* Contact Action */}
          <div className="space-y-3 pt-2">
            {isOwner ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Ini adalah iklan barang milik Anda sendiri.
                </p>
                <p className="text-amber-700 leading-normal">
                  Anda tidak dapat menghubungi diri sendiri. Silakan kelola status atau hapus iklan ini dari menu Iklan Saya.
                </p>
                <Link
                  to="/my-products"
                  className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:underline pt-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Buka Kelola Iklan Saya
                </Link>
              </div>
            ) : isSold ? (
              <div className="p-4 bg-slate-100 rounded-2xl text-center text-slate-500 text-xs font-semibold">
                Barang ini sudah terjual dan tidak dapat dipesan lagi.
              </div>
            ) : waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Hubungi Penjual via WhatsApp</span>
              </a>
            ) : product.sellerEmail ? (
              <a
                href={`mailto:${product.sellerEmail}?subject=Pertanyaan produk ${encodeURIComponent(product.title)}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                Hubungi via Email ({product.sellerEmail})
              </a>
            ) : (
              <div className="p-3 bg-slate-100 text-slate-500 text-xs rounded-xl text-center">
                Penjual belum mencantumkan kontak publik.
              </div>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Tautan Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Bagikan Tautan Produk</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
