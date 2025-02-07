import admin from "firebase-admin";

// Verifica se o Firebase Admin já foi inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // 🔥 Corrige as quebras de linha
    }),
  });
}

export const authAdmin = admin.auth();
