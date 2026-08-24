import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
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

export async function signOutUser() {
  assertConfigured()
  return signOut(auth)
}

export async function resetPassword(email) {
  assertConfigured()
  return sendPasswordResetEmail(auth, email)
}

// A brief handoff for the contact number entered on the sign-up form.
// AuthProvider creates the users/{uid} profile document itself in response
// to the auth state change fired by createUserWithEmailAndPassword, so it
// has no direct way to receive form data from the Login page. This small
// synchronous in-memory handoff avoids a race between "account created" and
// "profile document written" without needing a second Firestore write.
let pendingSignupContact = ''
export function consumePendingSignupContact() {
  const value = pendingSignupContact
  pendingSignupContact = ''
  return value
}

export async function createAccount(email, password, username, contact) {
  assertConfigured()
  pendingSignupContact = (contact || '').trim()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: username.trim() })
  return credential
}

export async function saveProfile(displayName, photoURL) {
  assertConfigured()
  const updates = { displayName }
  if (photoURL) updates.photoURL = photoURL
  await updateProfile(auth.currentUser, updates)
}
