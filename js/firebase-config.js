/* 《順路眼》Firebase 初始化（所有頁面共用） */
const firebaseConfig = {
    apiKey: "AIzaSyDmeQpaPurEAh0Nj5fSbJbJRRLc7Mpg_W0",
    authDomain: "nearpath-just.firebaseapp.com",
    projectId: "nearpath-just",
    storageBucket: "nearpath-just.firebasestorage.app",
    messagingSenderId: "534460835626",
    appId: "1:534460835626:web:c91574e08030dc92aee053"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
