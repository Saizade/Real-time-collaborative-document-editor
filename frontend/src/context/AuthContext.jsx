import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import api, { setAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If they haven't verified their email (and it's an email/password account), don't log them in fully
        if (!firebaseUser.emailVerified && firebaseUser.providerData[0]?.providerId === 'password') {
          setUser(null);
          setAuthToken(null);
          localStorage.removeItem('user');
          setInitializing(false);
          return;
        }

        try {
          // Sync with our backend
          const res = await api.post('/api/auth/firebase', {
            email: firebaseUser.email,
            username: firebaseUser.displayName,
            firebaseUid: firebaseUser.uid
          });
          
          setUser(res.data);
          setAuthToken(res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.error("Error syncing with backend:", error);
        }
      } else {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('user');
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        // Sign them right back out if not verified
        await firebaseSignOut(auth);
        return { success: false, message: 'Please verify your email before logging in.' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message.replace('Firebase: ', '')
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with username
      await updateProfile(userCredential.user, { displayName: username });

      // Send verification email
      await sendEmailVerification(userCredential.user);

      // Sign them out immediately so they have to verify first
      await firebaseSignOut(auth);

      return { success: true, message: 'Registration successful! Please check your email to verify your account.' };
    } catch (error) {
      return {
        success: false,
        message: error.message.replace('Firebase: ', '')
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      return {
        success: false,
        message: error.message.replace('Firebase: ', '')
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message.replace('Firebase: ', '')
      };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loginWithGoogle,
      forgotPassword,
      initializing
    }}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
