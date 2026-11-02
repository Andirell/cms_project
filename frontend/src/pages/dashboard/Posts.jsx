import { useState } from 'react';
import DashboardForm from '../../components/DashboardForm.jsx';
import DashboardList from '../../components/DashboardList.jsx';
import { ImageField, SelectField, TextAreaField, TextField } from '../../components/FormField.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { capitalize, formatDate } from '../../lib/format.js';
import { useContentList, usePageMeta, useRecordForm } from '../../lib/hooks.js';

const PATH = '/api/blog/';
const STATUS_OPTIONS = [['draft', 'Draft'], ['published', 'Published']];

function pickEditableFields(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    status: post.status,
    image: post.image,
  };
}

function PostForm({ record, onDone }) {
  const form = useRecordForm({ path: PATH, record, onSaved: onDone });

  return (
    <DashboardForm title={record.id ? 'Edit post' : 'New post'} form={form} onCancel={onDone}>
      <TextField label="Title" form={form} name="title" required />
      <TextField label="Web address (slug)" form={form} name="slug" hint="Leave empty to create it from the title." />
      <TextField label="Author" form={form} name="author" required />
      <TextField label="Short summary" form={form} name="excerpt" hint="Shown on the blog list. 300 characters at most." />
      <TextAreaField label="Content" form={form} name="content" required rows={12} hint="Leave a blank line between paragraphs." />
      <ImageField label="Image" form={form} name="image" />
      <SelectField label="Status" form={form} name="status" options={STATUS_OPTIONS} />
    </DashboardForm>
  );
}

export default function PostsAdmin() {
  usePageMeta('Blog posts | Dashboard');

  const { user } = useAuth();
  const list = useContentList(PATH);
  const [editing, setEditing] = useState(null);

  function finishEditing() {
    setEditing(null);
    list.reload();
  }

  if (editing) return <PostForm record={editing} onDone={finishEditing} />;

  function startNewPost() {
    setEditing({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      author: user.username,
      status: 'draft',
      image: '',
    });
  }

  const columns = [
    { label: 'Title', render: (post) => <span className="font-semibold">{post.title}</span> },
    { label: 'Author', render: (post) => post.author },
    { label: 'Status', render: (post) => capitalize(post.status) },
    { label: 'Published', render: (post) => formatDate(post.published_at) || 'Not yet' },
  ];

  return (
    <DashboardList
      title="Blog posts"
      addLabel="New post"
      onAdd={startNewPost}
      onEdit={(post) => setEditing(pickEditableFields(post))}
      list={list}
      columns={columns}
      emptyText="No posts found."
    />
  );
}
