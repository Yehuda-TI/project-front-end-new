import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { isFirebaseConfigured } from '@/lib/firebase';
import { AlertCircle, X } from 'lucide-react';

export const RootLayout: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('campus_market_banner_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('campus_market_banner_dismissed', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {/* Firebase configuration info banner with dismiss option */}
      {!isFirebaseConfigured && !dismissed && (
        <aside 
          aria-label="Pemberitahuan Konfigurasi" 
          className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mx-auto text-center">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Mode Pengembangan / Offline Resilience Aktif: Fitur autentikasi dan database berjalan lokal. Hubungkan Firebase asli di <code>.env.local</code> untuk sync ke cloud.
            </span>
          </div>
          <button 
            type="button" 
            onClick={handleDismiss} 
            className="p-1 hover:bg-amber-600/30 rounded text-slate-950 transition-colors"
            aria-label="Tutup pemberitahuan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
