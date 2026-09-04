// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAZ6jPLKWxLyMkSgUxE5e20Gm0RQo8rxg",
  authDomain: "a-realidade-rpg.firebaseapp.com",
  projectId: "a-realidade-rpg",
  storageBucket: "a-realidade-rpg.firebasestorage.app",
  messagingSenderId: "720363938799",
  appId: "1:720363938799:web:72fd0533df776448b5cc1a",
  measurementId: "G-VYJK2V6GVC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);