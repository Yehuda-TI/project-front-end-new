# CampusMarket — Student Marketplace Platform 🎓🛍️

**CampusMarket** adalah platform web jual-beli barang preloved dan perlengkapan kuliah khusus antar mahasiswa di lingkungan kampus. Dirancang dengan tampilan antarmuka yang modern, bersih, intuitif, dan responsif, didukung oleh Firebase (Authentication, Cloud Firestore, Storage, dan Hosting).

---

## 🚀 Fitur Utama

1. **Autentikasi Mahasiswa (Firebase Auth):**
   - Pendaftaran akun mahasiswa dengan email, nama lengkap, dan nomor WhatsApp.
   - Login dengan validasi kata sandi, toggle sembunyikan/tampilkan kata sandi.
   - Fitur reset kata sandi melalui pengiriman email otomatis (`sendPasswordResetEmail`).
   - Rute terproteksi (*Protected Routes*) untuk halaman transaksi dan profil.
   - Pesan error autentikasi yang ramah dalam Bahasa Indonesia.

2. **Jelajahi & Cari Produk (Cloud Firestore):**
   - Pencarian cerdas berdasarkan judul dan kata kunci produk.
   - Filter berdasarkan 6 kategori utama kampus (*Buku & Kuliah, Elektronik & Gadget, Perlengkapan Kos, Fashion & Aksesori, Hobi & Olahraga, Lainnya*).
   - Filter kondisi barang: *Baru (Gress)* atau *Bekas (Preloved)*.
   - Filter rentang harga minimum & maksimum.
   - Pengurutan: *Terbaru, Harga Termurah, Harga Termahal*.
   - Skeleton loader animasi & status pencarian kosong (*empty states*) dengan tombol reset.

3. **Detail Produk & Kontak Penjual:**
   - Galeri multi-foto dengan thumbnail interaktif.
   - Format mata uang Rupiah (`Intl.NumberFormat`).
   - Badge ketersediaan: *Tersedia* atau *Sudah Terjual*.
   - Tombol **"Hubungi Penjual via WhatsApp"** yang langsung membuka obrolan WA dengan pesan pembuka otomatis memuat judul dan harga barang.
   - Deteksi pemilik listing untuk mencegah penjual menghubungi diri sendiri.
   - Tombol salin tautan produk untuk dibagikan ke teman atau grup kampus.

4. **Pasang Iklan & Unggah Foto (Firebase Storage):**
   - Formulir unggah multi-foto dengan preview sebelum publikasi.
   - Validasi batas ukuran file (maks. 5MB) dan format gambar (JPG, PNG, WEBP).
   - Indikator persentase proses pengunggahan (*progress bar*).
   - Jalur penyimpanan terstruktur: `product-images/{userId}/{productId}/{fileName}`.

5. **Kelola Iklan Saya (My Products):**
   - Daftar seluruh barang yang diiklankan oleh pengguna aktif.
   - Tombol cepat untuk mengubah status barang menjadi **Terjual** atau **Tersedia**.
   - Modal konfirmasi hapus iklan yang otomatis membersihkan file foto dari Firebase Storage dan dokumen dari Firestore.

6. **Profil Mahasiswa:**
   - Pengaturan nama lengkap, universitas/kampus, bio, dan nomor WhatsApp.
   - Sinkronisasi real-time ke koleksi `users/{userId}` di Cloud Firestore.

7. **Keamanan & Validasi Tingkat Tinggi:**
   - Validasi data input menggunakan **Zod** dan **React Hook Form**.
   - *Firebase Security Rules* yang ketat di Cloud Firestore & Storage berdasarkan UID akun yang terautentikasi.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Backend & Cloud Services:**
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Storage
  - Firebase Hosting
- **Routing:** React Router v7
- **Form & Validasi:** React Hook Form, Zod, @hookform/resolvers

---

## ⚙️ Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
Pastikan komputer Anda telah terinstal:
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru
- NPM atau PNPM

### 2. Instalasi Dependensi
Jalankan perintah berikut di terminal direktori project:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan Firebase
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu lengkapi nilai kredensial web Firebase Anda di `.env.local`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project-anda.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-anda
VITE_FIREBASE_STORAGE_BUCKET=project-anda.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di `http://localhost:5173`.

### 5. Membangun untuk Produksi
```bash
npm run build
```

---

## 🔐 Panduan Setup Firebase di Console

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. **Aktifkan Authentication:**
   - Masuk ke menu **Build > Authentication > Sign-in method**.
   - Aktifkan provider **Email/Password**.
3. **Aktifkan Cloud Firestore:**
   - Masuk ke menu **Build > Firestore Database > Create database**.
   - Pilih mode produksi (*Production mode*) dan tentukan lokasi server (misal: `asia-southeast2` untuk Jakarta).
4. **Aktifkan Firebase Storage:**
   - Masuk ke menu **Build > Storage > Get started**.
   - Pilih mode produksi dan lokasi yang sama.
5. **Daftarkan Web App:**
   - Masuk ke **Project Settings > General > Your apps**, klik ikon Web (`</>`).
   - Beri nama aplikasi (misal: `CampusMarket Web`).
   - Salin nilai konfigurasi ke file `.env.local`.

---

## 🛡️ Menerapkan Aturan Keamanan (Security Rules)

Aturan keamanan telah disiapkan pada file:
- `firestore.rules` (Membatasi hak tulis Firestore hanya untuk pemilik barang)
- `storage.rules` (Membatasi hak unggah & hapus Storage hanya untuk uploader foto)

Untuk menerapkan aturan keamanan ini ke Firebase Cloud:
```bash
npx -y firebase-tools@latest deploy --only firestore:rules,storage
```

---

## 📦 Struktur Direktori

```text
├── public/                 # Aset publik statis
├── src/
│   ├── components/         # Komponen UI & Layout reusable
│   │   ├── auth/           # ProtectedRoute guard
│   │   ├── layout/         # Navbar, Footer, RootLayout
│   │   ├── products/       # ProductCard, ProductSkeleton
│   │   └── ui/             # Button, Input, Badge
│   ├── contexts/           # AuthContext, ToastContext
│   ├── lib/                # firebase.ts (Singleton config)
│   ├── pages/              # Halaman-halaman aplikasi
│   ├── routes/             # Definisi React Router
│   ├── services/           # auth.service, product.service, storage.service
│   ├── types/              # Model data TypeScript
│   └── utils/              # formatters.ts (Rupiah, tanggal relatif)
├── .env.example            # Template variabel lingkungan
├── firebase.json           # Konfigurasi Firebase Hosting, Firestore, Storage
├── firestore.rules         # Aturan keamanan Cloud Firestore
├── storage.rules           # Aturan keamanan Firebase Storage
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
