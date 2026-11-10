import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingBag, 
  Search, 
  PlusCircle, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Package, 
  ChevronDown 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Gagal logout:', err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-800 flex items-center gap-1">
                Campus<span className="text-emerald-600">Market</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">
                Student Marketplace
              </span>
            </div>
          </Link>

          {/* Search bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Cari buku, laptop, perlengkapan kos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-full focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
              />
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </form>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'text-emerald-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Beranda
            </Link>
            <Link 
              to="/marketplace" 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/marketplace') ? 'text-emerald-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Jelajahi Produk
            </Link>
          </div>

          {/* Action Button & Auth menu */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/create-product"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition-all hover:shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Jual Barang</span>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                      {(profile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {profile?.displayName || 'Pengguna CampusMarket'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Profil Saya
                    </Link>

                    <Link
                      to="/my-products"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      Kelola Iklan Saya
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-600 rounded-lg transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Cari barang kampus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </form>

          <div className="space-y-1 pt-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Beranda
            </Link>
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Jelajahi Produk
            </Link>
            <Link
              to="/create-product"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50"
            >
              + Jual Barang
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-3">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-slate-800">{profile?.displayName || user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Profil Saya
                </Link>
                <Link
                  to="/my-products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Iklan Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
