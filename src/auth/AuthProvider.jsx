import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebase'

// role is one of:
//   'administrator' — full access to every client (Jay)
//   'employee'      — full access to every client (internal team)
//   'client'        — scoped to a single organisation via clientId
// clientId is only meaningful when role === 'client'. It is not set
// automatically anywhere yet — an administrator assigns it by hand on the
// user's Firestore profile document (users/{uid}.clientId) until a proper
// invite/assignment UI exists.
const AuthContext = createContext({ user: null, role: 'employee', clientId: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('employee')
  const [clientId, setClientId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (!nextUser || !db) {
        setRole('employee')
        setClientId(null)
        setLoading(false)
        return
      }

      const profileRef = doc(db, 'users', nextUser.uid)
      const profile = await getDoc(profileRef)
      if (profile.exists()) {
        const data = profile.data()
        const nextRole = ['administrator', 'client'].includes(data.role) ? data.role : 'employee'
        setRole(nextRole)
        setClientId(nextRole === 'client' ? data.clientId || null : null)
      } else {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase()
        const nextRole = adminEmail && nextUser.email?.toLowerCase() === adminEmail
          ? 'administrator'
          : 'employee'
        await setDoc(profileRef, {
          email: nextUser.email || '',
          displayName: nextUser.displayName || '',
          role: nextRole,
          clientId: null,
        })
        setRole(nextRole)
        setClientId(null)
      }
      setLoading(false)
    })
  }, [])

  const value = useMemo(() => ({ user, role, clientId, loading }), [user, role, clientId, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
