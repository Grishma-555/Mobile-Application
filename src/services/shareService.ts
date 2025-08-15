import { collection, doc, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { encryptData, fileToBase64 } from '../utils/encryption';

export type ContentType = 'note' | 'link' | 'file';

export interface ShareData {
  id?: string;
  senderUid: string;
  senderName: string;
  recipientEmail: string;
  contentType: ContentType;
  ciphertext: string;
  iv: string;
  createdAt: Date;
  deleted: boolean;
  fileName?: string;
  fileType?: string;
}

export interface CreateShareInput {
  senderUid: string;
  senderName: string;
  recipientEmail: string;
  contentType: ContentType;
  content: string | File;
}

export const createShare = async (input: CreateShareInput): Promise<{ shareId: string; key: string }> => {
  try {
    let dataToEncrypt: string;
    let fileName: string | undefined;
    let fileType: string | undefined;

    if (input.contentType === 'file' && input.content instanceof File) {
      dataToEncrypt = await fileToBase64(input.content);
      fileName = input.content.name;
      fileType = input.content.type;
    } else {
      dataToEncrypt = input.content as string;
    }

    const { ciphertext, iv, key } = await encryptData(dataToEncrypt);

    console.log('Encryption completed. Key generated:', key);

    const shareData = {
      senderUid: input.senderUid,
      senderName: input.senderName,
      recipientEmail: input.recipientEmail,
      contentType: input.contentType,
      ciphertext,
      iv,
      createdAt: Timestamp.now(),
      deleted: false,
      ...(fileName && { fileName }),
      ...(fileType && { fileType }),
    };

    const docRef = await addDoc(collection(db, 'shares'), shareData);
    
    console.log('Share saved to database. Returning key:', key);
    
    return {
      shareId: docRef.id,
      key,
    };
  } catch (error) {
    console.error('Error creating share:', error);
    throw error;
  }
};

export const getUserSentShares = async (senderUid: string): Promise<ShareData[]> => {
  try {
    const q = query(
      collection(db, 'shares'),
      where('senderUid', '==', senderUid),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as ShareData));
  } catch (error) {
    console.error('Error fetching sent shares:', error);
    throw error;
  }
};

export const getUserReceivedShares = async (recipientEmail: string): Promise<ShareData[]> => {
  try {
    const q = query(
      collection(db, 'shares'),
      where('recipientEmail', '==', recipientEmail),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as ShareData));
  } catch (error) {
    console.error('Error fetching received shares:', error);
    throw error;
  }
};