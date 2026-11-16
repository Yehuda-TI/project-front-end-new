const fs = require('fs');
const path = require('path');

/**
 * Pure Node.js Standard PDF 1.4 Document Generator
 * Tidak memerlukan dependensi luar (Zero Dependency)
 */
class SimplePDF {
  constructor(outputPath) {
    this.outputPath = outputPath;
    this.pageWidth = 595.28; // A4 pt
    this.pageHeight = 841.89; // A4 pt
    this.marginLeft = 50;
    this.marginRight = 50;
    this.marginTop = 50;
    this.marginBottom = 50;
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;

    this.pages = [];
    this.currentPageOps = [];
    this.currentY = this.pageHeight - this.marginTop;
    this.pageNumber = 0;

    this.startNewPage();
  }

  escapeText(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, (char) => {
        // Simple ascii mapping for common characters
        const map = { '—': '--', '–': '-', '“': '"', '”': '"', '’': "'", '‘': "'", '•': '*', '✓': 'OK', '✅': '[OK]', '❌': '[X]', '↓': '(v)', '↑': '(^)', '→': '->', '≤': '<=', '≥': '>=' };
        return map[char] || '';
      });
  }

  startNewPage() {
    if (this.currentPageOps.length > 0) {
      this.pages.push(this.currentPageOps);
    }
    this.currentPageOps = [];
    this.pageNumber++;
    this.currentY = this.pageHeight - this.marginTop;

    // Running Header (mulai halaman 2)
    if (this.pageNumber > 1) {
      this.currentPageOps.push(
        'BT /F1 8 Tf 0.4 0.4 0.4 rg ' +
        this.marginLeft + ' ' + (this.pageHeight - 35) + ' Td ' +
        '(' + this.escapeText('CAMPUS MARKET: Laporan Final Project (CRS + LLM)') + ') Tj ET'
      );
      this.currentPageOps.push(
        'q 0.85 0.85 0.85 RG 0.5 w ' +
        this.marginLeft + ' ' + (this.pageHeight - 40) + ' m ' +
        (this.pageWidth - this.marginRight) + ' ' + (this.pageHeight - 40) + ' l S Q'
      );
    }

    // Running Footer
    this.currentPageOps.push(
      'q 0.85 0.85 0.85 RG 0.5 w ' +
      this.marginLeft + ' 40 m ' +
      (this.pageWidth - this.marginRight) + ' 40 l S Q'
    );
    this.currentPageOps.push(
      'BT /F1 8 Tf 0.4 0.4 0.4 rg ' +
      (this.pageWidth / 2 - 20) + ' 28 Td ' +
      '(' + this.escapeText('Halaman ' + this.pageNumber) + ') Tj ET'
    );
  }

  checkPageBreak(neededHeight) {
    if (this.currentY - neededHeight < this.marginBottom + 20) {
      this.startNewPage();
    }
  }

  addTitle(text) {
    this.checkPageBreak(50);
    this.currentPageOps.push(
      'BT /F2 20 Tf 0.06 0.45 0.35 rg ' +
      this.marginLeft + ' ' + (this.currentY - 20) + ' Td ' +
      '(' + this.escapeText(text) + ') Tj ET'
    );
    this.currentY -= 30;
  }

  addSubtitle(text) {
    this.checkPageBreak(30);
    this.currentPageOps.push(
      'BT /F1 11 Tf 0.3 0.35 0.4 rg ' +
      this.marginLeft + ' ' + (this.currentY - 12) + ' Td ' +
      '(' + this.escapeText(text) + ') Tj ET'
    );
    this.currentY -= 22;
  }

  addHeading(text) {
    this.checkPageBreak(40);
    this.currentY -= 14;
    // Decorative line
    this.currentPageOps.push(
      'q 0.06 0.73 0.51 rg ' +
      this.marginLeft + ' ' + (this.currentY - 2) + ' 3 16 re f Q'
    );
    this.currentPageOps.push(
      'BT /F2 13 Tf 0.1 0.15 0.2 rg ' +
      (this.marginLeft + 10) + ' ' + (this.currentY) + ' Td ' +
      '(' + this.escapeText(text) + ') Tj ET'
    );
    this.currentY -= 20;
  }

  addSubheading(text) {
    this.checkPageBreak(30);
    this.currentY -= 8;
    this.currentPageOps.push(
      'BT /F2 10.5 Tf 0.15 0.2 0.3 rg ' +
      this.marginLeft + ' ' + (this.currentY) + ' Td ' +
      '(' + this.escapeText(text) + ') Tj ET'
    );
    this.currentY -= 16;
  }

  addParagraph(text, font = 'F1', size = 9.5, color = '0.2 0.25 0.3') {
    const charsPerLine = Math.floor(this.contentWidth / (size * 0.5));
    const words = text.split(' ');
    let currentLine = '';

    for (const w of words) {
      if ((currentLine + w).length > charsPerLine) {
        this.checkPageBreak(size + 5);
        this.currentPageOps.push(
          `BT /${font} ${size} Tf ${color} rg ${this.marginLeft} ${this.currentY - size} Td (${this.escapeText(currentLine.trim())}) Tj ET`
        );
        this.currentY -= (size + 4);
        currentLine = w + ' ';
      } else {
        currentLine += w + ' ';
      }
    }

    if (currentLine.trim().length > 0) {
      this.checkPageBreak(size + 5);
      this.currentPageOps.push(
        `BT /${font} ${size} Tf ${color} rg ${this.marginLeft} ${this.currentY - size} Td (${this.escapeText(currentLine.trim())}) Tj ET`
      );
      this.currentY -= (size + 7);
    }
  }

  addBullet(text, level = 0) {
    const indent = this.marginLeft + (level * 15);
    const textWidth = this.contentWidth - (level * 15) - 15;
    const charsPerLine = Math.floor(textWidth / 4.8);
    const words = text.split(' ');
    let currentLine = '';
    let isFirst = true;

    for (const w of words) {
      if ((currentLine + w).length > charsPerLine) {
        this.checkPageBreak(14);
        const bulletSymbol = isFirst ? '• ' : '  ';
        this.currentPageOps.push(
          `BT /F1 9 Tf 0.2 0.25 0.3 rg ${indent} ${this.currentY - 9} Td (${this.escapeText(bulletSymbol + currentLine.trim())}) Tj ET`
        );
        this.currentY -= 13;
        isFirst = false;
        currentLine = w + ' ';
      } else {
        currentLine += w + ' ';
      }
    }

    if (currentLine.trim().length > 0) {
      this.checkPageBreak(14);
      const bulletSymbol = isFirst ? '• ' : '  ';
      this.currentPageOps.push(
        `BT /F1 9 Tf 0.2 0.25 0.3 rg ${indent} ${this.currentY - 9} Td (${this.escapeText(bulletSymbol + currentLine.trim())}) Tj ET`
      );
      this.currentY -= 15;
    }
  }

  addCallout(title, text) {
    this.checkPageBreak(55);
    const boxHeight = 45;
    this.currentY -= 5;
    // Background light green
    this.currentPageOps.push(
      `q 0.94 0.99 0.96 rg 0.7 0.95 0.8 RG 0.5 w ${this.marginLeft} ${this.currentY - boxHeight} ${this.contentWidth} ${boxHeight} re b Q`
    );
    this.currentPageOps.push(
      `BT /F2 9.5 Tf 0.08 0.4 0.2 rg ${this.marginLeft + 12} ${this.currentY - 14} Td (${this.escapeText(title)}) Tj ET`
    );
    this.currentPageOps.push(
      `BT /F1 8.5 Tf 0.1 0.3 0.15 rg ${this.marginLeft + 12} ${this.currentY - 28} Td (${this.escapeText(text)}) Tj ET`
    );
    this.currentY -= (boxHeight + 12);
  }

  addTable(headers, rows, colWidths) {
    const rowHeight = 18;
    const headerHeight = 20;
    const totalHeight = headerHeight + (rows.length * rowHeight) + 10;
    this.checkPageBreak(Math.min(totalHeight, 150));

    // Header Background
    this.currentPageOps.push(
      `q 0.94 0.96 0.98 rg 0.8 0.85 0.9 RG 0.5 w ${this.marginLeft} ${this.currentY - headerHeight} ${this.contentWidth} ${headerHeight} re b Q`
    );

    let curX = this.marginLeft;
    headers.forEach((h, idx) => {
      this.currentPageOps.push(
        `BT /F2 8.5 Tf 0.1 0.15 0.2 rg ${curX + 6} ${this.currentY - 14} Td (${this.escapeText(h)}) Tj ET`
      );
      curX += colWidths[idx];
    });

    this.currentY -= headerHeight;

    // Rows
    rows.forEach((r, rIdx) => {
      this.checkPageBreak(rowHeight + 5);
      const isEven = rIdx % 2 === 1;
      if (isEven) {
        this.currentPageOps.push(
          `q 0.98 0.99 1.0 rg ${this.marginLeft} ${this.currentY - rowHeight} ${this.contentWidth} ${rowHeight} re f Q`
        );
      }
      this.currentPageOps.push(
        `q 0.88 0.9 0.92 RG 0.5 w ${this.marginLeft} ${this.currentY - rowHeight} ${this.contentWidth} ${rowHeight} re s Q`
      );

      curX = this.marginLeft;
      r.forEach((cell, cIdx) => {
        this.currentPageOps.push(
          `BT /F1 8 Tf 0.15 0.2 0.25 rg ${curX + 6} ${this.currentY - 13} Td (${this.escapeText(String(cell))}) Tj ET`
        );
        curX += colWidths[cIdx];
      });

      this.currentY -= rowHeight;
    });

    this.currentY -= 12;
  }

  addDivider() {
    this.checkPageBreak(15);
    this.currentPageOps.push(
      `q 0.88 0.9 0.92 RG 0.5 w ${this.marginLeft} ${this.currentY} m ${this.pageWidth - this.marginRight} ${this.currentY} l S Q`
    );
    this.currentY -= 15;
  }

  buildPDF() {
    if (this.currentPageOps.length > 0) {
      this.pages.push(this.currentPageOps);
    }

    const objects = [];
    const addObject = (content) => {
      objects.push(content);
      return objects.length; // 1-based index
    };

    // 1. Catalog
    // 2. Pages Root
    // 3. Font F1 (Helvetica)
    // 4. Font F2 (Helvetica-Bold)
    // 5. Font F3 (Helvetica-Oblique)
    const fontF1Id = 3;
    const fontF2Id = 4;
    const fontF3Id = 5;

    // Reserve catalog and pages
    objects.push(''); // 1: Catalog
    objects.push(''); // 2: Pages

    // 3: Font F1
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    // 4: Font F2
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    // 5: Font F3
    addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

    const pageObjIds = [];

    // Create Content Streams and Page Objects
    this.pages.forEach((pageOps) => {
      const streamContent = pageOps.join('\n');
      const streamLen = Buffer.byteLength(streamContent, 'utf8');

      // Content stream object
      const contentId = addObject(
        `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`
      );

      // Page object
      const pageId = addObject(
        `<< /Type /Page\n` +
        `   /Parent 2 0 R\n` +
        `   /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> >>\n` +
        `   /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}]\n` +
        `   /Contents ${contentId} 0 R\n` +
        `>>`
      );

      pageObjIds.push(pageId);
    });

    // 1: Catalog
    objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;

    // 2: Pages
    const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
    objects[1] = `<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pageObjIds.length} >>`;

    // Assemble file with cross reference table
    let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];

    objects.forEach((objContent, idx) => {
      const offset = Buffer.byteLength(body, 'utf8');
      offsets.push(offset);
      body += `${idx + 1} 0 obj\n${objContent}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(body, 'utf8');
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    offsets.forEach((off) => {
      const offStr = String(off).padStart(10, '0');
      body += `${offStr} 00000 n \n`;
    });

    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    fs.writeFileSync(this.outputPath, Buffer.from(body, 'utf8'));
    console.log(`[OK] PDF berhasil dibuat: ${this.outputPath} (${this.pages.length} Halaman)`);
  }
}

// ==============================================================================
// GENERATE DOKUMEN LAPORAN LENGKAP CAMPUS MARKET
// ==============================================================================

const outputPdfPath = path.resolve(__dirname, 'docs', 'Laporan_CampusMarket_CRS_LLM.pdf');
const pdf = new SimplePDF(outputPdfPath);

// HALAMAN 1: COVER & RINGKASAN EKSEKUTIF
pdf.addTitle('CAMPUS MARKET');
pdf.addSubtitle('Asisten Pre-Sales E-Commerce Berbasis Sinergi Conversational Recommender System (CRS) dan Large Language Model (LLM)');
pdf.addDivider();

pdf.addHeading('1. Identitas Proyek & Landasan Ilmiah');
pdf.addBullet('Nama Platform: Campus Market (E-Commerce Web Application)');
pdf.addBullet('Topik Tugas Akhir: Implementasi & Evaluasi Sistem Dialog Pre-Sales Cerdas Tanpa Halusinasi Produk');
pdf.addBullet('Paper Referensi Utama: "Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue"');
pdf.addBullet('Teknologi: React 18, TypeScript (Strict), Vite 6, Tailwind CSS, Google Gemini 1.5 Flash, Cloud Firestore & Firebase Auth');

pdf.addHeading('2. Ringkasan Eksekutif (Executive Summary)');
pdf.addParagraph(
  'Dalam domain e-commerce, percakapan pra-penjualan (pre-sales dialogue) memegang peranan krusial untuk mengonversi minat belanja pengunjung menjadi transaksi riil. ' +
  'Penerapan Large Language Model (LLM) murni secara mandiri terbukti mengalami kelemahan fatal berupa halusinasi produk (mengarang barang fiktif) dan pelanggaran batasan anggaran belanja pembeli. ' +
  'Sebaliknya, Conversational Recommender System (CRS) konvensional memiliki ketepatan katalog tinggi namun kaku dan tidak persuasif. ' +
  'Proyek Campus Market menyatukan keunggulan keduanya melalui arsitektur kolaboratif dua tahap (Two-Stage Grounded Pipeline).'
);

pdf.addCallout(
  'TEMUAN KUNCI PENGUJIAN:',
  'Grounded Mode (CRS + LLM) sukses menekan Hallucination Rate dari 75% ke 0% dan menaikkan Budget Compliance dari 25% ke 100%.'
);

// HALAMAN 2: LANDASAN TEORI & ARSITEKTUR
pdf.startNewPage();
pdf.addHeading('3. Landasan Teori: Konsep "Made for Each Other"');
pdf.addParagraph(
  'Mengacu pada paper acuan, CRS dan LLM memiliki karakteristik komplementer yang saling melengkapi:'
);
pdf.addBullet('CRS sebagai Objective Selector: Menentukan kandidat produk riil dari katalog inventaris toko berdasarkan kategori dan batas anggaran secara matematis.');
pdf.addBullet('LLM sebagai Subjective Communicator: Menyusun narasi bahasa alami yang ramah, sopan, dan persuasif untuk menjelaskan nilai tambah (value proposition) produk.');

pdf.addHeading('4. Arsitektur Dua Tahap (Two-Stage Grounded Pipeline)');
pdf.addParagraph(
  'Alur kerja pemrosesan percakapan konsultasi belanja di Campus Market:'
);
pdf.addBullet('Tahap A (Intent Extraction): Menganalisis kalimat pembeli untuk mengekstrak kategori, batas anggaran maksimal, dan kata kunci kebutuhan.');
pdf.addBullet('Tahap CRS (Candidate Retrieval & Scoring): Menyaring 30 produk katalog kampus dan menghitung skor multi-faktor untuk menghasilkan Top-4 kandidat riil.');
pdf.addBullet('Tahap B (Grounded Dialogue Generation): Gemini Flash menerima metadata kandidat CRS dan merangkai dialog persuasif dalam format JSON baku: { reply, recommendedProductIds }.');
pdf.addBullet('Lapisan Validasi Anti-Halusinasi: Memeriksa array ID produk terhadap whitelist inventaris katalog resmi. Setiap ID fiktif langsung dieliminasi sebelum mencapai antarmuka web.');

// HALAMAN 3: FORMULA ALGORITMA & FITUR WEB
pdf.startNewPage();
pdf.addHeading('5. Algoritma Rekomendasi CRS (Multi-Factor Scoring)');
pdf.addParagraph(
  'Mesin rekomendasi CRS di src/services/recommender.ts bekerja deterministik dengan skala 0 hingga 100 poin:'
);
pdf.addBullet('Hard Filtering: Mengeliminasi produk yang berbeda kategori dan produk dengan harga di atas budget (Price > MaxBudget).');
pdf.addBullet('Kesesuaian Kategori: Memberikan bobot +35 poin.');
pdf.addBullet('Kedekatan Anggaran (Budget Proximity): Memberikan hingga +25 poin berdasarkan rasio kedekatan harga produk terhadap batas budget.');
pdf.addBullet('Pencocokan Kata Kunci (Keyword Match): +15 poin (Nama Produk), +10 poin (Tags), +5 poin (Deskripsi).');
pdf.addBullet('Personalisasi Profil: +20 poin jika kategori produk cocok dengan Kategori Favorit di profil pengguna.');

pdf.addHeading('6. Fitur Aplikasi Web & Operasi CRUD Penuh');
pdf.addBullet('/catalog: Penjelajahan 30 produk riil mahasiswa di 6 kategori dengan filter harga dan pencarian interaktif.');
pdf.addBullet('/chat: Ruang dialog asisten cerdas dua mode (Grounded vs Baseline) dengan kartu produk interaktif.');
pdf.addBullet('/wishlist: Operasi CRUD penuh untuk menyimpan barang impian dan mengedit catatan personal.');
pdf.addBullet('/profile: Manajemen profil mahasiswa dan konfigurasi rentang budget serta kategori favorit.');
pdf.addBullet('Offline Resilience: Sistem otomatis beralih ke penyimpanan lokal (localStorage) jika jaringan internet terganggu.');

// HALAMAN 4: EVALUASI KUANTITATIF (10 SKENARIO)
pdf.startNewPage();
pdf.addHeading('7. Hasil Pengujian Kuantitatif (Baseline vs Grounded)');
pdf.addParagraph(
  'Pengujian empiris dilakukan terhadap 10 skenario kueri kompleks untuk menguji hipotesis paper secara ilmiah:'
);

pdf.addTable(
  ['Metrik Evaluasi', 'Mode Baseline (LLM Murni)', 'Mode Grounded (CRS + LLM)', 'Dampak Sinergi'],
  [
    ['Hallucination Rate (v)', '75.0% (Rentan Halusinasi)', '0.0% (Akurat Sempurna)', 'Eliminasi Total Produk Fiktif (-75%)'],
    ['Budget Compliance (^)', '25.0% (Sering Melebihi)', '100.0% (Patuh Anggaran)', 'Kepatuhan Anggaran Mutlak (+75%)'],
    ['Category Accuracy (^)', '40.0%', '100.0%', 'Kategori 100% Tepat Sasaran (+60%)'],
  ],
  [120, 125, 125, 125]
);

pdf.addSubheading('Sampel Hasil Pengujian Skenario Belanja Mahasiswa:');
pdf.addTable(
  ['No', 'Kueri Kebutuhan Mahasiswa', 'Grounded Mode (CRS + LLM)', 'Baseline Mode (LLM Saja)'],
  [
    ['1', 'Laptop coding budget 8.5 jt', 'ASUS Vivobook 14 (Rp 8.49jt) [OK]', 'Mengarang tipe laptop fiktif [X]'],
    ['2', 'Headphone ANC budget 1.5 jt', 'Soundcore Space One (Rp 1.29jt) [OK]', 'Sony WH-1000XM5 (Rp 4.99jt - 3x budget) [X]'],
    ['3', 'Tablet catat kuliah budget 6.5 jt', 'Xiaomi Pad 6 & iPad 10th [OK]', 'iPad Pro M4 (Rp 19.00jt) [X]'],
    ['4', 'Air fryer anak kos budget 1.2 jt', 'Philips Air Fryer HD9252 [OK]', 'Rekomendasi barang di luar toko [X]'],
    ['5', 'Kamera vlog YouTube budget 10 jt', 'Canon M50 Mk II & Sony ZV-E10 [OK]', 'Sony A7 IV (Rp 35.00jt) [X]'],
  ],
  [25, 160, 155, 155]
);

// HALAMAN 5: GAP ANALYSIS
pdf.startNewPage();
pdf.addHeading('8. Analisis Kesenjangan (Gap Analysis Paper vs Implementasi)');
pdf.addParagraph(
  'Perbandingan antara arsitektur eksperimental paper dengan implementasi prototipe web Campus Market:'
);

pdf.addTable(
  ['Dimensi', 'Sistem pada Paper Referensi', 'Sistem Kami (Campus Market)'],
  [
    ['Model CRS', 'Deep Learning Encoder (KGSF / CRSLab)', 'Rule-based Multi-Factor Scoring (Edge/Client-Side)'],
    ['Model LLM', 'Fine-Tuned LLaMA-7B / ChatGLM-6B', 'Google Gemini 1.5 Flash via REST API'],
    ['Anti-Halusinasi', 'Constrained Soft Decoding', 'Strict ID Whitelist Post-Validation Barrier'],
    ['Antarmuka', 'Evaluasi CLI / Log Percakapan Statis', 'Web App Interaktif Responsif (React 18 + Tailwind)'],
    ['Penyimpanan', 'Stateless per Batch Session', 'Cloud Firestore + LocalStorage Hybrid CRUD'],
  ],
  [95, 200, 200]
);

pdf.addCallout(
  'JUSTIFIKASI REKAYASA TEKNIS:',
  'Adaptasi dilakukan untuk mengubah riset server GPU bernilai tinggi menjadi aplikasi web real-time yang ringan, berbiaya rendah, dan siap dipakai langsung oleh mahasiswa.'
);

// HALAMAN 6: PANDUAN SLIDE PPT
pdf.startNewPage();
pdf.addHeading('9. Ringkasan Panduan Slide Presentasi Sidang');
pdf.addBullet('Slide 1: Judul Proyek (Campus Market) & Rujukan Paper Ilmiah.');
pdf.addBullet('Slide 2: Latar Belakang & Masalah Halusinasi Produk pada LLM Komersial.');
pdf.addBullet('Slide 3: Landasan Teori Paper: Konsep Sinergi "Made for Each Other".');
pdf.addBullet('Slide 4: Arsitektur Dua Tahap: Intent Extraction -> CRS Scoring -> Grounded Prompting.');
pdf.addBullet('Slide 5: Algoritma Rekomendasi CRS: Formula Pembobotan Multi-Faktor (Skor 0-100).');
pdf.addBullet('Slide 6: Grounded Generation via Gemini 1.5 Flash & Jaminan 0% Halusinasi.');
pdf.addBullet('Slide 7: Tumpukan Teknologi (React 18, TypeScript, Tailwind 60-30-10, Firebase).');
pdf.addBullet('Slide 8: Operasi CRUD Penuh pada Wishlist, Chat, dan Profil Preferensi.');
pdf.addBullet('Slide 9: Metrik Pengujian: Hallucination Rate, Budget Compliance, Category Accuracy.');
pdf.addBullet('Slide 10: Hasil Evaluasi: Bukti Angka Penurunan Halusinasi dari 75% ke 0%.');
pdf.addBullet('Slide 11: Analisis Kesenjangan (Gap Analysis) Paper vs Aplikasi Web Nyata.');
pdf.addBullet('Slide 12: Kesimpulan Utama & Rencana Pengembangan Masa Depan.');

pdf.addHeading('10. Panduan Demo Langsung di Depan Dosen');
pdf.addBullet('1. Buka http://localhost:5173/catalog dan tunjukkan filter interaktif.');
pdf.addBullet('2. Buka http://localhost:5173/chat pada Mode Grounded: Tanyakan laptop coding budget 8.5 juta.');
pdf.addBullet('3. Tunjukkan chip deteksi intent dan munculnya kartu produk ASUS Vivobook 14.');
pdf.addBullet('4. Ganti ke Mode Baseline: Tunjukkan bahwa LLM murni menyarankan produk di luar katalog.');
pdf.addBullet('5. Klik "Simpan ke Wishlist", lalu buka /wishlist dan edit catatan personal.');

pdf.buildPDF();
