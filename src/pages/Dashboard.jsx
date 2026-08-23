import { useState } from "react";
import { NavLink, Navigate, useNavigate } from "react-router-dom";
import { ArrowUpRight, FolderKanban, Film, Users } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { AssetCard } from "../components/AssetCard";
import { ProjectRow } from "../components/ProjectRow";
import { AddActivity } from "./Projects";

export function Dashboard() {
  const { clients, assets, projects, activities, addActivity } = usePortalData();
  const { user, role, clientId } = useAuth();
  const navigate = useNavigate();
  const [showAddActivity, setShowAddActivity] = useState(false);
  if (role === "client") {
    return <Navigate to={clientId ? `/clients/${clientId}` : "/settings"} replace />;
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
