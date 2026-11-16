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
import { db, auth, isFirebaseConfigured } from '@/lib/firebase';
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
  // Simpan ke lokal terlebih dahulu untuk respons instan
  const current = getLocalMessages(userId);
  saveLocalMessages(userId, [...current, message]);

  // Hanya simpan ke Firestore jika user benar-benar login di Firebase Auth
  if (isFirebaseConfigured && auth.currentUser && auth.currentUser.uid === userId) {
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
      
      const firestorePromise = setDoc(docRef, {
        id: message.id,
        sender: message.sender,
        text: message.text,
        recommendedProductIds: message.recommendedProductIds || [],
        createdAt: message.createdAt || Date.now(),
      });

      // Timeout 2 detik agar tidak pernah memblokir jalannya obrolan
      await Promise.race([
        firestorePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2000)),
      ]);
    } catch (err) {
      console.warn('Gagal menyimpan chat ke Firestore (tetap tersimpan di lokal):', err);
    }
  }
}

/**
 * READ: Mengambil seluruh riwayat pesan pengguna
 */
export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const localMsgs = getLocalMessages(userId);

  if (isFirebaseConfigured && auth.currentUser && auth.currentUser.uid === userId) {
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

      const firestorePromise = getDocs(q);
      const snap = await Promise.race([
        firestorePromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500)),
      ]);

      const messages: ChatMessage[] = [];
      snap.forEach((d) => {
        messages.push(d.data() as ChatMessage);
      });
      if (messages.length > 0) return messages;
    } catch (err) {
      console.warn('Gagal membaca chat dari Firestore, membaca dari lokal:', err);
    }
  }

  return localMsgs;
}

/**
 * DELETE: Menghapus seluruh riwayat percakapan pengguna
 */
export async function clearChatHistory(userId: string): Promise<void> {
  try {
    localStorage.removeItem(`${CHAT_LOCAL_KEY}_${userId}`);
  } catch (err) {
    console.error('Gagal menghapus chat lokal:', err);
  }

  if (isFirebaseConfigured && auth.currentUser && auth.currentUser.uid === userId) {
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
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn('Gagal menghapus riwayat di Firestore:', err);
    }
  }
}
