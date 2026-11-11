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
import catalogJson from '@/data/products.json';

const PRODUCTS_COLLECTION = 'products';
const LOCAL_STORAGE_KEY = 'campus_market_custom_products';

// 30 Produk E-Commerce dari src/data/products.json sebagai katalog dasar
export const CATALOG_PRODUCTS: Product[] = (catalogJson as any[]).map((p, idx) => ({
  id: p.id || `prod-${String(idx + 1).padStart(3, '0')}`,
  name: p.name,
  title: p.name,
  category: p.category,
  price: p.price,
  description: p.description,
  tags: p.tags || [],
  imageUrl: p.imageUrl,
  imageUrls: [p.imageUrl],
  storagePaths: [],
  sellerId: 'system-catalog',
  sellerName: 'Official Campus Store',
  sellerEmail: 'store@campus.ac.id',
  condition: 'new',
  status: 'available',
  createdAt: Date.now() - (idx * 3600000),
  updatedAt: Date.now() - (idx * 3600000),
}));

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
      name: productData.name || productData.title || 'Produk Baru',
      title: productData.title || productData.name || 'Produk Baru',
      imageUrl: productData.imageUrl || (productData.imageUrls && productData.imageUrls[0]) || '',
      tags: productData.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    name: productData.name || productData.title || 'Produk Baru',
    title: productData.title || productData.name || 'Produk Baru',
    imageUrl: productData.imageUrl || (productData.imageUrls && productData.imageUrls[0]) || '',
    tags: productData.tags || [],
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
        const item = d.data() as Product;
        productsList.push({
          ...item,
          name: item.name || item.title || 'Produk',
          title: item.title || item.name || 'Produk',
          imageUrl: item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '',
          tags: item.tags || [],
        });
      });
    } catch (err) {
      console.warn('Gagal membaca Firestore, menggunakan katalog lokal:', err);
      productsList = [];
    }
  }

  // Jika Firestore belum diisi atau dalam mode demo, gabungkan local custom products + katalog 30 produk
  if (productsList.length === 0) {
    const custom = getLocalCustomProducts();
    productsList = [...custom, ...CATALOG_PRODUCTS];
  }

  // Filter client-side
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    productsList = productsList.filter(
      (p) =>
        (p.name || p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
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
        const item = snap.data() as Product;
        return {
          ...item,
          name: item.name || item.title || 'Produk',
          title: item.title || item.name || 'Produk',
          imageUrl: item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '',
          tags: item.tags || [],
        };
      }
    } catch (err) {
      console.error('Error fetching product by ID from Firestore:', err);
    }
  }

  // Cek custom local products dan catalog JSON
  const allLocal = [...getLocalCustomProducts(), ...CATALOG_PRODUCTS];
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

  const allLocal = [...getLocalCustomProducts(), ...CATALOG_PRODUCTS];
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

  const catalogItem = CATALOG_PRODUCTS.find((p) => p.id === productId);
  if (catalogItem) {
    catalogItem.status = status;
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
  const idx = CATALOG_PRODUCTS.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    CATALOG_PRODUCTS.splice(idx, 1);
  }
};
