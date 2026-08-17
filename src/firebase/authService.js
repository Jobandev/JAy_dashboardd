import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
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
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const displayName = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  await updateProfile(credential.user, { displayName })
  return credential
}

export async function saveProfile(displayName) {
  assertConfigured()
  await updateProfile(auth.currentUser, { displayName })
}
