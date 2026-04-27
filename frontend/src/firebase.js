import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAUdzNweMQveCfZHVEp2oP0H6mFXsRWvqQ",
  authDomain: "signflow-login-25apr.firebaseapp.com",
  projectId: "signflow-login-25apr",
  storageBucket: "signflow-login-25apr.firebasestorage.app",
  messagingSenderId: "164720770984",
  appId: "1:164720770984:web:3ea9469df1b6cd559c679d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
