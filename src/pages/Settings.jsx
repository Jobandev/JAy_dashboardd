import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Pencil } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { saveProfile, signOutUser } from "../firebase/authService";
import { updateUserProfileDoc } from "../firebase/userService";
import { uploadProfilePhoto } from "../firebase/storageService";
import { isStorageConfigured } from "../firebase/firebase";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { ToastContext } from "../lib/ToastContext";

async function createProfilePhotoDataUrl(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = objectUrl;
    });
    const longestSide = Math.max(image.width, image.height);
    const scale = Math.min(1, 320 / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function normaliseProfilePhotoUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const markdownLink = trimmed.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
  const url = new URL(markdownLink?.[1] || trimmed);
  const driveFileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  const driveId = driveFileMatch?.[1] || url.searchParams.get("id");
  if (url.hostname.includes("drive.google.com") && driveId) {
    // Drive's thumbnail endpoint is designed for embedding in image tags;
    // the regular share/download endpoint often serves an HTML preview page.
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }
  return url.toString();
}

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);
  const [name, setName] = useState(
    user?.displayName || user?.email?.split("@")[0] || ""
  );
  const [contact, setContact] = useState(profile?.contact || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoURL || user?.photoURL || "");
  const [photoLink, setPhotoLink] = useState(profile?.photoURL || user?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const onPhotoChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoLink("");
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onPhotoLinkChanged = (e) => {
    const value = e.target.value;
    setPhotoLink(value);
    setPhotoFile(null);
    try {
      setPhotoPreview(normaliseProfilePhotoUrl(value));
      setMessage("");
    } catch {
      setPhotoPreview("");
      setMessage("Enter a valid Google Drive share link or image URL.");
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      let photoURL = profile?.photoURL || user?.photoURL || "";
      if (photoLink.trim()) {
        photoURL = normaliseProfilePhotoUrl(photoLink);
      } else if (photoFile) {
        try {
          photoURL = isStorageConfigured
            ? await uploadProfilePhoto(photoFile, user.uid)
            : await createProfilePhotoDataUrl(photoFile);
        } catch (uploadError) {
          console.warn("Firebase Storage upload failed; saving an optimized profile image instead.", uploadError);
          photoURL = await createProfilePhotoDataUrl(photoFile);
        }
      }
      await updateUserProfileDoc(user.uid, { displayName: name, contact, photoURL });
      // The dashboard reads its avatar from Firestore first. Keep the
      // Firebase Auth profile in sync when possible, but never let an Auth
      // profile update prevent a valid Drive image from being saved here.
      try {
        await saveProfile(name, photoURL.startsWith("data:") ? undefined : photoURL || undefined);
      } catch (authProfileError) {
        console.warn("Firebase Auth profile update was skipped.", authProfileError);
      }
      await refreshProfile();
      setPhotoFile(null);
      setMessage("Profile saved.");
      showToast("Profile saved", "success");
    } catch (err) {
      console.error("Unable to save profile", err);
      setMessage(err?.message || "Unable to save your profile. Please try again.");
      showToast("Unable to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const signOutAccount = async () => {
    setSigningOut(true);
    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Unable to sign out", err);
      showToast("Unable to sign out. Please try again.", "error");
      setSigningOut(false);
    }
  };

  const initials = (name || "?").charAt(0).toUpperCase();

  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="WORKSPACE"
          title="Settings"
          description="Manage your dashboard workspace."
        />
        <section className="panel settings-panel">
          <p className="eyebrow">PROFILE</p>
          <h2>Your profile</h2>

          <div className="profile-photo-row">
            {photoPreview ? (
              <img className="avatar" src={photoPreview} alt="" />
            ) : (
              <span className="avatar">{initials}</span>
            )}
            <input
              ref={fileInputRef}
              id="profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoChosen}
            />
            <label className="file-label" htmlFor="profile-photo-input">
              <Camera size={15} />
              {photoPreview ? "Change photo" : "Add profile photo"}
            </label>
          </div>
          <label>
            Profile photo link
            <input
              type="url"
              value={photoLink}
              onChange={onPhotoLinkChanged}
              placeholder="Paste a Google Drive share link or image URL"
            />
          </label>
          <p className="description">For Google Drive, set the file’s access to “Anyone with the link” before pasting its share link.</p>
          {!isStorageConfigured && <p className="description">Photos are saved as an optimized profile image until Firebase Storage is connected.</p>}

          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={user?.email || ""} readOnly />
          </label>
          <label>
            Contact number
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. 021 123 4567"
            />
          </label>
          <PrimaryButton icon={Pencil} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
          {message && <p className="settings-message">{message}</p>}
          <button
            type="button"
            className="secondary-button settings-signout"
            onClick={signOutAccount}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>

        </section>
      </section>
    </Shell>
  );
}
