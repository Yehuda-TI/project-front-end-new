import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto my-16 px-4 text-center">
      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
        Halaman atau produk yang Anda cari mungkin telah dihapus, sudah terjual, atau tautan tidak valid.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
};
