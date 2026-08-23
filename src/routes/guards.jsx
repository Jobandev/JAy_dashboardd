import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading portal…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
export function AdministratorRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading portal…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return role === "administrator" ? children : <Navigate to="/dashboard" replace />;
}
// Staff (administrator/employee) can view any client's profile page.
// A client-role account can only view its own — anything else redirects
// them back to their own page rather than exposing another organisation's
// projects/content in the UI.
export function ClientDetailRoute({ children }) {
  const { user, role, clientId, loading } = useAuth();
  const { id } = useParams();
  if (loading) return <div className="auth-loading">Loading portal…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "administrator" || role === "employee") return children;
  if (role === "client") {
    return id === clientId ? children : <Navigate to={clientId ? `/clients/${clientId}` : "/settings"} replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
