import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCD2nAkDjw-qZuUKPK8cKDfQsPIYlwYYC0",
  authDomain: "luminastudy-9c978.firebaseapp.com",
  projectId: "luminastudy-9c978",
  storageBucket: "luminastudy-9c978.firebasestorage.app",
  messagingSenderId: "690166166503",
  appId: "1:690166166503:web:b20a7ce7432ddea1b5c342"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
