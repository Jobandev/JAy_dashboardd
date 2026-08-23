import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, FolderKanban, Pencil } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { ToastContext } from "../lib/ToastContext";

export function ProjectRow({ project: p }) {
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

