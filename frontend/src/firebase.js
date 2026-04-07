import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Add this line!

const firebaseConfig = {
    apiKey: "AIzaSyAAXc7dTm_bqEh7XqB07vItEfNk6hVZpGE",
    authDomain: "baron-kitchen-oms.firebaseapp.com",
    projectId: "baron-kitchen-oms",
    storageBucket: "baron-kitchen-oms.firebasestorage.app",
    messagingSenderId: "844582734798",
    appId: "1:844582734798:web:c13a0186ee4c354813399f",
    measurementId: "G-438DB2KKVT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database so we can use it everywhere, boss!
export const db = getFirestore(app);