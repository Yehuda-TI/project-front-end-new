# Dokumen Audit Proyek: Asisten Pre-Sales E-Commerce (CRS + LLM)

Dokumen ini merupakan hasil audit awal struktur dan fungsionalitas basis kode sebelum implementasi sistem rekomendasi percakapan (Conversational Recommender System / CRS) terintegrasi Large Language Model (LLM) berdasarkan paper referensi:
*"Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue"*.

---

## 1. Ringkasan Status Fitur (Checklist Audit)

| No | Komponen / Fitur yang Diaudit | Status | Keterangan & Catatan Temuan |
|---|---|:---:|---|
| a | **Register & Login Firebase Auth, serta Route Guard** | **SEBAGIAN** | Autentikasi email/password (`auth.service.ts`, `LoginPage.tsx`, `RegisterPage.tsx`) dan `ProtectedRoute.tsx` sudah terpasang. Perlu penyesuaian rute guard untuk halaman baru (`/chat`, `/wishlist`, `/profile`) dan penanganan session state yang rapi. |
| b | **Halaman Katalog dengan Product Card dari `products.json`** | **SEBAGIAN** | Terdapat `MarketplacePage.tsx` dan `ProductCard.tsx`, namun data produk masih mengandalkan array kecil di service lama. Belum ada `src/data/products.json` (minimal 25 produk e-commerce) dan rute resmi `/catalog`. |
| c | **Halaman Chat yang Memanggil Gemini** | **BELUM** | Belum terdapat halaman `/chat`, UI percakapan (message bubble, auto-scroll, loading state), maupun integrasi REST API Gemini (`aiService.ts`). |
| d | **AI Merekomendasikan Produk dari Katalog (Bukan Karangan)** | **BELUM** | Modul CRS (`recommender.ts`) dengan fungsi *candidate filtering*, *scoring*, dan integrasi dua tahap (intent extraction + candidate-grounded persuasion) belum tersedia. |
| e | **CRUD (Wishlist, Riwayat Chat, Profil/Preferensi)** | **SEBAGIAN** | - **Create (simpan ke wishlist)**: BELUM<br>- **Read (lihat wishlist & riwayat chat)**: BELUM<br>- **Update (catatan wishlist & preferensi budget/kategori)**: SEBAGIAN (hanya ada form profil dasar)<br>- **Delete (hapus item wishlist & riwayat chat)**: BELUM |
| f | **Seluruh File TypeScript & React Router Terpasang** | **SUDAH** | Proyek menggunakan React 18, TypeScript (~5.7.2), dan React Router v7. Seluruh file di `src/` menggunakan ekstensi `.ts`/`.tsx` dan berhasil melalui kompilasi `tsc -b`. |
| g | **API Key Tidak Terekspos di Repo & Firestore Rules Ada** | **SUDAH** | File `.env` dan `.env.local` telah terdaftar di `.gitignore`. Terdapat `firestore.rules` di root proyek. Aturan keamanan perlu diperluas untuk mencakup sub-koleksi `wishlist` dan `chats`. |

---

## 2. Rencana Eksekusi Berdasarkan Tahapan

1. **TAHAP 1 — Types & Struktur:** Mendefinisikan kontrak data TypeScript ketat di `src/types/index.ts` (`Product`, `ChatMessage`, `WishlistItem`, `UserPreferences`, `ExtractedIntent`) dengan timestamp berbasis `number` (epoch ms), serta menyiapkan dataset `src/data/products.json` (30 produk e-commerce lintas kategori).
2. **TAHAP 2 — Auth & Navigasi:** Merapikan `AuthContext`, menambahkan hook `useAuth`, menyesuaikan `Navbar` dan `ProtectedRoute` untuk rute `/login`, `/register`, `/catalog`, `/chat`, `/wishlist`, dan `/profile`.
3. **TAHAP 3 — Modul Rekomendasi (CRS Core):** Mengimplementasikan `src/services/recommender.ts` dengan fungsi murni (`filterProducts`, `scoreProduct`, `getTopCandidates`, dan mekanisme fallback jika intent kosong).
4. **TAHAP 4 — Integrasi LLM (Gemini REST API):** Membangun `src/services/aiService.ts` dengan alur 2 langkah (ekstraksi intent -> rekomendasi berbasis kandidat), validasi ID produk anti-halusinasi, mode `grounded` vs `baseline`, dan penanganan error timeout/rate limit.
5. **TAHAP 5 — Halaman Chat & Katalog:** Mengembangkan antarmuka `/chat` interaktif dengan auto-scroll dan product recommendation card, serta halaman `/catalog` dengan pencarian dan filter kategori responsif.
6. **TAHAP 6 — Firestore & CRUD:** Mengimplementasikan service dan UI untuk Wishlist (`create`, `read`, `update` catatan, `delete`), riwayat percakapan (`read`, `delete`), serta pembaharuan preferensi profil (`budgetMin`, `budgetMax`, `favoriteCategories`). Memperbarui `firestore.rules`.
7. **TAHAP 7 — Pengujian & Evaluasi:** Menyiapkan `src/evaluation/testQueries.ts` (10 query uji) dan skrip/halaman evaluasi untuk membandingkan metrik halusinasi, kesesuaian budget, dan kesesuaian kategori antara mode *baseline* dan *grounded*, lalu mendokumentasikan hasilnya di `docs/EVALUATION.md`.
8. **TAHAP 8 — Dokumentasi Lengkap:** Menyusun `docs/ARCHITECTURE.md` (diagram Mermaid), `docs/GAP_ANALYSIS.md` (komparasi paper vs implementasi), serta memperbarui `README.md`.
