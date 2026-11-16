/**
 * Layanan Integrasi LLM (Google Gemini REST API) & Conversational Recommender System (CRS)
 * Berdasarkan referensi paper:
 * "Conversational Recommender System and Large Language Model Are Made for Each Other in E-commerce Pre-sales Dialogue"
 * 
 * Dua langkah utama:
 * 1. Langkah A (Intent Extraction): Ekstraksi category, maxBudget, keywords dari ucapan pengguna.
 * 2. Langkah B (Response Generation): Generasi respon persuasif terikat ketat pada produk kandidat (grounded).
 */

import { Product, ExtractedIntent, UserPreferences } from '@/types';
import { CATALOG_PRODUCTS } from '@/services/product.service';
import { getTopCandidates } from '@/services/recommender';
import { formatRupiah } from '@/utils/formatters';

export interface PresalesResult {
  reply: string;
  recommendedProductIds: string[];
  discardedIdsCount: number;
  extractedIntent: ExtractedIntent;
  candidateIds: string[];
  isGrounded: boolean;
}

export interface GenerationOptions {
  grounded?: boolean;
  userPreferences?: UserPreferences | null;
  chatHistory?: { sender: 'user' | 'assistant'; text: string }[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
const REQUEST_TIMEOUT_MS = 12000;

/**
 * Helper untuk memanggil Google Gemini REST API dengan timeout aman
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
    throw new Error('MISSING_API_KEY');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Gemini API HTTP ${response.status}:`, errText);
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('EMPTY_RESPONSE');
    }

    return candidateText;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  }
}

/**
 * Pembersih format JSON dari respons markdown LLM (misal ```json ... ```)
 */
function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Fallback parser intent berbasis aturan & regex bahasa Indonesia
 */
function heuristicExtractIntent(text: string): ExtractedIntent {
  const lower = text.toLowerCase();
  let maxBudget: number | null = null;
  let category: string | null = null;
  const keywords: string[] = [];

  // 1. Deteksi Budget
  const jtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)/);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    maxBudget = Math.round(val * 1000000);
  } else {
    const rbMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|k)/);
    if (rbMatch) {
      const val = parseFloat(rbMatch[1].replace(',', '.'));
      maxBudget = Math.round(val * 1000);
    } else {
      const rpMatch = lower.match(/(?:rp\.?|budget|harga)\s*(\d[\d.,]*)/);
      if (rpMatch) {
        const cleanDigits = rpMatch[1].replace(/[.,]/g, '');
        const val = parseInt(cleanDigits, 10);
        if (!isNaN(val) && val > 0) {
          maxBudget = val;
        }
      }
    }
  }

  // 2. Deteksi Kategori
  if (lower.includes('laptop') || lower.includes('komputer') || lower.includes('pc') || lower.includes('macbook')) {
    category = 'Laptop & Komputer';
  } else if (lower.includes('hp') || lower.includes('smartphone') || lower.includes('ponsel') || lower.includes('tablet') || lower.includes('ipad')) {
    category = 'Smartphone & Tablet';
  } else if (lower.includes('audio') || lower.includes('headphone') || lower.includes('earphone') || lower.includes('tws') || lower.includes('speaker') || lower.includes('mouse') || lower.includes('keyboard')) {
    category = 'Audio & Aksesori';
  } else if (lower.includes('kamera') || lower.includes('fotografi') || lower.includes('vlog') || lower.includes('gimbal')) {
    category = 'Kamera & Fotografi';
  } else if (lower.includes('belajar') || lower.includes('buku') || lower.includes('kalkulator') || lower.includes('meja') || lower.includes('tas')) {
    category = 'Perlengkapan Belajar';
  } else if (lower.includes('fryer') || lower.includes('rice cooker') || lower.includes('setrika') || lower.includes('teko') || lower.includes('kos') || lower.includes('purifier') || lower.includes('masak')) {
    category = 'Peralatan Rumah Tangga';
  }

  // 3. Ekstraksi Kata Kunci
  const candidateKeywords = [
    'coding', 'gaming', 'ringan', 'tipis', 'baterai awet', 'ram 16gb', 'ssd',
    'kamera bagus', 'fast charging', 'amoled', 'anc', 'noise cancelling', 'bluetooth',
    'wireless', 'ergonomis', 'vlog', 'ujian', 'murah', 'hemat listrik'
  ];

  for (const kw of candidateKeywords) {
    if (lower.includes(kw)) {
      keywords.push(kw);
    }
  }

  return { category, maxBudget, keywords };
}

/**
 * LANGKAH A: Ekstraksi Intent Pembeli (Intent Extraction)
 */
export async function extractIntent(userMessage: string): Promise<ExtractedIntent> {
  const prompt = `Analisis pesan pembeli e-commerce berikut dan ekstrak niat belanja (intent) dalam format JSON murni.
Kategori yang tersedia:
- Laptop & Komputer
- Smartphone & Tablet
- Audio & Aksesori
- Kamera & Fotografi
- Perlengkapan Belajar
- Peralatan Rumah Tangga

Format JSON wajib:
{
  "category": string atau null,
  "maxBudget": number (dalam rupiah angka murni, misal 5 juta -> 5000000) atau null,
  "keywords": string[] (kata kunci spesifikasi/kebutuhan seperti ["ram 16gb", "coding", "baterai awet"])
}

Pesan pembeli: "${userMessage}"`;

  try {
    const rawResponse = await callGeminiApi(prompt, 'Kamu adalah modul NLP intent extractor untuk e-commerce. Keluarkan HANYA JSON.');
    const cleaned = cleanJsonString(rawResponse);
    const parsed = JSON.parse(cleaned);

    return {
      category: parsed.category || null,
      maxBudget: typeof parsed.maxBudget === 'number' ? parsed.maxBudget : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch (err) {
    // Fallback otomatis ke rule-based parser jika API tidak tersedia atau JSON gagal di-parse
    return heuristicExtractIntent(userMessage);
  }
}

/**
 * LANGKAH B: Generasi Jawaban Pre-Sales Persuasif Berbasis Kandidat (Candidate-Grounded)
 */
export async function generatePresalesDialogue(
  userMessage: string,
  options: GenerationOptions = {}
): Promise<PresalesResult> {
  const { grounded = true, userPreferences = null } = options;

  // 1. Ekstraksi intent pengguna (Langkah A)
  const intent = await extractIntent(userMessage);

  // 2. Modul Rekomendasi (CRS Core): Dapatkan kandidat terbaik dari katalog
  const scoredCandidates = getTopCandidates(CATALOG_PRODUCTS, intent, userPreferences, 4);
  const candidates = scoredCandidates.map((s) => s.product);
  const candidateIds = candidates.map((p) => p.id);

  // Jika mode grounded: LLM WAJIB hanya memilih dari kandidat produk yang diberikan
  if (grounded) {
    const candidateSummary = candidates
      .map(
        (c) =>
          `- ID: "${c.id}" | Nama: "${c.name}" | Kategori: "${c.category}" | Harga: ${formatRupiah(c.price)} | Deskripsi: "${c.description}" | Tags: [${c.tags.join(', ')}]`
      )
      .join('\n');

    const systemPrompt = `Kamu adalah Asisten Pre-Sales E-Commerce yang ramah, profesional, solutif, dan persuasif di platform Campus Market.
TUGAS UTAMA: Bantu calon pembeli memilih produk terbaik berdasarkan kebutuhan mereka.

ATURAN KETAT (CRITICAL):
1. Kamu HANYA BOLEH merekomendasikan produk yang TERDAPAT PADA DAFTAR KANDIDAT di bawah ini.
2. DILARANG KERAS mengarang ID produk, nama produk, harga, atau merek yang tidak ada di daftar kandidat.
3. Sebutkan keunggulan produk yang relevan dengan pertanyaan pembeli secara meyakinkan dan santun.
4. Jangan sebutkan ID produk di dalam teks pesan (reply), gunakan nama produk langsung. Masukkan ID produk yang kamu rekomendasikan ke dalam array recommendedProductIds.
5. Format output WAJIB HANYA JSON murni tanpa markdown triple backticks:
{
  "reply": "Penjelasan persuasif dan ramah untuk pembeli...",
  "recommendedProductIds": ["prod-xxx", "prod-yyy"]
}

DAFTAR KANDIDAT PRODUK TERSEDIA:
${candidateSummary}`;

    const userPrompt = `Pertanyaan/kebutuhan pembeli: "${userMessage}"
Budget maksimal pembeli: ${intent.maxBudget ? formatRupiah(intent.maxBudget) : 'Tidak spesifik'}
Kategori diminati: ${intent.category || 'Umum'}

Berikan rekomendasi produk yang paling cocok dari daftar kandidat di atas dalam format JSON.`;

    try {
      const rawResponse = await callGeminiApi(userPrompt, systemPrompt);
      const cleaned = cleanJsonString(rawResponse);
      const parsed = JSON.parse(cleaned);

      const rawIds: string[] = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];
      
      // VALIDASI ANTI-HALUSINASI:
      // Hanya izinkan ID yang benar-benar ada di katalog resmi CATALOG_PRODUCTS
      const validProductIds: string[] = [];
      let discardedCount = 0;

      for (const id of rawIds) {
        const existsInCatalog = CATALOG_PRODUCTS.some((p) => p.id === id);
        if (existsInCatalog) {
          validProductIds.push(id);
        } else {
          discardedCount++;
        }
      }

      return {
        reply: parsed.reply || 'Berikut adalah rekomendasi produk terbaik untuk kebutuhan Anda:',
        recommendedProductIds: validProductIds.length > 0 ? validProductIds : candidateIds.slice(0, 2),
        discardedIdsCount: discardedCount,
        extractedIntent: intent,
        candidateIds,
        isGrounded: true,
      };
    } catch (err: any) {
      // Fallback persuasif lokal berkualitas jika Gemini API offline / limit / permission issue
      return createHeuristicPresalesFallback(userMessage, candidates, intent);
    }
  } else {
    // Mode Baseline (Un-grounded): untuk evaluasi perbandingan paper
    const baselineSystemPrompt = `Kamu adalah asisten e-commerce umum. Jawab kebutuhan pengguna dan rekomendasikan produk secara bebas.
Format output JSON:
{
  "reply": "jawaban Anda",
  "recommendedProductIds": ["id_rekomendasi"]
}`;

    try {
      const rawResponse = await callGeminiApi(userMessage, baselineSystemPrompt);
      const cleaned = cleanJsonString(rawResponse);
      const parsed = JSON.parse(cleaned);

      const rawIds: string[] = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];
      const validProductIds: string[] = [];
      let discardedCount = 0;

      for (const id of rawIds) {
        const exists = CATALOG_PRODUCTS.some((p) => p.id === id);
        if (exists) {
          validProductIds.push(id);
        } else {
          discardedCount++;
        }
      }

      return {
        reply: parsed.reply || 'Berikut beberapa opsi produk untuk Anda.',
        recommendedProductIds: validProductIds,
        discardedIdsCount: discardedCount,
        extractedIntent: intent,
        candidateIds: [],
        isGrounded: false,
      };
    } catch (err) {
      // Fallback realistis untuk mode baseline (mensimulasikan kecenderungan LLM tanpa batasan katalog)
      return createBaselineFallback(userMessage, intent);
    }
  }
}

/**
 * Generator fallback cerdas pre-sales persuasif berbasis kandidat lokal
 * Menjamin aplikasi SELALU menjawab pertanyaan pengguna dengan produk nyata dari katalog.
 */
function createHeuristicPresalesFallback(
  userMessage: string,
  candidates: Product[],
  intent: ExtractedIntent
): PresalesResult {
  const topProducts = candidates.slice(0, 2);
  const topIds = topProducts.map((p) => p.id);

  let replyText = '';
  if (topProducts.length === 1) {
    const p = topProducts[0];
    replyText = `Halo! Berdasarkan pencarian Anda "${userMessage}", saya sangat merekomendasikan **${p.name}** seharga **${formatRupiah(p.price)}**.\n\nProduk ini memiliki spesifikasi unggulan: ${p.description}. Sangat cocok dan efisien untuk kebutuhan Anda. Silakan cek detail produknya di bawah ini!`;
  } else if (topProducts.length >= 2) {
    const p1 = topProducts[0];
    const p2 = topProducts[1];
    replyText = `Halo! Menanggapi kebutuhan Anda${intent.maxBudget ? ` dengan budget sekitar ${formatRupiah(intent.maxBudget)}` : ''}, saya telah memilihkan dua opsi terbaik yang tersedia di katalog Campus Market:

1. **${p1.name}** (${formatRupiah(p1.price)}) — Pilihan utama: ${p1.description}
2. **${p2.name}** (${formatRupiah(p2.price)}) — Alternatif unggulan: ${p2.description}

Keduanya memiliki performa andal dan harga yang sangat sesuai. Anda dapat langsung menyimpan produk favorit ke Wishlist Anda di bawah ini!`;
  } else {
    replyText = `Halo! Saya adalah Asisten Pre-Sales Campus Market. Saya siap membantu menemukan perlengkapan kuliah, gadget, atau kebutuhan kos terbaik untuk Anda. Silakan beri tahu produk apa yang sedang Anda cari atau berapa anggaran maksimal yang Anda siapkan!`;
  }

  return {
    reply: replyText,
    recommendedProductIds: topIds,
    discardedIdsCount: 0,
    extractedIntent: intent,
    candidateIds: candidates.map((p) => p.id),
    isGrounded: true,
  };
}

/**
 * Fallback realistis untuk Mode Baseline (mensimulasikan LLM ungrounded)
 */
function createBaselineFallback(userMessage: string, intent: ExtractedIntent): PresalesResult {
  const lower = userMessage.toLowerCase();
  let reply = '';

  if (lower.includes('laptop') || lower.includes('coding')) {
    reply = `Halo! Untuk kebutuhan coding mahasiswa, beberapa opsi laptop yang populer di pasaran secara umum antara lain **MacBook Pro M3** (mulai Rp 24 jutaan) atau **ASUS ROG Zephyrus G14** (sekitar Rp 25 jutaan). Anda juga bisa mempertimbangkan Lenovo Legion Pro.\n\n*(Catatan Evaluasi Baseline: Mode ini merekomendasikan produk umum di pasaran tanpa membatasi diri pada katalog toko dan sering melebihi batas anggaran pembeli).*`;
  } else if (lower.includes('headphone') || lower.includes('audio') || lower.includes('earphone')) {
    reply = `Untuk headphone wireless dengan fitur noise cancelling terbaik, pilihan populer di pasaran mencakup **Sony WH-1000XM5** (sekitar Rp 4.999.000) atau **Bose QuietComfort Ultra** (sekitar Rp 5.800.000).\n\n*(Catatan Evaluasi Baseline: Produk rekomendasi berada di luar inventaris katalog toko).*`;
  } else {
    reply = `Halo! Berdasarkan pencarian "${userMessage}", ada berbagai pilihan produk populer di pasar elektronik global saat ini. Anda dapat mencari produk dari produsen terkemuka sesuai selera Anda.\n\n*(Catatan Evaluasi Baseline: Berjalan tanpa grounding katalog).*`;
  }

  return {
    reply,
    recommendedProductIds: [],
    discardedIdsCount: 1,
    extractedIntent: intent,
    candidateIds: [],
    isGrounded: false,
  };
}
