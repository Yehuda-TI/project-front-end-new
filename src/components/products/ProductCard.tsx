import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatRupiah } from '@/utils/formatters';
import { CategoryBadge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { addToWishlist, removeFromWishlist, checkIsInWishlist } from '@/services/wishlist.service';
import { Heart, ImageOff, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const [imageError, setImageError] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const mainImage = product.imageUrl || (product.imageUrls && product.imageUrls[0]) || '';
  const displayName = product.name || product.title || 'Produk E-Commerce';

  useEffect(() => {
    let isMounted = true;
    const checkWishlistStatus = async () => {
      const activeUid = user ? user.uid : 'demo-user-1';
      try {
        const saved = await checkIsInWishlist(activeUid, product.id);
        if (isMounted) setInWishlist(saved);
      } catch {
        // ignore
      }
    };
    checkWishlistStatus();
    return () => {
      isMounted = false;
    };
  }, [user, product.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const activeUid = user ? user.uid : 'demo-user-1';
    setLoadingWishlist(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(activeUid, product.id);
        setInWishlist(false);
        success(`"${displayName}" dihapus dari Wishlist.`);
      } else {
        await addToWishlist(activeUid, product.id, 'Disimpan dari rekomendasi katalog');
        setInWishlist(true);
        success(`"${displayName}" berhasil disimpan ke Wishlist!`);
      }
    } catch (err) {
      toastError('Gagal memperbarui wishlist.');
    } finally {
      setLoadingWishlist(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200">
      {/* Gambar Thumbnail */}
      <Link to={`/products/${product.id}`} className="block relative aspect-square w-full bg-slate-100 overflow-hidden">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={displayName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
            <ImageOff className="w-8 h-8 mb-1" />
            <span className="text-[10px]">Foto tidak tersedia</span>
          </div>
        )}

        {/* Category Badge di atas kiri */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <CategoryBadge category={product.category} />
        </div>

        {/* Tombol Simpan ke Wishlist (Top Right) */}
        <button
          onClick={handleWishlistToggle}
          disabled={loadingWishlist}
          title={inWishlist ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
          className={`absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
            inWishlist
              ? 'bg-rose-500 text-white hover:bg-rose-600 scale-105'
              : 'bg-white/90 backdrop-blur-sm text-slate-600 hover:text-rose-500 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-white' : ''}`} />
        </button>
      </Link>

      {/* Informasi Produk */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors mb-1.5">
            {displayName}
          </h3>
        </Link>

        {/* Deskripsi Singkat */}
        {!compact && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {product.description}
          </p>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & Action Button */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
              Harga
            </span>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(product.price)}
            </span>
          </div>

          <button
            onClick={handleWishlistToggle}
            disabled={loadingWishlist}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              inWishlist
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current text-rose-600' : 'text-emerald-600'}`} />
            <span>{inWishlist ? 'Tersimpan' : 'Wishlist'}</span>
          </button>
        </div>

        {/* AI Quick Query Button */}
        <Link
          to={`/chat?query=${encodeURIComponent(`Saya tertarik dengan ${displayName}, apa kelebihan dan kekurangannya?`)}`}
          className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 hover:border-emerald-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Konsultasi ke AI Pre-Sales</span>
        </Link>
      </div>
    </div>
  );
};
