import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { assets, clients, projects } from '../data/portalData'
import { db } from './firebase'

const collections = { clients: 'clients', projects: 'projects', assets: 'content' }

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

export async function clearDemoData() {
  const batch = writeBatch(db)
  ;['abc-media', 'pacific-creative', 'northstar-events', 'pulse-fitness'].forEach((id) => batch.delete(doc(db, collections.clients, id)))
  ;['summer-campaign', 'brand-film-2026', 'awards-night-recap'].forEach((id) => batch.delete(doc(db, collections.projects, id)))
  ;[1, 2, 3, 4, 5, 6].forEach((id) => batch.delete(doc(db, collections.assets, `asset-${id}`)))
  batch.set(doc(db, 'portalMeta', 'seed'), { completed: true, clearedAt: serverTimestamp() })
  await batch.commit()
}

export function subscribeToCollection(name, onChange) {
  return onSnapshot(collection(db, collections[name]), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
  })
}

export function createClient(client) {
  return addDoc(collection(db, collections.clients), { ...client, status: 'Active', projects: 0, lastActivity: 'Just now' })
}

export function createContentLink(content) {
  return addDoc(collection(db, collections.assets), { ...content, date: 'Just now', createdAt: serverTimestamp() })
}

export function createProject(project) {
  return addDoc(collection(db, collections.projects), { ...project, progress: 0, createdAt: serverTimestamp() })
}
