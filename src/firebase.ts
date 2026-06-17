import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  projectId: 'resetclinic',
  appId: '1:602684917728:web:44e770ce405e6996ed4d85',
  storageBucket: 'resetclinic.firebasestorage.app',
  apiKey: 'AIzaSyBS21dyXNLlQPdm2XiVBW1LtoT-PoInK7s',
  authDomain: 'resetclinic.firebaseapp.com',
  messagingSenderId: '602684917728',
})

export const db = getFirestore(app)
