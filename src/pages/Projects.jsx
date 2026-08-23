import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { ProjectRow } from "../components/ProjectRow";

export function EditProject({ project, close }) {
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


export function AddActivity({ projects, addActivity, close, user }) {
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


export function Projects() {
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
export function AddProject({ clients, users, close, defaultClientId }) {
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
      await addProject({ name: form.get("name"), clientId: client.id, client: client.name, status: form.get("status"), due: form.get("due") || "No due date", assignedTo: assignee.email, assignedToName: assignee.displayName || assignee.email });
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
