import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product, ProductCategory } from '@/types';
import { fetchProducts } from '@/services/product.service';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';
import { 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  RotateCcw, 
  PackageOpen, 
  Bot, 
  ArrowRight,
  Filter,
  X
} from 'lucide-react';

const CATEGORIES: ('Semua' | ProductCategory)[] = [
  'Semua',
  'Laptop & Komputer',
  'Smartphone & Tablet',
  'Audio & Aksesori',
  'Kamera & Fotografi',
  'Perlengkapan Belajar',
  'Peralatan Rumah Tangga',
];

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as ProductCategory) || 'Semua';
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts({
        category: selectedCategory === 'Semua' ? undefined : selectedCategory,
        searchQuery: searchQuery.trim() || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy,
      });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (searchQuery.trim()) {
        prev.set('q', searchQuery.trim());
      } else {
        prev.delete('q');
      }
      return prev;
    });
    loadCatalogData();
  };

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
    loadCatalogData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Banner CRS Asisten Pre-Sales */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Asisten Pre-Sales Berbasis CRS + LLM Gemini</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Katalog Produk & Rekomendasi Cerdas Pre-Sales
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bingung mencari laptop, gadget, atau perlengkapan yang sesuai kebutuhan dan budget Anda?
            Tanyakan langsung ke Asisten AI Pre-Sales kami yang akan memilihkan kandidat produk terbaik secara objektif dari katalog.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <Bot className="w-4 h-4" />
              <span>Mulai Chat dengan Asisten AI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/wishlist"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all"
            >
              <span>Buka Wishlist Saya</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Katalog Produk E-Commerce
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Total {products.length} produk terverifikasi siap beli & simpan ke wishlist
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk (laptop, ipad, casio, air fryer)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* Category Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchParams((prev) => {
                  if (cat === 'Semua') {
                    prev.delete('category');
                  } else {
                    prev.set('category', cat);
                  }
                  return prev;
                });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Grid & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Filter Katalog</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Rentang Harga */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rentang Harga (Rp)
            </label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Harga Min (cth: 500000)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Harga Max (cth: 10000000)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={loadCatalogData}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg transition-colors border border-emerald-200"
              >
                Terapkan Filter
              </button>
            </div>
          </div>

          {/* Card Bantuan AI */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              Asisten Percakapan
            </span>
            <p className="text-[11px] text-slate-500 leading-normal">
              Sistem CRS kami menggunakan scoring objektif untuk mencocokkan produk dengan profil dan anggaran Anda.
            </p>
            <Link
              to="/chat"
              className="inline-block text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Buka Percakapan &rarr;
            </Link>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top Sort Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Menampilkan <span className="text-emerald-600 font-bold">{products.length}</span> produk
            </span>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-slate-700"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>

              {/* Sorting Selector */}
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline text-slate-400">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="newest">Terbaru</option>
                  <option value="price-asc">Harga: Termurah</option>
                  <option value="price-desc">Harga: Termahal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filter Drawer */}
          {mobileFilterOpen && (
            <div className="lg:hidden bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">Filter Harga</span>
                <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Harga Min</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Harga Max</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  loadCatalogData();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Terapkan
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Tidak ada produk ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Cobalah kata kunci lain atau reset filter kategori dan rentang harga Anda.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl transition-colors border border-emerald-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
