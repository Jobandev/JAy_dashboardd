import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { isFirebaseConfigured } from '../firebase/firebase'
import {
  clearDemoData,
  createClient,
  updateClient,
  deleteClient,
  updateProject,
  createContentLink,
  createProject,
  createActivity,
  updateActivity,
  deleteActivity,
  deleteProject,
  deleteContent,
  seedPortalData,
  subscribeToCollection,
  subscribeToClientScopedCollection,
  subscribeToClientDoc,
} from '../firebase/portalService'

const PortalDataContext = createContext({ clients: [], projects: [], assets: [], users: [], loading: true, addClient: async () => {}, addContentLink: async () => {}, deleteProject: async () => {}, deleteContent: async () => {} })

export function PortalDataProvider({ children }) {
  const { user, role, clientId } = useAuth()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setClients([]); setProjects([]); setAssets([]); setUsers([]); setLoading(false)
      return undefined
    }

    // Client-role accounts only ever query documents scoped to their own
    // clientId — they never subscribe to the full clients/projects/content
    // collections. Pair this with matching Firestore security rules so the
    // restriction is enforced server-side too, not just in this UI.
    if (role === 'client' && clientId) {
      setLoading(false)
      const stopClient = subscribeToClientDoc(clientId, setClients)
      const stopProjects = subscribeToClientScopedCollection('projects', clientId, setProjects)
      const stopAssets = subscribeToClientScopedCollection('assets', clientId, setAssets)
      setActivities([])
      setUsers([])
      return () => { stopClient(); stopProjects(); stopAssets() }
    }

    if (role === 'client') {
      setClients([]); setProjects([]); setAssets([]); setActivities([]); setUsers([]); setLoading(false)
      return undefined
    }

    let active = true
    const setup = async () => {
      try {
        await seedPortalData()
        if (active) setLoading(false)
      } catch (error) {
        console.error('Unable to load portal data.', error)
        if (active) setLoading(false)
      }
    }
    setup()
    const stopClients = subscribeToCollection('clients', setClients)
    const stopProjects = subscribeToCollection('projects', setProjects)
    const stopAssets = subscribeToCollection('assets', setAssets)
    const stopActivities = subscribeToCollection('activities', setActivities)
    const stopUsers = subscribeToCollection('users', setUsers)
    return () => { active = false; stopClients(); stopProjects(); stopAssets(); stopActivities(); stopUsers() }
  }, [user, role, clientId])

  const value = useMemo(() => ({ clients, projects, assets, activities, users, loading, addClient: createClient, updateClient: updateClient, deleteClient, updateProject: updateProject, addContentLink: createContentLink, addProject: createProject, addActivity: createActivity, updateActivity, deleteActivity, deleteProject, deleteContent, clearDemoData }), [clients, projects, assets, activities, users, loading])
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>
}

export const usePortalData = () => useContext(PortalDataContext)
