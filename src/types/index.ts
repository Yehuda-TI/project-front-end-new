/**
 * Kontrak data TypeScript untuk Aplikasi Asisten Pre-Sales E-Commerce
 * Berdasarkan referensi paper CRS + LLM
 */

export type ProductCondition = 'new' | 'used';
export type ProductStatus = 'available' | 'sold';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  imageUrl: string;

  // Kompatibilitas opsional untuk komponen existing
  title?: string;
  imageUrls?: string[];
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhotoURL?: string | null;
  sellerWhatsapp?: string | null;
  storagePaths?: string[];
  condition?: ProductCondition;
  status?: ProductStatus;
  createdAt?: number | any;
  updatedAt?: number | any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedProductIds?: string[];
  createdAt: number; // epoch ms
}

export interface WishlistItem {
  productId: string;
  note: string;
  savedAt: number; // epoch ms
  product?: Product;
}

export interface UserPreferences {
  budgetMin: number;
  budgetMax: number;
  favoriteCategories: string[];
}

export interface ExtractedIntent {
  category: string | null;
  maxBudget: number | null;
  keywords: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  whatsappNumber?: string | null;
  bio?: string | null;
  campusName?: string | null;
  preferences?: UserPreferences;
  createdAt: number | any;
  updatedAt: number | any;
}

export interface ProductFilterOptions {
  category?: string;
  searchQuery?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
}

export type ProductCategory =
  | 'Laptop & Komputer'
  | 'Smartphone & Tablet'
  | 'Audio & Aksesori'
  | 'Kamera & Fotografi'
  | 'Perlengkapan Belajar'
  | 'Peralatan Rumah Tangga'
  | 'Buku & Kuliah'
  | 'Elektronik & Gadget'
  | 'Perlengkapan Kos'
  | 'Fashion & Aksesori'
  | 'Hobi & Olahraga'
  | 'Lainnya'
  | 'Semua'
  | string;
