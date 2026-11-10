import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, ProductCategory } from '@/types';
import { fetchProducts } from '@/services/product.service';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  PackageOpen, 
  RotateCcw 
} from 'lucide-react';

const CATEGORIES: ('Semua' | ProductCategory)[] = [
  'Semua',
  'Buku & Kuliah',
  'Elektronik & Gadget',
  'Perlengkapan Kos',
  'Fashion & Aksesori',
  'Hobi & Olahraga',
  'Lainnya',
];

export const MarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as ProductCategory) || 'Semua';
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sinkronisasi URL query params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts({
        category: selectedCategory === 'Semua' ? undefined : selectedCategory,
        searchQuery: searchQuery.trim() || undefined,
        condition: conditionFilter === 'all' ? undefined : conditionFilter,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy: sortBy,
      });
      setProducts(data);
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, conditionFilter, sortBy]);

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
    loadData();
  };

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
    setConditionFilter('all');
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Jelajahi Produk Kampus
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Beli perlengkapan kuliah preloved & hemat dari sesama mahasiswa
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
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
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Layout: Filters & Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Filter Produk</span>
            </h2>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Kondisi Produk */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Kondisi Barang
            </label>
            <div className="space-y-1.5 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  checked={conditionFilter === 'all'}
                  onChange={() => setConditionFilter('all')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Semua Kondisi
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  checked={conditionFilter === 'used'}
                  onChange={() => setConditionFilter('used')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Bekas (Preloved)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  checked={conditionFilter === 'new'}
                  onChange={() => setConditionFilter('new')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Baru (Gress)
              </label>
            </div>
          </div>

          {/* Rentang Harga */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rentang Harga (Rp)
            </label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Harga Min (cth: 50000)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                placeholder="Harga Max (cth: 500000)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={loadData}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Terapkan Harga
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Top Sort Bar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Menampilkan <span className="text-indigo-600 font-bold">{products.length}</span> barang
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
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="newest">Terbaru</option>
                  <option value="price-asc">Harga: Termurah</option>
                  <option value="price-desc">Harga: Termahal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filter Drawer / Collapsible */}
          {mobileFilterOpen && (
            <div className="lg:hidden bg-white p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-900">Filter Tambahan</span>
                <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Kondisi</label>
                  <select
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value as any)}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  >
                    <option value="all">Semua</option>
                    <option value="used">Bekas</option>
                    <option value="new">Baru</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Harga Max</label>
                  <input
                    type="number"
                    placeholder="Contoh: 200000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  loadData();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Terapkan
              </button>
            </div>
          )}

          {/* Products List */}
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
                  Cobalah kata kunci lain atau ubah pengaturan filter kategori dan rentang harga Anda.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors"
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
