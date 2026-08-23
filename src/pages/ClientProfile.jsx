import { useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { ArrowUpRight, Pencil } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PrimaryButton } from "../components/ui";
import { AssetCard } from "../components/AssetCard";
import { ProjectRow } from "../components/ProjectRow";
import { EditClient } from "./Clients";
import { AddProject } from "./Projects";

export function ClientProfile() {
  const { id } = useParams();
  const { clients, projects, assets, users } = usePortalData();
  const { role } = useAuth();
  const canManage = role === "administrator" || role === "employee";
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
          {canManage && (
            <div className="hero-actions">
              <button className="secondary-button" onClick={() => setShowEdit(true)}>
                <Pencil size={16} />
                Edit client
              </button>
              <PrimaryButton onClick={() => setShowCreate(true)}>New project</PrimaryButton>
            </div>
          )}
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
              const clientProjects = projects.filter((p) => (p.clientId ? p.clientId === client.id : p.client === client.name));
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
                <dd>Jay Downes</dd>
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
              .filter((a) => (a.clientId ? a.clientId === client.id : a.client === client.name))
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

