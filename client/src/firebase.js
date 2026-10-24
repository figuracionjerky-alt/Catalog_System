import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3ewU52pTDNqVoPPgQZ-qRVD7js5jAr5E",
  authDomain: "catalog-system-5850e.firebaseapp.com",
  projectId: "catalog-system-5850e",
  storageBucket: "catalog-system-5850e.firebasestorage.app",
  messagingSenderId: "295941153518",
  appId: "1:295941153518:web:66f88d03200b49bc12c9ff",
  measurementId: "G-W1KV8X1YTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);