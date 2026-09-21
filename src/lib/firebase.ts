import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { UserProfile } from '../types';

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

// Enable full Offline Persistence Cache in Firestore
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfileToFirestore(result.user);
    }
    return result.user;
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
}

export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName: string,
  photoURL?: string
): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;
    
    // Update Auth Profile
    await updateProfile(user, {
      displayName: displayName.trim() || email.split('@')[0],
      photoURL: photoURL || undefined
    });

    // Sync to Firestore
    await syncUserProfileToFirestore({
      uid: user.uid,
      displayName: displayName.trim() || email.split('@')[0],
      email: user.email,
      photoURL: photoURL || null
    });

    return user;
  } catch (error: any) {
    console.error("Register Email/Pass error:", error);
    throw error;
  }
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      await syncUserProfileToFirestore(cred.user);
    }
    return cred.user;
  } catch (error: any) {
    console.error("Login Email/Pass error:", error);
    throw error;
  }
}

export async function updateUserProfileData(
  currentUser: User | UserProfile,
  data: { displayName?: string; photoURL?: string }
): Promise<UserProfile> {
  const uid = currentUser.uid;
  const newDisplayName = data.displayName !== undefined ? data.displayName.trim() : (currentUser.displayName || '');
  const newPhotoURL = data.photoURL !== undefined ? data.photoURL : (currentUser.photoURL || '');

  // 1. Update Firebase Auth if current user is Firebase Auth User
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName || undefined,
        photoURL: newPhotoURL || undefined
      });
    } catch (e) {
      console.warn("Could not update auth profile directly:", e);
    }
  }

  const updatedProfile: UserProfile = {
    uid,
    displayName: newDisplayName || null,
    email: currentUser.email || null,
    photoURL: newPhotoURL || null
  };

  // 2. Sync to Firestore
  try {
    await syncUserProfileToFirestore(updatedProfile);
  } catch (e) {
    console.info("Firestore profile sync notice:", e);
  }

  // 3. Save to local storage for instant offline access
  try {
    localStorage.setItem(`vanz_user_profile_${uid}`, JSON.stringify(updatedProfile));
    // If it's a local/guest profile, also update main local user key
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      localStorage.setItem('vanz_auth_local_user', JSON.stringify(updatedProfile));
    }
  } catch {}

  return updatedProfile;
}

export async function syncUserProfileToFirestore(user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.info("Firestore user profile save note:", e);
  }
}

export async function getUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        uid,
        displayName: d.displayName || null,
        email: d.email || null,
        photoURL: d.photoURL || null
      };
    }
  } catch (e) {
    console.info("Firestore get user profile note:", e);
  }
  return null;
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    localStorage.removeItem('vanz_auth_local_user');
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export function formatAuthError(error: any): string {
  const code = error?.code || '';
  const message = error?.message || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan pilih menu Masuk / Login.';
    case 'auth/invalid-email':
      return 'Format email tidak valid. Periksa kembali penulisan email Anda.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu pendek. Gunakan minimal 6 karakter.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok. Silakan coba lagi.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke jaringan internet. Periksa koneksi Anda.';
    case 'auth/unauthorized-domain':
      return 'Domain hosting belum terdaftar di Firebase Auth Authorized Domains.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login ditutup sebelum selesai.';
    case 'auth/popup-blocked':
      return 'Popup login terblokir oleh browser. Harap izinkan popup di pengaturan browser.';
    default:
      if (message.includes('password') && message.includes('6')) {
        return 'Kata sandi minimal 6 karakter.';
      }
      return message || 'Terjadi kendala saat proses autentikasi. Silakan coba lagi.';
  }
}

export { onAuthStateChanged, type User };
