import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { usePortalData } from "../data/PortalDataProvider";
import { saveProfile, signOutUser } from "../firebase/authService";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";

export function SettingsPage() {
  const { user, role } = useAuth();
  const { clearDemoData } = usePortalData();
  const [name, setName] = useState(
    user?.displayName || user?.email?.split("@")[0] || ""
  );
  const [message, setMessage] = useState("");
  const save = async () => {
    await saveProfile(name);
    setMessage("Profile saved. Refresh the page to update the sidebar name.");
  };
  const removeDemo = async () => {
    if (
      !window.confirm(
        "Remove only the seeded sample clients, projects and content? Your own new records are not deleted."
      )
    )
      return;
    await clearDemoData();
    setMessage("Sample data removed.");
  };
  const signOutAccount = async () => {
    await signOutUser();
  };
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
          <label>
            Display name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input value={user?.email || ""} readOnly />
          </label>
          <PrimaryButton icon={Pencil} onClick={save}>
            Save changes
          </PrimaryButton>
          {message && <p className="settings-message">{message}</p>}
          <button className="secondary-button settings-signout" onClick={signOutAccount}>
            Sign out
          </button>
          {role === "administrator" && <div className="danger-zone">
            <p className="eyebrow">DEMO DATA</p>
            <h3>Remove starter content</h3>
            <p>
              Deletes only the seeded client library and starter projects.
              Anything you've added by hand remains.
            </p>
            <button className="danger-button" onClick={removeDemo}>
              Remove demo data
            </button>
          </div>}
        </section>
      </section>
    </Shell>
  );
}
