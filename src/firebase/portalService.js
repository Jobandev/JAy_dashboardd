import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, serverTimestamp, writeBatch } from 'firebase/firestore'
import { assets, clients, projects } from '../data/portalData'
import { db } from './firebase'

const collections = { clients: 'clients', projects: 'projects', assets: 'content', activities: 'activities', users: 'users' }

export async function seedPortalData() {
  const metaRef = doc(db, 'portalMeta', 'seed')
  if ((await getDoc(metaRef)).exists()) return
  const clientSnapshot = await getDocs(collection(db, collections.clients))
  if (!clientSnapshot.empty) { await setDoc(metaRef, { completed: true }); return }

  const batch = writeBatch(db)
  clients.forEach(({ id, ...client }) => batch.set(doc(db, collections.clients, id), client))
  projects.forEach((project) => batch.set(doc(db, collections.projects, project.name.toLowerCase().replaceAll(' ', '-')), project))
  assets.forEach(({ id, ...asset }) => batch.set(doc(db, collections.assets, `asset-${id}`), asset))
  batch.set(metaRef, { completed: true })
  await batch.commit()
}

// Deletes only the starter seed data (the current real client list plus its
// starter projects), leaving anything added by hand untouched.
export async function clearDemoData() {
  const batch = writeBatch(db)
  clients.forEach(({ id }) => batch.delete(doc(db, collections.clients, id)))
  projects.forEach((project) => batch.delete(doc(db, collections.projects, project.name.toLowerCase().replaceAll(' ', '-'))))
  batch.set(doc(db, 'portalMeta', 'seed'), { completed: true, clearedAt: serverTimestamp() })
  await batch.commit()
}

export function subscribeToCollection(name, onChange) {
  return onSnapshot(collection(db, collections[name]), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  })
}

// Same as subscribeToCollection but scoped to a single clientId. Used for
// client-role accounts so their browser only ever fetches documents
// belonging to their own organisation, rather than the whole collection
// filtered client-side. This needs a matching Firestore security rule
// (see firestore.rules) to actually be enforced server-side — the query
// filter alone is a convenience, not a security boundary.
export function subscribeToClientScopedCollection(name, clientId, onChange) {
  const scoped = query(collection(db, collections[name]), where('clientId', '==', clientId))
  return onSnapshot(scoped, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  })
}

export function subscribeToClientDoc(clientId, onChange) {
  return onSnapshot(doc(db, collections.clients, clientId), (snapshot) => {
    onChange(snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [])
  })
}

export function createClient(client) {
  return addDoc(collection(db, collections.clients), { ...client, status: 'Active', projects: 0, lastActivity: 'Just now' })
}

export function updateClient(id, updates) {
  // updates should be an object with the fields to update on the client document
  return updateDoc(doc(db, collections.clients, id), updates)
}

export function updateProject(id, updates) {
  // updates should be an object with the fields to update on the project document
  return updateDoc(doc(db, collections.projects, id), updates)
}

export function deleteProject(id) {
  return deleteDoc(doc(db, collections.projects, id))
}

export function createContentLink(content) {
  return addDoc(collection(db, collections.assets), { ...content, date: 'Just now', createdAt: serverTimestamp() })
}

export function deleteContent(id) {
  return deleteDoc(doc(db, collections.assets, id))
}

export function createProject(project) {
  return addDoc(collection(db, collections.projects), { ...project, progress: 0, createdAt: serverTimestamp() })
}

export function createActivity(activity) {
  return addDoc(collection(db, collections.activities), { ...activity, createdAt: serverTimestamp() })
}
