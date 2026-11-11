import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsDemoUser: () => {},
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
      
      // Fallback local storage profile jika demo mode
      const localProfile = localStorage.getItem('campus_market_demo_profile');
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
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
        localStorage.setItem('campus_market_demo_profile', JSON.stringify(defaultProfile));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const loginAsDemoUser = () => {
    const demoUser = {
      uid: 'demo-user-1',
      displayName: 'Dimas Pratama',
      email: 'dimas@student.campus.ac.id',
      photoURL: null,
    } as unknown as User;

    const demoProfile: UserProfile = {
      uid: 'demo-user-1',
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

    localStorage.setItem('campus_market_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('campus_market_demo_profile', JSON.stringify(demoProfile));
    setUser(demoUser);
    setProfile(demoProfile);
    setLoading(false);
  };

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.uid);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Demo Mode check
      const localUser = localStorage.getItem('campus_market_demo_user');
      const localProfile = localStorage.getItem('campus_market_demo_profile');
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
  }, []);

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
    localStorage.removeItem('campus_market_demo_user');
    localStorage.removeItem('campus_market_demo_profile');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, loginAsDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
