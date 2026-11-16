import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { logoutUser } from '@/services/auth.service';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemoUser: () => void;
  setSessionUser: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsDemoUser: () => {},
  setSessionUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string) => {
    try {
      if (isFirebaseConfigured) {
        const docRef = doc(db, 'users', uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            ...data,
            createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
            updatedAt: typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
          } as UserProfile);
          return;
        }
      }
      
      // Fallback local storage profile jika sesi lokal aktif
      const savedProfile = localStorage.getItem('campus_market_current_profile') || localStorage.getItem('campus_market_demo_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        const defaultProfile: UserProfile = {
          uid,
          displayName: user?.displayName || 'Mahasiswa Kampus',
          email: user?.email || 'mahasiswa@campus.ac.id',
          photoURL: null,
          whatsappNumber: '6281234567890',
          bio: 'Mahasiswa aktif kampus',
          campusName: 'Universitas Indonesia',
          preferences: {
            budgetMin: 100000,
            budgetMax: 10000000,
            favoriteCategories: ['Laptop & Komputer', 'Smartphone & Tablet'],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setProfile(defaultProfile);
        localStorage.setItem('campus_market_current_profile', JSON.stringify(defaultProfile));
      }
    } catch (err) {
      console.warn('Peringatan saat mengambil profil pengguna:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  /**
   * Mengatur sesi pengguna secara langsung (digunakan setelah registrasi atau login sukses)
   */
  const setSessionUser = (newProfile: UserProfile) => {
    const syntheticUser = {
      uid: newProfile.uid,
      displayName: newProfile.displayName,
      email: newProfile.email,
      photoURL: newProfile.photoURL,
    } as unknown as User;

    localStorage.setItem('campus_market_current_user', JSON.stringify(syntheticUser));
    localStorage.setItem('campus_market_current_profile', JSON.stringify(newProfile));
    
    setUser(syntheticUser);
    setProfile(newProfile);
    setLoading(false);
  };

  /**
   * Tombol cepat untuk masuk sebagai akun demo terverifikasi
   */
  const loginAsDemoUser = () => {
    const demoProfile: UserProfile = {
      uid: 'demo_user_dimas',
      displayName: 'Dimas Pratama',
      email: 'dimas@student.campus.ac.id',
      photoURL: null,
      whatsappNumber: '6281234567890',
      bio: 'Mahasiswa semester akhir, antusias teknologi & gadget kuliah',
      campusName: 'Universitas Indonesia',
      preferences: {
        budgetMin: 200000,
        budgetMax: 8000000,
        favoriteCategories: ['Laptop & Komputer', 'Audio & Aksesori'],
      },
      createdAt: Date.now() - 30 * 86400000,
      updatedAt: Date.now(),
    };

    setSessionUser(demoProfile);
  };

  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            await fetchProfile(currentUser.uid);
            setLoading(false);
          } else {
            // Jika Firebase tidak memiliki sesi, cek apakah ada sesi lokal yang tersimpan
            const localUser = localStorage.getItem('campus_market_current_user');
            const localProfile = localStorage.getItem('campus_market_current_profile');
            if (localUser && localProfile) {
              try {
                setUser(JSON.parse(localUser));
                setProfile(JSON.parse(localProfile));
              } catch {
                setUser(null);
                setProfile(null);
              }
            } else {
              setUser(null);
              setProfile(null);
            }
            setLoading(false);
          }
        });
      } catch (err) {
        console.warn('onAuthStateChanged gagal, beralih ke sesi lokal:', err);
        const localUser = localStorage.getItem('campus_market_current_user');
        const localProfile = localStorage.getItem('campus_market_current_profile');
        if (localUser && localProfile) {
          try {
            setUser(JSON.parse(localUser));
            setProfile(JSON.parse(localProfile));
          } catch {
            setUser(null);
            setProfile(null);
          }
        }
        setLoading(false);
      }
    } else {
      // Mode offline / demo
      const localUser = localStorage.getItem('campus_market_current_user') || localStorage.getItem('campus_market_demo_user');
      const localProfile = localStorage.getItem('campus_market_current_profile') || localStorage.getItem('campus_market_demo_profile');
      if (localUser && localProfile) {
        try {
          setUser(JSON.parse(localUser));
          setProfile(JSON.parse(localProfile));
        } catch {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Gagal logout bersih:', err);
    }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      logout, 
      refreshProfile, 
      loginAsDemoUser,
      setSessionUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
