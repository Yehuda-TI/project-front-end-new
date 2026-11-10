import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatRupiah, formatRelativeDate } from '@/utils/formatters';
import { ConditionBadge } from '@/components/ui/Badge';
import { User, Clock, ImageOff } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = React.useState(false);
  const isSold = product.status === 'sold';
  const mainImage = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Gambar Thumbnail */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={product.title}
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

        {/* Condition Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <ConditionBadge condition={product.condition} />
        </div>

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md">
              Sudah Terjual
            </span>
          </div>
        )}
      </div>

      {/* Informasi Produk */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category & Time */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="font-semibold text-indigo-600 truncate max-w-[140px]">
            {product.category}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(product.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors mb-2">
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-baseline justify-between">
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            {formatRupiah(product.price)}
          </span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-50 text-xs text-slate-500">
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
            <User className="w-3 h-3 text-slate-400" />
          </div>
          <span className="truncate text-[11px] font-medium text-slate-600">
            {product.sellerName || 'Mahasiswa'}
          </span>
        </div>
      </div>
    </Link>
  );
};
