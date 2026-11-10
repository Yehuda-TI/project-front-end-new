import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Cek apakah variabel lingkungan Firebase valid telah disediakan
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = Boolean(
  envApiKey &&
  envApiKey.trim() !== '' &&
  envApiKey !== 'your_api_key_here' &&
  envProjectId &&
  envProjectId.trim() !== '' &&
  envProjectId !== 'your_project_id'
);

// Jika belum dikonfigurasi, gunakan fallback dummy config yang aman agar SDK tidak throw error
const firebaseConfig = isFirebaseConfigured
  ? {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    }
  : {
      apiKey: 'AIzaSyFakeKeyForCampusMarketStudentDemo123',
      authDomain: 'campus-market-demo.firebaseapp.com',
      projectId: 'campus-market-demo',
      storageBucket: 'campus-market-demo.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:abcdef123456',
    };

// Inisialisasi Firebase singleton
const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;
