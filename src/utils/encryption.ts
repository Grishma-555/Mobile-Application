// AES-GCM encryption utilities using Web Crypto API
export interface EncryptionResult {
  ciphertext: string;
  iv: string;
  key: string;
}

export interface DecryptionInput {
  ciphertext: string;
  iv: string;
  key: string;
}

// Generate a random AES-GCM key
export const generateKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Export key to base64 string
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const keyBuffer = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
};

// Import key from base64 string
export const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data (text or file)
export const encryptData = async (data: string | ArrayBuffer): Promise<EncryptionResult> => {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    key: await exportKey(key),
  };
};

// Decrypt data
export const decryptData = async ({ ciphertext, iv, key }: DecryptionInput): Promise<ArrayBuffer> => {
  try {
    const cryptoKey = await importKey(key);
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      cryptoKey,
      ciphertextBuffer
    );
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data. Please check your key.');
  }
};

// Convert ArrayBuffer to text
export const bufferToText = (buffer: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:type;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};