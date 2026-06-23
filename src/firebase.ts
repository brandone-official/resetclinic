import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { type Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics'

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

let analytics: Analytics | null = null
isSupported().then(yes => { if (yes) analytics = getAnalytics(app) })

export function track(event: string, params?: Record<string, string>) {
  if (analytics) logEvent(analytics, event, params)
}
