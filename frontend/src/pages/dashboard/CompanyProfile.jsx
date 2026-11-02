import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import { ImageField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { ErrorMessage, LoadingMessage, SuccessMessage } from '../../components/States.jsx';
import { apiRequest, toFormData } from '../../lib/api.js';
import { useFetch, usePageMeta } from '../../lib/hooks.js';

const PATH = '/api/company/profile/';

function pickEditableFields(profile) {
  return {
    name: profile.name || '',
    tagline: profile.tagline || '',
    about: profile.about || '',
    phone: profile.phone || '',
    email: profile.email || '',
    address: profile.address || '',
    years_in_operation: profile.years_in_operation ?? '',
    certifications: profile.certifications || '',
    logo: profile.logo || '',
    hero_image: profile.hero_image || '',
  };
}

function ProfileForm({ profile, saved, onSaved }) {
  const [values, setValues] = useState(pickEditableFields(profile));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage('');

    try {
      // This address has no id: the same URL creates or updates the single profile.
      await apiRequest(PATH, { method: 'PATCH', body: toFormData(values) });
      onSaved();
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {});
      setMessage(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  const form = { values, setValue, errors, message, saving, submit };

  return (
    <DashboardForm title="Company profile" form={form}>
      <SuccessMessage>{saved ? 'Saved.' : ''}</SuccessMessage>
      <TextField label="Company name" form={form} name="name" required />
      <TextField label="Tagline" form={form} name="tagline" />
      <TextAreaField label="About" form={form} name="about" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Phone" form={form} name="phone" type="tel" />
        <TextField label="Email" form={form} name="email" type="email" />
        <TextField label="Address" form={form} name="address" />
        <TextField label="Years in operation" form={form} name="years_in_operation" type="number" />
      </div>
      <TextAreaField
        label="Certifications"
        form={form}
        name="certifications"
        rows={3}
        hint="One per line. Only list ones the company really holds: these appear on the homepage."
      />
      <ImageField label="Logo" form={form} name="logo" />
      <ImageField label="Hero image" form={form} name="hero_image" />
    </DashboardForm>
  );
}

export default function CompanyProfileAdmin() {
  usePageMeta('Company profile | Dashboard');

  const { data, loading, error, reload } = useFetch(PATH, { useAuth: true });
  const [saved, setSaved] = useState(false);

  function handleSaved() {
    setSaved(true);
    reload();
  }

  if (loading && !data) return <LoadingMessage />;
  if (!data) return <ErrorMessage>{error}</ErrorMessage>;

  // A new key after saving reloads the form, so new uploads show as saved images.
  return <ProfileForm key={data.updated_at || 'new'} profile={data} saved={saved} onSaved={handleSaved} />;
}
