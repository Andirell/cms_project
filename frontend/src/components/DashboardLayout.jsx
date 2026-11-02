import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ExternalLink, Menu, X } from 'lucide-react';
import { backendUrl } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const LINKS = [
  { label: 'Overview', path: '/dashboard', permission: 'can_edit_projects_and_blog' },
  { label: 'Projects', path: '/dashboard/projects', permission: 'can_edit_projects_and_blog' },
  { label: 'Blog posts', path: '/dashboard/posts', permission: 'can_edit_projects_and_blog' },
  { label: 'Services', path: '/dashboard/services', permission: 'can_edit_company_content' },
  { label: 'Team', path: '/dashboard/team', permission: 'can_edit_company_content' },
  { label: 'Testimonials', path: '/dashboard/testimonials', permission: 'can_edit_company_content' },
  { label: 'Inquiries', path: '/dashboard/inquiries', permission: 'can_edit_company_content' },
  { label: 'Company profile', path: '/dashboard/company', permission: 'can_manage_users' },
  { label: 'Users', path: '/dashboard/users', permission: 'can_manage_users' },
];

function linkClass({ isActive }) {
  const base = 'block rounded-md px-3 py-2 text-sm font-semibold';
  if (isActive) return `${base} bg-caution text-graphite`;
  return `${base} text-gray-200 hover:bg-white/10`;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleLinks = [];
  for (const link of LINKS) {
    if (user[link.permission]) visibleLinks.push(link);
  }

  // Django admin only lets in accounts that have the staff flag.
  const canOpenDjangoAdmin = user.is_staff || user.is_superuser;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-paper font-sans lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-graphite text-white lg:min-h-screen">
        <div className="flex items-center justify-between px-5 py-4">
          <Link to="/" className="font-black">View website</Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close dashboard menu' : 'Open dashboard menu'}
            className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 lg:hidden"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} px-3 pb-5 lg:block`}>
          <nav aria-label="Dashboard" className="grid gap-1">
            {visibleLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/dashboard'}
                onClick={() => setMenuOpen(false)}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 px-3 pt-4 text-sm">
            <p className="truncate font-semibold">{user.username}</p>
            <p className="mt-1 capitalize text-gray-300">{user.role}</p>
            <div className="mt-3 grid gap-2">
              <Link to="/account" className="text-gray-200 underline">My account</Link>
              {canOpenDjangoAdmin ? (
                <a href={backendUrl('/admin/')} className="flex items-center gap-1 text-gray-200 underline">
                  Django admin <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
              <button type="button" onClick={handleLogout} className="py-1 text-left text-gray-200 underline">
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
