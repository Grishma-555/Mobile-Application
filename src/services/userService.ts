import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        name: data.name,
        email: data.email,
        createdAt: data.createdAt.toDate(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid: string, name: string, email: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const validateRecipientEmail = async (email: string): Promise<boolean> => {
  try {
    // In a real app, you'd query users by email
    // For now, we'll assume any email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } catch (error) {
    console.error('Error validating recipient email:', error);
    return false;
  }
};