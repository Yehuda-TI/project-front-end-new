import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatMessage, Product } from '@/types';
import { generatePresalesDialogue } from '@/services/aiService';
import { getChatHistory, saveChatMessage, clearChatHistory } from '@/services/chat.service';
import { CATALOG_PRODUCTS } from '@/services/product.service';
import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  Loader2, 
  User as UserIcon, 
  HelpCircle, 
  AlertTriangle, 
  Tag,
  DollarSign
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

const QUICK_PROMPTS = [
  'Cari laptop untuk coding mahasiswa dengan budget 8 jutaan',
  'Headphone wireless noise cancelling terbaik di bawah 2 juta',
  'Peralatan memasak praktis untuk anak kos budget 1 juta',
  'Tablet dan iPad untuk mencatat kuliah budget 6 juta',
];

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const { user, profile } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [groundedMode, setGroundedMode] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [lastIntent, setLastIntent] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeUserId = user ? user.uid : 'demo-user-1';

  // Muat riwayat pesan dari Firestore / lokal
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(activeUserId);
        if (isMounted) {
          if (history.length > 0) {
            setMessages(history);
          } else {
            // Pesan sambutan awal
            const welcomeMsg: ChatMessage = {
              id: 'msg-welcome',
              sender: 'assistant',
              text: `Halo ${profile?.displayName || 'Sobat Kampus'}! 👋 Saya adalah **Asisten Pre-Sales CRS CampusMarket**.\n\nSaya didukung sistem *Conversational Recommender System* yang terhubung langsung ke katalog produk kami. Ceritakan kebutuhan Anda, spesifikasi yang diinginkan, atau batas anggaran belanja Anda!`,
              createdAt: Date.now(),
            };
            setMessages([welcomeMsg]);
          }
        }
      } catch (err) {
        console.error('Gagal memuat riwayat chat:', err);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [activeUserId, profile]);

  // Otomatis kirim query dari URL jika ada
  useEffect(() => {
    if (initialQuery && initialQuery.trim() !== '') {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Auto-scroll ke pesan terbawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');

    // 1. Tambahkan pesan user ke UI & Firestore
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    await saveChatMessage(activeUserId, userMsg);

    // 2. Panggil Layanan CRS + LLM
    setLoading(true);
    try {
      const result = await generatePresalesDialogue(text, {
        grounded: groundedMode,
        userPreferences: profile?.preferences || null,
        chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
      });

      setLastIntent(result.extractedIntent);

      const assistantMsg: ChatMessage = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        text: result.reply,
        recommendedProductIds: result.recommendedProductIds,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await saveChatMessage(activeUserId, assistantMsg);

      if (result.discardedIdsCount > 0) {
        info(`Sistem mendeteksi dan memblokir ${result.discardedIdsCount} ID produk yang tidak ada di katalog (anti-halusinasi aktif).`);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      toastError('Gagal memproses rekomendasi AI. Mencoba mode fallback...');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory(activeUserId);
      const resetMsg: ChatMessage = {
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Riwayat percakapan telah dibersihkan. Ada produk lain yang ingin Anda cari?',
        createdAt: Date.now(),
      };
      setMessages([resetMsg]);
      setLastIntent(null);
      setConfirmClearOpen(false);
      success('Riwayat chat berhasil dihapus.');
    } catch (err) {
      toastError('Gagal menghapus riwayat chat.');
    }
  };

  // Helper untuk mengambil objek Product berdasarkan ID
  const getProductById = (id: string): Product | undefined => {
    return CATALOG_PRODUCTS.find((p) => p.id === id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Halaman Chat & CRS Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Asisten Pre-Sales CRS (Gemini)
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Modul rekomendasi CRS memilihkan produk dari katalog, LLM menjelaskan & membujuk secara natural.
            </p>
          </div>
        </div>

        {/* Action Controls: Grounded Switch & Clear Chat */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setGroundedMode(true);
                info('Mode CRS Grounded Aktif: LLM hanya boleh merekomendasikan produk dari katalog.');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                groundedMode
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grounded (CRS)
            </button>
            <button
              onClick={() => {
                setGroundedMode(false);
                info('Mode Baseline Aktif: LLM bebas tanpa batasan kandidat katalog (untuk evaluasi).');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                !groundedMode
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline
            </button>
          </div>

          <button
            onClick={() => setConfirmClearOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
            title="Hapus Riwayat Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Intention Status Bar (jika intent terdeteksi) */}
      {lastIntent && (lastIntent.category || lastIntent.maxBudget || lastIntent.keywords?.length > 0) && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs text-slate-700 animate-in fade-in">
          <span className="font-bold flex items-center gap-1 text-emerald-700">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Niat Belanja Terdeteksi (CRS Intent):
          </span>
          {lastIntent.category && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold">
              <Tag className="w-3 h-3 text-emerald-600" />
              Kategori: {lastIntent.category}
            </span>
          )}
          {lastIntent.maxBudget && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              Budget: {formatRupiah(lastIntent.maxBudget)}
            </span>
          )}
          {lastIntent.keywords?.length > 0 && (
            <span className="text-slate-500">
              Kata Kunci: {lastIntent.keywords.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 min-h-[500px] max-h-[650px] overflow-y-auto space-y-6">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const recProducts = (msg.recommendedProductIds || [])
            .map((id) => getProductById(id))
            .filter((p): p is Product => Boolean(p));

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div className={`flex items-start gap-2.5 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-slate-700 text-white'
                      : 'bg-emerald-600 text-white shadow-sm'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                    isUser
                      ? 'bg-slate-800 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {/* Render Recommended Product Cards (di bawah jawaban asisten) */}
              {!isUser && recProducts.length > 0 && (
                <div className="w-full pl-10 pr-2 pt-2">
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Kandidat Rekomendasi Terpilih ({recProducts.length} Produk):
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Tervalidasi dari Katalog
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {recProducts.map((product) => (
                        <ProductCard key={product.id} product={product} compact={true} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3 text-slate-500 text-xs pl-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memilih kandidat produk & menyusun rekomendasi...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Pertanyaan Populer:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative bg-white rounded-2xl border border-slate-300 p-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ketik kebutuhan Anda... (contoh: Cari laptop untuk tugas kuliah budget maksimal 8 juta)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Modal Konfirmasi Hapus Chat */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Riwayat Percakapan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Seluruh pesan chat Anda dengan Asisten AI akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
