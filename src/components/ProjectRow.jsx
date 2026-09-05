import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock3,
  FolderKanban,
  Pencil,
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { EditProject } from "../pages/Projects";
import { ToastContext } from "../lib/ToastContext";

export function ProjectRow({ project: p }) {
  const { updateProject, clients, deleteProject } = usePortalData();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const getProgress = () => {
    return Math.min(
      100,
      Math.max(0, Number(p.progress) || 0)
    );
  };

  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempProgress, setTempProgress] = useState(getProgress());
  const [displayedProgress, setDisplayedProgress] =
    useState(getProgress());

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const progress = Math.min(
      100,
      Math.max(0, Number(p.progress) || 0)
    );

    if (!editing && !saving) {
      setDisplayedProgress(progress);
      setTempProgress(progress);
    }
  }, [p.id, p.progress, editing, saving]);

  const openClient = (e) => {
    e.stopPropagation();

    const clientObj = clients.find(
      (client) => client.id === p.clientId
    );

    const target = clientObj
      ? `/clients/${clientObj.id}?view=projects#project-${p.id}`
      : "/clients";

    navigate(target);
  };

  const startEditing = (e) => {
    e.stopPropagation();

    setTempProgress(displayedProgress);
    setError("");
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();

    setEditing(false);
    setTempProgress(displayedProgress);
    setError("");
  };

  const saveProgress = async (e) => {
    e.stopPropagation();

    const newValue = Math.min(
      100,
      Math.max(0, Number(tempProgress) || 0)
    );

    const previousValue = displayedProgress;

    setDisplayedProgress(newValue);
    setEditing(false);
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const id =
        p.id ||
        p.name
          .toLowerCase()
          .replace(/\s+/g, "-");

      await updateProject(id, {
        progress: newValue,
      });

      setSaved(true);

      showToast(
        "Project progress saved",
        "success"
      );

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Unable to update project progress",
        err
      );

      setDisplayedProgress(previousValue);
      setTempProgress(previousValue);
      setError("Unable to save progress");

      showToast(
        "Unable to save progress",
        "error"
      );

      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Delete project "${p.name}" and all its resources? This cannot be undone.`
    );

    if (!confirmed || deleting) return;
    setDeleting(true);

    try {
      const id =
        p.id ||
        p.name
          .toLowerCase()
          .replace(/\s+/g, "-");

      await deleteProject(id);

      showToast(
        "Project deleted",
        "success"
      );
    } catch (err) {
      console.error(
        "Unable to delete project",
        err
      );

      showToast(
        err.message || "Unable to delete project",
        "error"
      );
    } finally { setDeleting(false); }
  };

  const changeStatus = async (e) => {
    e.stopPropagation();
    const status = e.target.value;
    try {
      const id = p.id || p.name.toLowerCase().replace(/\s+/g, "-");
      await updateProject(id, { status });
      showToast("Project status updated", "success");
    } catch (err) {
      console.error("Unable to update project status", err);
      showToast(err?.code === "permission-denied"
        ? "Project update denied. Confirm your user role is administrator and publish the latest Firestore rules."
        : err?.message || "Unable to update project status", "error");
    }
  };

  return (
    <>
    <div
      className="project-row"
      onClick={openClient}
      style={{ cursor: "pointer" }}
    >
      <div className="project-name">
        <span className="project-icon">
          <FolderKanban size={17} />
        </span>

        <div>
          <b>{p.name}</b>
          {p.description && <p className="project-description">{p.description}</p>}

          <p>
            {clients.find(client => client.id === p.clientId)?.name || p.client}

            {p.assignedToName && (
              <> · {p.assignedToName}</>
            )}
          </p>
        </div>
      </div>

      {role === "administrator" ? (
        <select
          className={
            "status status-select " +
            String(p.status || "")
              .toLowerCase()
              .replace(/\s+/g, "-")
          }
          value={p.status || "Pre-production"}
          onChange={changeStatus}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Change status for ${p.name}`}
        >
          <option>Pre-production</option>
          <option>In production</option>
          <option>Review</option>
          <option>Complete</option>
          <option>On hold</option>
        </select>
      ) : (
        <span
          className={
            "status " +
            String(p.status || "")
              .toLowerCase()
              .replace(/\s+/g, "-")
          }
        >
          {p.status}
        </span>
      )}

      <div
        className="progress-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="progress-header">
          <span>Progress</span>

          {editing && role === "administrator" ? (
            <b>{tempProgress}%</b>
          ) : role !== "administrator" ? (
            <b>{displayedProgress}%</b>
          ) : (
            <button
              type="button"
              className="progress-value-button"
              onClick={startEditing}
              disabled={saving}
            >
              <b>{displayedProgress}%</b>

              {!saving && !saved && (
                <Pencil size={12} />
              )}
            </button>
          )}
        </div>

        {role !== "administrator" ? (
          <div className="progress-bar-button" aria-hidden="true">
            <span
              className="progress-fill"
              style={{
                width: `${displayedProgress}%`,
              }}
            />
          </div>
        ) : !editing ? (
          <button
            type="button"
            className="progress-bar-button"
            onClick={startEditing}
            disabled={saving}
            aria-label="Edit project progress"
          >
            <span
              className="progress-fill"
              style={{
                width: `${displayedProgress}%`,
              }}
            />
          </button>
        ) : (
          <div className="progress-edit">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={tempProgress}
              onChange={(e) => {
                setTempProgress(
                  Number(e.target.value)
                );
              }}
            />

            <div className="progress-edit-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEditing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveProgress}
                disabled={saving}
              >
                {saving ? "Saving..." : "OK"}
              </button>
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}
          </div>
        )}

        {!editing && saving && (
          <small className="progress-saving">
            Saving...
          </small>
        )}

        {!editing && saved && (
          <small className="progress-saved">
            Saved
          </small>
        )}
      </div>

      <div className="due">
        <Clock3 size={15} />
        {p.due}
      </div>

      <div className="project-actions">
        {role === "administrator" && <button className="secondary-button" onClick={e => { e.stopPropagation(); setShowEdit(true); }}>Edit</button>}
        {role === "administrator" && (
          <button
            type="button"
            className="secondary-button project-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            Delete
          </button>
        )}

        <button
          type="button"
          className="row-chevron icon-button"
          onClick={openClient}
          aria-label={`View resources for ${p.name}`}
        >
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
    {showEdit && <EditProject project={p} close={() => setShowEdit(false)} />}
    </>
  );
}
