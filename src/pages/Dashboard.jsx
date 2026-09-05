import { useContext, useState } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { ArrowUpRight, FolderKanban, Film, Pencil, Trash2, Users } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { AssetCard } from "../components/AssetCard";
import { ProjectRow } from "../components/ProjectRow";
import { AddActivity } from "./Projects";
import { ToastContext } from "../lib/ToastContext";

export function Dashboard() {
  const { clients, assets, projects, activities, addActivity } = usePortalData();
  const { user, role, clientId } = useAuth();
  const navigate = useNavigate();
  const [showAddActivity, setShowAddActivity] = useState(false);
  if (role === "client") {
    return clientId ? <Navigate to={`/clients/${clientId}`} replace /> : <Shell><section className="page"><PageHeader eyebrow="CLIENT DASHBOARD" title="Welcome to your dashboard" description="Your account is ready. Jay needs to assign your organisation before projects and resources become available." /></section></Shell>;
  }
  const visibleProjects = role === "administrator"
    ? projects
    : projects.filter((project) => project.assignedTo === user?.email);
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
            to="/clients"
            value={clients.length}
            change="Live Firestore data"
          />
          <Stat
            icon={FolderKanban}
            label="Live projects"
            to="/projects"
            value={visibleProjects.length}
            change="Production pipeline"
          />
          <Stat
            icon={Film}
            label="Content delivered"
            to="/content"
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
                    <ActivityItem key={act.id} activity={act} currentUser={user} />
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

export function Stat({ icon: Icon, label, value, change, to }) {
  return (
    <Link to={to} className="stat-card stat-link" aria-label={`Open ${label === "Content delivered" ? "content library" : label.toLowerCase()}`}>
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{change}</span>
      </div>
      <ArrowUpRight className="stat-link-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}

function ActivityItem({ activity: act, currentUser }) {
  const { updateActivity, deleteActivity } = usePortalData();
  const { role } = useAuth();
  const { showToast } = useContext(ToastContext);
  const canManage = role === "administrator" || role === "employee" || act.author === (currentUser?.displayName || currentUser?.email);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(act.title || "");
  const [message, setMessage] = useState(act.message || "");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateActivity(act.id, { title, message });
      setEditing(false);
      showToast("Note updated", "success");
    } catch (err) {
      console.error("Unable to update note", err);
      showToast("Unable to update note", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await deleteActivity(act.id);
      showToast("Note deleted", "success");
    } catch (err) {
      console.error("Unable to delete note", err);
      showToast("Unable to delete note", "error");
    }
  };

  if (editing) {
    return (
      <article className="activity-item">
        <span className="dot purple" />
        <form className="activity-edit" onSubmit={save}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <PrimaryButton icon={Pencil}>{saving ? "Saving…" : "Save"}</PrimaryButton>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="activity-item">
      <span className="dot purple" />
      <div>
        <b>{act.title || "Note"}</b>
        <p className="muted">{act.message}</p>
        <p className="muted small">{act.author || act.by} · {act.createdAt ? new Date((act.createdAt.seconds||0)*1000).toLocaleString() : ''}</p>
      </div>
      {canManage && (
        <div className="activity-item-actions">
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit note">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={remove} aria-label="Delete note">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </article>
  );
}
