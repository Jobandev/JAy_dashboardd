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
  updateContent,
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

const PortalDataContext = createContext({ clients: [], projects: [], assets: [], users: [], feedback: [], loading: true, addClient: async () => {}, addContentLink: async () => {}, deleteProject: async () => {}, deleteContent: async () => {} })

export function PortalDataProvider({ children }) {
  const { user, role, clientId, loading } = useAuth()
  if (loading) return <div className="auth-loading">Loading portal...</div>
  return <ScopedPortalDataProvider key={[user?.uid, role, clientId].join(':')}>{children}</ScopedPortalDataProvider>
}

function ScopedPortalDataProvider({ children }) {
  const { user, role, clientId } = useAuth()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setClients([]); setProjects([]); setAssets([]); setUsers([]); setLoading(false)
      return undefined
    }

    // Client-role accounts only ever query documents scoped to their own
    // clientId — they never subscribe to the full clients/projects/content
    // collections. Pair this with matching Firestore security rules so the
    // restriction is enforced server-side too, not just in this UI.
    let pending = role === 'client' ? 3 : 6
    const receive = setter => { let first = true; return data => { setter(data); if (first) { first = false; pending -= 1; } if (pending <= 0) setLoading(false) } }
    const fail = () => { setError('Unable to load dashboard data. Check your connection and account access, then reload.'); setLoading(false) }
    if (role === 'client' && clientId) {
      const stopClient = subscribeToClientDoc(clientId, receive(setClients), fail)
      const stopProjects = subscribeToClientScopedCollection('projects', clientId, receive(setProjects), fail)
      const stopAssets = subscribeToClientScopedCollection('assets', clientId, receive(setAssets), fail)
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
        // Snapshot callbacks complete the loading state.
      } catch (error) {
        console.error('Unable to load portal data.', error)
        if (active) setLoading(false)
      }
    }
    setup()
    const stopClients = subscribeToCollection('clients', receive(setClients), fail)
    const stopProjects = subscribeToCollection('projects', receive(setProjects), fail)
    const stopAssets = subscribeToCollection('assets', receive(setAssets), fail)
    const stopActivities = subscribeToCollection('activities', receive(setActivities), fail)
    const stopUsers = subscribeToCollection('users', receive(setUsers), fail)
    const stopFeedback = subscribeToCollection('feedback', receive(setFeedback), fail)
    return () => { active = false; stopClients(); stopProjects(); stopAssets(); stopActivities(); stopUsers(); stopFeedback() }
  }, [user, role, clientId])

  const value = useMemo(() => ({ clients, projects, assets, activities, users, feedback, loading, addClient: createClient, updateClient: updateClient, deleteClient, updateProject: updateProject, addContentLink: createContentLink, updateContent, addProject: createProject, addActivity: createActivity, updateActivity, deleteActivity, deleteProject, deleteContent, clearDemoData }), [clients, projects, assets, activities, users, feedback, loading])
  return <PortalDataContext.Provider value={value}>{error && <p role="alert" className="form-error">{error}</p>}{children}</PortalDataContext.Provider>
}

export const usePortalData = () => useContext(PortalDataContext)
