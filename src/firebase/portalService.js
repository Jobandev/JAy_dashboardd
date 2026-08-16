import { addDoc, collection, doc, getDocs, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { assets, clients, projects } from '../data/portalData'
import { db } from './firebase'

const collections = { clients: 'clients', projects: 'projects', assets: 'content' }

export async function seedPortalData() {
  const clientSnapshot = await getDocs(collection(db, collections.clients))
  if (!clientSnapshot.empty) return

  const batch = writeBatch(db)
  clients.forEach(({ id, ...client }) => batch.set(doc(db, collections.clients, id), client))
  projects.forEach((project) => batch.set(doc(db, collections.projects, project.name.toLowerCase().replaceAll(' ', '-')), project))
  assets.forEach(({ id, ...asset }) => batch.set(doc(db, collections.assets, `asset-${id}`), asset))
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
