import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Compass, Menu, X } from 'lucide-react';
import { homePathForUser, useAuth } from '../lib/auth.jsx';

const NAV_ITEMS = [
  ['Home', '/'],
  ['Services', '/services'],
  ['Projects', '/projects'],
  ['Team', '/team'],
  ['Blog', '/blog'],
  ['Contact', '/contact'],
];

function desktopLinkClass({ isActive }) {
  return linkClass(isActive, 'py-2');
}

// Phone links are taller so they are easy to tap.
function mobileLinkClass({ isActive }) {
  return linkClass(isActive, 'py-3');
}

function linkClass(isActive, paddingClass) {
  const base = `block rounded-md px-3 text-sm font-bold transition ${paddingClass}`;
  if (isActive) return `${base} bg-graphite text-white`;
  return `${base} text-steel hover:bg-concrete`;
}

export default function Header({ companyName }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  let accountLabel = 'Login';
  let accountPath = '/login';
  if (user) {
    accountPath = homePathForUser(user);
    accountLabel = user.can_edit_projects_and_blog ? 'Dashboard' : 'My account';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-concrete bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blueprint text-caution">
            <Compass size={22} aria-hidden="true" />
          </span>
          <span className="truncate text-base font-black text-graphite">{companyName}</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-md border border-concrete text-graphite lg:hidden"
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(([label, path]) => (
            <NavLink key={path} to={path} end={path === '/'} className={desktopLinkClass}>
              {label}
            </NavLink>
          ))}
          <Link to={accountPath} className="ml-2 rounded-md bg-caution px-4 py-2 text-sm font-black text-graphite hover:bg-yellow-400">
            {accountLabel}
          </Link>
        </nav>
      </div>

      {menuOpen ? (
        <nav id="mobile-navigation" aria-label="Mobile" className="border-t border-concrete px-4 py-3 lg:hidden">
          {NAV_ITEMS.map(([label, path]) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={closeMenu} className={mobileLinkClass}>
              {label}
            </NavLink>
          ))}
          <Link
            to={accountPath}
            onClick={closeMenu}
            className="mt-2 block rounded-md bg-caution px-3 py-3 text-center text-sm font-black text-graphite"
          >
            {accountLabel}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
