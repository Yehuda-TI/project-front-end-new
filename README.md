# CampusMarket — Asisten Pre-Sales E-Commerce (CRS + LLM) 🎓🤖🛍️

Aplikasi web asisten pre-sales e-commerce cerdas berbasis kolaborasi **Conversational Recommender System (CRS)** dan **Large Language Model (LLM)**. Dikembangkan sebagai implementasi prototipe tugas akhir/final project berdasarkan prinsip paper ilmiah:  
> **"Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue"**

Aplikasi ini menggabungkan ketepatan matematis mesin rekomendasi (CRS) yang menyaring katalog produk riil kampus dengan keluwesan persuasif LLM (Google Gemini) yang menjelaskan keunggulan produk secara alami kepada calon pembeli mahasiswa tanpa terjadi halusinasi produk (*0% Hallucination Rate*).

---

## 🌟 Fitur Utama Sistem

### 1. Asisten Pre-Sales CRS + LLM (`/chat`)
- **Dual Mode (Bisa Diganti Real-time):**
  - **Mode Grounded (CRS + LLM)**: Model rekomendasi menyaring kandidat terbaik dari katalog, lalu LLM menyusun dialog persuasif berdasarkan data riil kandidat.
  - **Mode Baseline (LLM Murni)**: LLM menjawab langsung tanpa bantuan modul CRS (digunakan untuk perbandingan evaluasi).
- **Ekstraksi Niat Pengguna (Intent Extraction)**: Mendeteksi kategori barang, batas anggaran (*budget limit*), dan kata kunci relevan secara otomatis.
- **Rekomendasi Produk Interaktif**: Menampilkan langsung kartu produk (`ProductCard`) di bawah bubble pesan asisten.
- **Barrier Anti-Halusinasi**: Sistem menyaring setiap ID produk rekomendasi secara deterministik; ID fiktif langsung dieliminasi sebelum mencapai UI.
- **Riwayat Percakapan Persisten**: Obrolan tersimpan otomatis ke Cloud Firestore (`users/{uid}/chats`) dengan fallback aman ke `localStorage`.

### 2. Katalog Produk Mahasiswa (`/catalog`)
- Menampilkan 30 produk riil mahasiswa di `src/data/products.json` dalam 6 kategori:
  1. Gadget & Elektronik
  2. Buku & Kuliah
  3. Kos & Kamar
  4. Fashion & Pakaian
  5. Transportasi & Aksesori
  6. Makanan & Minuman
- Filter pencarian kata kunci, kategori dinamis, dan rentang harga (Min - Max IDR).
- Tombol cepat **"Konsultasi ke AI"** pada setiap produk yang langsung mengarahkan pengguna ke halaman Chat untuk menanyakan detail produk ke asisten AI.

### 3. Operasi CRUD Lengkap
- **Create (C)**:
  - Menyimpan produk rekomendasi atau katalog ke daftar Wishlist (`addToWishlist`).
  - Mengirim dan menyimpan pesan baru ke riwayat konsultasi chat (`saveChatMessage`).
- **Read (R)**:
  - Melihat daftar Wishlist yang terhubung langsung dengan detail produk katalog (`getWishlist`).
  - Membaca riwayat dialog konsultasi terdahulu (`getChatHistory`).
  - Menjelajahi katalog 30 produk (`CATALOG_PRODUCTS`).
- **Update (U)**:
  - Mengubah catatan personal/alasan pembelian pada setiap item di wishlist (`updateWishlistNote`).
  - Memperbarui preferensi belanja pengguna pada profil (rentang budget min-max dan kategori favorit) untuk mempersonalisasi skor CRS (`updatePreferences`).
- **Delete (D)**:
  - Menghapus item dari daftar wishlist (`removeFromWishlist`).
  - Membersihkan riwayat percakapan konsultasi chat (`clearChatHistory`).

### 4. Autentikasi Mahasiswa & Profil Preferensi (`/profile`)
- Firebase Authentication dengan penyedia Email & Password.
- Halaman Profil untuk menyetel **Preferensi CRS**:
  - Batas Anggaran Belanja (Budget Min & Max).
  - Pilihan Kategori Favorit (memberikan bobot relevansi tambahan +20 poin pada mesin CRS).
- Mode Demo Cepat (*1-Click Demo Login*) untuk memudahkan pengujian oleh dosen penguji tanpa perlu registrasi manual.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript | Strict mode, zero `any`, typed components |
| **Build Tool** | Vite 6 | Kompilasi ultra-cepat dan HMR |
| **Routing** | React Router v7 | Navigasi SPA dengan Route Guards |
| **Styling** | Tailwind CSS | Aturan warna 60% White, 30% Slate, 10% Emerald |
| **Ikon UI** | Lucide React | Ikon modern dan konsisten |
| **Conversational LLM** | Google Gemini 1.5 Flash | REST API via HTTPS, streaming-ready prompt |
| **Backend & Auth** | Firebase Authentication | Manajemen sesi pengguna aman |
| **Database & Fallback** | Cloud Firestore / LocalStorage | Penyimpanan persisten dengan *hybrid resiliency* |

---

## ⚙️ Panduan Menjalankan Aplikasi

### 1. Prasyarat
- [Node.js](https://nodejs.org/) v18.0.0 atau yang lebih baru.
- Koneksi internet untuk memanggil Gemini API dan Firebase.

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin file `.env.example` menjadi `.env.local` jika belum ada:
```bash
cp .env.example .env.local
```

Buka `.env.local` dan lengkapi konfigurasi berikut:
```env
# Google Gemini REST API (Dapatkan gratis di https://aistudio.google.com/)
VITE_GEMINI_API_KEY=AIzaSy_KUNCI_API_GEMINI_ANDA
VITE_GEMINI_MODEL=gemini-1.5-flash

# Firebase Configuration (Dapatkan dari Firebase Console > Project Settings)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=campusmarket-6269e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=campusmarket-6269e
VITE_FIREBASE_STORAGE_BUCKET=campusmarket-6269e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=317469418164
VITE_FIREBASE_APP_ID=1:317469418164:web:...
```

> **Catatan Ketahanan (Resilience):** Jika API Key Gemini belum diisi, modul AI secara cerdas beralih ke *heuristic Indonesian regex parser* dan simulasi CRS pre-sales terpandu. Jika kredensial Firebase belum diisi, aplikasi otomatis beralih ke *localStorage fallback* sehingga aplikasi tetap dapat diuji 100% tanpa error putih (*blank screen*).

### 4. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di alamat: `http://localhost:5173`.

### 5. Membangun Kode Produksi (Build)
```bash
npm run build
```
Perintah ini akan menjalankan pengecekan tipe ketat `tsc -b` dan mem-bundle aset produksi via `vite build`.

---

## 📁 Struktur Direktori Proyek

```text
├── docs/
│   ├── ARCHITECTURE.md     # Diagram alur kerja CRS + LLM, sequence diagram & komponen
│   ├── AUDIT.md            # Laporan audit komprehensif kepatuhan kode awal
│   ├── EVALUATION.md       # Hasil eksperimen benchmark metrik: Baseline vs Grounded
│   └── GAP_ANALYSIS.md     # Matriks kesenjangan paper referensi vs sistem prototipe
├── src/
│   ├── components/         # Komponen UI modular
│   │   ├── auth/           # ProtectedRoute guard
│   │   ├── layout/         # Navbar (responsif dengan drawer), Footer
│   │   ├── products/       # ProductCard (dengan aksi Wishlist & Konsultasi AI)
│   │   └── ui/             # Badge, Button, Input, Modal
│   ├── config/             # APP_CONFIG & environment variable parser
│   ├── contexts/           # AuthContext (autentikasi & manajemen preferensi profil)
│   ├── data/
│   │   └── products.json   # Dataset katalog 30 produk mahasiswa lengkap
│   ├── evaluation/         # Skrip benchmark & 10 skenario query pengujian sistem
│   │   ├── testQueries.ts
│   │   └── runEvaluation.ts
│   ├── lib/                # Inisialisasi Firebase Auth & Firestore
│   ├── pages/              # Halaman utama aplikasi:
│   │   ├── CatalogPage.tsx # Halaman penjelajahan katalog produk
│   │   ├── ChatPage.tsx    # Halaman konsultasi dialog pre-sales CRS + LLM
│   │   ├── WishlistPage.tsx# Halaman kelola wishlist (CRUD penuh dengan catatan)
│   │   ├── ProfilePage.tsx # Halaman profil & konfigurasi preferensi CRS
│   │   ├── LoginPage.tsx   # Halaman masuk mahasiswa
│   │   └── RegisterPage.tsx# Halaman pendaftaran mahasiswa
│   ├── routes/             # Definisi rute React Router v7
│   ├── services/           # Logika bisnis sistem:
│   │   ├── aiService.ts    # Integrasi Gemini REST API, grounding & anti-hallucination
│   │   ├── recommender.ts  # Algoritma scoring & filtering CRS
│   │   ├── product.service.ts
│   │   ├── wishlist.service.ts
│   │   ├── chat.service.ts
│   │   └── auth.service.ts
│   └── types/              # Type definition TypeScript (Product, Intent, Message, dll.)
├── firestore.rules         # Aturan keamanan database Cloud Firestore
├── .env.example            # Template variabel lingkungan
├── package.json
└── tsconfig.json           # Konfigurasi TypeScript strict
```

---

## 📊 Hasil Evaluasi Singkat (Baseline vs Grounded)

Ringkasan hasil evaluasi komparatif dari 10 skenario kueri kompleks (lihat [docs/EVALUATION.md](docs/EVALUATION.md)):

| Metrik Evaluasi | Mode Baseline (LLM Saja) | Mode Grounded (CRS + LLM) | Dampak Integrasi CRS |
| :--- | :---: | :---: | :---: |
| **Hallucination Rate** | **75.0%** (Rentan halusinasi) | **0.0%** (Sempurna) | Berhasil mengeliminasi produk fiktif |
| **Budget Compliance Rate** | **25.0%** | **100.0%** (Patuh penuh) | Rekomendasi selalu berada di bawah batas budget pembeli |
| **Category Accuracy** | **87.5%** | **100.0%** | Kategori produk selalu tepat sesuai kebutuhan pembeli |

---

## 📄 Dokumen Akademis & Referensi

- [Dokumen Arsitektur Lengkap (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Dokumen Analisis Kesenjangan Paper (docs/GAP_ANALYSIS.md)](docs/GAP_ANALYSIS.md)
- [Dokumen Evaluasi dan Benchmark (docs/EVALUATION.md)](docs/EVALUATION.md)
- [Dokumen Audit Proyek (docs/AUDIT.md)](docs/AUDIT.md)
