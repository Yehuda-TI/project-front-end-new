/**
 * Modul Conversational Recommender System (CRS)
 * Berdasarkan paper: "Conversational Recommender System and Large Language Model
 * Are Made for Each Other in E-commerce Pre-sales Dialogue"
 * 
 * Modul ini bertanggung jawab memilih kandidat produk terbaik (retrieval & scoring)
 * secara objektif dari katalog sebelum diserahkan ke LLM untuk dipersuasi.
 */

import { Product, ExtractedIntent, UserPreferences } from '@/types';

export interface ScoredProduct {
  product: Product;
  score: number;
}

/**
 * Menyaring produk berdasarkan kategori dan batas anggaran maksimal
 * Fungsi murni (pure function) tanpa efek samping
 */
export const filterProducts = (
  products: Product[],
  intent: ExtractedIntent
): Product[] => {
  let candidates = [...products];

  // 1. Saring berdasarkan kategori jika teridentifikasi
  if (intent.category && intent.category.trim() !== '' && intent.category !== 'Semua') {
    const targetCat = intent.category.toLowerCase().trim();
    const matched = candidates.filter((p) => {
      const pCat = p.category.toLowerCase();
      return pCat === targetCat || pCat.includes(targetCat) || targetCat.includes(pCat);
    });

    // Jika ada hasil yang cocok, gunakan hasil filter; jika tidak ada, jangan langsung kosongkan
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  // 2. Saring berdasarkan batas anggaran maksimal
  if (intent.maxBudget && intent.maxBudget > 0) {
    const withinBudget = candidates.filter((p) => p.price <= (intent.maxBudget as number));
    // Jika ada produk yang sesuai budget, prioritaskan
    if (withinBudget.length > 0) {
      candidates = withinBudget;
    }
  }

  return candidates;
};

/**
 * Menghitung skor kecocokan produk terhadap intent pembeli dan preferensi profil pengguna
 * Skor = Kecocokan Kategori + Kedekatan Harga + Kecocokan Keywords + Bonus Kategori Favorit
 */
export const scoreProduct = (
  product: Product,
  intent: ExtractedIntent,
  preferences?: UserPreferences | null
): number => {
  let score = 0;

  // A. Kecocokan Kategori (+35 poin)
  if (intent.category && intent.category.trim() !== '') {
    const targetCat = intent.category.toLowerCase().trim();
    const pCat = product.category.toLowerCase();
    if (pCat === targetCat) {
      score += 35;
    } else if (pCat.includes(targetCat) || targetCat.includes(pCat)) {
      score += 25;
    }
  }

  // B. Kedekatan Harga dengan Budget
  if (intent.maxBudget && intent.maxBudget > 0) {
    if (product.price <= intent.maxBudget) {
      // Produk dalam budget: rasio kedekatan dengan budget memberikan hingga +25 poin
      const ratio = product.price / intent.maxBudget;
      score += Math.round(ratio * 25);
    } else {
      // Penalti jika melebihi budget yang diminta
      const excessRatio = (product.price - intent.maxBudget) / intent.maxBudget;
      score -= Math.min(30, Math.round(excessRatio * 40));
    }
  }

  // C. Bonus Preferensi Budget Pengguna di Profil (+15 poin)
  if (preferences?.budgetMin !== undefined && preferences?.budgetMax !== undefined) {
    if (product.price >= preferences.budgetMin && product.price <= preferences.budgetMax) {
      score += 15;
    }
  }

  // D. Kecocokan Keyword di Nama, Tags, dan Deskripsi
  if (intent.keywords && intent.keywords.length > 0) {
    const prodName = (product.name || product.title || '').toLowerCase();
    const prodDesc = (product.description || '').toLowerCase();
    const prodTags = (product.tags || []).map((t) => t.toLowerCase());

    for (const rawKw of intent.keywords) {
      const kw = rawKw.toLowerCase().trim();
      if (!kw || kw.length < 2) continue;

      if (prodName.includes(kw)) {
        score += 15; // Kecocokan kuat pada judul produk
      }
      if (prodTags.some((t) => t.includes(kw) || kw.includes(t))) {
        score += 10; // Kecocokan pada tag produk
      }
      if (prodDesc.includes(kw)) {
        score += 5; // Kecocokan pada deskripsi
      }
    }
  }

  // E. Bonus Kategori Favorit di Profil Pengguna (+20 poin)
  if (preferences?.favoriteCategories && preferences.favoriteCategories.length > 0) {
    const isFavorite = preferences.favoriteCategories.some((fav) => {
      const f = fav.toLowerCase();
      const pCat = product.category.toLowerCase();
      return pCat === f || pCat.includes(f) || f.includes(pCat);
    });

    if (isFavorite) {
      score += 20;
    }
  }

  return score;
};

/**
 * Mengambil N produk kandidat teratas beserta skor relevansinya
 * Dilengkapi mekanisme fallback jika intent kosong atau tidak ada kandidat
 */
export const getTopCandidates = (
  products: Product[],
  intent: ExtractedIntent,
  preferences?: UserPreferences | null,
  n: number = 5
): ScoredProduct[] => {
  if (!products || products.length === 0) {
    return [];
  }

  const isIntentEmpty =
    (!intent.category || intent.category.trim() === '') &&
    (!intent.maxBudget || intent.maxBudget <= 0) &&
    (!intent.keywords || intent.keywords.length === 0);

  // Jika intent kosong, gunakan fallback rekomendasi berdasarkan kategori favorit profil atau produk terpopuler
  if (isIntentEmpty) {
    const scoredFallback = products.map((product) => ({
      product,
      score: scoreProduct(product, intent, preferences) + 10,
    }));

    // Urutkan berdasarkan skor tertinggi (misal yang cocok dengan profil), lalu kembalikan N teratas
    scoredFallback.sort((a, b) => b.score - a.score);
    return scoredFallback.slice(0, n);
  }

  // 1. Saring kandidat produk
  let candidatePool = filterProducts(products, intent);
  if (candidatePool.length === 0) {
    candidatePool = [...products];
  }

  // 2. Beri skor pada setiap produk di dalam pool kandidat
  const scoredCandidates: ScoredProduct[] = candidatePool.map((product) => ({
    product,
    score: scoreProduct(product, intent, preferences),
  }));

  // 3. Urutkan berdasarkan skor tertinggi (descending)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // 4. Ambil N produk teratas
  return scoredCandidates.slice(0, n);
};
