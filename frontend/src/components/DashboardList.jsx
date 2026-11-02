import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EmptyMessage, ErrorMessage, LoadingMessage } from './States.jsx';
import { inputClass } from './FormField.jsx';

function DeleteButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="py-1.5 font-semibold text-danger underline">
        Delete
      </button>
    );
  }

  return (
    <span className="whitespace-nowrap">
      <span className="mr-2 text-gray-700">Sure?</span>
      <button type="button" onClick={onConfirm} className="mr-2 py-1.5 font-bold text-danger underline">Yes, delete</button>
      <button type="button" onClick={() => setConfirming(false)} className="py-1.5 font-semibold underline">No</button>
    </span>
  );
}

// The shared table for dashboard pages. Each page passes in its own columns.
export default function DashboardList({ title, addLabel, onAdd, list, columns, onEdit, canEdit, canDelete, emptyText }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-graphite">{title}</h1>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-md bg-graphite px-4 py-2.5 text-sm font-bold text-white hover:bg-blueprint"
          >
            <Plus size={17} aria-hidden="true" /> {addLabel}
          </button>
        ) : null}
      </div>

      <label className="mt-5 block max-w-sm">
        <span className="sr-only">Search {title}</span>
        <input
          type="search"
          value={list.search}
          onChange={(event) => list.changeSearch(event.target.value)}
          placeholder="Search"
          className={inputClass}
        />
      </label>

      <div className="mt-5">
        <ErrorMessage>{list.error}</ErrorMessage>
        {list.loading && list.rows.length === 0 ? <LoadingMessage /> : null}
        {!list.loading && !list.error && list.rows.length === 0 ? <EmptyMessage>{emptyText}</EmptyMessage> : null}

        {list.rows.length > 0 ? (
          <div className="overflow-x-auto rounded-lg bg-white shadow-lift">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-concrete text-gray-700">
                <tr>
                  {columns.map((column) => (
                    <th key={column.label} scope="col" className="px-4 py-3 font-bold">{column.label}</th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <tr key={row.id} className="border-b border-concrete last:border-0">
                    {columns.map((column) => (
                      <td key={column.label} className="px-4 py-3 text-gray-800">{column.render(row)}</td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex gap-4">
                        {!canEdit || canEdit(row) ? (
                          <button type="button" onClick={() => onEdit(row)} className="py-1.5 font-semibold text-blueprint underline">
                            Edit
                          </button>
                        ) : null}
                        {!canDelete || canDelete(row) ? <DeleteButton onConfirm={() => list.deleteRow(row)} /> : null}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {list.count > 0 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
            <p>{list.count} total</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={list.page === 1}
                onClick={() => list.setPage(list.page - 1)}
                className="rounded-md border border-gray-400 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!list.hasNext}
                onClick={() => list.setPage(list.page + 1)}
                className="rounded-md border border-gray-400 px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
