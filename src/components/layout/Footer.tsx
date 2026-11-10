import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900">
                Campus<span className="text-indigo-600">Market</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform jual-beli terpercaya antar mahasiswa. Transaksi aman, hemat, dan mudah di lingkungan kampus Anda.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Komunitas Kampus Terverifikasi</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Navigasi</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-indigo-600 transition-colors">Jelajahi Produk</Link>
              </li>
              <li>
                <Link to="/create-product" className="hover:text-indigo-600 transition-colors">Mulai Jual Barang</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Buku%20%26%20Kuliah" className="hover:text-indigo-600 transition-colors">Buku & Diktat Kuliah</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Kategori Populer</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/marketplace?category=Elektronik%20%26%20Gadget" className="hover:text-indigo-600 transition-colors">Elektronik & Gadget</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Perlengkapan%20Kos" className="hover:text-indigo-600 transition-colors">Perlengkapan Anak Kos</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Fashion%20%26%20Aksesori" className="hover:text-indigo-600 transition-colors">Fashion Mahasiswa</Link>
              </li>
              <li>
                <Link to="/marketplace?category=Hobi%20%26%20Olahraga" className="hover:text-indigo-600 transition-colors">Hobi & Olahraga</Link>
              </li>
            </ul>
          </div>

          {/* Tips transaksi */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Tips Transaksi Aman
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Disarankan melakukan transaksi dengan bertemu langsung (COD) di area kampus yang ramai, seperti perpustakaan, kantin, atau gedung kuliah.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} CampusMarket. Dibuat khusus untuk mahasiswa Indonesia.</p>
          <p className="flex items-center gap-1">
            Dirancang dengan <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> untuk kenyamanan mahasiswa
          </p>
        </div>
      </div>
    </footer>
  );
};
