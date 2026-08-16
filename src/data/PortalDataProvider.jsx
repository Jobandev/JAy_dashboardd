import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { isFirebaseConfigured } from '../firebase/firebase'
import { createClient, seedPortalData, subscribeToCollection } from '../firebase/portalService'

const PortalDataContext = createContext({ clients: [], projects: [], assets: [], loading: true, addClient: async () => {} })

export function PortalDataProvider({ children }) {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
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
    return () => { active = false; stopClients(); stopProjects(); stopAssets() }
  }, [user])

  const value = useMemo(() => ({ clients, projects, assets, loading, addClient: createClient }), [clients, projects, assets, loading])
  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>
}

export const usePortalData = () => useContext(PortalDataContext)
