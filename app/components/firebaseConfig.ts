// firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlQEkdSArdyNYMzKVUBJQs5yRoww55Pmc",
  authDomain: "assistente-de-midias-sociais.firebaseapp.com",
  projectId: "assistente-de-midias-sociais",
  storageBucket: "assistente-de-midias-sociais.appspot.com", // Corrigido
  messagingSenderId: "91269961112",
  appId: "1:91269961112:web:6f44e5fff0105c5f6ac7ed"
};

// Garante que o Firebase só seja inicializado uma vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth, app };
