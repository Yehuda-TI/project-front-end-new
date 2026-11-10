import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { fetchUserProducts, updateProductStatus, deleteProductListing } from '@/services/product.service';
import { Product } from '@/types';
import { formatRupiah, formatRelativeDate } from '@/utils/formatters';
import { StatusBadge, ConditionBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  ExternalLink, 
  Package, 
  AlertTriangle, 
  RotateCcw,
  ImageOff
} from 'lucide-react';

export const MyProductsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);

  const loadMyProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserProducts(user.uid);
      setProducts(data);
    } catch (err) {
      console.error('Error fetching user products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyProducts();
  }, [user]);

  const handleToggleSold = async (product: Product) => {
    const nextStatus = product.status === 'available' ? 'sold' : 'available';
    try {
      await updateProductStatus(product.id, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
      success(
        nextStatus === 'sold'
          ? 'Barang ditandai sebagai Terjual!'
          : 'Barang kembali diaktifkan sebagai Tersedia.'
      );
    } catch (err) {
      console.error('Error toggling sold status:', err);
      toastError('Gagal mengubah status barang.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteProduct) return;
    setDeletingId(confirmDeleteProduct.id);
    try {
      await deleteProductListing(confirmDeleteProduct.id, confirmDeleteProduct.storagePaths);
      setProducts((prev) => prev.filter((p) => p.id !== confirmDeleteProduct.id));
      success('Iklan barang berhasil dihapus.');
      setConfirmDeleteProduct(null);
    } catch (err) {
      console.error('Error deleting listing:', err);
      toastError('Gagal menghapus iklan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Iklan Barang Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola barang dagangan Anda, ubah status ketersediaan, atau hapus iklan
          </p>
        </div>

        <Link
          to="/create-product"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shadow-indigo-200 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Pasang Iklan Baru</span>
        </Link>
      </div>

      {/* Listing Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl w-full"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product) => {
            const isSold = product.status === 'sold';
            const mainImg = product.imageUrls && product.imageUrls[0] ? product.imageUrls[0] : null;

            return (
              <div
                key={product.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-300 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                  {mainImg ? (
                    <img src={mainImg} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-indigo-600">{product.category}</span>
                    <ConditionBadge condition={product.condition} />
                    <StatusBadge status={product.status} />
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
                    {product.title}
                  </h3>

                  <p className="text-base font-extrabold text-slate-900">
                    {formatRupiah(product.price)}
                  </p>

                  <span className="text-[11px] text-slate-400 block">
                    Dipublikasikan {formatRelativeDate(product.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  
                  {/* Toggle Sold */}
                  <button
                    onClick={() => handleToggleSold(product)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      isSold
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {isSold ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tandai Tersedia</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Tandai Terjual</span>
                      </>
                    )}
                  </button>

                  {/* View Details */}
                  <Link
                    to={`/products/${product.id}`}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                    title="Lihat Halaman Produk"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => setConfirmDeleteProduct(product)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                    title="Hapus Iklan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Anda belum memiliki iklan barang</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Punya barang bekas atau perlengkapan kuliah yang tidak terpakai? Pasang iklan sekarang dan dapatkan uang tambahan!
            </p>
          </div>
          <Link
            to="/create-product"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Mulai Pasang Iklan Sekarang</span>
          </Link>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Iklan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus iklan <strong>"{confirmDeleteProduct.title}"</strong>? Seluruh foto dan data akan dihapus permanen dari Firebase.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteProduct(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={Boolean(deletingId)}
                onClick={handleDelete}
              >
                Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
