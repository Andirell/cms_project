import { Link } from 'react-router-dom';
import { ErrorMessage, LoadingMessage } from '../../components/States.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { formatDate } from '../../lib/format.js';
import { useFetch, usePageMeta } from '../../lib/hooks.js';

function StatCard({ label, value, detail, to }) {
  return (
    <Link to={to} className="block rounded-lg bg-white p-5 shadow-lift hover:ring-2 hover:ring-blueprint">
      <p className="text-3xl font-black text-graphite">{value}</p>
      <p className="mt-1 font-semibold text-gray-800">{label}</p>
      {detail ? <p className="mt-1 text-sm text-gray-600">{detail}</p> : null}
    </Link>
  );
}

export default function Overview() {
  usePageMeta('Dashboard');

  const { user } = useAuth();
  const { data: summary, loading, error } = useFetch('/api/dashboard/summary/', { useAuth: true });

  return (
    <div>
      <h1 className="text-3xl font-black text-graphite">Welcome, {user.username}</h1>
      <div className="mt-6">
        <ErrorMessage>{error}</ErrorMessage>
        {loading && !summary ? <LoadingMessage /> : null}
      </div>

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Projects"
              value={summary.projects.total}
              detail={`${summary.projects.ongoing} ongoing, ${summary.projects.drafts} unpublished`}
              to="/dashboard/projects"
            />
            <StatCard
              label="Blog posts"
              value={summary.posts.total}
              detail={`${summary.posts.drafts} drafts`}
              to="/dashboard/posts"
            />
            {summary.inquiries ? (
              <StatCard label="New inquiries" value={summary.inquiries.new} to="/dashboard/inquiries" />
            ) : null}
            {summary.testimonials ? (
              <StatCard
                label="Testimonials"
                value={summary.testimonials.total}
                detail={`${summary.testimonials.waiting_for_approval} waiting for approval`}
                to="/dashboard/testimonials"
              />
            ) : null}
          </div>

          {summary.inquiries ? (
            <section className="mt-8 rounded-lg bg-white p-6 shadow-lift">
              <h2 className="text-xl font-black text-graphite">Latest new inquiries</h2>
              {summary.inquiries.latest.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">No new inquiries right now.</p>
              ) : (
                <ul className="mt-3 divide-y divide-concrete">
                  {summary.inquiries.latest.map((inquiry) => (
                    <li key={inquiry.id} className="py-3 text-sm">
                      <p className="font-bold text-graphite">{inquiry.full_name}</p>
                      <p className="text-gray-600">
                        {inquiry.service_interest || 'General inquiry'}, {formatDate(inquiry.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
