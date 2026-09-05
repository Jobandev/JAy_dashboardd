import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, createUserWithEmailAndPassword, updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function createClientAccount({ email, password, displayName, contactNumber, clientId }) {
  if (!auth?.currentUser || !clientId) throw new Error('Select an organisation.');
  const admin = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (admin.data()?.role !== 'administrator') throw new Error('Administrator access required.');
  const app = initializeApp(auth.app.options, 'client-provision-' + crypto.randomUUID());
  const secondary = initializeAuth(app, { persistence: inMemoryPersistence });
  let created;
  try {
    created = (await createUserWithEmailAndPassword(secondary, email.trim(), password)).user;
    await updateProfile(created, { displayName: displayName.trim() });
    await setDoc(doc(db, 'users', created.uid), { email: created.email, displayName: displayName.trim(), role: 'client', clientId, contact: contactNumber?.trim() || '', contactNumber: contactNumber?.trim() || '', photoURL: '' });
  } catch (error) {
    if (created) {
      try { await deleteUser(created); }
      catch { throw new Error('Account profile could not be saved and account cleanup failed. Ask the contact to sign in, then assign their account below.'); }
    }
    throw error;
  } finally {
    await signOut(secondary).catch(() => {});
    await deleteApp(app);
  }
}

export async function assignClientAccount(uid, clientId) {
  return updateDoc(doc(db, 'users', uid), { role: 'client', clientId: clientId || null });
}

// Keep the profile so signing in again cannot recreate an assigned account.
export async function removeClientAccess(uid) {
  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().role !== 'client') throw new Error('Only client access can be removed here.');
  return updateDoc(ref, { clientId: null, archived: true });
}
