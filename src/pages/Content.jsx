import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Play, Plus, Search, X } from "lucide-react";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { AssetCard, MediaViewer } from "../components/AssetCard";
import { getContentThumbnail } from "../lib/media";
import { CONTENT_TYPES } from "../lib/contentTypes";

export function Content() {
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
            {["All content", ...CONTENT_TYPES].map((t) => (
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
export function AddContentLink({ clients, close }) {
  const { addContentLink } = usePortalData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("Video");
  const isTestimonial = type === "Testimonial";
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
      const externalUrl = form.get("externalUrl")?.trim();
      const quoteText = isTestimonial ? form.get("quoteText")?.trim() || "" : "";
      const quoteAuthor = isTestimonial ? form.get("quoteAuthor")?.trim() || "" : "";
      await addContentLink({
        clientId: client.id,
        client: client.name,
        title: form.get("title"),
        description: form.get("description") || (isTestimonial ? `“${quoteText}”${quoteAuthor ? ` — ${quoteAuthor}` : ""}` : ""),
        type,
        quoteText,
        quoteAuthor,
        externalUrl: externalUrl || "",
        thumbnailUrl: thumbnailUrl || (externalUrl ? getContentThumbnail({ url: externalUrl }) : null),
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
          another approved host — or add a testimonial quote directly.
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
            required={!isTestimonial}
            placeholder="Describe the delivery, version, approval status, or intended usage."
          />
        </label>
        <label>
          Content type
          <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {CONTENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {isTestimonial ? (
          <>
            <label>
              Testimonial quote
              <textarea
                name="quoteText"
                required
                placeholder="Paste the client's testimonial here."
              />
            </label>
            <label>
              Attributed to
              <input
                name="quoteAuthor"
                placeholder="e.g. Sarah Walker, ABC Media"
              />
            </label>
            <label>
              Source link (optional)
              <input name="externalUrl" type="url" placeholder="https://…" />
            </label>
          </>
        ) : (
          <label>
            Share link
            <input
              name="externalUrl"
              type="url"
              required
              placeholder="https://…"
            />
          </label>
        )}
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
