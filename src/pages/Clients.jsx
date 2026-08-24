import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight, CirclePlus, Pencil, Search, X } from "lucide-react";
import { usePortalData } from "../data/PortalDataProvider";
import { Shell } from "../components/Shell";
import { PageHeader, PrimaryButton } from "../components/ui";

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
          <button className="filter-button">
            Status: All <ChevronDown size={16} />
          </button>
        </div>
        <div className="client-table panel">
          <div className="table-head">
            <span>CLIENT</span>
            <span>CONTACT</span>
            <span>STATUS</span>
            <span>LAST ACTIVITY</span>
            <span />
          </div>
          {filtered.map((c) => (
            <div className="client-row" key={c.id}>
              <div className="client-name">
                <span
                  className="client-avatar"
                  style={{ background: "#bd6b66" }}
                >
                  {c.initials}
                </span>
                <NavLink className="client-name-link" to={`/clients/${c.id}`}>
                  <b>{c.name}</b>
                </NavLink>
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
              <NavLink to={`/clients/${c.id}?view=projects`} className="text-link small">View projects</NavLink>
              <NavLink to={`/clients/${c.id}`} className="row-chevron icon-button" aria-label={`View ${c.name}`}>
                <ChevronRight size={18} />
              </NavLink>
            </div>
          ))}
        </div>
      </section>
      {showAdd && <AddClient close={() => setShowAdd(false)} />}
    </Shell>
  );
}
export function AddClient({ close }) {
  const { addClient } = usePortalData();
  const [saving, setSaving] = useState(false);
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
        companyEmail: form.get("companyEmail"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: "#bd6b66",
      });
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
          <PrimaryButton icon={CirclePlus}>
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
        companyEmail: form.get("companyEmail"),
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: form.get("color") || client.color,
      });
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
          <PrimaryButton icon={Pencil}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
