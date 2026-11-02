import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, clearSession, readSession, saveSession, setOnSessionEnded } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession()?.user || null);
  const [loginNotice, setLoginNotice] = useState('');

  useEffect(() => {
    setOnSessionEnded(() => setUser(null));

    // The saved copy may be out of date, for example if an admin changed this user's role.
    async function loadCurrentUser() {
      if (!readSession()) return;

      try {
        const currentUser = await apiRequest('/api/users/me/');
        rememberUser(currentUser);
      } catch {
        // Keep the saved user if the server can't be reached. An expired session is
        // already handled inside apiRequest.
      }
    }

    loadCurrentUser();
  }, []);

  function rememberUser(nextUser) {
    const session = readSession();
    if (session) {
      saveSession({ ...session, user: nextUser });
      setUser(nextUser);
    }
  }

  async function login(email, password) {
    const session = await apiRequest('/api/users/login/', {
      method: 'POST',
      body: { email, password },
      useAuth: false,
    });
    saveSession(session);
    setUser(session.user);
    setLoginNotice('');
    return session.user;
  }

  async function logout() {
    const session = readSession();
    clearSession();
    setUser(null);

    if (session?.refresh) {
      try {
        await apiRequest('/api/users/logout/', {
          method: 'POST',
          body: { refresh: session.refresh },
          useAuth: false,
        });
      } catch {
        // The user is already logged out on this device, and the token will expire by itself.
      }
    }
  }

  // After a password change the server has already revoked the tokens. The notice is
  // kept here because clearing the user sends them to the login page straight away.
  function endSessionLocally(notice) {
    clearSession();
    setLoginNotice(notice);
    setUser(null);
  }

  const value = { user, loginNotice, login, logout, rememberUser, endSessionLocally };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function homePathForUser(user) {
  return user.can_edit_projects_and_blog ? '/dashboard' : '/account';
}
