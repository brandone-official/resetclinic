import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const app = initializeApp({
  projectId: 'resetclinic',
  appId: '1:602684917728:web:44e770ce405e6996ed4d85',
  storageBucket: 'resetclinic.firebasestorage.app',
  apiKey: 'AIzaSyBS21dyXNLlQPdm2XiVBW1LtoT-PoInK7s',
  authDomain: 'resetclinic.firebaseapp.com',
  messagingSenderId: '602684917728',
  measurementId: 'G-DCPJ4FNNPV',
})

export const db = getFirestore(app)
export const auth = getAuth(app)

isSupported().then(yes => { if (yes) getAnalytics(app) })
