import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { SelectField, TextAreaField } from '../../components/FormField.jsx';
import { capitalize, formatDate } from '../../lib/format.js';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/company/contact/';
const STATUS_OPTIONS = [['new', 'New'], ['in_review', 'In review'], ['closed', 'Closed']];

function InquiryForm({ inquiry, onDone }) {
  // Only the status and notes can change. What the visitor wrote stays as sent.
  const record = { id: inquiry.id, status: inquiry.status, internal_notes: inquiry.internal_notes };
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={`Inquiry from ${inquiry.full_name}`} form={form} onCancel={onDone}>
      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-gray-600">Email</dt>
          <dd><a href={`mailto:${inquiry.email}`} className="text-blueprint underline">{inquiry.email}</a></dd>
        </div>
        {inquiry.phone ? (
          <div>
            <dt className="font-semibold text-gray-600">Phone</dt>
            <dd>{inquiry.phone}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-gray-600">Service</dt>
          <dd>{inquiry.service_interest || 'Not specified'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-600">Received</dt>
          <dd>{formatDate(inquiry.created_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-600">Message</dt>
          <dd className="mt-1 whitespace-pre-line rounded bg-paper p-3">{inquiry.message}</dd>
        </div>
      </dl>
      <SelectField label="Status" form={form} name="status" options={STATUS_OPTIONS} />
      <TextAreaField label="Internal notes" form={form} name="internal_notes" hint="Only staff can see these." />
    </DashboardForm>
  );
}

export default function InquiriesAdmin() {
  usePageMeta('Inquiries | Dashboard');

  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <InquiryForm inquiry={editing} onDone={finishEditing} />;

  const columns = [
    { label: 'Name', render: (inquiry) => <span className="font-semibold">{inquiry.full_name}</span> },
    { label: 'Email', render: (inquiry) => inquiry.email },
    { label: 'Service', render: (inquiry) => inquiry.service_interest || 'Not specified' },
    { label: 'Status', render: (inquiry) => capitalize(inquiry.status) },
    { label: 'Received', render: (inquiry) => formatDate(inquiry.created_at) },
  ];

  return (
    <DashboardList
      title="Inquiries"
      onEdit={setEditing}
      list={list}
      columns={columns}
      emptyText="No inquiries found."
    />
  );
}
