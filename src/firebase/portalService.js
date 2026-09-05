import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, serverTimestamp, writeBatch } from 'firebase/firestore'
import { assets, clients, projects } from '../data/portalData'
import { db } from './firebase'
import { validateResource } from '../lib/resourceValidation'

const collections = { clients: 'clients', projects: 'projects', assets: 'content', activities: 'activities', users: 'users', feedback: 'resourceFeedback' }

export async function saveResourceFeedback(resourceId, userId, status, note = '') {
  if (!resourceId || !userId || !['viewed', 'needs-discussion'].includes(status)) throw new Error('Invalid resource feedback.')
  const resource = await getDoc(doc(db, collections.assets, resourceId))
  if (!resource.exists()) throw new Error('Resource no longer exists.')
  return setDoc(doc(db, collections.feedback, `${resourceId}_${userId}`), { resourceId, userId, clientId: resource.data().clientId, status, note: note.trim().slice(0, 500), updatedAt: serverTimestamp() }, { merge: true })
}

export async function getResourceFeedback(resourceId, userId) {
  if (!resourceId || !userId) return null
  const snapshot = await getDoc(doc(db, collections.feedback, `${resourceId}_${userId}`))
  return snapshot.exists() ? snapshot.data() : null
}

export function resolveResourceFeedback(id) {
  return updateDoc(doc(db, collections.feedback, id), { status: 'resolved', resolvedAt: serverTimestamp() })
}

export function deleteResourceFeedback(id) {
  return deleteDoc(doc(db, collections.feedback, id))
}

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
  const seededIds = new Set(clients.map(client => client.id))
  const seededProjectIds = new Set(projects.map(project => project.name.toLowerCase().replaceAll(' ', '-')))
  const [content, accounts, currentProjects] = await Promise.all([
    getDocs(collection(db, collections.assets)), getDocs(collection(db, collections.users)), getDocs(collection(db, collections.projects)),
  ])
  if ([...content.docs, ...accounts.docs].some(entry => seededIds.has(entry.data().clientId)) || currentProjects.docs.some(entry => seededIds.has(entry.data().clientId) && !seededProjectIds.has(entry.id))) {
    throw new Error('Starter organisations now contain client data. Remove them individually using the confirmed delete action.')
  }
  const batch = writeBatch(db)
  clients.forEach(({ id }) => batch.delete(doc(db, collections.clients, id)))
  projects.forEach((project) => batch.delete(doc(db, collections.projects, project.name.toLowerCase().replaceAll(' ', '-'))))
  batch.set(doc(db, 'portalMeta', 'seed'), { completed: true, clearedAt: serverTimestamp() })
  await batch.commit()
}

export function subscribeToCollection(name, onChange, onError) {
  return onSnapshot(collection(db, collections[name]), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

// Same as subscribeToCollection but scoped to a single clientId. Used for
// client-role accounts so their browser only ever fetches documents
// belonging to their own organisation, rather than the whole collection
// filtered client-side. This needs a matching Firestore security rule
// (see firestore.rules) to actually be enforced server-side — the query
// filter alone is a convenience, not a security boundary.
export function subscribeToClientScopedCollection(name, clientId, onChange, onError) {
  const scoped = query(collection(db, collections[name]), where('clientId', '==', clientId))
  return onSnapshot(scoped, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  }, onError)
}

export function subscribeToClientDoc(clientId, onChange, onError) {
  return onSnapshot(doc(db, collections.clients, clientId), (snapshot) => {
    onChange(snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [])
  }, onError)
}

export function createClient(client) {
  return addDoc(collection(db, collections.clients), { ...client, createdAt: serverTimestamp(), status: 'Active', projects: 0, lastActivity: 'Just now' })
}

export function updateClient(id, updates) {
  // updates should be an object with the fields to update on the client document
  return updateDoc(doc(db, collections.clients, id), updates)
}

export async function deleteClient(id) {
  const [projectSnapshot, contentSnapshot, userSnapshot] = await Promise.all([
    getDocs(query(collection(db, collections.projects), where('clientId', '==', id))),
    getDocs(query(collection(db, collections.assets), where('clientId', '==', id))),
    getDocs(query(collection(db, collections.users), where('clientId', '==', id))),
  ])
  const batch = writeBatch(db)
  if (projectSnapshot.size + contentSnapshot.size + userSnapshot.size >= 450) throw new Error('This organisation is too large for an atomic browser deletion. Remove its projects first.')
  userSnapshot.docs.forEach(entry => batch.update(entry.ref, { clientId: null }))
  projectSnapshot.docs.forEach((entry) => batch.delete(entry.ref))
  contentSnapshot.docs.forEach((entry) => batch.delete(entry.ref))
  batch.delete(doc(db, collections.clients, id))
  return batch.commit()
}

export function updateProject(id, updates) {
  // updates should be an object with the fields to update on the project document
  return updateDoc(doc(db, collections.projects, id), updates)
}

export async function deleteProject(id) {
  const resources = await getDocs(query(collection(db, collections.assets), where('projectId', '==', id)))
  if (resources.size >= 450) throw new Error('This project is too large for an atomic browser deletion. Contact the administrator.')
  const batch = writeBatch(db)
  resources.docs.forEach(entry => batch.delete(entry.ref))
  batch.delete(doc(db, collections.projects, id))
  return batch.commit()
}

async function checkResource(content) {
  const project = content.projectId ? await getDoc(doc(db, collections.projects, content.projectId)) : null
  validateResource(content, project?.exists() ? project.data() : null)
}

export async function createContentLink(content) {
  await checkResource(content)
  return addDoc(collection(db, collections.assets), {
    ...content,
    postedAt: Date.now(),
    createdAt: serverTimestamp(),
  })
}

export function deleteContent(id) {
  return deleteDoc(doc(db, collections.assets, id))
}

export async function updateContent(id, updates) {
  const current = await getDoc(doc(db, collections.assets, id))
  if (!current.exists()) throw new Error('Resource no longer exists.')
  await checkResource({ ...current.data(), ...updates })
  return updateDoc(current.ref, updates)
}

export async function createProject(project) {
  if (!project.clientId || !(await getDoc(doc(db, collections.clients, project.clientId))).exists()) throw new Error('Choose an existing organisation.')
  return addDoc(collection(db, collections.projects), { ...project, progress: 0, createdAt: serverTimestamp() })
}

export function createActivity(activity) {
  return addDoc(collection(db, collections.activities), { ...activity, createdAt: serverTimestamp() })
}

export function updateActivity(id, updates) {
  return updateDoc(doc(db, collections.activities, id), updates)
}

export function deleteActivity(id) {
  return deleteDoc(doc(db, collections.activities, id))
}
