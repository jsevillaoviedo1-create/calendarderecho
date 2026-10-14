import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/calendar';
import {
  isBiometricAvailable,
  registerBiometricCredential,
  verifyBiometricUnlock,
} from '../lib/webauthn';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSessionLocked: boolean;
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  lockSession: () => void;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  enrollBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);

  // Check biometric hardware support on mount
  useEffect(() => {
    isBiometricAvailable().then((supported) => {
      setIsBiometricSupported(supported);
    });
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            // Check if session was locked prior to refresh or if user had locked state in session
            const wasLocked = sessionStorage.getItem(`chronos_locked_${user.uid}`) === 'true';
            if (wasLocked && data.biometricEnabled) {
              setIsSessionLocked(true);
            }
          } else {
            // First time login - bootstrap user profile document
            const newProfile: UserProfile = {
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
              photoURL: user.photoURL || undefined,
              biometricEnabled: false,
              defaultView: 'dayGridMonth',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating user profile:', error);
          // Non-fatal fallback profile in memory
          setUserProfile({
            email: user.email || '',
            displayName: user.displayName || 'Usuario',
            biometricEnabled: false,
            defaultView: 'dayGridMonth',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
        setIsSessionLocked(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        const userDocRef = doc(db, 'users', cred.user.uid);
        const newProfile: UserProfile = {
          email,
          displayName: name,
          biometricEnabled: false,
          defaultView: 'dayGridMonth',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
      sessionStorage.removeItem(`chronos_locked_${currentUser.uid}`);
    }
    await signOut(auth);
    setIsSessionLocked(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const lockSession = () => {
    if (!currentUser) return;
    setIsSessionLocked(true);
    sessionStorage.setItem(`chronos_locked_${currentUser.uid}`, 'true');
  };

  const unlockWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'No hay usuario autenticado.' };
    const credentialId = userProfile?.biometricCredentialId;
    const res = await verifyBiometricUnlock(credentialId);
    if (res.success) {
      setIsSessionLocked(false);
      sessionStorage.removeItem(`chronos_locked_${currentUser.uid}`);
      return { success: true };
    }
    return res;
  };

  const unlockWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || !currentUser.email) {
      return { success: false, error: 'No hay usuario o email asociado.' };
    }
    try {
      // Verify credentials by signing in again
      await signInWithEmailAndPassword(auth, currentUser.email, password);
      setIsSessionLocked(false);
      sessionStorage.removeItem(`chronos_locked_${currentUser.uid}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Contraseña incorrecta. Por favor intenta de nuevo.' };
    }
  };

  const enrollBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Inicia sesión primero.' };

    const res = await registerBiometricCredential(
      currentUser.uid,
      currentUser.email || 'user@chronos.app',
      userProfile?.displayName || currentUser.displayName || 'Usuario'
    );

    if (res.success && res.credentialId) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          biometricEnabled: true,
          biometricCredentialId: res.credentialId,
          updatedAt: new Date().toISOString(),
        });
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                biometricEnabled: true,
                biometricCredentialId: res.credentialId,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
        return { success: true };
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
    return res;
  };

  const disableBiometrics = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        biometricEnabled: false,
        biometricCredentialId: '',
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              biometricEnabled: false,
              biometricCredentialId: '',
              updatedAt: new Date().toISOString(),
            }
          : null
      );
      sessionStorage.removeItem(`chronos_locked_${currentUser.uid}`);
      setIsSessionLocked(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        ...prefs,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userDocRef, updateData);
      setUserProfile((prev) => (prev ? { ...prev, ...updateData } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const isBiometricEnrolled = Boolean(userProfile?.biometricEnabled && userProfile.biometricCredentialId);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isSessionLocked,
        isBiometricSupported,
        isBiometricEnrolled,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        lockSession,
        unlockWithBiometrics,
        unlockWithPassword,
        enrollBiometrics,
        disableBiometrics,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
