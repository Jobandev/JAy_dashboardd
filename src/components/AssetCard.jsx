import { createPortal } from "react-dom";
import { ToastContext } from "../lib/ToastContext";
import { safeResourceUrl } from "../lib/media";
import { useContext, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, FileText, MessageCircle, Pencil, Play, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { getContentThumbnail, toEmbedUrl } from "../lib/media";
import { CONTENT_TYPES, typeIcon } from "../lib/contentTypes";
import { formatContentPostedAt } from "../lib/contentDate";
import { getResourceFeedback, saveResourceFeedback } from "../firebase/portalService";

export function MediaViewer({ asset, close }) {
  const ref = useRef(null);
  const url = safeResourceUrl(asset.url || asset.externalUrl);
  const isVideo = asset.type === 'Video';
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const isImage = ['Image', 'Photo'].includes(asset.type);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const items = [...ref.current.querySelectorAll('button, a[href], video, iframe, [tabindex="0"]')];
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [close]);
  return createPortal(<div className="modal-backdrop media-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
    <section ref={ref} className="media-viewer" role="dialog" aria-modal="true" aria-label={asset.title}>
      <button className="modal-close" onClick={close} aria-label="Close viewer"><X size={18} /> Close</button>
      {url && (isVideo || isImage || asset.type === 'Document') && <div className="media-frame">
        {isImage ? <img src={url} alt={asset.title} /> : isVideo && isDirectVideo ? <video src={url} controls autoPlay playsInline poster={getContentThumbnail(asset) || undefined} /> : <iframe src={toEmbedUrl(url)} title={asset.title} allow="autoplay; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" />}
      </div>}
      <p className="eyebrow">{asset.type}</p><h2>{asset.title}</h2>
      {asset.quoteText && <blockquote>{asset.quoteText}{asset.quoteAuthor && <footer>- {asset.quoteAuthor}</footer>}</blockquote>}
      <p className="description">{asset.description || 'No description has been added.'}</p>
      {url && <a className="secondary-button" href={url} target="_blank" rel="noopener noreferrer">Open original resource <ArrowUpRight size={16} /></a>}
      {url && <p className="description">If the preview is unavailable, open the original resource.</p>}
    </section>
  </div>, document.body);
}
export function AssetCard({ asset, compact = false }) {
  const [viewing, setViewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const { showToast } = useContext(ToastContext);
  const { deleteContent, projects } = usePortalData();
  const { role, user } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const canManage = role === "administrator";
  const Icon = typeIcon[asset.type] || FileText;
  const contentUrl = safeResourceUrl(asset.url || asset.externalUrl);
  const previewUrl = getContentThumbnail(asset);
  const projectName = projects.find(project => project.id === asset.projectId)?.name;
  useEffect(() => {
    if (role === 'client' && user?.uid && asset.id) getResourceFeedback(asset.id, user.uid).then(setFeedback).catch(() => {});
  }, [asset.id, role, user?.uid]);
  const setClientFeedback = async (status) => {
    setFeedbackSaving(true);
    try { await saveResourceFeedback(asset.id, user.uid, status); setFeedback({ status }); showToast(status === 'viewed' ? 'Marked as viewed' : 'Jay will see this needs discussion', 'success'); }
    catch (error) { showToast(error.message || 'Unable to save feedback', 'error'); }
    finally { setFeedbackSaving(false); }
  };
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
      showToast("Resource deleted", "success");
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
            {formatContentPostedAt(asset)}
          </p>
          {projectName && <p className="asset-project"><span>PROJECT</span>{projectName}</p>}
          <p className="asset-description">
            {asset.description || "No description added."}
          </p>
          <div className="asset-actions">
            {role === 'client' && <>
              <button className={`feedback-button ${feedback?.status === 'viewed' ? 'selected' : ''}`} disabled={feedbackSaving} onClick={() => setClientFeedback('viewed')}><Check size={14} /> Viewed</button>
              <button className={`feedback-button ${feedback?.status === 'needs-discussion' ? 'selected discussion' : ''}`} disabled={feedbackSaving} onClick={() => setClientFeedback('needs-discussion')}><MessageCircle size={14} /> Needs discussion</button>
            </>}
            {canManage && <button className="asset-open" onClick={() => setEditing(true)}><Pencil size={12} /> Edit</button>}
            {(contentUrl || asset.type === "Testimonial") && (
              <button className="asset-open" onClick={() => setViewing(true)}>
                View in portal <ArrowUpRight size={12} />
              </button>
            )}
            {canManage && <button className="asset-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>}
          </div>
        </div>
      </article>
      {viewing && <MediaViewer asset={asset} close={() => setViewing(false)} />}
      {editing && <EditResource asset={asset} close={() => setEditing(false)} />}
    </>
  );
}

function EditResource({ asset, close }) {
  const { updateContent, projects } = usePortalData();
  const [resourceType, setResourceType] = useState(asset.type);
  const { showToast } = useContext(ToastContext);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true); setError("");
    try {
      await updateContent(asset.id, { title: form.get("title"), description: form.get("description"), type: form.get("type"), projectId: form.get("projectId"), quoteText: form.get("quoteText") || "", quoteAuthor: form.get("quoteAuthor") || "", url: form.get("externalUrl"), externalUrl: form.get("externalUrl"), thumbnailUrl: form.get("thumbnailUrl") });
      showToast("Resource updated", "success");
      close();
    } catch (err) { console.error(err); setError("Unable to update this resource."); }
    finally { setSaving(false); }
  };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="modal upload-modal" onSubmit={submit}>
    <button type="button" className="modal-close" onClick={close} aria-label="Close"><X size={18}/></button>
    <p className="eyebrow">EDIT RESOURCE</p><h2>Update resource</h2>
    <label>Project<select name="projectId" required defaultValue={asset.projectId || ""}><option value="" disabled>Select a project</option>{projects.filter(p => p.clientId === asset.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    {resourceType === "Testimonial" && <><label>Quote<textarea name="quoteText" defaultValue={asset.quoteText || ""}/></label><label>Attribution<input name="quoteAuthor" defaultValue={asset.quoteAuthor || ""}/></label></>}
    <label>Title<input name="title" required defaultValue={asset.title}/></label>
    <label>Description<textarea name="description" defaultValue={asset.description || ""}/></label>
    <label>Type<select name="type" value={resourceType} onChange={event => setResourceType(event.target.value)}>{CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
    <label>Share link<input name="externalUrl" type="url" defaultValue={asset.externalUrl || asset.url || ""}/></label>
    <label>Thumbnail / cover URL<input name="thumbnailUrl" type="url" defaultValue={asset.thumbnailUrl || ""}/></label>
    {error && <p className="form-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div>
  </form></div>;
}
