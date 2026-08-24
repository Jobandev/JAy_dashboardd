import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { PortalDataProvider } from "./data/PortalDataProvider";
import { ToastProvider } from "./lib/ToastContext";
import { ProtectedRoute, AdministratorRoute, ClientDetailRoute } from "./routes/guards";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Clients } from "./pages/Clients";
import { ClientProfile } from "./pages/ClientProfile";
import { Content } from "./pages/Content";
import { Projects } from "./pages/Projects";
import { SettingsPage } from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <PortalDataProvider>
        <ToastProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <AdministratorRoute>
                <Clients />
              </AdministratorRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ClientDetailRoute>
                <ClientProfile />
              </ClientDetailRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <Content />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </PortalDataProvider>
    </AuthProvider>
  );
}
