import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WishlistItem } from '@/types';
import { getWishlist, updateWishlistNote, removeFromWishlist } from '@/services/wishlist.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatRupiah, formatRelativeDate } from '@/utils/formatters';
import { CategoryBadge } from '@/components/ui/Badge';
import { 
  Heart, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ArrowRight, 
  ImageOff, 
  AlertTriangle, 
  Save, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk editing catatan
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState('');

  // State untuk konfirmasi hapus
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);

  const activeUserId = user ? user.uid : 'demo-user-1';

  const loadWishlistData = async () => {
    setLoading(true);
    try {
      const items = await getWishlist(activeUserId);
      setWishlistItems(items);
    } catch (err) {
      console.error('Gagal memuat wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlistData();
  }, [activeUserId]);

  const handleStartEditNote = (item: WishlistItem) => {
    setEditingProductId(item.productId);
    setEditingNote(item.note || '');
  };

  const handleSaveNote = async (productId: string) => {
    try {
      await updateWishlistNote(activeUserId, productId, editingNote);
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, note: editingNote } : item
        )
      );
      setEditingProductId(null);
      success('Catatan produk berhasil disimpan!');
    } catch (err) {
      toastError('Gagal menyimpan catatan.');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await removeFromWishlist(activeUserId, itemToDelete.productId);
      setWishlistItems((prev) =>
        prev.filter((i) => i.productId !== itemToDelete.productId)
      );
      setItemToDelete(null);
      success('Produk berhasil dihapus dari Wishlist.');
    } catch (err) {
      toastError('Gagal menghapus produk dari Wishlist.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daftar Keinginan (Wishlist)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              {wishlistItems.length} Produk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simpan produk favorit dari katalog atau rekomendasi Asisten AI untuk dibeli nanti
          </p>
        </div>

        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Jelajahi Katalog Lainnya</span>
        </Link>
      </div>

      {/* Konten Wishlist */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl w-full"></div>
          ))}
        </div>
      ) : wishlistItems.length > 0 ? (
        <div className="space-y-4">
          {wishlistItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            const isEditing = editingProductId === item.productId;

            return (
              <div
                key={item.productId}
                className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 hover:border-emerald-300 transition-all"
              >
                {/* Gambar Produk */}
                <Link
                  to={`/products/${product.id}`}
                  className="w-full md:w-36 h-36 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 relative group"
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                </Link>

                {/* Rincian Produk & Catatan */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CategoryBadge category={product.category} />
                    <span className="text-[11px] text-slate-400">
                      Disimpan {formatRelativeDate(item.savedAt)}
                    </span>
                  </div>

                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <p className="text-lg font-black text-slate-900">
                    {formatRupiah(product.price)}
                  </p>

                  {/* Area Catatan Pribadi (Update Feature) */}
                  <div className="pt-2">
                    {isEditing ? (
                      <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Tulis Catatan / Alasan Membeli:
                        </label>
                        <input
                          type="text"
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          placeholder="Misal: Beli saat promo awal bulan untuk kebutuhan skripsi..."
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingProductId(null)}
                            className="px-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleSaveNote(item.productId)}
                            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Simpan Catatan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700">Catatan:</span>
                        <span className="italic flex-1">
                          {item.note || 'Belum ada catatan khusus.'}
                        </span>
                        <button
                          onClick={() => handleStartEditNote(item)}
                          className="p-1 text-slate-400 hover:text-emerald-600"
                          title="Edit Catatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex md:flex-col justify-end gap-2 md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 flex-shrink-0">
                  <Link
                    to={`/chat?query=${encodeURIComponent(`Saya berniat membeli ${product.name} seharga ${formatRupiah(product.price)} dari wishlist saya. Menurut Anda apakah ini pilihan terbaik?`)}`}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tanya AI Pre-Sales</span>
                  </Link>

                  <Link
                    to={`/products/${product.id}`}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    <span>Detail</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 flex items-center justify-center"
                    title="Hapus dari Wishlist"
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
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Wishlist Anda Masih Kosong</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Simpan produk yang Anda minati saat menjelajahi katalog atau berkonsultasi dengan Asisten AI Pre-Sales.
            </p>
          </div>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <span>Mulai Jelajahi Produk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus dari Wishlist?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{itemToDelete.product?.name}</strong> dari daftar keinginan?
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
