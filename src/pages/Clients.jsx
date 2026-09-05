import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CirclePlus, Pencil, Search, X } from "lucide-react";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";

import { ClientAccounts } from "../components/ClientAccounts";
import { ToastContext } from "../lib/ToastContext";

export function Clients() {
  const { clients } = usePortalData();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <Shell>
      <section className="page">
        <PageHeader
          eyebrow="CLIENT MANAGEMENT"
          title="Clients"
          description="Manage client relationships, projects and creative deliverables."
        >
          <PrimaryButton onClick={() => setShowAdd(true)}>
            Add client
          </PrimaryButton>
        </PageHeader>
        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients"
            />
          </label>
        </div>
        <div className="client-table panel">
          <div className="table-head">
            <span>CLIENT</span>
            <span>CONTACT</span>
            <span>STATUS</span>
            <span>LAST ACTIVITY</span>
            <span />
          </div>
          {!filtered.length && <p className="description">{clients.length ? "No clients match your search." : "No clients yet. Add an organisation to get started."}</p>}
          {filtered.map((c) => (
            <Link className="client-row" key={c.id} to={`/clients/${c.id}`} aria-label={`Open ${c.name} profile`}>
              <div className="client-name">
                <span
                  className="client-avatar"
                  style={{ background: "#bd6b66" }}
                >
                  {c.initials}
                </span>
                <span className="client-name-link">
                  <b>{c.name}</b>
                </span>
              </div>
              <div className="contact">
                <b>{c.contact}</b>
                <p>{c.email}</p>
              </div>
              <span
                className={"status " + c.status.toLowerCase().replace(" ", "-")}
              >
                {c.status}
              </span>
              <span className="muted">{c.lastActivity}</span>
              <span className="text-link small client-row-action">View profile <ChevronRight size={18} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
        <ClientAccounts />
      </section>
      {showAdd && <AddClient close={() => setShowAdd(false)} />}
    </Shell>
  );
}
export function AddClient({ close }) {
  const { addClient } = usePortalData();
  const [saving, setSaving] = useState(false);
  const { showToast } = useContext(ToastContext);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    try {
      await addClient({
        name,
        contact: form.get("contact"),
        email: form.get("email"),
        contactNumber: form.get("contactNumber"),
        companyEmail: form.get("companyEmail"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: "#bd6b66",
      });
      showToast("Saved successfully", "success");
      close();
    } catch {
      setError("Unable to save this client. Please try again.");
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
        <p className="eyebrow">NEW RELATIONSHIP</p>
        <h2>Add client</h2>
        <p className="description">Create a profile for a new client.</p>
        <label>
          Company name
          <input name="name" required placeholder="e.g. ABC Media" />
        </label>
        <label>
          Full name
          <input name="contact" required placeholder="Primary contact's full name" />
        </label>
        <label>
          Contact email
          <input
            name="email"
            type="email"
            required
            placeholder="name@company.com"
          />
        </label>
        <label>
          Contact number
          <input name="contactNumber" type="tel" placeholder="e.g. 021 123 4567" />
        </label>
        <label>
          Company email address
          <input
            name="companyEmail"
            type="email"
            placeholder="hello@company.com"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Cancel
          </button>
          <PrimaryButton disabled={saving} icon={CirclePlus}>
            {saving ? "Saving…" : "Create client"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

export function EditClient({ client, close }) {
  const { updateClient } = usePortalData();
  const [saving, setSaving] = useState(false);
  const { showToast } = useContext(ToastContext);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    try {
      await updateClient(client.id, {
        name,
        contact: form.get("contact"),
        email: form.get("email"),
        contactNumber: form.get("contactNumber"),
        companyEmail: form.get("companyEmail"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: form.get("color") || client.color,
      });
      showToast("Saved successfully", "success");
      close();
    } catch (err) {
      console.error(err);
      setError("Unable to update this client. Please try again.");
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
        <p className="eyebrow">EDIT CLIENT</p>
        <h2>Edit client</h2>
        <p className="description">Update client profile details.</p>
        <label>
          Company name
          <input name="name" defaultValue={client.name} required />
        </label>
        <label>
          Full name
          <input name="contact" defaultValue={client.contact} required />
        </label>
        <label>
          Contact email
          <input name="email" type="email" defaultValue={client.email} required />
        </label>
        <label>
          Contact number
          <input name="contactNumber" type="tel" defaultValue={client.contactNumber} placeholder="e.g. 021 123 4567" />
        </label>
        <label>
          Company email address
          <input name="companyEmail" type="email" defaultValue={client.companyEmail} placeholder="hello@company.com" />
        </label>
        <label>
          Colour
          <input name="color" defaultValue={client.color} placeholder="#bd6b66" />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={close}>
            Cancel
          </button>
          <PrimaryButton disabled={saving} icon={Pencil}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
