# Arsitektur Sistem: Asisten Pre-Sales E-Commerce (CRS + LLM)

Dokumen ini mendokumentasikan arsitektur sistem web asisten pre-sales e-commerce berbasis kolaborasi **Conversational Recommender System (CRS)** dan **Large Language Model (LLM)**, yang dirancang sesuai prinsip-prinsip dari paper penelitian:  
*“Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue”*.

---

## 1. Ringkasan Konseptual

Dalam e-commerce konvensional, LLM murni sering mengalami **halusinasi produk** (merekomendasikan barang yang tidak ada di inventaris) atau **ketidakpatuhan filter** (memberi produk di luar batas anggaran/kategori pembeli). Sebaliknya, sistem rekomendasi murni (CRS) memiliki ketepatan matematis dalam menyaring katalog, namun tidak memiliki kemampuan komunikasi alami dan daya bujuk persuasif layaknya seorang staf *sales*.

Sistem ini memadukan keunggulan keduanya:
1. **Modul Rekomendasi (CRS)**: Bertindak sebagai *objective filter and ranker*. Memilih kandidat produk riil dari katalog lokal berdasarkan batasan anggaran, kategori, kata kunci, dan preferensi profil pengguna.
2. **Modul Bahasa (LLM - Google Gemini)**: Bertindak sebagai *persuasive communicator*. Menerima kandidat produk riil dari CRS, menyusun narasi persuasif yang ramah dan kontekstual, serta menjelaskan mengapa produk tersebut cocok untuk kebutuhan pembeli.
3. **Anti-Hallucination Barrier**: Lapisan validasi deterministik di *frontend/service layer* yang memverifikasi setiap ID produk yang dihasilkan LLM terhadap data katalog sebelum ditampilkan ke antarmuka pengguna.

---

## 2. Diagram Alur Kerja (Flowchart)

```mermaid
flowchart TD
    A["Pengguna Mengirim Pesan Chat\n(contoh: 'Laptop buat skripsi budget 7jt')"] --> B["aiService.ts (Orchestrator)"]
    
    subgraph S1["Tahap 1: Ekstraksi Niat (Intent Extraction)"]
        B --> C["Step A: Ekstraksi Intent via Gemini REST API\n(Fallback: Regex/Heuristic Parser)"]
        C --> D["Ekstrak Objek Intent:\n- category: 'Gadget'\n- maxBudget: 7.000.000\n- keywords: ['skripsi', 'laptop']"]
    end

    subgraph S2["Tahap 2: CRS Candidate Retrieval & Scoring"]
        D --> E["recommender.ts (Engine Rekomendasi)"]
        F["Katalog Produk (src/data/products.json)\n30 Item Multi-Kategori"] --> E
        G["Preferensi Profil Pengguna\n(Budget Range, Kategori Favorit)"] --> E
        E --> H["Filtering Berdasarkan Kategori & Budget"]
        H --> I["Multi-Factor Scoring:\n- Kesesuaian Kategori (+35)\n- Kedekatan Budget (+25)\n- Kecocokan Kata Kunci (+15/+10/+5)\n- Preferensi Profil (+20)"]
        I --> J["Top-N Kandidat Terpilih (Maksimal 5 Produk)"]
    end

    subgraph S3["Tahap 3: Pembangkitan Dialog Terpandu (Grounded Generation)"]
        J --> K["Step B: Panggilan Gemini REST API dengan Grounding Prompt"]
        K --> L["LLM Membaca Detail Spesifik Kandidat Riil\n(Nama, Harga, Fitur, Deskripsi)"]
        L --> M["LLM Menghasilkan Respons JSON:\n- reply: Teks persuasif ramah\n- recommendedProductIds: Array ID Produk"]
    end

    subgraph S4["Tahap 4: Verifikasi Anti-Halusinasi & Persistensi"]
        M --> N["Anti-Hallucination Validator"]
        N -->|ID Valid di Katalog| O["Produk Terverifikasi"]
        N -->|ID Fiktif/Tidak Dikenal| P["Dibuang (Discarded) & Dicatat"]
        O --> Q["Penyimpanan Riwayat Chat\n(Cloud Firestore / LocalStorage Fallback)"]
    end

    subgraph S5["Tahap 5: Penyajian Antarmuka Pengguna (UI)"]
        Q --> R["ChatPage.tsx"]
        R --> S["Bubble Pesan Asisten"]
        R --> T["Grid Kartu Produk Interaktif (ProductCard.tsx)\nLengkap dengan Tombol 'Wishlist' & 'Detail'"]
    end
```

---

## 3. Diagram Interaksi Antar-Komponen (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Mahasiswa (User)
    participant UI as ChatPage / ProductCard
    participant Svc as aiService (Orkestrator)
    participant Rec as Recommender (CRS Engine)
    participant Gemini as Google Gemini REST API
    participant Store as Firestore / LocalStorage

    User->>UI: Ketik pesan konsultasi & tekan Kirim
    UI->>Svc: generatePresalesDialogue(userMessage, history, preferences)
    
    rect rgb(240, 248, 255)
        note over Svc,Gemini: Tahap A: Ekstraksi Niat Pembeli
        Svc->>Gemini: Prompt ekstraksi kategori, budget, kata kunci
        Gemini-->>Svc: JSON ExtractedIntent
    end

    rect rgb(245, 255, 245)
        note over Svc,Rec: Tahap B: Pengambilan & Pembobotan Kandidat
        Svc->>Rec: getTopCandidates(products, intent, preferences, n=5)
        Rec->>Rec: Filter produk lolos syarat budget & kategori
        Rec->>Rec: Hitung skor multi-faktor (0 - 100)
        Rec-->>Svc: Daftar Top-5 Kandidat Riil
    end

    rect rgb(255, 250, 240)
        note over Svc,Gemini: Tahap C: Grounded Response Generation
        Svc->>Gemini: Prompt asisten pre-sales + data kandidat CRS
        Gemini-->>Svc: JSON { reply, recommendedProductIds }
    end

    rect rgb(255, 245, 245)
        note over Svc: Tahap D: Validasi Anti-Halusinasi
        Svc->>Svc: Filter ID produk yang hanya ada di products.json
    end

    Svc->>Store: saveChatMessage(userId, message)
    Store-->>Svc: Disimpan
    Svc-->>UI: Pesan asisten + daftar objek produk terverifikasi
    UI-->>User: Tampilkan bubble chat + ProductCard interaktif
```

---

## 4. Rincian Modul dan Komponen Utama

### A. Modul Data (`src/data/products.json` & `src/types/index.ts`)
- **`Product`**: Struktur data produk yang seragam mencakup `id`, `name`, `category`, `price`, `description`, `tags`, dan `imageUrl`.
- **Dataset**: Berisi 30 produk representatif dunia mahasiswa (Gadget & Elektronik, Buku & Kuliah, Kos & Perlengkapan Kamar, Fashion & Busana, Transportasi & Aksesori, Makanan & Minuman Kemasan).

### B. Modul Mesin Rekomendasi (`src/services/recommender.ts`)
- **`filterProducts`**: Menyaring produk secara deterministik berdasarkan kecocokan kategori dan ambang batas anggaran maksimal (`maxBudget`).
- **`scoreProduct`**: Menghitung bobot relevansi berbasis multivariabel:
  - **Kategori Cocok**: +35 poin
  - **Kedekatan Anggaran (Budget Proximity)**: Hingga +25 poin jika harga produk mendekati batas anggaran pengguna (\(1 - \frac{\text{gap}}{\text{budget}}\))
  - **Pencocokan Kata Kunci**: +15 poin untuk kecocokan pada nama produk, +10 poin pada tagar produk, +5 poin pada deskripsi
  - **Personalisasi Profil**: +20 poin jika kategori produk terdaftar dalam kategori favorit profil pengguna
- **`getTopCandidates`**: Mengurutkan seluruh produk terfilter berdasarkan skor tertinggi dan mengembalikan \(N\) produk teratas (default: 5 kandidat).

### C. Modul Layanan AI (`src/services/aiService.ts`)
- **`extractIntent`**: Mengekstrak entitas niat pembeli dalam format JSON terstruktur via Gemini Flash. Jika koneksi API gagal atau dibatasi lajunya, sistem beralih otomatis ke *heuristic Indonesian regex parser* tanpa menghentikan aplikasi.
- **`generatePresalesDialogue`**: Menyusun prompt *grounded* yang memuat profil kandidat produk dari CRS. Menginstruksikan LLM untuk berperan sebagai konsultan pre-sales ramah, menyebutkan kelebihan produk secara faktual, dan melarang menyebutkan produk di luar daftar kandidat.
- **Anti-Hallucination Filtering**: Memastikan setiap elemen dalam `recommendedProductIds` lolos uji `catalogMap.has(id)`. ID fiktif langsung disaring keluar.

### D. Modul Antarmuka Pengguna (`src/pages/ChatPage.tsx` & `src/components/products/ProductCard.tsx`)
- **Visualisasi Transparan**: Menampilkan status mode (Grounded vs Baseline) dan chip indikator *intent* yang terdeteksi (kategori, batas harga, dan kata kunci).
- **Integrasi Produk Langsung**: Pesan asisten yang merekomendasikan produk langsung merender kartu produk interaktif di bawah gelembung obrolan, lengkap dengan format Rupiah Indonesia, tag kategori, tombol simpan ke Wishlist, dan tautan konsultasi.

### E. Modul Persistensi Ganda (`src/services/wishlist.service.ts` & `src/services/chat.service.ts`)
- **Cloud Firestore**: Menggunakan sub-koleksi hierarki `users/{userId}/wishlist/{productId}` dan `users/{userId}/chats/{chatId}/messages/{messageId}`.
- **Resilience Fallback**: Apabila kredensial Firebase belum dikonfigurasi dalam `.env.local` atau jaringan terputus, seluruh operasi CRUD beralih mulus ke `localStorage` sehingga penguji atau dosen dapat langsung menguji aplikasi secara offline tanpa hambatan instalasi.
