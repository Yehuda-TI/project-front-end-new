/**
 * Layanan Wishlist (CRUD Cloud Firestore & Local Fallback)
 * Skema: users/{uid}/wishlist/{productId} -> { productId, note, savedAt }
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { WishlistItem } from '@/types';
import { CATALOG_PRODUCTS } from '@/services/product.service';

const WISHLIST_LOCAL_KEY = 'campus_market_local_wishlist';

function getLocalWishlist(userId: string): WishlistItem[] {
  try {
    const raw = localStorage.getItem(`${WISHLIST_LOCAL_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(userId: string, items: WishlistItem[]) {
  try {
    localStorage.setItem(`${WISHLIST_LOCAL_KEY}_${userId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Gagal menyimpan wishlist lokal:', err);
  }
}

/**
 * CREATE: Menambahkan produk ke wishlist
 */
export async function addToWishlist(
  userId: string,
  productId: string,
  note: string = ''
): Promise<void> {
  const item: WishlistItem = {
    productId,
    note,
    savedAt: Date.now(),
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', userId, 'wishlist', productId);
      await setDoc(docRef, item);
      return;
    } catch (err) {
      console.warn('Gagal menyimpan wishlist ke Firestore, beralih ke lokal:', err);
    }
  }

  // Fallback lokal
  const current = getLocalWishlist(userId);
  const exists = current.some((w) => w.productId === productId);
  if (!exists) {
    saveLocalWishlist(userId, [item, ...current]);
  }
}

/**
 * READ: Mengambil seluruh item wishlist pengguna beserta objek Product dari katalog
 */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  let items: WishlistItem[] = [];

  if (isFirebaseConfigured) {
    try {
      const collRef = collection(db, 'users', userId, 'wishlist');
      const snap = await getDocs(collRef);
      snap.forEach((d) => {
        items.push(d.data() as WishlistItem);
      });
    } catch (err) {
      console.warn('Gagal membaca wishlist dari Firestore, membaca dari lokal:', err);
      items = [];
    }
  }

  if (items.length === 0) {
    items = getLocalWishlist(userId);
  }

  // Gabungkan dengan data katalog resmi products.json
  const enriched = items.map((w) => {
    const product = CATALOG_PRODUCTS.find((p) => p.id === w.productId);
    return {
      ...w,
      product: product || {
        id: w.productId,
        name: 'Produk Tidak Ditemukan',
        category: 'Umum',
        price: 0,
        description: 'Produk ini mungkin telah diarsipkan dari katalog.',
        tags: [],
        imageUrl: '',
      },
    };
  });

  // Urutkan berdasarkan waktu simpan terbaru
  enriched.sort((a, b) => b.savedAt - a.savedAt);
  return enriched;
}

/**
 * UPDATE: Memperbarui catatan (note) pada item wishlist
 */
export async function updateWishlistNote(
  userId: string,
  productId: string,
  note: string
): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', userId, 'wishlist', productId);
      await updateDoc(docRef, { note });
      return;
    } catch (err) {
      console.warn('Gagal update catatan wishlist di Firestore:', err);
    }
  }

  // Fallback lokal
  const current = getLocalWishlist(userId);
  const updated = current.map((item) =>
    item.productId === productId ? { ...item, note } : item
  );
  saveLocalWishlist(userId, updated);
}

/**
 * DELETE: Menghapus item dari wishlist
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', userId, 'wishlist', productId);
      await deleteDoc(docRef);
      return;
    } catch (err) {
      console.warn('Gagal menghapus wishlist dari Firestore:', err);
    }
  }

  // Fallback lokal
  const current = getLocalWishlist(userId);
  saveLocalWishlist(
    userId,
    current.filter((item) => item.productId !== productId)
  );
}

/**
 * CHECK: Memeriksa apakah produk sudah ada di wishlist pengguna
 */
export async function checkIsInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'users', userId, 'wishlist', productId);
      const snap = await getDoc(docRef);
      if (snap.exists()) return true;
    } catch {
      // lanjut ke lokal
    }
  }

  const current = getLocalWishlist(userId);
  return current.some((item) => item.productId === productId);
}
