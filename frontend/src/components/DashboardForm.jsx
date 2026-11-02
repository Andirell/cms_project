import { ErrorMessage } from './States.jsx';

// The frame around every dashboard form: heading, error message, Save and Cancel.
export default function DashboardForm({ title, form, onCancel, children }) {
  return (
    <form onSubmit={form.submit} className="max-w-3xl">
      <h1 className="text-3xl font-black text-graphite">{title}</h1>
      <div className="mt-5 grid gap-4 rounded-lg bg-white p-5 shadow-lift sm:p-7">
        {children}
        <ErrorMessage>{form.message}</ErrorMessage>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={form.saving}
            className="rounded-md bg-graphite px-5 py-2.5 text-sm font-bold text-white hover:bg-blueprint disabled:opacity-50"
          >
            {form.saving ? 'Saving...' : 'Save'}
          </button>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-400 px-5 py-2.5 text-sm font-bold text-graphite"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
