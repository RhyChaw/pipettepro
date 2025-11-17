'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebaseConfig';

interface UserProfile {
  email: string;
  name: string;
  'pipette experience': string;
  profileComplete?: boolean;
  profilePictureUrl?: string;
  highestLevel?: number;
  onboardingCompleted?: boolean;
  roadmapProgress?: number[];
  canSkipKnowTools?: boolean;
  gotSimulationTutorial?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user profile from Firestore using email as document ID
        const userDoc = await getDoc(doc(db, 'students', firebaseUser.email || ''));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create initial student document using email as document ID
    await setDoc(doc(db, 'students', email), {
      email,
      name: '',
      'pipette experience': '',
      profileComplete: false,
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user || !user.email) throw new Error('No user logged in');
    
    const updatedProfile = {
      email: user.email,
      ...userProfile,
      ...profile,
    };
    
    // Only set profileComplete if it's explicitly provided
    if (profile.profileComplete !== undefined) {
      updatedProfile.profileComplete = profile.profileComplete;
    } else if (!updatedProfile.profileComplete) {
      updatedProfile.profileComplete = true;
    }
    
    await setDoc(doc(db, 'students', user.email), updatedProfile, { merge: true });
    setUserProfile(updatedProfile as UserProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        signIn,
        logOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

