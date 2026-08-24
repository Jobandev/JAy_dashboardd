import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Pencil } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { saveProfile, signOutUser } from "../firebase/authService";
import { updateUserProfileDoc } from "../firebase/userService";
import { uploadProfilePhoto } from "../firebase/storageService";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";
import { ToastContext } from "../lib/ToastContext";

export function SettingsPage() {
  const { user, role, profile, refreshProfile } = useAuth();
  const { clearDemoData } = usePortalData();
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);
  const fileInputRef = useRef(null);
  const [name, setName] = useState(
    user?.displayName || user?.email?.split("@")[0] || ""
  );
  const [contact, setContact] = useState(profile?.contact || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const onPhotoChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      let photoURL = user?.photoURL || "";
      if (photoFile) {
        photoURL = await uploadProfilePhoto(photoFile, user.uid);
      }
      await saveProfile(name, photoURL || undefined);
      await updateUserProfileDoc(user.uid, { displayName: name, contact, photoURL });
      await refreshProfile();
      setPhotoFile(null);
      setMessage("Profile saved.");
      showToast("Profile saved", "success");
    } catch (err) {
      console.error("Unable to save profile", err);
      setMessage("Unable to save your profile. Please try again.");
      showToast("Unable to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeDemo = async () => {
    if (
      !window.confirm(
        "Remove only the seeded demo clients, projects and content? Your own new records are not deleted."
      )
    )
      return;
    try {
      await clearDemoData();
      setMessage("Demo data removed.");
      showToast("Demo data removed", "success");
    } catch (err) {
      console.error("Unable to remove demo data", err);
      showToast("Unable to remove demo data", "error");
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
              type="file"
              accept="image/*"
              onChange={onPhotoChosen}
            />
            <label className="file-label" onClick={() => fileInputRef.current?.click()}>
              <Camera size={15} />
              {photoPreview ? "Change photo" : "Add profile photo"}
            </label>
          </div>

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
          <PrimaryButton icon={Pencil} onClick={save}>
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
          {role === "administrator" && (
            <div className="danger-zone">
              <p className="eyebrow">DEMO DATA</p>
              <h3>Remove demo data</h3>
              <p>
                Deletes only the seeded client library and starter projects.
                Anything you've added by hand remains.
              </p>
              <button className="danger-button" onClick={removeDemo}>
                Remove demo data
              </button>
            </div>
          )}
        </section>
      </section>
    </Shell>
  );
}
