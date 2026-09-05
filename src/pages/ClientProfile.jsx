import { useContext, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PrimaryButton } from "../components/ui";
import { AssetCard } from "../components/AssetCard";
import { ProjectRow } from "../components/ProjectRow";
import { EditClient } from "./Clients";
import { AddProject } from "./Projects";
import { AddContentLink } from "./Content";
import { ToastContext } from "../lib/ToastContext";

export function ClientProfile() {
  const { id } = useParams();
  const { clients, projects, assets, users, deleteClient, loading } = usePortalData();
  const { role } = useAuth();
  const canManage = role === "administrator";
  const canDelete = role === "administrator";
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const client = clients.find((c) => c.id === id);
  const handleDelete = async () => {
    if (!client) return;
    if (!window.confirm(`Delete ${client.name}? This permanently removes its projects and resources, and unassigns its users. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteClient(client.id);
      showToast("Client deleted", "success");
      navigate("/clients");
    } catch (err) {
      console.error("Unable to delete client", err);
      showToast(err.message || "Unable to delete client", "error");
      setDeleting(false);
    }
  };
  if (!client)
    return (
      <Shell>
        <section className="page">
          <p className="description">{loading ? "Loading organisation..." : "Organisation not found or unavailable. Contact Jay if you need access."}</p>
        </section>
      </Shell>
    );
  return (
    <Shell>
      <section className="page">
        {role === "administrator" && <NavLink className="back-link" to="/clients"><ArrowLeft size={16} aria-hidden="true" />Back to clients</NavLink>}
        <div className="client-hero">
          <span
            className="client-avatar large"
            style={{ background: client.color || "#8457ec" }}
          >
            {client.initials}
          </span>
          <div className="client-hero-details">
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
              {canDelete && (
                <button className="secondary-button project-delete" onClick={handleDelete} disabled={deleting}>
                  <Trash2 size={16} />
                  {deleting ? "Deleting…" : "Delete client"}
                </button>
              )}
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
              const clientProjects = projects.filter((p) => p.clientId === client.id);
              const toShow = clientProjects;
              if (!toShow.length) return <p className="description">No projects have been shared with this organisation yet.</p>;
              return toShow.map((p) => (
                <ProjectRow key={p.id || p.name} project={p} />
              ));
            })()}
          </section>
          <section className="panel client-info">
            <p className="eyebrow">CLIENT DETAILS</p>
            <dl>
              <div>
                <dt>Full name</dt>
                <dd>{client.contact}</dd>
              </div>
              <div>
                <dt>Contact email</dt>
                <dd>{client.email}</dd>
              </div>
              {client.contactNumber && <div>
                <dt>Contact number</dt>
                <dd>{client.contactNumber}</dd>
              </div>}
              {client.companyEmail && (
                <div>
                  <dt>Company email</dt>
                  <dd>{client.companyEmail}</dd>
                </div>
              )}
              <div>
                <dt>Client since</dt>
                <dd>{client.createdAt?.toDate ? client.createdAt.toDate().toLocaleDateString() : "Not recorded"}</dd>
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
              <p className="eyebrow">PROJECT RESOURCES</p>
              <h2>Everything Jay has shared</h2>
            </div>
            {canManage && <PrimaryButton icon={Plus} onClick={() => setShowAddResource(true)}>Add resource</PrimaryButton>}
          </div>
          {projects.filter((p) => p.clientId === client.id).map((project) => {
            const projectAssets = assets.filter((asset) => asset.projectId === project.id && asset.clientId === client.id);
            return <div className="project-resource-group" id={`project-${project.id}`} key={project.id || project.name}>
              <div><h3>{project.name}</h3><p className="description">{project.description || "Resources shared for this project."}</p></div>
              {projectAssets.length ? <div className="asset-row">{projectAssets.map((asset) => <AssetCard key={asset.id} asset={asset} compact />)}</div> : <p className="description">No resources have been added to this project yet.</p>}
            </div>;
          })}
          {!projects.some((p) => p.clientId === client.id) && <p className="description">No projects or resources have been shared yet.</p>}
        </section>
        {showEdit && <EditClient client={client} close={() => setShowEdit(false)} />}
        {showCreate && <AddProject clients={clients} users={users} defaultClientId={client.id} close={() => setShowCreate(false)} />}
        {showAddResource && <AddContentLink clients={[client]} projects={projects.filter((p) => p.clientId === client.id)} defaultClientId={client.id} close={() => setShowAddResource(false)} />}
      </section>
    </Shell>
  );
}
