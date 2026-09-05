const firebaseConfig = {
  apiKey: "AIzaSyCAZ6jPLKWxLyMkSgUxE5e20Gm0RQo8rxg",
  authDomain: "a-realidade-rpg.firebaseapp.com",
  projectId: "a-realidade-rpg",
  storageBucket: "a-realidade-rpg.firebasestorage.app",
  messagingSenderId: "720363938799",
  appId: "1:720363938799:web:72fd0533df776448b5cc1a",
  measurementId: "G-VYJK2V6GVC"
};
if(!firebase.apps.length){
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(erro =>{
  console.error("Erro ao configurar persistência da conta:", erro);
  }
);