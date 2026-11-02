import { Link } from 'react-router-dom';
import ContactDetails from './ContactDetails.jsx';

export default function Footer({ companyName, profile }) {
  return (
    <footer className="bg-graphite px-5 py-14 text-white sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-black">{companyName}</p>
          {profile?.tagline ? <p className="mt-3 text-sm leading-6 text-gray-300">{profile.tagline}</p> : null}
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-bold uppercase tracking-wide text-caution">Explore</h2>
          <div className="mt-3 grid justify-items-start text-sm text-gray-300">
            <Link to="/services" className="inline-block py-1.5 hover:text-white">Services</Link>
            <Link to="/projects" className="inline-block py-1.5 hover:text-white">Projects</Link>
            <Link to="/team" className="inline-block py-1.5 hover:text-white">Team</Link>
            <Link to="/blog" className="inline-block py-1.5 hover:text-white">Blog</Link>
            <Link to="/contact" className="inline-block py-1.5 hover:text-white">Contact</Link>
          </div>
        </nav>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-caution">Contact</h2>
          <div className="mt-4 text-sm text-gray-300">
            <ContactDetails profile={profile} />
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-sm text-gray-300">
        Copyright {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </footer>
  );
}
