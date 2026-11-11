/**
 * Layanan Riwayat Chat Asisten AI (Cloud Firestore & Local Fallback)
 * Skema: users/{uid}/chats/{chatId}/messages/{messageId}
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { ChatMessage } from '@/types';

const CHAT_LOCAL_KEY = 'campus_market_local_chat_history';
const DEFAULT_CHAT_ID = 'main_session';

function getLocalMessages(userId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`${CHAT_LOCAL_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(userId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(`${CHAT_LOCAL_KEY}_${userId}`, JSON.stringify(messages));
  } catch (err) {
    console.error('Gagal menyimpan riwayat chat lokal:', err);
  }
}

/**
 * CREATE: Menyimpan satu pesan ke riwayat chat
 */
export async function saveChatMessage(
  userId: string,
  message: ChatMessage
): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(
        db,
        'users',
        userId,
        'chats',
        DEFAULT_CHAT_ID,
        'messages',
        message.id
      );
      await setDoc(docRef, {
        id: message.id,
        sender: message.sender,
        text: message.text,
        recommendedProductIds: message.recommendedProductIds || [],
        createdAt: message.createdAt || Date.now(),
      });
      return;
    } catch (err) {
      console.warn('Gagal menyimpan chat ke Firestore, menyimpan ke lokal:', err);
    }
  }

  // Fallback lokal
  const current = getLocalMessages(userId);
  saveLocalMessages(userId, [...current, message]);
}

/**
 * READ: Mengambil seluruh riwayat pesan pengguna
 */
export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];

  if (isFirebaseConfigured) {
    try {
      const collRef = collection(
        db,
        'users',
        userId,
        'chats',
        DEFAULT_CHAT_ID,
        'messages'
      );
      const q = query(collRef, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        messages.push(d.data() as ChatMessage);
      });
      if (messages.length > 0) return messages;
    } catch (err) {
      console.warn('Gagal membaca chat dari Firestore, membaca dari lokal:', err);
    }
  }

  return getLocalMessages(userId);
}

/**
 * DELETE: Menghapus seluruh riwayat percakapan pengguna
 */
export async function clearChatHistory(userId: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const collRef = collection(
        db,
        'users',
        userId,
        'chats',
        DEFAULT_CHAT_ID,
        'messages'
      );
      const snap = await getDocs(collRef);
      const deletes = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.allSettled(deletes);
    } catch (err) {
      console.warn('Gagal menghapus riwayat chat di Firestore:', err);
    }
  }

  // Bersihkan juga dari penyimpanan lokal
  localStorage.removeItem(`${CHAT_LOCAL_KEY}_${userId}`);
}
