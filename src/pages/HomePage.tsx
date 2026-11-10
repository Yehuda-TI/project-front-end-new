import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product, ProductCategory } from '@/types';
import { fetchProducts } from '@/services/product.service';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';
import { 
  Search, 
  ArrowRight, 
  BookOpen, 
  Laptop, 
  Home as HomeIcon, 
  Shirt, 
  Dumbbell, 
  MoreHorizontal, 
  Sparkles, 
  ChevronRight 
} from 'lucide-react';

const CATEGORIES: { label: ProductCategory; icon: any; color: string }[] = [
  { label: 'Buku & Kuliah', icon: BookOpen, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Elektronik & Gadget', icon: Laptop, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { label: 'Perlengkapan Kos', icon: HomeIcon, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { label: 'Fashion & Aksesori', icon: Shirt, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { label: 'Hobi & Olahraga', icon: Dumbbell, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { label: 'Lainnya', icon: MoreHorizontal, color: 'bg-purple-50 text-purple-600 border-purple-200' },
];

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadLatestProducts = async () => {
      try {
        const data = await fetchProducts({ sortBy: 'newest' });
        // Ambil 8 produk terbaru untuk beranda
        setProducts(data.slice(0, 8));
      } catch (err) {
        console.error('Gagal mengambil produk beranda:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLatestProducts();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white pt-16 pb-20 sm:pt-20 sm:pb-28">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center sm:text-left">
          <div className="max-w-3xl space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-800/80 border border-indigo-400/30 text-xs font-semibold text-indigo-200 shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Komunitas Jual-Beli Khusus Mahasiswa</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Beli & Jual Kebutuhan Kuliah Jadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-indigo-200">Lebih Mudah & Murah.</span>
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-2xl leading-relaxed">
              Jual diktat, buku kalkulus, perlengkapan kos, hingga laptop preloved ke sesama mahasiswa di lingkungan kampusmu. Hemat biaya, tanpa ribet ongkir!
            </p>

            {/* Quick Hero Search Input */}
            <form onSubmit={handleHeroSearch} className="max-w-xl pt-2">
              <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl shadow-indigo-950/50">
                <Search className="w-5 h-5 text-slate-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari buku diktat, monitor kos, keyboard..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex-shrink-0"
                >
                  Cari
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-lg shadow-indigo-950/20 transition-all hover:-translate-y-0.5"
              >
                <span>Mulai Belanja</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/create-product"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-800/80 hover:bg-indigo-700/80 text-white font-semibold text-xs sm:text-sm border border-indigo-400/30 backdrop-blur-sm transition-all"
              >
                <span>+ Jual Barang Bekas</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kategori Populer</h2>
            <p className="text-xs sm:text-sm text-slate-500">Pilih kategori untuk mempermudah pencarian</p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                to={`/marketplace?category=${encodeURIComponent(cat.label)}`}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 border ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Produk Terbaru di Kampus</h2>
            <p className="text-xs sm:text-sm text-slate-500">Barang yang baru saja diposting oleh teman mahasiswa</p>
          </div>
          <Link
            to="/marketplace"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            <span>Buka Marketplace</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-sm text-slate-500 mb-4">Belum ada barang yang diposting.</p>
            <Link
              to="/create-product"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              Jadilah yang pertama memasang iklan!
            </Link>
          </div>
        )}
      </section>

      {/* How it Works / Cara Kerja */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-tr from-indigo-50 to-white rounded-3xl border border-indigo-100 p-8 sm:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Cara Kerja CampusMarket</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Transaksi antar mahasiswa jadi ringkas, transparan, dan terpercaya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm shadow-indigo-200">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">Pasang Iklan Barang</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Foto barangmu, tentukan harga yang pas untuk mahasiswa, dan cantumkan nomor WhatsApp yang aktif.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm shadow-indigo-200">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">Chat Langsung via WhatsApp</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Calon pembeli langsung menghubungi penjual via WhatsApp tanpa perantara pihak ketiga.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm shadow-indigo-200">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">COD Aman di Kampus</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Janjian ketemu langsung di perpustakaan, fakultas, atau kantin kampus. Cek kondisi barang lalu bayar di tempat.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
