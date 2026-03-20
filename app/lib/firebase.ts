import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 👈 FALTABA ESTO

const firebaseConfig = {
  apiKey: "AIzaSyDZcY9Dqe70cIeynlb8gNxvYgFtb73Yv9s",
  authDomain: "sislexi.firebaseapp.com",
  projectId: "sislexi",
  storageBucket: "sislexi.firebasestorage.app",
  messagingSenderId: "957684279148",
  appId: "1:957684279148:web:2da30646bc4d65578fb549"
};

const app = initializeApp(firebaseConfig);

// 👇 EXPORTACIONES
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 🔥 ESTA ES LA CLAVE