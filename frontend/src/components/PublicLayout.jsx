import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useFetch } from '../lib/hooks.js';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

const DEFAULT_COMPANY_NAME = 'Engineering Company';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { data, error: profileError } = useFetch('/api/company/profile/');

  const profile = data?.name ? data : null;
  const companyName = profile?.name || DEFAULT_COMPANY_NAME;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-caution focus:px-4 focus:py-2 focus:font-bold focus:text-graphite"
      >
        Skip to content
      </a>
      <Header companyName={companyName} />
      <main id="main-content" className="flex-1">
        <Outlet context={{ profile, profileError, companyName }} />
      </main>
      <Footer companyName={companyName} profile={profile} />
    </div>
  );
}
