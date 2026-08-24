import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

// Firebase Auth only stores displayName/email/photoURL on the auth user
// itself. Anything else about a person (contact number, etc.) lives on
// their users/{uid} Firestore profile document instead.
export function updateUserProfileDoc(uid, updates) {
  return updateDoc(doc(db, 'users', uid), updates)
}
