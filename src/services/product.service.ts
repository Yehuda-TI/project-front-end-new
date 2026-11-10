import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Product, ProductFilterOptions } from '@/types';
import { deleteProductImage } from './storage.service';

const PRODUCTS_COLLECTION = 'products';
const LOCAL_STORAGE_KEY = 'campus_market_custom_products';

// Mock data mahasiswa untuk demo / initial state
const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    sellerId: 'demo-seller-1',
    sellerName: 'Dimas Pratama',
    sellerEmail: 'dimas@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6281234567890',
    title: 'Buku Kalkulus Thomas Edisi 13 (Original)',
    description: 'Buku wajib kalkulus teknik/mipa. Kondisi 90% mulus, tidak ada coretan pulpen atau halaman sobek. Sangat membantu untuk persiapan UTS/UAS.',
    price: 125000,
    category: 'Buku & Kuliah',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: 'demo-2',
    sellerId: 'demo-seller-2',
    sellerName: 'Aulia Rahma',
    sellerEmail: 'aulia@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6289876543210',
    title: 'iPad 9th Gen 64GB WiFi Space Gray + Apple Pencil 1',
    description: 'Dijual karena sudah lulus skripsi. Lengkap dengan dus asli, charger original, dan case pelindung. Battery health 92%, layar mulus terpasang paperlike screen protector.',
    price: 3650000,
    category: 'Elektronik & Gadget',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 12),
  },
  {
    id: 'demo-3',
    sellerId: 'demo-seller-3',
    sellerName: 'Rian Hidayat',
    sellerEmail: 'rian@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6285678901234',
    title: 'Meja Belajar Lipat Minimalis Kayu Jati Belanda',
    description: 'Cocok banget untuk kamar kos yang terbatas ruangnya. Bahan kokoh, mudah dilipat dan disimpan di bawah kasur. Masih mulus tanpa cacat.',
    price: 95000,
    category: 'Perlengkapan Kos',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 6),
    updatedAt: new Date(Date.now() - 3600000 * 6),
  },
  {
    id: 'demo-4',
    sellerId: 'demo-seller-4',
    sellerName: 'Siti Nurhaliza',
    sellerEmail: 'siti@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6281122334455',
    title: 'Kalkulator Scientific Casio fx-991EX ClassWiz Original',
    description: 'Bisa dipakai untuk ujian teknik sipil, mesin, elektro, dan akuntansi. Fungsi matriks dan integral normal 100%. Dilengkapi cover pelindung.',
    price: 180000,
    category: 'Elektronik & Gadget',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'demo-5',
    sellerId: 'demo-seller-1',
    sellerName: 'Dimas Pratama',
    sellerEmail: 'dimas@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6281234567890',
    title: 'Dispenser Air Mini Galon Bawah Portable',
    description: 'Sangat hemat listrik untuk anak kos. Kran dingin dan normal lancar, bersih terawat tanpa kerak.',
    price: 140000,
    category: 'Perlengkapan Kos',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  },
  {
    id: 'demo-6',
    sellerId: 'demo-seller-5',
    sellerName: 'Kevin Wijaya',
    sellerEmail: 'kevin@student.campus.ac.id',
    sellerPhotoURL: null,
    sellerWhatsapp: '6287788990011',
    title: 'Raket Badminton Yonex Astrox Lite + Senar BG66 Ultimax',
    description: 'Baru dipakai 2 kali di GOR kampus. Tarikan senar 26 lbs, siap pakai smash. Grip baru diganti warna hitam.',
    price: 260000,
    category: 'Hobi & Olahraga',
    condition: 'used',
    imageUrls: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
    ],
    storagePaths: [],
    status: 'available',
    createdAt: new Date(Date.now() - 3600000 * 30),
    updatedAt: new Date(Date.now() - 3600000 * 30),
  }
];

const getLocalCustomProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalCustomProducts = (products: Product[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Gagal menyimpan ke localStorage:', err);
  }
};

export const createProductListing = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!isFirebaseConfigured) {
    const newId = 'local_prod_' + Date.now();
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const current = getLocalCustomProducts();
    saveLocalCustomProducts([newProduct, ...current]);
    return newId;
  }

  const newDocRef = doc(collection(db, PRODUCTS_COLLECTION));
  const productId = newDocRef.id;

  const fullProduct: Product = {
    ...productData,
    id: productId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(newDocRef, fullProduct);
  return productId;
};

export const fetchProducts = async (filters?: ProductFilterOptions): Promise<Product[]> => {
  let productsList: Product[] = [];

  if (isFirebaseConfigured) {
    try {
      const collRef = collection(db, PRODUCTS_COLLECTION);
      let q = query(collRef, orderBy('createdAt', 'desc'));

      if (filters?.category && filters.category !== 'Semua') {
        q = query(collRef, where('category', '==', filters.category), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        productsList.push(d.data() as Product);
      });
    } catch (err) {
      console.warn('Gagal membaca Firestore, menggunakan data cadangan demo:', err);
      productsList = [];
    }
  }

  // Jika Firestore belum diisi atau dalam demo mode, gabungkan local custom products + initial demo
  if (productsList.length === 0) {
    const custom = getLocalCustomProducts();
    productsList = [...custom, ...INITIAL_DEMO_PRODUCTS];
  }

  // Filter client-side
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    productsList = productsList.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (filters?.category && filters.category !== 'Semua') {
    productsList = productsList.filter((p) => p.category === filters.category);
  }

  if (filters?.condition) {
    productsList = productsList.filter((p) => p.condition === filters.condition);
  }

  if (filters?.minPrice !== undefined && filters.minPrice > 0) {
    productsList = productsList.filter((p) => p.price >= (filters.minPrice || 0));
  }

  if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
    productsList = productsList.filter((p) => p.price <= (filters.maxPrice || Infinity));
  }

  // Sort
  if (filters?.sortBy === 'price-asc') {
    productsList.sort((a, b) => a.price - b.price);
  } else if (filters?.sortBy === 'price-desc') {
    productsList.sort((a, b) => b.price - a.price);
  } else {
    // Newest
    productsList.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  }

  return productsList;
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Product;
      }
    } catch (err) {
      console.error('Error fetching product by ID from Firestore:', err);
    }
  }

  // Cek custom local products dan demo
  const allLocal = [...getLocalCustomProducts(), ...INITIAL_DEMO_PRODUCTS];
  const found = allLocal.find((p) => p.id === id);
  return found || null;
};

export const fetchUserProducts = async (sellerId: string): Promise<Product[]> => {
  if (isFirebaseConfigured) {
    try {
      const collRef = collection(db, PRODUCTS_COLLECTION);
      const q = query(collRef, where('sellerId', '==', sellerId));
      const snapshot = await getDocs(q);
      const list: Product[] = [];
      snapshot.forEach((d) => list.push(d.data() as Product));
      return list;
    } catch (err) {
      console.error('Error fetching user products:', err);
    }
  }

  const allLocal = [...getLocalCustomProducts(), ...INITIAL_DEMO_PRODUCTS];
  return allLocal.filter((p) => p.sellerId === sellerId);
};

export const updateProductStatus = async (productId: string, status: 'available' | 'sold') => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const custom = getLocalCustomProducts();
  const updated = custom.map((p) => (p.id === productId ? { ...p, status } : p));
  saveLocalCustomProducts(updated);

  const demoItem = INITIAL_DEMO_PRODUCTS.find((p) => p.id === productId);
  if (demoItem) {
    demoItem.status = status;
  }
};

export const updateProductDetails = async (productId: string, data: Partial<Product>) => {
  if (isFirebaseConfigured) {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const custom = getLocalCustomProducts();
  const updated = custom.map((p) => (p.id === productId ? { ...p, ...data } : p));
  saveLocalCustomProducts(updated);
};

export const deleteProductListing = async (productId: string, storagePaths: string[]) => {
  if (isFirebaseConfigured) {
    if (storagePaths && storagePaths.length > 0) {
      await Promise.allSettled(storagePaths.map((path) => deleteProductImage(path)));
    }
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
    return;
  }

  const custom = getLocalCustomProducts();
  saveLocalCustomProducts(custom.filter((p) => p.id !== productId));
  const idx = INITIAL_DEMO_PRODUCTS.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    INITIAL_DEMO_PRODUCTS.splice(idx, 1);
  }
};
