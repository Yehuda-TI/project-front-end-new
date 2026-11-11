/**
 * Kumpulan 10 Query Uji untuk Evaluasi Asisten Pre-Sales CRS + LLM
 * Berdasarkan variasi kategori dan batasan budget (Bahan PPT & Skripsi)
 */

export interface EvaluationQuery {
  id: number;
  query: string;
  expectedCategory: string;
  maxBudget: number;
  description: string;
}

export const TEST_QUERIES: EvaluationQuery[] = [
  {
    id: 1,
    query: 'Saya cari laptop untuk mahasiswa informatika belajar coding budget sekitar 8.5 juta',
    expectedCategory: 'Laptop & Komputer',
    maxBudget: 8500000,
    description: 'Pencarian laptop coding mid-range untuk tugas kuliah'
  },
  {
    id: 2,
    query: 'Mau beli headphone wireless ada noise cancelling buat belajar di perpus budget 1.5 juta',
    expectedCategory: 'Audio & Aksesori',
    maxBudget: 1500000,
    description: 'Pencarian headphone ANC untuk konsentrasi belajar'
  },
  {
    id: 3,
    query: 'Ada rekomendasi hp samsung kamera bagus untuk foto tugas kuliah harga maksimal 6 juta?',
    expectedCategory: 'Smartphone & Tablet',
    maxBudget: 6000000,
    description: 'Pencarian smartphone dengan spesifikasi kamera tinggi'
  },
  {
    id: 4,
    query: 'Butuh air fryer hemat listrik untuk masak praktis di kamar kos budget 1.2 juta',
    expectedCategory: 'Peralatan Rumah Tangga',
    maxBudget: 1200000,
    description: 'Pencarian peralatan masak praktis anak kos'
  },
  {
    id: 5,
    query: 'Cari tablet atau ipad untuk baca jurnal dan mencatat materi kuliah budget 6.5 juta',
    expectedCategory: 'Smartphone & Tablet',
    maxBudget: 6500000,
    description: 'Pencarian tablet produktivitas belajar'
  },
  {
    id: 6,
    query: 'Rekomendasikan mechanical keyboard wireless untuk ngetik skripsi budget di bawah 1.5 juta',
    expectedCategory: 'Audio & Aksesori',
    maxBudget: 1500000,
    description: 'Pencarian periferal pengetikan ergonomis'
  },
  {
    id: 7,
    query: 'Kamera mirrorless untuk konten vlog youtube mahasiswa budget maksimal 10 juta',
    expectedCategory: 'Kamera & Fotografi',
    maxBudget: 10000000,
    description: 'Pencarian kamera konten kreator kampus'
  },
  {
    id: 8,
    query: 'Kalkulator scientific resmi ujian teknik elektro budget 350 ribu',
    expectedCategory: 'Perlengkapan Belajar',
    maxBudget: 350000,
    description: 'Pencarian alat hitung standar ujian teknik'
  },
  {
    id: 9,
    query: 'Rice cooker mini hemat daya atau teko pemanas air untuk anak kos budget 250 ribu',
    expectedCategory: 'Peralatan Rumah Tangga',
    maxBudget: 250000,
    description: 'Pencarian peralatan elektronik dasar kos'
  },
  {
    id: 10,
    query: 'Laptop gaming untuk tugas grafis dan render 3D budget 11 juta',
    expectedCategory: 'Laptop & Komputer',
    maxBudget: 11000000,
    description: 'Pencarian laptop high performance rendering & gaming'
  }
];
