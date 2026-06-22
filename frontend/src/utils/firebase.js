import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHqUsZ3m09LVvetX2EUJL1O4PcRAE1jL0",
  authDomain: "documento-2b29e.firebaseapp.com",
  projectId: "documento-2b29e",
  storageBucket: "documento-2b29e.firebasestorage.app",
  messagingSenderId: "598616849528",
  appId: "1:598616849528:web:5df7ea1c921d61bd84018d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
