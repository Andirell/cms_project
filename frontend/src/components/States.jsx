export function LoadingMessage({ children = 'Loading...' }) {
  return <p role="status" className="py-10 text-center text-sm font-semibold text-gray-600">{children}</p>;
}

export function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <p role="alert" className="rounded-md border border-danger/30 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
      {children}
    </p>
  );
}

export function SuccessMessage({ children }) {
  if (!children) return null;

  return (
    <p role="status" className="rounded-md border border-moss/30 bg-green-50 px-4 py-3 text-sm font-semibold text-moss">
      {children}
    </p>
  );
}

export function EmptyMessage({ children }) {
  return (
    <p className="rounded-md border border-dashed border-gray-400 px-4 py-10 text-center text-sm font-semibold text-gray-600">
      {children}
    </p>
  );
}

// Shows the right state for a section that loads a list.
export function ListSection({ loading, error, isEmpty, emptyText, children }) {
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (loading) return <LoadingMessage />;
  if (isEmpty) return <EmptyMessage>{emptyText}</EmptyMessage>;
  return children;
}
