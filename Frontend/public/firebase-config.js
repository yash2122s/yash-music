// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDBuqtEfmDsDsi-Gppn95fpadOdmaDiUs",
  authDomain: "yash-music-5c797.firebaseapp.com",
  projectId: "yash-music-5c797",
  storageBucket: "yash-music-5c797.firebasestorage.app",
  messagingSenderId: "1050791304497",
  appId: "1:1050791304497:web:dbb0c72c79fa6b61afa410"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth }; 