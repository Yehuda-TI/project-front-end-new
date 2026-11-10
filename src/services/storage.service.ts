import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from '@/lib/firebase';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  url: string;
  storagePath: string;
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Harap unggah format JPG, PNG, atau WEBP.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran gambar terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)}MB). Batas maksimal adalah 5MB.`,
    };
  }

  return { valid: true };
};

export const uploadProductImage = (
  userId: string,
  productId: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    // Jika belum ada kredensial Firebase, simpan sebagai Data URL lokal untuk simulasi demo
    if (!isFirebaseConfigured) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              url: reader.result as string,
              storagePath: `demo-local-storage/${userId}/${productId}/${file.name}`,
            });
          };
          reader.onerror = () => reject(new Error('Gagal membaca file gambar lokal.'));
          reader.readAsDataURL(file);
        }
      }, 100);
      return;
    }

    // Bersihkan nama file agar aman dari karakter khusus
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `product-images/${userId}/${productId}/${Date.now()}_${safeFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploaderId: userId,
        productId: productId,
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error('Gagal mengunggah foto produk. Periksa koneksi internet Anda.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadUrl,
            storagePath: storagePath,
          });
        } catch (urlError) {
          reject(urlError);
        }
      }
    );
  });
};

export const deleteProductImage = async (storagePath: string): Promise<void> => {
  if (!isFirebaseConfigured || storagePath.startsWith('demo-local-storage')) {
    return;
  }
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn(`Peringatan: Gagal menghapus file dari Storage (${storagePath}):`, error);
  }
};
