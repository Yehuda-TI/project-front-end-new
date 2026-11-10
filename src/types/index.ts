export type ProductCategory = 
  | 'Buku & Kuliah'
  | 'Elektronik & Gadget'
  | 'Perlengkapan Kos'
  | 'Fashion & Aksesori'
  | 'Hobi & Olahraga'
  | 'Lainnya';

export type ProductCondition = 'new' | 'used';

export type ProductStatus = 'available' | 'sold';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  whatsappNumber?: string | null;
  bio?: string | null;
  campusName?: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhotoURL?: string | null;
  sellerWhatsapp?: string | null;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  imageUrls: string[];
  storagePaths: string[];
  status: ProductStatus;
  createdAt: any;
  updatedAt: any;
}

export interface ProductFilterOptions {
  category?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
}
