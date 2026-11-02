const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const SESSION_KEY = 'cms-session';

let refreshInProgress = null;
let onSessionEnded = null;

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function backendUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// Images can come back as full URLs or as /media/ paths, depending on the endpoint.
export function assetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return backendUrl(url);
}

export function readSession() {
  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function setOnSessionEnded(callback) {
  onSessionEnded = callback;
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  // Server errors can be HTML pages, so this can't assume the body is JSON.
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildApiError(status, body) {
  if (status === 429) {
    return new ApiError('Too many attempts. Please wait a little and try again.', status);
  }
  if (status >= 500) {
    return new ApiError('The server had a problem. Please try again shortly.', status);
  }
  if (!body || typeof body !== 'object') {
    return new ApiError('The request failed. Please try again.', status);
  }
  if (typeof body.detail === 'string') {
    return new ApiError(body.detail, status);
  }
  if (typeof body.error === 'string') {
    return new ApiError(body.error, status);
  }

  const fieldErrors = {};
  for (const [field, value] of Object.entries(body)) {
    fieldErrors[field] = Array.isArray(value) ? value.join(' ') : String(value);
  }

  const message = fieldErrors.non_field_errors || 'Please check the highlighted fields.';
  return new ApiError(message, status, fieldErrors);
}

async function sendRequest(path, { method = 'GET', body, token }) {
  const headers = {};
  let requestBody;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // The browser sets the upload headers itself for FormData.
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    return await fetch(backendUrl(path), { method, headers, body: requestBody });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
}

async function requestNewTokens() {
  const session = readSession();
  if (!session?.refresh) return false;

  const response = await sendRequest('/api/token/refresh/', {
    method: 'POST',
    body: { refresh: session.refresh },
  });

  // The user may have logged out, or another tab may have renewed the token, while
  // this request was running. Either way the saved session must not be overwritten.
  const latestSession = readSession();
  const sessionChanged = latestSession?.refresh !== session.refresh;

  if (response.ok) {
    if (sessionChanged) return Boolean(latestSession);

    const tokens = await readResponseBody(response);
    saveSession({ ...latestSession, access: tokens.access, refresh: tokens.refresh });
    return true;
  }

  if (sessionChanged) return Boolean(latestSession);

  // Only a 401 means the token is dead. A busy or restarting server (429, 500, 502)
  // says nothing about the session, so the user stays logged in and can retry.
  if (response.status !== 401) {
    throw buildApiError(response.status, await readResponseBody(response));
  }

  return false;
}

// Each refresh token works only once. Pages load several things at the same time,
// so all of them have to wait for the same refresh instead of starting their own.
function refreshTokensOnce() {
  if (!refreshInProgress) {
    refreshInProgress = requestNewTokens().finally(() => {
      refreshInProgress = null;
    });
  }
  return refreshInProgress;
}

export async function apiRequest(path, { method = 'GET', body, useAuth = true } = {}) {
  let token = useAuth ? readSession()?.access : null;
  let response = await sendRequest(path, { method, body, token });

  if (response.status === 401 && token) {
    const refreshed = await refreshTokensOnce();

    if (refreshed) {
      token = readSession()?.access;
    } else {
      token = null;
      clearSession();
      if (onSessionEnded) onSessionEnded();
    }

    // Without a session, public pages can still load as a normal visitor.
    response = await sendRequest(path, { method, body, token });
  }

  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw buildApiError(response.status, responseBody);
  }

  return responseBody;
}

// Builds a query string and leaves out empty values.
export function withParams(path, params) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(name, value);
    }
  }

  const queryText = query.toString();
  return queryText ? `${path}?${queryText}` : path;
}

export function toFormData(values) {
  const formData = new FormData();

  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) continue;

    // A string in an image field is the current image's URL, so nothing has changed.
    if (name.endsWith('image') || name === 'photo' || name === 'logo') {
      if (typeof value === 'string' && value !== '') continue;
    }

    formData.append(name, value === null ? '' : value);
  }

  return formData;
}
