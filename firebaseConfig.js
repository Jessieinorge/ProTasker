import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database"; // Import the database functions
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDQ3G43ppNHWLya1qs2M12vmKdrj673tTY", 
  authDomain: "protasker.firebaseapp.com",
  databaseURL: "https://protasker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "protasker",
  storageBucket: "protasker.appspot.com",
  messagingSenderId: "197252333775",
  appId: "1:197252333775:web:23e56ef652ffede9ffb7ba",
  measurementId: "G-393Q02HFBW"
};

const app = initializeApp(firebaseConfig);
// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const database = getDatabase(app); // Initialize the database

const readDataOnce = async (path) => {
  try {
    const dbRef = ref(database, path); // Reference to the specified path
    const snapshot = await get(dbRef); // Get the data snapshot
    return snapshot.val(); // Return the data
  } catch (error) {
    console.error('Read Data Error:', error.message);
    throw error;
  }
};

export { auth, app, readDataOnce,database };
