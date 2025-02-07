// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAlQEkdSArdyNYMzKVUBJQs5yRoww55Pmc",
  authDomain: "assistente-de-midias-sociais.firebaseapp.com",
  projectId: "assistente-de-midias-sociais",
  storageBucket: "assistente-de-midias-sociais.firebasestorage.app",
  messagingSenderId: "91269961112",
  appId: "1:91269961112:web:6f44e5fff0105c5f6ac7ed"
};

// Inicializa o Firebase apenas se ainda não foi inicializado
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
