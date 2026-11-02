import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { CheckboxField, ImageField, SelectField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { DISCIPLINES, PROJECT_STATUSES, capitalize, formatDate } from '../../lib/format.js';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/projects/';

// New projects start unpublished, so nothing goes live until someone chooses to publish it.
const NEW_PROJECT = {
  title: '',
  slug: '',
  description: '',
  client: '',
  scope: '',
  discipline: 'civil',
  status: 'planning',
  location: '',
  start_date: '',
  end_date: '',
  image: '',
  is_published: false,
  is_featured: false,
};

function ProjectForm({ record, onDone }) {
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={record.id ? 'Edit project' : 'New project'} form={form} onCancel={onDone}>
      <TextField label="Title" form={form} name="title" required />
      <TextField label="Web address (slug)" form={form} name="slug" hint="Leave empty to create it from the title." />
      <TextAreaField label="Description" form={form} name="description" required rows={7} hint="Leave a blank line between paragraphs." />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Client" form={form} name="client" />
        <TextField label="Location" form={form} name="location" />
        <SelectField label="Discipline" form={form} name="discipline" options={DISCIPLINES} />
        <SelectField label="Status" form={form} name="status" options={PROJECT_STATUSES} />
        <TextField label="Start date" form={form} name="start_date" type="date" required />
        <TextField label="End date" form={form} name="end_date" type="date" />
      </div>
      <TextField label="Scope of work" form={form} name="scope" />
      <ImageField label="Image" form={form} name="image" />
      <CheckboxField label="Published" form={form} name="is_published" hint="Only published projects appear on the website." />
      <CheckboxField label="Featured" form={form} name="is_featured" hint="Featured projects appear first." />
    </DashboardForm>
  );
}

export default function ProjectsAdmin() {
  usePageMeta('Projects | Dashboard');

  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <ProjectForm record={editing} onDone={finishEditing} />;

  const columns = [
    { label: 'Title', render: (project) => <span className="font-semibold">{project.title}</span> },
    { label: 'Discipline', render: (project) => capitalize(project.discipline) },
    { label: 'Status', render: (project) => capitalize(project.status) },
    { label: 'Start date', render: (project) => formatDate(project.start_date) },
    { label: 'Website', render: (project) => (project.is_published ? 'Published' : 'Draft') },
  ];

  return (
    <DashboardList
      title="Projects"
      addLabel="New project"
      onAdd={() => setEditing(NEW_PROJECT)}
      onEdit={setEditing}
      list={list}
      columns={columns}
      emptyText="No projects found."
    />
  );
}
