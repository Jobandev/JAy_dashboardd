import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

function assertConfigured() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase has not been configured yet.')
  }
}

export async function signIn(email, password) {
  assertConfigured()
  return signInWithEmailAndPassword(auth, email, password)
}

export async function createAccount(email, password) {
  assertConfigured()
  return createUserWithEmailAndPassword(auth, email, password)
}
