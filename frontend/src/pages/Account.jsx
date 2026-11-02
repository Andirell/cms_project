import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField, inputClass } from '../components/FormField.jsx';
import PageHero from '../components/PageHero.jsx';
import { ErrorMessage, SuccessMessage } from '../components/States.jsx';
import { apiRequest } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { usePageMeta } from '../lib/hooks.js';

const EMPTY_PASSWORD_FORM = { old_password: '', new_password: '', confirm_new_password: '' };

function ProfileForm() {
  const { user, rememberUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedUser = await apiRequest(`/api/users/${user.id}/`, {
        method: 'PATCH',
        body: { username, email },
      });
      rememberUser(updatedUser);
      setSuccessMessage('Your details were saved.');
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {});
      setErrorMessage(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg bg-white p-6 shadow-lift">
      <h2 className="text-xl font-black text-graphite">Your details</h2>
      <FormField label="Username" error={errors.username}>
        <input value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" className={inputClass} />
      </FormField>
      <FormField label="Email" error={errors.email}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className={inputClass} />
      </FormField>
      <ErrorMessage>{errorMessage}</ErrorMessage>
      <SuccessMessage>{successMessage}</SuccessMessage>
      <button type="submit" disabled={saving} className="rounded-md bg-graphite px-5 py-3 font-bold text-white hover:bg-blueprint disabled:opacity-50">
        {saving ? 'Saving...' : 'Save details'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const { endSessionLocally } = useAuth();
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setErrorMessage('');

    try {
      await apiRequest('/api/users/change-password/', { method: 'POST', body: form });
      // The server has revoked every token for this user, so they need to log in again.
      endSessionLocally('Password changed. Please log in again.');
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {});
      setErrorMessage(requestError.message === 'wrong old password' ? 'Your current password is wrong.' : requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg bg-white p-6 shadow-lift">
      <h2 className="text-xl font-black text-graphite">Change password</h2>
      <FormField label="Current password" error={errors.old_password}>
        <input
          type="password"
          value={form.old_password}
          onChange={(event) => setForm({ ...form, old_password: event.target.value })}
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </FormField>
      <FormField label="New password" error={errors.new_password || errors.password}>
        <input
          type="password"
          value={form.new_password}
          onChange={(event) => setForm({ ...form, new_password: event.target.value })}
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </FormField>
      <FormField label="Confirm new password" error={errors.confirm_new_password}>
        <input
          type="password"
          value={form.confirm_new_password}
          onChange={(event) => setForm({ ...form, confirm_new_password: event.target.value })}
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </FormField>
      <ErrorMessage>{errorMessage}</ErrorMessage>
      <button type="submit" disabled={saving} className="rounded-md bg-graphite px-5 py-3 font-bold text-white hover:bg-blueprint disabled:opacity-50">
        {saving ? 'Changing...' : 'Change password'}
      </button>
    </form>
  );
}

export default function Account() {
  usePageMeta('My account', 'Manage your account.');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <>
      <PageHero eyebrow="My account" title={`Welcome, ${user.username}`} />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-4">
          {user.can_edit_projects_and_blog ? (
            <Link to="/dashboard" className="rounded-md bg-caution px-5 py-2.5 text-sm font-black text-graphite hover:bg-yellow-400">
              Open dashboard
            </Link>
          ) : null}
          <button type="button" onClick={handleLogout} className="rounded-md border border-gray-500 px-5 py-2.5 text-sm font-bold text-graphite">
            Log out
          </button>
        </div>
        <div className="grid items-start gap-6 md:grid-cols-2">
          <ProfileForm />
          <PasswordForm />
        </div>
      </section>
    </>
  );
}
