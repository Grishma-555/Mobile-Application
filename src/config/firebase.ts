import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCvRjX5qDbagaf3X7s13adZ9b22A8xV5Ho",
  authDomain: "share-c823f.firebaseapp.com",
  projectId: "share-c823f",
  storageBucket: "share-c823f.firebasestorage.app",
  messagingSenderId: "687994012540",
  appId: "1:687994012540:web:24b872f92624b577b81af9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Auto sign-in anonymously
export const initializeAuth = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};