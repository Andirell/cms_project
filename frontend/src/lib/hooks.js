import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, toFormData, withParams } from './api.js';

// Loads one URL and tracks loading and errors. Each section uses its own copy,
// so one failed request doesn't take down the whole page.
//
// Requests are anonymous unless useAuth is true. Staff get drafts from the API, so a
// logged-in editor browsing the public site must not be shown them as if they were live.
export function useFetch(path, { useAuth = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    // When typing in a search box, an older answer can arrive after a newer one.
    latestRequest.current += 1;
    const thisRequest = latestRequest.current;

    setLoading(true);
    setError('');
    setNotFound(false);

    try {
      const response = await apiRequest(path, { useAuth });
      if (thisRequest === latestRequest.current) setData(response);
    } catch (requestError) {
      if (thisRequest === latestRequest.current) {
        setError(requestError.message);
        if (requestError.status === 404) {
          setData(null);
          setNotFound(true);
        }
      }
    } finally {
      if (thisRequest === latestRequest.current) setLoading(false);
    }
  }, [path, useAuth]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, notFound, reload: load };
}

export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag && description) {
      descriptionTag.setAttribute('content', description);
    }
  }, [title, description]);
}

// State for a dashboard table: search, current page, and delete.
export function useContentList(path) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');

  const { data, loading, error, reload } = useFetch(
    withParams(path, { search, page, page_size: 20 }),
    { useAuth: true },
  );

  function changeSearch(text) {
    setSearch(text);
    setPage(1);
  }

  async function deleteRow(row) {
    setActionError('');

    try {
      await apiRequest(`${path}${row.id}/`, { method: 'DELETE' });

      // Deleting the only row on the last page would otherwise leave an empty page.
      const rows = data?.results || [];
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  return {
    rows: data?.results || [],
    count: data?.count || 0,
    hasNext: Boolean(data?.next),
    loading,
    error: error || actionError,
    search,
    changeSearch,
    page,
    setPage,
    reload,
    deleteRow,
  };
}

// State for a dashboard form. A record with an id is updated; one without is created.
export function useRecordForm({ path, record, onSaved }) {
  const [values, setValues] = useState(record);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage('');

    const { id, ...fields } = values;
    const url = id ? `${path}${id}/` : path;
    const method = id ? 'PATCH' : 'POST';

    try {
      const savedRecord = await apiRequest(url, { method, body: toFormData(fields) });
      onSaved(savedRecord);
    } catch (requestError) {
      setErrors(requestError.fieldErrors || {});
      setMessage(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return { values, setValue, errors, message, saving, submit };
}
