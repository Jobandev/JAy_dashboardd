import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/firebase";
import { consumePendingSignupContact } from "../firebase/authService";

// role is one of:
//   'administrator' — full access to every client (Jay)
//   'employee'      — full access to every client (internal team)
//   'client'        — scoped to a single organisation via clientId
// clientId is only meaningful when role === 'client'. It is not set
// automatically anywhere yet — an administrator assigns it by hand on the
// user's Firestore profile document (users/{uid}.clientId) until a proper
// invite/assignment UI exists.
const AuthContext = createContext({
  user: null,
  role: "client",
  clientId: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("client");
  const [clientId, setClientId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser) => {
    if (!nextUser || !db) {
      setRole("client");
      setClientId(null);
      setProfile(null);
      return;
    }

    const profileRef = doc(db, "users", nextUser.uid);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const nextRole = ["administrator", "client"].includes(data.role) ? data.role : "client";
      setRole(nextRole);
      setClientId(nextRole === "client" ? data.clientId || null : null);
      setProfile(data);
    } else {
      const nextRole = "client";
      const newProfile = {
        email: nextUser.email || "",
        displayName: nextUser.displayName || "",
        role: nextRole,
        clientId: null,
        contact: consumePendingSignupContact(),
        photoURL: nextUser.photoURL || "",
      };
      await setDoc(profileRef, newProfile);
      setRole(nextRole);
      setClientId(null);
      setProfile(newProfile);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      await loadProfile(nextUser);
      setLoading(false);
    });
  }, [loadProfile]);

  // Re-reads the Firestore profile doc without a full page reload, so the
  // sidebar/settings page reflect a just-saved display name, contact, or
  // photo immediately.
  const refreshProfile = useCallback(async () => {
    if (auth?.currentUser) {
      // Firebase mutates auth.currentUser in place on updateProfile(), so a
      // fresh object reference is needed for React to notice the change.
      setUser({ ...auth.currentUser });
      await loadProfile(auth.currentUser);
    }
  }, [loadProfile]);

  const value = useMemo(
    () => ({ user, role, clientId, profile, loading, refreshProfile }),
    [user, role, clientId, profile, loading, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
