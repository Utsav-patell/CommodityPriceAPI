const dotenv = require('dotenv');
dotenv.config();
const { initializeApp,cert } =require("firebase-admin/app");
const {getFirestore} = require('firebase-admin/firestore'); 
const serviceAccount = require('./firebase_cred.json');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web apps Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional\





initializeApp({
  credential: cert(serviceAccount)
});
// Initialize Firebase
const db = getFirestore();
module.exports = db;

