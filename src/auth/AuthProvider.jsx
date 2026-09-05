import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/firebase';
import { consumePendingSignupContact } from '../firebase/authService';
const AuthContext = createContext({ user: null, role: 'client', clientId: null, profile: null, loading: true });
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) { setLoading(false); return; }
    let generation = 0;
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, async nextUser => {
      const current = ++generation;
      stopProfile(); setProfile(null); setUser(nextUser); setLoading(true); setError('');
      if (!nextUser) { setLoading(false); return; }
      const ref = doc(db, 'users', nextUser.uid);
      try {
        const snapshot = await getDoc(ref);
        if (current !== generation) return;
        if (!snapshot.exists()) await setDoc(ref, { email: nextUser.email || '', displayName: nextUser.displayName || '', role: 'client', clientId: null, contact: consumePendingSignupContact(), photoURL: nextUser.photoURL || '' });
        if (current !== generation) return;
        stopProfile = onSnapshot(ref, result => {
          if (current !== generation) return;
          setProfile(result.exists() ? result.data() : null); setLoading(false);
        }, () => {
          if (current !== generation) return;
          setProfile(null); setError('Unable to load your account permissions. Reload to try again.'); setLoading(false);
        });
      } catch {
        if (current !== generation) return;
        setProfile(null); setError('Unable to load your account permissions. Reload to try again.'); setLoading(false);
      }
    });
    return () => { generation++; stopProfile(); stopAuth(); };
  }, []);
  const refreshProfile = useCallback(async () => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    const snapshot = await getDoc(doc(db, 'users', currentUser.uid));
    if (auth.currentUser?.uid === currentUser.uid) { setUser({ ...currentUser }); setProfile(snapshot.data() || null); }
  }, []);
  const role = profile?.role === 'administrator' ? 'administrator' : 'client';
  const clientId = role === 'client' ? profile?.clientId || null : null;
  const value = useMemo(() => ({ user, role, clientId, profile, loading, refreshProfile }), [user, role, clientId, profile, loading, refreshProfile]);
  return <AuthContext.Provider value={value}>{error && <p role="alert" className="form-error">{error}</p>}{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
