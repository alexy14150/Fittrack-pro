import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDg2JTnWPIorFYynnTgtfOK4jhS-ZO9BTU",
  authDomain: "fittrackpro-1015a.firebaseapp.com",
  projectId: "fittrackpro-1015a",
  storageBucket: "fittrackpro-1015a.firebasestorage.app",
  messagingSenderId: "749583522742",
  appId: "1:749583522742:web:5d9e0c8da7d4338bae3f17",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);