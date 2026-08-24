import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, storage } from './firebase'

const fileNameSafe = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '-')

export async function uploadContent({ file, clientId, client, title, type, description }) {
  const fileRef = ref(storage, `content/${clientId}/${Date.now()}-${fileNameSafe(file.name)}`)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  return addDoc(collection(db, 'content'), {
    title,
    description: description || '',
    client,
    clientId,
    type,
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    date: 'Just now',
    createdAt: serverTimestamp(),
  })
}

export async function uploadProfilePhoto(file, uid) {
  const fileRef = ref(storage, `avatars/${uid}/${Date.now()}-${fileNameSafe(file.name)}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
