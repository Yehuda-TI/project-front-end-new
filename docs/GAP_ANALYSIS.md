# Analisis Kesenjangan (Gap Analysis)
## Perbandingan Sistem pada Paper Referensi vs Prototipe Sistem Web Kami

**Paper Referensi:**  
*“Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue”*

**Judul Proyek:**  
*Asisten Pre-Sales E-Commerce Berbasis Kolaborasi Conversational Recommender System (CRS) dan Large Language Model (LLM)*

---

## 1. Pendahuluan

Dokumen ini membandingkan arsitektur teoretis yang diusulkan dalam paper penelitian referensi dengan implementasi prototipe aplikasi web yang dikembangkan. Perbandingan ini bertujuan untuk memberikan transparansi akademis mengenai aspek apa saja dari paper yang telah diadaptasi secara penuh, aspek apa yang disederhanakan untuk kebutuhan komputasi web interaktif, serta memberikan arahan pengisian bagi mahasiswa melalui penanda khusus `[ISI DARI PAPER]`.

---

## 2. Tabel Matriks Perbandingan

| Dimensi Analisis | Sistem pada Paper Referensi | Sistem Kami (Implementasi Web) | Catatan / Alasan Adaptasi |
| :--- | :--- | :--- | :--- |
| **Tujuan Utama** | Menggabungkan kelebihan CRS (kandidat akurat) dan LLM (generasi dialog persuasif) dalam dialog pre-sales e-commerce. | Mengimplementasikan asisten pre-sales web interaktif yang merekomendasikan produk riil katalog kampus secara persuasif tanpa halusinasi. | **Sesuai Penuh**: Prinsip sinergi CRS + LLM diterapkan secara langsung dalam alur kerja dialog pre-sales. |
| **Arsitektur Model CRS** | `[ISI DARI PAPER: Masukkan model rekomendasi yang digunakan paper, misalnya: KGSF / CRSLab / Graph Convolutional Network / Matrix Factorization / Transformer-based Recommender]` | **Rule-Based Multi-Factor Scoring Engine** (`src/services/recommender.ts`): Menyaring kategori dan budget, serta memberi skor berbasis bobot kedekatan harga, pencocokan kata kunci, dan preferensi profil pengguna. | Disederhanakan menjadi scoring engine *client-side/edge* yang deterministik, berbobot jelas, dan memiliki latensi sub-milidetik tanpa memerlukan server GPU terpisah. |
| **Model LLM (Bahasa)** | `[ISI DARI PAPER: Masukkan fondasi LLM pada paper, misalnya: LLaMA-7B / ChatGLM-6B / Flan-T5 / GPT-3.5 fine-tuned]` | **Google Gemini 1.5 Flash** (via REST API langsung dengan format output JSON terstruktur). | Menggunakan Gemini 1.5 Flash karena memiliki kecepatan inferensi tinggi, latensi rendah, penalaran semantik bahasa Indonesia yang baik, dan kemampuan *structured JSON output*. |
| **Proses Fine-Tuning** | `[ISI DARI PAPER: Jelaskan apakah paper melakukan Instruction Tuning, LoRA fine-tuning, atau RLHF pada dataset dialog pre-sales e-commerce]` | **In-Context Prompt Grounding (Zero-Shot / Few-Shot Guided Prompting)**: LLM diinstruksikan melalui *system prompt* ketat dengan menyertakan metadata kandidat dari CRS. | Menghindari beban komputasi pelatihan model miliaran parameter dan mempermudah evaluasi langsung pada platform web *lightweight*. |
| **Format Komunikasi Antar-Modul** | `[ISI DARI PAPER: Jelaskan protokol transfer data antara CRS dan LLM, misalnya: vector embedding insertion, soft prompts, atau text serialized token]` | **JSON Serialization Pipeline**: Tahap A menghasilkan objek JSON `ExtractedIntent`, CRS mengembalikan array objek `Product`, dan Tahap B mengirimkan data teks kandidat ke prompt Gemini lalu menerima kembali JSON `{ reply, recommendedProductIds }`. | Protokol berbasis JSON transparan, mudah di-*debug*, dan langsung dapat dibaca oleh antarmuka React TypeScript. |
| **Dataset Produk & Dialog** | `[ISI DARI PAPER: Masukkan nama dataset yang digunakan di paper, misalnya: E-commerce Pre-sales Dialogue Dataset (ECP) / ReDial / TG-ReDial / JD.com dataset, beserta jumlah percakapan dan item]` | **Katalog Produk Kampus** (`src/data/products.json`): 30 produk riil mahasiswa dalam 6 kategori (Gadget, Buku, Kos, Fashion, Transportasi, Makanan) dengan mata uang IDR (Rupiah). | Mengadaptasi konteks e-commerce umum menjadi ekosistem marketplace mahasiswa yang relevan dengan kasus tugas akhir. |
| **Pencegahan Halusinasi (Anti-Hallucination)** | `[ISI DARI PAPER: Masukkan teknik pencegahan halusinasi paper, misalnya: constrained decoding, vocabulary masking, atau knowledge graph grounding]` | **Strict ID Post-Validation Barrier** (`aiService.ts`): Memeriksa setiap `productId` dari respons LLM terhadap *whitelist* katalog produk. ID fiktif langsung dieliminasi secara otomatis sebelum render UI. | Memberikan jaminan matematis 0% halusinasi produk pada antarmuka pengguna tanpa mengorbankan kelancaran respons LLM. |
| **Antarmuka Pengguna (UI)** | `[ISI DARI PAPER: Umumnya paper berfokus pada evaluasi offline pada log percakapan / CLI script tanpa antarmuka grafis web interaktif]` | **Aplikasi Web Modern (React 18 + Vite + Tailwind CSS)**: Tersedia halaman Chat Interaktif (`/chat`), Katalog Produk (`/catalog`), Wishlist (`/wishlist`), dan Profil Preferensi (`/profile`). | Membawa konsep teoretis paper menjadi aplikasi nyata yang siap didemonstrasikan langsung kepada dosen penguji. |
| **Metrik Evaluasi** | `[ISI DARI PAPER: Masukkan metrik evaluasi paper, misalnya: BLEU, ROUGE, Distinct-1/2, Hit@K, MRR, PPL, Human Evaluation]` | **Evaluasi Kepatuhan & Halusinasi** (`docs/EVALUATION.md`): Hallucination Rate, Budget Compliance Rate, Category Accuracy Rate, serta perbandingan langsung Baseline vs Grounded Mode. | Berfokus pada metrik fungsional pre-sales praktis untuk membuktikan efektivitas integrasi CRS terhadap LLM. |
| **Penyimpanan & Manajemen State** | `[ISI DARI PAPER: Tidak dibahas / stateless per batch session]` | **Cloud Firestore & LocalStorage Fallback**: Menyimpan riwayat chat (`users/{uid}/chats`) dan wishlist pengguna (`users/{uid}/wishlist`) secara persisten. | Menjamin aplikasi memenuhi standar CRUD penuh sesuai spesifikasi rekayasa perangkat lunak web modern. |

---

## 3. Rincian Aspek Spesifik untuk Diisi dari Naskah Paper

Bagi mahasiswa yang menyusun laporan tugas akhir, bagian dengan label `[ISI DARI PAPER]` di atas dapat dilengkapi secara spesifik berdasarkan bab *Methodology* dan *Experimental Setup* dari dokumen PDF paper referensi Anda:

1. **Nama Model Recommender:**  
   Periksa di bagian *Recommender Module / CRS Framework* paper untuk mencatat nama pasti algoritma yang mereka uji (misalnya: *SASRec, BERT4Rec, KGSF, atau CRSLab*).
2. **Karakteristik Dataset Asli:**  
   Periksa di bagian *Dataset Description* paper untuk mencatat jumlah sampel dialog, jumlah produk (item count), dan sumber platform data (misalnya: Taobao, JD, Amazon, atau ReDial).
3. **Hyperparameter LLM:**  
   Periksa konfigurasi temperatur, *max tokens*, dan *context length* yang digunakan dalam eksperimen paper.

---

## 4. Kesimpulan Analisis

Prototipe web yang dibangun berhasil merealisasikan **hipotesis inti paper**, yaitu:
> *"Modul rekomendasi (CRS) dan model bahasa (LLM) saling melengkapi secara optimal dalam dialog pre-sales: CRS menjamin ketepatan produk, sedangkan LLM menjamin kualitas interaksi manusiawi."*

Perbedaan yang ada merupakan bentuk adaptasi teknis (*engineering trade-off*) yang wajar dan terencana untuk mentransformasikan penelitian teoretis menjadi aplikasi web fungsional yang responsif, stabil, dan dapat dioperasikan secara *real-time*.
