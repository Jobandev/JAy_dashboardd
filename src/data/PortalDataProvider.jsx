import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { isFirebaseConfigured } from '../firebase/firebase'
import { clearDemoData, createClient, updateClient, updateProject, createContentLink, createProject, createActivity, deleteProject, deleteContent, seedPortalData, subscribeToCollection } from '../firebase/portalService'

const PortalDataContext = createContext({ clients: [], projects: [], assets: [], loading: true, addClient: async () => {}, addContentLink: async () => {}, deleteProject: async () => {}, deleteContent: async () => {} })

export function PortalDataProvider({ children }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setClients([]); setProjects([]); setAssets([]); setLoading(false)
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
    return () => { active = false; stopClients(); stopProjects(); stopAssets(); stopActivities() }
  }, [user])

  const value = useMemo(() => ({ clients, projects, assets, activities, loading, addClient: createClient, updateClient: updateClient, updateProject: updateProject, addContentLink: createContentLink, addProject: createProject, addActivity: createActivity, deleteProject, deleteContent, clearDemoData }), [clients, projects, assets, activities, loading])
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>
}

export const usePortalData = () => useContext(PortalDataContext)
