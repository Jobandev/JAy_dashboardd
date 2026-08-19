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

export async function createAccount(email, password, username) {
  assertConfigured()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: username.trim() })
  return credential
}

export async function saveProfile(displayName) {
  assertConfigured()
  await updateProfile(auth.currentUser, { displayName })
}
