import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  serverTimestamp,
  updateDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Log config for debugging (be careful with secrets, but here we need to ensure it's not empty)
if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.error("Firebase config is missing or invalid! Check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence explicitly
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Failed to set persistence:", err);
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Type
export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  badges: string[];
  completedMissions: string[];
  interests: string[];
  currentMissionId?: string;
  role: 'student' | 'teacher' | 'parent';
  createdAt: any;
  streakCount: number;
  lastActiveDate?: any;
}

/**
 * Calculates level based on XP.
 * Formula: Level = floor(sqrt(xp / 100)) + 1
 */
export const calculateLevel = (xp: number): number => {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const newUser: UserProfile = {
        userId: user.uid,
        displayName: user.displayName || 'Anonim',
        photoURL: user.photoURL || '',
        xp: 0,
        level: 1,
        badges: [],
        completedMissions: [],
        interests: [],
        role: 'student',
        createdAt: serverTimestamp(),
        streakCount: 0,
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
    const data = userDoc.data() as UserProfile;
    
    // Update streak on sync
    const today = new Date().toDateString();
    const lastActive = data.lastActiveDate?.toDate?.() || null;
    const lastActiveString = lastActive ? lastActive.toDateString() : null;

    if (lastActiveString !== today) {
      let newStreak = data.streakCount || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastActiveString === yesterday.toDateString()) {
        newStreak += 1;
      } else if (!lastActiveString) {
        newStreak = 1;
      } else {
        newStreak = 1; // Reset if missed a day, or 1 if it's the first day of new streak
      }

      await updateDoc(userRef, {
        streakCount: newStreak,
        lastActiveDate: serverTimestamp()
      });
      return { ...data, streakCount: newStreak, lastActiveDate: today };
    }

    return data;
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
};
