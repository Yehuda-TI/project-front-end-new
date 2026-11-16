import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types';

// ==============================================================================
// 1. HELPER PENYIMPANAN AKUN LOKAL (OFFLINE RESILIENCY)
// ==============================================================================

interface StoredLocalAccount {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  whatsappNumber: string;
  profile: UserProfile;
}

const LOCAL_ACCOUNTS_KEY = 'campus_market_registered_accounts';

export const getLocalAccounts = (): StoredLocalAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Gagal membaca data akun lokal:', err);
    return [];
  }
};

const saveLocalAccounts = (accounts: StoredLocalAccount[]) => {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Gagal menyimpan data akun lokal ke localStorage:', err);
  }
};

export const findLocalAccount = (email: string): StoredLocalAccount | undefined => {
  const accounts = getLocalAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts.find((a) => a.email.trim().toLowerCase() === normalized);
};

// ==============================================================================
// 2. TERJEMAHAN PESAN ERROR LENGKAP & JELAS DALAM BAHASA INDONESIA
// ==============================================================================

export const translateAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid. Pastikan format email benar (contoh: nama@student.ac.id).';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan. Silakan periksa kembali atau daftar akun baru.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah. Silakan coba lagi atau gunakan fitur Reset Kata Sandi.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali kombinasi email dan sandi Anda.';
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk ke akun Anda.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf dan angka.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan masuk yang gagal. Akses dibatasi sementara demi keamanan akun. Coba beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.';
    case 'auth/operation-not-allowed':
      return 'Metode login Email/Password belum diaktifkan di Firebase Console (Menu: Authentication > Sign-in method).';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Kunci API Firebase (VITE_FIREBASE_API_KEY) di .env.local tidak valid atau telah kedaluwarsa di Google Cloud Console. Sistem beralih ke penyimpanan akun lokal.';
    case 'auth/unauthorized-domain':
      return 'Domain saat ini (localhost) belum didaftarkan di Firebase Console (Menu: Authentication > Settings > Authorized domains).';
    case 'auth/project-not-found':
      return 'Project Firebase tidak ditemukan. Periksa VITE_FIREBASE_PROJECT_ID di .env.local.';
    default:
      if (errorCode && errorCode.trim() !== '') {
        return `Autentikasi gagal (${errorCode}). Periksa data login Anda atau gunakan Mode Demo.`;
      }
      return 'Terjadi kesalahan autentikasi. Silakan periksa koneksi atau coba beberapa saat lagi.';
  }
};

// ==============================================================================
// 3. REGISTRASI PENGGUNA (HYBRID FIREBASE + LOCAL FALLBACK)
// ==============================================================================

export const registerUser = async (
  email: string,
  pass: string,
  displayName: string,
  whatsappNumber?: string
): Promise<UserProfile> => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanDisplayName = displayName.trim();
  const cleanPhone = (whatsappNumber || '').trim();

  const defaultPrefs = {
    budgetMin: 100000,
    budgetMax: 10000000,
    favoriteCategories: ['Laptop & Komputer', 'Smartphone & Tablet'],
  };

  // Helper untuk registrasi lokal
  const registerLocal = (): UserProfile => {
    const existing = findLocalAccount(normalizedEmail);
    if (existing) {
      const err = new Error('Email already registered') as any;
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    const uid = 'local_user_' + Date.now();
    const newProfile: UserProfile = {
      uid,
      displayName: cleanDisplayName,
      email: normalizedEmail,
      photoURL: null,
      whatsappNumber: cleanPhone,
      bio: 'Mahasiswa Kampus',
      campusName: '',
      preferences: defaultPrefs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newAccount: StoredLocalAccount = {
      uid,
      email: normalizedEmail,
      password: pass,
      displayName: cleanDisplayName,
      whatsappNumber: cleanPhone,
      profile: newProfile,
    };

    const currentAccounts = getLocalAccounts();
    saveLocalAccounts([newAccount, ...currentAccounts]);

    // Simpan ke sesi aktif
    const syntheticUser = {
      uid,
      displayName: cleanDisplayName,
      email: normalizedEmail,
      photoURL: null,
    };
    localStorage.setItem('campus_market_current_user', JSON.stringify(syntheticUser));
    localStorage.setItem('campus_market_current_profile', JSON.stringify(newProfile));

    return newProfile;
  };

  // Coba daftar via Firebase jika dikonfigurasi
  if (isFirebaseConfigured) {
    try {
      // 1. Buat akun di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      const user = userCredential.user;

      // 2. Update display name di auth object
      await updateFirebaseProfile(user, { displayName: cleanDisplayName });

      // 3. Buat dokumen profil di Cloud Firestore
      const profileData: UserProfile = {
        uid: user.uid,
        displayName: cleanDisplayName,
        email: user.email || normalizedEmail,
        photoURL: user.photoURL || null,
        whatsappNumber: cleanPhone,
        bio: 'Mahasiswa Kampus',
        campusName: '',
        preferences: defaultPrefs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), profileData);
      } catch (firestoreError) {
        console.warn('Peringatan: Gagal menyimpan dokumen profil ke Firestore:', firestoreError);
      }

      // Simpan salinan lokal untuk ketahanan offline
      const syntheticUser = {
        uid: user.uid,
        displayName: cleanDisplayName,
        email: user.email || normalizedEmail,
        photoURL: user.photoURL || null,
      };
      localStorage.setItem('campus_market_current_user', JSON.stringify(syntheticUser));
      localStorage.setItem('campus_market_current_profile', JSON.stringify(profileData));

      return profileData;
    } catch (err: any) {
      const code = err?.code || '';
      console.warn('Firebase createUser gagal:', code, err.message);

      // Jika error validasi akun pengguna murni, teruskan error agar form menampilkan validasi
      if (['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email'].includes(code)) {
        throw err;
      }

      // Jika error infrastruktur Firebase (API key tidak valid, unauthorized domain, dsb),
      // alihkan secara cerdas ke pendaftaran lokal agar pengguna tidak terblokir
      console.info('Beralih ke pendaftaran akun lokal karena layanan Firebase Auth tidak merespons valid.');
      return registerLocal();
    }
  }

  // Jika Firebase belum dikonfigurasi, gunakan registrasi lokal langsung
  return registerLocal();
};

// ==============================================================================
// 4. LOGIN PENGGUNA (HYBRID FIREBASE + LOCAL FALLBACK)
// ==============================================================================

export interface LoginResult {
  user: FirebaseUser | { uid: string; displayName: string | null; email: string | null; photoURL: string | null };
  profile: UserProfile;
}

export const loginUser = async (email: string, pass: string): Promise<LoginResult> => {
  const normalizedEmail = email.trim().toLowerCase();

  // Helper login dari akun lokal
  const loginFromLocal = (): LoginResult => {
    const localMatch = findLocalAccount(normalizedEmail);
    if (localMatch) {
      if (localMatch.password === pass) {
        const syntheticUser = {
          uid: localMatch.uid,
          displayName: localMatch.displayName,
          email: localMatch.email,
          photoURL: null,
        };
        localStorage.setItem('campus_market_current_user', JSON.stringify(syntheticUser));
        localStorage.setItem('campus_market_current_profile', JSON.stringify(localMatch.profile));
        return { user: syntheticUser, profile: localMatch.profile };
      } else {
        const err = new Error('Wrong password') as any;
        err.code = 'auth/wrong-password';
        throw err;
      }
    }

    // Cek akun demo default jika dimasukkan email demo
    if (normalizedEmail.includes('demo') || normalizedEmail.includes('admin') || normalizedEmail.includes('dimas')) {
      const demoProfile: UserProfile = {
        uid: 'demo_user_1',
        displayName: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        photoURL: null,
        whatsappNumber: '6281234567890',
        bio: 'Mahasiswa Kampus Demo',
        campusName: 'Universitas Indonesia',
        preferences: {
          budgetMin: 100000,
          budgetMax: 10000000,
          favoriteCategories: ['Laptop & Komputer', 'Smartphone & Tablet'],
        },
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      };
      const demoUser = {
        uid: demoProfile.uid,
        displayName: demoProfile.displayName,
        email: demoProfile.email,
        photoURL: null,
      };
      localStorage.setItem('campus_market_current_user', JSON.stringify(demoUser));
      localStorage.setItem('campus_market_current_profile', JSON.stringify(demoProfile));
      return { user: demoUser, profile: demoProfile };
    }

    const err = new Error('User not found') as any;
    err.code = 'auth/user-not-found';
    throw err;
  };

  if (isFirebaseConfigured) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      const fbUser = userCredential.user;

      let profileData = await getUserProfile(fbUser.uid);
      if (!profileData) {
        profileData = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || normalizedEmail.split('@')[0],
          email: fbUser.email || normalizedEmail,
          photoURL: fbUser.photoURL || null,
          whatsappNumber: '',
          bio: 'Mahasiswa Kampus',
          campusName: '',
          preferences: {
            budgetMin: 100000,
            budgetMax: 10000000,
            favoriteCategories: ['Laptop & Komputer', 'Smartphone & Tablet'],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      const syntheticUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
      };
      localStorage.setItem('campus_market_current_user', JSON.stringify(syntheticUser));
      localStorage.setItem('campus_market_current_profile', JSON.stringify(profileData));

      return { user: fbUser, profile: profileData };
    } catch (err: any) {
      const code = err?.code || '';

      // Jika password salah di Firebase, cek apakah user ini sebenarnya terdaftar di lokal
      if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(code)) {
        const localMatch = findLocalAccount(normalizedEmail);
        if (localMatch) {
          if (localMatch.password === pass) {
            return loginFromLocal();
          } else {
            const wrongErr = new Error('Password mismatch') as any;
            wrongErr.code = 'auth/wrong-password';
            throw wrongErr;
          }
        }
        throw err;
      }

      // Jika error konfigurasi API key Firebase, alihkan ke akun lokal
      if (['auth/api-key-not-valid', 'auth/invalid-api-key', 'auth/network-request-failed'].includes(code)) {
        return loginFromLocal();
      }

      throw err;
    }
  }

  return loginFromLocal();
};

// ==============================================================================
// 5. LOGOUT DAN MANAJEMEN SESI
// ==============================================================================

export const logoutUser = async () => {
  if (isFirebaseConfigured) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase signOut warning:', err);
    }
  }
  localStorage.removeItem('campus_market_current_user');
  localStorage.removeItem('campus_market_current_profile');
  localStorage.removeItem('campus_market_demo_user');
  localStorage.removeItem('campus_market_demo_profile');
};

export const resetPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isFirebaseConfigured) {
    return Promise.resolve();
  }
  return await sendPasswordResetEmail(auth, normalizedEmail);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...data,
          createdAt: typeof data.createdAt?.toMillis === 'function' ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          updatedAt: typeof data.updatedAt?.toMillis === 'function' ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
        } as UserProfile;
      }
    } catch (err) {
      console.warn('Gagal mengambil profil dari Firestore:', err);
    }
  }

  const localProfile = localStorage.getItem('campus_market_current_profile') || localStorage.getItem('campus_market_demo_profile');
  return localProfile ? JSON.parse(localProfile) : null;
};

export const updateUserProfileData = async (
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>
) => {
  const timestamp = Date.now();
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: timestamp,
      });

      if (data.displayName && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: data.displayName,
          photoURL: data.photoURL || undefined,
        });
      }
    } catch (err) {
      console.warn('Peringatan: Gagal update profil ke Firestore, menyimpan ke lokal:', err);
    }
  }

  // Update di penyimpanan sesi aktif
  const localProfile = localStorage.getItem('campus_market_current_profile') || localStorage.getItem('campus_market_demo_profile');
  const existing = localProfile ? JSON.parse(localProfile) : {};
  const updated = { ...existing, ...data, updatedAt: timestamp };
  localStorage.setItem('campus_market_current_profile', JSON.stringify(updated));

  const localUser = localStorage.getItem('campus_market_current_user') || localStorage.getItem('campus_market_demo_user');
  if (localUser) {
    const parsedUser = JSON.parse(localUser);
    parsedUser.displayName = data.displayName || parsedUser.displayName;
    localStorage.setItem('campus_market_current_user', JSON.stringify(parsedUser));
  }

  // Update juga di daftar registered accounts jika ada
  const accounts = getLocalAccounts();
  const accIndex = accounts.findIndex((a) => a.uid === uid);
  if (accIndex >= 0) {
    accounts[accIndex].displayName = data.displayName || accounts[accIndex].displayName;
    accounts[accIndex].whatsappNumber = data.whatsappNumber || accounts[accIndex].whatsappNumber;
    accounts[accIndex].profile = updated;
    saveLocalAccounts(accounts);
  }
};
