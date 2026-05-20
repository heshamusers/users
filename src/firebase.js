import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAqgZgcpd9hEQjs5J0VwjVcUVeTnZJcZo",
  authDomain: "users-baad9.firebaseapp.com",
  projectId: "users-baad9",
  storageBucket: "users-baad9.firebasestorage.app",
  messagingSenderId: "582900180281",
  appId: "1:582900180281:web:4c06c2efb7b7b11939b4e8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);