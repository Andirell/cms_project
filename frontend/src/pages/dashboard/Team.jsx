import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { CheckboxField, ImageField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/company/team/';

const NEW_MEMBER = {
  name: '',
  role: '',
  bio: '',
  email: '',
  photo: '',
  display_order: 0,
  is_active: true,
};

function TeamForm({ record, onDone }) {
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={record.id ? 'Edit team member' : 'New team member'} form={form} onCancel={onDone}>
      <TextField label="Name" form={form} name="name" required />
      <TextField label="Job title" form={form} name="role" required />
      <TextField label="Email" form={form} name="email" type="email" />
      <TextAreaField label="Biography" form={form} name="bio" />
      <TextField label="Display order" form={form} name="display_order" type="number" hint="Lower numbers appear first." />
      <ImageField label="Photo" form={form} name="photo" />
      <CheckboxField label="Show on website" form={form} name="is_active" />
    </DashboardForm>
  );
}

export default function TeamAdmin() {
  usePageMeta('Team | Dashboard');

  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <TeamForm record={editing} onDone={finishEditing} />;

  const columns = [
    { label: 'Name', render: (member) => <span className="font-semibold">{member.name}</span> },
    { label: 'Job title', render: (member) => member.role },
    { label: 'Website', render: (member) => (member.is_active ? 'Shown' : 'Hidden') },
  ];

  return (
    <DashboardList
      title="Team"
      addLabel="New team member"
      onAdd={() => setEditing(NEW_MEMBER)}
      onEdit={setEditing}
      list={list}
      columns={columns}
      emptyText="No team members found."
    />
  );
}
