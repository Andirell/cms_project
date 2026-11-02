import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ContentImage from '../components/ContentImage.jsx';
import PageHero from '../components/PageHero.jsx';
import { ErrorMessage, LoadingMessage } from '../components/States.jsx';
import { capitalize, formatProjectDates, splitParagraphs } from '../lib/format.js';
import { useFetch, usePageMeta } from '../lib/hooks.js';
import NotFound from './NotFound.jsx';

function Detail({ label, value }) {
  if (!value) return null;

  return (
    <div className="border-b border-concrete py-3 last:border-0">
      <dt className="text-sm font-semibold text-gray-600">{label}</dt>
      <dd className="mt-1 font-semibold text-graphite">{value}</dd>
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { companyName } = useOutletContext();
  const { data: project, loading, error, notFound } = useFetch(`/api/projects/by-slug/${slug}/`);

  usePageMeta(project ? `${project.title} | ${companyName}` : `Project | ${companyName}`, project?.scope);

  if (loading && !project) return <LoadingMessage />;
  if (notFound) return <NotFound />;
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow={`${capitalize(project.discipline)} project`} title={project.title} />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <ContentImage src={project.image} alt={project.title} className="aspect-[16/9] w-full rounded-lg" />
          <div className="mt-8 grid gap-4 leading-8 text-gray-800">
            {splitParagraphs(project.description).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <Link to="/projects" className="mt-8 inline-flex items-center gap-2 font-bold text-blueprint underline">
            <ArrowLeft size={17} aria-hidden="true" /> All projects
          </Link>
        </div>

        <aside className="self-start rounded-lg bg-white p-6 shadow-lift">
          <h2 className="text-lg font-black text-graphite">Project details</h2>
          <dl className="mt-2">
            <Detail label="Status" value={capitalize(project.status)} />
            <Detail label="Dates" value={formatProjectDates(project)} />
            <Detail label="Client" value={project.client} />
            <Detail label="Location" value={project.location} />
            <Detail label="Scope" value={project.scope} />
          </dl>
        </aside>
      </section>
    </>
  );
}
