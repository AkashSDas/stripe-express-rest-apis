import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// The app is initialized inside the ./index.js file also
// this initialization is just an alernative to that

export const firebaseConfig = {
  // config...
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
export const auth = firebase.auth();
