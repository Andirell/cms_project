import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FormField, inputClass } from '../components/FormField.jsx';
import { ErrorMessage, SuccessMessage } from '../components/States.jsx';
import { apiRequest } from '../lib/api.js';
import { homePathForUser, useAuth } from '../lib/auth.jsx';
import { usePageMeta } from '../lib/hooks.js';

const EMPTY_SIGNUP = { username: '', email: '', password: '', confirm_password: '' };

// Only follows paths inside this site, so a crafted link can't send people elsewhere after login.
function getSafeNextPath(next) {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return null;
}

export default function Login() {
  usePageMeta('Login', 'Log in to your account.');

  const { user, loginNotice, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [working, setWorking] = useState(false);

  const nextPath = getSafeNextPath(searchParams.get('next'));

  if (user) {
    return <Navigate to={nextPath || homePathForUser(user)} replace />;
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setErrorMessage('');
  }

  function showError(requestError) {
    setErrors(requestError.fieldErrors || {});
    setErrorMessage(requestError.message === 'invalid credentials' ? 'Wrong email or password.' : requestError.message);
  }

  async function submitLogin(event) {
    event.preventDefault();
    setWorking(true);
    setErrors({});
    setErrorMessage('');

    try {
      const loggedInUser = await login(loginForm.email, loginForm.password);
      navigate(nextPath || homePathForUser(loggedInUser), { replace: true });
    } catch (requestError) {
      showError(requestError);
    } finally {
      setWorking(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    setWorking(true);
    setErrors({});
    setErrorMessage('');

    try {
      await apiRequest('/api/users/signup/', { method: 'POST', body: signupForm, useAuth: false });
      await login(signupForm.email, signupForm.password);
      navigate('/account', { replace: true });
    } catch (requestError) {
      showError(requestError);
    } finally {
      setWorking(false);
    }
  }

  function tabClass(tabMode) {
    const base = 'rounded-md px-3 py-2.5 text-sm font-bold';
    if (mode === tabMode) return `${base} bg-graphite text-white`;
    return `${base} text-steel`;
  }

  return (
    <section className="blueprint-grid flex min-h-[70vh] items-center justify-center px-4 py-14">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lift sm:p-8">
        <h1 className="text-3xl font-black text-graphite">{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
        <div className="mt-4">
          <SuccessMessage>{loginNotice}</SuccessMessage>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-md bg-paper p-1">
          <button type="button" aria-pressed={mode === 'login'} onClick={() => changeMode('login')} className={tabClass('login')}>
            Log in
          </button>
          <button type="button" aria-pressed={mode === 'signup'} onClick={() => changeMode('signup')} className={tabClass('signup')}>
            Sign up
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="mt-6 grid gap-4">
            <FormField label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                required
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Password" error={errors.password}>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <ErrorMessage>{errorMessage}</ErrorMessage>
            <button type="submit" disabled={working} className="rounded-md bg-graphite px-5 py-3 font-bold text-white hover:bg-blueprint disabled:opacity-50">
              {working ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitSignup} className="mt-6 grid gap-4">
            <FormField label="Username" error={errors.username}>
              <input
                autoComplete="username"
                required
                value={signupForm.username}
                onChange={(event) => setSignupForm({ ...signupForm, username: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                required
                value={signupForm.email}
                onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Password" error={errors.password}>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={signupForm.password}
                onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <FormField label="Confirm password" error={errors.confirm_password}>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={signupForm.confirm_password}
                onChange={(event) => setSignupForm({ ...signupForm, confirm_password: event.target.value })}
                className={inputClass}
              />
            </FormField>
            <ErrorMessage>{errorMessage}</ErrorMessage>
            <button type="submit" disabled={working} className="rounded-md bg-graphite px-5 py-3 font-bold text-white hover:bg-blueprint disabled:opacity-50">
              {working ? 'Creating account...' : 'Create account'}
            </button>
            <p className="text-sm text-gray-600">New accounts are client accounts. An admin assigns staff roles.</p>
          </form>
        )}
      </div>
    </section>
  );
}
