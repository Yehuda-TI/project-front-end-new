import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AlertCircle } from 'lucide-react';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* Firebase configuration warning banner */}
      {!isFirebaseConfigured && (
        <aside aria-label="Pemberitahuan Konfigurasi" className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 text-center shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Mode Pengembangan: Kredensial Firebase di <code>.env.local</code> belum diisi. Fitur auth dan database aktif setelah file konfigurasi dilengkapi.
          </span>
        </aside>
      )}

      <Navbar />

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
