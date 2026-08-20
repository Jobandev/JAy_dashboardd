import React, { useState, useEffect, useContext } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Clock3,
  Download,
  FileText,
  Film,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  Upload,
  Users,
  X,
} from "lucide-react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { createAccount, saveProfile, signIn } from "./firebase/authService";
import { PortalDataProvider, usePortalData } from "./data/PortalDataProvider";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users, administratorOnly: true },
  { to: "/content", label: "Content library", icon: Film },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];
const typeIcon = { Video: Play, Photo: Film, Document: FileText };

// Simple toast context to allow components to show brief notifications
const ToastContext = React.createContext(null);

function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const { user, role } = useAuth();
  const name = user?.displayName || user?.email?.split("@")[0] || "Portal user";
  const initials = name.charAt(0).toUpperCase();

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
            <span className="brand-mark">W</span>
            <span>WOLFGRAMM</span>
            <button className="mobile-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav>
            {nav.filter((item) => !item.administratorOnly || role === "administrator").map(({ to, label, icon: Icon }) => (
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
                <span>{role === "administrator" ? "Administrator" : "Employee"}</span>
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
              Workspace <ChevronRight size={14} /> <span>Wolfgramm Holdings</span>
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

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="description">{description}</p>}
      </div>
      {children && <div className="heading-action">{children}</div>}
    </div>
  );
}
function PrimaryButton({ children, onClick, icon: Icon = Plus }) {
  return (
    <button className="primary-button" onClick={onClick}>
      <Icon size={17} />
      {children}
    </button>
  );
}
function toEmbedUrl(url = "") {
  if (url.includes("youtube.com/watch"))
    return `https://www.youtube.com/embed/${new URL(url).searchParams.get(
      "v"
    )}`;
  if (url.includes("youtu.be/"))
    return `https://www.youtube.com/embed/${url.split("/").pop()}`;
  if (url.includes("vimeo.com/"))
    return `https://player.vimeo.com/video/${url.split("/").pop()}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return url;
}
function getContentThumbnail(asset = {}) {
  const explicit = asset.thumbnailUrl || asset.previewImage || asset.poster || asset.coverImage || asset.image;
  if (typeof explicit === "string" && explicit.trim()) return explicit;

  const url = asset.url || asset.externalUrl || "";
  if (!url) return null;

  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url)) return url;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      const id = parsed.searchParams.get("v") || url.split("/").pop().split("?")[0];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (hostname.includes("vimeo.com")) {
      const id = url.split("/").filter(Boolean).pop();
      return id ? `https://vumbnail.com/${id}.jpg` : null;
    }
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1000`;
  } catch {
    return null;
  }

  return null;
}
function MediaViewer({ asset, close }) {
  const url = asset.url || asset.externalUrl;
  const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const [isPlaying, setIsPlaying] = useState(false);
  const posterUrl = getContentThumbnail(asset);
  const posterStyle = posterUrl
    ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(9,9,13,0.7)), url("${posterUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div className="modal-backdrop media-backdrop">
      <section className="media-viewer">
        <button className="modal-close" onClick={close}>
          <X size={18} />
        </button>
        <div className="media-frame">
          {isVideo ? (
            isPlaying ? (
              <video
                src={url}
                controls
                autoPlay
                poster={posterUrl || undefined}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="media-poster" style={posterStyle}>
                <button className="play-button large" onClick={() => setIsPlaying(true)}>
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
            )
          ) : (
            isPlaying ? (
              <iframe
                src={toEmbedUrl(url)}
                title={asset.title}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="media-poster" style={posterStyle}>
                <button className="play-button large" onClick={() => setIsPlaying(true)}>
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
            )
          )}
        </div>
        <div>
          <p className="eyebrow">{asset.type}</p>
          <h2>{asset.title}</h2>
          <p className="description">
            {asset.description ||
              "No description has been added for this delivery."}
          </p>
        </div>
      </section>
    </div>
  );
}
function AssetCard({ asset, compact = false }) {
  const [viewing, setViewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteContent } = usePortalData();
  const Icon = typeIcon[asset.type] || FileText;
  const contentUrl = asset.url || asset.externalUrl;
  const previewUrl = getContentThumbnail(asset);
  const imageStyle = previewUrl
    ? {
        backgroundImage: `linear-gradient(180deg,transparent 35%,#09090d99), url("${previewUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: asset.image || "linear-gradient(140deg,#5133a0,#171421)" };

  const handleDelete = async (event) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${asset.title}" from the content library?`)) return;
    setDeleting(true);
    try {
      await deleteContent(asset.id);
    } catch (error) {
      console.error("Unable to delete asset", error);
      window.alert("Unable to delete this content item right now.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className={compact ? "asset-card compact" : "asset-card"}>
        <div className="asset-image" style={imageStyle}>
          {asset.type === "Video" && contentUrl && (
            <button className="play-button" onClick={() => setViewing(true)}>
              <Play size={16} fill="currentColor" />
            </button>
          )}
          <span className="asset-type">
            <Icon size={13} />
            {asset.type}
          </span>
        </div>
        <div className="asset-details">
          <h3>{asset.title}</h3>
          <p>
            {asset.client}
            <span>·</span>
            {asset.date}
          </p>
          <p className="asset-description">
            {asset.description || "No description added."}
          </p>
          <div className="asset-actions">
            {contentUrl && (
              <button className="asset-open" onClick={() => setViewing(true)}>
                View in portal <ArrowUpRight size={12} />
              </button>
            )}
            <button className="asset-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </article>
      {viewing && <MediaViewer asset={asset} close={() => setViewing(false)} />}
    </>
  );
}

function Dashboard() {
  const { clients, assets, projects, activities, addActivity } = usePortalData();
  const { user, role } = useAuth();
  const visibleProjects = role === "administrator"
    ? projects
    : projects.filter((project) => project.assignedTo === user?.email);
  const navigate = useNavigate();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const displayName = user?.displayName || user?.email?.split("@")[0] || "there";
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="OVERVIEW"
          title={`Good afternoon, ${displayName}.`}
          description="Here’s what’s happening across your client work today."
        >
          <PrimaryButton onClick={() => navigate("/content?link=1")}>
            Add content link
          </PrimaryButton>
        </PageHeader>
        <div className="stats-grid">
          <Stat
            icon={Users}
            label="Active clients"
            value={clients.length}
            change="Live Firestore data"
          />
          <Stat
            icon={FolderKanban}
            label="Live projects"
            value={visibleProjects.length}
            change="Production pipeline"
          />
          <Stat
            icon={Film}
            label="Content delivered"
            value={assets.length}
            change="In content library"
          />
        </div>
        <div className="dashboard-grid">
          <section className="panel recent-panel">
            <div className="panel-title">
              <div>
                <p className="eyebrow">RECENT WORK</p>
                <h2>Latest content</h2>
              </div>
              <NavLink to="/content" className="text-link">
                View library <ArrowUpRight size={15} />
              </NavLink>
            </div>
            <div className="asset-row">
              {assets.slice(0, 3).map((a) => (
                <AssetCard key={a.id} asset={a} compact />
              ))}
            </div>
          </section>

          <section className="panel activity">
            <div className="panel-title">
              <div>
                <p className="eyebrow">ACTIVITY</p>
                <h2>What needs attention</h2>
              </div>
              <div className="heading-action">
                <PrimaryButton onClick={() => setShowAddActivity(true)}>Add note</PrimaryButton>
              </div>
            </div>
            <div className="activity-list">
              {activities && activities.length ? (
                activities
                  .slice()
                  .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                  .map((act) => (
                    <article key={act.id} className="activity-item">
                      <span className="dot purple" />
                      <div>
                        <b>{act.title || 'Note'}</b>
                        <p className="muted">{act.message}</p>
                        <p className="muted small">{act.author || act.by} · {act.createdAt ? new Date((act.createdAt.seconds||0)*1000).toLocaleString() : ''}</p>
                      </div>
                    </article>
                  ))
              ) : (
                <div className="empty-activity">
                  <p className="description">No activity yet. Add a note for your team.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <section className="panel projects-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">PROJECTS</p>
              <h2>In progress</h2>
            </div>
            <NavLink to="/projects" className="text-link">
              View all <ArrowUpRight size={15} />
            </NavLink>
          </div>
          {visibleProjects.map((p) => (
            <ProjectRow key={p.id || p.name} project={p} />
          ))}
        </section>
      {showAddActivity && <AddActivity projects={projects} addActivity={addActivity} close={() => setShowAddActivity(false)} user={user} />}
      </section>
    </Shell>
  );
}
function Stat({ icon: Icon, label, value, change }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{change}</span>
      </div>
    </div>
  );
}
function Activity({ color, title, detail, project }) {
  const { clients, updateProject } = usePortalData();
  const [openMenu, setOpenMenu] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [quickProgress, setQuickProgress] = useState(project?.progress || 0);
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const openClient = () => {
    const clientObj = clients.find((c) => c.name === (project?.client || detail.split('·')[0].trim()));
    const target = clientObj ? `/clients/${clientObj.id}?view=projects` : '/clients';
    navigate(target);
  };

  const saveQuick = async () => {
    if (!project) return;
    const id = project.id || project.name.toLowerCase().replaceAll(' ', '-');
    try {
      await updateProject(id, { progress: Number(quickProgress) });
      showToast('Project progress saved', 'success');
      setShowQuick(false);
    } catch (err) {
      console.error(err);
      showToast('Unable to save progress', 'error');
    }
  };

  return (
    <div className="activity-item">
      <span className={"dot " + color} />
      <div>
        <b>{title}</b>
        <p>{detail}</p>
      </div>
      <div className="activity-actions">
        <button className="icon-button" onClick={() => setOpenMenu((s) => !s)} aria-label="More">
          <MoreHorizontal size={16} />
        </button>
        {openMenu && (
          <div className="menu-dropdown" onMouseLeave={() => setOpenMenu(false)}>
            <button className="menu-item" onClick={() => { setOpenMenu(false); openClient(); }}>Open project</button>
            <button className="menu-item" onClick={() => { setOpenMenu(false); setShowQuick(true); }}>Quick update progress</button>
            <button className="menu-item" onClick={() => { setOpenMenu(false); setShowEdit(true); }}>Edit project details</button>
          </div>
        )}
        {showQuick && (
          <div className="quick-update">
            <input type="range" min={0} max={100} value={quickProgress} onChange={(e) => setQuickProgress(Number(e.target.value))} />
            <div className="quick-actions">
              <button className="secondary-button" onClick={() => setShowQuick(false)}>Cancel</button>
              <button className="primary-button" onClick={saveQuick}>Save</button>
            </div>
          </div>
        )}
        {showEdit && project && <EditProject project={project} close={() => setShowEdit(false)} />}
      </div>
    </div>
  );
}
function ProjectRow({ project: p }) {
  const { updateProject, clients, deleteProject } = usePortalData();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [tempProgress, setTempProgress] = useState(p.progress || 0);
  const [displayedProgress, setDisplayedProgress] = useState(p.progress || 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTempProgress(p.progress || 0);
    setDisplayedProgress(p.progress || 0);
  }, [p.progress]);

  const { showToast } = useContext(ToastContext);

  const saveProgress = async () => {
    const newValue = Number(tempProgress);
    const prev = displayedProgress;
    // Optimistically update UI
    setDisplayedProgress(newValue);
    setEditing(false);
    setSaving(true);
    setError("");
    try {
      const id = p.id || p.name.toLowerCase().replaceAll(" ", "-");
      await updateProject(id, { progress: newValue });
      setSaved(true);
      showToast("Project progress saved", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Unable to update project progress", err);
      setDisplayedProgress(prev);
      setError("Unable to save progress");
      showToast("Unable to save progress", "error");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openClient = (e) => {
    e.stopPropagation();
    const clientObj = clients.find((c) => c.name === p.client);
    const target = clientObj ? `/clients/${clientObj.id}?view=projects` : '/clients';
    navigate(target);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete project "${p.name}"?`)) return;
    try {
      await deleteProject(p.id || p.name.toLowerCase().replaceAll(' ', '-'));
      showToast('Project deleted', 'success');
    } catch (error) {
      console.error('Unable to delete project', error);
      showToast('Unable to delete project', 'error');
    }
  };

  return (
    <div className="project-row" onClick={openClient} style={{ cursor: "pointer" }}>
      <div className="project-name">
        <span className="project-icon">
          <FolderKanban size={17} />
        </span>
        <div>
          <b>{p.name}</b>
          <p>{p.client}{p.assignedToName && <> · {p.assignedToName}</>}</p>
        </div>
      </div>
      <span className={"status " + p.status.toLowerCase().replaceAll(" ", "-")}>
        {p.status}
      </span>
      <div className="progress-wrap">
        <div>
          <span>Progress</span>
          {editing ? (
            <b>{tempProgress}%</b>
          ) : (
            <b>
              {displayedProgress}% {saving ? "(Saving…)" : saved ? "(Saved)" : <Pencil size={12} />}
            </b>
          )}
        </div>
        <div className="progress">
          {!editing ? (
            <div onClick={(e) => { e.stopPropagation(); setEditing(true); }} style={{ cursor: "pointer" }}>
              <i style={{ width: displayedProgress + "%" }} />
            </div>
          ) : (
            <div className="progress-edit">
              <input
                type="range"
                min={0}
                max={100}
                value={tempProgress}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTempProgress(Number(e.target.value))}
              />
              <div className="progress-edit-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(false);
                    setTempProgress(p.progress || 0);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="primary-button" onClick={(e) => { e.stopPropagation(); saveProgress(); }}>
                  OK
                </button>
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="due">
        <Clock3 size={15} />
        {p.due}
      </div>
      <div className="project-actions">
        {role === "administrator" && <button type="button" className="secondary-button project-delete" onClick={handleDelete}>
          Delete
        </button>}
        <button type="button" className="row-chevron icon-button" onClick={openClient}>
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

function Clients() {
  const { clients } = usePortalData();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="CLIENT MANAGEMENT"
          title="Clients"
          description="Manage client relationships, projects and creative deliverables."
        >
          <PrimaryButton onClick={() => setShowAdd(true)}>
            Add client
          </PrimaryButton>
        </PageHeader>
        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients"
            />
          </label>
          <button className="filter-button">
            Status: All <ChevronDown size={16} />
          </button>
        </div>
        <div className="client-table panel">
          <div className="table-head">
            <span>CLIENT</span>
            <span>CONTACT</span>
            <span>STATUS</span>
            <span>LAST ACTIVITY</span>
            <span />
          </div>
          {filtered.map((c) => (
            <NavLink className="client-row" to={"/clients/" + c.id} key={c.id}>
              <div className="client-name">
                <span
                  className="client-avatar"
                  style={{ background: c.color || "#8457ec" }}
                >
                  {c.initials}
                </span>
                <b>{c.name}</b>
              </div>
              <div className="contact">
                <b>{c.contact}</b>
                <p>{c.email}</p>
              </div>
              <span
                className={"status " + c.status.toLowerCase().replace(" ", "-")}
              >
                {c.status}
              </span>
              <span className="muted">{c.lastActivity}</span>
              <NavLink to={`/clients/${c.id}?view=projects`} className="text-link small">View projects</NavLink>
              <ChevronRight size={18} />
            </NavLink>
          ))}
        </div>
      </section>
      {showAdd && <AddClient close={() => setShowAdd(false)} />}
    </Shell>
  );
}
function AddClient({ close }) {
  const { addClient } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    try {
      await addClient({
        name,
        contact: form.get("contact"),
        email: form.get("email"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: "#8457ec",
      });
      close();
    } catch {
      setError("Unable to save this client. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">NEW RELATIONSHIP</p>
        <h2>Add client</h2>
        <p className="description">Create a profile for a new client.</p>
        <label>
          Company name
          <input name="name" required placeholder="e.g. ABC Media" />
        </label>
        <label>
          Primary contact
          <input name="contact" required placeholder="Full name" />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            placeholder="name@company.com"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Cancel
          </button>
          <PrimaryButton icon={CirclePlus}>
            {saving ? "Saving…" : "Create client"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function EditClient({ client, close }) {
  const { updateClient } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    try {
      await updateClient(client.id, {
        name,
        contact: form.get("contact"),
        email: form.get("email"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: form.get("color") || client.color,
      });
      close();
    } catch (err) {
      console.error(err);
      setError("Unable to update this client. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">EDIT CLIENT</p>
        <h2>Edit client</h2>
        <p className="description">Update client profile details.</p>
        <label>
          Company name
          <input name="name" defaultValue={client.name} required />
        </label>
        <label>
          Primary contact
          <input name="contact" defaultValue={client.contact} required />
        </label>
        <label>
          Email address
          <input name="email" type="email" defaultValue={client.email} required />
        </label>
        <label>
          Colour
          <input name="color" defaultValue={client.color} placeholder="#8457ec" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Cancel
          </button>
          <PrimaryButton icon={Pencil}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function EditProject({ project, close }) {
  const { updateProject } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const id = project.id || project.name.toLowerCase().replaceAll(' ', '-');
    try {
      await updateProject(id, {
        name: form.get('name'),
        status: form.get('status'),
        due: form.get('due') || project.due,
      });
      close();
    } catch (err) {
      console.error(err);
      setError('Unable to update project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">EDIT PROJECT</p>
        <h2>Edit project</h2>
        <label>
          Project name
          <input name="name" defaultValue={project.name} required />
        </label>
        <label>
          Status
          <select name="status" defaultValue={project.status}>
            <option>Pre-production</option>
            <option>In production</option>
            <option>Review</option>
          </select>
        </label>
        <label>
          Due date
          <input name="due" type="date" defaultValue={project.due} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>Cancel</button>
          <PrimaryButton icon={Pencil}>{saving ? 'Saving…' : 'Save changes'}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function AddActivity({ projects, addActivity, close, user }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const title = form.get('title');
    const message = form.get('message');
    const projectId = form.get('project') || null;
    const projectObj = projects.find((p) => (p.id === projectId) || (p.name && p.name.toLowerCase().replaceAll(' ', '-') === projectId));
    try {
      await addActivity({ title, message, project: projectObj ? projectObj.name : null, projectId: projectObj ? (projectObj.id || projectObj.name.toLowerCase().replaceAll(' ', '-')) : null, author: user?.displayName || user?.email });
      close();
    } catch (err) {
      console.error(err);
      setError('Unable to add note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}><X size={18} /></button>
        <p className="eyebrow">NEW NOTE</p>
        <h2>Add note</h2>
        <label>
          Title
          <input name="title" placeholder="Short headline" />
        </label>
        <label>
          Message
          <textarea name="message" required placeholder="Write an important note or notice for the team." />
        </label>
        <label>
          Related project (optional)
          <select name="project" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => {
              const id = p.id || p.name.toLowerCase().replaceAll(' ', '-');
              return <option key={id} value={id}>{p.name}</option>
            })}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>Cancel</button>
          <PrimaryButton icon={Plus}>{saving ? 'Saving…' : 'Add note'}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

function ClientProfile() {
  const { id } = useParams();
  const { clients, projects, assets, users } = usePortalData();
  const location = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const client = clients.find((c) => c.id === id);
  const search = new URLSearchParams(location.search);
  const showAllProjects = search.get('view') === 'projects';
  if (!client)
    return (
      <Shell>
        <section className="page">
          <p className="description">Client not found.</p>
        </section>
      </Shell>
    );
  return (
    <Shell>
      <section className="page">
        <div className="client-hero">
          <span
            className="client-avatar large"
            style={{ background: client.color || "#8457ec" }}
          >
            {client.initials}
          </span>
          <div>
            <p className="eyebrow">CLIENT PROFILE</p>
            <h1>{client.name}</h1>
            <p>
              {client.contact} · {client.email}
            </p>
          </div>
          <div className="hero-actions">
            <button className="secondary-button" onClick={() => setShowEdit(true)}>
              <Pencil size={16} />
              Edit client
            </button>
            <PrimaryButton onClick={() => setShowCreate(true)}>New project</PrimaryButton>
          </div>
        </div>
        <div className="profile-grid">
          <section className="panel">
            <div className="panel-title">
              <div>
                <p className="eyebrow">ACTIVE PROJECTS</p>
                <h2>Current work</h2>
              </div>
            </div>
            {(() => {
              const clientProjects = projects.filter((p) => p.client === client.name);
              const toShow = showAllProjects ? clientProjects : clientProjects.slice(0, 2);
              return toShow.map((p) => (
                <ProjectRow key={p.id || p.name} project={p} />
              ));
            })()}
          </section>
          <section className="panel client-info">
            <p className="eyebrow">CLIENT DETAILS</p>
            <dl>
              <div>
                <dt>Primary contact</dt>
                <dd>{client.contact}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{client.email}</dd>
              </div>
              <div>
                <dt>Client since</dt>
                <dd>March 2024</dd>
              </div>
              <div>
                <dt>Account manager</dt>
                <dd>Mark Wolfgramm</dd>
              </div>
            </dl>
          </section>
        </div>
        <section className="panel profile-content">
          <div className="panel-title">
            <div>
              <p className="eyebrow">RECENT CONTENT</p>
              <h2>Latest deliverables</h2>
            </div>
            <NavLink className="text-link" to="/content">
              View library <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <div className="asset-row">
            {assets
              .filter((a) => a.client === client.name)
              .slice(0, 3)
              .map((a) => (
                <AssetCard key={a.id} asset={a} compact />
              ))}
          </div>
        </section>
        {showEdit && <EditClient client={client} close={() => setShowEdit(false)} />}
        {showCreate && <AddProject clients={clients} users={users} defaultClientId={client.id} close={() => setShowCreate(false)} />}
      </section>
    </Shell>
  );
}

function Content() {
  const { assets, clients } = usePortalData();
  const location = useLocation();
  const [filter, setFilter] = useState("All content");
  const [sortNewest, setSortNewest] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddLink, setShowAddLink] = useState(
    location.search.includes("link=1")
  );
  const [viewing, setViewing] = useState(null);
  let shown =
    filter === "All content" ? assets : assets.filter((a) => a.type === filter);
  
  // Filter by search query
  if (searchQuery.trim()) {
    shown = shown.filter((a) => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.client?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Sort by date if enabled
  if (sortNewest) {
    const dateOrder = { "Today": 0, "Yesterday": 1, "14 Aug": 2, "12 Aug": 3, "10 Aug": 4, "8 Aug": 5 };
    shown = shown.slice().sort((a, b) => (dateOrder[a.date] ?? 999) - (dateOrder[b.date] ?? 999));
  }
  
  const latestVideos = assets.filter((asset) => asset.type === "Video");
  const featured = latestVideos.length > 0 ? latestVideos[0] : assets[0];
  const thumbnailUrl = featured ? getContentThumbnail(featured) : null;
  const featureStyle = thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(9,9,13,0.6), rgba(9,9,13,0.8)), url("${thumbnailUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: featured?.image || "linear-gradient(135deg,#5133a0,#171421)" };
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="CREATIVE ASSETS"
          title="Content library"
          description="One place for every deliverable, review and approved asset."
        >
          <PrimaryButton onClick={() => setShowAddLink(true)}>
            Add content link
          </PrimaryButton>
        </PageHeader>
        <div className="content-toolbar">
          <label className="search">
            <Search size={18} />
            <input 
              placeholder="Search content" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <div className="segmented">
            {["All content", "Video", "Photo", "Document"].map((t) => (
              <button
                className={filter === t ? "active" : ""}
                onClick={() => setFilter(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {featured ? (
          <div className="content-feature">
            <div className="feature-art" style={featureStyle}>
              <span>
                FEATURED
                <br />
                DELIVERY
              </span>
              <button
                className="feature-play"
                onClick={() => setViewing(featured)}
              >
                <Play size={18} fill="currentColor" />
              </button>
            </div>
            <div className="feature-copy">
              <p className="eyebrow">FEATURED DELIVERY</p>
              <h2>{featured.title}</h2>
              <p>
                {featured.description ||
                  "No description has been added for this delivery."}
              </p>
              <div>
                <span>{featured.client}</span>
                <span>·</span>
                <span>{featured.type}</span>
              </div>
              <button
                className="secondary-button"
                onClick={() => setViewing(featured)}
              >
                <Play size={16} />
                View in portal
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-feature">
            <p className="eyebrow">CONTENT LIBRARY</p>
            <h2>Add your first delivery</h2>
            <p>
              Save a video, image, or document share link to start your client
              library.
            </p>
          </div>
        )}
        <div className="library-label">
          <h2>
            All content <span>{shown.length}</span>
          </h2>
          <button className="filter-button" onClick={() => setSortNewest(!sortNewest)}>
            {sortNewest ? "Newest first" : "Oldest first"} <ChevronDown size={16} />
          </button>
        </div>
        <div className="asset-grid">
          {shown.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </section>
      {showAddLink && (
        <AddContentLink clients={clients} close={() => setShowAddLink(false)} />
      )}{" "}
      {viewing && (
        <MediaViewer asset={viewing} close={() => setViewing(null)} />
      )}
    </Shell>
  );
}
function AddContentLink({ clients, close }) {
  const { addContentLink } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const client = clients.find((item) => item.id === form.get("clientId"));
    if (!client) {
      setError("Choose a client.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const thumbnailUrl = form.get("thumbnailUrl")?.trim();
      await addContentLink({
        clientId: client.id,
        client: client.name,
        title: form.get("title"),
        description: form.get("description"),
        type: form.get("type"),
        externalUrl: form.get("externalUrl"),
        thumbnailUrl: thumbnailUrl || getContentThumbnail({ url: form.get("externalUrl") }) || null,
      });
      close();
    } catch (err) {
      console.error(err);
      setError("Unable to save this content link. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-backdrop">
      <form className="modal upload-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">NEW DELIVERABLE</p>
        <h2>Add content link</h2>
        <p className="description">
          Paste a share link from Google Drive, YouTube, Vimeo, Dropbox, or
          another approved host.
        </p>
        <label>
          Client
          <select name="clientId" required defaultValue="">
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Content title
          <input
            name="title"
            required
            placeholder="e.g. Summer campaign final film"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            required
            placeholder="Describe the delivery, version, approval status, or intended usage."
          />
        </label>
        <label>
          Content type
          <select name="type" defaultValue="Video">
            <option>Video</option>
            <option>Photo</option>
            <option>Document</option>
          </select>
        </label>
        <label>
          Share link
          <input
            name="externalUrl"
            type="url"
            required
            placeholder="https://…"
          />
        </label>
        <label>
          Thumbnail / cover image URL (optional)
          <input
            name="thumbnailUrl"
            type="url"
            placeholder="https://…"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Cancel
          </button>
          <PrimaryButton icon={Plus}>
            {saving ? "Saving…" : "Add content link"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
function Projects() {
  const { projects, clients, users } = usePortalData();
  const { user, role } = useAuth();
  const visibleProjects = role === "administrator"
    ? projects
    : projects.filter((project) => project.assignedTo === user?.email);
  const [showCreate, setShowCreate] = useState(false);
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="PRODUCTION PIPELINE"
          title="Projects"
          description="Track progress from first idea to final delivery."
        >
          {role === "administrator" && <PrimaryButton onClick={() => setShowCreate(true)}>New project</PrimaryButton>}
        </PageHeader>
        <section className="panel projects-panel">
          {visibleProjects.map((p) => (
            <ProjectRow key={p.id || p.name} project={p} />
          ))}
        </section>
      </section>
      {showCreate && <AddProject clients={clients} users={users} close={() => setShowCreate(false)} />}
    </Shell>
  );
}
function AddProject({ clients, users, close, defaultClientId }) {
  const { addProject } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const client = clients.find((item) => item.id === form.get("clientId"));
    if (!client) { setError("Choose a client."); return; }
    const assignee = users.find((item) => item.id === form.get("assignedTo"));
    if (!assignee) { setError("Choose an employee."); return; }
    setSaving(true); setError("");
    try {
      await addProject({ name: form.get("name"), client: client.name, status: form.get("status"), due: form.get("due") || "No due date", assignedTo: assignee.email, assignedToName: assignee.displayName || assignee.email });
      close();
    } catch (err) {
      console.error(err); setError("Unable to create the project. Please try again.");
    } finally { setSaving(false); }
  };
  return <div className="modal-backdrop"><form className="modal upload-modal" onSubmit={submit}>
    <button type="button" className="modal-close" onClick={close}><X size={18}/></button>
    <p className="eyebrow">PRODUCTION PIPELINE</p><h2>New project</h2><p className="description">Create a project and assign it to a client.</p>
    <label>Project name<input name="name" required placeholder="e.g. Autumn campaign"/></label>
    <label>Client<select name="clientId" required defaultValue={defaultClientId || ""}><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
    <label>Assign employee<select name="assignedTo" required defaultValue=""><option value="" disabled>Select an employee</option>{users.filter((item) => item.role !== "administrator").map((employee) => <option key={employee.id} value={employee.id}>{employee.displayName || employee.email}</option>)}</select></label>
    <label>Status<select name="status" defaultValue="Pre-production"><option>Pre-production</option><option>In production</option><option>Review</option></select></label>
    <label>Due date<input name="due" type="date"/></label>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><PrimaryButton icon={Plus}>{saving ? "Creating…" : "Create project"}</PrimaryButton></div>
  </form></div>;
}
function SettingsPage() {
  const { user } = useAuth();
  const { clearDemoData } = usePortalData();
  const [name, setName] = useState(
    user?.displayName || user?.email?.split("@")[0] || ""
  );
  const [message, setMessage] = useState("");
  const save = async () => {
    await saveProfile(name);
    setMessage("Profile saved. Refresh the page to update the sidebar name.");
  };
  const removeDemo = async () => {
    if (
      !window.confirm(
        "Remove only the seeded sample clients, projects and content? Your own new records are not deleted."
      )
    )
      return;
    await clearDemoData();
    setMessage("Sample data removed.");
  };
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="WORKSPACE"
          title="Settings"
          description="Manage your Wolfgramm Holdings workspace."
        />
        <section className="panel settings-panel">
          <p className="eyebrow">PROFILE</p>
          <h2>Your profile</h2>
          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={user?.email || ""} readOnly />
          </label>
          <PrimaryButton icon={Pencil} onClick={save}>
            Save changes
          </PrimaryButton>
          {message && <p className="settings-message">{message}</p>}
          <div className="danger-zone">
            <p className="eyebrow">DEMO DATA</p>
            <h3>Remove sample content</h3>
            <p>
              Deletes only the original ABC Media sample clients, projects, and
              content. Your own entries remain.
            </p>
            <button className="danger-button" onClick={removeDemo}>
              Remove demo data
            </button>
          </div>
        </section>
      </section>
    </Shell>
  );
}
function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await (isCreating
        ? createAccount(email, password, username)
        : signIn(email, password));
      nav("/dashboard");
    } catch (err) {
      console.error("Authentication failed", {
        code: err?.code,
        message: err?.message,
        error: err,
      });
      const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/email-already-in-use":
          "An account already exists with this email.",
        "auth/weak-password": "Use a password with at least 6 characters.",
        "auth/operation-not-allowed":
          "Enable Email/Password sign-in in Firebase Console → Authentication → Sign-in method.",
        "auth/configuration-not-found":
          "Firebase Authentication is not configured for this project.",
        "auth/invalid-api-key":
          "The Firebase API key is invalid. Check the Vercel environment variables.",
        "auth/network-request-failed":
          "Network error. Check your internet connection and try again.",
        "auth/too-many-requests":
          "Too many attempts. Wait a moment and try again.",
      };
      setError(
        messages[err?.code] ||
          `Authentication failed${err?.code ? ` (${err.code})` : ""}. ${
            err?.message || "Check the browser console for details."
          }`,
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="login">
      <div className="login-brand">
        <span className="brand-mark">W</span>WOLFGRAMM
      </div>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">CLIENT PORTAL</p>
        <h1>{isCreating ? "Create your account." : "Welcome back."}</h1>
        <p>
          {isCreating
            ? "Set up your secure Wolfgramm portal account."
            : "Sign in to access your client work and deliverables."}
        </p>
        {isCreating && (
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isCreating ? "new-password" : "current-password"}
            minLength="6"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button full" disabled={submitting}>
          {submitting
            ? "Please wait…"
            : isCreating
            ? "Create account"
            : "Sign in"}
        </button>
        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setIsCreating(!isCreating);
            setError("");
          }}
        >
          {isCreating
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading portal…</div>;
  return user ? children : <Navigate to="/login" replace />;
}
function AdministratorRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="auth-loading">Loading portal…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return role === "administrator" ? children : <Navigate to="/dashboard" replace />;
}
export default function App() {
  return (
    <AuthProvider>
      <PortalDataProvider>
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
              <AdministratorRoute>
                <ClientProfile />
              </AdministratorRoute>
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
      </PortalDataProvider>
    </AuthProvider>
  );
}
