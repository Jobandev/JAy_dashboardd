import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Film,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { ToastContext } from "../lib/ToastContext";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users, administratorOnly: true },
  { to: "/content", label: "Content library", icon: Film },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];

export function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const { user, role, clientId } = useAuth();
  const name = user?.displayName || user?.email?.split("@")[0] || "Portal user";
  const initials = name.charAt(0).toUpperCase();
  const visibleNav = role === "client"
    ? nav
        .filter((item) => !item.administratorOnly)
        .map((item) => (item.to === "/dashboard" ? { ...item, to: `/clients/${clientId}`, label: "My organisation" } : item))
    : nav.filter((item) => !item.administratorOnly || role === "administrator");

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    // auto-dismiss
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="app-shell">
        <aside className={open ? "sidebar is-open" : "sidebar"}>
          <div className="brand">
            <span className="brand-mark">E</span>
            <span>ENTROPIC</span>
            <button className="mobile-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav>
            {visibleNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ||
                  (to === "/clients" && location.pathname.startsWith("/clients"))
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <NavLink to="/settings" className="nav-link">
              <Settings size={18} />
              Settings
            </NavLink>
            <div className="profile">
              <span className="avatar small">{initials}</span>
              <div>
                <b>{name}</b>
                <span>{user?.email}</span>
                <span>{role === "administrator" ? "Administrator" : role === "client" ? "Client" : "Employee"}</span>
              </div>
            </div>
          </div>
        </aside>
        <main>
          <header className="topbar">
            <button className="menu-button" onClick={() => setOpen(true)}>
              <Menu />
            </button>
            <div className="crumb">
              Workspace <ChevronRight size={14} /> <span>Jay Downes — Client Dashboard</span>
            </div>
            <div className="top-actions">
              <div className="notification-wrap">
                <button
                  className="icon-button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                  <i />
                </button>
                {showNotifications && (
                  <div className="notification-panel">
                    <b>Notifications</b>
                    <p>
                      <span />
                      Content library is ready for new delivery links.
                    </p>
                    <p>
                      <span />
                      Your Firestore changes save automatically.
                    </p>
                  </div>
                )}
              </div>
              <span className="avatar">{initials}</span>
            </div>
          </header>

          {children}

          {toast && (
            <div className={`toast ${toast.type}`} style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60 }}>
              {toast.message}
            </div>
          )}
        </main>
      </div>
    </ToastContext.Provider>
  );
}

