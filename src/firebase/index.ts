import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// This should be replaced with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYRLuj8ydIy-unXpjf8hmFZ7HPwCUmYm4",
    authDomain: "dilaragulhan.firebaseapp.com",
    projectId: "dilaragulhan",
    storageBucket: "dilaragulhan.firebasestorage.app",
    messagingSenderId: "888888941375",
    appId: "1:888888941375:web:e37248d7538126505c918a"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app) 