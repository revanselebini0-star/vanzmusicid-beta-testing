import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBAJOP4GNy48u8z0xnXSXn5HRzTF4tL0c0",
  authDomain: "vanzmusic-uot.firebaseapp.com",
  projectId: "vanzmusic-uot",
  storageBucket: "vanzmusic-uot.firebasestorage.app",
  messagingSenderId: "206281919008",
  appId: "1:206281919008:web:4e4a66b4d123fa9d3a0a45",
  measurementId: "G-HPJ6DSBYVV"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export { onAuthStateChanged, type User };
