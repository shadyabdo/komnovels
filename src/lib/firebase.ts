import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDqHnd0oq4tdCdgVDzrNeygmCO7Ur4ClWo",
  authDomain: "koom-anime.firebaseapp.com",
  databaseURL: "https://koom-anime-default-rtdb.firebaseio.com",
  projectId: "koom-anime",
  storageBucket: "koom-anime.firebasestorage.app",
  messagingSenderId: "147748254360",
  appId: "1:147748254360:web:cb5f3ae98504524d0996ed",
  measurementId: "G-ELKDZM4KG3"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export default app;
