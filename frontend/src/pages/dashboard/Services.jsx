import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { CheckboxField, ImageField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/company/services/';

const NEW_SERVICE = {
  title: '',
  slug: '',
  description: '',
  image: '',
  display_order: 0,
  is_active: true,
};

function ServiceForm({ record, onDone }) {
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={record.id ? 'Edit service' : 'New service'} form={form} onCancel={onDone}>
      <TextField label="Title" form={form} name="title" required />
      <TextField label="Web address (slug)" form={form} name="slug" hint="Leave empty to create it from the title." />
      <TextAreaField label="Description" form={form} name="description" required />
      <TextField label="Display order" form={form} name="display_order" type="number" hint="Lower numbers appear first." />
      <ImageField label="Image" form={form} name="image" />
      <CheckboxField label="Show on website" form={form} name="is_active" />
    </DashboardForm>
  );
}

export default function ServicesAdmin() {
  usePageMeta('Services | Dashboard');

  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <ServiceForm record={editing} onDone={finishEditing} />;

  const columns = [
    { label: 'Title', render: (service) => <span className="font-semibold">{service.title}</span> },
    { label: 'Order', render: (service) => service.display_order },
    { label: 'Website', render: (service) => (service.is_active ? 'Shown' : 'Hidden') },
  ];

  return (
    <DashboardList
      title="Services"
      addLabel="New service"
      onAdd={() => setEditing(NEW_SERVICE)}
      onEdit={setEditing}
      list={list}
      columns={columns}
      emptyText="No services found."
    />
  );
}
