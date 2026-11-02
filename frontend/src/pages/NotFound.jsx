import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/hooks.js';

export default function NotFound() {
  usePageMeta('Page not found');

  return (
    <section className="blueprint-grid flex min-h-[60vh] items-center justify-center px-5 py-20 text-center text-white">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-caution">404</p>
        <h1 className="mt-3 text-4xl font-black">We can't find that page</h1>
        <p className="mt-4 text-lg text-gray-100">The link may be old, or the page may have moved.</p>
        <Link to="/" className="mt-8 inline-block rounded-md bg-caution px-6 py-3 font-black text-graphite hover:bg-yellow-400">
          Go to the homepage
        </Link>
      </div>
    </section>
  );
}
