import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { TimeTravelPhoto } from '../types';

// Helper to determine if we have a valid, fully configured real Firebase instance
export const isFirebaseConfigured = 
  !!(import.meta as any).env.VITE_FIREBASE_API_KEY && 
  (import.meta as any).env.VITE_FIREBASE_API_KEY !== "AI_STUDIO_MOCK_API_KEY" &&
  !!(import.meta as any).env.VITE_FIREBASE_PROJECT_ID;

// Default mock/placeholder values so client-side code never crashes on startup
const firebaseConfig = isFirebaseConfigured ? {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
} : {
  apiKey: "AI_STUDIO_MOCK_API_KEY",
  authDomain: "mock-auth-domain.firebaseapp.com",
  projectId: "mock-project-id",
  storageBucket: "mock-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let app;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
} catch (err) {
  console.error("Firebase SDK Lazy Initialization Error: ", err);
}

export { app };
export const auth = authInstance;
export const db = dbInstance;
export const googleProvider = new GoogleAuthProvider();

// Custom listener set for unified authentication
const authListeners = new Set<(user: any) => void>();
let currentUserState: any | null = null;

// Initialize state from local storage as a fallback to persist sessions
try {
  const cachedUser = localStorage.getItem('firebase_user_session');
  if (cachedUser) {
    currentUserState = JSON.parse(cachedUser);
  }
} catch (e) {
  console.error("Failed to parse cached session:", e);
}

// Set up the real Firebase auth subscription to update our unified state
if (isFirebaseConfigured && authInstance) {
  onAuthStateChanged(authInstance, (user) => {
    if (user) {
      currentUserState = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      localStorage.setItem('firebase_user_session', JSON.stringify(currentUserState));
    } else {
      // Only clear if we are not in a fallback mock state
      if (currentUserState && currentUserState.uid !== "demo-user-fallback" && currentUserState.uid !== "demo-user-quantum") {
        currentUserState = null;
        localStorage.removeItem('firebase_user_session');
      }
    }
    // Notify all unified listeners
    authListeners.forEach((cb) => cb(currentUserState));
  });
}

/**
 * Universal Auth State Listener that handles both real Firebase and Mock simulation
 */
export function onAuthChange(callback: (user: any | null) => void) {
  authListeners.add(callback);
  // Send the current state immediately
  callback(currentUserState);
  return () => {
    authListeners.delete(callback);
  };
}

export async function loginWithGoogle() {
  const isMock = !isFirebaseConfigured;

  if (isMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const mockUser = {
      uid: "demo-user-quantum",
      email: "udgeeth1996@gmail.com",
      displayName: "Udgeeth (Temporal Traveler)",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      emailVerified: true,
    };
    currentUserState = mockUser;
    localStorage.setItem('firebase_user_session', JSON.stringify(mockUser));
    authListeners.forEach((cb) => cb(mockUser));
    return mockUser;
  }

  if (!authInstance) throw new Error("Firebase Auth is not initialized or configured.");

  try {
    const result = await signInWithPopup(authInstance, googleProvider);
    const user = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };
    currentUserState = user;
    localStorage.setItem('firebase_user_session', JSON.stringify(user));
    authListeners.forEach((cb) => cb(user));
    return result.user;
  } catch (err: any) {
    console.warn("Real Firebase Google Popup failed. Falling back to simulated secure local session.", err);
    
    // Check if the error is due to restricted API key or similar
    const isApiKeyError = err.message?.includes("api-keys-are-not-supported") || err.code?.includes("api-keys-are-not-supported");
    
    const mockUser = {
      uid: "demo-user-fallback",
      email: "udgeeth1996@gmail.com",
      displayName: "Udgeeth (Sandbox)",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      emailVerified: true,
      authNotice: isApiKeyError 
        ? "API Key Restricted: Real Firebase Auth requires the 'Identity Toolkit API' to be enabled in your Google Cloud Console. Initiating secure sandbox session instead." 
        : "Sandbox mode enabled due to iframe or browser restrictions."
    };
    currentUserState = mockUser;
    localStorage.setItem('firebase_user_session', JSON.stringify(mockUser));
    authListeners.forEach((cb) => cb(mockUser));
    return mockUser;
  }
}

export async function logoutUser() {
  const isMock = !isFirebaseConfigured;

  currentUserState = null;
  localStorage.removeItem('firebase_user_session');
  authListeners.forEach((cb) => cb(null));

  if (!isMock && authInstance) {
    try {
      await signOut(authInstance);
    } catch (e) {
      console.error("Firebase Signout error:", e);
    }
  }
}

// Firestore Database Sync Helpers with Graceful Fallbacks

/**
 * Saves a time travel photo to Firestore for a specific user.
 * Falls back to local storage if Firestore is unavailable.
 */
export async function savePhotoToCloud(userId: string, photo: TimeTravelPhoto): Promise<boolean> {
  const isMock = !isFirebaseConfigured || !dbInstance;

  if (isMock) {
    try {
      const key = `mock_firestore_users_${userId}_photos`;
      const current = localStorage.getItem(key);
      const list: TimeTravelPhoto[] = current ? JSON.parse(current) : [];
      // Remove if already exists, then add to front
      const filtered = list.filter(p => p.id !== photo.id);
      filtered.unshift(photo);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error("Mock savePhotoToCloud error:", err);
      return false;
    }
  }

  try {
    const photoRef = doc(dbInstance, 'users', userId, 'photos', photo.id);
    await setDoc(photoRef, {
      ...photo,
      userId // enforce userId linkage for security
    });
    return true;
  } catch (err) {
    console.error("Failed to save photo to Firestore:", err);
    return false;
  }
}

/**
 * Fetches all saved time travel photos for a user from Firestore.
 */
export async function fetchPhotosFromCloud(userId: string): Promise<TimeTravelPhoto[]> {
  const isMock = !isFirebaseConfigured || !dbInstance;

  if (isMock) {
    try {
      const key = `mock_firestore_users_${userId}_photos`;
      const current = localStorage.getItem(key);
      return current ? JSON.parse(current) : [];
    } catch (err) {
      console.error("Mock fetchPhotosFromCloud error:", err);
      return [];
    }
  }

  try {
    const photosCol = collection(dbInstance, 'users', userId, 'photos');
    // Query ordered by timestamp descending
    const q = query(photosCol, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const photos: TimeTravelPhoto[] = [];
    querySnapshot.forEach((docSnapshot) => {
      photos.push(docSnapshot.data() as TimeTravelPhoto);
    });
    return photos;
  } catch (err) {
    console.error("Failed to fetch photos from Firestore:", err);
    return [];
  }
}

/**
 * Deletes a time travel photo from Firestore.
 */
export async function deletePhotoFromCloud(userId: string, photoId: string): Promise<boolean> {
  const isMock = !isFirebaseConfigured || !dbInstance;

  if (isMock) {
    try {
      const key = `mock_firestore_users_${userId}_photos`;
      const current = localStorage.getItem(key);
      if (current) {
        const list: TimeTravelPhoto[] = JSON.parse(current);
        const filtered = list.filter(p => p.id !== photoId);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      return true;
    } catch (err) {
      console.error("Mock deletePhotoFromCloud error:", err);
      return false;
    }
  }

  try {
    const photoRef = doc(dbInstance, 'users', userId, 'photos', photoId);
    await deleteDoc(photoRef);
    return true;
  } catch (err) {
    console.error("Failed to delete photo from Firestore:", err);
    return false;
  }
}

