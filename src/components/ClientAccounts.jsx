import { useContext, useState } from 'react';
import { usePortalData } from '../data/PortalDataProvider';
import { createClientAccount, assignClientAccount } from '../firebase/clientAccounts';
import { ToastContext } from '../lib/ToastContext';

export function ClientAccounts() {
  const { clients, users } = usePortalData();
  const { showToast } = useContext(ToastContext);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setSaving(true); setError('');
    try { await createClientAccount(data); form.reset(); showToast('Client login created', 'success'); }
    catch (err) { setError(err.code === 'auth/email-already-in-use' ? 'This email already has an account. Assign the existing account below, or ask the contact to sign in first.' : err.message); }
    finally { setSaving(false); }
  }
  return <section className="panel settings-panel">
    <h2>Client logins and access</h2>
    <p className="description">Create a login for an organisation, or assign an account that has already signed up. Clients receive read-only access to their organisation.</p>
    <form onSubmit={create}>
      <label>Full name<input name="displayName" required /></label>
      <label>Email<input name="email" type="email" required /></label>
      <label>Initial password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
      <label>Organisation<select name="clientId" required defaultValue=""><option value="" disabled>Select organisation</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <p className="description">Share the initial credentials privately. The client can use Forgot password on the login page to choose their own password.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="modal-actions"><button className="primary-button" disabled={saving || !clients.length}>{saving ? 'Creating...' : 'Create client login'}</button></div>
    </form>
    <h3>Existing client accounts</h3>
    {users.filter(u => u.role === 'client').map(u => <AccountAssignment key={u.id + ':' + u.clientId} account={u} clients={clients} />)}
    {!users.some(u => u.role === 'client') && <p className="description">No client accounts yet.</p>}
  </section>;
}
function AccountAssignment({ account, clients }) {
  const [clientId, setClientId] = useState(account.clientId || '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useContext(ToastContext);
  async function save(event) {
    event.preventDefault(); setSaving(true);
    try { await assignClientAccount(account.id, clientId); showToast('Client access updated', 'success'); }
    catch (err) { showToast(err.message || 'Unable to update access', 'error'); }
    finally { setSaving(false); }
  }
  return <form className="user-access-row" onSubmit={save}><label>{account.displayName || account.email}<small>{account.email}</small><select value={clientId} onChange={e => setClientId(e.target.value)}><option value="">Unassigned - no organisation access</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="secondary-button" disabled={saving || clientId === (account.clientId || '')}>{saving ? 'Saving...' : 'Save access'}</button></form>;
}
