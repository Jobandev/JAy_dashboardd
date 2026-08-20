import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/firebase'

const AuthContext = createContext({ user: null, role: 'employee', loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState('employee')
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
        setLoading(false)
        return
      }

      const profileRef = doc(db, 'users', nextUser.uid)
      const profile = await getDoc(profileRef)
      if (profile.exists()) {
        setRole(profile.data().role === 'administrator' ? 'administrator' : 'employee')
      } else {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase()
        const nextRole = adminEmail && nextUser.email?.toLowerCase() === adminEmail
          ? 'administrator'
          : 'employee'
        await setDoc(profileRef, {
          email: nextUser.email || '',
          displayName: nextUser.displayName || '',
          role: nextRole,
        })
        setRole(nextRole)
      }
      setLoading(false)
    })
  }, [])

  const value = useMemo(() => ({ user, role, loading }), [user, role, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
