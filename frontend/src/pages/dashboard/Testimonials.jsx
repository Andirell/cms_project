import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { CheckboxField, SelectField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/company/testimonials/';
const RATING_OPTIONS = [[1, '1 star'], [2, '2 stars'], [3, '3 stars'], [4, '4 stars'], [5, '5 stars']];

const NEW_TESTIMONIAL = {
  client_name: '',
  project_name: '',
  quote: '',
  rating: 5,
  is_featured: false,
  is_approved: false,
};

function TestimonialForm({ record, onDone }) {
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={record.id ? 'Edit testimonial' : 'New testimonial'} form={form} onCancel={onDone}>
      <TextField label="Client name" form={form} name="client_name" required />
      <TextField label="Project name" form={form} name="project_name" />
      <TextAreaField label="Quote" form={form} name="quote" required />
      <SelectField label="Rating" form={form} name="rating" options={RATING_OPTIONS} />
      <CheckboxField label="Approved" form={form} name="is_approved" hint="Only approved testimonials appear on the website." />
      <CheckboxField label="Featured" form={form} name="is_featured" hint="Featured testimonials appear first." />
    </DashboardForm>
  );
}

export default function TestimonialsAdmin() {
  usePageMeta('Testimonials | Dashboard');

  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <TestimonialForm record={editing} onDone={finishEditing} />;

  const columns = [
    { label: 'Client', render: (item) => <span className="font-semibold">{item.client_name}</span> },
    { label: 'Project', render: (item) => item.project_name || 'None' },
    { label: 'Rating', render: (item) => `${item.rating} of 5` },
    { label: 'Website', render: (item) => (item.is_approved ? 'Approved' : 'Waiting') },
  ];

  return (
    <DashboardList
      title="Testimonials"
      addLabel="New testimonial"
      onAdd={() => setEditing(NEW_TESTIMONIAL)}
      onEdit={setEditing}
      list={list}
      columns={columns}
      emptyText="No testimonials found."
    />
  );
}
