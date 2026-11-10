import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/types';

// Terjemahan pesan error Firebase Auth ke Bahasa Indonesia yang ramah pengguna
export const translateAuthError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan oleh administrator.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau login.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf & angka.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Akses dibatasi sementara demi keamanan akun.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase Console.';
    default:
      return 'Terjadi kesalahan autentikasi. Silakan coba beberapa saat lagi.';
  }
};

export const registerUser = async (
  email: string,
  pass: string,
  displayName: string,
  whatsappNumber?: string
): Promise<UserProfile> => {
  if (!isFirebaseConfigured) {
    // Mode demo / pengembangan lokal
    const demoProfile: UserProfile = {
      uid: 'user_' + Date.now(),
      displayName,
      email,
      photoURL: null,
      whatsappNumber: whatsappNumber || '',
      bio: 'Mahasiswa Kampus',
      campusName: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const demoUser = {
      uid: demoProfile.uid,
      displayName,
      email,
      photoURL: null,
    };
    localStorage.setItem('campus_market_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('campus_market_demo_profile', JSON.stringify(demoProfile));
    return demoProfile;
  }

  // 1. Buat akun di Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // 2. Update display name di auth object
  await updateFirebaseProfile(user, { displayName });

  // 3. Buat dokumen profil di Cloud Firestore
  const profileData: UserProfile = {
    uid: user.uid,
    displayName,
    email: user.email || email,
    photoURL: user.photoURL || null,
    whatsappNumber: whatsappNumber || '',
    bio: 'Mahasiswa Kampus',
    campusName: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid), profileData);
  } catch (firestoreError) {
    console.error('Peringatan: Gagal menyimpan dokumen profil ke Firestore:', firestoreError);
  }

  return profileData;
};

export const loginUser = async (email: string, pass: string) => {
  if (!isFirebaseConfigured) {
    // Mode demo: izinkan login dengan kredensial apa saja
    const demoProfile: UserProfile = {
      uid: 'demo-seller-1',
      displayName: email.split('@')[0],
      email,
      photoURL: null,
      whatsappNumber: '6281234567890',
      bio: 'Mahasiswa Kampus',
      campusName: 'Universitas Indonesia',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const demoUser = {
      uid: demoProfile.uid,
      displayName: demoProfile.displayName,
      email,
      photoURL: null,
    };
    localStorage.setItem('campus_market_demo_user', JSON.stringify(demoUser));
    localStorage.setItem('campus_market_demo_profile', JSON.stringify(demoProfile));
    return { user: demoUser };
  }

  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
  localStorage.removeItem('campus_market_demo_user');
  localStorage.removeItem('campus_market_demo_profile');
};

export const resetPassword = async (email: string) => {
  if (!isFirebaseConfigured) {
    return Promise.resolve();
  }
  return await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  }

  const localProfile = localStorage.getItem('campus_market_demo_profile');
  return localProfile ? JSON.parse(localProfile) : null;
};

export const updateUserProfileData = async (
  uid: string,
  data: Partial<Omit<UserProfile, 'uid' | 'email' | 'createdAt'>>
) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    if (data.displayName && auth.currentUser) {
      await updateFirebaseProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL || undefined,
      });
    }
    return;
  }

  // Update di localStorage untuk demo
  const localProfile = localStorage.getItem('campus_market_demo_profile');
  const existing = localProfile ? JSON.parse(localProfile) : {};
  const updated = { ...existing, ...data, updatedAt: new Date() };
  localStorage.setItem('campus_market_demo_profile', JSON.stringify(updated));

  const localUser = localStorage.getItem('campus_market_demo_user');
  if (localUser) {
    const parsedUser = JSON.parse(localUser);
    parsedUser.displayName = data.displayName || parsedUser.displayName;
    localStorage.setItem('campus_market_demo_user', JSON.stringify(parsedUser));
  }
};
