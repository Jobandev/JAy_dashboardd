import { useState } from "react";
import { ArrowUpRight, FileText, Play, X } from "lucide-react";
import { usePortalData } from "../data/PortalDataProvider";
import { getContentThumbnail, toEmbedUrl } from "../lib/media";
import { typeIcon } from "../lib/contentTypes";
import { formatContentPostedAt } from "../lib/contentDate";

export function MediaViewer({ asset, close }) {
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
export function AssetCard({ asset, compact = false }) {
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
            {formatContentPostedAt(asset)}
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
