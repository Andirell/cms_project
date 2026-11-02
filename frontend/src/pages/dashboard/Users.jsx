import { useState } from 'react';
import DashboardList from '../../components/DashboardList.jsx';
import { FormField, inputClass } from '../../components/FormField.jsx';
import { ErrorMessage } from '../../components/States.jsx';
import { apiRequest } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { capitalize, formatDate } from '../../lib/format.js';
import { useContentList, usePageMeta } from '../../lib/hooks.js';

const ROLES = [
  ['client', 'Client: own account only'],
  ['engineer', 'Engineer: projects and blog'],
  ['manager', 'Manager: all content and inquiries'],
  ['admin', 'Admin: everything, including users'],
];

function hasStaffFlag(account) {
  return account.is_staff || account.is_superuser;
}

function RoleForm({ account, onDone }) {
  const [role, setRole] = useState(account.role);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await apiRequest(`/api/users/${account.id}/`, { method: 'PATCH', body: { role } });
      onDone();
    } catch (requestError) {
      setMessage(requestError.fieldErrors?.role || requestError.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl">
      <h1 className="text-3xl font-black text-graphite">Change role</h1>
      <div className="mt-5 grid gap-4 rounded-lg bg-white p-6 shadow-lift">
        <p className="text-sm text-gray-700">{account.username} ({account.email})</p>
        <FormField label="Role">
          <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
            {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FormField>
        {hasStaffFlag(account) ? (
          <p className="text-sm font-semibold text-clay">
            This account has the staff flag, so it keeps full access whatever role is chosen here.
            Remove the flag in Django admin to limit it.
          </p>
        ) : null}
        <ErrorMessage>{message}</ErrorMessage>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-graphite px-5 py-2.5 text-sm font-bold text-white hover:bg-blueprint disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={onDone} className="rounded-md border border-gray-400 px-5 py-2.5 text-sm font-bold text-graphite">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default function UsersAdmin() {
  usePageMeta('Users | Dashboard');

  const { user } = useAuth();
  const list = useContentList('/api/users/');
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <RoleForm account={editing} onDone={finishEditing} />;

  // Matches the API's rules. Anyone can only be changed by someone with at least
  // their access, and nobody changes their own role or deletes themselves here.
  function canChange(account) {
    if (account.id === user.id) return false;
    if (account.is_superuser && !user.is_superuser) return false;
    return true;
  }

  const columns = [
    { label: 'Username', render: (account) => <span className="font-semibold">{account.username}</span> },
    { label: 'Email', render: (account) => account.email },
    { label: 'Role', render: (account) => (hasStaffFlag(account) ? `${capitalize(account.role)} (full access: staff flag)` : capitalize(account.role)) },
    { label: 'Joined', render: (account) => formatDate(account.created_at) },
  ];

  return (
    <DashboardList
      title="Users"
      onEdit={setEditing}
      canEdit={canChange}
      canDelete={canChange}
      list={list}
      columns={columns}
      emptyText="No users found."
    />
  );
}
